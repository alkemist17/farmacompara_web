# Despliegue a producción — seguridad, precios y SEO (octubre 2026)

Runbook para llevar a producción los cambios validados en dev el 2026-10-26.
Seguir los pasos en orden. Cada paso indica **dónde** se ejecuta.

| Máquina | Qué hay |
|---|---|
| **Servidor dev/staging** | `/drive/axonode/demos/farmacompara_web` (`dev/` = rama `develop`, `staging/` = rama `staging`) |
| **Servidor producción** | `axonode@100.70.234.5`, `/home/axonode/docker/web-MO` (rama `main`, BD de producción propia) |

---

## 1. Qué cambia

### 1.1 Seguridad (urgente)

| Paquete | Antes | Después | Motivo |
|---|---|---|---|
| `next` | 15.3.2 | **15.5.28** | RCE en React Server Components (< 15.3.6), RCE en el optimizador de imágenes (SVG/AVIF), bypass de middleware, envenenamiento de caché ISR, DoS |
| `next-auth` | 5.0.0-beta.31 | **5.0.0-beta.32** (`@auth/core` 0.41.3) | Comprobaciones de sesión que pueden "fallar abiertas", bypass del normalizador de email |
| `@auth/prisma-adapter` | 2.11.2 | 2.11.3 | Depende de `@auth/core` corregido |
| `nodemailer` | 7.0.13 | **8.0.11** | Inyección SMTP/cabeceras. Es la versión máxima compatible con Auth.js (peer `^7 \|\| ^8`); ver 7.2 |
| `eslint-config-next` | 15.3.2 | 15.5.28 | Alineado con `next` |

`npm audit --omit=dev`: **4 críticas → 0**. Las 14 altas restantes se analizan en 7.2.

Otros endurecimientos:
- `next.config.ts`: `Strict-Transport-Security: max-age=31536000`, CSP mínima
  (`frame-ancestors 'none'; base-uri 'self'; object-src 'none'`), sin cabecera `X-Powered-By`.
- `/api/contacto`: tipos y longitudes validados (nombre ≤ 100, correo ≤ 254,
  mensaje ≤ 5000), nombre sin saltos de línea, `replyTo` como objeto (sin
  interpolar el nombre dentro de la dirección).

### 1.2 Precios, catálogo y SEO de `/producto/[slug]`

- Una sola regla de vigencia de precios (7 días) para la tabla, la meta description,
  Open Graph y el JSON-LD. Ya no se anuncian precios vencidos ni `InStock` sin dato.
- Un producto puede tener varios EAN: precios e historial se juntan por producto.
- Títulos, H1 y presentaciones normalizados; JSON-LD con `gtin13` y `BreadcrumbList`.
- Enlaces a principio activo, laboratorio y otras presentaciones.
- **Caché ISR**: las fichas pasan de `private, no-store` a `s-maxage=3600`.
  Favorito y alerta se cargan en el navegador.
- **noindex** para fichas sin ningún precio registrado ni registro INVIMA, que además
  salen del sitemap (en dev: 7.852 de 23.491).
- Fichas fusionadas → redirección **308** a la canónica (tabla `producto_redirecciones`).

Detalle técnico: `informe-catalogo-precios-seo.txt` en el servidor dev/staging.

---

## 2. Antes de empezar

- [ ] Ventana de despliegue acordada. El contenedor de producción se reconstruye
      (un corte breve).
- [ ] Acceso SSH a `axonode@100.70.234.5` funcionando (`deploy-prod.sh` lo usa).
- [ ] Saber cómo se llama en producción el contenedor de PostgreSQL y qué usuario tiene
      (en este documento: `<PG_CONTAINER>` y `$POSTGRES_USER`).

---

## 3. Servidor dev/staging: commit y staging

```bash
cd /drive/axonode/demos/farmacompara_web/dev
git status                       # confirmar los archivos de la sección 1
npm test                         # dentro del contenedor dev: docker exec mediofertas_dev sh -c 'cd /app && npm test'
git add next.config.ts package.json package-lock.json src scripts/sql scripts/auditoria-catalogo.ts docs
git commit -m "seguridad: next 15.5.28, next-auth beta.32, nodemailer 8; precios/SEO de fichas; fusiones de productos"
cd .. && ./deploy.sh             # develop → staging y reconstruye mediofertas_staging
```

> No añadir `image 3.png`, `logs/` ni `scripts/run-snapshot.sh` (no forman parte de este cambio).

### 3.1 (Recomendado) Datos de staging

La BD `farmacompara_staging` tiene precios de junio: en staging todas las fichas saldrán
"sin precio vigente". Para validar con datos reales, sincronizarla antes desde dev.

### 3.2 Verificación en staging

Staging está detrás de Cloudflare Access; probar por la IP interna del contenedor:

```bash
IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' mediofertas_staging | awk '{print $1}')
F=/producto/gelpin-50mg-capsulas-blandas-caja-x-2
curl -s http://$IP:3000/api/health                                  # {"status":"ok"}
curl -sI http://$IP:3000$F | grep -iE 'cache-control|strict-transport|content-security|x-powered'
curl -sI http://$IP:3000$F | grep -i x-nextjs-cache                 # 2ª vez: HIT
curl -s  http://$IP:3000/api/auth/providers                         # JSON con "google"
curl -s -o /dev/null -w '%{http_code}\n' http://$IP:3000/producto/no-existe-xyz   # 404
docker logs --tail 50 mediofertas_staging                           # sin errores
```

Esperado: `Cache-Control: s-maxage=3600, stale-while-revalidate=82800`, HSTS y CSP
presentes, **sin** `X-Powered-By`.

Prueba manual en el navegador (staging, con Cloudflare Access):
- [ ] Login con correo/contraseña y con Google.
- [ ] Marcar y desmarcar favorito y crear una alerta en una ficha; recargar y comprobar que
      se mantienen (ahora se cargan en el cliente).
- [ ] `/perfil` con y sin sesión.
- [ ] Formulario de contacto: un envío real llega con Reply-To correcto.
- [ ] Registro y "olvidé mi contraseña": llega el correo (nodemailer 8).

---

## 4. Producción: despliegue del código

Desde el servidor dev/staging:

```bash
cd /drive/axonode/demos/farmacompara_web
./deploy-prod.sh        # verifica staging, merge staging → main y ejecuta el deploy remoto
```

El Dockerfile hace `npm ci` + `prisma generate` + `next build` con el `package-lock.json`
nuevo. No hace falta ningún paso manual de dependencias.

### 4.1 Verificación en producción (desde cualquier máquina)

```bash
F=https://mediofertas.co/producto/gelpin-50mg-capsulas-blandas-caja-x-2
curl -sI https://mediofertas.co/ | grep -iE 'strict-transport|content-security|x-powered'
curl -sI $F | grep -iE 'HTTP/|cache-control'
curl -s  $F | grep -o '"offers":{[^}]*}'          # sin "availability" salvo stock confirmado
curl -s  https://mediofertas.co/api/health
curl -s -o /dev/null -w '%{http_code}\n' https://mediofertas.co/producto/no-existe-xyz   # 404
```

- [ ] HSTS y CSP presentes; `x-powered-by` ausente.
- [ ] Ficha: `200` y `cache-control: s-maxage=3600…` (antes `private, no-store`).
- [ ] Login, favoritos, alertas y contacto como en 3.2.
- [ ] Revisar los logs del contenedor de producción los primeros 15 minutos.

---

## 5. Producción: base de datos (migración 030 y fusión de Gelpin)

> La web funciona sin este paso (sin la tabla, las redirecciones simplemente no se activan).
> Hacerlo cuando el paso 4 esté verificado. **La BD de producción es distinta de la de dev:
> los IDs pueden no coincidir.** No copiar IDs de dev.

Todo en el **servidor de producción**. Los scripts están en el repo, en
`scripts/sql/` (rama `main`). Si el directorio de producción no tiene el repo completo,
copiarlos desde el servidor dev:
`scp dev/scripts/sql/*.sql axonode@100.70.234.5:/tmp/`

### 5.1 Copia de seguridad (obligatoria)

```bash
docker exec <PG_CONTAINER> sh -c 'pg_dump -U "$POSTGRES_USER" -d <BD> -Fc \
  -t maestro_productos -t codigos_barras -t favoritos -t alertas_precio \
  -t product_trends -t producto_imagen -t maestro_productos_audit' > ~/backup_pre_fusion_$(date +%F).dump
ls -lh ~/backup_pre_fusion_*.dump
```

### 5.2 Migración 030 (aditiva)

Crea solo la tabla `producto_redirecciones`; no modifica datos.

```bash
docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD> -v ON_ERROR_STOP=1' \
  < scripts/sql/030_producto_redirecciones.sql
```

### 5.3 Identificar las fichas de Gelpin en producción

```bash
docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD>' <<'SQL'
SELECT mp.id, mp.slug, mp.excluido, mp.registro_invima, mp.concentracion, mp.presentacion,
       ARRAY_AGG(cb.ean) AS eans
FROM maestro_productos mp LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
WHERE mp.slug IN ('gelpin-50mg-capsulas-blandas-caja-x-2', 'gelpin-50-mg-caja-x-2-caps')
GROUP BY mp.id ORDER BY mp.id;
SQL
```

Comprobar **antes de seguir**:
- [ ] Existen las dos fichas y ninguna está excluida.
- [ ] Las dos tienen registro `2022M-0003937-R2`, 50 mg y presentación x2.
- [ ] EAN: `7703153015398` en `gelpin-50mg-capsulas-blandas-caja-x-2` (será la **canónica**,
      `destino`) y `7706127004190` en `gelpin-50-mg-caja-x-2-caps` (`origen`).

Si algo no coincide, **parar** y revisar: los datos de producción difieren de dev.

### 5.4 Ensayo (no cambia nada, termina en ROLLBACK)

Sustituir `<ID_ORIGEN>` (gelpin-50-mg-caja-x-2-caps) y `<ID_DESTINO>` (gelpin-50mg-capsulas-…)
por los IDs de 5.3:

```bash
docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD> -X \
  -v origen=<ID_ORIGEN> -v destino=<ID_DESTINO> -v usuario=alkemist17@gmail.com \
  -v motivo="Mismo producto: registro INVIMA 2022M-0003937-R2, 50 mg, cápsula blanda x2"' \
  < scripts/sql/fusionar_productos.sql
```

Revisar la salida:
- "Efectos previstos": EAN a mover, favoritos, alertas y trends (en dev: 1 EAN, el resto 0).
- "Resultado en la ficha destino": los dos EAN con sus precios.
- Termina en `== ENSAYO: ROLLBACK`.

### 5.5 Aplicar

El mismo comando añadiendo `-v confirmar=si`:

```bash
docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD> -X -v confirmar=si \
  -v origen=<ID_ORIGEN> -v destino=<ID_DESTINO> -v usuario=alkemist17@gmail.com \
  -v motivo="Mismo producto: registro INVIMA 2022M-0003937-R2, 50 mg, cápsula blanda x2"' \
  < scripts/sql/fusionar_productos.sql

docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD> -c \
  "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_precios_resumen;"'
```

### 5.6 Verificar

Las fichas tienen caché de hasta 1 hora: la de Gelpin puede seguir mostrando los precios
anteriores durante ese tiempo. Para verlo de inmediato, **recrear** el contenedor web de
producción (`docker compose up -d --force-recreate <servicio>`). Un `docker restart` puede no
bastar, porque Next guarda la caché ISR en el disco del contenedor. Lo mismo vale para la
redirección: si la URL retirada se visitó en la última hora, seguirá respondiendo 200 desde la
caché hasta que se regenere o se recree el contenedor.

```bash
curl -sI https://mediofertas.co/producto/gelpin-50-mg-caja-x-2-caps | grep -iE 'HTTP/|location'
#   HTTP/2 308  →  location: /producto/gelpin-50mg-capsulas-blandas-caja-x-2
curl -s https://mediofertas.co/producto/gelpin-50mg-capsulas-blandas-caja-x-2 | grep -o '"offerCount":[0-9]*'
curl -s https://mediofertas.co/sitemap/1.xml | grep -c 'gelpin-50-mg-caja-x-2-caps<'   # 0
```

- [ ] La URL retirada responde 308 a la canónica.
- [ ] La canónica muestra las cadenas de ambos EAN (en dev pasó de 3 a 5 con precio vigente).

### 5.7 Revertir la fusión (si hiciera falta)

```bash
docker exec -i <PG_CONTAINER> sh -c 'psql -U "$POSTGRES_USER" -d <BD> -X \
  -v slug=gelpin-50-mg-caja-x-2-caps -v usuario=alkemist17@gmail.com' \
  < scripts/sql/revertir_fusion.sql                    # ensayo
# … y lo mismo con -v confirmar=si para aplicar; después REFRESH MATERIALIZED VIEW (5.5).
```

---

## 6. Después del despliegue

- [ ] Search Console → reenviar `https://mediofertas.co/sitemap-index.xml`.
- [ ] Prueba de resultados enriquecidos (search.google.com/test/rich-results) en:
      la ficha de Gelpin (con ofertas), una ficha con precios vencidos y una sin precios.
- [ ] Seguimiento a 30 días: "Excluida por la etiqueta noindex", "Fragmentos de producto",
      "Rutas de navegación", tiempo de respuesta en estadísticas de rastreo.

---

## 7. Riesgos, reversión y pendientes

### 7.1 Reversión del código

- Revertir el commit en `develop`, y desplegar de nuevo con `deploy.sh` + `deploy-prod.sh`.
  No hay cambios de esquema obligatorios: la versión anterior funciona con la tabla
  `producto_redirecciones` creada (la ignora).
- Si se revierte el código **después** de fusionar: la ficha retirada queda excluida
  (404 en vez de 308) hasta revertir también la fusión (5.7).

### 7.2 Avisos de `npm audit` que quedan (ninguno crítico)

| Paquete | Por qué queda | Exposición |
|---|---|---|
| `nodemailer` 8.0.11 (`@auth/core`, `next-auth`, `@auth/prisma-adapter` por arrastre) | Auth.js solo admite `^7 \|\| ^8` | Baja: los mensajes se construyen en el servidor sin `raw` ni adjuntos; el formulario de contacto limita longitudes y pasa la dirección como objeto. Actualizar cuando Auth.js admita nodemailer ≥ 10 |
| `prisma` CLI → `@prisma/dev`, `hono`, `@hono/node-server`, `mysql2`, `valibot`, `deepmerge-ts`, `@prisma/config` | `@prisma/client` declara `prisma` como peer | Muy baja: herramienta de build/CLI; no se ejecuta al servir peticiones (las migraciones usan `scripts/migrate.js` con `pg`) |
| `postcss`, `sharp`, `nanoid`, `source-map-js`, `fast-uri` | Versiones fijadas por `next`/herramientas | Baja: `postcss` y `source-map-js` actúan en el build; `sharp` procesa solo imágenes de `/public` y dominios permitidos (`**.mediofertas.co`, `images.unsplash.com`) |

`npm audit fix` (sin `--force`) **no** se aplicó: empeora el resultado (18 → 23 avisos).

### 7.3 Pendientes recomendados (no incluidos)

1. **Puertos de PostgreSQL abiertos** en el servidor dev/staging: `farmacompara_app_db`
   (proyecto `farmacompara_radar`) en `0.0.0.0:5432` y `animefilm-db-1` en `0.0.0.0:5434`.
   Publicarlos en `127.0.0.1` o cerrarlos en el firewall. **Revisar también `docker ps` en
   el servidor de producción.**
2. **CSP completa** con *nonces* para scripts (requiere probar Umami y login con Google).
3. **Middleware de Auth.js**: emite `Set-Cookie` en todas las páginas y no protege ninguna ruta
   (`authorized()` devuelve `true`). Limitarlo a las rutas que lo necesiten permitiría cachear el
   HTML en Cloudflare; requiere probar la renovación de sesión.
4. **HSTS con `includeSubDomains`/`preload`**: solo cuando todos los subdominios sirvan HTTPS.
5. Fusionar los demás duplicados de confianza "alta" (162 grupos en dev) tras revisarlos uno a uno,
   con el mismo procedimiento de la sección 5.

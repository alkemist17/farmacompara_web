# FarmaCompara — Web

Comparador de precios de medicamentos entre cadenas farmacéuticas. Construido con **Next.js 15**, **Tailwind CSS** y **PostgreSQL 16**.

---

## Requisitos previos

- Node.js 20+
- PostgreSQL 16 corriendo (contenedor `farmacompara_db` en el puerto **5433**)
- Datos scrapeados disponibles (proyecto `farmacompara_scrapper`)

---

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos PostgreSQL 16
DATABASE_URL=postgresql://farma_user:farma_pass@localhost:5433/farmacompara

# Directorio de imágenes del scrapper
MEDIA_PRODUCTOS_DIR=/ruta/a/farmacompara_scrapper/media/productos

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FarmaCompara
```

> **Nota:** El archivo `.env.local` ya está excluido de git. Nunca lo subas al repositorio.

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en [http://localhost:3000](http://localhost:3000).

---

## Comandos disponibles

| Comando           | Descripción                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Servidor de desarrollo con hot-reload |
| `npm run build`   | Compilar para producción             |
| `npm run start`   | Iniciar el servidor de producción    |
| `npm run lint`    | Verificar calidad del código         |

---

## Acceso desde la red local

El servidor de desarrollo acepta conexiones desde `192.168.1.200`. Para acceder desde otro dispositivo en la red usa:

```bash
npm run dev -- --hostname 0.0.0.0
```

Y luego abre `http://<IP-de-tu-máquina>:3000` en el dispositivo remoto.

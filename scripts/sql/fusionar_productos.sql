-- Fusiona la ficha :origen dentro de :destino (mismo producto comercial, varios EAN).
-- Requiere la migración 030_producto_redirecciones.sql.
--
-- Por defecto es un ENSAYO: muestra los efectos y hace ROLLBACK.
-- Para aplicar, pasar -v confirmar=si.
--
--   psql -v origen=1367 -v destino=1301 -v usuario=correo@dominio \
--        -v motivo='Mismo registro INVIMA 2022M-0003937-R2, mismo empaque' \
--        -f scripts/sql/fusionar_productos.sql
--
-- Efectos sobre referencias a maestro_productos(:origen):
--   codigos_barras   → los EAN pasan a :destino (precios e historial los siguen, cuelgan del EAN)
--   favoritos        → se mueven; si el usuario ya tenía :destino, se elimina el de :origen
--   alertas_precio   → se mueven; si el usuario ya tenía alerta en :destino, se conserva la de :destino
--   product_trends   → se suman los clics por semana en :destino
--   producto_imagen  → se mueve solo si :destino no tiene imagen
--   maestro_productos(:origen) → excluido = true (no se borra; la ficha y su slug se conservan)
--   producto_redirecciones     → slug de :origen → :destino (la web responde 308 permanente)
-- El scraper (vincular_producto) respeta codigos_barras.producto_id existente, así que
-- los EAN movidos seguirán actualizando precios en :destino.

\set ON_ERROR_STOP on
\if :{?confirmar}
\else
  \set confirmar no
\endif
SELECT :'confirmar' = 'si' AS aplicar \gset

BEGIN;

-- Validaciones (psql no interpola variables dentro de bloques DO)
SELECT
  :origen <> :destino AS ok_distintas,
  EXISTS (SELECT 1 FROM maestro_productos WHERE id = :origen  AND excluido = false) AS ok_origen,
  EXISTS (SELECT 1 FROM maestro_productos WHERE id = :destino AND excluido = false) AS ok_destino,
  NOT EXISTS (SELECT 1 FROM producto_redirecciones WHERE producto_origen_id = :destino) AS ok_destino_no_fusionado
\gset
\if :ok_distintas
\else
  \echo 'ERROR: origen y destino son la misma ficha'
  \quit
\endif
\if :ok_origen
\else
  \echo 'ERROR: la ficha origen no existe o ya está excluida'
  \quit
\endif
\if :ok_destino
\else
  \echo 'ERROR: la ficha destino no existe o está excluida'
  \quit
\endif
\if :ok_destino_no_fusionado
\else
  \echo 'ERROR: la ficha destino fue fusionada en otra; usar la canónica'
  \quit
\endif

\echo '== Fichas'
SELECT id, slug, nombre, laboratorio, registro_invima, concentracion, presentacion
FROM maestro_productos WHERE id IN (:origen, :destino) ORDER BY id;

\echo '== Efectos previstos'
SELECT
  (SELECT COUNT(*) FROM codigos_barras  WHERE producto_id = :origen) AS eans_a_mover,
  (SELECT COUNT(*) FROM favoritos f WHERE f.producto_id = :origen) AS favoritos,
  (SELECT COUNT(*) FROM favoritos f WHERE f.producto_id = :origen
     AND EXISTS (SELECT 1 FROM favoritos d WHERE d.producto_id = :destino AND d.usuario_id = f.usuario_id)) AS favoritos_duplicados,
  (SELECT COUNT(*) FROM alertas_precio a WHERE a.producto_id = :origen) AS alertas,
  (SELECT COUNT(*) FROM alertas_precio a WHERE a.producto_id = :origen
     AND EXISTS (SELECT 1 FROM alertas_precio d WHERE d.producto_id = :destino AND d.usuario_id = a.usuario_id)) AS alertas_duplicadas,
  (SELECT COUNT(*) FROM product_trends WHERE producto_id = :origen) AS semanas_trends,
  (SELECT COUNT(*) FROM producto_imagen WHERE producto_id = :origen) AS imagen_origen,
  (SELECT COUNT(*) FROM producto_imagen WHERE producto_id = :destino) AS imagen_destino;

-- Snapshot para auditoría y reversión
CREATE TEMP TABLE _fusion AS
SELECT
  (SELECT slug FROM maestro_productos WHERE id = :origen) AS slug_origen,
  ARRAY(SELECT ean FROM codigos_barras WHERE producto_id = :origen ORDER BY ean) AS eans,
  ARRAY(SELECT f.id FROM favoritos f WHERE f.producto_id = :origen
          AND NOT EXISTS (SELECT 1 FROM favoritos d WHERE d.producto_id = :destino AND d.usuario_id = f.usuario_id)) AS favs,
  ARRAY(SELECT a.id FROM alertas_precio a WHERE a.producto_id = :origen
          AND NOT EXISTS (SELECT 1 FROM alertas_precio d WHERE d.producto_id = :destino AND d.usuario_id = a.usuario_id)) AS alertas,
  NOT EXISTS (SELECT 1 FROM producto_imagen WHERE producto_id = :destino)
    AND EXISTS (SELECT 1 FROM producto_imagen WHERE producto_id = :origen) AS mover_imagen,
  (SELECT to_jsonb(mp) FROM maestro_productos mp WHERE id = :origen) AS antes;

UPDATE codigos_barras SET producto_id = :destino WHERE producto_id = :origen;

UPDATE favoritos SET producto_id = :destino WHERE id IN (SELECT unnest(favs) FROM _fusion);
DELETE FROM favoritos WHERE producto_id = :origen;

UPDATE alertas_precio SET producto_id = :destino WHERE id IN (SELECT unnest(alertas) FROM _fusion);
DELETE FROM alertas_precio WHERE producto_id = :origen;

INSERT INTO product_trends (producto_id, semana, clics)
SELECT :destino, semana, clics FROM product_trends WHERE producto_id = :origen
ON CONFLICT (producto_id, semana) DO UPDATE SET clics = product_trends.clics + EXCLUDED.clics;
DELETE FROM product_trends WHERE producto_id = :origen;

UPDATE producto_imagen SET producto_id = :destino
WHERE producto_id = :origen AND (SELECT mover_imagen FROM _fusion);

UPDATE maestro_productos SET excluido = true, updated_at = now() WHERE id = :origen;

INSERT INTO producto_redirecciones
  (slug_origen, producto_origen_id, producto_destino_id, motivo,
   eans_movidos, favoritos_movidos, alertas_movidas, imagen_movida, creado_por)
SELECT slug_origen, :origen, :destino, :'motivo', eans, favs, alertas, mover_imagen, :'usuario'
FROM _fusion;

INSERT INTO maestro_productos_audit (producto_id, usuario_email, antes, despues)
SELECT :origen, :'usuario', antes,
       jsonb_build_object('excluido', true, 'fusionado_en', :destino, 'eans_movidos', eans)
FROM _fusion;

\echo '== Resultado en la ficha destino'
SELECT cb.ean, COUNT(p.fuente_id) AS precios
FROM codigos_barras cb LEFT JOIN precios_retail p ON p.ean = cb.ean
WHERE cb.producto_id = :destino GROUP BY cb.ean ORDER BY cb.ean;

\if :aplicar
  \echo '== Confirmado: COMMIT. Refrescar después: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_precios_resumen;'
  COMMIT;
\else
  \echo '== ENSAYO: ROLLBACK (usar -v confirmar=si para aplicar)'
  ROLLBACK;
\endif

-- Revierte una fusión hecha con fusionar_productos.sql a partir de lo registrado
-- en producto_redirecciones. Por defecto es un ENSAYO (ROLLBACK).
--
--   psql -v slug=gelpin-50-mg-caja-x-2-caps -v usuario=correo@dominio \
--        -f scripts/sql/revertir_fusion.sql            # ensayo
--   ... -v confirmar=si                                 # aplicar
--
-- Limitaciones: los clics de product_trends quedan sumados en el destino, y los
-- favoritos/alertas de :origen que se eliminaron por duplicado no se recrean
-- (el usuario los conserva en la ficha destino).

\set ON_ERROR_STOP on
\if :{?confirmar}
\else
  \set confirmar no
\endif
SELECT :'confirmar' = 'si' AS aplicar \gset

BEGIN;

CREATE TEMP TABLE _r AS SELECT * FROM producto_redirecciones WHERE slug_origen = :'slug';

SELECT EXISTS (SELECT 1 FROM _r) AS hay_fusion \gset
\if :hay_fusion
\else
  \echo 'ERROR: no hay fusión registrada para ese slug'
  \quit
\endif

UPDATE codigos_barras cb SET producto_id = r.producto_origen_id
FROM _r r WHERE cb.ean = ANY (r.eans_movidos);

UPDATE favoritos f SET producto_id = r.producto_origen_id
FROM _r r WHERE f.id = ANY (r.favoritos_movidos);

UPDATE alertas_precio a SET producto_id = r.producto_origen_id
FROM _r r WHERE a.id = ANY (r.alertas_movidas);

UPDATE producto_imagen pi SET producto_id = r.producto_origen_id
FROM _r r WHERE r.imagen_movida AND pi.producto_id = r.producto_destino_id;

UPDATE maestro_productos mp SET excluido = false, updated_at = now()
FROM _r r WHERE mp.id = r.producto_origen_id;

INSERT INTO maestro_productos_audit (producto_id, usuario_email, antes, despues)
SELECT producto_origen_id, :'usuario',
       jsonb_build_object('excluido', true, 'fusionado_en', producto_destino_id),
       jsonb_build_object('excluido', false, 'fusion_revertida', true)
FROM _r;

DELETE FROM producto_redirecciones WHERE slug_origen = :'slug';

\if :aplicar
  \echo '== Confirmado: COMMIT. Refrescar después: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_precios_resumen;'
  COMMIT;
\else
  \echo '== ENSAYO: ROLLBACK (usar -v confirmar=si para aplicar)'
  ROLLBACK;
\endif

-- =========================================================
-- FUENTES.TIPO + VISTAS RETAIL - MEDIOFERTAS
-- =========================================================
-- Contexto: a partir de ahora se van a scrapear fuentes mayoristas
-- ademas de las retail actuales, y esas fuentes van a tener filas
-- reales en precios/precios_historicos. MediOfertas (sitio publico +
-- dashboard interno) debe seguir mostrando SOLO informacion retail.
--
-- En vez de repetir "AND f.tipo = 'retail'" en cada una de las ~45
-- queries dispersas por la app, se centraliza la regla en la base de
-- datos con 3 vistas nuevas + la redefinicion de mv_precios_resumen.
-- La app apunta esas queries a las vistas _retail en vez de a las
-- tablas reales. El scraper sigue escribiendo en las tablas reales
-- sin cambios.
-- =========================================================

-- AlterTable
ALTER TABLE "fuentes" ADD COLUMN     "tipo" VARCHAR(20) NOT NULL DEFAULT 'retail';

-- =========================================================
-- PASO 1: Vistas filtradas por tipo de fuente
-- =========================================================

CREATE VIEW "fuentes_retail" AS
SELECT * FROM "fuentes" WHERE "tipo" = 'retail';

CREATE VIEW "precios_retail" AS
SELECT p.*
FROM "precios" p
JOIN "fuentes" f ON f.id = p.fuente_id
WHERE f."tipo" = 'retail';

CREATE VIEW "precios_historicos_retail" AS
SELECT ph.*
FROM "precios_historicos" ph
JOIN "fuentes" f ON f.id = ph.fuente_id
WHERE f."tipo" = 'retail';

-- =========================================================
-- PASO 2: Redefinir mv_precios_resumen para excluir mayoristas
-- =========================================================
-- Esta vista materializada centraliza precio_min/precio_max/
-- max_descuento por producto y la usan ofertas, categoria, comparar,
-- laboratorio y farmacia (via PRECIOS_JOIN en src/lib/query-helpers.ts).
-- No estaba versionada en este repo (creada directo en la base) -
-- esta migracion la trae a control de versiones por primera vez,
-- agregando el join/filtro por tipo de fuente. La consulta y el
-- indice unico son identicos a los que ya existian en produccion,
-- salvo el filtro nuevo.

DROP MATERIALIZED VIEW IF EXISTS "mv_precios_resumen";

CREATE MATERIALIZED VIEW "mv_precios_resumen" AS
SELECT
  cb.producto_id,
  MIN(COALESCE(p.precio_oferta, p.precio_costo)) AS precio_min,
  MAX(COALESCE(p.precio_oferta, p.precio_costo)) AS precio_max,
  MAX(
    CASE
      WHEN p.precio_oferta IS NOT NULL AND p.precio_costo > p.precio_oferta
        THEN ROUND((p.precio_costo - p.precio_oferta) / p.precio_costo * 100::numeric)::integer
      ELSE NULL::integer
    END
  ) AS max_descuento
FROM "precios" p
JOIN "codigos_barras" cb ON cb.ean::text = p.ean::text
JOIN "fuentes" f ON f.id = p.fuente_id
WHERE COALESCE(p.precio_oferta, p.precio_costo) IS NOT NULL
  AND cb.producto_id IS NOT NULL
  AND p.fecha_revision >= (NOW() - INTERVAL '7 days')
  AND f."tipo" = 'retail'
GROUP BY cb.producto_id;

CREATE UNIQUE INDEX "uix_mv_precios_producto" ON "mv_precios_resumen" ("producto_id");

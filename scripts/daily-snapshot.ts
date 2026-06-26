import { config as loadEnv } from "dotenv"
import { Pool } from "pg"

loadEnv({ path: "../.env.local" })
loadEnv({ path: ".env.local" })
loadEnv()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

type MetricRecord = {
  entity_type: string
  entity_id: number | null
  entity_name: string
  metric_code: string
  metric_value: number
}

// ─── Platform ────────────────────────────────────────────────────────────────

async function collectPlatformMetrics(): Promise<MetricRecord[]> {
  const { rows } = await pool.query<{
    total_products: string
    missing_images: string
    missing_categories: string
    missing_active_ingredient: string
    missing_descriptions: string
    comparable_products: string
    exclusive_products: string
    price_anomalies: string
  }>(`
    WITH
      totals AS (
        SELECT
          COUNT(*)                                                            AS total_products,
          COUNT(*) FILTER (WHERE subcategoria_id IS NULL)                    AS missing_categories,
          COUNT(*) FILTER (WHERE principio_activo IS NULL)                   AS missing_active_ingredient,
          COUNT(*) FILTER (WHERE indicaciones IS NULL)                       AS missing_descriptions
        FROM maestro_productos
        WHERE excluido = false
      ),
      missing_img AS (
        SELECT COUNT(*) AS v
        FROM maestro_productos mp
        LEFT JOIN producto_imagen pi ON pi.producto_id = mp.id
        WHERE mp.excluido = false AND pi.producto_id IS NULL
      ),
      product_fuente_count AS (
        SELECT cb.producto_id, COUNT(DISTINCT p.fuente_id) AS fc
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo'
        WHERE cb.producto_id IS NOT NULL
        GROUP BY cb.producto_id
      ),
      coverage AS (
        SELECT
          COUNT(*) FILTER (WHERE pfc.fc >= 2) AS comparable_products,
          COUNT(*) FILTER (WHERE pfc.fc = 1)  AS exclusive_products
        FROM maestro_productos mp
        LEFT JOIN product_fuente_count pfc ON pfc.producto_id = mp.id
        WHERE mp.excluido = false
      ),
      anomalies AS (
        SELECT COUNT(*) AS v
        FROM (
          SELECT cb.producto_id
          FROM precios p
          JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo'
          JOIN maestro_productos mp ON mp.id = cb.producto_id AND mp.excluido = false
          WHERE p.precio_oferta > 0
          GROUP BY cb.producto_id
          HAVING COUNT(DISTINCT p.fuente_id) >= 2
            AND MAX(p.precio_oferta) / NULLIF(MIN(p.precio_oferta), 0) > 2.5
        ) sq
      )
    SELECT
      t.total_products,
      t.missing_categories,
      t.missing_active_ingredient,
      t.missing_descriptions,
      mi.v   AS missing_images,
      c.comparable_products,
      c.exclusive_products,
      a.v    AS price_anomalies
    FROM totals t
    CROSS JOIN missing_img mi
    CROSS JOIN coverage c
    CROSS JOIN anomalies a
  `)

  const r = rows[0]
  const total = Number(r.total_products)
  const comparable = Number(r.comparable_products)
  const missingImages = Number(r.missing_images)
  const missingCats = Number(r.missing_categories)
  const missingPA = Number(r.missing_active_ingredient)

  const completeness = total > 0 ? 1 - (missingImages + missingCats + missingPA) / (3 * total) : 0
  const coverage = total > 0 ? comparable / total : 0
  const healthScore = Math.max(0, Math.min(100, (completeness * 0.4 + coverage * 0.6) * 100))

  return [
    metric("platform", null, "GLOBAL", "total_products",           total),
    metric("platform", null, "GLOBAL", "comparable_products",      comparable),
    metric("platform", null, "GLOBAL", "exclusive_products",       Number(r.exclusive_products)),
    metric("platform", null, "GLOBAL", "missing_images",           missingImages),
    metric("platform", null, "GLOBAL", "missing_categories",       missingCats),
    metric("platform", null, "GLOBAL", "missing_active_ingredient", missingPA),
    metric("platform", null, "GLOBAL", "missing_descriptions",     Number(r.missing_descriptions)),
    metric("platform", null, "GLOBAL", "price_anomalies",          Number(r.price_anomalies)),
    metric("platform", null, "GLOBAL", "health_score",             round2(healthScore)),
  ]
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────

async function collectPharmacyMetrics(): Promise<MetricRecord[]> {
  const { rows } = await pool.query<{
    fuente_id: number
    fuente_nombre: string
    total_products: string
    comparable_products: string
    exclusive_products: string
    updated_today: string
    average_price: string
    missing_images: string
    missing_descriptions: string
  }>(`
    WITH
      product_fuentes AS (
        SELECT mp.id AS producto_id, p.fuente_id
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo'
        JOIN maestro_productos mp ON mp.id = cb.producto_id AND mp.excluido = false
        GROUP BY mp.id, p.fuente_id
      ),
      product_fuente_count AS (
        SELECT producto_id, COUNT(*) AS fc
        FROM product_fuentes
        GROUP BY producto_id
      ),
      pharmacy_coverage AS (
        SELECT
          pf.fuente_id,
          COUNT(DISTINCT pf.producto_id)                                           AS total_products,
          COUNT(DISTINCT CASE WHEN pfc.fc >= 2 THEN pf.producto_id END)            AS comparable_products,
          COUNT(DISTINCT CASE WHEN pfc.fc = 1  THEN pf.producto_id END)            AS exclusive_products
        FROM product_fuentes pf
        JOIN product_fuente_count pfc ON pfc.producto_id = pf.producto_id
        GROUP BY pf.fuente_id
      ),
      pharmacy_updated AS (
        SELECT fuente_id, COUNT(DISTINCT ean) AS updated_today
        FROM precios
        WHERE fecha_revision >= CURRENT_DATE
        GROUP BY fuente_id
      ),
      pharmacy_avg_price AS (
        SELECT fuente_id, ROUND(AVG(COALESCE(precio_oferta, precio_costo))::numeric, 2) AS average_price
        FROM precios
        WHERE COALESCE(precio_oferta, precio_costo) > 0
        GROUP BY fuente_id
      ),
      pharmacy_missing_img AS (
        SELECT p.fuente_id, COUNT(DISTINCT cb.producto_id) AS missing_images
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo' AND cb.producto_id IS NOT NULL
        JOIN maestro_productos mp ON mp.id = cb.producto_id AND mp.excluido = false
        LEFT JOIN producto_imagen pi ON pi.producto_id = cb.producto_id
        WHERE pi.producto_id IS NULL
        GROUP BY p.fuente_id
      ),
      pharmacy_missing_desc AS (
        SELECT p.fuente_id, COUNT(DISTINCT cb.producto_id) AS missing_descriptions
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo' AND cb.producto_id IS NOT NULL
        JOIN maestro_productos mp ON mp.id = cb.producto_id AND mp.excluido = false AND mp.indicaciones IS NULL
        GROUP BY p.fuente_id
      )
    SELECT
      f.id                                        AS fuente_id,
      f.nombre                                    AS fuente_nombre,
      COALESCE(pc.total_products,       0)        AS total_products,
      COALESCE(pc.comparable_products,  0)        AS comparable_products,
      COALESCE(pc.exclusive_products,   0)        AS exclusive_products,
      COALESCE(pu.updated_today,        0)        AS updated_today,
      COALESCE(pap.average_price,       0)        AS average_price,
      COALESCE(pmi.missing_images,      0)        AS missing_images,
      COALESCE(pmd.missing_descriptions,0)        AS missing_descriptions
    FROM fuentes f
    LEFT JOIN pharmacy_coverage   pc  ON pc.fuente_id  = f.id
    LEFT JOIN pharmacy_updated    pu  ON pu.fuente_id  = f.id
    LEFT JOIN pharmacy_avg_price  pap ON pap.fuente_id = f.id
    LEFT JOIN pharmacy_missing_img pmi ON pmi.fuente_id = f.id
    LEFT JOIN pharmacy_missing_desc pmd ON pmd.fuente_id = f.id
    ORDER BY f.id
  `)

  return rows.flatMap((r) => {
    const total = Number(r.total_products)
    const comparable = Number(r.comparable_products)
    const missingImg = Number(r.missing_images)
    const coveragePct = total > 0 ? (comparable / total) * 100 : 0
    const qualityPct = total > 0 ? (1 - missingImg / total) * 100 : 100
    const healthScore = Math.max(0, Math.min(100, coveragePct * 0.6 + qualityPct * 0.4))

    return [
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "total_products",       total),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "comparable_products",  comparable),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "exclusive_products",   Number(r.exclusive_products)),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "updated_today",        Number(r.updated_today)),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "average_price",        Number(r.average_price)),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "coverage_percentage",  round2(coveragePct)),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "missing_images",       missingImg),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "missing_descriptions", Number(r.missing_descriptions)),
      metric("pharmacy", r.fuente_id, r.fuente_nombre, "health_score",         round2(healthScore)),
    ]
  })
}

// ─── Category ─────────────────────────────────────────────────────────────────

async function collectCategoryMetrics(): Promise<MetricRecord[]> {
  const { rows } = await pool.query<{
    cat_id: number
    cat_nombre: string
    total_products: string
    comparable_products: string
    average_price: string
  }>(`
    WITH
      product_fuente_count AS (
        SELECT cb.producto_id, COUNT(DISTINCT p.fuente_id) AS fc
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo'
        WHERE cb.producto_id IS NOT NULL
        GROUP BY cb.producto_id
      ),
      cat_stats AS (
        SELECT
          c.id                                                                    AS cat_id,
          c.nombre                                                                AS cat_nombre,
          COUNT(DISTINCT mp.id)                                                   AS total_products,
          COUNT(DISTINCT CASE WHEN pfc.fc >= 2 THEN mp.id END)                   AS comparable_products
        FROM categorias c
        JOIN subcategorias sc ON sc.categoria_id = c.id
        JOIN maestro_productos mp ON mp.subcategoria_id = sc.id AND mp.excluido = false
        LEFT JOIN product_fuente_count pfc ON pfc.producto_id = mp.id
        GROUP BY c.id, c.nombre
      ),
      cat_avg_price AS (
        SELECT c.id AS cat_id, ROUND(AVG(COALESCE(p.precio_oferta, p.precio_costo))::numeric, 2) AS average_price
        FROM categorias c
        JOIN subcategorias sc ON sc.categoria_id = c.id
        JOIN maestro_productos mp ON mp.subcategoria_id = sc.id AND mp.excluido = false
        JOIN codigos_barras cb ON cb.producto_id = mp.id AND cb.estado = 'activo'
        JOIN precios p ON p.ean = cb.ean AND COALESCE(p.precio_oferta, p.precio_costo) > 0
        GROUP BY c.id
      )
    SELECT
      cs.cat_id,
      cs.cat_nombre,
      cs.total_products,
      cs.comparable_products,
      COALESCE(cap.average_price, 0) AS average_price
    FROM cat_stats cs
    LEFT JOIN cat_avg_price cap ON cap.cat_id = cs.cat_id
    ORDER BY cs.cat_id
  `)

  return rows.flatMap((r) => {
    const total = Number(r.total_products)
    const comparable = Number(r.comparable_products)
    const coveragePct = total > 0 ? (comparable / total) * 100 : 0

    return [
      metric("category", r.cat_id, r.cat_nombre, "total_products",      total),
      metric("category", r.cat_id, r.cat_nombre, "comparable_products", comparable),
      metric("category", r.cat_id, r.cat_nombre, "average_price",       Number(r.average_price)),
      metric("category", r.cat_id, r.cat_nombre, "coverage_percentage", round2(coveragePct)),
      metric("category", r.cat_id, r.cat_nombre, "health_score",        round2(coveragePct)),
    ]
  })
}

// ─── Laboratory ───────────────────────────────────────────────────────────────

async function collectLaboratoryMetrics(): Promise<MetricRecord[]> {
  const { rows } = await pool.query<{
    laboratorio: string
    total_products: string
    comparable_products: string
    average_price: string
  }>(`
    WITH
      product_fuente_count AS (
        SELECT cb.producto_id, COUNT(DISTINCT p.fuente_id) AS fc
        FROM precios p
        JOIN codigos_barras cb ON cb.ean = p.ean AND cb.estado = 'activo'
        WHERE cb.producto_id IS NOT NULL
        GROUP BY cb.producto_id
      ),
      lab_stats AS (
        SELECT
          mp.laboratorio,
          COUNT(DISTINCT mp.id)                                                   AS total_products,
          COUNT(DISTINCT CASE WHEN pfc.fc >= 2 THEN mp.id END)                   AS comparable_products
        FROM maestro_productos mp
        LEFT JOIN product_fuente_count pfc ON pfc.producto_id = mp.id
        WHERE mp.excluido = false AND mp.laboratorio IS NOT NULL
        GROUP BY mp.laboratorio
      ),
      lab_avg_price AS (
        SELECT
          mp.laboratorio,
          ROUND(AVG(COALESCE(p.precio_oferta, p.precio_costo))::numeric, 2) AS average_price
        FROM maestro_productos mp
        JOIN codigos_barras cb ON cb.producto_id = mp.id AND cb.estado = 'activo'
        JOIN precios p ON p.ean = cb.ean AND COALESCE(p.precio_oferta, p.precio_costo) > 0
        WHERE mp.excluido = false AND mp.laboratorio IS NOT NULL
        GROUP BY mp.laboratorio
      )
    SELECT
      ls.laboratorio,
      ls.total_products,
      ls.comparable_products,
      COALESCE(lap.average_price, 0) AS average_price
    FROM lab_stats ls
    LEFT JOIN lab_avg_price lap ON lap.laboratorio = ls.laboratorio
    ORDER BY ls.laboratorio
  `)

  return rows.flatMap((r) => {
    const total = Number(r.total_products)
    const comparable = Number(r.comparable_products)
    const coveragePct = total > 0 ? (comparable / total) * 100 : 0

    return [
      metric("laboratory", null, r.laboratorio, "total_products",      total),
      metric("laboratory", null, r.laboratorio, "comparable_products", comparable),
      metric("laboratory", null, r.laboratorio, "average_price",       Number(r.average_price)),
      metric("laboratory", null, r.laboratorio, "coverage_percentage", round2(coveragePct)),
      metric("laboratory", null, r.laboratorio, "health_score",        round2(coveragePct)),
    ]
  })
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

async function upsertMetrics(date: Date, records: MetricRecord[]): Promise<number> {
  if (records.length === 0) return 0

  const { rowCount } = await pool.query(
    `INSERT INTO daily_metrics
       (snapshot_date, entity_type, entity_id, entity_name, metric_code, metric_value)
     SELECT $1::date, u.et, u.eid, u.en, u.mc, u.mv
     FROM UNNEST(
       $2::varchar[],
       $3::int[],
       $4::varchar[],
       $5::varchar[],
       $6::numeric[]
     ) AS u(et, eid, en, mc, mv)
     ON CONFLICT (snapshot_date, entity_type, entity_name, metric_code)
     DO UPDATE SET metric_value = EXCLUDED.metric_value, created_at = NOW()`,
    [
      date,
      records.map((r) => r.entity_type),
      records.map((r) => r.entity_id),
      records.map((r) => r.entity_name),
      records.map((r) => r.metric_code),
      records.map((r) => r.metric_value),
    ],
  )

  return rowCount ?? 0
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function metric(
  entityType: string,
  entityId: number | null,
  entityName: string,
  metricCode: string,
  metricValue: number,
): MetricRecord {
  return { entity_type: entityType, entity_id: entityId, entity_name: entityName, metric_code: metricCode, metric_value: metricValue }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const snapshotDate = new Date()
  snapshotDate.setHours(0, 0, 0, 0)
  const dateStr = snapshotDate.toISOString().split("T")[0]

  console.log(`[${new Date().toISOString()}] Iniciando snapshot diario: ${dateStr}`)

  const [platform, pharmacy, category, laboratory] = await Promise.all([
    collectPlatformMetrics(),
    collectPharmacyMetrics(),
    collectCategoryMetrics(),
    collectLaboratoryMetrics(),
  ])

  const totals = { platform: platform.length, pharmacy: pharmacy.length, category: category.length, laboratory: laboratory.length }
  const allMetrics = [...platform, ...pharmacy, ...category, ...laboratory]

  const upserted = await upsertMetrics(snapshotDate, allMetrics)

  console.log(`[${new Date().toISOString()}] Snapshot completado: ${upserted} métricas guardadas`)
  console.log(`  platform: ${totals.platform} | pharmacy: ${totals.pharmacy} | category: ${totals.category} | laboratory: ${totals.laboratory}`)

  await pool.end()
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err)
  process.exit(1)
})

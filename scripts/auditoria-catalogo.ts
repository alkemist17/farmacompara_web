// Auditoría de catálogo de SOLO LECTURA (transacción READ ONLY).
// Genera en el directorio indicado:
//   duplicados.csv  — candidatos a producto duplicado (no fusiona nada)
//   calidad.csv     — anomalías de datos por ficha
//   resumen.md      — conteos para revisión
//
// Uso: npx tsx scripts/auditoria-catalogo.ts [directorio_salida]
import { config as loadEnv } from "dotenv"
import { Pool } from "pg"
import { mkdirSync, writeFileSync } from "fs"
import path from "path"
import { detectarCandidatos, type FichaCatalogo } from "../src/lib/catalogo-duplicados"
import { principioActivoPublico, tieneTildesPerdidas } from "../src/lib/producto-texto"
import { esGtin13Valido, esIndexable } from "../src/lib/producto-seo"
import { VIGENCIA_DIAS } from "../src/lib/precios-reglas"

loadEnv({ path: "../.env.local" })
loadEnv({ path: ".env.local" })
loadEnv()

const SITE = "https://mediofertas.co"

interface FilaFicha extends FichaCatalogo {
  total_precios: number
  tiene_imagen_bd: boolean
}

const SQL_FICHAS = `
  SELECT
    mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.registro_invima, mp.principio_activo,
    mp.concentracion, mp.forma_farmaceutica, mp.presentacion, mp.codigo_atc,
    COALESCE(ARRAY_AGG(DISTINCT cb.ean) FILTER (WHERE cb.ean IS NOT NULL), '{}') AS eans,
    COUNT(DISTINCT p.fuente_id) FILTER (
      WHERE p.fecha_revision >= NOW() - ($1 || ' days')::interval
        AND COALESCE(p.precio_oferta, p.precio_costo) IS NOT NULL
    )::int AS ofertas_vigentes,
    COALESCE(ARRAY_AGG(DISTINCT f.nombre) FILTER (
      WHERE p.fecha_revision >= NOW() - ($1 || ' days')::interval
    ), '{}') AS cadenas,
    COUNT(p.ean)::int AS total_precios,
    EXISTS (SELECT 1 FROM producto_imagen pi WHERE pi.producto_id = mp.id) AS tiene_imagen_bd
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  LEFT JOIN precios_retail p  ON p.ean = cb.ean
  LEFT JOIN fuentes_retail f  ON f.id = p.fuente_id
  WHERE mp.excluido = false
  GROUP BY mp.id
  ORDER BY mp.id
`

function csv(filas: (string | number | null | undefined)[][]): string {
  return filas
    .map((fila) => fila.map((v) => {
      const s = v == null ? "" : String(v)
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(","))
    .join("\n") + "\n"
}

async function main() {
  const salida = path.resolve(process.argv[2] ?? "reportes/auditoria-catalogo")
  mkdirSync(salida, { recursive: true })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  let fichas: FilaFicha[]
  try {
    await client.query("BEGIN READ ONLY")
    fichas = (await client.query<FilaFicha>(SQL_FICHAS, [String(VIGENCIA_DIAS)])).rows
    await client.query("ROLLBACK")
  } finally {
    client.release()
    await pool.end()
  }

  // ── Duplicados ──────────────────────────────────────────────────────────────
  const grupos = detectarCandidatos(fichas)
  const filasDup: (string | number | null)[][] = [[
    "grupo", "confianza", "id", "slug", "url", "nombre", "laboratorio", "eans", "registro_invima",
    "principio_activo", "concentracion", "presentacion", "ofertas_vigentes", "cadenas",
    "contradicciones", "campos_incompletos",
  ]]
  grupos.forEach((g, i) => {
    for (const f of g.fichas) {
      filasDup.push([
        i + 1, g.confianza, f.id, f.slug, `${SITE}/producto/${f.slug}`, f.nombre, f.laboratorio,
        f.eans.join(" "), f.registro_invima, f.principio_activo, f.concentracion, f.presentacion,
        f.ofertas_vigentes, f.cadenas.join(" | "), g.contradicciones.join("; "), g.camposIncompletos.join("; "),
      ])
    }
  })
  writeFileSync(path.join(salida, "duplicados.csv"), csv(filasDup))

  // ── Calidad de datos ───────────────────────────────────────────────────────
  const filasCal: (string | number | null)[][] = [["id", "slug", "anomalia", "campo", "valor"]]
  const conteo: Record<string, number> = {}
  const anotar = (f: FilaFicha, anomalia: string, campo: string, valor: string | null) => {
    conteo[anomalia] = (conteo[anomalia] ?? 0) + 1
    filasCal.push([f.id, f.slug, anomalia, campo, valor])
  }

  for (const f of fichas) {
    for (const campo of ["nombre", "presentacion", "forma_farmaceutica", "principio_activo"] as const) {
      const v = f[campo]
      if (v && tieneTildesPerdidas(v)) anotar(f, "tilde perdida en la carga", campo, v)
    }
    if (f.principio_activo && principioActivoPublico(f.principio_activo)?.toLowerCase() !== f.principio_activo.trim().toLowerCase()
        && /\d|EQUIVALENTE/i.test(f.principio_activo)) {
      anotar(f, "principio activo con texto técnico", "principio_activo", f.principio_activo)
    }
    if (/\d(mg|ml|mcg)\b/i.test(f.nombre)) anotar(f, "unidad pegada a la cifra en el nombre", "nombre", f.nombre)
    if (!f.principio_activo) anotar(f, "sin principio activo", "principio_activo", null)
    if (!f.forma_farmaceutica) anotar(f, "sin forma farmacéutica", "forma_farmaceutica", null)
    if (!f.presentacion) anotar(f, "sin presentación", "presentacion", null)
    if (!f.laboratorio) anotar(f, "sin laboratorio", "laboratorio", null)
    if (f.eans.length === 0) anotar(f, "sin EAN", "eans", null)
    for (const e of f.eans) {
      if (!/^\d+$/.test(e)) anotar(f, "EAN interno no numérico", "ean", e)
      else if (e.length === 13 && !esGtin13Valido(e)) anotar(f, "EAN-13 con dígito de control inválido", "ean", e)
    }
    if (f.total_precios === 0) anotar(f, "sin precios registrados", "precios", null)
    else if (f.ofertas_vigentes === 0) anotar(f, `sin precios en los últimos ${VIGENCIA_DIAS} días`, "precios", null)
    if (!esIndexable({ totalPrecios: f.total_precios, registroInvima: f.registro_invima })) {
      anotar(f, "noindex (sin precios ni registro INVIMA)", "indexacion", null)
    }
  }
  writeFileSync(path.join(salida, "calidad.csv"), csv(filasCal))

  // ── Resumen ────────────────────────────────────────────────────────────────
  const porConfianza = { alta: 0, media: 0, revisar: 0 }
  for (const g of grupos) porConfianza[g.confianza]++
  const fichasEnGrupos = grupos.reduce((n, g) => n + g.fichas.length, 0)

  const md = [
    `# Auditoría de catálogo — ${new Date().toISOString().slice(0, 10)}`,
    "",
    `Fichas activas analizadas: ${fichas.length}`,
    "",
    "## Candidatos a duplicado (mismo registro INVIMA + concentración + cantidad)",
    "",
    `| Confianza | Grupos |`,
    `|---|---|`,
    `| alta (sin contradicciones ni campos vacíos) | ${porConfianza.alta} |`,
    `| media (sin contradicciones, faltan datos) | ${porConfianza.media} |`,
    `| revisar (forma, principio, ATC o laboratorio no coinciden) | ${porConfianza.revisar} |`,
    `| **Total** | **${grupos.length}** (${fichasEnGrupos} fichas) |`,
    "",
    "Ningún grupo se fusiona automáticamente. Ver duplicados.csv.",
    "",
    "## Calidad de datos",
    "",
    "| Anomalía | Fichas |",
    "|---|---|",
    ...Object.entries(conteo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
    "",
  ].join("\n")
  writeFileSync(path.join(salida, "resumen.md"), md)
  console.log(md)
  console.log(`Archivos en ${salida}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

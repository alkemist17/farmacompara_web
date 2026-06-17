import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Package, Store } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import { unslugifySearch } from "@/lib/search";
import { PRECIOS_JOIN, DESCUENTOS_JOIN, TRENDS_JOIN, getOrderClause } from "@/lib/query-helpers";
import CompararSidebar from "@/components/CompararSidebar";
import FilterToolbar from "@/components/FilterToolbar";

const SITE = "https://mediofertas.co";
export const revalidate = 21600;

type SPVal = string | string[] | undefined;
function asArray(v: SPVal): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function asNum(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  return isNaN(n) ? fallback : n;
}

interface ProductoRow {
  id: number; slug: string | null; nombre: string;
  laboratorio: string | null; concentracion: string | null;
  forma_farmaceutica: string | null; imagen_url: string | null;
  precio_min: number | null; precio_max: number | null;
  max_descuento: number | null; total_clics: number | null;
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string; pa?: SPVal; lab?: SPVal; condicion?: SPVal;
    precioMin?: string; precioMax?: string; limit?: string; orden?: string;
  }>;
}

const getFuenteNombre = cache(async function getFuenteNombre(slug: string): Promise<string | null> {
  const term = unslugifySearch(slug);
  const rows = await prisma.$queryRawUnsafe<{ nombre: string }[]>(
    `SELECT nombre FROM fuentes WHERE unaccent(lower(nombre)) = unaccent(lower($1)) LIMIT 1`,
    term
  );
  if (rows[0]) return rows[0].nombre;
  const rows2 = await prisma.$queryRawUnsafe<{ nombre: string }[]>(
    `SELECT nombre FROM fuentes WHERE unaccent(nombre) ILIKE unaccent($1) LIMIT 1`,
    `%${term}%`
  );
  return rows2[0]?.nombre ?? null;
});

async function fetchFilterOptions(fuente: string) {
  const [paRows, labRows, priceRows] = await Promise.all([
    prisma.$queryRawUnsafe<{ principio_activo: string }[]>(
      `SELECT DISTINCT mp.principio_activo
       FROM maestro_productos mp
       JOIN codigos_barras cb ON cb.producto_id = mp.id
       JOIN precios p ON p.ean = cb.ean
       JOIN fuentes f ON f.id = p.fuente_id AND unaccent(f.nombre) ILIKE unaccent($1)
       WHERE mp.principio_activo IS NOT NULL AND mp.principio_activo <> ''
       ORDER BY mp.principio_activo LIMIT 60`,
      `%${fuente}%`
    ),
    prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
      `SELECT DISTINCT mp.laboratorio
       FROM maestro_productos mp
       JOIN codigos_barras cb ON cb.producto_id = mp.id
       JOIN precios p ON p.ean = cb.ean
       JOIN fuentes f ON f.id = p.fuente_id AND unaccent(f.nombre) ILIKE unaccent($1)
       WHERE mp.laboratorio IS NOT NULL AND mp.laboratorio <> ''
       ORDER BY mp.laboratorio LIMIT 60`,
      `%${fuente}%`
    ),
    prisma.$queryRawUnsafe<{ min_price: number; max_price: number }[]>(
      `SELECT
         COALESCE(MIN(COALESCE(p.precio_oferta, p.precio_costo)), 0)::int AS min_price,
         COALESCE(MAX(COALESCE(p.precio_oferta, p.precio_costo)), 500000)::int AS max_price
       FROM precios p
       JOIN fuentes f ON f.id = p.fuente_id AND unaccent(f.nombre) ILIKE unaccent($1)`,
      `%${fuente}%`
    ),
  ]);
  return {
    pa:              paRows.map((r) => r.principio_activo),
    lab:             labRows.map((r) => r.laboratorio),
    globalPrecioMin: priceRows[0]?.min_price ?? 0,
    globalPrecioMax: priceRows[0]?.max_price ?? 500_000,
  };
}

async function getProductosFarmacia(
  fuente: string, page: number,
  filters: { pa: string[]; lab: string[]; condicion: string[] },
  precioMin: number | null, precioMax: number | null,
  limit: number, orden: string,
) {
  const offset = (page - 1) * limit;

  // Parámetros para la cláusula interna (fuente siempre es $1)
  const innerParams: unknown[] = [];
  let innerClauses = "";

  if (filters.pa.length > 0) {
    innerParams.push(filters.pa);
    innerClauses += ` AND mp.principio_activo = ANY($${2 + innerParams.length - 1})`;
  }
  if (filters.lab.length > 0) {
    innerParams.push(filters.lab);
    innerClauses += ` AND mp.laboratorio = ANY($${2 + innerParams.length - 1})`;
  }
  if (filters.condicion.length > 0) {
    innerParams.push(filters.condicion);
    innerClauses += ` AND mp.condicion_venta = ANY($${2 + innerParams.length - 1})`;
  }

  const outerClauses: string[] = [];
  const outerParams: unknown[] = [];
  const baseIdx = 2 + innerParams.length;
  if (precioMin != null) { outerParams.push(precioMin); outerClauses.push(`precio_min >= $${baseIdx + outerParams.length - 1}`); }
  if (precioMax != null) { outerParams.push(precioMax); outerClauses.push(`precio_min <= $${baseIdx + outerParams.length - 1}`); }
  const outerWhere = outerClauses.length > 0 ? `WHERE ${outerClauses.join(" AND ")}` : "";

  const orderClause   = getOrderClause(orden);
  const allDataParams = [`%${fuente}%`, ...innerParams, ...outerParams, limit, offset];
  const limitIdx      = allDataParams.length - 1;
  const offsetIdx     = allDataParams.length;

  const [data, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<ProductoRow[]>(
      `SELECT * FROM (
         SELECT DISTINCT ON (mp.id)
           mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.concentracion, mp.forma_farmaceutica,
           CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
           precios.precio_min::float, precios.precio_max::float,
           precios.max_descuento, trends.total_clics
         FROM maestro_productos mp
         JOIN codigos_barras cb ON cb.producto_id = mp.id
         JOIN precios p_f ON p_f.ean = cb.ean
         JOIN fuentes f ON f.id = p_f.fuente_id AND unaccent(f.nombre) ILIKE unaccent($1)
         ${PRECIOS_JOIN}
         ${DESCUENTOS_JOIN}
         ${TRENDS_JOIN}
         WHERE TRUE${innerClauses}
         ORDER BY mp.id
       ) inner_q ${outerWhere} ${orderClause}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      ...allDataParams
    ),
    prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*) AS total FROM (
         SELECT DISTINCT ON (mp.id) mp.id, precios.precio_min::float
         FROM maestro_productos mp
         JOIN codigos_barras cb ON cb.producto_id = mp.id
         JOIN precios p_f ON p_f.ean = cb.ean
         JOIN fuentes f ON f.id = p_f.fuente_id AND unaccent(f.nombre) ILIKE unaccent($1)
         ${PRECIOS_JOIN}
         WHERE TRUE${innerClauses}
         ORDER BY mp.id
       ) inner_q ${outerWhere}`,
      `%${fuente}%`, ...innerParams, ...outerParams
    ),
  ]);

  const total = parseInt(countRows[0]?.total ?? "0", 10);
  return { data, total, pages: Math.ceil(total / limit) };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const nombre = await getFuenteNombre(slug);
  if (!nombre) return { title: "Farmacia no encontrada" };

  const canonical   = `${SITE}/farmacia/${slug}`;
  const title       = `Medicamentos en ${nombre} — Precios y ofertas | MediOfertas`;
  const description = `Compara precios de medicamentos disponibles en ${nombre}. Encuentra las mejores ofertas y ahorra en tu próxima compra.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: "website", siteName: "MediOfertas",
      images: [{ url: `${SITE}/og-default.png`, width: 1200, height: 630, alt: nombre }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FarmaciaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp        = await searchParams;

  const nombre = await getFuenteNombre(slug);
  if (!nombre) notFound();

  const page  = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = [12, 24, 48].includes(asNum(sp.limit, 24)) ? asNum(sp.limit, 24) : 24;
  const orden = sp.orden ?? "precio_asc";

  const filters = {
    pa:        asArray(sp.pa),
    lab:       asArray(sp.lab),
    condicion: asArray(sp.condicion),
  };
  const precioMin = sp.precioMin ? asNum(sp.precioMin, 0)   : null;
  const precioMax = sp.precioMax ? asNum(sp.precioMax, 0)   : null;

  const basePath = `/farmacia/${slug}`;

  const [results, opts] = await Promise.all([
    getProductosFarmacia(nombre, page, filters, precioMin, precioMax, limit, orden),
    fetchFilterOptions(nombre),
  ]);

  const { data, total, pages } = results;
  const { globalPrecioMin, globalPrecioMax } = opts;

  const sidebarGroups = [
    { key: "pa",  label: "Principio activo", options: opts.pa  },
    { key: "lab", label: "Laboratorio",       options: opts.lab },
  ];

  const allCurrentParams: Record<string, string[]> = {
    pa: filters.pa, lab: filters.lab, condicion: filters.condicion,
    ...(precioMin != null ? { precioMin: [String(precioMin)] } : {}),
    ...(precioMax != null ? { precioMax: [String(precioMax)] } : {}),
  };

  const hasFilters =
    filters.pa.length + filters.lab.length + filters.condicion.length > 0 ||
    precioMin != null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-600">{nombre}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-500">{nombre}</h1>
          {total > 0 && (
            <p className="text-sm text-gray-400">
              {total.toLocaleString("es-CO")} producto{total !== 1 ? "s" : ""} disponibles
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start mt-6">
        {/* Sidebar */}
        {sidebarGroups.some((g) => g.options.length > 0) && (
          <div className="w-56 shrink-0 hidden md:block">
            <CompararSidebar
              groups={sidebarGroups}
              selected={{ pa: filters.pa, lab: filters.lab }}
              basePath={basePath}
              condicion={filters.condicion}
              precioMin={precioMin}
              precioMax={precioMax}
              globalPrecioMin={globalPrecioMin}
              globalPrecioMax={globalPrecioMax}
              limit={limit}
              orden={orden}
            />
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          <FilterToolbar
            basePath={basePath}
            currentParams={allCurrentParams}
            limit={limit}
            orden={orden}
            totalLabel={
              total > 0
                ? `${total.toLocaleString("es-CO")} producto${total !== 1 ? "s" : ""}${pages > 1 ? ` · Página ${page} de ${pages}` : ""}`
                : hasFilters
                ? "Sin resultados con los filtros aplicados"
                : "No encontramos productos para esta farmacia"
            }
          />

          {data.length === 0 ? (
            <div className="text-center py-24">
              <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {hasFilters
                  ? "Ningún producto coincide con los filtros seleccionados"
                  : "No encontramos productos para esta farmacia"}
              </p>
              {hasFilters && (
                <p className="text-gray-400 text-sm mt-1">Prueba removiendo algún filtro</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              <Pagination
                page={page} pages={pages} basePath={basePath} filters={filters}
                precioMin={precioMin} precioMax={precioMax} limit={limit} orden={orden}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ProductCard({ p }: { p: ProductoRow }) {
  const hayRango = p.precio_min != null && p.precio_max != null && p.precio_max > p.precio_min;
  return (
    <Link href={`/producto/${p.slug ?? p.id}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-100 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative flex items-center justify-center h-36 bg-gray-50 border-b border-gray-100">
        {p.imagen_url
          ? <Image src={p.imagen_url} alt={p.nombre} width={96} height={96} className="object-contain w-24 h-24" unoptimized />
          : <Package className="w-12 h-12 text-gray-200" />}
        {p.max_descuento != null && p.max_descuento > 0 && (
          <span className="absolute top-2 right-2 bg-accent-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            -{p.max_descuento}%
          </span>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {p.nombre}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {[p.laboratorio, p.concentracion].filter(Boolean).join(" · ")}
        </p>
        {p.forma_farmaceutica && <p className="text-xs text-gray-400">{p.forma_farmaceutica}</p>}
      </div>
      <div className="px-4 pb-4">
        {p.precio_min != null ? (
          <>
            <p className="text-base font-bold text-primary-600">{formatCOP(p.precio_min)}</p>
            {hayRango && <p className="text-xs text-gray-400">hasta {formatCOP(p.precio_max as number)}</p>}
          </>
        ) : <p className="text-xs text-gray-300 italic">Sin precio</p>}
      </div>
    </Link>
  );
}

function Pagination({
  page, pages, basePath, filters, precioMin, precioMax, limit, orden,
}: {
  page: number; pages: number; basePath: string;
  filters: { pa: string[]; lab: string[]; condicion: string[] };
  precioMin: number | null; precioMax: number | null;
  limit: number; orden: string;
}) {
  if (pages <= 1) return null;

  function pageUrl(n: number) {
    const p = new URLSearchParams();
    p.set("page", String(n));
    p.set("limit", String(limit));
    p.set("orden", orden);
    filters.pa.forEach((v) => p.append("pa", v));
    filters.lab.forEach((v) => p.append("lab", v));
    filters.condicion.forEach((v) => p.append("condicion", v));
    if (precioMin != null) p.set("precioMin", String(precioMin));
    if (precioMax != null) p.set("precioMax", String(precioMax));
    return `${basePath}?${p.toString()}`;
  }

  const nums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  const cls   = "w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-colors";
  const inact = "border-gray-200 text-gray-600 hover:bg-gray-50";
  const act   = "bg-primary-500 text-white border-primary-500 font-semibold";

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Paginación">
      {page > 1 && (
        <Link href={pageUrl(page - 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          ← Anterior
        </Link>
      )}
      {nums[0] > 1 && (
        <>
          <Link href={pageUrl(1)} className={`${cls} ${inact}`}>1</Link>
          {nums[0] > 2 && <span className="text-gray-300 px-1 text-sm">…</span>}
        </>
      )}
      {nums.map((n) => (
        <Link key={n} href={pageUrl(n)} className={`${cls} ${n === page ? act : inact}`}>{n}</Link>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          {nums[nums.length - 1] < pages - 1 && <span className="text-gray-300 px-1 text-sm">…</span>}
          <Link href={pageUrl(pages)} className={`${cls} ${inact}`}>{pages}</Link>
        </>
      )}
      {page < pages && (
        <Link href={pageUrl(page + 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Siguiente →
        </Link>
      )}
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Search, Package } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import CompararSidebar from "@/components/CompararSidebar";
import FilterToolbar from "@/components/FilterToolbar";
import { PRECIOS_JOIN, DESCUENTOS_JOIN, TRENDS_JOIN, getOrderClause } from "@/lib/query-helpers";
import { normalizeSearch, slugifySearch } from "@/lib/search";

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
  id: number;
  slug: string | null;
  nombre: string;
  laboratorio: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  imagen_url: string | null;
  precio_min: number | null;
  precio_max: number | null;
  max_descuento: number | null;
  total_clics: number | null;
}

interface Props {
  searchParams: Promise<{
    q?: string; page?: string;
    pa?: SPVal; lab?: SPVal; fuente?: SPVal; condicion?: SPVal;
    precioMin?: string; precioMax?: string;
    limit?: string; orden?: string;
  }>;
}

const fetchFilterOptions = unstable_cache(
  async (patron: string): Promise<{
    pa: string[]; lab: string[]; fuente: string[];
    globalPrecioMin: number; globalPrecioMax: number;
  }> => {
    const base = `(unaccent(mp.nombre) ILIKE $1 OR unaccent(mp.principio_activo) ILIKE $1 OR unaccent(mp.laboratorio) ILIKE $1 OR cb.ean ILIKE $1)`;

    const [paRows, labRows, fRows, priceRows] = await Promise.all([
      prisma.$queryRawUnsafe<{ principio_activo: string }[]>(
        `SELECT DISTINCT mp.principio_activo
         FROM maestro_productos mp
         LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
         WHERE ${base} AND mp.principio_activo IS NOT NULL AND mp.principio_activo <> ''
         ORDER BY mp.principio_activo LIMIT 60`,
        patron
      ),
      prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
        `SELECT DISTINCT mp.laboratorio
         FROM maestro_productos mp
         LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
         WHERE ${base} AND mp.laboratorio IS NOT NULL AND mp.laboratorio <> ''
         ORDER BY mp.laboratorio LIMIT 60`,
        patron
      ),
      prisma.$queryRawUnsafe<{ cadena: string }[]>(
        `SELECT DISTINCT f.nombre AS cadena
         FROM fuentes f
         JOIN precios p ON p.fuente_id = f.id
         JOIN codigos_barras cb ON cb.ean = p.ean
         JOIN maestro_productos mp ON mp.id = cb.producto_id
         WHERE ${base}
         ORDER BY f.nombre LIMIT 60`,
        patron
      ),
      prisma.$queryRawUnsafe<{ min_price: number; max_price: number }[]>(
        `SELECT
           COALESCE(MIN(COALESCE(p.precio_oferta, p.precio_costo)), 0)::int AS min_price,
           COALESCE(MAX(COALESCE(p.precio_oferta, p.precio_costo)), 500000)::int AS max_price
         FROM precios p
         JOIN codigos_barras cb ON cb.ean = p.ean
         JOIN maestro_productos mp ON mp.id = cb.producto_id
         WHERE ${base}`,
        patron
      ),
    ]);

    return {
      pa:     paRows.map((r) => r.principio_activo),
      lab:    labRows.map((r) => r.laboratorio),
      fuente: fRows.map((r) => r.cadena),
      globalPrecioMin: priceRows[0]?.min_price ?? 0,
      globalPrecioMax: priceRows[0]?.max_price ?? 500000,
    };
  },
  ["filter-options"],
  { revalidate: 300 }
);

async function buscarProductos(
  query: string, page: number,
  filters: { pa: string[]; lab: string[]; fuente: string[]; condicion: string[] },
  precioMin: number | null, precioMax: number | null,
  limit: number, orden: string,
) {
  const patron = `%${normalizeSearch(query)}%`;
  const offset = (page - 1) * limit;
  const base   = `(unaccent(mp.nombre) ILIKE $1 OR unaccent(mp.principio_activo) ILIKE $1 OR unaccent(mp.laboratorio) ILIKE $1 OR cb.ean ILIKE $1)`;

  const innerParams: unknown[] = [];
  let innerClauses = "";

  if (filters.pa.length > 0) {
    innerParams.push(filters.pa);
    innerClauses += ` AND mp.principio_activo = ANY($${1 + innerParams.length})`;
  }
  if (filters.lab.length > 0) {
    innerParams.push(filters.lab);
    innerClauses += ` AND mp.laboratorio = ANY($${1 + innerParams.length})`;
  }
  if (filters.condicion.length > 0) {
    innerParams.push(filters.condicion);
    innerClauses += ` AND mp.condicion_venta = ANY($${1 + innerParams.length})`;
  }
  if (filters.fuente.length > 0) {
    innerParams.push(filters.fuente);
    innerClauses += ` AND EXISTS (
      SELECT 1 FROM precios p3
      JOIN fuentes f3 ON f3.id = p3.fuente_id
      JOIN codigos_barras cb3 ON cb3.ean = p3.ean
      WHERE cb3.producto_id = mp.id AND f3.nombre = ANY($${1 + innerParams.length})
    )`;
  }

  const outerClauses: string[] = [];
  const outerParams: unknown[] = [];
  const baseIdx = 1 + innerParams.length; // next param index after inner
  if (precioMin != null) { outerParams.push(precioMin); outerClauses.push(`precio_min >= $${baseIdx + outerParams.length}`); }
  if (precioMax != null) { outerParams.push(precioMax); outerClauses.push(`precio_min <= $${baseIdx + outerParams.length}`); }
  const outerWhere = outerClauses.length > 0 ? `WHERE ${outerClauses.join(" AND ")}` : "";

  const orderClause = getOrderClause(orden);
  const allDataParams = [patron, ...innerParams, ...outerParams, limit, offset];
  const limitIdx  = allDataParams.length - 1;
  const offsetIdx = allDataParams.length;

  const [data, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<ProductoRow[]>(
      `SELECT * FROM (
         SELECT DISTINCT ON (mp.id)
           mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.concentracion, mp.forma_farmaceutica,
           CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
           precios.precio_min::float, precios.precio_max::float,
           precios.max_descuento,
           trends.total_clics
         FROM maestro_productos mp
         LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
         ${PRECIOS_JOIN}
         ${DESCUENTOS_JOIN}
         ${TRENDS_JOIN}
         WHERE ${base}${innerClauses}
         ORDER BY mp.id
       ) inner_q
       ${outerWhere}
       ${orderClause}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      ...allDataParams
    ),
    prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*) AS total FROM (
         SELECT DISTINCT ON (mp.id) mp.id,
           precios.precio_min::float
         FROM maestro_productos mp
         LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
         ${PRECIOS_JOIN}
         WHERE ${base}${innerClauses}
         ORDER BY mp.id
       ) inner_q
       ${outerWhere}`,
      patron, ...innerParams, ...outerParams
    ),
  ]);

  const total = parseInt(countRows[0]?.total ?? "0", 10);
  return { data, total, pages: Math.ceil(total / limit) };
}

function ProductCard({ p }: { p: ProductoRow }) {
  const hayRango = p.precio_min != null && p.precio_max != null && p.precio_max > p.precio_min;

  return (
    <Link
      href={`/producto/${p.slug ?? p.id}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-100 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative flex items-center justify-center h-36 bg-gray-50 border-b border-gray-100">
        {p.imagen_url ? (
          <Image src={p.imagen_url} alt={p.nombre} width={96} height={96}
            className="object-contain w-24 h-24" unoptimized />
        ) : (
          <Package className="w-12 h-12 text-gray-200" />
        )}
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
        {p.forma_farmaceutica && (
          <p className="text-xs text-gray-400">{p.forma_farmaceutica}</p>
        )}
      </div>
      <div className="px-4 pb-4">
        {p.precio_min != null ? (
          <>
            <p className="text-base font-bold text-primary-600">{formatCOP(p.precio_min)}</p>
            {hayRango && <p className="text-xs text-gray-400">hasta {formatCOP(p.precio_max as number)}</p>}
          </>
        ) : (
          <p className="text-xs text-gray-300 italic">Sin precio</p>
        )}
      </div>
    </Link>
  );
}

function Pagination({
  page, pages, query, filters, precioMin, precioMax, limit, orden,
}: {
  page: number; pages: number; query: string;
  filters: { pa: string[]; lab: string[]; fuente: string[]; condicion: string[] };
  precioMin: number | null; precioMax: number | null;
  limit: number; orden: string;
}) {
  if (pages <= 1) return null;

  function pageUrl(n: number) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("page", String(n));
    p.set("limit", String(limit));
    p.set("orden", orden);
    filters.pa.forEach((v) => p.append("pa", v));
    filters.lab.forEach((v) => p.append("lab", v));
    filters.fuente.forEach((v) => p.append("fuente", v));
    filters.condicion.forEach((v) => p.append("condicion", v));
    if (precioMin != null) p.set("precioMin", String(precioMin));
    if (precioMax != null) p.set("precioMax", String(precioMax));
    return `/comparar?${p.toString()}`;
  }

  const nums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);

  const base     = "w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-colors";
  const inactive = "border-gray-200 text-gray-600 hover:bg-gray-50";
  const active   = "bg-primary-500 text-white border-primary-500 font-semibold";

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Paginación">
      {page > 1 && (
        <Link href={pageUrl(page - 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          ← Anterior
        </Link>
      )}
      {nums[0] > 1 && (
        <>
          <Link href={pageUrl(1)} className={`${base} ${inactive}`}>1</Link>
          {nums[0] > 2 && <span className="text-gray-300 px-1 text-sm">…</span>}
        </>
      )}
      {nums.map((n) => (
        <Link key={n} href={pageUrl(n)} className={`${base} ${n === page ? active : inactive}`}>{n}</Link>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          {nums[nums.length - 1] < pages - 1 && <span className="text-gray-300 px-1 text-sm">…</span>}
          <Link href={pageUrl(pages)} className={`${base} ${inactive}`}>{pages}</Link>
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

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultados para "${q}" — FarmaCompara` : "Comparar medicamentos — FarmaCompara",
    alternates: { canonical: "https://farmacompara.co/comparar" },
  };
}

export default async function CompararPage({ searchParams }: Props) {
  const sp    = await searchParams;
  const q     = sp.q ?? "";

  // Redirigir a URL canónica sin query params
  if (q.trim().length >= 3) {
    redirect(`/medicamento/${slugifySearch(q.trim())}`);
  }
  const page  = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const query = q.trim();
  const limit = [12, 24, 48].includes(asNum(sp.limit, 24)) ? asNum(sp.limit, 24) : 24;
  const orden = sp.orden ?? "precio_asc";

  const filters = {
    pa:       asArray(sp.pa),
    lab:      asArray(sp.lab),
    fuente:   asArray(sp.fuente),
    condicion: asArray(sp.condicion),
  };
  const precioMin = sp.precioMin ? asNum(sp.precioMin, 0) : null;
  const precioMax = sp.precioMax ? asNum(sp.precioMax, 0) : null;

  let data: ProductoRow[]  = [];
  let total = 0, pages = 0;
  let sidebarGroups: { key: string; label: string; options: string[] }[] = [];
  let globalPrecioMin = 0, globalPrecioMax = 500000;

  if (query.length >= 3) {
    const [results, opts] = await Promise.all([
      buscarProductos(query, page, filters, precioMin, precioMax, limit, orden),
      fetchFilterOptions(`%${normalizeSearch(query)}%`),
    ]);
    data   = results.data;
    total  = results.total;
    pages  = results.pages;
    globalPrecioMin = opts.globalPrecioMin;
    globalPrecioMax = opts.globalPrecioMax;
    sidebarGroups = [
      { key: "pa",     label: "Principio activo", options: opts.pa     },
      { key: "lab",    label: "Laboratorio",       options: opts.lab    },
      { key: "fuente", label: "Droguería",          options: opts.fuente },
    ];
  }

  const allCurrentParams: Record<string, string[]> = {
    ...(q ? { q: [q] } : {}),
    pa: filters.pa, lab: filters.lab, fuente: filters.fuente, condicion: filters.condicion,
    ...(precioMin != null ? { precioMin: [String(precioMin)] } : {}),
    ...(precioMax != null ? { precioMax: [String(precioMax)] } : {}),
  };

  const hasFilters =
    filters.pa.length + filters.lab.length + filters.fuente.length + filters.condicion.length > 0 ||
    precioMin != null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">


      <h1 className="text-2xl font-bold text-secondary-500 mb-6">
        {query.length >= 3
          ? `Resultados para "${query}"`
          : "Comparar medicamentos"}
      </h1>

      {query.length < 3 && (
        <div className="text-center py-24">
          <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Escribe al menos 3 letras para ver resultados</p>
        </div>
      )}

      {query.length >= 3 && (
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          {sidebarGroups.length > 0 && (
            <div className="w-56 shrink-0 hidden md:block">
              <CompararSidebar
                groups={sidebarGroups}
                selected={{ pa: filters.pa, lab: filters.lab, fuente: filters.fuente }}
                basePath="/comparar"
                query={query}
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
              basePath="/comparar"
              currentParams={allCurrentParams}
              limit={limit}
              orden={orden}
              totalLabel={
                total > 0
                  ? `${total.toLocaleString("es-CO")} resultado${total !== 1 ? "s" : ""} para "${query}"${pages > 1 ? ` · Página ${page} de ${pages}` : ""}`
                  : hasFilters ? "Sin resultados con los filtros aplicados" : `Sin resultados para "${query}"`
              }
            />

            {data.length === 0 ? (
              <div className="text-center py-24">
                <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  {hasFilters
                    ? "Ningún producto coincide con los filtros seleccionados"
                    : `No encontramos resultados para "${query}"`}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {hasFilters
                    ? "Prueba removiendo algún filtro"
                    : "Intenta con el nombre genérico o revisa la ortografía"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
                <Pagination
                  page={page} pages={pages} query={query} filters={filters}
                  precioMin={precioMin} precioMax={precioMax} limit={limit} orden={orden}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

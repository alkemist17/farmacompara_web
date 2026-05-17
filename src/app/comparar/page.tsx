import Image from "next/image";
import Link from "next/link";
import { Search, Package } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import FiltersPanel, { type FilterGroup } from "@/components/FiltersPanel";

const PER_PAGE = 24;

type SPVal = string | string[] | undefined;

function asArray(v: SPVal): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

interface ProductoRow {
  id: number;
  nombre: string;
  laboratorio: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  imagen_url: string | null;
  precio_min: string | null;
  precio_max: string | null;
}

interface Filters extends Record<string, string[]> { pa: string[]; lab: string[]; fuente: string[] }

interface Props {
  searchParams: Promise<{
    q?: string; page?: string;
    pa?: SPVal; lab?: SPVal; fuente?: SPVal;
  }>;
}

// ── Opciones de filtros (basadas en la búsqueda, sin aplicar filtros activos) ──
async function fetchFilterOptions(patron: string): Promise<{ pa: string[]; lab: string[]; fuente: string[] }> {
  const base = `(mp.nombre ILIKE $1 OR mp.principio_activo ILIKE $1 OR mp.laboratorio ILIKE $1 OR cb.ean ILIKE $1)`;

  const [{ rows: paRows }, { rows: labRows }, { rows: fRows }] = await Promise.all([
    db.query<{ principio_activo: string }>(
      `SELECT DISTINCT mp.principio_activo
       FROM maestro_productos mp
       LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
       WHERE ${base} AND mp.principio_activo IS NOT NULL AND mp.principio_activo <> ''
       ORDER BY mp.principio_activo LIMIT 60`,
      [patron]
    ),
    db.query<{ laboratorio: string }>(
      `SELECT DISTINCT mp.laboratorio
       FROM maestro_productos mp
       LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
       WHERE ${base} AND mp.laboratorio IS NOT NULL AND mp.laboratorio <> ''
       ORDER BY mp.laboratorio LIMIT 60`,
      [patron]
    ),
    db.query<{ cadena: string }>(
      `SELECT DISTINCT f.nombre AS cadena
       FROM fuentes f
       JOIN precios_historicos ph ON ph.fuente_id = f.id
       JOIN codigos_barras cb ON cb.ean = ph.ean
       JOIN maestro_productos mp ON mp.id = cb.producto_id
       WHERE ${base}
       ORDER BY f.nombre LIMIT 60`,
      [patron]
    ),
  ]);

  return {
    pa:     paRows.map((r) => r.principio_activo),
    lab:    labRows.map((r) => r.laboratorio),
    fuente: fRows.map((r) => r.cadena),
  };
}

// ── Productos paginados con filtros aplicados ──
async function buscarProductos(query: string, page: number, filters: Filters) {
  const patron = `%${query}%`;
  const offset = (page - 1) * PER_PAGE;
  const base   = `(mp.nombre ILIKE $1 OR mp.principio_activo ILIKE $1 OR mp.laboratorio ILIKE $1 OR cb.ean ILIKE $1)`;

  function buildExtra(startIdx: number) {
    const params: unknown[] = [];
    let clauses = "";
    if (filters.pa.length > 0) {
      params.push(filters.pa);
      clauses += ` AND mp.principio_activo = ANY($${startIdx + params.length})`;
    }
    if (filters.lab.length > 0) {
      params.push(filters.lab);
      clauses += ` AND mp.laboratorio = ANY($${startIdx + params.length})`;
    }
    if (filters.fuente.length > 0) {
      params.push(filters.fuente);
      clauses += ` AND EXISTS (
        SELECT 1 FROM precios_historicos ph3
        JOIN fuentes f3 ON f3.id = ph3.fuente_id
        JOIN codigos_barras cb3 ON cb3.ean = ph3.ean
        WHERE cb3.producto_id = mp.id AND f3.nombre = ANY($${startIdx + params.length})
      )`;
    }
    return { params, clauses };
  }

  const { params: extraData,  clauses: dataFilter  } = buildExtra(3); // $1=patron $2=limit $3=offset
  const { params: extraCount, clauses: countFilter } = buildExtra(1); // $1=patron

  const [{ rows: data }, { rows: countRows }] = await Promise.all([
    db.query<ProductoRow>(
      `SELECT DISTINCT ON (mp.id)
         mp.id, mp.nombre, mp.laboratorio, mp.concentracion, mp.forma_farmaceutica,
         CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
         precios.precio_min, precios.precio_max
       FROM maestro_productos mp
       LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
       LEFT JOIN (
         SELECT ultimos.ean,
           MIN(ultimos.precio_actual) AS precio_min,
           MAX(ultimos.precio_actual) AS precio_max
         FROM (
           SELECT DISTINCT ON (ph.ean, ph.fuente_id)
             ph.ean, ph.fuente_id,
             COALESCE(ph.precio_oferta, ph.precio_costo) AS precio_actual,
             ph.fecha_captura
           FROM precios_historicos ph
           ORDER BY ph.ean, ph.fuente_id, ph.fecha_captura DESC
         ) ultimos
         GROUP BY ultimos.ean
       ) precios ON precios.ean = cb.ean
       WHERE ${base}${dataFilter}
       ORDER BY mp.id, mp.nombre
       LIMIT $2 OFFSET $3`,
      [patron, PER_PAGE, offset, ...extraData]
    ),
    db.query<{ total: string }>(
      `SELECT COUNT(DISTINCT mp.id) AS total
       FROM maestro_productos mp
       LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
       WHERE ${base}${countFilter}`,
      [patron, ...extraCount]
    ),
  ]);

  const total = parseInt(countRows[0].total, 10);
  return { data, total, pages: Math.ceil(total / PER_PAGE) };
}

// ── Tarjeta de producto ──
function ProductCard({ p }: { p: ProductoRow }) {
  const minNum = p.precio_min ? parseFloat(p.precio_min) : null;
  const maxNum = p.precio_max ? parseFloat(p.precio_max) : null;
  const hayRango = minNum != null && maxNum != null && maxNum > minNum;

  return (
    <Link
      href={`/producto/${p.id}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-100 transition-all overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-center h-36 bg-gray-50 border-b border-gray-100">
        {p.imagen_url ? (
          <Image src={p.imagen_url} alt={p.nombre} width={96} height={96}
            className="object-contain w-24 h-24" unoptimized />
        ) : (
          <Package className="w-12 h-12 text-gray-200" />
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
        {minNum != null ? (
          <>
            <p className="text-base font-bold text-primary-600">{formatCOP(minNum)}</p>
            {hayRango && <p className="text-xs text-gray-400">hasta {formatCOP(maxNum)}</p>}
          </>
        ) : (
          <p className="text-xs text-gray-300 italic">Sin precio</p>
        )}
      </div>
    </Link>
  );
}

// ── Paginación (preserva filtros en la URL) ──
function Pagination({ page, pages, query, filters }: { page: number; pages: number; query: string; filters: Filters }) {
  if (pages <= 1) return null;

  function pageUrl(n: number) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("page", String(n));
    filters.pa.forEach((v) => p.append("pa", v));
    filters.lab.forEach((v) => p.append("lab", v));
    filters.fuente.forEach((v) => p.append("fuente", v));
    return `/comparar?${p.toString()}`;
  }

  const nums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);

  const base    = "w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-colors";
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

// ── Metadata ──
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultados para "${q}" — FarmaCompara` : "Comparar medicamentos — FarmaCompara",
  };
}

// ── Página principal ──
export default async function CompararPage({ searchParams }: Props) {
  const sp    = await searchParams;
  const q     = sp.q ?? "";
  const page  = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const query = q.trim();

  const filters: Filters = {
    pa:     asArray(sp.pa),
    lab:    asArray(sp.lab),
    fuente: asArray(sp.fuente),
  };

  let data: ProductoRow[]  = [];
  let total = 0, pages = 0;
  let filterGroups: FilterGroup[] = [];

  if (query.length >= 3) {
    const [results, opts] = await Promise.all([
      buscarProductos(query, page, filters),
      fetchFilterOptions(`%${query}%`),
    ]);
    data   = results.data;
    total  = results.total;
    pages  = results.pages;
    filterGroups = [
      { key: "pa",     label: "Principio activo", options: opts.pa     },
      { key: "lab",    label: "Laboratorio",       options: opts.lab    },
      { key: "fuente", label: "Droguería",          options: opts.fuente },
    ];
  }

  const hasFilters = filters.pa.length + filters.lab.length + filters.fuente.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-500">
          {query.length >= 3
            ? total > 0
              ? `${total.toLocaleString("es-CO")} resultado${total !== 1 ? "s" : ""} para "${query}"`
              : hasFilters ? `Sin resultados con los filtros aplicados` : `Sin resultados para "${query}"`
            : "Comparar medicamentos"}
        </h1>
        {query.length >= 3 && total > 0 && (
          <p className="text-gray-400 text-sm mt-1">
            Página {page} de {pages} · Precios actualizados por cadena
          </p>
        )}
        {query.length < 3 && (
          <p className="text-gray-500 text-sm mt-1">Busca un medicamento para ver precios y comparar droguerías</p>
        )}
      </div>

      {/* Estado vacío sin búsqueda */}
      {query.length < 3 && (
        <div className="text-center py-24">
          <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Escribe al menos 3 letras para ver resultados</p>
        </div>
      )}

      {/* Layout con filtros + resultados */}
      {query.length >= 3 && (
        <div className="flex gap-6 items-start">

          {/* Sidebar filtros */}
          {filterGroups.length > 0 && (
            <div className="w-56 shrink-0">
              <FiltersPanel groups={filterGroups} selected={filters} baseQ={query} />
            </div>
          )}

          {/* Resultados */}
          <div className="flex-1 min-w-0">
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
                <Pagination page={page} pages={pages} query={query} filters={filters} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

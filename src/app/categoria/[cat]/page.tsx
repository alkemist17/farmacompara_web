import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import { CATEGORIAS } from "@/lib/categorias";
import CategoriasSidebar from "@/components/CategoriasSidebar";
import FilterToolbar from "@/components/FilterToolbar";
import { PRECIOS_JOIN, DESCUENTOS_JOIN, TRENDS_JOIN, getOrderClause } from "@/lib/query-helpers";

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
  slug: string;
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
  params: Promise<{ cat: string }>;
  searchParams: Promise<{
    sub?: SPVal; lab?: SPVal; fuente?: SPVal; condicion?: SPVal;
    precioMin?: string; precioMax?: string;
    page?: string; limit?: string; orden?: string;
  }>;
}

function buildInnerWhere(catSlug: string, sub: string[], lab: string[], fuente: string[], condicion: string[]) {
  const params: unknown[] = [catSlug];
  let clauses = "c.slug = $1";

  if (sub.length > 0)      { params.push(sub);      clauses += ` AND s.slug = ANY($${params.length})`; }
  if (lab.length > 0)      { params.push(lab);      clauses += ` AND mp.laboratorio = ANY($${params.length})`; }
  if (condicion.length > 0){ params.push(condicion); clauses += ` AND mp.condicion_venta = ANY($${params.length})`; }
  if (fuente.length > 0) {
    params.push(fuente);
    clauses += ` AND EXISTS (
      SELECT 1 FROM precios p3
      JOIN fuentes f3 ON f3.id = p3.fuente_id
      JOIN codigos_barras cb3 ON cb3.ean = p3.ean
      WHERE cb3.producto_id = mp.id AND f3.nombre = ANY($${params.length})
    )`;
  }
  return { params, clauses };
}

async function fetchProducts(
  catSlug: string, sub: string[], lab: string[], fuente: string[], condicion: string[],
  precioMin: number | null, precioMax: number | null,
  page: number, limit: number, orden: string,
) {
  const { params, clauses } = buildInnerWhere(catSlug, sub, lab, fuente, condicion);
  const offset = (page - 1) * limit;
  const orderClause = getOrderClause(orden);

  // Outer price-range conditions
  const outerClauses: string[] = [];
  const outerParams: unknown[] = [];
  if (precioMin != null) { outerParams.push(precioMin); outerClauses.push(`precio_min >= $${params.length + 1 + outerParams.length - 1}`); }
  if (precioMax != null) { outerParams.push(precioMax); outerClauses.push(`precio_min <= $${params.length + 1 + outerParams.length - 1}`); }
  const outerWhere = outerClauses.length > 0 ? `WHERE ${outerClauses.join(" AND ")}` : "";

  const allDataParams = [...params, ...outerParams, limit, offset];
  const limitIdx  = allDataParams.length - 1;
  const offsetIdx = allDataParams.length;

  const [data, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<ProductoRow[]>(`
      SELECT * FROM (
        SELECT DISTINCT ON (mp.id)
          mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.concentracion, mp.forma_farmaceutica,
          CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
          precios.precio_min::float, precios.precio_max::float,
          precios.max_descuento,
          trends.total_clics
        FROM maestro_productos mp
        JOIN subcategorias s ON s.id = mp.subcategoria_id
        JOIN categorias c ON c.id = s.categoria_id
        LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
        ${PRECIOS_JOIN}
        ${DESCUENTOS_JOIN}
        ${TRENDS_JOIN}
        WHERE ${clauses}
        ORDER BY mp.id
      ) inner_q
      ${outerWhere}
      ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, ...allDataParams),

    prisma.$queryRawUnsafe<{ total: string }[]>(`
      SELECT COUNT(*) AS total FROM (
        SELECT DISTINCT ON (mp.id) mp.id,
          precios.precio_min::float
        FROM maestro_productos mp
        JOIN subcategorias s ON s.id = mp.subcategoria_id
        JOIN categorias c ON c.id = s.categoria_id
        LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
        ${PRECIOS_JOIN}
        WHERE ${clauses}
        ORDER BY mp.id
      ) inner_q
      ${outerWhere}
    `, ...params, ...outerParams),
  ]);

  const total = parseInt(countRows[0]?.total ?? "0", 10);
  return { data, total, pages: Math.ceil(total / limit) };
}

async function fetchFilterOptions(catSlug: string, sub: string[]) {
  const params: unknown[] = [catSlug];
  let extra = "";
  if (sub.length > 0) { params.push(sub); extra = ` AND s.slug = ANY($${params.length})`; }
  const base = `c.slug = $1${extra}`;

  const [labRows, fRows, priceRows] = await Promise.all([
    prisma.$queryRawUnsafe<{ laboratorio: string }[]>(`
      SELECT DISTINCT mp.laboratorio
      FROM maestro_productos mp
      JOIN subcategorias s ON s.id = mp.subcategoria_id
      JOIN categorias c ON c.id = s.categoria_id
      WHERE ${base} AND mp.laboratorio IS NOT NULL AND mp.laboratorio <> ''
      ORDER BY mp.laboratorio LIMIT 60
    `, ...params),
    prisma.$queryRawUnsafe<{ cadena: string }[]>(`
      SELECT DISTINCT f.nombre AS cadena
      FROM fuentes f
      JOIN precios p ON p.fuente_id = f.id
      JOIN codigos_barras cb ON cb.ean = p.ean
      JOIN maestro_productos mp ON mp.id = cb.producto_id
      JOIN subcategorias s ON s.id = mp.subcategoria_id
      JOIN categorias c ON c.id = s.categoria_id
      WHERE ${base}
      ORDER BY f.nombre LIMIT 60
    `, ...params),
    prisma.$queryRawUnsafe<{ min_price: number; max_price: number }[]>(`
      SELECT
        COALESCE(MIN(COALESCE(p.precio_oferta, p.precio_costo)), 0)::int AS min_price,
        COALESCE(MAX(COALESCE(p.precio_oferta, p.precio_costo)), 500000)::int AS max_price
      FROM precios p
      JOIN codigos_barras cb ON cb.ean = p.ean
      JOIN maestro_productos mp ON mp.id = cb.producto_id
      JOIN subcategorias s ON s.id = mp.subcategoria_id
      JOIN categorias c ON c.id = s.categoria_id
      WHERE ${base}
    `, ...params),
  ]);

  return {
    lab:    labRows.map((r) => r.laboratorio),
    fuente: fRows.map((r) => r.cadena),
    globalPrecioMin: priceRows[0]?.min_price ?? 0,
    globalPrecioMax: priceRows[0]?.max_price ?? 500000,
  };
}

function ProductCard({ p }: { p: ProductoRow }) {
  const hayRango = p.precio_min != null && p.precio_max != null && p.precio_max > p.precio_min;

  return (
    <Link
      href={`/producto/${p.slug ?? p.id}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-100 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative flex items-center justify-center h-36 bg-white border-b border-gray-100">
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
      <div className="flex-1 p-4 flex flex-col gap-1 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {p.nombre}
        </p>
        <p className="text-xs text-secondary-400 truncate font-medium">
          {[p.laboratorio, p.concentracion].filter(Boolean).join(" · ")}
        </p>
        {p.forma_farmaceutica && (
          <p className="text-xs text-secondary-400 font-medium">{p.forma_farmaceutica}</p>
        )}
      </div>
      <div className="px-4 pb-4 bg-gray-50 rounded-b-2xl">
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

function Pagination({ page, pages, catSlug, sub, lab, fuente, condicion, precioMin, precioMax, limit, orden }: {
  page: number; pages: number; catSlug: string;
  sub: string[]; lab: string[]; fuente: string[]; condicion: string[];
  precioMin: number | null; precioMax: number | null;
  limit: number; orden: string;
}) {
  if (pages <= 1) return null;

  function pageUrl(n: number) {
    const p = new URLSearchParams();
    sub.forEach((v) => p.append("sub", v));
    lab.forEach((v) => p.append("lab", v));
    fuente.forEach((v) => p.append("fuente", v));
    condicion.forEach((v) => p.append("condicion", v));
    if (precioMin != null) p.set("precioMin", String(precioMin));
    if (precioMax != null) p.set("precioMax", String(precioMax));
    p.set("limit", String(limit));
    p.set("orden", orden);
    p.set("page", String(n));
    return `/categoria/${catSlug}?${p.toString()}`;
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

const SITE = "https://mediofertas.co";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat } = await params;
  const categoria = CATEGORIAS.find((c) => c.slug === cat);
  if (!categoria) return { title: "Categoría — MediOfertas" };
  return {
    title: `${categoria.label} — MediOfertas`,
    description: `Compara precios de ${categoria.label.toLowerCase()} entre las principales droguerías de Colombia`,
    alternates: { canonical: `${SITE}/categoria/${cat}` },
  };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { cat } = await params;
  const sp = await searchParams;

  const categoria = CATEGORIAS.find((c) => c.slug === cat);
  if (!categoria) notFound();

  const sub      = asArray(sp.sub);
  const lab      = asArray(sp.lab);
  const fuente   = asArray(sp.fuente);
  const condicion = asArray(sp.condicion);
  const precioMin = sp.precioMin ? asNum(sp.precioMin, 0) : null;
  const precioMax = sp.precioMax ? asNum(sp.precioMax, 0) : null;
  const page      = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit     = [12, 24, 48].includes(asNum(sp.limit, 24)) ? asNum(sp.limit, 24) : 24;
  const orden     = sp.orden ?? "precio_asc";

  const [results, opts] = await Promise.all([
    fetchProducts(cat, sub, lab, fuente, condicion, precioMin, precioMax, page, limit, orden),
    fetchFilterOptions(cat, sub),
  ]);

  const allCurrentParams: Record<string, string[]> = {
    sub, lab, fuente, condicion,
    ...(precioMin != null ? { precioMin: [String(precioMin)] } : {}),
    ...(precioMax != null ? { precioMax: [String(precioMax)] } : {}),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">{categoria.label}</span>
      </nav>

      <h1 className="text-2xl font-bold text-secondary-500 mb-6">
        {categoria.label}
      </h1>

      {/* Layout: sidebar + results */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        <div className="w-full md:w-56 md:shrink-0">
          <CategoriasSidebar
            currentCat={cat}
            selectedSubs={sub}
            otherGroups={[
              { key: "lab",    label: "Laboratorio", options: opts.lab    },
              { key: "fuente", label: "Droguería",   options: opts.fuente },
            ]}
            otherSelected={{ lab, fuente }}
            basePath={`/categoria/${cat}`}
            condicion={condicion}
            precioMin={precioMin}
            precioMax={precioMax}
            globalPrecioMin={opts.globalPrecioMin}
            globalPrecioMax={opts.globalPrecioMax}
            extraPreserve={{ limit: String(limit), orden }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <FilterToolbar
            basePath={`/categoria/${cat}`}
            currentParams={allCurrentParams}
            limit={limit}
            orden={orden}
            totalLabel={
              results.total > 0
                ? `${results.total.toLocaleString("es-CO")} producto${results.total !== 1 ? "s" : ""}${results.pages > 1 ? ` · Página ${page} de ${results.pages}` : ""}`
                : undefined
            }
          />

          {results.data.length === 0 ? (
            <div className="text-center py-24">
              <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {sub.length + lab.length + fuente.length + condicion.length + (precioMin != null ? 1 : 0) > 0
                  ? "Ningún producto coincide con los filtros seleccionados"
                  : "No hay productos en esta categoría aún"}
              </p>
              {sub.length + lab.length + fuente.length + condicion.length > 0 && (
                <p className="text-gray-400 text-sm mt-1">Prueba removiendo algún filtro</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.data.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              <Pagination
                page={page} pages={results.pages}
                catSlug={cat} sub={sub} lab={lab} fuente={fuente}
                condicion={condicion} precioMin={precioMin} precioMax={precioMax}
                limit={limit} orden={orden}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

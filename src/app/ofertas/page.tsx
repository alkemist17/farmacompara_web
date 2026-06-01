import Image from "next/image";
import Link from "next/link";
import { Package, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import OfertasSidebar from "@/components/OfertasSidebar";
import FilterToolbar from "@/components/FilterToolbar";

export const metadata: Metadata = {
  title: "Ofertas del día — MedioFertas",
  description: "Los mejores descuentos en medicamentos y productos de salud actualizados hoy",
  alternates: { canonical: "https://mediofertas.co/ofertas" },
  openGraph: {
    title: "Ofertas del día — MedioFertas",
    description: "Los mejores descuentos en medicamentos y productos de salud actualizados hoy",
    url: "https://mediofertas.co/ofertas",
    type: "website",
    siteName: "MedioFertas",
  },
};

type SPVal = string | string[] | undefined;
function asArray(v: SPVal): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function asNum(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  return isNaN(n) ? fallback : n;
}

interface OfertaRow {
  id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  imagen_url: string | null;
  cadena: string;
  precio_costo: number;
  precio_oferta: number;
  descuento_pct: number;
  ahorro: number;
}

interface Props {
  searchParams: Promise<{
    cat?: SPVal; sub?: SPVal; lab?: SPVal; fuente?: SPVal; condicion?: SPVal;
    precioMin?: string; precioMax?: string;
    page?: string; limit?: string; orden?: string;
  }>;
}

const INNER_QUERY = `
  SELECT
    p.ean, p.fuente_id, p.precio_costo, p.precio_oferta, p.fecha_revision AS fecha_captura
  FROM precios p
  WHERE p.precio_oferta IS NOT NULL
    AND p.precio_costo  IS NOT NULL
    AND p.precio_costo  >  p.precio_oferta
`;

function buildInnerWhere(cat: string[], sub: string[], lab: string[], fuente: string[], condicion: string[]) {
  const params: unknown[] = [];
  const clauses: string[] = ["mp.slug IS NOT NULL"];

  if (cat.length > 0 || sub.length > 0) {
    const orParts: string[] = [];
    if (cat.length > 0) { params.push(cat); orParts.push(`c.slug = ANY($${params.length})`); }
    if (sub.length > 0) { params.push(sub);  orParts.push(`s.slug = ANY($${params.length})`); }
    clauses.push(`(${orParts.join(" OR ")})`);
  }
  if (lab.length > 0)      { params.push(lab);      clauses.push(`mp.laboratorio = ANY($${params.length})`); }
  if (fuente.length > 0)   { params.push(fuente);   clauses.push(`f.nombre = ANY($${params.length})`); }
  if (condicion.length > 0){ params.push(condicion); clauses.push(`mp.condicion_venta = ANY($${params.length})`); }

  return { params, where: clauses.join(" AND ") };
}

function getOfertaOrderClause(orden: string): string {
  switch (orden) {
    case "precio_asc":
      return "ORDER BY precio_oferta ASC";
    case "popular":
      return "ORDER BY descuento_pct DESC"; // fallback — no trend data in offer row
    case "descuento":
    default:
      return "ORDER BY descuento_pct DESC";
  }
}

async function fetchOfertas(
  cat: string[], sub: string[], lab: string[], fuente: string[], condicion: string[],
  precioMin: number | null, precioMax: number | null,
  page: number, limit: number, orden: string,
) {
  const { params, where } = buildInnerWhere(cat, sub, lab, fuente, condicion);
  const offset = (page - 1) * limit;
  const orderClause = getOfertaOrderClause(orden);

  const outerClauses: string[] = [];
  const outerParams: unknown[] = [];
  if (precioMin != null) { outerParams.push(precioMin); outerClauses.push(`precio_oferta >= $${params.length + outerParams.length}`); }
  if (precioMax != null) { outerParams.push(precioMax); outerClauses.push(`precio_oferta <= $${params.length + outerParams.length}`); }
  const outerWhere = outerClauses.length > 0 ? `AND ${outerClauses.join(" AND ")}` : "";

  const allDataParams = [...params, ...outerParams, limit, offset];
  const limitIdx  = allDataParams.length - 1;
  const offsetIdx = allDataParams.length;

  const [data, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<OfertaRow[]>(`
      SELECT * FROM (
        SELECT DISTINCT ON (mp.id)
          mp.id, mp.slug, mp.nombre, mp.laboratorio,
          CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
          f.nombre AS cadena,
          ph.precio_costo::float,
          ph.precio_oferta::float,
          ROUND(((ph.precio_costo - ph.precio_oferta) / ph.precio_costo) * 100)::int AS descuento_pct,
          (ph.precio_costo - ph.precio_oferta)::float AS ahorro
        FROM (${INNER_QUERY}) ph
        JOIN codigos_barras cb ON cb.ean = ph.ean
        JOIN maestro_productos mp ON mp.id = cb.producto_id
        JOIN fuentes f ON f.id = ph.fuente_id
        LEFT JOIN subcategorias s ON s.id = mp.subcategoria_id
        LEFT JOIN categorias c ON c.id = s.categoria_id
        WHERE ${where}
        ORDER BY mp.id,
          ROUND(((ph.precio_costo - ph.precio_oferta) / ph.precio_costo) * 100) DESC
      ) t
      WHERE 1=1 ${outerWhere}
      ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, ...allDataParams),

    prisma.$queryRawUnsafe<{ total: string }[]>(`
      SELECT COUNT(*) AS total FROM (
        SELECT DISTINCT ON (mp.id) mp.id,
          ph.precio_oferta::float
        FROM (${INNER_QUERY}) ph
        JOIN codigos_barras cb ON cb.ean = ph.ean
        JOIN maestro_productos mp ON mp.id = cb.producto_id
        JOIN fuentes f ON f.id = ph.fuente_id
        LEFT JOIN subcategorias s ON s.id = mp.subcategoria_id
        LEFT JOIN categorias c ON c.id = s.categoria_id
        WHERE ${where}
        ORDER BY mp.id
      ) t
      WHERE 1=1 ${outerWhere}
    `, ...params, ...outerParams),
  ]);

  const total = parseInt(countRows[0]?.total ?? "0", 10);
  return { data, total, pages: Math.ceil(total / limit) };
}

async function fetchFilterOptions(cat: string[], sub: string[]) {
  const { params, where } = buildInnerWhere(cat, sub, [], [], []);

  const [labRows, fRows, priceRows] = await Promise.all([
    prisma.$queryRawUnsafe<{ laboratorio: string }[]>(`
      SELECT DISTINCT mp.laboratorio
      FROM (${INNER_QUERY}) ph
      JOIN codigos_barras cb ON cb.ean = ph.ean
      JOIN maestro_productos mp ON mp.id = cb.producto_id
      JOIN fuentes f ON f.id = ph.fuente_id
      LEFT JOIN subcategorias s ON s.id = mp.subcategoria_id
      LEFT JOIN categorias c ON c.id = s.categoria_id
      WHERE ${where} AND mp.laboratorio IS NOT NULL AND mp.laboratorio <> ''
      ORDER BY mp.laboratorio LIMIT 60
    `, ...params),
    prisma.$queryRawUnsafe<{ cadena: string }[]>(`
      SELECT DISTINCT f.nombre AS cadena
      FROM (${INNER_QUERY}) ph
      JOIN codigos_barras cb ON cb.ean = ph.ean
      JOIN maestro_productos mp ON mp.id = cb.producto_id
      JOIN fuentes f ON f.id = ph.fuente_id
      LEFT JOIN subcategorias s ON s.id = mp.subcategoria_id
      LEFT JOIN categorias c ON c.id = s.categoria_id
      WHERE ${where}
      ORDER BY f.nombre LIMIT 60
    `, ...params),
    prisma.$queryRawUnsafe<{ min_price: number; max_price: number }[]>(`
      SELECT
        COALESCE(MIN(ph.precio_oferta), 0)::int AS min_price,
        COALESCE(MAX(ph.precio_oferta), 500000)::int AS max_price
      FROM (${INNER_QUERY}) ph
      JOIN codigos_barras cb ON cb.ean = ph.ean
      JOIN maestro_productos mp ON mp.id = cb.producto_id
      JOIN fuentes f ON f.id = ph.fuente_id
      LEFT JOIN subcategorias s ON s.id = mp.subcategoria_id
      LEFT JOIN categorias c ON c.id = s.categoria_id
      WHERE ${where}
    `, ...params),
  ]);

  return {
    lab:    labRows.map((r) => r.laboratorio),
    fuente: fRows.map((r) => r.cadena),
    globalPrecioMin: priceRows[0]?.min_price ?? 0,
    globalPrecioMax: priceRows[0]?.max_price ?? 500000,
  };
}

function OfertaCard({ p }: { p: OfertaRow }) {
  return (
    <Link
      href={`/producto/${p.slug}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-100 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative flex items-center justify-center h-40 bg-gray-50 border-b border-gray-100">
        {p.imagen_url ? (
          <Image src={p.imagen_url} alt={p.nombre} width={120} height={120}
            className="object-contain w-28 h-28" unoptimized />
        ) : (
          <Package className="w-12 h-12 text-gray-200" />
        )}
        <span className="absolute top-2 right-2 bg-accent-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
          -{p.descuento_pct}%
        </span>
      </div>

      <div className="flex-1 px-4 pt-3 pb-1 flex flex-col gap-0.5">
        <p className="text-[11px] text-gray-400 font-medium truncate">{p.cadena}</p>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {p.nombre}
        </p>
        {p.laboratorio && (
          <p className="text-xs text-gray-400 truncate">{p.laboratorio}</p>
        )}
      </div>

      <div className="px-4 pb-4 mt-2">
        <p className="text-xs text-gray-400 line-through">{formatCOP(p.precio_costo)}</p>
        <p className="text-base font-bold text-primary-600 leading-tight">{formatCOP(p.precio_oferta)}</p>
        <p className="text-xs font-semibold text-accent-600 mt-0.5">Ahorras {formatCOP(p.ahorro)}</p>
      </div>
    </Link>
  );
}

function Pagination({ page, pages, cat, sub, lab, fuente, condicion, precioMin, precioMax, limit, orden }: {
  page: number; pages: number;
  cat: string[]; sub: string[]; lab: string[]; fuente: string[]; condicion: string[];
  precioMin: number | null; precioMax: number | null;
  limit: number; orden: string;
}) {
  if (pages <= 1) return null;

  function pageUrl(n: number) {
    const p = new URLSearchParams();
    cat.forEach((v) => p.append("cat", v));
    sub.forEach((v) => p.append("sub", v));
    lab.forEach((v) => p.append("lab", v));
    fuente.forEach((v) => p.append("fuente", v));
    condicion.forEach((v) => p.append("condicion", v));
    if (precioMin != null) p.set("precioMin", String(precioMin));
    if (precioMax != null) p.set("precioMax", String(precioMax));
    p.set("limit", String(limit));
    p.set("orden", orden);
    p.set("page", String(n));
    return `/ofertas?${p.toString()}`;
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

export default async function OfertasPage({ searchParams }: Props) {
  const sp = await searchParams;

  const cat      = asArray(sp.cat);
  const sub      = asArray(sp.sub);
  const lab      = asArray(sp.lab);
  const fuente   = asArray(sp.fuente);
  const condicion = asArray(sp.condicion);
  const precioMin = sp.precioMin ? asNum(sp.precioMin, 0) : null;
  const precioMax = sp.precioMax ? asNum(sp.precioMax, 0) : null;
  const page      = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit     = [12, 24, 48].includes(asNum(sp.limit, 24)) ? asNum(sp.limit, 24) : 24;
  const orden     = sp.orden ?? "descuento";

  const [results, opts] = await Promise.all([
    fetchOfertas(cat, sub, lab, fuente, condicion, precioMin, precioMax, page, limit, orden),
    fetchFilterOptions(cat, sub),
  ]);

  const allCurrentParams: Record<string, string[]> = {
    cat, sub, lab, fuente, condicion,
    ...(precioMin != null ? { precioMin: [String(precioMin)] } : {}),
    ...(precioMax != null ? { precioMax: [String(precioMax)] } : {}),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Ofertas del día</span>
      </nav>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        <div className="w-full md:w-56 md:shrink-0">
          <OfertasSidebar
            selectedCats={cat}
            selectedSubs={sub}
            otherGroups={[
              { key: "lab",    label: "Laboratorio", options: opts.lab    },
              { key: "fuente", label: "Droguería",   options: opts.fuente },
            ]}
            otherSelected={{ lab, fuente }}
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
            basePath="/ofertas"
            currentParams={allCurrentParams}
            limit={limit}
            orden={orden}
            totalLabel={
              results.total > 0
                ? `${results.total.toLocaleString("es-CO")} producto${results.total !== 1 ? "s" : ""} con descuento${results.pages > 1 ? ` · Página ${page} de ${results.pages}` : ""}`
                : undefined
            }
          />

          {results.data.length === 0 ? (
            <div className="text-center py-24">
              <TrendingDown className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {cat.length + sub.length + lab.length + fuente.length + condicion.length > 0
                  ? "Ninguna oferta coincide con los filtros seleccionados"
                  : "No hay ofertas disponibles en este momento"}
              </p>
              {cat.length + sub.length + lab.length + fuente.length + condicion.length > 0 && (
                <p className="text-gray-400 text-sm mt-1">Prueba removiendo algún filtro</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.data.map((p) => <OfertaCard key={`${p.id}-${p.cadena}`} p={p} />)}
              </div>
              <Pagination
                page={page} pages={results.pages}
                cat={cat} sub={sub} lab={lab} fuente={fuente}
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

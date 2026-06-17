import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Package, Building2 } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import { unslugifySearch } from "@/lib/search";
import { PRECIOS_JOIN, DESCUENTOS_JOIN, getOrderClause } from "@/lib/query-helpers";
import OrdenSelect from "./OrdenSelect";

const SITE = "https://mediofertas.co";
export const revalidate = 43200;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string; orden?: string }>;
}

interface ProductoRow {
  id: number; slug: string | null; nombre: string;
  laboratorio: string | null; concentracion: string | null;
  forma_farmaceutica: string | null; imagen_url: string | null;
  precio_min: number | null; precio_max: number | null;
  max_descuento: number | null;
}

const getLaboratorioNombre = cache(async function getLaboratorioNombre(slug: string): Promise<string | null> {
  const term = unslugifySearch(slug);
  const rows = await prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
    `SELECT laboratorio FROM maestro_productos
     WHERE unaccent(lower(laboratorio)) = unaccent(lower($1))
     LIMIT 1`,
    term
  );
  if (rows[0]) return rows[0].laboratorio;
  const rows2 = await prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
    `SELECT laboratorio FROM maestro_productos
     WHERE unaccent(laboratorio) ILIKE unaccent($1)
     LIMIT 1`,
    `%${term}%`
  );
  return rows2[0]?.laboratorio ?? null;
});

async function getProductosLaboratorio(nombre: string, page: number, limit: number, orden: string) {
  const offset = (page - 1) * limit;
  const orderClause = getOrderClause(orden);

  const [data, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<ProductoRow[]>(
      `SELECT * FROM (
         SELECT DISTINCT ON (mp.id)
           mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.concentracion, mp.forma_farmaceutica,
           CASE WHEN cb.ean IS NOT NULL THEN '/api/imagen/' || cb.ean ELSE NULL END AS imagen_url,
           precios.precio_min::float, precios.precio_max::float,
           precios.max_descuento
         FROM maestro_productos mp
         LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
         ${PRECIOS_JOIN}
         ${DESCUENTOS_JOIN}
         WHERE unaccent(mp.laboratorio) ILIKE unaccent($1)
         ORDER BY mp.id
       ) inner_q
       ${orderClause}
       LIMIT $2 OFFSET $3`,
      `%${nombre}%`, limit, offset
    ),
    prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*)::text AS total
       FROM maestro_productos mp
       WHERE unaccent(mp.laboratorio) ILIKE unaccent($1)`,
      `%${nombre}%`
    ),
  ]);

  const total = parseInt(countRows[0]?.total ?? "0", 10);
  return { data, total, pages: Math.ceil(total / limit) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const nombre = await getLaboratorioNombre(slug);
  if (!nombre) return { title: "Laboratorio no encontrado" };

  const canonical   = `${SITE}/laboratorio/${slug}`;
  const title       = `Medicamentos de ${nombre} — Precios y ofertas | MediOfertas`;
  const description = `Compara precios de todos los medicamentos fabricados por ${nombre}. Encuentra las mejores ofertas y ahorra en tu próxima compra.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: "website", siteName: "MediOfertas",
      images: [{ url: `${SITE}/og-default.png`, width: 1200, height: 630, alt: nombre }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LaboratorioPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp        = await searchParams;

  const nombre = await getLaboratorioNombre(slug);
  if (!nombre) notFound();

  const page  = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = [12, 24, 48].includes(parseInt(sp.limit ?? "24")) ? parseInt(sp.limit ?? "24") : 24;
  const orden = sp.orden ?? "precio_asc";

  const { data, total, pages } = await getProductosLaboratorio(nombre!, page, limit, orden);
  const basePath = `/laboratorio/${slug}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-600">{nombre}</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-500">{nombre}</h1>
          {total > 0 && (
            <p className="hidden md:block text-sm text-gray-400">
              {total.toLocaleString("es-CO")} producto{total !== 1 ? "s" : ""} disponibles
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <span className="hidden md:inline text-sm text-gray-500">
          {pages > 1 && `Página ${page} de ${pages}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ordenar:</span>
          <OrdenSelect defaultValue={orden} basePath={basePath} limit={limit} />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No encontramos productos para este laboratorio.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {pages > 1 && (
            <nav className="flex justify-center gap-1 mt-10">
              {page > 1 && (
                <Link href={`${basePath}?page=${page - 1}&limit=${limit}&orden=${orden}`}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  ← Anterior
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                {page} / {pages}
              </span>
              {page < pages && (
                <Link href={`${basePath}?page=${page + 1}&limit=${limit}&orden=${orden}`}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

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
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">{p.nombre}</p>
        <p className="text-xs text-gray-400 truncate">{[p.laboratorio, p.concentracion].filter(Boolean).join(" · ")}</p>
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

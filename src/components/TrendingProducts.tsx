import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import TrendingCard, { type TrendingProducto } from "./TrendingCard";

const SQL = `
  WITH pesos AS (
    SELECT
      pt.producto_id,
      SUM(pt.clics * CASE
        WHEN pt.semana = date_trunc('week', NOW())::date                           THEN 4
        WHEN pt.semana = date_trunc('week', NOW() - '7 days'::interval)::date     THEN 3
        WHEN pt.semana = date_trunc('week', NOW() - '14 days'::interval)::date    THEN 2
        ELSE 1
      END)::int AS score
    FROM product_trends pt
    WHERE pt.semana >= date_trunc('week', NOW() - '21 days'::interval)::date
    GROUP BY pt.producto_id
  ),
  precios_actuales AS (
    SELECT
      p.ean,
      MIN(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_min,
      MAX(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_max
    FROM precios p
    WHERE COALESCE(p.precio_oferta, p.precio_costo) IS NOT NULL
      AND COALESCE(p.precio_oferta, p.precio_costo) > 0
      AND p.fecha_revision >= NOW() - INTERVAL '7 days'
    GROUP BY p.ean
  )
  SELECT
    mp.id,
    mp.slug,
    mp.nombre,
    mp.laboratorio,
    cb.ean,
    '/api/imagen/' || cb.ean AS imagen_url,
    pa.precio_min,
    pa.precio_max,
    p.score
  FROM pesos p
  JOIN maestro_productos mp ON mp.id = p.producto_id AND mp.excluido = false
  JOIN codigos_barras cb ON cb.producto_id = mp.id
  JOIN precios_actuales pa ON pa.ean = cb.ean
  ORDER BY p.score DESC
  LIMIT 8
`;

const getTopTrending = unstable_cache(
  async (): Promise<TrendingProducto[]> => {
    try {
      const rows = await prisma.$queryRawUnsafe<TrendingProducto[]>(SQL);
      return rows;
    } catch (err) {
      console.error("[TrendingProducts]", err);
      return [];
    }
  },
  ["trending-top"],
  { revalidate: 300 } // refresca cada 5 minutos
);

export default async function TrendingProducts() {
  const productos = await getTopTrending();

  if (productos.length === 0) return null;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-500">
            Comparaciones más buscadas
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Los medicamentos donde más ahorran nuestros usuarios esta semana
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p, i) => (
            <TrendingCard key={p.id} producto={p} rank={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

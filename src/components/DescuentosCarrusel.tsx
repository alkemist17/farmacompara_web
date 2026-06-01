import Image from "next/image";
import Link from "next/link";
import { Package, TrendingDown } from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import CarruselSlider from "@/components/CarruselSlider";

interface ProductoDescuento {
  id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  ean: string | null;
  imagen_url: string | null;
  cadena: string;
  precio_costo: number;
  precio_oferta: number;
  descuento_pct: number;
  ahorro: number;
}

const SQL = `
  WITH mejores AS (
    SELECT DISTINCT ON (mp.id)
      mp.id,
      mp.slug,
      mp.nombre,
      mp.laboratorio,
      cb.ean,
      CASE WHEN cb.ean IS NOT NULL
        THEN '/api/imagen/' || cb.ean
        ELSE NULL
      END AS imagen_url,
      f.nombre AS cadena,
      p.precio_costo::float,
      p.precio_oferta::float,
      ROUND(((p.precio_costo - p.precio_oferta) / p.precio_costo) * 100)::int AS descuento_pct,
      (p.precio_costo - p.precio_oferta)::float AS ahorro
    FROM precios p
    JOIN codigos_barras cb  ON cb.ean   = p.ean
    JOIN maestro_productos mp ON mp.id  = cb.producto_id
    JOIN fuentes f            ON f.id   = p.fuente_id
    WHERE p.precio_oferta IS NOT NULL
      AND p.precio_costo  IS NOT NULL
      AND p.precio_costo  >  p.precio_oferta
      AND mp.slug IS NOT NULL
      AND p.fecha_revision >= NOW() - INTERVAL '48 hours'
    ORDER BY mp.id,
             ROUND(((p.precio_costo - p.precio_oferta) / p.precio_costo) * 100) DESC
  )
  SELECT * FROM mejores
  ORDER BY descuento_pct DESC
  LIMIT 12
`;

const getMejoresDescuentos = unstable_cache(
  async (): Promise<ProductoDescuento[]> => {
    try {
      return await prisma.$queryRawUnsafe<ProductoDescuento[]>(SQL);
    } catch (err) {
      console.error("[DescuentosCarrusel]", err);
      return [];
    }
  },
  ["descuentos-carrusel"],
  { revalidate: 600 } // refresca cada 10 minutos
);

export default async function DescuentosCarrusel() {
  const rows = await getMejoresDescuentos();
  if (rows.length === 0) return null;

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">

        {/* Encabezado */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-4 h-4 text-accent-500" />
              <span className="text-xs font-bold text-accent-500 uppercase tracking-widest">
                Actualizado hoy
              </span>
            </div>
            <h2 className="text-2xl font-bold text-secondary-500">
              Mayores descuentos del día
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Los precios que más han bajado en el último escaneo
            </p>
          </div>
          <Link
            href="/ofertas"
            className="shrink-0 text-primary-500 text-sm font-semibold hover:underline"
          >
            Ver todas las ofertas →
          </Link>
        </div>

        {/* Carrusel */}
        <CarruselSlider>
          {rows.map((p) => (
            <Link
              key={`${p.id}-${p.cadena}`}
              href={`/producto/${p.slug}`}
              className="snap-start shrink-0 w-52 flex flex-col bg-white border border-gray-100
                         rounded-2xl shadow-md shadow-gray-200/80 hover:shadow-xl hover:shadow-primary-500/15
                         hover:border-primary-100 hover:scale-[1.03] transition-all duration-200 overflow-hidden"
            >
              {/* Imagen + badge */}
              <div className="relative h-44 bg-white flex items-center justify-center border-b border-gray-100">
                {p.imagen_url ? (
                  <Image
                    src={p.imagen_url}
                    alt={p.nombre}
                    width={208}
                    height={176}
                    className="w-full h-full object-contain p-3"
                    unoptimized
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-200" />
                )}
                <span className="absolute top-2 right-2 bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{p.descuento_pct}%
                </span>
              </div>

              {/* Nombre + cadena */}
              <div className="flex flex-col flex-1 px-3 pt-3 pb-1 gap-0.5">
                <p className="text-[11px] text-gray-400 font-medium truncate">{p.cadena}</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {p.nombre}
                </p>
              </div>

              {/* Precios */}
              <div className="px-3 pb-4 mt-2">
                <p className="text-xs text-gray-400 line-through">
                  {formatCOP(p.precio_costo)}
                </p>
                <p className="text-lg font-bold text-primary-600 leading-tight">
                  {formatCOP(p.precio_oferta)}
                </p>
                <p className="text-xs font-semibold text-accent-600 mt-0.5">
                  Ahorras {formatCOP(p.ahorro)}
                </p>
              </div>
            </Link>
          ))}
        </CarruselSlider>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Lightbulb, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import CarruselSlider from "@/components/CarruselSlider";

interface Alternativa {
  id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  ean: string | null;
  imagen_url: string | null;
  cadena: string;
  precio_minimo: number;
  precio_costo: number | null;
  precio_oferta: number | null;
}

const SQL = `
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
    COALESCE(p.precio_oferta, p.precio_costo)::float AS precio_minimo,
    p.precio_costo::float  AS precio_costo,
    p.precio_oferta::float AS precio_oferta
  FROM maestro_productos mp
  JOIN codigos_barras cb ON cb.producto_id = mp.id
  JOIN precios p ON p.ean = cb.ean
  JOIN fuentes f ON f.id = p.fuente_id
  WHERE LOWER(mp.principio_activo) = LOWER($1)
    AND LOWER(mp.concentracion)    = LOWER($2)
    AND mp.slug != $3
    AND mp.slug IS NOT NULL
    AND COALESCE(p.precio_oferta, p.precio_costo) IS NOT NULL
    AND p.fecha_revision >= NOW() - INTERVAL '7 days'
  ORDER BY mp.id, COALESCE(p.precio_oferta, p.precio_costo) ASC
  LIMIT 12
`;

interface Props {
  principioActivo: string;
  concentracion: string;
  viaAdministracion?: string | null;
  currentSlug: string;
}

export default async function AlternativasEconomicas({ principioActivo, concentracion, viaAdministracion, currentSlug }: Props) {
  let rows: Alternativa[] = [];
  try {
    rows = await prisma.$queryRawUnsafe<Alternativa[]>(SQL, principioActivo, concentracion, currentSlug);
  } catch {
    return null;
  }
  if (rows.length === 0) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4 text-emerald-500" />
          <h2 className="text-lg font-bold text-emerald-600">
            Alternativas equivalentes
          </h2>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">
          Productos equivalentes con{" "}
          <span className="font-medium">
            {principioActivo.charAt(0).toUpperCase() + principioActivo.slice(1).toLowerCase()}
            {concentracion ? ` ${concentracion}` : ""}
            {viaAdministracion ? ` · ${viaAdministracion.charAt(0).toUpperCase() + viaAdministracion.slice(1).toLowerCase()}` : ""}
          </span>
        </p>
      </div>

      <div className="px-4 py-5">
        <CarruselSlider>
          {rows.map((p) => {
            const tieneOferta = p.precio_oferta != null && p.precio_costo != null && p.precio_oferta < p.precio_costo;
            return (
              <Link
                key={`${p.id}-${p.cadena}`}
                href={`/producto/${p.slug}`}
                className="snap-start shrink-0 w-48 flex flex-col bg-white border border-gray-100
                           rounded-2xl shadow-sm hover:shadow-lg hover:shadow-emerald-500/10
                           hover:border-emerald-100 transition-all overflow-hidden"
              >
                {/* Imagen */}
                <div className="relative h-40 bg-white flex items-center justify-center border-b border-gray-100">
                  {p.imagen_url ? (
                    <Image
                      src={p.imagen_url}
                      alt={p.nombre}
                      width={192}
                      height={160}
                      className="w-full h-full object-contain p-3"
                      unoptimized
                    />
                  ) : (
                    <Package className="w-10 h-10 text-gray-200" />
                  )}
                  {tieneOferta && (
                    <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      Oferta
                    </span>
                  )}
                </div>

                {/* Nombre + laboratorio */}
                <div className="flex flex-col flex-1 px-3 pt-3 pb-1 gap-0.5 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {p.nombre}
                  </p>
                  {p.laboratorio && (
                    <p className="text-[11px] text-secondary-400 truncate mt-0.5 font-medium">{p.laboratorio}</p>
                  )}
                </div>

                {/* Precio */}
                <div className="px-3 pb-4 bg-gray-50 rounded-b-2xl">
                  {tieneOferta && p.precio_costo && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatCOP(p.precio_costo)}
                    </p>
                  )}
                  <p className="text-lg font-bold text-emerald-600 leading-tight">
                    {formatCOP(p.precio_minimo)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">desde · {p.cadena}</p>
                </div>
              </Link>
            );
          })}
        </CarruselSlider>
      </div>
    </section>
  );
}

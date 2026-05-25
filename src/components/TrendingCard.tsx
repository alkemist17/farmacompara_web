import Image from "next/image";
import Link from "next/link";
import { Package, TrendingDown } from "lucide-react";
import { formatCOP } from "@/lib/format";

export interface TrendingProducto {
  id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  ean: string | null;
  imagen_url: string | null;
  precio_min: number | null;
  precio_max: number | null;
  score: number;
}

interface Props {
  producto: TrendingProducto;
  rank: number;
}

export default function TrendingCard({ producto, rank }: Props) {
  const { slug, nombre, laboratorio, imagen_url, precio_min, precio_max } = producto;

  const savingsPct =
    precio_min && precio_max && precio_max > precio_min
      ? Math.round(((precio_max - precio_min) / precio_max) * 100)
      : null;

  const badge = rank <= 3 ? "🔥 Tendencia" : "👁️ Más buscado";
  const badgeColor = rank <= 3
    ? "bg-orange-500 text-white"
    : "bg-primary-100 text-primary-700";

  return (
    <Link
      href={`/producto/${slug}`}
      className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 transition-all overflow-hidden flex flex-col"
    >
      {/* Badge flotante */}
      <span
        className={`absolute top-2 left-2 z-10 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
      >
        {badge}
      </span>

      {/* Imagen cuadrada */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
        {imagen_url ? (
          <Image
            src={imagen_url}
            alt={nombre}
            width={120}
            height={120}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <Package className="w-12 h-12 text-gray-200" />
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-3 gap-1.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
          {nombre}
        </p>
        {laboratorio && (
          <p className="text-xs text-gray-400 truncate">{laboratorio}</p>
        )}

        <div className="mt-auto pt-2">
          {precio_min != null ? (
            <>
              <p className="text-[11px] text-gray-400 leading-none">Desde</p>
              <p className="text-base font-bold text-primary-600 leading-tight">
                {formatCOP(precio_min)}
              </p>
              {precio_max != null && precio_max > precio_min && (
                <p className="text-[11px] text-gray-400">
                  hasta {formatCOP(precio_max)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-300 italic">Sin precio disponible</p>
          )}

          {savingsPct != null && savingsPct >= 10 && (
            <span className="inline-flex items-center gap-1 mt-1.5 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3" />
              Ahorra hasta {savingsPct}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

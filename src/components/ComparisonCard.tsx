import Image from "next/image";
import { TrendingDown, CheckCircle, AlertCircle, XCircle, Package } from "lucide-react";
import type { MedicationComparison } from "@/types";
import { formatCOP } from "@/lib/mock-data";
import clsx from "clsx";

const stockConfig = {
  disponible:  { icon: CheckCircle,   label: "Disponible",   className: "text-primary-500" },
  bajo_stock:  { icon: AlertCircle,   label: "Bajo stock",   className: "text-amber-500"   },
  agotado:     { icon: XCircle,       label: "Agotado",      className: "text-red-400"     },
} as const;

interface Props {
  comparison: MedicationComparison;
}

export default function ComparisonCard({ comparison }: Props) {
  const { medication, prices, lowestPrice, maxSavings } = comparison;
  const savingsPct = Math.round((maxSavings / comparison.highestPrice) * 100);

  return (
    <article className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/10 transition-shadow overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start gap-3">
          {/* Imagen del producto */}
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
            {medication.imageUrl ? (
              <Image
                src={medication.imageUrl}
                alt={medication.name}
                width={64}
                height={64}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <Package className="w-7 h-7 text-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{medication.name}</h3>
              {/* Badge ahorro máximo */}
              <span className="shrink-0 inline-flex items-center gap-1 bg-accent-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" />
                -{savingsPct}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{medication.laboratory} · {medication.category}</p>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary-500">{formatCOP(lowestPrice)}</span>
          <span className="text-xs text-gray-400">precio más bajo</span>
        </div>
        <p className="text-xs text-accent-600 font-medium mt-0.5">
          Ahorras hasta {formatCOP(maxSavings)} frente al más caro
        </p>
      </div>

      {/* Tabla de precios */}
      <ul className="divide-y divide-gray-50">
        {prices.map((p) => {
          const stock = stockConfig[p.stock];
          const StockIcon = stock.icon;
          return (
            <li
              key={p.pharmacyId}
              className={clsx(
                "flex items-center gap-3 px-5 py-3",
                p.isLowestPrice && "bg-primary-50"
              )}
            >
              {p.isLowestPrice && (
                <span className="shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full" />
              )}
              {!p.isLowestPrice && <span className="shrink-0 w-1.5 h-1.5" />}

              <div className="flex-1 min-w-0">
                <p className={clsx("text-sm font-semibold truncate", p.isLowestPrice ? "text-primary-700" : "text-gray-700")}>
                  {p.pharmacyName}
                </p>
                <p className="text-xs text-gray-400 truncate">{p.address}</p>
              </div>

              <StockIcon className={clsx("w-3.5 h-3.5 shrink-0", stock.className)} />

              <span className={clsx("text-sm font-bold shrink-0", p.isLowestPrice ? "text-primary-600" : "text-gray-600")}>
                {formatCOP(p.price)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="px-5 py-3 bg-gray-50">
        <button className="w-full text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Ver comparación completa →
        </button>
      </div>
    </article>
  );
}

"use client";

import { useRouter } from "next/navigation";

interface Props {
  basePath: string;
  currentParams: Record<string, string[]>;
  limit: number;
  orden: string;
  totalLabel?: string;
}

const LIMIT_OPTIONS  = [12, 24, 48];
const ORDEN_OPTIONS  = [
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "descuento",  label: "Mayor descuento (%)"   },
  { value: "popular",    label: "Más buscados"          },
];

export default function FilterToolbar({ basePath, currentParams, limit, orden, totalLabel }: Props) {
  const router = useRouter();

  function buildUrl(newLimit: number, newOrden: string) {
    const p = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, vals]) => {
      vals.forEach((v) => p.append(k, v));
    });
    p.set("limit", String(newLimit));
    p.set("orden", newOrden);
    p.set("page", "1");
    return `${basePath}?${p.toString()}`;
  }

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {/* Mostrar */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400">Mostrar:</span>
        <div className="flex items-center gap-1">
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => router.push(buildUrl(n, orden))}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                limit === n
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Conteo — crece para empujar Ordenar a la derecha */}
      {totalLabel && (
        <span className="flex-1 text-xs text-gray-400 text-center">{totalLabel}</span>
      )}

      {/* Ordenar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Ordenar:</span>
        <select
          value={orden}
          onChange={(e) => router.push(buildUrl(limit, e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
        >
          {ORDEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

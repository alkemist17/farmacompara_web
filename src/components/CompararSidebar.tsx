"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import FilterGroup from "@/components/FilterGroup";

interface FlatGroup {
  key: string;
  label: string;
  options: string[];
}

interface Props {
  groups: FlatGroup[];
  selected: Record<string, string[]>;
  /** basePath e.g. "/medicamento/ibuprofeno" o "/comparar" */
  basePath: string;
  /** solo para /comparar legado que aún usa ?q= */
  query?: string;
  condicion: string[];
  precioMin: number | null;
  precioMax: number | null;
  globalPrecioMin: number;
  globalPrecioMax: number;
  limit: number;
  orden: string;
}

const CONDICION_OPTIONS = [
  { value: "VENTA LIBRE",    label: "Venta Libre (OTC)"       },
  { value: "FORMULA MEDICA", label: "Requiere Fórmula Médica"  },
];

export default function CompararSidebar({
  groups, selected, basePath, query, condicion, precioMin, precioMax,
  globalPrecioMin, globalPrecioMax, limit, orden,
}: Props) {
  const router = useRouter();

  const [condicionExpanded, setCondicionExpanded] = useState(true);
  const [precioExpanded,    setPrecioExpanded]    = useState(true);

  const totalActive =
    Object.values(selected).flat().length +
    condicion.length +
    (precioMin != null ? 1 : 0) +
    (precioMax != null ? 1 : 0);

  function buildUrl(
    newSelected: Record<string, string[]>,
    newCondicion: string[],
    pMin: number | null,
    pMax: number | null,
  ) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("page", "1");
    p.set("limit", String(limit));
    p.set("orden", orden);
    Object.entries(newSelected).forEach(([key, vals]) => vals.forEach((v) => p.append(key, v)));
    newCondicion.forEach((v) => p.append("condicion", v));
    if (pMin != null) p.set("precioMin", String(pMin));
    if (pMax != null) p.set("precioMax", String(pMax));
    return `${basePath}?${p.toString()}`;
  }

  function toggleGroup(key: string, value: string) {
    const curr = selected[key] ?? [];
    const next = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    router.push(buildUrl({ ...selected, [key]: next }, condicion, precioMin, precioMax));
  }

  function toggleCondicion(value: string) {
    const next = condicion.includes(value)
      ? condicion.filter((v) => v !== value)
      : [...condicion, value];
    router.push(buildUrl(selected, next, precioMin, precioMax));
  }

  const handlePriceRelease = useCallback((min: number | null, max: number | null) => {
    router.push(buildUrl(selected, condicion, min, max));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, condicion, query, limit, orden, basePath]);

  function clearAll() {
    const p = new URLSearchParams({ page: "1", limit: String(limit), orden });
    if (query) p.set("q", query);
    router.push(`${basePath}?${p.toString()}`);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <span className="text-sm font-bold text-gray-700">Filtros</span>
        {totalActive > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar ({totalActive})
          </button>
        )}
      </div>

      {groups.map((group) => (
        <FilterGroup
          key={group.key}
          label={group.label}
          options={group.options}
          selected={selected[group.key] ?? []}
          onToggle={(v) => toggleGroup(group.key, v)}
        />
      ))}

      {/* Condición de venta */}
      <div className="border-b border-gray-50">
        <button
          onClick={() => setCondicionExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Condición de venta
            {condicion.length > 0 && (
              <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {condicion.length}
              </span>
            )}
          </span>
          {condicionExpanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {condicionExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {CONDICION_OPTIONS.map(({ value, label }) => {
              const checked = condicion.includes(value);
              return (
                <label key={value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCondicion(value)}
                    className="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer shrink-0"
                  />
                  <span className={`text-xs leading-snug ${checked ? "text-primary-700 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Rango de precio */}
      <div className="border-b border-gray-50 last:border-0">
        <button
          onClick={() => setPrecioExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Rango de precio
            {(precioMin != null || precioMax != null) && (
              <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>
            )}
          </span>
          {precioExpanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {precioExpanded && (
          <div className="px-4 pb-4">
            <PriceRangeSlider
              globalMin={globalPrecioMin}
              globalMax={globalPrecioMax}
              currentMin={precioMin}
              currentMax={precioMax}
              onRelease={handlePriceRelease}
            />
          </div>
        )}
      </div>
    </div>
  );
}

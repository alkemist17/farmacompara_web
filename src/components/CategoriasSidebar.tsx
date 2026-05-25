"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import { CATEGORIAS } from "@/lib/categorias";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import FilterGroup from "@/components/FilterGroup";

interface FlatGroup {
  key: string;
  label: string;
  options: string[];
}

interface Props {
  currentCat: string;
  selectedSubs: string[];
  otherGroups: FlatGroup[];
  otherSelected: Record<string, string[]>;
  basePath: string;
  condicion: string[];
  precioMin: number | null;
  precioMax: number | null;
  globalPrecioMin: number;
  globalPrecioMax: number;
  extraPreserve?: Record<string, string>;
}

const CONDICION_OPTIONS = [
  { value: "VENTA LIBRE",    label: "Venta Libre (OTC)"     },
  { value: "FORMULA MEDICA", label: "Requiere Fórmula Médica" },
];

export default function CategoriasSidebar({
  currentCat, selectedSubs, otherGroups, otherSelected, basePath,
  condicion, precioMin, precioMax, globalPrecioMin, globalPrecioMax,
  extraPreserve = {},
}: Props) {
  const router = useRouter();

  const [condicionExpanded, setCondicionExpanded] = useState(true);
  const [precioExpanded, setPrecioExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalActive =
    selectedSubs.length +
    condicion.length +
    (precioMin != null ? 1 : 0) +
    (precioMax != null ? 1 : 0) +
    Object.values(otherSelected).flat().length;

  function buildUrl(
    subs: string[],
    cond: string[],
    pMin: number | null,
    pMax: number | null,
    other: Record<string, string[]>,
  ) {
    const p = new URLSearchParams();
    p.set("page", "1");
    subs.forEach((v) => p.append("sub", v));
    cond.forEach((v) => p.append("condicion", v));
    if (pMin != null) p.set("precioMin", String(pMin));
    if (pMax != null) p.set("precioMax", String(pMax));
    Object.entries(other).forEach(([key, vals]) => vals.forEach((v) => p.append(key, v)));
    Object.entries(extraPreserve).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `${basePath}?${p.toString()}`;
  }

  function toggleSub(slug: string) {
    const next = selectedSubs.includes(slug)
      ? selectedSubs.filter((v) => v !== slug)
      : [...selectedSubs, slug];
    router.push(buildUrl(next, condicion, precioMin, precioMax, otherSelected));
  }

  function toggleCondicion(value: string) {
    const next = condicion.includes(value)
      ? condicion.filter((v) => v !== value)
      : [...condicion, value];
    router.push(buildUrl(selectedSubs, next, precioMin, precioMax, otherSelected));
  }

  function toggleOther(key: string, value: string) {
    const curr = otherSelected[key] ?? [];
    const next = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
    router.push(buildUrl(selectedSubs, condicion, precioMin, precioMax, { ...otherSelected, [key]: next }));
  }

  const handlePriceRelease = useCallback((min: number | null, max: number | null) => {
    router.push(buildUrl(selectedSubs, condicion, min, max, otherSelected));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubs, condicion, otherSelected, basePath, extraPreserve]);

  function clearAll() {
    const p = new URLSearchParams({ page: "1" });
    Object.entries(extraPreserve).forEach(([k, v]) => { if (v) p.set(k, v); });
    router.push(`${basePath}?${p.toString()}`);
  }

  const panel = (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
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

      {/* Category nav tree */}
      <div className="border-b border-gray-50">
        <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Categorías
        </p>

        {CATEGORIAS.map((cat) => {
          const isCurrent = cat.slug === currentCat;

          if (isCurrent) {
            return (
              <div key={cat.slug}>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border-l-2 border-primary-400">
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="text-xs font-semibold text-primary-700 flex-1 leading-tight">
                    {cat.labelCorto}
                  </span>
                </div>
                {cat.subs.length > 0 && (
                  <div className="pl-6 py-1 space-y-0.5 border-l-2 border-primary-100 ml-4">
                    {cat.subs.map((sub) => {
                      const checked = selectedSubs.includes(sub.slug);
                      return (
                        <label
                          key={sub.slug}
                          className="flex items-center gap-2 py-1 px-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSub(sub.slug)}
                            className="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer shrink-0"
                          />
                          <span className={`text-xs leading-snug ${checked ? "text-primary-700 font-medium" : "text-gray-500 group-hover:text-gray-700"}`}>
                            {sub.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors group"
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="text-xs text-gray-500 group-hover:text-gray-800 transition-colors flex-1 leading-tight">
                {cat.labelCorto}
              </span>
            </Link>
          );
        })}
        <div className="pb-1" />
      </div>

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
          {condicionExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
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

      {/* Rango de precios */}
      <div className="border-b border-gray-50">
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
          {precioExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
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

      {/* Other groups: lab, fuente */}
      {otherGroups.map((group) => (
        <FilterGroup
          key={group.key}
          label={group.label}
          options={group.options}
          selected={otherSelected[group.key] ?? []}
          onToggle={(v) => toggleOther(group.key, v)}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{panel}</div>
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-primary-500" />
          Filtros
          {totalActive > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {totalActive}
            </span>
          )}
          {mobileOpen
            ? <ChevronUp className="w-4 h-4 ml-auto" />
            : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
        {mobileOpen && <div className="mt-2">{panel}</div>}
      </div>
    </>
  );
}

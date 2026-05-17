"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";

export interface FilterGroup {
  key: string;
  label: string;
  options: string[];
}

interface Props {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  baseQ: string;
}

export default function FiltersPanel({ groups, selected, baseQ }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.key, true]))
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalActive = Object.values(selected).flat().length;

  function buildUrl(newSelected: Record<string, string[]>) {
    const params = new URLSearchParams();
    if (baseQ) params.set("q", baseQ);
    params.set("page", "1");
    Object.entries(newSelected).forEach(([key, values]) => {
      values.forEach((v) => params.append(key, v));
    });
    return `/comparar?${params.toString()}`;
  }

  function toggle(groupKey: string, value: string) {
    const current = selected[groupKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    router.push(buildUrl({ ...selected, [groupKey]: next }));
  }

  function clearAll() {
    router.push(buildUrl(Object.fromEntries(groups.map((g) => [g.key, []]))));
  }

  const panel = (
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

      {groups.map((group) => {
        const activeCount = selected[group.key]?.length ?? 0;
        return (
          <div key={group.key} className="border-b border-gray-50 last:border-0">
            <button
              onClick={() => setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {group.label}
                {activeCount > 0 && (
                  <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </span>
              {expanded[group.key]
                ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {expanded[group.key] && (
              <div className="px-4 pb-3 max-h-52 overflow-y-auto space-y-2">
                {group.options.length === 0 && (
                  <p className="text-xs text-gray-300 italic">Sin opciones</p>
                )}
                {group.options.map((opt) => {
                  const checked = selected[group.key]?.includes(opt) ?? false;
                  return (
                    <label key={opt} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(group.key, opt)}
                        className="mt-0.5 w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer shrink-0"
                      />
                      <span className={`text-xs leading-snug ${
                        checked ? "text-primary-700 font-medium" : "text-gray-600 group-hover:text-gray-900"
                      }`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop: siempre visible */}
      <div className="hidden md:block">{panel}</div>

      {/* Mobile: colapsable */}
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
          {mobileOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
        {mobileOpen && <div className="mt-2">{panel}</div>}
      </div>
    </>
  );
}

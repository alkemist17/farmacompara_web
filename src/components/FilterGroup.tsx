"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

const SEARCH_THRESHOLD = 8;
const INITIAL_SHOW = 6;

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  defaultExpanded?: boolean;
}

export default function FilterGroup({
  label, options, selected, onToggle, defaultExpanded = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch]     = useState("");
  const [showAll, setShowAll]   = useState(false);

  const showSearch = options.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const sorted = useMemo(() => {
    const sel  = filtered.filter((o) =>  selected.includes(o));
    const rest = filtered.filter((o) => !selected.includes(o));
    return [...sel, ...rest];
  }, [filtered, selected]);

  const visible     = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);
  const hiddenCount = sorted.length - INITIAL_SHOW;

  return (
    <div className="border-b border-gray-50">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
          {selected.length > 0 && (
            <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {showSearch && (
            <div className="relative mb-2.5">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
                placeholder={`Buscar ${label.toLowerCase()}…`}
                className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:bg-white placeholder:text-gray-300 transition-colors"
              />
            </div>
          )}

          <div className="space-y-2">
            {visible.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Sin resultados</p>
            ) : (
              visible.map((opt) => {
                const checked = selected.includes(opt);
                return (
                  <label key={opt} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(opt)}
                      className="mt-0.5 w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer shrink-0"
                    />
                    <span
                      title={opt}
                      className={`text-xs leading-snug line-clamp-2 ${
                        checked
                          ? "text-primary-700 font-medium"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {opt}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Ver {hiddenCount} más…
            </button>
          )}
          {showAll && sorted.length > INITIAL_SHOW && (
            <button
              onClick={() => { setShowAll(false); setSearch(""); }}
              className="mt-2.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Ver menos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

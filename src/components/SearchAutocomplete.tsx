"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FlaskConical, Building2, Barcode, Pill } from "lucide-react";
import Image from "next/image";
import type { BuscarResultado } from "@/app/api/buscar/route";
import { formatCOP } from "@/lib/format";
import clsx from "clsx";

const CAMPO_ICON = {
  nombre:           Pill,
  principio_activo: FlaskConical,
  laboratorio:      Building2,
  ean:              Barcode,
} as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function PriceRange({ min, max, ultimo }: {
  min: string | null;
  max: string | null;
  ultimo: string | null;
}) {
  if (!min && !ultimo) return null;

  const minNum   = min   ? parseFloat(min)   : null;
  const maxNum   = max   ? parseFloat(max)   : null;
  const hayRango = minNum != null && maxNum != null && maxNum > minNum;

  return (
    <div className="shrink-0 text-right leading-tight">
      <p className="text-[15px] font-bold text-primary-600">
        {formatCOP(minNum)}
      </p>
      {hayRango && (
        <p className="text-[14px] text-gray-400">
          hasta {formatCOP(maxNum)}
        </p>
      )}
    </div>
  );
}

export default function SearchAutocomplete() {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<BuscarResultado[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const router         = useRouter();
  const inputRef       = useRef<HTMLInputElement>(null);
  const listRef        = useRef<HTMLUListElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/buscar?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: BuscarResultado[]) => {
        if (!cancelled) {
          setResults(data);
          setOpen(data.length > 0);
          setActiveIdx(-1);
        }
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const goToProduct = useCallback((item: BuscarResultado) => {
    setOpen(false);
    setQuery(item.nombre);
    router.push(`/comparar?q=${encodeURIComponent(item.nombre)}&id=${item.id}`);
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        goToProduct(results[activeIdx]);
      } else if (query.trim().length >= 3) {
        setOpen(false);
        router.push(`/comparar?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 3) {
      setOpen(false);
      router.push(`/comparar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {loading
            ? <Loader2 className="w-5 h-5 text-primary-400 ml-4 flex-shrink-0 animate-spin" />
            : <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="Nombre, principio activo, laboratorio o EAN…"
            className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-400 outline-none text-base"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-listbox"
            role="combobox"
          />
          <button
            type="submit"
            className="m-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 disabled:opacity-50"
            disabled={query.trim().length < 3}
          >
            Comparar
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <ul
          id="search-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 overflow-hidden max-h-96 overflow-y-auto"
        >
          {results.map((item, idx) => {
            const Icon     = CAMPO_ICON[item.match_campo];
            const isActive = idx === activeIdx;

            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isActive}
                onClick={() => goToProduct(item)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0",
                  isActive ? "bg-primary-50" : "hover:bg-gray-50"
                )}
              >
                {/* Thumbnail 52px (~30% más grande que 40px) */}
                <div className={clsx(
                  "flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center",
                  "w-[52px] h-[52px]",
                  item.imagen_url ? "bg-gray-50 border border-gray-100" : (isActive ? "bg-primary-100" : "bg-gray-100")
                )}>
                  {item.imagen_url ? (
                    <Image
                      src={item.imagen_url}
                      alt={item.nombre}
                      width={52}
                      height={52}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <Icon className={clsx("w-5 h-5", isActive ? "text-primary-600" : "text-gray-400")} />
                  )}
                </div>

                {/* Texto — alineado a la izquierda */}
                <div className="flex-1 min-w-0 text-left">
                  <p className={clsx(
                    "text-sm font-semibold leading-snug line-clamp-2",
                    isActive ? "text-primary-700" : "text-gray-900"
                  )}>
                    {item.nombre}
                  </p>

                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {item.laboratorio && (
                      <span className="text-xs text-gray-400">{item.laboratorio}</span>
                    )}
                    {item.concentracion && (
                      <>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400">{item.concentracion}</span>
                      </>
                    )}
                    {item.forma_farmaceutica && (
                      <>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400">{item.forma_farmaceutica}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Precio mín – máx del scrapper */}
                <PriceRange
                  min={item.precio_min}
                  max={item.precio_max}
                  ultimo={item.precio_ultimo}
                />
              </li>
            );
          })}
        </ul>
      )}

      {query.length > 0 && query.length < 3 && (
        <p className="mt-2 text-center text-white/60 text-xs">
          Escribe al menos 3 letras para buscar
        </p>
      )}
    </div>
  );
}

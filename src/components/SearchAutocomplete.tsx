"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FlaskConical, Building2, Barcode, Pill } from "lucide-react";
import Image from "next/image";
import type { BuscarResultado } from "@/app/api/buscar/route";
import clsx from "clsx";

const CAMPO_CONFIG = {
  nombre:           { icon: Pill,         label: "Producto"         },
  principio_activo: { icon: FlaskConical, label: "Principio activo" },
  laboratorio:      { icon: Building2,    label: "Laboratorio"      },
  ean:              { icon: Barcode,      label: "Código EAN"       },
} as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchAutocomplete() {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<BuscarResultado[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const router         = useRouter();
  const inputRef       = useRef<HTMLInputElement>(null);
  const listRef        = useRef<HTMLUListElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Búsqueda cuando el debounce se resuelve
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
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

  // Scroll automático al ítem activo
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

      {/* Dropdown de sugerencias */}
      {open && (
        <ul
          id="search-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 overflow-hidden max-h-80 overflow-y-auto"
        >
          {results.map((item, idx) => {
            const campo = CAMPO_CONFIG[item.match_campo];
            const Icon  = campo.icon;
            const isActive = idx === activeIdx;

            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isActive}
                onClick={() => goToProduct(item)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={clsx(
                  "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                  isActive ? "bg-primary-50" : "hover:bg-gray-50"
                )}
              >
                {/* Thumbnail del producto o ícono de categoría */}
                {item.imagen_url ? (
                  <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    <Image
                      src={item.imagen_url}
                      alt={item.nombre}
                      width={40}
                      height={40}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                ) : (
                  <span className={clsx(
                    "mt-0.5 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    isActive ? "bg-primary-100" : "bg-gray-100"
                  )}>
                    <Icon className={clsx("w-4 h-4", isActive ? "text-primary-600" : "text-gray-500")} />
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-semibold truncate", isActive ? "text-primary-700" : "text-gray-800")}>
                    {item.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.laboratorio && (
                      <span className="text-xs text-gray-400">{item.laboratorio}</span>
                    )}
                    {item.principio_activo && item.principio_activo !== "NO APLICA" && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{item.principio_activo}</span>
                      </>
                    )}
                    {item.concentracion && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{item.concentracion}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className={clsx(
                  "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                  isActive ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
                )}>
                  {campo.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Mensaje mínimo 3 letras */}
      {query.length > 0 && query.length < 3 && (
        <p className="mt-2 text-center text-white/60 text-xs">
          Escribe al menos 3 letras para buscar
        </p>
      )}
    </div>
  );
}

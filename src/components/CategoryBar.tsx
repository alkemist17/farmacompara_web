"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { CATEGORIAS } from "@/lib/categorias";

export default function CategoryBar() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <div className="hidden md:block bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/*
          overflow-x-auto: en móvil la barra se desliza horizontalmente como carrusel táctil.
          md:overflow-visible: en escritorio se restaura para que los dropdowns sean visibles.
        */}
        <div className="flex items-center h-10 gap-0.5 overflow-x-auto md:overflow-visible scrollbar-none">

          {/* ── 5 categorías con dropdown en hover ── */}
          {CATEGORIAS.map((cat) => {
            const isActive = pathname.startsWith(`/categoria/${cat.slug}`);
            const isOpen   = activeSlug === cat.slug;

            return (
              <div
                key={cat.slug}
                className="relative shrink-0"
                onMouseEnter={() => setActiveSlug(cat.slug)}
                onMouseLeave={() => setActiveSlug(null)}
              >
                <Link
                  href={`/categoria/${cat.slug}`}
                  className={`
                    flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
                    transition-colors whitespace-nowrap select-none
                    ${isActive
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 hover:text-primary-500 hover:bg-white hover:shadow-sm"}
                  `}
                >
                  <span className="lg:hidden">{cat.labelCorto}</span>
                  <span className="hidden lg:inline">{cat.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 opacity-50 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                  />
                </Link>

                {/* Dropdown — el pt-1 crea área invisible continua para no romper el hover */}
                {isOpen && (
                  <div className="absolute top-full left-0 pt-1 z-50">
                    <div className="bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/10 py-2 min-w-[220px]">
                      <div className="py-1">
                        {cat.subs.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/categoria/${cat.slug}/${sub.slug}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-gray-50 px-4 pb-1">
                        <Link
                          href={`/categoria/${cat.slug}`}
                          className="text-xs text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                        >
                          Ver todo en {cat.labelCorto} →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empuja "Ofertas" al extremo derecho */}
          <span className="flex-1 shrink-0 min-w-4" />
          <span className="shrink-0 w-px h-4 bg-gray-200 mx-2" />

          <Link
            href="/ofertas"
            className="shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 transition-colors whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            Ofertas del día
          </Link>
        </div>
      </div>
    </div>
  );
}

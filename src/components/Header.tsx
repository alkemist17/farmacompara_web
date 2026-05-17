"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin, ChevronDown, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import Logo from "@/components/Logo";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import CategoryBar from "@/components/CategoryBar";
import { CATEGORIAS } from "@/lib/categorias";


export default function Header() {
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [mobileSubSlug, setMobileSubSlug]   = useState<string | null>(null);
  const pathname  = usePathname();
  const isHome    = pathname === "/";

  return (
    <header className="bg-white shadow-sm">
      {/* ── Top bar informativo ── */}
      <div className="bg-primary-500 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Comparando precios en Bogotá
            <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span className="hidden sm:block">
            📞 Atención al cliente: <strong>info@farmacompara.co</strong>
          </span>
        </div>
      </div>

      {/* ── Barra principal ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            <Logo size="md" />

            {/* Buscador — visible en todas las páginas excepto inicio */}
            {!isHome && (
              <div className="hidden md:flex flex-1 justify-center">
                <div className="w-full max-w-xl">
                  <SearchAutocomplete compact />
                </div>
              </div>
            )}

            {/* Spacer cuando no hay buscador (home) */}
            {isHome && <div className="flex-1" />}

            {/* Acciones desktop */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {isHome && (
                <Link
                  href="/comparar"
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Comparar ahora
                </Link>
              )}
              <Link
                href="/registro"
                className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm shadow-primary-500/30"
              >
                Registrarse
              </Link>
            </div>

            {/* Burger mobile */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 ml-auto"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* ── Barra de categorías ── */}
      <CategoryBar />

      {/* ── Menú mobile ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white pb-4">
          {/* Buscador mobile (excepto home) */}
          {!isHome && (
            <div className="px-4 pt-3 pb-2">
              <SearchAutocomplete compact />
            </div>
          )}

          {/* ── Nivel 2: subcategorías ── */}
          {mobileSubSlug ? (() => {
            const cat = CATEGORIAS.find((c) => c.slug === mobileSubSlug)!;
            return (
              <div>
                {/* Cabecera nivel 2 */}
                <button
                  onClick={() => setMobileSubSlug(null)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-primary-600 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {cat.icon} {cat.label}
                </button>

                {/* Subcategorías */}
                <nav className="flex flex-col">
                  {cat.subs.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/categoria/${cat.slug}/${sub.slug}`}
                      className="flex items-center gap-3 px-6 py-3 text-sm text-gray-700 hover:text-primary-600 hover:bg-primary-50 border-b border-gray-50 transition-colors"
                      onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      {sub.label}
                    </Link>
                  ))}
                  {/* Ver todo */}
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-primary-500 hover:bg-primary-50 transition-colors"
                    onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                  >
                    Ver todo en {cat.labelCorto} →
                  </Link>
                </nav>
              </div>
            );
          })() : (
            /* ── Nivel 1: categorías ── */
            <div>
              <nav className="flex flex-col">
                {CATEGORIAS.map((cat) => (
                  <div key={cat.slug} className="flex items-center border-b border-gray-50">
                    {/* Link directo a la categoría */}
                    <Link
                      href={`/categoria/${cat.slug}`}
                      className="flex-1 flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                      onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      {cat.label}
                    </Link>
                    {/* Flecha para ver subcategorías */}
                    <button
                      onClick={() => setMobileSubSlug(cat.slug)}
                      className="px-4 py-3 text-gray-400 hover:text-primary-500 hover:bg-gray-50 transition-colors border-l border-gray-50"
                      aria-label={`Ver subcategorías de ${cat.label}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Ofertas del día */}
                <Link
                  href="/ofertas"
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-orange-500 hover:bg-orange-50 transition-colors"
                  onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                >
                  <Zap className="w-4 h-4" />
                  Ofertas del día
                </Link>
              </nav>

              <div className="flex flex-col gap-2 mt-3 px-4">
                {isHome && (
                  <Link
                    href="/comparar"
                    className="w-full text-center border border-primary-500 text-primary-600 text-sm font-semibold py-2.5 rounded-full"
                    onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                  >
                    Comparar ahora
                  </Link>
                )}
                <Link
                  href="/registro"
                  className="w-full text-center bg-primary-500 text-white text-sm font-semibold py-2.5 rounded-full"
                  onClick={() => { setMobileOpen(false); setMobileSubSlug(null); }}
                >
                  Registrarse
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

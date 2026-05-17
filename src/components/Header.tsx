"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const NAV_LINKS = [
  { label: "Medicamentos", href: "/medicamentos" },
  { label: "Droguerías",   href: "/droguerias"   },
  { label: "Genéricos",    href: "/genericos"    },
  { label: "Promociones",  href: "/promociones"  },
];

// Categorías próximas (placeholder visual)
const UPCOMING = ["Vitaminas", "Dermatología", "Pediatría", "Dolor y fiebre"];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
            📞 Atención al cliente: <strong>info@farmacompara.com</strong>
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
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-none">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap
                  ${pathname === link.href
                    ? "bg-primary-500 text-white"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"}
                `}
              >
                {link.label}
              </Link>
            ))}

            {/* Separador */}
            <span className="shrink-0 w-px h-4 bg-gray-200 mx-2" />

            {/* Categorías próximas (placeholder) */}
            {UPCOMING.map((label) => (
              <span
                key={label}
                title="Próximamente"
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full text-gray-300 cursor-default whitespace-nowrap select-none"
              >
                {label}
              </span>
            ))}

            {/* Ver todas */}
            <Link
              href="/categorias"
              className="shrink-0 ml-auto flex items-center gap-0.5 text-xs text-primary-500 hover:text-primary-700 font-medium whitespace-nowrap transition-colors"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Menú mobile ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          {/* Buscador mobile (excepto home) */}
          {!isHome && (
            <div className="pt-3 pb-2">
              <SearchAutocomplete compact />
            </div>
          )}

          {/* Categorías */}
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm font-medium text-gray-700 hover:text-primary-500 border-b border-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2 mt-4">
            {isHome && (
              <Link
                href="/comparar"
                className="w-full text-center border border-primary-500 text-primary-600 text-sm font-semibold py-2.5 rounded-full"
                onClick={() => setMobileOpen(false)}
              >
                Comparar ahora
              </Link>
            )}
            <Link
              href="/registro"
              className="w-full text-center bg-primary-500 text-white text-sm font-semibold py-2.5 rounded-full"
              onClick={() => setMobileOpen(false)}
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

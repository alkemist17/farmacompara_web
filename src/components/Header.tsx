"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, MapPin, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { label: "Medicamentos", href: "/medicamentos" },
  { label: "Droguerías", href: "/droguerias" },
  { label: "Genéricos", href: "/genericos" },
  { label: "Promociones", href: "/promociones" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* Top bar informativo */}
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

      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Logo size="md" />

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/comparar"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Comparar ahora
            </Link>
            <Link
              href="/registro"
              className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm shadow-primary-500/30"
            >
              Registrarse
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
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
            <Link
              href="/comparar"
              className="mt-3 w-full text-center bg-primary-500 text-white text-sm font-semibold py-2.5 rounded-full"
              onClick={() => setMobileOpen(false)}
            >
              Comparar ahora
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

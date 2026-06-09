import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">

      {/* Número grande decorativo */}
      <div className="relative mb-6 select-none">
        <p className="text-[10rem] font-black leading-none text-primary-100">404</p>
        <p className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-primary-500 opacity-20 blur-sm">
          404
        </p>
      </div>

      {/* Pill icon */}
      <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-secondary-500 mb-3">
        Página no encontrada
      </h1>
      <p className="text-gray-500 max-w-xs leading-relaxed mb-8">
        La dirección que buscas no existe o fue movida. Vuelve al inicio y sigue comparando precios.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
        <Link href="/comparar" className="btn-outline">
          Comparar precios
        </Link>
      </div>

    </div>
  );
}

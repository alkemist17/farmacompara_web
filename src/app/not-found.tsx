import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-primary-500 leading-none mb-4">404</p>
      <h1 className="text-2xl font-bold text-secondary-500 mb-3">
        Página no encontrada
      </h1>
      <p className="text-gray-500 max-w-sm mb-8">
        La dirección que buscas no existe o fue movida. Vuelve al inicio y sigue comparando precios.
      </p>
      <Link href="/" className="btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}

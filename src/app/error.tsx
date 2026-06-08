"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-primary-500 leading-none mb-4">500</p>
      <h1 className="text-2xl font-bold text-secondary-500 mb-3">
        Algo salió mal
      </h1>
      <p className="text-gray-500 max-w-sm mb-2">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-8 font-mono">
          Código: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-outline">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

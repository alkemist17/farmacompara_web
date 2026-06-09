"use client";

import { useEffect, useState } from "react";

const REDIRECT_DELAY = 5;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [seconds, setSeconds] = useState(REDIRECT_DELAY);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = "/";
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">

      {/* Icono */}
      <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-secondary-500 mb-3">
        Algo salió mal
      </h1>
      <p className="text-gray-500 max-w-xs leading-relaxed mb-2">
        Ocurrió un error inesperado. Te redirigimos al inicio en unos segundos.
      </p>

      {error.digest && (
        <p className="text-xs text-gray-400 mb-4 font-mono">
          Código: {error.digest}
        </p>
      )}

      {/* Contador */}
      <p className="text-sm text-gray-400 mb-8">
        Redirigiendo en{" "}
        <span className="font-bold text-primary-500">{seconds}s</span>…
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={reset} className="btn-primary">
          Intentar de nuevo
        </button>
        <button onClick={() => { window.location.href = "/"; }} className="btn-outline">
          Ir al inicio ahora
        </button>
      </div>

    </div>
  );
}

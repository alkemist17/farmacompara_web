"use client";

import { useEffect } from "react";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export default function GlobalError({
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
    <html lang="es" className={manrope.variable}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-manrope), system-ui, sans-serif",
          background: "linear-gradient(135deg, #0e1a2e 0%, #1e3a5f 55%, #1a6b52 100%)",
          color: "#fff",
          textAlign: "center",
          padding: "24px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MediOfertas" style={{ width: 40, height: 40 }} />
          <span style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#3db38b" }}>Medi</span>
            <span style={{ color: "#fff" }}>Ofertas</span>
          </span>
        </div>

        <p style={{ fontSize: "5rem", fontWeight: 900, color: "#3db38b", lineHeight: 1, marginBottom: 16 }}>
          500
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
          Error crítico de la aplicación
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: 380, lineHeight: 1.7, marginBottom: 8 }}>
          Ocurrió un error grave. Puedes intentar recargar la página.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 32 }}>
            Código: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: "#1f9871",
            color: "#fff",
            border: "none",
            borderRadius: 99,
            padding: "10px 24px",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}

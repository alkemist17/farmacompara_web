"use client";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

type Status  = "idle" | "loading" | "ok" | "error";
type Variant = "light" | "dark";

export default function NewsletterForm({ variant = "dark" }: { variant?: Variant }) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError]   = useState("");

  const isLight = variant === "light";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res  = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Intenta de nuevo.");
        setStatus("error");
        return;
      }
      setStatus("ok");
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
        <div>
          <p className={`font-semibold ${isLight ? "text-gray-800" : "text-white"}`}>
            ¡Listo! Ya estás suscrito.
          </p>
          <p className={`text-sm mt-0.5 ${isLight ? "text-gray-500" : "text-white/50"}`}>
            Recibirás alertas de precios y ofertas directamente en tu correo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLight ? "text-gray-400" : "text-white/30"}`} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 transition
              ${isLight
                ? "bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
                : "bg-white/10 border border-white/15 text-white placeholder-white/30 focus:border-primary-400 focus:ring-primary-400"
              }`}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-white font-semibold text-sm transition shrink-0 cursor-pointer"
        >
          {status === "loading" ? "Enviando..." : "Recibir alertas"}
          {status !== "loading" && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}

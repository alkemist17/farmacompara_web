"use client";

import { useState } from "react";
import { Search, TrendingDown, Shield, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const POPULAR_SEARCHES = [
  "Acetaminofén", "Ibuprofeno", "Losartán", "Metformina", "Atorvastatina",
];

export default function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/comparar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      {/* Patrón decorativo de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Círculos decorativos */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary-500/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge superior */}
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
            Más de 12.000 medicamentos comparados hoy
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Tu ahorro,{" "}
            <span className="text-primary-300">nuestra fórmula.</span>
          </h1>

          <p className="text-lg text-white/75 mb-10 leading-relaxed">
            Compara precios de medicamentos en todas las droguerías de tu ciudad
            y elige siempre la mejor opción para tu bolsillo.
          </p>

          {/* Buscador */}
          <form
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto"
          >
            <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
              <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca un medicamento o principio activo..."
                className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-400 outline-none text-base"
              />
              <button
                type="submit"
                className="m-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0"
              >
                Comparar
              </button>
            </div>

            {/* Búsquedas populares */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-white/60 text-xs">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: TrendingDown, value: "Hasta 60%", label: "de ahorro promedio", color: "text-primary-300" },
            { icon: Shield, value: "+80",        label: "droguerías verificadas", color: "text-blue-300"    },
            { icon: Clock,       value: "24/7",       label: "precios actualizados",  color: "text-accent-400" },
          ].map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-4"
            >
              <Icon className={`w-8 h-8 ${color} shrink-0`} />
              <div className="text-left">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-white/70 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

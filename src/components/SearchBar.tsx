"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 3) {
      router.push(`/comparar?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-transparent transition-all">
        <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, principio activo, laboratorio o EAN…"
          className="flex-1 px-4 py-3.5 text-gray-800 placeholder-gray-400 outline-none text-base bg-transparent"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={query.trim().length < 3}
          className="m-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {query.length > 0 && query.length < 3 && (
        <p className="mt-2 text-xs text-gray-400 pl-1">Escribe al menos 3 letras para buscar</p>
      )}
    </form>
  );
}

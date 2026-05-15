import { Suspense } from "react";
import { Search } from "lucide-react";
import { FEATURED_COMPARISONS } from "@/lib/mock-data";
import ComparisonCard from "@/components/ComparisonCard";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return {
    title: q ? `Comparar "${q}"` : "Comparar medicamentos",
  };
}

async function Results({ query }: { query: string }) {
  // Con datos reales esto haría fetch a la API
  const results = FEATURED_COMPARISONS.filter((c) =>
    !query ||
    c.medication.name.toLowerCase().includes(query.toLowerCase()) ||
    c.medication.genericName.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No encontramos resultados para <strong>&ldquo;{query}&rdquo;</strong></p>
        <p className="text-gray-400 text-sm mt-1">Intenta con el nombre genérico o revisa la ortografía</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {results.map((c) => <ComparisonCard key={c.medication.id} comparison={c} />)}
    </div>
  );
}

export default async function CompararPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-500">
          {q ? `Resultados para "${q}"` : "Comparar medicamentos"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {q ? "Precios actualizados en tiempo real" : "Busca un medicamento para empezar"}
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-16 text-gray-400">Cargando comparaciones...</div>}>
        <Results query={q} />
      </Suspense>
    </div>
  );
}

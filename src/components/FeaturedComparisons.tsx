import { FEATURED_COMPARISONS } from "@/lib/mock-data";
import ComparisonCard from "@/components/ComparisonCard";
import Link from "next/link";

export default function FeaturedComparisons() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-500">Comparaciones más buscadas</h2>
            <p className="text-gray-500 text-sm mt-1">
              Los medicamentos donde más ahorran nuestros usuarios hoy
            </p>
          </div>
          <Link href="/medicamentos" className="text-primary-500 text-sm font-semibold hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {FEATURED_COMPARISONS.map((comparison) => (
            <ComparisonCard key={comparison.medication.id} comparison={comparison} />
          ))}
        </div>
      </div>
    </section>
  );
}

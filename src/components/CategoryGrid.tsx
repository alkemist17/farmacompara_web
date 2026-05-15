import Link from "next/link";
import { CATEGORIES } from "@/lib/mock-data";

export default function CategoryGrid() {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-500">Busca por categoría</h2>
            <p className="text-gray-500 text-sm mt-1">Encuentra rápido lo que necesitas</p>
          </div>
          <Link href="/categorias" className="text-primary-500 text-sm font-semibold hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              className="group flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/10 transition-all"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 text-center leading-tight">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400">{cat.count} productos</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/categorias";

async function getConteosPorCategoria(): Promise<Record<string, number>> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ slug: string; total: number }[]>(`
      SELECT c.slug, COUNT(mp.id)::int AS total
      FROM categorias c
      LEFT JOIN subcategorias s ON s.categoria_id = c.id
      LEFT JOIN maestro_productos mp ON mp.subcategoria_id = s.id AND mp.excluido = false
      GROUP BY c.slug
    `);
    return Object.fromEntries(rows.map((r) => [r.slug, r.total]));
  } catch {
    return {};
  }
}

export default async function CategoryGrid() {
  const conteos = await getConteosPorCategoria();

  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-500">Busca por categoría</h2>
            <p className="text-gray-500 text-sm mt-1">Encuentra rápido lo que necesitas</p>
          </div>
          <Link href={`/categoria/${CATEGORIAS[0].slug}`} className="text-primary-500 text-sm font-semibold hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIAS.map((cat) => {
            const total = conteos[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="group flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-md shadow-gray-200/80 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/15 hover:scale-[1.04] transition-all duration-200"
              >
                <Image src={cat.image} alt={cat.label} width={80} height={80} className="w-20 h-20 object-contain" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 text-center leading-tight">
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400">
                  {total > 0 ? `${total.toLocaleString("es-CO")} productos` : "Explorar"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { slugifySearch } from "@/lib/search";

export default async function TrustBanner() {
  const fuentes = await prisma.$queryRawUnsafe<{ nombre: string }[]>(
    `SELECT nombre FROM fuentes ORDER BY nombre`
  );

  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Comparamos precios en las principales cadenas de Colombia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {fuentes.map((f) => (
            <Link
              key={f.nombre}
              href={`/farmacia/${slugifySearch(f.nombre)}`}
              className="text-sm font-bold text-gray-400 hover:text-primary-500 transition-colors"
            >
              {f.nombre}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

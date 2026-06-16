import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { slugifySearch } from "@/lib/search";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const SITE = "https://mediofertas.co";
const PRODUCTS_PER_PAGE = 10_000;

export async function generateSitemaps() {
  try {
    const result = await prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*)::text AS total FROM maestro_productos WHERE slug IS NOT NULL`
    );
    const total = parseInt(result[0]?.total ?? "0", 10);
    const productPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
    return [
      { id: 0 },
      ...Array.from({ length: productPages }, (_, i) => ({ id: i + 1 })),
    ];
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (+id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      { url: SITE,                  changeFrequency: "daily",   priority: 1.0 },
      { url: `${SITE}/comparar`,    changeFrequency: "daily",   priority: 0.9 },
      { url: `${SITE}/ofertas`,     changeFrequency: "daily",   priority: 0.8 },
      { url: `${SITE}/nosotros`,    changeFrequency: "monthly", priority: 0.4 },
      { url: `${SITE}/contacto`,    changeFrequency: "monthly", priority: 0.3 },
      { url: `${SITE}/terminos`,    changeFrequency: "yearly",  priority: 0.2 },
      { url: `${SITE}/privacidad`,  changeFrequency: "yearly",  priority: 0.2 },
      { url: `${SITE}/faq`,         changeFrequency: "monthly", priority: 0.4 },
    ];

    try {
      const [categorias, subcategorias, fuentes, laboratorios, medicamentos] = await Promise.all([
        prisma.$queryRawUnsafe<{ slug: string }[]>(
          `SELECT slug FROM categorias ORDER BY nombre`
        ),
        prisma.$queryRawUnsafe<{ slug: string; cat_slug: string }[]>(
          `SELECT s.slug, c.slug AS cat_slug
           FROM subcategorias s
           JOIN categorias c ON c.id = s.categoria_id
           ORDER BY s.nombre`
        ),
        prisma.$queryRawUnsafe<{ nombre: string }[]>(
          `SELECT nombre FROM fuentes ORDER BY nombre`
        ),
        prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
          `SELECT DISTINCT laboratorio
           FROM maestro_productos
           WHERE laboratorio IS NOT NULL
           ORDER BY laboratorio`
        ),
        prisma.$queryRawUnsafe<{ principio_activo: string }[]>(
          `SELECT DISTINCT principio_activo
           FROM maestro_productos
           WHERE principio_activo IS NOT NULL
           ORDER BY principio_activo`
        ),
      ]);

      return [
        ...staticPages,
        ...categorias.map((c) => ({
          url: `${SITE}/categoria/${c.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
        ...subcategorias.map((s) => ({
          url: `${SITE}/categoria/${s.cat_slug}/${s.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
        ...fuentes.map((f) => ({
          url: `${SITE}/farmacia/${slugifySearch(f.nombre)}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
        ...laboratorios.map((l) => ({
          url: `${SITE}/laboratorio/${slugifySearch(l.laboratorio)}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
        ...medicamentos.map((m) => ({
          url: `${SITE}/medicamento/${slugifySearch(m.principio_activo)}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ];
    } catch {
      return staticPages;
    }
  }

  // id >= 1: products paginated in batches of PRODUCTS_PER_PAGE
  const offset = (id - 1) * PRODUCTS_PER_PAGE;
  try {
    const products = await prisma.$queryRawUnsafe<{ slug: string }[]>(
      `SELECT slug FROM maestro_productos WHERE slug IS NOT NULL ORDER BY id LIMIT $1 OFFSET $2`,
      PRODUCTS_PER_PAGE,
      offset
    );

    return products.map((p) => ({
      url: `${SITE}/producto/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

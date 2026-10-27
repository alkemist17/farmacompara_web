import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { slugifySearch } from "@/lib/search";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const SITE = "https://mediofertas.co";
const PRODUCTS_PER_PAGE = 10_000;

// Mismo criterio que esIndexable() en lib/producto-seo.ts: fichas activas con algún
// precio registrado o con registro INVIMA. Las demás se sirven con noindex.
const PRODUCTOS_INDEXABLES = `
  mp.slug IS NOT NULL AND mp.excluido = false
  AND (
    NULLIF(TRIM(mp.registro_invima), '') IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM codigos_barras cb2
      JOIN precios_retail p2 ON p2.ean = cb2.ean
      WHERE cb2.producto_id = mp.id
    )
  )
`;

export async function generateSitemaps() {
  try {
    const result = await prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*)::text AS total FROM maestro_productos mp WHERE ${PRODUCTOS_INDEXABLES}`
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
      const [categorias, fuentes, laboratorios, medicamentos] = await Promise.all([
        prisma.$queryRawUnsafe<{ slug: string }[]>(
          `SELECT slug FROM categorias ORDER BY nombre`
        ),
        prisma.$queryRawUnsafe<{ nombre: string }[]>(
          `SELECT nombre FROM fuentes_retail ORDER BY nombre`
        ),
        prisma.$queryRawUnsafe<{ laboratorio: string }[]>(
          `SELECT DISTINCT laboratorio
           FROM maestro_productos
           WHERE laboratorio IS NOT NULL AND excluido = false
           ORDER BY laboratorio`
        ),
        prisma.$queryRawUnsafe<{ principio_activo: string }[]>(
          `SELECT DISTINCT principio_activo
           FROM maestro_productos
           WHERE principio_activo IS NOT NULL AND excluido = false
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
    const products = await prisma.$queryRawUnsafe<{ slug: string; ultima_revision: Date | null }[]>(
      `SELECT mp.slug, COALESCE(MAX(p.fecha_revision), mp.updated_at) AS ultima_revision
       FROM maestro_productos mp
       LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
       LEFT JOIN precios_retail p ON p.ean = cb.ean
       WHERE ${PRODUCTOS_INDEXABLES}
       GROUP BY mp.slug, mp.id
       ORDER BY mp.id
       LIMIT $1 OFFSET $2`,
      PRODUCTS_PER_PAGE,
      offset
    );

    return products.map((p) => ({
      url: `${SITE}/producto/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
      // Sin precios se usa updated_at de la ficha; nunca la fecha actual inventada.
      ...(p.ultima_revision ? { lastModified: p.ultima_revision } : {}),
    }));
  } catch {
    return [];
  }
}

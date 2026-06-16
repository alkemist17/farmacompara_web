import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE = "https://mediofertas.co";
const PRODUCTS_PER_PAGE = 10_000;

export async function GET() {
  let productPages = 1;
  try {
    const result = await prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT COUNT(*)::text AS total FROM maestro_productos WHERE slug IS NOT NULL`
    );
    const total = parseInt(result[0]?.total ?? "0", 10);
    productPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  } catch {
    // fallback: include at least the static segment
  }

  const ids = [0, ...Array.from({ length: productPages }, (_, i) => i + 1)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ids.map((id) => `  <sitemap>\n    <loc>${SITE}/sitemap/${id}.xml</loc>\n  </sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

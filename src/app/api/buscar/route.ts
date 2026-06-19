import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";

export interface BuscarResultado {
  id: number;
  slug: string | null;
  nombre: string;
  laboratorio: string | null;
  principio_activo: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  presentacion: string | null;
  ean: string | null;
  imagen_url: string | null;
  precio_min: string | null;
  precio_max: string | null;
  match_campo: "nombre" | "laboratorio" | "principio_activo" | "ean";
}

const SQL = `
  SELECT DISTINCT ON (mp.id)
    mp.id,
    mp.slug,
    mp.nombre,
    mp.laboratorio,
    mp.principio_activo,
    mp.concentracion,
    mp.forma_farmaceutica,
    mp.presentacion,
    cb.ean,
    CASE WHEN cb.ean IS NOT NULL
      THEN '/api/imagen/' || cb.ean
      ELSE NULL
    END AS imagen_url,
    precios.precio_min,
    precios.precio_max,
    CASE
      WHEN unaccent(mp.nombre)           ILIKE $1 THEN 'nombre'
      WHEN unaccent(mp.principio_activo) ILIKE $1 THEN 'principio_activo'
      WHEN unaccent(mp.laboratorio)      ILIKE $1 THEN 'laboratorio'
      ELSE 'ean'
    END AS match_campo
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  LEFT JOIN (
    SELECT p.ean,
      MIN(COALESCE(p.precio_oferta, p.precio_costo)) AS precio_min,
      MAX(COALESCE(p.precio_oferta, p.precio_costo)) AS precio_max
    FROM precios p
    WHERE COALESCE(p.precio_oferta, p.precio_costo) IS NOT NULL
      AND p.fecha_revision >= NOW() - INTERVAL '7 days'
    GROUP BY p.ean
  ) precios ON precios.ean = cb.ean
  WHERE mp.excluido = false
    AND (
      unaccent(mp.nombre)            ILIKE $1
      OR unaccent(mp.principio_activo) ILIKE $1
      OR unaccent(mp.laboratorio)      ILIKE $1
      OR cb.ean                        ILIKE $1
    )
  ORDER BY mp.id, mp.nombre
  LIMIT 10
`;

const buscarCached = unstable_cache(
  async (q: string): Promise<BuscarResultado[]> => {
    return prisma.$queryRawUnsafe<BuscarResultado[]>(SQL, `%${q}%`);
  },
  ["buscar"],
  { revalidate: 60 } // mismo término = mismos resultados durante 60 s
);

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const q   = normalizeSearch(raw);

  if (q.length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const rows = await buscarCached(q);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/buscar]", err);
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}

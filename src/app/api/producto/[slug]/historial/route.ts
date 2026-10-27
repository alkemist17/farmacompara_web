import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface PuntoHistorial {
  fecha: string;   // "YYYY-MM-DD"
  cadena: string;
  precio: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Compatibilidad: si el slug no corresponde a un producto activo se usa ?ean=.
  const ean = req.nextUrl.searchParams.get("ean")?.trim() ?? "";

  try {
    // DISTINCT ON (día, fuente) ORDER BY fecha_captura DESC garantiza
    // que si el scraper corre varias veces al día, se usa el último registro.
    // Incluye todos los EAN del producto (un producto puede tener varios).
    const rows = await prisma.$queryRawUnsafe<PuntoHistorial[]>(
      `SELECT
         TO_CHAR(DATE_TRUNC('day', ph.fecha_captura), 'YYYY-MM-DD') AS fecha,
         f.nombre AS cadena,
         COALESCE(ph.precio_oferta, ph.precio_costo)::float AS precio
       FROM (
         SELECT DISTINCT ON (DATE_TRUNC('day', ph2.fecha_captura), ph2.fuente_id)
           ph2.fuente_id,
           ph2.precio_costo,
           ph2.precio_oferta,
           ph2.fecha_captura
         FROM precios_historicos_retail ph2
         WHERE ph2.ean IN (
             SELECT cb.ean
             FROM codigos_barras cb
             JOIN maestro_productos mp ON mp.id = cb.producto_id
             WHERE mp.slug = $1 AND mp.excluido = false
             UNION
             SELECT $2::text WHERE $2::text <> ''
               AND NOT EXISTS (SELECT 1 FROM maestro_productos WHERE slug = $1 AND excluido = false)
           )
           AND ph2.fecha_captura >= NOW() - INTERVAL '3 months'
           AND COALESCE(ph2.precio_oferta, ph2.precio_costo) IS NOT NULL
         ORDER BY DATE_TRUNC('day', ph2.fecha_captura), ph2.fuente_id, ph2.fecha_captura DESC
       ) ph
       JOIN fuentes_retail f ON f.id = ph.fuente_id
       ORDER BY fecha, cadena`,
      slug,
      ean
    );

    // Si la última captura de una cadena es anterior a hoy, extender
    // el precio hasta hoy con el mismo valor para que la línea no quede
    // truncada en el pasado (no modifica la BD, solo la respuesta).
    const today = new Date().toISOString().slice(0, 10);
    const lastByCadena = new Map<string, PuntoHistorial>();
    for (const row of rows) {
      const prev = lastByCadena.get(row.cadena);
      if (!prev || row.fecha > prev.fecha) lastByCadena.set(row.cadena, row);
    }
    const extended = [...rows];
    for (const last of lastByCadena.values()) {
      if (last.fecha < today) extended.push({ fecha: today, cadena: last.cadena, precio: last.precio });
    }

    return NextResponse.json(extended);
  } catch (err) {
    console.error("[/api/producto/historial]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

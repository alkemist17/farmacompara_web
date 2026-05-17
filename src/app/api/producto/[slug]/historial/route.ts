import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface PuntoHistorial {
  fecha: string;   // "YYYY-MM-DD"
  cadena: string;
  precio: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await params; // slug no se usa, el EAN viene como query param

  const ean = req.nextUrl.searchParams.get("ean")?.trim();
  if (!ean) {
    return NextResponse.json({ error: "Falta el parámetro ean" }, { status: 400 });
  }

  try {
    // DISTINCT ON (día, fuente) ORDER BY fecha_captura DESC garantiza
    // que si el scraper corre varias veces al día, se usa el último registro.
    const { rows } = await db.query<PuntoHistorial>(
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
         FROM precios_historicos ph2
         WHERE ph2.ean = $1
           AND ph2.fecha_captura >= NOW() - INTERVAL '3 months'
           AND COALESCE(ph2.precio_oferta, ph2.precio_costo) IS NOT NULL
         ORDER BY DATE_TRUNC('day', ph2.fecha_captura), ph2.fuente_id, ph2.fecha_captura DESC
       ) ph
       JOIN fuentes f ON f.id = ph.fuente_id
       ORDER BY fecha, cadena`,
      [ean]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/producto/historial]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

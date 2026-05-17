import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface PuntoHistorial {
  fecha: string;   // "YYYY-MM-DD"
  cadena: string;
  precio: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productoId = parseInt(id, 10);

  if (isNaN(productoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const { rows } = await db.query<PuntoHistorial>(
      `SELECT
         TO_CHAR(DATE_TRUNC('day', ph.fecha_captura), 'YYYY-MM-DD') AS fecha,
         f.nombre AS cadena,
         MIN(COALESCE(ph.precio_oferta, ph.precio_costo))::float       AS precio
       FROM precios_historicos ph
       JOIN fuentes f            ON f.id  = ph.fuente_id
       JOIN codigos_barras cb    ON cb.ean = ph.ean
       WHERE cb.producto_id = $1
         AND ph.fecha_captura >= NOW() - INTERVAL '3 months'
         AND COALESCE(ph.precio_oferta, ph.precio_costo) IS NOT NULL
       GROUP BY DATE_TRUNC('day', ph.fecha_captura), f.nombre
       ORDER BY fecha, cadena`,
      [productoId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/producto/historial]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

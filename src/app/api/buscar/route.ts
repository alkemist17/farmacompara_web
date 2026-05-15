import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface BuscarResultado {
  id: number;
  nombre: string;
  laboratorio: string | null;
  principio_activo: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  presentacion: string | null;
  ean: string | null;
  match_campo: "nombre" | "laboratorio" | "principio_activo" | "ean";
}

const SQL = `
  SELECT DISTINCT ON (mp.id)
    mp.id,
    mp.nombre,
    mp.laboratorio,
    mp.principio_activo,
    mp.concentracion,
    mp.forma_farmaceutica,
    mp.presentacion,
    cb.ean,
    CASE
      WHEN mp.nombre            ILIKE $1 THEN 'nombre'
      WHEN mp.principio_activo  ILIKE $1 THEN 'principio_activo'
      WHEN mp.laboratorio       ILIKE $1 THEN 'laboratorio'
      ELSE 'ean'
    END AS match_campo
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  WHERE
    mp.nombre           ILIKE $1
    OR mp.principio_activo ILIKE $1
    OR mp.laboratorio      ILIKE $1
    OR cb.ean              ILIKE $1
  ORDER BY mp.id, mp.nombre
  LIMIT 10
`;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { rows } = await db.query<BuscarResultado>(SQL, [`%${q}%`]);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/buscar]", err);
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}

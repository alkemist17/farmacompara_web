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
  imagen_url: string | null;
  precio_min: string | null;
  precio_max: string | null;
  precio_ultimo: string | null;
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
    CASE WHEN cb.ean IS NOT NULL
      THEN '/api/imagen/' || cb.ean
      ELSE NULL
    END AS imagen_url,
    precios.precio_min,
    precios.precio_max,
    precios.precio_ultimo,
    CASE
      WHEN mp.nombre           ILIKE $1 THEN 'nombre'
      WHEN mp.principio_activo ILIKE $1 THEN 'principio_activo'
      WHEN mp.laboratorio      ILIKE $1 THEN 'laboratorio'
      ELSE 'ean'
    END AS match_campo
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  LEFT JOIN (
    -- Último precio por cadena (fuente), luego mín/máx entre cadenas
    SELECT
      ultimos.ean,
      MIN(ultimos.precio_actual) AS precio_min,
      MAX(ultimos.precio_actual) AS precio_max,
      MAX(ultimos.precio_actual) FILTER (
        WHERE ultimos.fecha_captura = (
          SELECT MAX(ph3.fecha_captura)
          FROM precios_historicos ph3
          WHERE ph3.ean = ultimos.ean
        )
      ) AS precio_ultimo
    FROM (
      SELECT DISTINCT ON (ph.ean, ph.fuente_id)
        ph.ean,
        ph.fuente_id,
        COALESCE(ph.precio_oferta, ph.precio_costo) AS precio_actual,
        ph.fecha_captura
      FROM precios_historicos ph
      ORDER BY ph.ean, ph.fuente_id, ph.fecha_captura DESC
    ) ultimos
    GROUP BY ultimos.ean
  ) precios ON precios.ean = cb.ean
  WHERE
    mp.nombre            ILIKE $1
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

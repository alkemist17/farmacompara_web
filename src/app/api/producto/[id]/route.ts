import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface PrecioCadena {
  fuente_id: number;
  cadena: string;
  url: string | null;
  precio_costo: string | null;
  precio_oferta: string | null;
  condicion_oferta: string | null;
  stock: boolean | null;
  fecha_captura: string;
  precio_efectivo: string;
  ahorro: string | null;
  ahorro_pct: number | null;
  es_mejor_precio: boolean;
}

export interface ProductoDetalle {
  id: number;
  nombre: string;
  laboratorio: string | null;
  principio_activo: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  presentacion: string | null;
  condicion_venta: string | null;
  temperatura_almacenamiento: number | null;
  indicaciones: string | null;
  registro_invima: string | null;
  ean: string | null;
  imagen_url: string | null;
  precios: PrecioCadena[];
}

const SQL_PRODUCTO = `
  SELECT
    mp.id,
    mp.nombre,
    mp.laboratorio,
    mp.principio_activo,
    mp.concentracion,
    mp.forma_farmaceutica,
    mp.presentacion,
    mp.condicion_venta,
    mp.temperatura_almacenamiento,
    mp.indicaciones,
    mp.registro_invima,
    cb.ean,
    CASE WHEN cb.ean IS NOT NULL
      THEN '/api/imagen/' || cb.ean
      ELSE NULL
    END AS imagen_url
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  WHERE mp.id = $1
  LIMIT 1
`;

const SQL_PRECIOS = `
  SELECT
    f.id            AS fuente_id,
    f.nombre        AS cadena,
    f.url,
    ph.precio_costo,
    ph.precio_oferta,
    ph.condicion_oferta,
    ph.stock,
    ph.fecha_captura,
    COALESCE(ph.precio_oferta, ph.precio_costo) AS precio_efectivo,
    CASE
      WHEN ph.precio_oferta IS NOT NULL AND ph.precio_costo IS NOT NULL
        THEN (ph.precio_costo - ph.precio_oferta)
      ELSE NULL
    END AS ahorro,
    CASE
      WHEN ph.precio_oferta IS NOT NULL AND ph.precio_costo > 0
        THEN ROUND(((ph.precio_costo - ph.precio_oferta) / ph.precio_costo) * 100)
      ELSE NULL
    END AS ahorro_pct
  FROM (
    SELECT DISTINCT ON (ph2.fuente_id)
      ph2.fuente_id,
      ph2.precio_costo,
      ph2.precio_oferta,
      ph2.condicion_oferta,
      ph2.stock,
      ph2.fecha_captura
    FROM precios_historicos ph2
    WHERE ph2.ean = $1
    ORDER BY ph2.fuente_id, ph2.fecha_captura DESC
  ) ph
  JOIN fuentes f ON f.id = ph.fuente_id
  ORDER BY COALESCE(ph.precio_oferta, ph.precio_costo) ASC
`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const { rows: productos } = await db.query(SQL_PRODUCTO, [productId]);

    if (productos.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const producto = productos[0];

    const { rows: precios } = producto.ean
      ? await db.query(SQL_PRECIOS, [producto.ean])
      : { rows: [] };

    // Marca el precio efectivo más bajo
    const minPrecio = precios.reduce(
      (min: number, p: PrecioCadena) =>
        parseFloat(p.precio_efectivo) < min ? parseFloat(p.precio_efectivo) : min,
      Infinity
    );

    const preciosConMejor = precios.map((p: PrecioCadena) => ({
      ...p,
      es_mejor_precio: parseFloat(p.precio_efectivo) === minPrecio,
    }));

    return NextResponse.json({ ...producto, precios: preciosConMejor });
  } catch (err) {
    console.error("[/api/producto]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

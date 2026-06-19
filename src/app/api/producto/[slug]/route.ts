import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  slug: string;
  nombre: string;
  laboratorio: string | null;
  principio_activo: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  presentacion: string | null;
  condicion_venta: string | null;
  via_administracion: string | null;
  codigo_atc: string | null;
  descripcion_atc: string | null;
  indicaciones: string | null;
  registro_invima: string | null;
  ean: string | null;
  imagen_url: string | null;
  precios: PrecioCadena[];
}

const SQL_PRODUCTO = `
  SELECT
    mp.id,
    mp.slug,
    mp.nombre,
    mp.laboratorio,
    mp.principio_activo,
    mp.concentracion,
    mp.forma_farmaceutica,
    mp.presentacion,
    mp.condicion_venta,
    mp.via_administracion,
    mp.codigo_atc,
    mp.descripcion_atc,
    mp.indicaciones,
    mp.registro_invima,
    cb.ean,
    CASE WHEN cb.ean IS NOT NULL
      THEN '/api/imagen/' || cb.ean
      ELSE NULL
    END AS imagen_url
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  WHERE mp.slug = $1
    AND mp.excluido = false
  LIMIT 1
`;

const SQL_PRECIOS = `
  SELECT
    f.id            AS fuente_id,
    f.nombre        AS cadena,
    f.url,
    p.precio_costo,
    p.precio_oferta,
    p.condicion_oferta,
    p.stock,
    p.fecha_revision AS fecha_captura,
    COALESCE(p.precio_oferta, p.precio_costo)::float AS precio_efectivo,
    CASE
      WHEN p.precio_oferta IS NOT NULL AND p.precio_costo IS NOT NULL
        THEN (p.precio_costo - p.precio_oferta)::float
      ELSE NULL
    END AS ahorro,
    CASE
      WHEN p.precio_oferta IS NOT NULL AND p.precio_costo > 0
        THEN ROUND(((p.precio_costo - p.precio_oferta) / p.precio_costo) * 100)::int
      ELSE NULL
    END AS ahorro_pct
  FROM precios p
  JOIN fuentes f ON f.id = p.fuente_id
  WHERE p.ean = $1
  ORDER BY COALESCE(p.precio_oferta, p.precio_costo) ASC NULLS LAST
`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  try {
    const productos = await prisma.$queryRawUnsafe<ProductoDetalle[]>(SQL_PRODUCTO, slug);

    if (productos.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const producto = productos[0];

    const precios: PrecioCadena[] = producto.ean
      ? await prisma.$queryRawUnsafe<PrecioCadena[]>(SQL_PRECIOS, producto.ean)
      : [];

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

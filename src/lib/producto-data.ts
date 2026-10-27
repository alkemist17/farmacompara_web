// Consultas de /producto/[slug]. Envueltas en cache() para que generateMetadata,
// la página y PreciosSection compartan una sola consulta por request.
import { cache } from "react";
import { stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { evaluarPrecios, resumirOfertas, type PrecioBase, type PrecioEvaluado, type ResumenOfertas } from "@/lib/precios-reglas";
import { nombrePublico, principioActivoPublico } from "@/lib/producto-texto";
import { SQL_INFO, SQL_PRECIOS } from "@/lib/producto-sql";

const MEDIA_DIR =
  process.env.MEDIA_PRODUCTOS_DIR ??
  "/drive/axonode/demos/farmacompara_scrapper/media/productos";

export interface ProductoInfo {
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
  // Todos los EAN del producto; el primero es el que tiene el precio más reciente.
  eans: string[];
  total_precios: number;
}

export const getProductoInfo = cache(async (slug: string): Promise<ProductoInfo | null> => {
  const rows = await prisma.$queryRawUnsafe<ProductoInfo[]>(SQL_INFO, slug);
  return rows[0] ?? null;
});

export interface PrecioCadena extends PrecioBase {
  cadena: string;
  url: string | null;
  condicion_oferta: string | null;
  ahorro: number | null;
  ahorro_pct: number | null;
}

export interface PreciosProducto {
  precios: PrecioEvaluado<PrecioCadena>[];
  resumen: ResumenOfertas;
}

export const getPreciosProducto = cache(async (productoId: number): Promise<PreciosProducto> => {
  const rows = await prisma.$queryRawUnsafe<PrecioCadena[]>(SQL_PRECIOS, productoId);
  const precios = evaluarPrecios(rows, new Date());
  return { precios, resumen: resumirOfertas(precios) };
});

async function existeImagen(ean: string): Promise<boolean> {
  const safe = ean.replace(/[^0-9]/g, "");
  if (!safe) return false;
  try {
    return (await stat(path.join(MEDIA_DIR, `${safe}.webp`))).size > 0;
  } catch {
    return false;
  }
}

/** Primer EAN del producto con imagen real; null si ninguno tiene. */
export const getImagenProducto = cache(async (eans: string[]): Promise<string | null> => {
  for (const ean of eans) {
    if (await existeImagen(ean)) return `/api/imagen/${ean}`;
  }
  return null;
});

/**
 * Slug canónico de una ficha fusionada. La tabla producto_redirecciones se crea
 * con scripts/sql/030_producto_redirecciones.sql; mientras no exista devuelve null.
 */
export async function getSlugRedireccion(slug: string): Promise<string | null> {
  const [tabla] = await prisma.$queryRawUnsafe<{ existe: boolean }[]>(
    `SELECT to_regclass('public.producto_redirecciones') IS NOT NULL AS existe`
  );
  if (!tabla?.existe) return null;
  const rows = await prisma.$queryRawUnsafe<{ slug: string }[]>(
    `SELECT mp.slug
       FROM producto_redirecciones r
       JOIN maestro_productos mp ON mp.id = r.producto_destino_id
      WHERE r.slug_origen = $1 AND mp.excluido = false
      LIMIT 1`,
    slug
  );
  return rows[0]?.slug ?? null;
}

export interface ProductoRelacionado {
  slug: string;
  nombre: string;
  precio_min: number | null;
}

/**
 * Otras presentaciones: mismo nombre comercial (primera palabra) y mismo principio
 * activo base. No implica equivalencia terapéutica; solo navegación de catálogo.
 */
export const getOtrasPresentaciones = cache(async (p: ProductoInfo): Promise<ProductoRelacionado[]> => {
  const marca = p.nombre.trim().split(/\s+/)[0];
  const principio = principioActivoPublico(p.principio_activo);
  if (!marca || marca.length < 4 || /\d/.test(marca) || !principio) return [];

  const rows = await prisma.$queryRawUnsafe<ProductoRelacionado[]>(
    `SELECT mp.slug, mp.nombre, precios.precio_min::float AS precio_min
       FROM maestro_productos mp
       LEFT JOIN mv_precios_resumen precios ON precios.producto_id = mp.id
      WHERE mp.excluido = false
        AND mp.id <> $1
        AND mp.nombre ILIKE $2
        AND unaccent(mp.principio_activo) ILIKE unaccent($3)
      ORDER BY precios.precio_min IS NULL, mp.nombre
      LIMIT 8`,
    p.id,
    `${escaparLike(marca)} %`,
    `%${escaparLike(principio)}%`
  );
  return rows.map((r) => ({ ...r, nombre: nombrePublico(r.nombre) }));
});

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, "\\$&");
}

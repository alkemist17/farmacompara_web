// Metadatos y datos estructurados de /producto/[slug]. Módulo puro: recibe datos
// ya consultados y el resumen de ofertas de precios-reglas.ts.
import { formatCOP } from "./format";
import type { ResumenOfertas } from "./precios-reglas";
import { contieneConcentracion, contieneTermino } from "./producto-texto";
import { slugifySearch } from "./search";

export const SITE = "https://mediofertas.co";

// El layout añade " | MediOfertas" (14 caracteres) a cada título.
const TITULO_MAX = 60 - 14;

export interface ProductoSeo {
  slug: string;
  nombre: string;              // nombre público ya normalizado
  principio: string | null;    // denominación pública del principio activo
  laboratorio: string | null;
  concentracion: string | null;
  ean: string | null;          // EAN principal (solo se publica si es GTIN-13 válido)
  imagenUrl: string | null;    // ruta relativa (/api/imagen/…) o null
  descripcionVisible: string;  // misma frase que se muestra en la página
}

export interface Miga {
  nombre: string;
  url: string | null;          // null = página actual
}

/** "Gelpin 50 mg Cápsulas Blandas Caja x 2" + "Sildenafilo" → "… (Sildenafilo)" si cabe. */
export function tituloProducto(nombre: string, principio: string | null): string {
  if (!principio || contieneTermino(nombre, principio)) return nombre;
  const conPrincipio = `${nombre} (${principio})`;
  return conPrincipio.length <= TITULO_MAX ? conPrincipio : nombre;
}

/** Frase visible bajo el H1 y base de la meta description. Sin precios. */
export function descripcionProducto(p: Pick<ProductoSeo, "nombre" | "principio" | "laboratorio" | "concentracion">): string {
  const partes: string[] = [];
  if (p.principio && !contieneTermino(p.nombre, p.principio)) partes.push(`con ${p.principio.toLowerCase()}`);
  if (p.concentracion && !contieneConcentracion(p.nombre, p.concentracion)) partes.push(p.concentracion);
  if (p.laboratorio) partes.push(`de ${p.laboratorio}`);
  return [p.nombre, ...partes].join(" ").replace(/\s+/g, " ").trim();
}

/** Meta description. Solo menciona precio si hay ofertas vigentes. */
export function metaDescription(p: ProductoSeo, resumen: ResumenOfertas): string {
  const base = `Compara precios de ${p.descripcionVisible} en droguerías de Colombia.`;
  if (resumen.count > 0 && resumen.min != null) {
    const cadenas = resumen.count === 1 ? "1 droguería" : `${resumen.count} droguerías`;
    return `${base} Desde ${formatCOP(resumen.min)} en ${cadenas} con precio actualizado.`;
  }
  return `${base} Consulta la ficha técnica y activa una alerta para saber cuándo hay precio.`;
}

export function ogTitle(titulo: string, resumen: ResumenOfertas): string {
  return resumen.count > 0 && resumen.min != null ? `${titulo} — Desde ${formatCOP(resumen.min)}` : titulo;
}

/** GTIN-13 con dígito de control correcto. Descarta EAN internos (P0000092) o truncados. */
export function esGtin13Valido(ean: string | null | undefined): boolean {
  if (!ean || !/^\d{13}$/.test(ean)) return false;
  const digitos = ean.split("").map(Number);
  const suma = digitos.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (suma % 10)) % 10 === digitos[12];
}

export function productJsonLd(p: ProductoSeo, resumen: ResumenOfertas): Record<string, unknown> {
  const url = `${SITE}/producto/${p.slug}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    url,
    description: p.descripcionVisible,
  };
  if (p.imagenUrl) ld.image = `${SITE}${p.imagenUrl}`;
  if (esGtin13Valido(p.ean)) ld.gtin13 = p.ean;
  // El laboratorio es el fabricante/titular; la marca comercial no está en un campo propio
  // del catálogo, así que no se infiere a partir del nombre.
  if (p.laboratorio) ld.manufacturer = { "@type": "Organization", name: p.laboratorio };

  if (resumen.count > 0 && resumen.min != null && resumen.max != null) {
    ld.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: resumen.min,
      highPrice: resumen.max,
      offerCount: resumen.count,
      ...(resumen.disponibilidad ? { availability: `https://schema.org/${resumen.disponibilidad}` } : {}),
    };
  }
  return ld;
}

export function breadcrumbJsonLd(migas: Miga[], urlActual: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: m.url ? `${SITE}${m.url}` : urlActual,
    })),
  };
}

/** Serializa JSON-LD sin permitir cerrar el <script> desde los datos. */
export function serializarJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface DatosIndexacion {
  totalPrecios: number;          // filas de precio en cualquier fecha, de todos sus EAN
  registroInvima: string | null;
}

/**
 * Criterio de indexación de una ficha activa (no excluida):
 * - Con precios (vigentes o no): indexable. Sin precio vigente no significa retirado.
 * - Sin precios pero con registro INVIMA: indexable; la ficha técnica es útil y
 *   el producto puede volver a tener precio.
 * - Sin precios ni registro INVIMA: noindex. Página sin identidad verificable ni ofertas.
 * Fichas excluidas → 404; fichas fusionadas → 301/308 a la ficha canónica.
 */
export function esIndexable(d: DatosIndexacion): boolean {
  return d.totalPrecios > 0 || Boolean(d.registroInvima?.trim());
}

/**
 * /medicamento busca el slug con ILIKE '%término%'. Solo se enlaza cuando el texto es
 * de letras, cifras y espacios: así el propio producto siempre aparece en resultados.
 * Combinaciones ("A + B", "A/B") generan un término que no coincide → sin enlace.
 */
export function urlMedicamento(principioPublico: string): string | null {
  if (/[^\p{L}\p{N} ]/u.test(principioPublico.trim())) return null;
  return `/medicamento/${slugifySearch(principioPublico)}`;
}

export function urlLaboratorio(laboratorio: string): string {
  return `/laboratorio/${slugifySearch(laboratorio)}`;
}

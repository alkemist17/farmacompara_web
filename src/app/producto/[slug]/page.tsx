import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/format";
import type { Metadata } from "next";
import PreciosSection from "./PreciosSection";
import { PreciosSkeleton } from "@/components/PreciosSkeleton";

// Revalida la página cada 12 horas (ventana entre scrapes)
export const revalidate = 43200;

interface ProductoInfo {
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
}

const SQL_INFO = `
  SELECT
    mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.principio_activo,
    mp.concentracion, mp.forma_farmaceutica, mp.presentacion,
    mp.condicion_venta, mp.via_administracion, mp.codigo_atc, mp.descripcion_atc, mp.indicaciones,
    mp.registro_invima, cb.ean,
    CASE WHEN cb.ean IS NOT NULL
      THEN '/api/imagen/' || cb.ean
      ELSE NULL
    END AS imagen_url
  FROM maestro_productos mp
  LEFT JOIN codigos_barras cb ON cb.producto_id = mp.id
  WHERE mp.slug = $1
  LIMIT 1
`;

async function getProductoInfo(slug: string): Promise<ProductoInfo | null> {
  const rows = await prisma.$queryRawUnsafe<ProductoInfo[]>(SQL_INFO, slug);
  return rows[0] ?? null;
}

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = "https://mediofertas.co";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductoInfo(slug);
  if (!p) return { title: "Producto no encontrado" };

  // Precio mínimo para enriquecer la descripción y el OG
  const priceRow = await prisma.$queryRawUnsafe<{ precio_min: number | null }[]>(
    `SELECT MIN(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_min
     FROM precios p
     JOIN codigos_barras cb ON cb.ean = p.ean
     WHERE cb.producto_id = $1`,
    p.id
  );
  const precioMin = priceRow[0]?.precio_min ?? null;

  const parts = [p.nombre, p.laboratorio, p.concentracion].filter(Boolean).join(" · ");
  const priceStr = precioMin ? ` Desde ${formatCOP(precioMin)}.` : "";
  const description = `${parts}.${priceStr} Compara en todas las droguerías de Colombia.`;
  const canonical   = `${SITE}/producto/${p.slug}`;
  const imageUrl    = p.imagen_url ? `${SITE}${p.imagen_url}` : `${SITE}/og-default.png`;

  return {
    title: p.nombre,
    description,
    alternates: { canonical },
    openGraph: {
      title:       `${p.nombre}${precioMin ? ` — Desde ${formatCOP(precioMin)}` : ""}`,
      description,
      url:         canonical,
      type:        "website",
      siteName:    "MedioFertas",
      images: [{ url: imageUrl, width: 600, height: 600, alt: p.nombre }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       p.nombre,
      description,
      images:      [imageUrl],
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const producto = await getProductoInfo(slug);

  if (!producto) notFound();

  const priceRow = await prisma.$queryRawUnsafe<{ precio_min: number | null; precio_max: number | null }[]>(
    `SELECT MIN(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_min,
            MAX(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_max
     FROM precios p
     JOIN codigos_barras cb ON cb.ean = p.ean
     WHERE cb.producto_id = $1`,
    producto.id
  );
  const precioMin = priceRow[0]?.precio_min ?? null;
  const precioMax = priceRow[0]?.precio_max ?? null;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    url: `${SITE}/producto/${producto.slug}`,
    ...(producto.imagen_url ? { image: `${SITE}${producto.imagen_url}` } : {}),
    ...(producto.laboratorio ? { brand: { "@type": "Brand", name: producto.laboratorio } } : {}),
    ...(producto.principio_activo ? { description: producto.principio_activo } : {}),
    ...(precioMin != null ? {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "COP",
        lowPrice: precioMin,
        ...(precioMax != null && precioMax !== precioMin ? { highPrice: precioMax } : {}),
        availability: "https://schema.org/InStock",
      },
    } : {}),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/medicamentos" className="hover:text-primary-600 transition-colors">Medicamentos</Link>
        <span>/</span>
        <span className="text-gray-600 line-clamp-1">{producto.nombre}</span>
      </div>

      <Suspense fallback={<PreciosSkeleton />}>
        <PreciosSection
          productoId={producto.id}
          ean={producto.ean}
          slug={slug}
          nombre={producto.nombre}
          laboratorio={producto.laboratorio}
          imagenUrl={producto.imagen_url}
          concentracion={producto.concentracion}
          presentacion={producto.presentacion}
          viaAdministracion={producto.via_administracion}
          descripcionAtc={producto.descripcion_atc}
          indicaciones={producto.indicaciones}
          principioActivo={producto.principio_activo}
          condicionVenta={producto.condicion_venta}
          registroInvima={producto.registro_invima}
        />
      </Suspense>
    </div>
  );
}

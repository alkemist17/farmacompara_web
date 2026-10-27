import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import PreciosSection from "./PreciosSection";
import { PreciosSkeleton } from "@/components/PreciosSkeleton";
import {
  getImagenProducto, getPreciosProducto, getProductoInfo, getSlugRedireccion, type ProductoInfo,
} from "@/lib/producto-data";
import { nombrePublico, principioActivoPublico } from "@/lib/producto-texto";
import {
  SITE, breadcrumbJsonLd, descripcionProducto, esIndexable, metaDescription, ogTitle,
  productJsonLd, serializarJsonLd, tituloProducto, urlMedicamento, type Miga, type ProductoSeo,
} from "@/lib/producto-seo";

// Revalida cada hora: la vigencia de precios (7 días) y las etiquetas
// "Actualizado hoy / Hace N días" no deben quedar desfasadas medio día.
export const revalidate = 3600;

// Sin pre-render en el build: cada ficha se genera en la primera visita y queda
// en caché (ISR). Requiere que la página no lea cookies ni cabeceras; el estado
// del usuario (favorito, alerta) se carga en el cliente.
export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function vistaProducto(p: ProductoInfo): Promise<ProductoSeo> {
  const nombre = nombrePublico(p.nombre);
  const principio = principioActivoPublico(p.principio_activo);
  const base = { nombre, principio, laboratorio: p.laboratorio, concentracion: p.concentracion };
  return {
    ...base,
    slug: p.slug,
    ean: p.eans[0] ?? null,
    imagenUrl: await getImagenProducto(p.eans),
    descripcionVisible: descripcionProducto(base),
  };
}

function migasProducto(v: ProductoSeo): Miga[] {
  return [
    { nombre: "Inicio", url: "/" },
    { nombre: "Medicamentos", url: "/comparar" },
    // Nivel intermedio solo si /medicamento/[principio] tiene resultados (ver urlMedicamento)
    ...(v.principio && urlMedicamento(v.principio) ? [{ nombre: v.principio, url: urlMedicamento(v.principio) }] : []),
    { nombre: v.nombre, url: null },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductoInfo(slug);
  if (!p) return { title: "Producto no encontrado", robots: { index: false } };

  const [vista, { resumen }] = await Promise.all([vistaProducto(p), getPreciosProducto(p.id)]);
  const titulo      = tituloProducto(vista.nombre, vista.principio);
  const description = metaDescription(vista, resumen);
  const canonical   = `${SITE}/producto/${p.slug}`;
  // Sin imagen real del producto se usa la OG genérica (1200×630) en vez del SVG de relleno.
  const image = vista.imagenUrl
    ? { url: `${SITE}${vista.imagenUrl}`, width: 600, height: 600, alt: vista.nombre }
    : { url: `${SITE}/og-default.png`, width: 1200, height: 630, alt: "MediOfertas" };

  return {
    title: titulo,
    description,
    alternates: { canonical },
    ...(esIndexable({ totalPrecios: p.total_precios, registroInvima: p.registro_invima })
      ? {}
      : { robots: { index: false, follow: true } }),
    openGraph: {
      title:    ogTitle(titulo, resumen),
      description,
      url:      canonical,
      type:     "website",
      siteName: "MediOfertas",
      images:   [image],
    },
    twitter: {
      // Imagen cuadrada del producto → tarjeta "summary"; la OG genérica sí es 1200×630.
      card:   vista.imagenUrl ? "summary" : "summary_large_image",
      title:  titulo,
      description,
      images: [image.url],
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const producto = await getProductoInfo(slug);

  if (!producto) {
    const destino = await getSlugRedireccion(slug);
    if (destino && destino !== slug) permanentRedirect(`/producto/${destino}`);
    notFound();
  }

  const [vista, { resumen }] = await Promise.all([vistaProducto(producto), getPreciosProducto(producto.id)]);
  const migas = migasProducto(vista);
  const urlActual = `${SITE}/producto/${producto.slug}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(productJsonLd(vista, resumen)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(breadcrumbJsonLd(migas, urlActual)) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-400 min-w-0">
          {migas.map((m, i) => (
            <li key={i} className={`flex items-center gap-2 ${m.url ? "shrink-0" : "min-w-0"}`}>
              {i > 0 && <span aria-hidden="true">/</span>}
              {m.url ? (
                <Link href={m.url} className="hover:text-primary-600 transition-colors">{m.nombre}</Link>
              ) : (
                <span className="text-gray-600 line-clamp-1" aria-current="page">{m.nombre}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Suspense fallback={<PreciosSkeleton />}>
        <PreciosSection producto={producto} vista={vista} />
      </Suspense>
    </div>
  );
}

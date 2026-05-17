import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  Package, FlaskConical, Building2, Pill, Tag,
  Thermometer, FileText,
} from "lucide-react";
import { db } from "@/lib/db";
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
  temperatura_almacenamiento: number | null;
  indicaciones: string | null;
  registro_invima: string | null;
  ean: string | null;
  imagen_url: string | null;
}

const SQL_INFO = `
  SELECT
    mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.principio_activo,
    mp.concentracion, mp.forma_farmaceutica, mp.presentacion,
    mp.condicion_venta, mp.temperatura_almacenamiento, mp.indicaciones,
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
  const { rows } = await db.query<ProductoInfo>(SQL_INFO, [slug]);
  return rows[0] ?? null;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductoInfo(slug);
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.nombre,
    description: `Compara precios de ${p.nombre} en todas las droguerías de Colombia.`,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: {
      title: p.nombre,
      description: `Compara precios de ${p.nombre} en todas las droguerías de Colombia.`,
      url: `/producto/${p.slug}`,
    },
  };
}

function InfoFila({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const producto = await getProductoInfo(slug);

  if (!producto) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/medicamentos" className="hover:text-primary-600 transition-colors">Medicamentos</Link>
        <span>/</span>
        <span className="text-gray-600 line-clamp-1">{producto.nombre}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Columna izquierda: carga instantánea ── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Imagen */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-center shadow-sm min-h-[240px]">
            {producto.imagen_url ? (
              <Image
                src={producto.imagen_url}
                alt={producto.nombre}
                width={220}
                height={220}
                className="object-contain max-h-[220px]"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-300">
                <Package className="w-20 h-20" />
                <span className="text-sm">Sin imagen disponible</span>
              </div>
            )}
          </div>

          {/* Ficha técnica */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Ficha técnica
            </h2>
            <InfoFila icon={Building2}    label="Laboratorio"      value={producto.laboratorio} />
            <InfoFila icon={FlaskConical} label="Principio activo" value={producto.principio_activo} />
            <InfoFila icon={Pill}         label="Concentración"    value={producto.concentracion} />
            <InfoFila icon={Tag}          label="Forma farmac."    value={producto.forma_farmaceutica} />
            <InfoFila icon={Package}      label="Presentación"     value={producto.presentacion} />
            <InfoFila icon={FileText}     label="Reg. INVIMA"      value={producto.registro_invima} />
            <InfoFila icon={Tag}          label="Cond. de venta"   value={producto.condicion_venta} />
            {producto.temperatura_almacenamiento != null && (
              <InfoFila icon={Thermometer} label="Temperatura" value={`${producto.temperatura_almacenamiento} °C`} />
            )}
            {producto.ean && (
              <InfoFila icon={Tag} label="EAN" value={producto.ean} />
            )}
          </div>

          {/* Indicaciones */}
          {producto.indicaciones && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Indicaciones
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{producto.indicaciones}</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha: precios con streaming ── */}
        <div className="lg:col-span-2">
          <Suspense fallback={<PreciosSkeleton />}>
            <PreciosSection
              ean={producto.ean}
              slug={slug}
              nombre={producto.nombre}
              laboratorio={producto.laboratorio}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package, FlaskConical, Building2, Pill, Tag,
  Thermometer, FileText, ExternalLink, ChevronLeft,
  TrendingDown, CheckCircle, XCircle, Clock,
} from "lucide-react";
import type { ProductoDetalle, PrecioCadena } from "@/app/api/producto/[id]/route";
import { formatCOP } from "@/lib/format";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProducto(id: string): Promise<ProductoDetalle | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res  = await fetch(`${base}/api/producto/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProducto(id);
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.nombre,
    description: `Compara precios de ${p.nombre} en todas las droguerías de Colombia.`,
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

function FilaPrecio({ precio, rank }: { precio: PrecioCadena; rank: number }) {
  const tieneOferta    = precio.precio_oferta != null;
  const esMejor        = precio.es_mejor_precio;
  const precioNormal   = precio.precio_costo   ? formatCOP(parseFloat(precio.precio_costo))  : "—";
  const precioOferta   = precio.precio_oferta  ? formatCOP(parseFloat(precio.precio_oferta)) : null;
  const fecha          = new Date(precio.fecha_captura).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <tr className={esMejor ? "bg-primary-50" : rank % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
      {/* Posición */}
      <td className="px-4 py-3 w-10 text-center">
        <span className={`text-xs font-bold ${esMejor ? "text-primary-600" : "text-gray-300"}`}>
          #{rank}
        </span>
      </td>

      {/* Cadena */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {esMejor && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              <TrendingDown className="w-2.5 h-2.5" /> Mejor
            </span>
          )}
          {precio.url ? (
            <a
              href={precio.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-primary-600 flex items-center gap-1 transition-colors"
            >
              {precio.cadena}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ) : (
            <span className="text-sm font-semibold text-gray-800">{precio.cadena}</span>
          )}
        </div>
        {precio.condicion_oferta && (
          <p className="text-[11px] text-accent-600 mt-0.5">{precio.condicion_oferta}</p>
        )}
      </td>

      {/* Precio normal */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm ${tieneOferta ? "line-through text-gray-400" : "font-bold text-gray-800"}`}>
          {precioNormal}
        </span>
      </td>

      {/* Precio oferta */}
      <td className="px-4 py-3 text-right">
        {tieneOferta ? (
          <div>
            <span className="text-base font-bold text-primary-600">{precioOferta}</span>
            {precio.ahorro_pct != null && (
              <span className="ml-1.5 inline-flex items-center bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                -{precio.ahorro_pct}%
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm font-bold text-gray-700">{precioNormal}</span>
        )}
      </td>

      {/* Ahorro */}
      <td className="px-4 py-3 text-right">
        {precio.ahorro ? (
          <span className="text-sm font-semibold text-accent-600">
            {formatCOP(parseFloat(precio.ahorro))}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3 text-center">
        {precio.stock === true  && <CheckCircle className="w-4 h-4 text-primary-500 mx-auto" />}
        {precio.stock === false && <XCircle     className="w-4 h-4 text-red-400    mx-auto" />}
        {precio.stock == null   && <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* Fecha */}
      <td className="hidden lg:table-cell px-4 py-3 text-right">
        <span className="text-xs text-gray-400">{fecha}</span>
      </td>
    </tr>
  );
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) notFound();

  const mejorPrecio = producto.precios.find((p) => p.es_mejor_precio);
  const hayOfertas  = producto.precios.some((p) => p.precio_oferta != null);

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

        {/* ── Columna izquierda: imagen + ficha ── */}
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
            <InfoFila icon={Building2}   label="Laboratorio"       value={producto.laboratorio} />
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

        {/* ── Columna derecha: nombre + tabla de precios ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Nombre y resumen de mejor precio */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-secondary-500 leading-snug">
              {producto.nombre}
            </h1>
            {producto.laboratorio && (
              <p className="text-sm text-gray-400 mt-1">{producto.laboratorio}</p>
            )}

            {mejorPrecio && (
              <div className="mt-5 flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Mejor precio disponible</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCOP(parseFloat(mejorPrecio.precio_efectivo))}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">en {mejorPrecio.cadena}</p>
                </div>

                {mejorPrecio.ahorro && (
                  <div className="pb-1">
                    <p className="text-xs text-gray-400 mb-0.5">Ahorras frente al más caro</p>
                    <p className="text-xl font-bold text-accent-600">
                      {formatCOP(parseFloat(mejorPrecio.ahorro))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {producto.precios.length === 0 && (
              <p className="mt-4 text-sm text-gray-400">
                Aún no tenemos precios registrados para este producto.
              </p>
            )}
          </div>

          {/* Tabla de precios */}
          {producto.precios.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-secondary-500">
                  Precios por cadena
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Último scrape por cadena
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold w-10">#</th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Cadena</th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        Precio normal
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        {hayOfertas ? "Precio oferta" : "Precio"}
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        Ahorras
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-center">
                        Stock
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        Actualizado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {producto.precios.map((precio, i) => (
                      <FilaPrecio key={precio.fuente_id} precio={precio} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botón volver */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver al buscador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  ExternalLink, TrendingDown, Clock, ChevronLeft, AlertTriangle,
  Building2, FlaskConical, Pill, Package, Tag, FileText, Activity, ShieldCheck, ShoppingCart, Layers,
} from "lucide-react";
import FavoritoBtn from "@/components/FavoritoBtn";
import AlertaPrecioBtn from "@/components/AlertaPrecioBtn";
import FeedbackBar from "@/components/FeedbackBar";
import Link from "next/link";
import Image from "next/image";
import { formatCOP } from "@/lib/format";
import PreciosHistoricoChart from "@/components/PreciosHistoricoChart";
import AlternativasEconomicas from "@/components/AlternativasEconomicas";
import RadarPromoBanner from "@/components/RadarPromoBanner";
import type { Freshness, FreshnessState, PrecioEvaluado } from "@/lib/precios-reglas";
import {
  getOtrasPresentaciones, getPreciosProducto, type PrecioCadena, type ProductoInfo,
} from "@/lib/producto-data";
import { contieneTermino, textoPublico } from "@/lib/producto-texto";
import { urlLaboratorio, urlMedicamento, type ProductoSeo } from "@/lib/producto-seo";

type PrecioFila = PrecioEvaluado<PrecioCadena>;

function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const days = freshness.daysAgo;

  const configs: Record<FreshnessState, { dot: string; text: string; label: string }> = {
    fresh:   { dot: "bg-emerald-500", text: "text-emerald-700", label: "Actualizado hoy" },
    aging:   { dot: "bg-yellow-400",  text: "text-yellow-700",  label: `Hace ${days} ${days === 1 ? "día" : "días"}` },
    stale:   { dot: "bg-orange-400",  text: "text-orange-700",  label: `Hace ${days} días` },
    expired: { dot: "bg-red-400",     text: "text-red-600",     label: "Información antigua" },
  };

  const { dot, text, label } = configs[freshness.state];

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      {label}
    </span>
  );
}

function valorValido(v: string | null | undefined): string | null {
  if (!v) return null;
  const limpio = v.trim().toLowerCase();
  if (["no aplica", "no_aplica", "n/a", "na", "ninguno", "ninguna", "-", ""].includes(limpio)) return null;
  return v;
}

function InfoFila({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium break-words min-w-0">{value}</span>
    </div>
  );
}

function FilaPrecio({ fila, rank }: { fila: PrecioFila; rank: number }) {
  const { precio, freshness, comparabilidad } = fila;
  const tieneOferta  = precio.precio_oferta != null;
  const esMejor      = fila.esMejorPrecio;
  const isExpired    = !fila.vigente;
  const precioNormal = precio.precio_costo  != null ? formatCOP(precio.precio_costo)  : "—";
  const precioOferta = precio.precio_oferta != null ? formatCOP(precio.precio_oferta) : null;
  const fecha        = new Date(precio.fecha_captura).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota",
  });

  const rowBg = isExpired
    ? "bg-gray-50"
    : esMejor
      ? "bg-primary-50"
      : rank % 2 === 0 ? "bg-gray-50/50" : "bg-white";

  return (
    <tr className={`${rowBg} ${isExpired ? "opacity-60" : ""}`}>
      <td className="px-4 py-3 w-10 text-center">
        <span className={`text-xs font-bold ${esMejor ? "text-primary-600" : "text-gray-300"}`}>
          #{rank}
        </span>
      </td>
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
        {comparabilidad && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-0.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {comparabilidad === "bajo"
              ? "Posible presentación diferente (más pequeña)"
              : "Posible presentación diferente (más grande)"}
          </p>
        )}
        <div className="mt-0.5 flex flex-col gap-0.5">
          <FreshnessBadge freshness={freshness} />
          {isExpired && (
            <span className="text-[10px] text-gray-400">
              Última verificación hace {freshness.daysAgo} días
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm ${tieneOferta ? "line-through text-gray-400" : isExpired ? "text-gray-400" : "font-bold text-gray-800"}`}>
          {precioNormal}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {isExpired ? (
          <span className="text-xs text-red-400 font-medium">Precio<br />desactualizado</span>
        ) : tieneOferta ? (
          <div>
            <span className="text-base font-bold text-primary-600">{precioOferta}</span>
            {precio.ahorro_pct != null && (
              <span className="ml-1.5 inline-flex items-center bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                -{precio.ahorro_pct}%
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!isExpired && precio.ahorro ? (
          <span className="text-sm font-semibold text-accent-600">
            {formatCOP(precio.ahorro)}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-right">
        <span className="text-xs text-gray-400">{fecha}</span>
      </td>
    </tr>
  );
}

interface Props {
  producto: ProductoInfo;
  vista: ProductoSeo;
}

export default async function PreciosSection({ producto, vista }: Props) {
  const [{ precios, resumen }, otrasPresentaciones] = await Promise.all([
    getPreciosProducto(producto.id),
    getOtrasPresentaciones(producto),
  ]);

  const {
    id: productoId, slug, laboratorio, principio_activo: principioActivo, concentracion,
    via_administracion: viaAdministracion, descripcion_atc: descripcionAtc, indicaciones,
    condicion_venta: condicionVenta, registro_invima: registroInvima, eans,
  } = producto;
  const { nombre, principio, imagenUrl } = vista;
  const ean = vista.ean;
  const presentacion = textoPublico(valorValido(producto.presentacion));
  const urlPrincipio = principio ? urlMedicamento(principio) : null;
  // El texto INVIMA se conserva en la ficha cuando difiere de la denominación pública.
  const composicionTecnica = principioActivo && principio && principioActivo.trim().toLowerCase() !== principio.toLowerCase()
    ? principioActivo
    : null;

  const mejorPrecio = precios.find((p) => p.esMejorPrecio);
  const hayOfertas  = precios.some((p) => p.precio.precio_oferta != null);

  // Excluir vencidos y posibles otras presentaciones del cálculo de ahorro, para
  // no comparar contra precios obsoletos o de un producto distinto.
  const preciosActivos = precios.filter((p) => p.vigente);
  const preciosComparables = preciosActivos.filter((p) => !p.comparabilidad);
  const poolComparable = preciosComparables.length > 0 ? preciosComparables : preciosActivos;

  // Only compare stores that share the same pricing basis (both have offers, or both use list price)
  // to avoid inflated "savings" when mixing offer prices with list prices across stores.
  const preciosConOferta = poolComparable.filter((p) => p.precio.precio_oferta != null);
  const basePrecios = preciosConOferta.length >= 2 ? preciosConOferta : poolComparable;
  const precioMaximo = basePrecios.length > 0
    ? Math.max(...basePrecios.map((p) => p.precioEfectivo!))
    : null;
  const precioMinimo = mejorPrecio?.precioEfectivo ?? null;
  const ahorroVsMaximo = (precioMaximo && precioMinimo && precioMaximo > precioMinimo)
    ? precioMaximo - precioMinimo
    : null;
  const pctAhorroVsMaximo = (ahorroVsMaximo && precioMaximo)
    ? Math.round((ahorroVsMaximo / precioMaximo) * 100)
    : null;

  const ultimaActualizacion = precios.length > 0
    ? new Date(Math.max(...precios.map((p) => new Date(p.precio.fecha_captura).getTime())))
        .toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" })
    : null;

  return (
    <div className="space-y-6">

      {/* ── Hero: una sola card, grid interno de 3 columnas ── */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <FavoritoBtn productoId={productoId} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Col 1: precio */}
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200 p-6 flex flex-col gap-3 rounded-2xl">
            {mejorPrecio ? (
              <>
                <div>
                  <div className="flex flex-row items-center gap-2">
                    <span className="inline-flex items-center bg-primary-500 text-white text-[11px] font-bold px-2.5 py-1 rounded tracking-wide uppercase">
                      Mejor precio
                    </span>
                    <p className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      En {resumen.count} {resumen.count === 1 ? "farmacia" : "farmacias"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCOP(mejorPrecio.precioEfectivo)}
                  </p>
                  {mejorPrecio.precio.url ? (
                    <a
                      href={mejorPrecio.precio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 mt-0.5 transition-colors"
                    >
                      {mejorPrecio.precio.cadena}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-gray-600 mt-0.5">{mejorPrecio.precio.cadena}</p>
                  )}
                </div>

                {ahorroVsMaximo && (
                  <div className="rounded-xl bg-primary-50 px-4 py-3">
                    <p className="text-[10px] font-bold text-primary-700 uppercase tracking-widest">Ahorras</p>
                    <p className="text-xl font-bold text-accent-500 leading-tight">
                      {formatCOP(ahorroVsMaximo)}
                      {pctAhorroVsMaximo ? (
                        <span className="ml-1">({pctAhorroVsMaximo}%)</span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">frente al precio más alto</p>
                  </div>
                )}

                <div className="pt-3 flex flex-col gap-2">
                  {mejorPrecio.precio.url && (
                    <a
                      href={mejorPrecio.precio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ver oferta en {mejorPrecio.precio.cadena}
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  )}
                  <AlertaPrecioBtn productoId={productoId} nombreProducto={nombre} />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  {precios.length > 0
                    ? "No hay precios actualizados en los últimos 7 días."
                    : "Aún no tenemos precios registrados para este producto."}
                </p>
                <AlertaPrecioBtn productoId={productoId} nombreProducto={nombre} />
              </>
            )}
          </div>

          {/* Col 2-3: título, descripción e imagen */}
          <div className="lg:col-span-2 p-6 lg:pl-0 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-secondary-500 leading-snug">{nombre}</h1>
              {valorValido(laboratorio) && (
                <p className="text-sm text-gray-400 mt-1">
                  <Link href={urlLaboratorio(laboratorio!)} className="hover:text-primary-600 transition-colors">
                    {laboratorio}
                  </Link>
                </p>
              )}
              {principio && (
                <p className="text-sm text-gray-500 mt-1">
                  Principio activo:{" "}
                  {urlPrincipio ? (
                    <Link href={urlPrincipio} className="font-medium text-primary-600 hover:text-primary-700">
                      {principio}
                    </Link>
                  ) : (
                    <span className="font-medium">{principio}</span>
                  )}
                </p>
              )}
              {valorValido(indicaciones) && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-4">
                  {indicaciones!.charAt(0).toUpperCase() + indicaciones!.slice(1).toLowerCase()}
                </p>
              )}
              {/* La descripción ATC suele repetir el principio activo ("SILDENAFIL"); solo se muestra si aporta algo */}
              {!valorValido(indicaciones) && valorValido(descripcionAtc) && !(principio && contieneTermino(principio, descripcionAtc)) && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-3">{descripcionAtc}</p>
              )}

              {(valorValido(concentracion) || presentacion || valorValido(viaAdministracion)) && (
                <div className="mt-5 flex flex-wrap divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  {presentacion && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Package className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Presentación</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{presentacion}</p>
                      </div>
                    </div>
                  )}
                  {valorValido(concentracion) && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Pill className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Concentración</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{textoPublico(concentracion)}</p>
                      </div>
                    </div>
                  )}
                  {valorValido(viaAdministracion) && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Activity className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Vía admin.</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{textoPublico(viaAdministracion)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-none flex items-center justify-center w-80 self-center">
              {imagenUrl ? (
                <Image
                  src={imagenUrl}
                  alt={nombre}
                  width={350}
                  height={350}
                  className="object-contain max-h-[350px]"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-200">
                  <Package className="w-20 h-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Encuesta de feedback ── */}
      {ean && <FeedbackBar ean={ean} />}

      {/* ── Fila inferior: ficha técnica | precios + gráfica ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tabla de precios + gráfica: primero en el HTML y en móvil */}
        <div className="lg:col-span-2 lg:order-2 space-y-5">
          {precios.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-secondary-500">Precios por cadena</h2>
                {ultimaActualizacion && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    Última actualización: {ultimaActualizacion}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold w-10">#</th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Cadena</th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">Precio normal</th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        {hayOfertas ? "Precio oferta" : "Precio"}
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-400 font-semibold text-right">Ahorras</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-xs text-gray-400 font-semibold text-right">
                        Actualizado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {precios.map((fila, i) => (
                      <FilaPrecio key={fila.precio.fuente_id} fila={fila} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 px-4 pt-3 pb-3">
                <div className="flex items-center gap-2.5 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                  <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0" />
                  <p className="text-xs text-primary-700">
                    Los precios pueden variar según la disponibilidad y ubicación. Verifica siempre en la tienda.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-gray-400">
                Aún no tenemos precios registrados para este producto.
              </p>
            </div>
          )}

          <PreciosHistoricoChart slug={slug} ean={ean} />
        </div>

        {/* Ficha técnica, otras presentaciones y Radar */}
        <div className="lg:order-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-secondary-500 mb-3">
              Ficha técnica
            </h2>
            <InfoFila icon={Building2}    label="Laboratorio"      value={laboratorio} />
            <InfoFila icon={FlaskConical} label="Principio activo" value={principio} />
            <InfoFila icon={FlaskConical} label="Composición (INVIMA)" value={composicionTecnica} />
            <InfoFila icon={Pill}         label="Concentración"    value={concentracion} />
            <InfoFila icon={Package}      label="Presentación"     value={presentacion} />
            <InfoFila icon={FileText}     label="Reg. INVIMA"      value={registroInvima} />
            <InfoFila icon={Tag}          label="Cond. de venta"   value={textoPublico(condicionVenta)} />
            <InfoFila icon={Activity}     label="Vía administrac." value={textoPublico(viaAdministracion)} />
            {eans.length > 0 && (
              <InfoFila icon={Tag} label={eans.length > 1 ? "Códigos EAN" : "EAN"} value={eans.join(", ")} />
            )}
          </div>

          {otrasPresentaciones.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-secondary-500 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500" />
                Otras presentaciones
              </h2>
              <ul className="divide-y divide-gray-200">
                {otrasPresentaciones.map((r) => (
                  <li key={r.slug} className="py-2.5 flex items-center justify-between gap-3">
                    <Link href={`/producto/${r.slug}`} className="text-sm text-gray-800 hover:text-primary-600 transition-colors min-w-0">
                      {r.nombre}
                    </Link>
                    <span className="text-xs text-gray-500 shrink-0">
                      {r.precio_min != null ? `desde ${formatCOP(r.precio_min)}` : "sin precio reciente"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RadarPromoBanner />
        </div>
      </div>

      {/* ── Mismo principio activo y concentración ── */}
      {principioActivo && concentracion && (
        <AlternativasEconomicas
          principioActivo={principioActivo}
          principioPublico={principio}
          concentracion={concentracion}
          viaAdministracion={viaAdministracion}
          currentSlug={slug}
        />
      )}

      {/* Volver */}
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
  );
}

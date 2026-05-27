import {
  ExternalLink, TrendingDown, Clock, ChevronLeft,
  Building2, FlaskConical, Pill, Package, Tag, FileText, Activity, ShieldCheck, ShoppingCart,
} from "lucide-react";
import FavoritoBtn from "@/components/FavoritoBtn";
import AlertaPrecioBtn from "@/components/AlertaPrecioBtn";
import FeedbackBar from "@/components/FeedbackBar";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCOP } from "@/lib/format";
import PreciosHistoricoChart from "@/components/PreciosHistoricoChart";
import AlternativasEconomicas from "@/components/AlternativasEconomicas";

type FreshnessState = "fresh" | "aging" | "stale" | "expired";

interface Freshness {
  state: FreshnessState;
  daysAgo: number;
}

function getFreshness(fechaCaptura: string): Freshness {
  const diffMs = Date.now() - new Date(fechaCaptura).getTime();
  const daysAgo = diffMs / (1000 * 60 * 60 * 24);
  if (daysAgo < 1)  return { state: "fresh",   daysAgo };
  if (daysAgo <= 3) return { state: "aging",   daysAgo };
  if (daysAgo <= 7) return { state: "stale",   daysAgo };
  return { state: "expired", daysAgo };
}

interface PrecioCadena {
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
  freshness: Freshness;
}

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

async function getPrecios(ean: string): Promise<PrecioCadena[]> {
  const rows = await prisma.$queryRawUnsafe<Omit<PrecioCadena, "es_mejor_precio" | "freshness">[]>(SQL_PRECIOS, ean);

  const withFreshness = rows.map(p => ({ ...p, freshness: getFreshness(p.fecha_captura) }));

  const activeRows  = withFreshness.filter(p => p.freshness.state !== "expired");
  const expiredRows = withFreshness.filter(p => p.freshness.state === "expired");

  const minPrecio = activeRows.reduce(
    (min, p) => parseFloat(p.precio_efectivo) < min ? parseFloat(p.precio_efectivo) : min,
    Infinity
  );

  return [
    ...activeRows.map(p => ({
      ...p,
      es_mejor_precio: isFinite(minPrecio) && parseFloat(p.precio_efectivo) === minPrecio,
    })),
    ...expiredRows.map(p => ({ ...p, es_mejor_precio: false })),
  ];
}

function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const days = Math.floor(freshness.daysAgo);

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
  value: string | number | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function FilaPrecio({ precio, rank }: { precio: PrecioCadena; rank: number }) {
  const tieneOferta  = precio.precio_oferta != null;
  const esMejor      = precio.es_mejor_precio;
  const isExpired    = precio.freshness.state === "expired";
  const daysAgo      = Math.floor(precio.freshness.daysAgo);
  const precioNormal = precio.precio_costo  ? formatCOP(parseFloat(precio.precio_costo))  : "—";
  const precioOferta = precio.precio_oferta ? formatCOP(parseFloat(precio.precio_oferta)) : null;
  const fecha        = new Date(precio.fecha_captura).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
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
        <div className="mt-0.5 flex flex-col gap-0.5">
          <FreshnessBadge freshness={precio.freshness} />
          {isExpired && (
            <span className="text-[10px] text-gray-400">
              Última verificación hace {daysAgo} días
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
            {formatCOP(parseFloat(precio.ahorro))}
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
  productoId: number;
  ean: string | null;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  imagenUrl: string | null;
  concentracion: string | null;
  presentacion: string | null;
  viaAdministracion: string | null;
  descripcionAtc: string | null;
  indicaciones: string | null;
  principioActivo: string | null;
  condicionVenta: string | null;
  registroInvima: string | null;
}

export default async function PreciosSection({
  productoId, ean, slug, nombre, laboratorio, imagenUrl, concentracion,
  presentacion, viaAdministracion, descripcionAtc, indicaciones,
  principioActivo, condicionVenta, registroInvima,
}: Props) {
  const [precios, session] = await Promise.all([
    ean ? getPrecios(ean) : Promise.resolve([]),
    auth(),
  ]);

  const userId = session?.user?.id ?? null;

  const [isFavorito, alertaActual] = userId
    ? await Promise.all([
        prisma.favoritos.findUnique({
          where: { usuario_id_producto_id: { usuario_id: userId, producto_id: productoId } },
          select: { id: true },
        }).then((r) => r !== null),
        prisma.alertas_precio.findUnique({
          where: { usuario_id_producto_id: { usuario_id: userId, producto_id: productoId } },
          select: { tipo: true, precio_objetivo: true, activa: true },
        }),
      ])
    : [false, null];

  const initialAlerta = alertaActual
    ? {
        tipo: alertaActual.tipo as "cualquier_bajada" | "precio_objetivo",
        precio_objetivo: alertaActual.precio_objetivo?.toNumber() ?? null,
        activa: alertaActual.activa,
      }
    : null;
  const mejorPrecio = precios.find((p) => p.es_mejor_precio);
  const hayOfertas  = precios.some((p) => p.precio_oferta != null);

  // Excluir expired del cálculo de ahorro para no comparar precios potencialmente obsoletos.
  const preciosActivos = precios.filter(p => p.freshness.state !== "expired");

  // Only compare stores that share the same pricing basis (both have offers, or both use list price)
  // to avoid inflated "savings" when mixing offer prices with list prices across stores.
  const preciosConOferta = preciosActivos.filter(p => p.precio_oferta != null);
  const basePrecios = preciosConOferta.length >= 2 ? preciosConOferta : preciosActivos;
  const precioMaximo = basePrecios.length > 0
    ? Math.max(...basePrecios.map(p => parseFloat(p.precio_efectivo)))
    : null;
  const precioMinimo = mejorPrecio ? parseFloat(mejorPrecio.precio_efectivo) : null;
  const ahorroVsMaximo = (precioMaximo && precioMinimo && precioMaximo > precioMinimo)
    ? precioMaximo - precioMinimo
    : null;
  const pctAhorroVsMaximo = (ahorroVsMaximo && precioMaximo)
    ? Math.round((ahorroVsMaximo / precioMaximo) * 100)
    : null;

  const ultimaActualizacion = precios.length > 0
    ? new Date(Math.max(...precios.map(p => new Date(p.fecha_captura).getTime())))
        .toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">

      {/* ── Hero: una sola card, grid interno de 3 columnas ── */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <FavoritoBtn productoId={productoId} initialFavorito={isFavorito} />
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
                      En {precios.length} {precios.length === 1 ? "farmacia" : "farmacias"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatCOP(parseFloat(mejorPrecio.precio_efectivo))}
                  </p>
                  {mejorPrecio.url ? (
                    <a
                      href={mejorPrecio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 mt-0.5 transition-colors"
                    >
                      {mejorPrecio.cadena}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-gray-600 mt-0.5">{mejorPrecio.cadena}</p>
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
                  {mejorPrecio.url && (
                    <a
                      href={mejorPrecio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ver oferta en {mejorPrecio.cadena}
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  )}
                  <AlertaPrecioBtn
                    productoId={productoId}
                    nombreProducto={nombre}
                    initialAlerta={initialAlerta}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Sin precios disponibles</p>
            )}
          </div>

          {/* Col 2-3: título, descripción e imagen */}
          <div className="lg:col-span-2 p-6 lg:pl-0 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-secondary-500 leading-snug">{nombre}</h1>
              {valorValido(laboratorio) && (
                <p className="text-sm text-gray-400 mt-1">{laboratorio}</p>
              )}
              {valorValido(principioActivo) && (
                <p className="text-sm text-gray-500 mt-1">
                  {principioActivo!.charAt(0).toUpperCase() + principioActivo!.slice(1).toLowerCase()}
                </p>
              )}
              {valorValido(indicaciones) && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-4">
                  {indicaciones!.charAt(0).toUpperCase() + indicaciones!.slice(1).toLowerCase()}
                </p>
              )}
              {!valorValido(indicaciones) && valorValido(descripcionAtc) && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-3">{descripcionAtc}</p>
              )}

              {(valorValido(concentracion) || valorValido(presentacion) || valorValido(viaAdministracion)) && (
                <div className="mt-5 flex flex-wrap divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  {valorValido(presentacion) && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Package className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Presentación</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{presentacion!.charAt(0).toUpperCase() + presentacion!.slice(1).toLowerCase()}</p>
                      </div>
                    </div>
                  )}
                  {valorValido(concentracion) && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Pill className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Concentración</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{concentracion!.charAt(0).toUpperCase() + concentracion!.slice(1).toLowerCase()}</p>
                      </div>
                    </div>
                  )}
                  {valorValido(viaAdministracion) && (
                    <div className="flex items-center gap-2.5 px-4 py-3 flex-1 min-w-0">
                      <Activity className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 tracking-wide font-semibold">Vía admin.</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{viaAdministracion!.charAt(0).toUpperCase() + viaAdministracion!.slice(1).toLowerCase()}</p>
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

        {/* Ficha técnica e indicaciones */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-secondary-500 mb-3">
              Ficha técnica
            </h2>
            <InfoFila icon={Building2}    label="Laboratorio"      value={laboratorio} />
            <InfoFila icon={FlaskConical} label="Principio activo" value={principioActivo} />
            <InfoFila icon={Pill}         label="Concentración"    value={concentracion} />
            <InfoFila icon={Package}      label="Presentación"     value={presentacion} />
            <InfoFila icon={FileText}     label="Reg. INVIMA"      value={registroInvima} />
            <InfoFila icon={Tag}          label="Cond. de venta"   value={condicionVenta} />
            <InfoFila icon={Activity}     label="Vía administrac." value={viaAdministracion} />
            {ean && <InfoFila icon={Tag}  label="EAN"              value={ean} />}
          </div>

        </div>

        {/* Tabla de precios + gráfica */}
        <div className="lg:col-span-2 space-y-5">
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
                    {precios.map((precio, i) => (
                      <FilaPrecio key={precio.fuente_id} precio={precio} rank={i + 1} />
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
      </div>

      {/* ── Alternativas más económicas ── */}
      {principioActivo && concentracion && (
        <AlternativasEconomicas
          principioActivo={principioActivo}
          concentracion={concentracion}
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

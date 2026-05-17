import { ExternalLink, TrendingDown, Clock } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import PreciosHistoricoChart from "@/components/PreciosHistoricoChart";

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
}

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
  ORDER BY COALESCE(ph.precio_oferta, ph.precio_costo) ASC NULLS LAST
`;

async function getPrecios(ean: string): Promise<PrecioCadena[]> {
  const { rows } = await db.query<Omit<PrecioCadena, "es_mejor_precio">>(SQL_PRECIOS, [ean]);

  const minPrecio = rows.reduce(
    (min, p) => parseFloat(p.precio_efectivo) < min ? parseFloat(p.precio_efectivo) : min,
    Infinity
  );

  return rows.map((p) => ({
    ...p,
    es_mejor_precio: parseFloat(p.precio_efectivo) === minPrecio,
  }));
}

function FilaPrecio({ precio, rank }: { precio: PrecioCadena; rank: number }) {
  const tieneOferta  = precio.precio_oferta != null;
  const esMejor      = precio.es_mejor_precio;
  const precioNormal = precio.precio_costo  ? formatCOP(parseFloat(precio.precio_costo))  : "—";
  const precioOferta = precio.precio_oferta ? formatCOP(parseFloat(precio.precio_oferta)) : null;
  const fecha        = new Date(precio.fecha_captura).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <tr className={esMejor ? "bg-primary-50" : rank % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
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
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm ${tieneOferta ? "line-through text-gray-400" : "font-bold text-gray-800"}`}>
          {precioNormal}
        </span>
      </td>
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
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {precio.ahorro ? (
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
  ean: string | null;
  slug: string;
  nombre: string;
  laboratorio: string | null;
}

export default async function PreciosSection({ ean, slug, nombre, laboratorio }: Props) {
  const precios    = ean ? await getPrecios(ean) : [];
  const mejorPrecio = precios.find((p) => p.es_mejor_precio);
  const hayOfertas  = precios.some((p) => p.precio_oferta != null);

  return (
    <div className="space-y-5">

      {/* Nombre y mejor precio */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-secondary-500 leading-snug">{nombre}</h1>
        {laboratorio && (
          <p className="text-sm text-gray-400 mt-1">{laboratorio}</p>
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

        {precios.length === 0 && (
          <p className="mt-4 text-sm text-gray-400">
            Aún no tenemos precios registrados para este producto.
          </p>
        )}
      </div>

      {/* Tabla de precios */}
      {precios.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-secondary-500">Precios por cadena</h2>
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
              <tbody className="divide-y divide-gray-50">
                {precios.map((precio, i) => (
                  <FilaPrecio key={precio.fuente_id} precio={precio} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfica de precios históricos */}
      <PreciosHistoricoChart slug={slug} ean={ean} />

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
  );
}

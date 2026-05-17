"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { PuntoHistorial } from "@/app/api/producto/[slug]/historial/route";
import { TrendingUp } from "lucide-react";

const PALETTE = [
  "#10b981", "#0ea5e9", "#f59e0b", "#6366f1",
  "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
];

function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);
}

function formatFecha(str: string) {
  const [, m, d] = str.split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

interface ChartPoint {
  fecha: string;
  [cadena: string]: number | string;
}

interface Props { slug: string; ean: string | null }

export default function PreciosHistoricoChart({ slug, ean }: Props) {
  const [puntos, setPuntos]   = useState<ChartPoint[]>([]);
  const [cadenas, setCadenas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacio, setVacio]     = useState(false);

  useEffect(() => {
    if (!ean) { setLoading(false); setVacio(true); return; }
    fetch(`/api/producto/${slug}/historial?ean=${encodeURIComponent(ean)}`)
      .then((r) => r.json())
      .then((data: PuntoHistorial[]) => {
        if (!data.length) { setVacio(true); return; }

        // Cadenas únicas en orden de aparición
        const cadenasSet = Array.from(new Set(data.map((d) => d.cadena)));
        setCadenas(cadenasSet);

        // Pivotear: una entrada por fecha con precio de cada cadena
        const byFecha = new Map<string, ChartPoint>();
        data.forEach(({ fecha, cadena, precio }) => {
          if (!byFecha.has(fecha)) byFecha.set(fecha, { fecha });
          byFecha.get(fecha)![cadena] = precio;
        });

        setPuntos(Array.from(byFecha.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)));
      })
      .catch(() => setVacio(true))
      .finally(() => setLoading(false));
  }, [slug, ean]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (vacio) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary-500" />
        <h2 className="font-bold text-secondary-500">Evolución de precios — últimos 3 meses</h2>
      </div>

      <div className="px-2 pt-4 pb-6">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={puntos} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatFecha}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 0 }).format(v)
              }
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) => [formatCOP(Number(value)), ""]}
              labelFormatter={(label) => {
                const str = String(label);
                const [y, m, d] = str.split("-");
                return new Date(Number(y), Number(m) - 1, Number(d))
                  .toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
              }}
              contentStyle={{
                borderRadius: "12px", border: "1px solid #f3f4f6",
                boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              formatter={(value) => <span style={{ color: "#6b7280" }}>{value}</span>}
            />
            {cadenas.map((cadena, i) => (
              <Line
                key={cadena}
                type="monotone"
                dataKey={cadena}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

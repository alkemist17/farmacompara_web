// Reglas de vigencia y resumen de precios. Única implementación usada por la
// tabla de precios, los metadatos, Open Graph y el JSON-LD de /producto/[slug].
// Módulo puro (sin BD) para poder probarlo con `npm test`.

// Misma ventana que mv_precios_resumen y AlternativasEconomicas:
// p.fecha_revision >= NOW() - INTERVAL '7 days'.
export const VIGENCIA_DIAS = 7;
const MS_DIA = 24 * 60 * 60 * 1000;

const ZONA_HORARIA = "America/Bogota";

export type FreshnessState = "fresh" | "aging" | "stale" | "expired";

export interface Freshness {
  state: FreshnessState;
  // Días de calendario (hora de Colombia) desde la última revisión del precio.
  daysAgo: number;
}

export type Comparabilidad = "bajo" | "alto" | null;

// Umbral mínimo de fuentes activas para calcular una mediana confiable.
// Con 1-2 precios no hay forma de saber cuál es el "raro" — por debajo de esto no se evalúa.
export const MIN_FUENTES_COMPARABILIDAD = 3;
const RATIO_BAJO = 0.4;
const RATIO_ALTO = 2.0;

/** Precio tal como sale de la BD, una fila por cadena. */
export interface PrecioBase {
  fuente_id: number;
  ean: string;
  precio_costo: string | number | null;
  precio_oferta: string | number | null;
  stock: boolean | null;
  // fecha_revision: última vez que el scraper consultó y confirmó el precio.
  // No es la fecha en que cambió el precio (fecha_cambio) ni confirma inventario.
  fecha_captura: string | Date;
}

export interface PrecioEvaluado<T extends PrecioBase = PrecioBase> {
  precio: T;
  precioEfectivo: number | null;
  vigente: boolean;
  freshness: Freshness;
  comparabilidad: Comparabilidad;
  esMejorPrecio: boolean;
}

export type Disponibilidad = "InStock" | "OutOfStock" | null;

export interface ResumenOfertas {
  /** Ofertas que se pueden anunciar: vigentes, con precio, comparables y no marcadas sin stock. */
  count: number;
  min: number | null;
  max: number | null;
  /** null = inventario desconocido; no se debe declarar disponibilidad. */
  disponibilidad: Disponibilidad;
}

function aFecha(valor: string | Date): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

function fechaCalendario(fecha: Date): string {
  // en-CA formatea como YYYY-MM-DD
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

/** Diferencia en días de calendario de Colombia (hoy = 0, ayer = 1). */
export function diasCalendario(fecha: string | Date, ahora: Date): number {
  const a = Date.parse(fechaCalendario(aFecha(fecha)));
  const b = Date.parse(fechaCalendario(ahora));
  return Math.max(0, Math.round((b - a) / MS_DIA));
}

export function esVigente(fecha: string | Date, ahora: Date): boolean {
  const t = aFecha(fecha).getTime();
  if (Number.isNaN(t)) return false;
  return ahora.getTime() - t <= VIGENCIA_DIAS * MS_DIA;
}

export function getFreshness(fecha: string | Date, ahora: Date): Freshness {
  const daysAgo = diasCalendario(fecha, ahora);
  if (!esVigente(fecha, ahora)) return { state: "expired", daysAgo };
  if (daysAgo === 0) return { state: "fresh", daysAgo };
  if (daysAgo <= 3)  return { state: "aging", daysAgo };
  return { state: "stale", daysAgo };
}

export function precioEfectivo(p: Pick<PrecioBase, "precio_costo" | "precio_oferta">): number | null {
  const valor = p.precio_oferta ?? p.precio_costo;
  if (valor == null) return null;
  const n = typeof valor === "number" ? valor : parseFloat(valor);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function calcularMediana(valores: number[]): number {
  const sorted = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Evalúa vigencia, comparabilidad y mejor precio de cada fila.
 * Devuelve primero las vigentes ordenadas por precio y al final las vencidas.
 */
export function evaluarPrecios<T extends PrecioBase>(rows: T[], ahora: Date): PrecioEvaluado<T>[] {
  const base = rows.map((precio) => {
    const efectivo = precioEfectivo(precio);
    return {
      precio,
      precioEfectivo: efectivo,
      vigente: efectivo != null && esVigente(precio.fecha_captura, ahora),
      freshness: getFreshness(precio.fecha_captura, ahora),
    };
  });

  const activos = base.filter((p) => p.vigente);
  const vencidos = base.filter((p) => !p.vigente);

  const mediana = activos.length >= MIN_FUENTES_COMPARABILIDAD
    ? calcularMediana(activos.map((p) => p.precioEfectivo!))
    : null;

  const activosEvaluados = activos.map((p) => {
    let comparabilidad: Comparabilidad = null;
    if (mediana && mediana > 0) {
      const ratio = p.precioEfectivo! / mediana;
      if (ratio < RATIO_BAJO) comparabilidad = "bajo";
      else if (ratio > RATIO_ALTO) comparabilidad = "alto";
    }
    return { ...p, comparabilidad };
  });

  // El "mejor precio" solo se calcula entre precios anunciables, para no promocionar
  // como ganador un precio que probablemente corresponde a otra presentación.
  const pool = activosEvaluados.filter(esAnunciable);
  const min = pool.length > 0 ? Math.min(...pool.map((p) => p.precioEfectivo!)) : null;
  let mejorAsignado = false;

  const ordenados = [...activosEvaluados].sort((a, b) => a.precioEfectivo! - b.precioEfectivo!);

  return [
    ...ordenados.map((p) => {
      const esMejor = !mejorAsignado && min != null && p.precioEfectivo === min && esAnunciable(p);
      if (esMejor) mejorAsignado = true;
      return { ...p, esMejorPrecio: esMejor };
    }),
    ...vencidos.map((p) => ({ ...p, comparabilidad: null as Comparabilidad, esMejorPrecio: false })),
  ];
}

function esAnunciable(p: { vigente: boolean; comparabilidad: Comparabilidad; precio: PrecioBase }): boolean {
  return p.vigente && p.comparabilidad === null && p.precio.stock !== false;
}

/**
 * Resumen para metadatos y JSON-LD. Usa exactamente el mismo conjunto que
 * define el "Mejor precio" visible en la página.
 */
export function resumirOfertas(evaluados: PrecioEvaluado[]): ResumenOfertas {
  const ofertas = evaluados.filter(esAnunciable);
  if (ofertas.length === 0) return { count: 0, min: null, max: null, disponibilidad: null };

  const precios = ofertas.map((p) => p.precioEfectivo!);
  // Solo se declara InStock si alguna cadena lo confirmó explícitamente.
  // stock = null significa desconocido, no agotado.
  const disponibilidad: Disponibilidad = ofertas.some((p) => p.precio.stock === true) ? "InStock" : null;

  return {
    count: ofertas.length,
    min: Math.min(...precios),
    max: Math.max(...precios),
    disponibilidad,
  };
}

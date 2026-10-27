// Detección de candidatos a producto duplicado (mismo producto comercial con
// varias fichas). Solo propone: nunca fusiona. Ver scripts/reporte-duplicados.ts.
//
// Contexto: la migración 011 del scraper dejó de deduplicar por registro INVIMA
// porque algunas farmacias devuelven el mismo registro para productos distintos.
// Por eso aquí el registro es solo la puerta de entrada y se exige además
// concentración, cantidad y forma compatibles, y se marcan las contradicciones.
import { principioActivoPublico } from "./producto-texto";

export interface FichaCatalogo {
  id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  registro_invima: string | null;
  principio_activo: string | null;
  concentracion: string | null;
  forma_farmaceutica: string | null;
  presentacion: string | null;
  codigo_atc: string | null;
  eans: string[];
  ofertas_vigentes: number;
  cadenas: string[];
}

export type Confianza = "alta" | "media" | "revisar";

export interface GrupoCandidato {
  clave: string;
  confianza: Confianza;
  fichas: FichaCatalogo[];
  contradicciones: string[];
  camposIncompletos: string[];
}

function sinTildes(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "2023M-0018103 R1" y "2023M-0018103-R1" → "2023M0018103R1". */
export function normalizarRegistro(registro: string | null | undefined): string | null {
  if (!registro) return null;
  const r = sinTildes(registro).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return r.length >= 6 ? r : null;
}

export function normalizarConcentracion(c: string | null | undefined): string | null {
  if (!c) return null;
  const n = sinTildes(c).toLowerCase().replace(/,/g, ".").replace(/\s+/g, "");
  return n || null;
}

/** Unidades por empaque: "CAJA X 2 C PSULAS" → 2, "Caja Por 30 tabletas" → 30. */
export function extraerCantidad(...textos: (string | null | undefined)[]): number | null {
  for (const t of textos) {
    if (!t) continue;
    const m = sinTildes(t).match(/\b(?:x|por|caja|cja|c\/)\s*(\d{1,4})\b(?!\s*(?:mg|mcg|g|ml|%|ui)\b)/i);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

const FORMAS: [RegExp, string][] = [
  [/capsul|psul|caps\b|cap\b/, "capsula"],
  [/tablet|tab\b|tabs\b|comprimid|gragea/, "tableta"],
  [/jarabe/, "jarabe"],
  [/suspensi/, "suspension"],
  [/soluci|gotas/, "solucion"],
  [/crema/, "crema"],
  [/gel\b/, "gel"],
  [/inyect|ampoll|vial/, "inyectable"],
  [/polvo|sobre/, "polvo"],
];

/** Agrupa formas equivalentes: "CAPSULA BLANDA" y "Caps" → "capsula". */
export function grupoForma(...textos: (string | null | undefined)[]): string | null {
  for (const t of textos) {
    if (!t) continue;
    const lower = sinTildes(t).toLowerCase();
    for (const [re, grupo] of FORMAS) if (re.test(lower)) return grupo;
  }
  return null;
}

function primeraPalabra(texto: string | null): string | null {
  if (!texto) return null;
  return sinTildes(texto).toLowerCase().split(/[\s,.-]+/)[0] || null;
}

/** Clasifica un grupo de fichas que comparten registro INVIMA y concentración. */
export function evaluarGrupo(clave: string, fichas: FichaCatalogo[]): GrupoCandidato | null {
  if (fichas.length < 2) return null;

  const contradicciones: string[] = [];
  const camposIncompletos: string[] = [];

  const cantidades = fichas.map((f) => extraerCantidad(f.presentacion, f.nombre));
  const conocidas = new Set(cantidades.filter((c): c is number => c != null));
  // Cantidades distintas = presentaciones distintas del mismo registro (x2 vs x4): no es duplicado.
  if (conocidas.size > 1) return null;
  if (cantidades.some((c) => c == null)) camposIncompletos.push("cantidad por empaque");

  const formas = fichas.map((f) => grupoForma(f.forma_farmaceutica, f.presentacion, f.nombre));
  const formasConocidas = new Set(formas.filter(Boolean));
  if (formasConocidas.size > 1) contradicciones.push(`forma distinta (${[...formasConocidas].join(" / ")})`);
  if (formas.some((f) => f == null)) camposIncompletos.push("forma farmacéutica");

  const principios = new Set(
    fichas.map((f) => principioActivoPublico(f.principio_activo)?.toLowerCase()).filter(Boolean)
  );
  if (principios.size > 1) contradicciones.push(`principio activo distinto (${[...principios].join(" / ")})`);
  if (fichas.some((f) => !f.principio_activo)) camposIncompletos.push("principio activo");

  const atcs = new Set(fichas.map((f) => f.codigo_atc?.trim().toUpperCase()).filter(Boolean));
  if (atcs.size > 1) contradicciones.push(`código ATC distinto (${[...atcs].join(" / ")})`);

  const labs = new Set(fichas.map((f) => primeraPalabra(f.laboratorio)).filter(Boolean));
  if (labs.size > 1) contradicciones.push(`laboratorio distinto (${fichas.map((f) => f.laboratorio ?? "—").join(" / ")})`);

  if (fichas.some((f) => f.eans.length === 0)) camposIncompletos.push("EAN");
  if (fichas.some((f) => f.eans.some((e) => !/^\d{8,14}$/.test(e)))) contradicciones.push("EAN interno o no numérico");

  let confianza: Confianza;
  if (contradicciones.length > 0) confianza = "revisar";
  else if (camposIncompletos.length === 0) confianza = "alta";
  else confianza = "media";

  return { clave, confianza, fichas, contradicciones, camposIncompletos };
}

/** Agrupa por registro INVIMA + concentración y devuelve solo los grupos candidatos. */
export function detectarCandidatos(fichas: FichaCatalogo[]): GrupoCandidato[] {
  const grupos = new Map<string, FichaCatalogo[]>();
  for (const f of fichas) {
    const reg = normalizarRegistro(f.registro_invima);
    const conc = normalizarConcentracion(f.concentracion);
    if (!reg || !conc) continue;
    const clave = `${reg}|${conc}`;
    const lista = grupos.get(clave) ?? [];
    lista.push(f);
    grupos.set(clave, lista);
  }

  const orden: Record<Confianza, number> = { alta: 0, media: 1, revisar: 2 };
  return [...grupos.entries()]
    .map(([clave, lista]) => evaluarGrupo(clave, lista))
    .filter((g): g is GrupoCandidato => g !== null)
    .sort((a, b) => orden[a.confianza] - orden[b.confianza] || a.clave.localeCompare(b.clave));
}

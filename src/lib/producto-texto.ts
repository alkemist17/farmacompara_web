// Normalización de textos del catálogo para mostrarlos al público.
// Solo afecta la presentación: nunca se usa para EAN, registro INVIMA, slugs ni IDs,
// y el valor original se sigue mostrando en la ficha técnica.

// Tildes perdidas en la carga ("C PSULAS" → "CÁPSULAS"). Solo patrones observados
// en el catálogo; cualquier otra anomalía se deja igual y se reporta aparte.
const TILDES_PERDIDAS: [RegExp, string][] = [
  [/\bC PSULA/g,   "CÁPSULA"],
  [/\bCART N\b/g,  "CARTÓN"],
  [/\bPL STICO/g,  "PLÁSTICO"],
  [/\bBL STER/g,   "BLÍSTER"],
  [/\bTAP N\b/g,   "TAPÓN"],
  [/\bOFT LMIC/g,  "OFTÁLMIC"],
  [/\bT PIC/g,     "TÓPIC"],
  [/\bD RMIC/g,    "DÉRMIC"],
  [/\bP LDORA/g,   "PÍLDORA"],
  [/\bGR NULO/g,   "GRÁNULO"],
  [/\b([A-Z]*[CS])I N\b/g, "$1IÓN"], // SOLUCI N, SUSPENSI N, LOCI N, INYECCI N…
];

export function tieneTildesPerdidas(texto: string): boolean {
  return TILDES_PERDIDAS.some(([re]) => new RegExp(re.source).test(texto));
}

export function repararTildesPerdidas(texto: string): string {
  return TILDES_PERDIDAS.reduce((t, [re, rep]) => t.replace(re, rep), texto);
}

// Palabras frecuentes que llegan sin tilde en los nombres comerciales.
const ACENTOS: Record<string, string> = {
  capsula: "cápsula", capsulas: "cápsulas",
  solucion: "solución", suspension: "suspensión", locion: "loción",
  inyeccion: "inyección", emulsion: "emulsión",
  oftalmica: "oftálmica", oftalmico: "oftálmico",
  topico: "tópico", topica: "tópica", dermico: "dérmico", dermica: "dérmica",
  blister: "blíster", plastico: "plástico", carton: "cartón",
  formula: "fórmula", medica: "médica", medico: "médico",
};

const CONECTORES = new Set(["de", "del", "la", "el", "con", "sin", "y", "en", "por", "para", "x"]);

const UNIDADES: Record<string, string> = {
  mg: "mg", mcg: "mcg", "µg": "µg", g: "g", gr: "g", ml: "ml", l: "L", ui: "UI", "%": "%",
};

function conMismaCapitalizacion(original: string, reemplazo: string): string {
  if (original === original.toUpperCase()) return reemplazo.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return reemplazo[0].toUpperCase() + reemplazo.slice(1);
  return reemplazo;
}

function normalizarUnidades(texto: string): string {
  return texto
    // 50Mg, 50 MG, 2,5ML → 50 mg, 2,5 ml
    .replace(/(\d+(?:[.,]\d+)?)\s*(mcg|µg|mg|gr|g|ml|l|ui|%)(?![a-záéíóúñ])/gi,
      (_, n: string, u: string) => `${n}${u === "%" ? "" : " "}${UNIDADES[u.toLowerCase()] ?? u}`)
    // "Caja X 2", "X30" → "Caja x 2", "x 30"
    .replace(/\bX\s*(\d)/g, "x $1");
}

function ponerTildes(texto: string): string {
  return texto.replace(/[A-Za-zÁÉÍÓÚÑáéíóúñ]+/g, (palabra) => {
    const fija = ACENTOS[palabra.toLowerCase()];
    return fija ? conMismaCapitalizacion(palabra, fija) : palabra;
  });
}

function esTodoMayusculas(texto: string): boolean {
  const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  return letras.length > 0 && letras === letras.toUpperCase();
}

// Para nombres en MAYÚSCULAS: título legible conservando siglas cortas (MK, AG, GF, DHA).
function capitalizarTitulo(texto: string): string {
  return texto
    .split(/(\s+)/)
    .map((token, i) => {
      if (/^\s+$/.test(token) || !/[A-ZÁÉÍÓÚÑ]/.test(token)) return token;
      const lower = token.toLowerCase();
      if (i > 0 && CONECTORES.has(lower)) return lower;
      if (/\d/.test(token) || token.length <= 3) return token;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/** Nombre comercial legible: "Gelpin 50Mg Capsulas Blandas Caja X 2" → "Gelpin 50 mg Cápsulas Blandas Caja x 2". */
export function nombrePublico(nombre: string): string {
  let t = repararTildesPerdidas(nombre.replace(/\s+/g, " ").trim());
  if (esTodoMayusculas(t)) t = capitalizarTitulo(t);
  return ponerTildes(normalizarUnidades(t)).replace(/\s+/g, " ").trim();
}

/** Texto técnico en mayúsculas → frase legible ("CAJA X 2 C PSULAS" → "Caja x 2 cápsulas"). */
export function textoPublico(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const limpio = repararTildesPerdidas(texto.replace(/\s+/g, " ").trim());
  if (!limpio) return null;
  const frase = limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
  return ponerTildes(normalizarUnidades(frase));
}

/**
 * Denominación pública del principio activo a partir del texto INVIMA.
 * "SILDENAFILO CITRATO 70.2400 MGEQUIVALENTES A SILDENAFILO BASE" → "Sildenafilo".
 * Solo extrae lo que el propio texto dice; si no hay patrón claro devuelve el
 * texto antes de la primera cifra. Las combinaciones ("+", " Y ") se conservan.
 */
export function principioActivoPublico(principio: string | null | undefined): string | null {
  if (!principio) return null;
  const limpio = repararTildesPerdidas(principio.replace(/\s+/g, " ").trim());
  if (!limpio) return null;

  const equivalente = limpio.match(/EQUIVALENTES?\s+A\s+([A-ZÁÉÍÓÚÑ ]+?)\s+BASE\b/i);
  let base = equivalente ? equivalente[1] : limpio.split(/\s*\d/)[0];
  base = base.replace(/[\s,;.(-]+$/, "").trim();
  if (!base) return textoPublico(limpio);

  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

function compacto(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.,]/g, "");
}

/** true si el nombre ya contiene la concentración ("Gelpin 50Mg…" y "50 mg"). */
export function contieneConcentracion(nombre: string, concentracion: string | null | undefined): boolean {
  if (!concentracion) return true;
  const c = compacto(concentracion);
  return c.length > 0 && compacto(nombre).includes(c);
}

/** true si el texto ya menciona el término, ignorando tildes y mayúsculas. */
export function contieneTermino(texto: string, termino: string | null | undefined): boolean {
  if (!termino) return true;
  const t = compacto(termino);
  // "Sildenafil" en el nombre cuenta como "Sildenafilo"
  const raiz = t.length > 6 ? t.slice(0, t.length - 1) : t;
  return compacto(texto).includes(raiz);
}

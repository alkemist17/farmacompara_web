/**
 * Normalizes a search string: removes diacritics (a->a, n->n, etc.),
 * replaces punctuation/special chars with spaces, and collapses whitespace.
 * Lets users type caja, funcion, acetaminofen and still get results.
 */
/** Converts "Ibuprofeno 400mg" → "ibuprofeno-400mg" for clean URL slugs */
export function slugifySearch(text: string): string {
  return normalizeSearch(text)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Converts "ibuprofeno-400mg" → "ibuprofeno 400mg" for display / queries */
export function unslugifySearch(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip combining diacritics
    .replace(/[^\w\s]/g, " ")           // punctuation -> space
    .replace(/\s+/g, " ")                // collapse multiple spaces
    .trim()
    .toLowerCase();
}

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VIGENCIA_DIAS, diasCalendario, esVigente, evaluarPrecios, getFreshness, resumirOfertas, type PrecioBase,
} from "../precios-reglas";

// 26-oct-2026 15:00 en Bogotá (UTC-5)
const AHORA = new Date("2026-10-26T20:00:00Z");
const haceDias = (d: number) => new Date(AHORA.getTime() - d * 86_400_000).toISOString();

function precio(fuente_id: number, valor: number | null, fecha: string, extra: Partial<PrecioBase> = {}): PrecioBase {
  return { fuente_id, ean: "7703153015398", precio_costo: valor, precio_oferta: null, stock: null, fecha_captura: fecha, ...extra };
}

test("vigencia: ventana de 7 días, igual que mv_precios_resumen", () => {
  assert.equal(VIGENCIA_DIAS, 7);
  assert.equal(esVigente(haceDias(0), AHORA), true);
  assert.equal(esVigente(haceDias(6.99), AHORA), true);
  assert.equal(esVigente(haceDias(7), AHORA), true);
  assert.equal(esVigente(haceDias(7.01), AHORA), false);
  assert.equal(esVigente(haceDias(41), AHORA), false);
});

test("vigencia: fecha ausente o inválida no se considera vigente", () => {
  assert.equal(esVigente("no-es-fecha", AHORA), false);
  const [fila] = evaluarPrecios([precio(1, 5000, "no-es-fecha")], AHORA);
  assert.equal(fila.vigente, false);
  assert.equal(resumirOfertas([fila]).count, 0);
});

test("etiquetas por día de calendario en hora de Colombia", () => {
  // 25-oct 16:33 Bogotá → ayer, aunque hayan pasado menos de 24 h
  const ayer = "2026-10-25T21:33:54Z";
  assert.equal(diasCalendario(ayer, AHORA), 1);
  assert.deepEqual(getFreshness(ayer, AHORA), { state: "aging", daysAgo: 1 });
  assert.equal(getFreshness("2026-10-26T14:00:00Z", AHORA).state, "fresh");
  assert.equal(getFreshness(haceDias(5), AHORA).state, "stale");
  assert.equal(getFreshness(haceDias(41), AHORA).state, "expired");
});

test("caso Gelpin: el precio vencido no entra en mínimo, máximo ni conteo", () => {
  const filas = evaluarPrecios([
    precio(1, 7200,  "2026-10-25T20:12:07Z"),  // Tu Droguería Virtual
    precio(2, 7350,  "2026-10-25T19:50:09Z"),  // Olímpica
    precio(3, 10700, "2026-10-25T21:33:54Z"),  // La Economía
    precio(4, 7900,  "2026-09-15T12:10:45Z"),  // Cruz Verde, 41 días
  ], AHORA);
  const r = resumirOfertas(filas);
  assert.equal(r.count, 3);
  assert.equal(r.min, 7200);
  assert.equal(r.max, 10700);
  // vigentes primero y ordenadas; la vencida al final
  assert.deepEqual(filas.map((f) => f.precio.fuente_id), [1, 2, 3, 4]);
  assert.equal(filas[3].vigente, false);
  // el "Mejor precio" visible coincide con el mínimo anunciado
  const mejor = filas.find((f) => f.esMejorPrecio);
  assert.equal(mejor?.precioEfectivo, r.min);
  assert.equal(filas.filter((f) => f.esMejorPrecio).length, 1);
});

test("disponibilidad: stock desconocido no declara InStock", () => {
  const r = resumirOfertas(evaluarPrecios([precio(1, 5000, haceDias(1))], AHORA));
  assert.equal(r.count, 1);
  assert.equal(r.disponibilidad, null);
});

test("disponibilidad: InStock solo con confirmación explícita", () => {
  const r = resumirOfertas(evaluarPrecios([
    precio(1, 5000, haceDias(1), { stock: true }),
    precio(2, 5200, haceDias(1)),
  ], AHORA));
  assert.equal(r.disponibilidad, "InStock");
});

test("agotado (stock=false) no se anuncia como oferta, pero no se confunde con precio desconocido", () => {
  const filas = evaluarPrecios([
    precio(1, 4000, haceDias(1), { stock: false }),
    precio(2, 5000, haceDias(1)),
  ], AHORA);
  const r = resumirOfertas(filas);
  assert.equal(r.count, 1);
  assert.equal(r.min, 5000);
  assert.equal(filas.find((f) => f.precio.fuente_id === 1)?.vigente, true);
});

test("precio de oferta tiene prioridad sobre el precio normal", () => {
  const r = resumirOfertas(evaluarPrecios([
    precio(1, 10000, haceDias(1), { precio_oferta: 8000 }),
  ], AHORA));
  assert.equal(r.min, 8000);
});

test("precio atípico (probable otra presentación) se excluye del resumen", () => {
  const filas = evaluarPrecios([
    precio(1, 1800,  haceDias(1)),
    precio(2, 9000,  haceDias(1)),
    precio(3, 9500,  haceDias(1)),
    precio(4, 10000, haceDias(1)),
  ], AHORA);
  assert.equal(filas.find((f) => f.precio.fuente_id === 1)?.comparabilidad, "bajo");
  const r = resumirOfertas(filas);
  assert.equal(r.min, 9000);
  assert.equal(r.count, 3);
});

test("sin ofertas válidas: resumen vacío", () => {
  assert.deepEqual(resumirOfertas([]), { count: 0, min: null, max: null, disponibilidad: null });
  const soloVencidos = evaluarPrecios([precio(1, 5000, haceDias(30)), precio(2, 6000, haceDias(60))], AHORA);
  assert.deepEqual(resumirOfertas(soloVencidos), { count: 0, min: null, max: null, disponibilidad: null });
  assert.equal(soloVencidos.some((f) => f.esMejorPrecio), false);
});

test("precio nulo o cero no cuenta como oferta", () => {
  const r = resumirOfertas(evaluarPrecios([precio(1, null, haceDias(1)), precio(2, 0, haceDias(1))], AHORA));
  assert.equal(r.count, 0);
});

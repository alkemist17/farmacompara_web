import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contieneConcentracion, contieneTermino, nombrePublico, principioActivoPublico,
  repararTildesPerdidas, textoPublico, tieneTildesPerdidas,
} from "../producto-texto";

test("nombre público: unidades y tildes normalizadas", () => {
  assert.equal(nombrePublico("Gelpin 50Mg Capsulas Blandas Caja X 2"), "Gelpin 50 mg Cápsulas Blandas Caja x 2");
  assert.equal(nombrePublico("Gelpin 50 MG Caja X 2 Caps"), "Gelpin 50 mg Caja x 2 Caps");
  assert.equal(nombrePublico("Sildenafil  Mk 50Mg  Caja X 2 Tabletas"), "Sildenafil Mk 50 mg Caja x 2 Tabletas");
});

test("nombre público: mayúsculas a título conservando siglas cortas", () => {
  assert.equal(nombrePublico("SILDENAFIL 50 MG 2 TABLETAS GF"), "Sildenafil 50 mg 2 Tabletas GF");
  assert.equal(nombrePublico("VIAGRA 100MG CAJA 1 TABLETA"), "Viagra 100 mg Caja 1 Tableta");
});

test("unidades no se confunden con palabras", () => {
  assert.equal(nombrePublico("Suero 2 Litros"), "Suero 2 Litros");
  assert.equal(nombrePublico("Agua 1L"), "Agua 1 L");
  assert.equal(nombrePublico("Crema 5% x 30Gr"), "Crema 5% x 30 g");
});

test("tildes perdidas en la carga", () => {
  assert.equal(repararTildesPerdidas("CAJA X 2 C PSULAS BLANDAS"), "CAJA X 2 CÁPSULAS BLANDAS");
  assert.equal(repararTildesPerdidas("FRASCO PL STICO PET"), "FRASCO PLÁSTICO PET");
  assert.equal(repararTildesPerdidas("CAJA DE CART N"), "CAJA DE CARTÓN");
  assert.equal(repararTildesPerdidas("LOCI N , EN CAJA"), "LOCIÓN , EN CAJA");
  assert.equal(tieneTildesPerdidas("CAJA X 2 C PSULAS"), true);
  assert.equal(tieneTildesPerdidas("CAJA X 2 CÁPSULAS"), false);
  // no toca palabras correctas
  assert.equal(repararTildesPerdidas("CAJA X 30 CAPSULAS EN BLISTER"), "CAJA X 30 CAPSULAS EN BLISTER");
});

test("texto público de presentación", () => {
  assert.equal(
    textoPublico("CAJA X 2 C PSULAS BLANDAS DE GELATINA, EN BLISTER"),
    "Caja x 2 cápsulas blandas de gelatina, en blíster",
  );
  assert.equal(textoPublico("FORMULA MEDICA"), "Fórmula médica");
  assert.equal(textoPublico(null), null);
  assert.equal(textoPublico("   "), null);
});

test("principio activo público a partir del texto INVIMA", () => {
  assert.equal(principioActivoPublico("SILDENAFILO CITRATO 70.2400 MGEQUIVALENTES A SILDENAFILO BASE"), "Sildenafilo");
  assert.equal(principioActivoPublico("SILDENAFILO CITRATO 73.75 MG EQUIVALENTE A SILDENAFILO BASE"), "Sildenafilo");
  assert.equal(principioActivoPublico("SILDENAFILO"), "Sildenafilo");
  assert.equal(principioActivoPublico("LOSARTAN POTASICO"), "Losartan potasico");
  assert.equal(principioActivoPublico("HIALURONATO DE SODIO + POLIETILENGLICOL"), "Hialuronato de sodio + polietilenglicol");
  assert.equal(principioActivoPublico(null), null);
  assert.equal(principioActivoPublico(""), null);
});

test("concentración ya incluida en el nombre", () => {
  assert.equal(contieneConcentracion("Gelpin 50Mg Capsulas Blandas Caja X 2", "50 mg"), true);
  assert.equal(contieneConcentracion("Gelpin Fast", "50 mg"), false);
  assert.equal(contieneConcentracion("Gelpin", null), true);
});

test("término incluido ignorando tildes y la vocal final", () => {
  assert.equal(contieneTermino("Sildenafil Mk 50 mg", "Sildenafilo"), true);
  assert.equal(contieneTermino("Gelpin 50 mg", "Sildenafilo"), false);
  assert.equal(contieneTermino("Sildenafilo", "SILDENAFIL"), true);
});

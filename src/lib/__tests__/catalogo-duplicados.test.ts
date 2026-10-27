import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectarCandidatos, extraerCantidad, grupoForma, normalizarRegistro, type FichaCatalogo,
} from "../catalogo-duplicados";

function ficha(id: number, datos: Partial<FichaCatalogo>): FichaCatalogo {
  return {
    id, slug: `p-${id}`, nombre: `Producto ${id}`, laboratorio: "Eurofarma", registro_invima: null,
    principio_activo: "SILDENAFILO", concentracion: "50 mg", forma_farmaceutica: "CAPSULA BLANDA",
    presentacion: null, codigo_atc: "G04BE03", eans: [`77000000000${id}`], ofertas_vigentes: 0, cadenas: [],
    ...datos,
  };
}

test("normalización de registro, cantidad y forma", () => {
  assert.equal(normalizarRegistro("2023M-0018103 R1"), normalizarRegistro("2023M-0018103-R1"));
  assert.equal(extraerCantidad("CAJA X 2 C PSULAS BLANDAS"), 2);
  assert.equal(extraerCantidad("CAJA POR 30 TABLETAS"), 30);
  assert.equal(extraerCantidad(null, "Gelpin 50 MG Caja X 2 Caps"), 2);
  assert.equal(extraerCantidad("FRASCO X 10 ML"), null); // volumen, no unidades
  assert.equal(grupoForma("CAPSULA BLANDA"), "capsula");
  assert.equal(grupoForma(null, "CAJA X 2 C PSULAS"), "capsula");
  assert.equal(grupoForma("TABLETA ORODISPERSABLE"), "tableta");
});

test("caso Gelpin 50 mg: candidato de confianza alta", () => {
  const grupos = detectarCandidatos([
    ficha(1301, {
      nombre: "Gelpin 50Mg Capsulas Blandas Caja X 2", laboratorio: "Eurofarma Colombia",
      registro_invima: "2022M-0003937-R2",
      principio_activo: "SILDENAFILO CITRATO 70.2400 MGEQUIVALENTES A SILDENAFILO BASE",
      presentacion: "CAJA X 2 C PSULAS BLANDAS DE GELATINA, EN BLISTER", eans: ["7703153015398"],
    }),
    ficha(1367, {
      nombre: "Gelpin 50 MG Caja X 2 Caps", registro_invima: "2022M-0003937-R2",
      presentacion: "CAJA X 2 CAP", eans: ["7706127004190"],
    }),
  ]);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].confianza, "alta");
  assert.deepEqual(grupos[0].fichas.map((f) => f.id), [1301, 1367]);
});

test("mismo registro con distinta cantidad (x2 vs x4) no es duplicado", () => {
  const grupos = detectarCandidatos([
    ficha(1, { registro_invima: "2021M-0008165-R1", presentacion: "CAJA X 2 TABLETAS", forma_farmaceutica: "TABLETA" }),
    ficha(2, { registro_invima: "2021M-0008165-R1", presentacion: "CAJA X 4 TABLETAS", forma_farmaceutica: "TABLETA" }),
  ]);
  assert.equal(grupos.length, 0);
});

test("registro compartido por productos distintos se marca para revisión", () => {
  // Caso real: Gestavit DHA quedó con el registro y la presentación INVIMA de Gelpin Fast x2.
  const grupos = detectarCandidatos([
    ficha(1, { registro_invima: "2021M-0008165-R1", nombre: "Gelpin Fast 50 mg x 2", presentacion: "CAJA X 2 TABLETAS", forma_farmaceutica: "TABLETA" }),
    ficha(2, {
      registro_invima: "2021M-0008165-R1", nombre: "Gestavit Dha Cápsula Blanda Caja X 30",
      principio_activo: "DHA", codigo_atc: "A11", forma_farmaceutica: "TABLETA",
      presentacion: "CAJA POR 2 TABLETAS ORODISPERSABLES EN EMPAQUE IND",
    }),
  ]);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].confianza, "revisar");
  assert.ok(grupos[0].contradicciones.some((c) => c.includes("principio activo")));
});

test("datos incompletos dan confianza media; EAN interno se marca", () => {
  const media = detectarCandidatos([
    ficha(1, { registro_invima: "2020M-1", presentacion: "CAJA X 2" }),
    ficha(2, { registro_invima: "2020M-1", presentacion: null, nombre: "Sin cantidad" }),
  ]);
  assert.equal(media[0]?.confianza, "media");

  const interno = detectarCandidatos([
    ficha(1, { registro_invima: "2020M-2", presentacion: "CAJA X 2" }),
    ficha(2, { registro_invima: "2020M-2", presentacion: "CAJA X 2", eans: ["P0000092"] }),
  ]);
  assert.equal(interno[0]?.confianza, "revisar");
});

test("fichas sin registro o sin concentración no se agrupan", () => {
  assert.equal(detectarCandidatos([ficha(1, {}), ficha(2, {})]).length, 0);
  assert.equal(detectarCandidatos([
    ficha(1, { registro_invima: "2020M-3", concentracion: null }),
    ficha(2, { registro_invima: "2020M-3", concentracion: null }),
  ]).length, 0);
});

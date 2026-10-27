import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbJsonLd, descripcionProducto, esGtin13Valido, esIndexable, metaDescription, ogTitle,
  productJsonLd, serializarJsonLd, tituloProducto, urlLaboratorio, urlMedicamento, type ProductoSeo,
} from "../producto-seo";
import { evaluarPrecios, resumirOfertas, type ResumenOfertas } from "../precios-reglas";
import { formatCOP } from "../format";

const AHORA = new Date("2026-10-26T20:00:00Z");

const base = {
  nombre: "Gelpin 50 mg Cápsulas Blandas Caja x 2",
  principio: "Sildenafilo",
  laboratorio: "Eurofarma Colombia",
  concentracion: "50 mg",
};
const gelpin: ProductoSeo = {
  ...base,
  slug: "gelpin-50mg-capsulas-blandas-caja-x-2",
  ean: "7703153015398",
  imagenUrl: "/api/imagen/7703153015398",
  descripcionVisible: descripcionProducto(base),
};
const SIN_OFERTAS: ResumenOfertas = { count: 0, min: null, max: null, disponibilidad: null };

function resumenGelpin() {
  return resumirOfertas(evaluarPrecios([
    { fuente_id: 1, ean: "7703153015398", precio_costo: 7200,  precio_oferta: null, stock: null, fecha_captura: "2026-10-25T20:12:07Z" },
    { fuente_id: 2, ean: "7706127004190", precio_costo: 7450,  precio_oferta: null, stock: null, fecha_captura: "2026-10-25T19:00:00Z" },
    { fuente_id: 3, ean: "7703153015398", precio_costo: 10700, precio_oferta: null, stock: null, fecha_captura: "2026-10-25T21:33:54Z" },
    { fuente_id: 4, ean: "7703153015398", precio_costo: 7900,  precio_oferta: null, stock: null, fecha_captura: "2026-09-15T12:10:45Z" },
  ], AHORA));
}

test("descripción visible sin concentración repetida", () => {
  assert.equal(gelpin.descripcionVisible, "Gelpin 50 mg Cápsulas Blandas Caja x 2 con sildenafilo de Eurofarma Colombia");
  assert.doesNotMatch(gelpin.descripcionVisible, /50 mg.*50 mg/);
  assert.equal(
    descripcionProducto({ nombre: "Gelpin Fast", principio: "Sildenafilo", laboratorio: null, concentracion: "50 mg" }),
    "Gelpin Fast con sildenafilo 50 mg",
  );
});

test("título: añade el principio activo solo si cabe y no está ya en el nombre", () => {
  assert.equal(tituloProducto("Gelpin Fast 50 mg", "Sildenafilo"), "Gelpin Fast 50 mg (Sildenafilo)");
  assert.equal(tituloProducto("Sildenafil Mk 50 mg Caja x 2", "Sildenafilo"), "Sildenafil Mk 50 mg Caja x 2");
  assert.equal(tituloProducto(gelpin.nombre, "Sildenafilo"), gelpin.nombre); // no cabe en 60 caracteres
  assert.ok((tituloProducto(gelpin.nombre, "Sildenafilo") + " | MediOfertas").length <= 60);
});

test("coherencia: meta description, Open Graph y JSON-LD usan el mismo resumen", () => {
  const r = resumenGelpin();
  const desc = metaDescription(gelpin, r);
  const ld = productJsonLd(gelpin, r) as { offers: Record<string, unknown> };

  assert.equal(r.count, 3);
  assert.match(desc, new RegExp(`Desde ${formatCOP(r.min).replace(/\$/, "\\$")} en 3 droguerías`));
  assert.equal(ogTitle(gelpin.nombre, r), `${gelpin.nombre} — Desde ${formatCOP(7200)}`);
  assert.equal(ld.offers.lowPrice, 7200);
  assert.equal(ld.offers.highPrice, 10700);
  assert.equal(ld.offers.offerCount, 3);
  assert.equal("availability" in ld.offers, false);
});

test("sin ofertas válidas: sin precio en metadatos y sin offers en JSON-LD", () => {
  const desc = metaDescription(gelpin, SIN_OFERTAS);
  assert.doesNotMatch(desc, /\$/);
  assert.doesNotMatch(desc, /Desde/);
  assert.equal(ogTitle(gelpin.nombre, SIN_OFERTAS), gelpin.nombre);
  const ld = productJsonLd(gelpin, SIN_OFERTAS);
  assert.equal("offers" in ld, false);
});

test("JSON-LD: gtin13 válido, fabricante y descripción visible", () => {
  const ld = productJsonLd(gelpin, SIN_OFERTAS);
  assert.equal(ld["@type"], "Product");
  assert.equal(ld.gtin13, "7703153015398");
  assert.deepEqual(ld.manufacturer, { "@type": "Organization", name: "Eurofarma Colombia" });
  assert.equal(ld.description, gelpin.descripcionVisible);
  assert.equal("brand" in ld, false);
  assert.equal("sku" in ld, false);
});

test("JSON-LD: EAN interno o inválido no se publica como gtin13", () => {
  assert.equal("gtin13" in productJsonLd({ ...gelpin, ean: "P0000092" }, SIN_OFERTAS), false);
  assert.equal("gtin13" in productJsonLd({ ...gelpin, ean: "7703153015390" }, SIN_OFERTAS), false);
  assert.equal("image" in productJsonLd({ ...gelpin, imagenUrl: null }, SIN_OFERTAS), false);
});

test("GTIN-13: dígito de control", () => {
  assert.equal(esGtin13Valido("7703153015398"), true);
  assert.equal(esGtin13Valido("7706127004190"), true);
  assert.equal(esGtin13Valido("7703153015399"), false);
  assert.equal(esGtin13Valido("770315301539"), false);
  assert.equal(esGtin13Valido(null), false);
});

test("BreadcrumbList refleja las migas visibles", () => {
  const ld = breadcrumbJsonLd([
    { nombre: "Inicio", url: "/" },
    { nombre: "Medicamentos", url: "/comparar" },
    { nombre: "Sildenafilo", url: "/medicamento/sildenafilo" },
    { nombre: gelpin.nombre, url: null },
  ], "https://mediofertas.co/producto/gelpin") as { itemListElement: { position: number; item: string }[] };
  assert.deepEqual(ld.itemListElement.map((i) => i.position), [1, 2, 3, 4]);
  assert.equal(ld.itemListElement[2].item, "https://mediofertas.co/medicamento/sildenafilo");
  assert.equal(ld.itemListElement[3].item, "https://mediofertas.co/producto/gelpin");
});

test("JSON-LD serializado no puede cerrar el <script>", () => {
  const s = serializarJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.doesNotMatch(s, /<\/script>/);
  assert.deepEqual(JSON.parse(s), { name: "</script><script>alert(1)</script>" });
});

test("criterio de indexación", () => {
  assert.equal(esIndexable({ totalPrecios: 4, registroInvima: null }), true);          // con precios (aunque vencidos)
  assert.equal(esIndexable({ totalPrecios: 0, registroInvima: "2021M-0008165-R1" }), true); // ficha técnica útil
  assert.equal(esIndexable({ totalPrecios: 0, registroInvima: null }), false);         // sin identidad ni ofertas
  assert.equal(esIndexable({ totalPrecios: 0, registroInvima: "  " }), false);
});

test("enlaces internos: /medicamento solo cuando la búsqueda encontrará el producto", () => {
  assert.equal(urlMedicamento("Sildenafilo"), "/medicamento/sildenafilo");
  assert.equal(urlMedicamento("Losartán potásico"), "/medicamento/losartan-potasico");
  assert.equal(urlMedicamento("Hialuronato de sodio + polietilenglicol"), null);
  assert.equal(urlMedicamento("Metronidazol/clotrimazol"), null);
  assert.equal(urlLaboratorio("Eurofarma Colombia"), "/laboratorio/eurofarma-colombia");
});

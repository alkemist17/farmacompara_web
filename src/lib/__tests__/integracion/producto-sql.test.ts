// Pruebas contra la BD real (solo lectura: las escrituras van en una transacción
// que siempre termina en ROLLBACK). Se omiten si no hay DATABASE_URL.
//   npm run test:int
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";
import { SQL_INFO, SQL_PRECIOS } from "../../producto-sql";

loadEnv({ path: ".env.local" });
loadEnv();

const url = process.env.DATABASE_URL;
const pool = url ? new Pool({ connectionString: url }) : null;
after(async () => { await pool?.end(); });

const GELPIN = "gelpin-50mg-capsulas-blandas-caja-x-2";

test("ficha con un EAN: info y una fila de precio por cadena", { skip: !pool }, async () => {
  const { rows: [info] } = await pool!.query(SQL_INFO, [GELPIN]);
  assert.ok(info, "la ficha de Gelpin debe existir en la BD de dev");
  assert.ok(info.eans.length >= 1);
  const { rows } = await pool!.query(SQL_PRECIOS, [info.id]);
  const fuentes = rows.map((r) => r.fuente_id);
  assert.equal(new Set(fuentes).size, fuentes.length);
});

test("ficha con varios EAN: reúne precios de todos y deduplica por cadena", { skip: !pool }, async () => {
  const client = await pool!.connect();
  try {
    await client.query("BEGIN");
    const { rows: [info] } = await client.query(SQL_INFO, [GELPIN]);
    const antes = await client.query(SQL_PRECIOS, [info.id]);
    // Cualquier EAN con precios de otra ficha (no depende de fusiones ya hechas)
    const { rows: [{ ean: eanAjeno }] } = await client.query(
      `SELECT p.ean FROM precios_retail p JOIN codigos_barras cb ON cb.ean = p.ean
        WHERE cb.producto_id <> $1 GROUP BY p.ean HAVING COUNT(*) >= 2 ORDER BY p.ean LIMIT 1`, [info.id]
    );
    const otras = await client.query(
      `SELECT DISTINCT p.fuente_id FROM precios_retail p WHERE p.ean = $1`, [eanAjeno]
    );

    await client.query(`UPDATE codigos_barras SET producto_id = $1 WHERE ean = $2`, [info.id, eanAjeno]);

    const { rows: [infoMulti] } = await client.query(SQL_INFO, [GELPIN]);
    assert.ok(infoMulti.eans.includes(eanAjeno));
    assert.equal(infoMulti.eans.length, info.eans.length + 1);

    const despues = await client.query(SQL_PRECIOS, [info.id]);
    const fuentes = despues.rows.map((r) => r.fuente_id);
    const esperadas = new Set([...antes.rows.map((r) => r.fuente_id), ...otras.rows.map((r) => r.fuente_id)]);
    assert.equal(new Set(fuentes).size, fuentes.length, "una sola fila por cadena");
    assert.deepEqual(new Set(fuentes), esperadas);
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test("slug inexistente o excluido no devuelve ficha", { skip: !pool }, async () => {
  const { rows } = await pool!.query(SQL_INFO, ["zzqxw-no-existe"]);
  assert.equal(rows.length, 0);
});

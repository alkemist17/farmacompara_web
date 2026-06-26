'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id                    VARCHAR(36)  NOT NULL,
        checksum              VARCHAR(64)  NOT NULL,
        finished_at           TIMESTAMPTZ,
        migration_name        VARCHAR(255) NOT NULL,
        logs                  TEXT,
        rolled_back_at        TIMESTAMPTZ,
        started_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        applied_steps_count   INTEGER      NOT NULL DEFAULT 0,
        CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
      )
    `);

    const { rows } = await pool.query(
      "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
    );
    const applied = new Set(rows.map((r) => r.migration_name));

    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const pending = fs
      .readdirSync(migrationsDir)
      .filter((d) => {
        const full = path.join(migrationsDir, d);
        return fs.statSync(full).isDirectory() && !applied.has(d);
      })
      .sort();

    if (pending.length === 0) {
      console.log('[migrate] No hay migraciones pendientes.');
      return;
    }

    for (const name of pending) {
      const sqlFile = path.join(migrationsDir, name, 'migration.sql');
      if (!fs.existsSync(sqlFile)) continue;

      const sql = fs.readFileSync(sqlFile, 'utf8');
      console.log(`[migrate] Aplicando ${name}...`);

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query(
          `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
           VALUES ($1, $2, $3, NOW(), 1)`,
          [crypto.randomUUID(), crypto.createHash('sha256').update(sql).digest('hex'), name]
        );
        await pool.query('COMMIT');
        console.log(`[migrate] ✓ ${name}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[migrate] ERROR:', err.message);
  process.exit(1);
});

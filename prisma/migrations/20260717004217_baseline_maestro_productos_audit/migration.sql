-- Baseline: registra en el historial de migraciones un objeto que ya
-- existe en la base de datos pero nunca se creo via `prisma migrate` ni
-- quedo versionado en este repo (igual que paso con mv_precios_resumen,
-- ver migracion siguiente). Esta migracion documenta el estado real de
-- la base; no crea nada nuevo funcionalmente.
--
-- Se aplica con `prisma migrate resolve --applied` porque la tabla ya
-- existe en dev/staging/produccion -- correrla como CREATE TABLE normal
-- fallaria por "already exists".

CREATE TABLE IF NOT EXISTS "maestro_productos_audit" (
    "id"            SERIAL PRIMARY KEY,
    "producto_id"   INTEGER NOT NULL,
    "usuario_email" VARCHAR(255) NOT NULL,
    "antes"         JSONB NOT NULL,
    "despues"       JSONB NOT NULL,
    "created_at"    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "maestro_productos_audit" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_producto_id" ON "maestro_productos_audit" ("producto_id");

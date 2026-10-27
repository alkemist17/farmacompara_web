-- Migración 030 (aditiva, reversible): registro de fichas fusionadas.
--
-- Cuando dos fichas de maestro_productos resultan ser el mismo producto comercial,
-- la ficha retirada queda con excluido = true y su slug se registra aquí para que
-- /producto/[slug] responda con redirección permanente a la ficha canónica.
-- Guarda lo movido para poder revertir la fusión (ver revertir_fusion.sql).
--
-- No modifica datos existentes. Mientras esta tabla no exista, la web sigue
-- funcionando igual (getSlugRedireccion devuelve null).
--
-- Reversión: DROP TABLE producto_redirecciones;  (solo si no hay fusiones vigentes)

BEGIN;

CREATE TABLE IF NOT EXISTS producto_redirecciones (
  slug_origen          VARCHAR(255) PRIMARY KEY,
  producto_origen_id   INTEGER      NOT NULL REFERENCES maestro_productos(id),
  producto_destino_id  INTEGER      NOT NULL REFERENCES maestro_productos(id),
  motivo               TEXT         NOT NULL,
  eans_movidos         TEXT[]       NOT NULL DEFAULT '{}',
  favoritos_movidos    BIGINT[]     NOT NULL DEFAULT '{}',
  alertas_movidas      BIGINT[]     NOT NULL DEFAULT '{}',
  imagen_movida        BOOLEAN      NOT NULL DEFAULT false,
  creado_por           VARCHAR(255) NOT NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (producto_origen_id <> producto_destino_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_destino ON producto_redirecciones (producto_destino_id);

COMMIT;

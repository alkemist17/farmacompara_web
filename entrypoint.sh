#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones pendientes..."
node scripts/migrate.js

echo "[entrypoint] Iniciando servidor..."
exec node server.js

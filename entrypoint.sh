#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones pendientes..."
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Iniciando servidor..."
exec node server.js

#!/usr/bin/env bash
# INSTINTO V10 — despliegue controlado del codebase instinto-payments (Cloud Shell).
# Solo las funciones listadas; NUNCA el codebase default (storeApi queda intacto).
# Los efectos automáticos dependen de instinto_private/runtime (apagado si no existe).
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
cd "$(dirname "$0")/.."
PROJECT=instinto-fragancias
FUNCS=${1:-checkoutApi,webAdmin,maintenance,webOrderStatus}
# Secretos que deben existir para desplegar. Si faltan, se crean con un MARCADOR no válido
# (no es una credencial); el propietario agrega la versión real desde la consola/Cloud Shell.
for s in INSTINTO_MP_TEST_ACCESS_TOKEN INSTINTO_MP_WEBHOOK_SECRET INSTINTO_SMTP; do
  if ! gcloud secrets describe "$s" --project "$PROJECT" >/dev/null 2>&1; then
    printf 'PENDIENTE_CONFIGURAR' | gcloud secrets create "$s" --project "$PROJECT" --replication-policy=automatic --data-file=- >/dev/null
    echo "Secreto $s creado con marcador (sin valor real)."
  fi
done
npm ci --prefix payments --silent
ONLY=$(echo "$FUNCS" | tr ',' '\n' | sed 's/^/functions:instinto-payments:/' | paste -sd, -)
git log -1 --format='Desplegando commit %H' | tee -a ~/instinto-respaldos/despliegues.log
npx firebase deploy --config firebase.payments.json --project "$PROJECT" --only "$ONLY" --non-interactive 2>&1 | tail -25 | tee -a ~/instinto-respaldos/despliegues.log
gcloud functions list --project "$PROJECT" --format='table(name,state,updateTime)'

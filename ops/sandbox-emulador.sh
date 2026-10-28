#!/usr/bin/env bash
# Levanta Firestore Emulator (127.0.0.1:8085) con el último respaldo de producción y configura
# instinto_private/runtime en MODO SANDBOX dentro del emulador. No toca producción.
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
cd "$(dirname "$0")/.."
STAMP=$(cat ~/instinto-respaldos/ULTIMO)
IMPORT=~/instinto-restauracion/$STAMP/import
[ -f "$IMPORT/firebase-export-metadata.json" ] || bash ops/restauracion-aislada.sh >/dev/null
pkill -f 'cloud-firestore-emulator' 2>/dev/null || true; sleep 2
nohup npx firebase emulators:start --project instinto-fragancias --only firestore --config firebase.emulators.json --import "$IMPORT" > ~/instinto-sandbox-emulador.log 2>&1 &
for i in $(seq 1 60); do curl -s 127.0.0.1:8085 >/dev/null 2>&1 && break; sleep 2; done
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
node ops/configurar-runtime.mjs --modo sandbox --caja60 20x7x7 --peso60 0.25 --checkout on --conciliacion on --escrituras-validadas on

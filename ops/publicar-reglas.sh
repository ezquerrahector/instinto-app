#!/usr/bin/env bash
# Publica las reglas que cierran Firestore: solo los 2 colaboradores verificados leen/escriben
# instinto/datos con escritura V10 (revisión +1); todo lo demás denegado a clientes.
# Reversión: volver a publicar el ruleset respaldado (ver ~/instinto-respaldos/*/reglas).
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
cd "$(dirname "$0")/.."
[ "${SOLO_VERIFICAR:-}" = 1 ] || npx firebase deploy --config firebase.rules.json --project instinto-fragancias --only firestore:rules --non-interactive 2>&1 | tail -5
sleep 20
K=AIzaSyBafY_htzgeMH5_J_h9-VscHHnrHdLX0IY
B='https://firestore.googleapis.com/v1/projects/instinto-fragancias/databases/(default)/documents'
echo "lectura anónima instinto/datos: $(curl -s -o /dev/null -w '%{http_code}' "$B/instinto/datos?key=$K") (esperado 403)"
echo "escritura anónima instinto/datos: $(curl -s -o /dev/null -w '%{http_code}' -X PATCH -H 'Content-Type: application/json' -d '{"fields":{"x":{"stringValue":"y"}}}' "$B/instinto/datos?key=$K&updateMask.fieldPaths=x") (esperado 403)"
echo "lectura anónima compras web: $(curl -s -o /dev/null -w '%{http_code}' "$B/instinto_web_purchases?key=$K") (esperado 403)"

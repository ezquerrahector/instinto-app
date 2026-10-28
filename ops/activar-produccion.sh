#!/usr/bin/env bash
# INSTINTO V10 — activación de producción en un solo paso (Cloud Shell, proyecto instinto-fragancias).
# Orden seguro: respaldo fresco → reglas cerradas → funciones (incl. webhook firmado) → configuración
# privada en modo real → verificaciones. Se detiene ante cualquier error. Resultado en ~/salida/activacion.txt
# Reversión inmediata de cobros: node ops/configurar-runtime.mjs --modo live --caja60 20x7x7 --peso60 0.25
#   (sin banderas "on" = todo apagado; webhook y conciliación de pagos en tránsito siguen disponibles).
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
cd "$(dirname "$0")/.."
git pull -q
mkdir -p ~/salida; exec > >(tee ~/salida/activacion.txt) 2>&1
DESDE=${1:-1}  # uso: bash ops/activar-produccion.sh 3  (reanuda desde el paso 3)
paso(){ printf '\n=== %s (%s) ===\n' "$1" "$(date -u +%H:%M:%SZ)"; }

paso "1. Respaldo fresco previo"
if [ "$DESDE" -le 1 ]; then bash ops/respaldo-produccion.sh | tail -2; else echo "omitido (respaldo $(cat ~/instinto-respaldos/ULTIMO))"; fi

paso "2. Verificar secretos reales (sin mostrar valores)"
for s in INSTINTO_MP_ACCESS_TOKEN INSTINTO_MP_WEBHOOK_SECRET INSTINTO_SKYDROPX_CREDENTIALS; do
  v=$(gcloud secrets versions access latest --secret "$s"); [ "$v" != "PENDIENTE_CONFIGURAR" ] && [ ${#v} -ge 16 ] || { echo "FALTA $s"; exit 1; }; echo "OK $s"; done

paso "3. Reglas Firestore cerradas"
if [ "$DESDE" -le 3 ] && [ "$DESDE" -lt 3 ]; then bash ops/publicar-reglas.sh; else SOLO_VERIFICAR=1 bash ops/publicar-reglas.sh; fi

paso "4. Funciones (webhook firmado incluido)"
CB=$(gcloud functions describe mpWebhook --region us-central1 --format='value(labels.firebase-functions-codebase)' 2>/dev/null || true)
if [ "$CB" != "instinto-payments" ]; then
  echo "Retirando mpWebhook bootstrap (codebase '${CB:-default}', no procesaba pagos)"
  gcloud functions delete mpWebhook --region us-central1 --quiet
fi
bash ops/desplegar-funciones.sh checkoutApi,webAdmin,maintenance,webOrderStatus,mpWebhook

paso "5. Configuración privada en modo REAL"
node ops/configurar-runtime.mjs --modo live --caja60 20x7x7 --peso60 0.25 --checkout on --conciliacion on --escrituras-validadas on --guias on

paso "6. Verificaciones"
B=https://us-central1-instinto-fragancias.cloudfunctions.net
echo "webhook GET: $(curl -s $B/mpWebhook)"
echo "webhook POST sin firma: $(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"type":"payment","data":{"id":"1"}}' "$B/mpWebhook?data.id=1&type=payment") (esperado 401)"
curl -s -H 'Origin: https://instintofragancias.com' $B/checkoutApi/api/catalog | python3 -c 'import json,sys;d=json.load(sys.stdin);print("catálogo:",d["mode"],"checkout",d["checkoutEnabled"],"tallas",d["enabledSizes"],"precios",d["prices"],"fragancias",len(d["products"]))'
export TOKEN=$(gcloud auth print-access-token); node ops/huella-datos.mjs > ~/salida/huella-activacion.json
python3 -c "import json;d=json.load(open('$HOME/salida/huella-activacion.json'));print('runtime:',d['runtime']);print('datos: revision',d['datos']['syncRevision'],'cliente',d['datos']['syncClient'],'pedidos',d['datos']['pedidos']['n'])"
echo; echo "ACTIVACIÓN TERMINADA"

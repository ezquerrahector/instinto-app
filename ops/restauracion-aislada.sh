#!/usr/bin/env bash
# INSTINTO V10 — prueba de restauración AISLADA del último respaldo en el emulador local
# de Cloud Shell. No escribe en producción. Compara la huella restaurada con la de producción
# tomada en el mismo momento y reporta movimientos posteriores al respaldo (si los hubo).
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
cd "$(dirname "$0")/.."
STAMP=${1:-$(cat ~/instinto-respaldos/ULTIMO)}
BUCKET=gs://instinto-fragancias-respaldos-v10
WORK=~/instinto-restauracion/$STAMP
rm -rf "$WORK"; mkdir -p "$WORK/import"
gcloud storage cp -r "$BUCKET/firestore/$STAMP" "$WORK/import/" >/dev/null
META=$(cd "$WORK/import/$STAMP" && ls *.overall_export_metadata)
cat > "$WORK/import/firebase-export-metadata.json" <<JSON
{"version":"14.0.0","firestore":{"version":"1.19.8","path":"$STAMP","metadata_file":"$STAMP/$META"}}
JSON
npm ci --silent >/dev/null 2>&1 || true
export TOKEN=$(gcloud auth print-access-token)
node ops/huella-datos.mjs --detalle > "$WORK/huella-produccion.json"
npx firebase emulators:exec --project instinto-fragancias --only firestore \
  --config firebase.emulators.json --import "$WORK/import" \
  "FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 node ops/huella-datos.mjs --detalle > $WORK/huella-restaurada.json" >/dev/null
python3 - "$WORK/huella-produccion.json" "$WORK/huella-restaurada.json" <<'PY' | tee "$WORK/cotejo.txt"
import json,sys
p,r=(json.load(open(f)) for f in sys.argv[1:])
ok=True
def cmp(label,a,b):
    global ok
    same=a==b; ok&=same
    print(('OK   ' if same else 'DIF  ')+label+('' if same else f'  prod={a}  restaurado={b}'))
pd,rd=p.get('datos',{}),r.get('datos',{})
cmp('hash documento instinto/datos',pd.get('hashDocumento'),rd.get('hashDocumento'))
cmp('catálogo n',pd['catalogo']['n'],rd['catalogo']['n'])
cmp('suma stockGramos',pd['catalogo']['sumaStockGramos'],rd['catalogo']['sumaStockGramos'])
cmp('hash stock por id',pd['catalogo']['hashStock'],rd['catalogo']['hashStock'])
cmp('pedidos n',pd['pedidos']['n'],rd['pedidos']['n'])
cmp('pedidos hash ids',pd['pedidos']['hashIds'],rd['pedidos']['hashIds'])
cmp('materiales',pd['materiales'],rd['materiales'])
for c in sorted(set(p['colecciones'])|set(r['colecciones'])):
    cmp('colección '+c,p['colecciones'].get(c),r['colecciones'].get(c))
print('RESULTADO:', 'RESTAURACIÓN IDÉNTICA A PRODUCCIÓN' if ok else 'HAY DIFERENCIAS (revisar si son movimientos posteriores al respaldo)')
PY

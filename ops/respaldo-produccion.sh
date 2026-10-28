#!/usr/bin/env bash
# INSTINTO V10 — respaldo de producción de SOLO LECTURA sobre los servicios vivos.
# Ejecutar en Cloud Shell del proyecto instinto-fragancias. No modifica datos, reglas
# ni funciones. Escribe únicamente en un bucket privado del mismo proyecto y en
# ~/instinto-respaldos/<fecha>. No imprime ni copia valores de secretos.
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
PROJECT=instinto-fragancias
REGION=us-central1
BUCKET=gs://${PROJECT}-respaldos-v10
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT=~/instinto-respaldos/$STAMP
mkdir -p "$OUT"/{funciones,reglas,tienda,config}
chmod 700 ~/instinto-respaldos "$OUT"
log(){ printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$OUT/bitacora.txt"; }

log "Proyecto $PROJECT, sello $STAMP"
gcloud config set project "$PROJECT" >/dev/null

# 1. Bucket privado (prevención de acceso público, acceso uniforme, versiones).
if ! gcloud storage buckets describe "$BUCKET" >/dev/null 2>&1; then
  log "Creando bucket privado $BUCKET"
  gcloud storage buckets create "$BUCKET" --location="$REGION" \
    --uniform-bucket-level-access --public-access-prevention
  gcloud storage buckets update "$BUCKET" --versioning
fi

# 2. Exportación administrada y consistente de Firestore (todas las colecciones).
log "Exportando Firestore (default) a $BUCKET/firestore/$STAMP"
gcloud firestore export "$BUCKET/firestore/$STAMP" --database='(default)' \
  --format='value(name)' | tee "$OUT/config/export-operation.txt"

# 3. Reglas e índices desplegados.
TOKEN=$(gcloud auth print-access-token)
api(){ curl -fsS -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PROJECT" "$@"; }
api "https://firebaserules.googleapis.com/v1/projects/$PROJECT/releases" > "$OUT/reglas/releases.json"
python3 - "$OUT/reglas/releases.json" > "$OUT/reglas/rulesets.txt" <<'PY'
import json,sys
for r in json.load(open(sys.argv[1])).get('releases',[]): print(r['name'], r['rulesetName'], r.get('updateTime',''))
PY
while read -r rel rs _; do
  safe=$(echo "$rel" | tr '/' '_')
  api "https://firebaserules.googleapis.com/v1/$rs" > "$OUT/reglas/$safe.json"
done < "$OUT/reglas/rulesets.txt"
gcloud firestore indexes composite list --format=json > "$OUT/reglas/indices-compuestos.json" || true
gcloud firestore indexes fields list --format=json > "$OUT/reglas/indices-campos.json" 2>/dev/null || true

# 4. Configuración y fuentes de funciones desplegadas (sin valores de secretos).
gcloud functions list --format=json > "$OUT/funciones/lista.json"
for fn in $(gcloud functions list --format='value(name.basename())'); do
  gcloud functions describe "$fn" --region="$REGION" --format=json > "$OUT/funciones/$fn.describe.json"
  src=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));s=d.get('buildConfig',{}).get('source',{}).get('storageSource',{});print('gs://%s/%s'%(s.get('bucket'),s.get('object')) if s else '')" "$OUT/funciones/$fn.describe.json")
  if [ -n "$src" ]; then gcloud storage cp "$src" "$OUT/funciones/$fn.source.zip" >/dev/null && log "Fuente $fn: $src"; fi
done
gcloud secrets list --format='table(name,createTime)' > "$OUT/config/secretos-nombres.txt"
for s in $(gcloud secrets list --format='value(name)'); do
  gcloud secrets versions list "$s" --format='table(name,state,createTime)' >> "$OUT/config/secretos-versiones.txt" 2>&1
done
gcloud projects get-iam-policy "$PROJECT" --format=json > "$OUT/config/iam.json"
api "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT/config" > "$OUT/config/auth-config.json" || true

# 5. Copia pública de la tienda (complemento; la copia completa del hosting se toma en Webempresa).
( cd "$OUT/tienda" && wget -q -e robots=off --mirror --page-requisites --no-parent \
    --adjust-extension https://instintofragancias.com/ || true )

# 6. Espera de la exportación y checksums.
OP=$(cat "$OUT/config/export-operation.txt")
log "Esperando operación $OP"
for i in $(seq 1 60); do
  done_=$(gcloud firestore operations describe "$OP" --format='value(done)' 2>/dev/null || echo)
  [ "$done_" = "True" ] && break; sleep 10
done
gcloud firestore operations describe "$OP" --format=json > "$OUT/config/export-final.json"
gcloud storage ls -l -r "$BUCKET/firestore/$STAMP/**" > "$OUT/config/export-archivos.txt"
( cd "$OUT" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS )
tar -C ~/instinto-respaldos -czf ~/instinto-respaldos/respaldo-$STAMP.tgz "$STAMP"
gcloud storage cp ~/instinto-respaldos/respaldo-$STAMP.tgz "$BUCKET/meta/" >/dev/null
sha256sum ~/instinto-respaldos/respaldo-$STAMP.tgz | tee -a "$OUT/bitacora.txt"
echo "$STAMP" > ~/instinto-respaldos/ULTIMO
log "Listo: $OUT y $BUCKET/firestore/$STAMP"

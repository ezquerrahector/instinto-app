#!/usr/bin/env bash
# Habilita en Firebase Auth el acceso por enlace de correo (sin contraseña) para los colaboradores.
# Las reglas y el servidor solo autorizan los 2 correos con email_verified=true.
set -euo pipefail
export CLOUDSDK_CORE_PROJECT=instinto-fragancias
P=instinto-fragancias; T=$(gcloud auth print-access-token)
curl -fsS -X PATCH -H "Authorization: Bearer $T" -H "x-goog-user-project: $P" -H 'Content-Type: application/json' \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/$P/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired" \
  -d '{"signIn":{"email":{"enabled":true,"passwordRequired":false}}}' \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print("signIn.email =",d.get("signIn",{}).get("email"));print("dominios =",d.get("authorizedDomains"))'

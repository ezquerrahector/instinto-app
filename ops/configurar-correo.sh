#!/usr/bin/env bash
# INSTINTO V10 — guarda el buzón SMTP (sin mostrar la contraseña), prueba la conexión enviando un
# correo de prueba a la copia administrativa, activa los correos y encola los de compras ya pagadas.
# Uso: bash ops/configurar-correo.sh pedidos@instintofragancias.com
set -euo pipefail
cd "$(dirname "$0")/.."
git pull -q
USER_MAIL=${1:?correo del buzón, p. ej. pedidos@instintofragancias.com}
HOST=${SMTP_HOST:-$(echo "$USER_MAIL" | sed 's/.*@/mail./')}
read -rsp "Contraseña del buzón $USER_MAIL: " PASS; echo
node -e '
const [user,host,pass]=process.argv.slice(1);
process.stdout.write(JSON.stringify({host,port:465,user,pass,from:`"INSTINTO Fragancias" <${user}>`,replyTo:user}));' "$USER_MAIL" "$HOST" "$PASS" \
  | gcloud secrets versions add INSTINTO_SMTP --data-file=- >/dev/null
unset PASS; echo "Secreto INSTINTO_SMTP guardado (host $HOST, puerto 465)."
npm ci --prefix payments --silent
node -e '
const {createMailer}=require("./payments/email");const {execFileSync}=require("child_process");
const smtp=JSON.parse(execFileSync("gcloud",["secrets","versions","access","latest","--secret","INSTINTO_SMTP"],{encoding:"utf8"}));
createMailer({smtp}).send({to:"ezquerrahector@gmail.com",subject:"INSTINTO · prueba de correo de la tienda",text:"Si recibes esto, los correos de la tienda funcionan."})
 .then(i=>console.log("Correo de prueba enviado:",i.messageId)).catch(e=>{console.error("FALLÓ SMTP:",e.message);process.exit(1)});'
bash ops/desplegar-funciones.sh maintenance,webAdmin
node ops/configurar-runtime.mjs --modo live --caja60 20x7x7 --peso60 0.25 --checkout on --conciliacion on --escrituras-validadas on --guias on --correos on
# Encolar correos de compras pagadas que aún no los recibieron (idempotente).
export TOKEN=$(gcloud auth print-access-token)
node --input-type=module -e '
import {listDocs} from "./ops/firestore-rest.mjs";
const T=process.env.TOKEN,B="https://firestore.googleapis.com/v1/projects/instinto-fragancias/databases/(default)/documents";
for (const d of await listDocs("instinto_web_purchases")) {
  const p=d.data; if(p.state!=="paid")continue;
  const tasks=[["paidmail_"+p.id,"purchase_paid",!p.emails?.paidSentAt],["shipped_"+p.id,"label_ready",p.shipment?.state==="label_ready"&&!p.emails?.shippedSentAt]];
  for (const [id,type,need] of tasks) if (need) {
    const r=await fetch(`${B}/instinto_web_outbox?documentId=${id}`,{method:"POST",headers:{Authorization:"Bearer "+T,"x-goog-user-project":"instinto-fragancias","Content-Type":"application/json"},
      body:JSON.stringify({fields:{type:{stringValue:type},purchaseId:{stringValue:p.id},state:{stringValue:"pending"},createdAt:{integerValue:String(Date.now())}}})});
    console.log("encolado",id,r.status===200?"OK":r.status===409?"ya existía":r.status);
  }
}'
echo "LISTO: los correos salen en el siguiente ciclo de mantenimiento (máx. 5 min)."

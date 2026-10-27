// INSTINTO V10 — escribe instinto_private/runtime (solo servidor; reglas: deny all a clientes).
// Uso (Cloud Shell, proyecto real o emulador con FIRESTORE_EMULATOR_HOST):
//   node ops/configurar-runtime.mjs --modo sandbox|live --caja60 20x7x7 --peso60 0.25 \
//        [--checkout on] [--conciliacion on] [--escrituras-validadas on] [--guias on]
// Sin banderas "on" todo queda APAGADO. Las medidas solo se aceptan si se pasan explícitamente
// (confirmadas por el propietario). El origen se lee de la plantilla "INSTINTO Origen" de Skydropx
// y el collectorId de /users/me del token del modo elegido; nada se inventa.
import {execFileSync} from 'node:child_process';
const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const on = k => arg(k) === 'on';
const PROJECT = 'instinto-fragancias';
const modo = arg('modo');
if (!['sandbox', 'live'].includes(modo)) throw Error('--modo sandbox|live requerido');
const caja = /^(\d{1,3})x(\d{1,3})x(\d{1,3})$/.exec(arg('caja60') || '');
const peso = Number(arg('peso60'));
const secret = n => execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', n, '--project', PROJECT], {encoding: 'utf8'}).trim();

const mpToken = secret(modo === 'live' ? 'INSTINTO_MP_ACCESS_TOKEN' : 'INSTINTO_MP_TEST_ACCESS_TOKEN');
if (mpToken === 'PENDIENTE_CONFIGURAR') throw Error('El token de Mercado Pago de este modo aún no está configurado');
const me = await (await fetch('https://api.mercadopago.com/users/me', {headers: {Authorization: 'Bearer ' + mpToken}})).json();
if (!me.id) throw Error('No se pudo leer la cuenta de Mercado Pago del token');

const sk = JSON.parse(secret('INSTINTO_SKYDROPX_CREDENTIALS'));
const tok = await (await fetch('https://api-pro.skydropx.com/api/v1/oauth/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({grant_type: 'client_credentials', client_id: sk.client_id, client_secret: sk.client_secret, scope: 'default'})})).json();
const tpl = (await (await fetch('https://api-pro.skydropx.com/api/v1/address_templates?per_page=20', {headers: {Authorization: 'Bearer ' + tok.access_token}})).json()).data
  .find(a => a.alias_name === 'INSTINTO Origen' && a.default);
if (!tpl) throw Error('No existe la plantilla predeterminada "INSTINTO Origen" en Skydropx');

const pack = line => ({verified: true, bottle: line === 'Dama' ? 'env_cristal' : 'env_mate', atomizer: 'atomizador', label: null});
const runtime = {
  checkoutEnabled: on('checkout'), reconciliationEnabled: on('conciliacion'), compatibleWritesValidated: on('escrituras-validadas'),
  liveMode: modo === 'live', collectorId: me.id,
  // MP reporta live_mode=true también para pagos entre cuentas de prueba (verificado 27/10/2026, pago 185338674611).
  paymentLiveMode: modo === 'live' ? true : (me.tags || []).includes('test_user'), enabledSizes: [60], pricesCents: {60: 31000},
  // Receta confirmada por el propietario 27/10/2026 (= cfg de la administración).
  recipes: {60: {verified: true, essence: 30, fijador: 6, feromonas: 3.5, perfumol: 21.5, source: 'owner_2026-10-27_admin_cfg'}},
  // Envase por línea confirmado 27/10/2026; etiqueta sin control de inventario.
  packaging: {60: {Dama: pack('Dama'), Caballero: pack('Caballero'), Unisex: pack('Unisex')}},
  boxes: {60: caja && peso > 0 ? {verified: true, length: +caja[1], width: +caja[2], height: +caja[3], packedWeightKg: peso, source: 'owner_confirmed'}
    : {verified: false}},
  origin: {postal_code: tpl.address.postal_code, area_level1: tpl.address.area_level1, area_level2: tpl.address.area_level2,
    area_level3: tpl.address.area_level3, address_template_id: tpl.id},
  shippingLabels: {enabled: on('guias'), consignmentNote: '53131620', packageType: '4G', originTemplateId: tpl.id, printingFormat: 'standard', maxCostDifferenceCents: 0},
  // Correos al cliente: --correos on [--copia correo@dominio] (requiere secreto INSTINTO_SMTP).
  emails: {enabled: on('correos'), copyTo: arg('copia') || 'ezquerrahector@gmail.com'},
  excludedPaymentTypes: ['ticket', 'atm'], quoteTtlMs: 30 * 60000, holdMs: 20 * 60000, maxShippingCents: 60000,
  updatedAt: new Date().toISOString(), updatedBy: 'ops/configurar-runtime.mjs'};

const emu = process.env.FIRESTORE_EMULATOR_HOST;
const url = emu ? `http://${emu}/v1/projects/${PROJECT}/databases/(default)/documents/instinto_private/runtime`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/instinto_private/runtime`;
const enc = v => v === null ? {nullValue: null} : typeof v === 'boolean' ? {booleanValue: v} : Number.isInteger(v) ? {integerValue: String(v)}
  : typeof v === 'number' ? {doubleValue: v} : typeof v === 'string' ? {stringValue: v} : Array.isArray(v) ? {arrayValue: {values: v.map(enc)}}
  : {mapValue: {fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]))}};
const headers = emu ? {Authorization: 'Bearer owner'} : {Authorization: 'Bearer ' + execFileSync('gcloud', ['auth', 'print-access-token'], {encoding: 'utf8'}).trim(), 'x-goog-user-project': PROJECT};
const r = await fetch(url, {method: 'PATCH', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify({fields: enc(runtime).mapValue.fields})});
if (!r.ok) throw Error('Firestore ' + r.status + ' ' + await r.text());
console.log(JSON.stringify({escrito: emu ? 'emulador' : 'produccion', modo, collectorId: me.id, cuentaDePrueba: (me.tags || []).includes('test_user'),
  checkoutEnabled: runtime.checkoutEnabled, reconciliationEnabled: runtime.reconciliationEnabled, compatibleWritesValidated: runtime.compatibleWritesValidated,
  cajaVerificada: runtime.boxes[60].verified, guias: runtime.shippingLabels.enabled, correos: runtime.emails.enabled, origenCP: runtime.origin.postal_code}, null, 1));

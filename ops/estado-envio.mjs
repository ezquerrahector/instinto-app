// INSTINTO V10 — estado de SOLO LECTURA de correos, guía, recolección y rastreo de una compra.
// Uso: TOKEN=$(gcloud auth print-access-token) node ops/estado-envio.mjs <purchaseId>
import {execFileSync} from 'node:child_process';
import {getDoc, listDocs} from './firestore-rest.mjs';
const id = process.argv[2];
const p = await getDoc('instinto_web_purchases/' + id);
const rt = await getDoc('instinto_private/runtime');
const creds = JSON.parse(execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', 'INSTINTO_SKYDROPX_CREDENTIALS', '--project', 'instinto-fragancias'], {encoding: 'utf8'}));
const B = 'https://api-pro.skydropx.com';
const tok = await (await fetch(B + '/api/v1/oauth/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope: 'default'})})).json();
const get = async path => { const r = await fetch(B + path, {headers: {Authorization: 'Bearer ' + tok.access_token}}); return {status: r.status, body: await r.json().catch(() => null)}; };
const pk = p.pickup?.id ? await get('/api/v2/pickups/' + p.pickup.id) : null;
await new Promise(r => setTimeout(r, 700));
const tr = p.shipment?.trackingNumber ? await get(`/api/v1/shipments/tracking?tracking_number=${p.shipment.trackingNumber}&carrier_name=${p.shipment.carrier}`) : null;
const outbox = (await listDocs('instinto_web_outbox')).filter(d => d.data.purchaseId === id).map(d => ({id: d.id, tipo: d.data.type, estado: d.data.state, intentos: d.data.attempts || 0, error: d.data.lastError || null}));
console.log(JSON.stringify({
  correosActivos: rt.emails, correos: p.emails || null, outbox,
  guia: {estado: p.shipment?.state, carrier: p.shipment?.carrier, rastreo: p.shipment?.trackingNumber, costoCents: p.shipment?.costCents},
  recoleccionGuardada: p.pickup || null,
  recoleccionSkydropx: pk ? {status: pk.status, estado: pk.body?.data?.attributes?.status, solicitud: pk.body?.data?.attributes?.request_number,
    desde: pk.body?.data?.attributes?.scheduled_from, hasta: pk.body?.data?.attributes?.scheduled_to, error: pk.body?.data?.attributes?.error_reason} : null,
  rastreo: tr ? {status: tr.status, data: tr.body?.data?.attributes || tr.body} : null,
  mantenimiento: (await getDoc('instinto_private/maintenance'))?.last || null,
}, null, 1));

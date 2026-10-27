// INSTINTO V10 — diagnóstico de SOLO LECTURA de la generación de guía de una compra.
// Uso: TOKEN=$(gcloud auth print-access-token) node ops/diagnostico-guia.mjs <purchaseId>
import {execFileSync} from 'node:child_process';
import {getDoc} from './firestore-rest.mjs';
const id = process.argv[2];
const p = await getDoc('instinto_web_purchases/' + id);
const q = p?.shipping?.quotationId ? await getDoc('instinto_web_quotes/' + p.shipping.quotationId) : null;
const creds = JSON.parse(execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', 'INSTINTO_SKYDROPX_CREDENTIALS'], {encoding: 'utf8'}));
const B = 'https://api-pro.skydropx.com';
const tok = (await (await fetch(B + '/api/v1/oauth/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope: 'default'})})).json());
const get = async path => { const r = await fetch(B + path, {headers: {Authorization: 'Bearer ' + tok.access_token}}); return {status: r.status, body: await r.json().catch(() => null)}; };
const credits = await get('/api/v1/finance/credits');
await new Promise(r => setTimeout(r, 700));
const ships = await get('/api/v1/shipments?per_page=5');
await new Promise(r => setTimeout(r, 700));
const quote = p?.shipping?.quotationId ? await get('/api/v1/quotations/' + p.shipping.quotationId) : null;
const rate = quote?.body?.rates?.find(r => r.id === p.shipping.rateId);
console.log(JSON.stringify({
  shipmentGuardado: p?.shipment, envioElegido: p?.shipping, tokenScope: tok.scope,
  cotizacionGuardada: q ? {creada: new Date(q.createdAt).toISOString(), horas: ((Date.now() - q.createdAt) / 3600000).toFixed(2)} : null,
  tarifaEnSkydropx: rate ? {id: rate.id, status: rate.status, total: rate.total, success: rate.success, creationType: rate.shipment_creation_type, error: rate.error_messages || null} : (quote ? {status: quote.status, nota: 'rate no encontrado'} : null),
  saldo: credits.status === 200 ? credits.body.data : credits.status,
  enviosRecientes: ships.status === 200 ? ships.body.data.map(s => ({id: s.id, creado: s.attributes.created_at, estado: s.attributes.workflow_status, pago: s.attributes.payment_status, total: s.attributes.total, carrier: s.attributes.carrier_name, error: s.attributes.error_message})) : ships.status,
}, null, 1));

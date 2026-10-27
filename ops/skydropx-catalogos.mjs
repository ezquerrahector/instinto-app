// INSTINTO V10 — datos de configuración de Skydropx (sin secretos ni domicilios completos).
// Imprime: direcciones guardadas (id, alias, tipo, predeterminada, CP, estado/municipio/colonia),
// paquetes guardados, claves Carta Porte relacionadas con perfume, tipos de empaque y saldo.
import {execFileSync} from 'node:child_process';
const creds = JSON.parse(execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', 'INSTINTO_SKYDROPX_CREDENTIALS'], {encoding: 'utf8'}));
const BASE = 'https://api-pro.skydropx.com';
const tok = await (await fetch(BASE + '/api/v1/oauth/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope: 'default'})})).json();
const get = async p => { const r = await fetch(BASE + p, {headers: {Authorization: 'Bearer ' + tok.access_token}}); return {status: r.status, body: await r.json().catch(() => null)}; };
const out = {};
const addr = await get('/api/v1/address_templates?per_page=20');
out.direcciones = {status: addr.status, items: (addr.body?.data || []).map(a => ({id: a.id, alias: a.alias_name, tipo: a.address_type, predeterminada: a.default,
  cp: a.address?.postal_code, estado: a.address?.area_level1, municipio: a.address?.area_level2, colonia: a.address?.area_level3,
  completa: ['name', 'street1', 'phone', 'email', 'reference'].every(k => a.address?.[k]), verificadas: (a.verified_carriers || []).map(v => v.carrier_name + ':' + v.status)}))};
const pk = await get('/api/v1/shipments/package_templates?per_page=20');
out.paquetes = {status: pk.status, items: (pk.body?.data || []).map(p => ({id: p.id, nombre: p.name, tipo: p.package_type, l: p.length, w: p.width, h: p.height, kg: p.weight, cartaPorte: p.consignment_note, contenido: p.package_content, default: p.default}))};
const notes = [];
for (let page = 1; page <= 40; page++) {
  const r = await get('/api/v1/shipments/consignment_notes?per_page=100&page=' + page);
  for (const n of r.body?.data || []) if (/perfum|fragan|colonia|cosm[eé]t|loci[oó]n/i.test(n.description)) notes.push(n);
  if (!r.body?.meta?.next_page) break;
}
out.cartaPortePerfume = notes;
const pkg = await get('/api/v1/shipments/packagings?per_page=100');
out.empaques = (pkg.body?.data || []).filter(x => /caj|cart/i.test(x.name));
const cr = await get('/api/v1/finance/credits');
out.saldo = cr.body?.data || cr.status;
console.log(JSON.stringify(out, null, 1));

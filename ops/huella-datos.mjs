// INSTINTO V10 — huella verificable del estado de datos, SIN datos personales.
// Uso: node ops/huella-datos.mjs [--detalle]  (producción o emulador según variables).
// Imprime conteos, sumas y un hash canónico por colección para cotejar respaldo/restauración
// e inventario antes/después. Nunca imprime nombres, domicilios, teléfonos ni correos de clientes.
import {createHash} from 'node:crypto';
import {getDoc, listCollections, listDocs} from './firestore-rest.mjs';

const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : JSON.stringify(v);
const h = v => createHash('sha256').update(canon(v)).digest('hex').slice(0, 16);
const detail = process.argv.includes('--detalle');

const datos = await getDoc('instinto/datos');
const out = {fecha: new Date().toISOString(), destino: process.env.FIRESTORE_EMULATOR_HOST ? 'emulador' : 'produccion'};
if (datos) {
  const cat = datos.cat || [], peds = datos.peds || [], mats = datos.materiales || [];
  const count = (arr, k) => arr.reduce((m, x) => (m[x?.[k] ?? '(vacío)'] = (m[x?.[k] ?? '(vacío)'] || 0) + 1, m), {});
  out.datos = {
    camposRaiz: Object.keys(datos).sort(),
    syncRevision: datos.syncRevision ?? null, syncClient: datos.syncClient ?? null, updatedAt: datos.updatedAt ?? null,
    hashDocumento: h(datos),
    catalogo: {n: cat.length, sumaStockGramos: Math.round(cat.reduce((s, x) => s + (Number(x.stockGramos) || 0), 0) * 100) / 100,
      porLinea: count(cat, 'linea'), hashStock: h(cat.map(x => [x.id, Number(x.stockGramos)]).sort())},
    pedidos: {n: peds.length, idMax: peds.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0),
      porCanal: count(peds, 'canal'), porEstatus: count(peds, 'estatus'),
      camposVistos: [...new Set(peds.flatMap(p => Object.keys(p || {})))].sort(), hashIds: h(peds.map(p => p.id).sort())},
    materiales: mats.map(m => ({id: m.id, nombre: m.nombre ?? m.name ?? null, unidad: m.unidad ?? null,
      stockActual: m.stockActual, alerta: m.alerta ?? null, costo: m.costo ?? null})),
    gramosEditados: datos.gramosEditados ? Object.keys(datos.gramosEditados).length : null,
    cfg: datos.cfg || null,
  };
  if (detail) out.datos.stockPorId = Object.fromEntries(cat.map(x => [x.id, Number(x.stockGramos)]));
}
out.colecciones = {};
for (const c of (await listCollections()).sort()) {
  const docs = await listDocs(c);
  out.colecciones[c] = {n: docs.length, hash: h(docs.map(d => [d.id, d.data]).sort((a, b) => a[0] < b[0] ? -1 : 1))};
}
const runtime = await getDoc('instinto_private/runtime');
out.runtime = runtime ? {reconciliationEnabled: runtime.reconciliationEnabled ?? null,
  compatibleWritesValidated: runtime.compatibleWritesValidated ?? null, keys: Object.keys(runtime).sort()} : null;
console.log(JSON.stringify(out, null, 1));

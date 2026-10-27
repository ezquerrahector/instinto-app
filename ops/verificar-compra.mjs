// INSTINTO V10 — verificación de SOLO LECTURA de una compra real.
// Uso: TOKEN=$(gcloud auth print-access-token) node ops/verificar-compra.mjs <paymentId> [inventario-antes.json]
// Compara el pago en la API de Mercado Pago con el webhook recibido, la compra, el ledger, los pedidos
// administrativos y el inventario antes/después. Imprime datos operativos sin domicilio completo.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {getDoc, listDocs} from './firestore-rest.mjs';
const [paymentId, antesFile] = process.argv.slice(2);
const mpToken = execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', 'INSTINTO_MP_ACCESS_TOKEN'], {encoding: 'utf8'}).trim();
const pay = await (await fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {headers: {Authorization: 'Bearer ' + mpToken}})).json();
const purchaseId = pay.external_reference;
const inbox = await getDoc('instinto_mp_webhook_inbox/payment_' + paymentId);
const purchase = await getDoc('instinto_web_purchases/' + purchaseId);
const ledger = await getDoc('instinto_payment_ledger/mp_' + paymentId);
const datos = await getDoc('instinto/datos');
const web = (datos.peds || []).filter(p => p.folioWeb === purchaseId);
const out = {
  mercadoPago: {id: pay.id, status: pay.status, detalle: pay.status_detail, monto: pay.transaction_amount, moneda: pay.currency_id, vendedor: pay.collector_id,
    liveMode: pay.live_mode, referencia: purchaseId, aprobado: pay.date_approved, metodo: pay.payment_method_id, cuotas: pay.installments,
    comisionMP: (pay.fee_details || []).reduce((s, f) => s + f.amount, 0), netoRecibido: pay.transaction_details?.net_received_amount},
  webhook: inbox ? {estado: inbox.integrationState, motivo: inbox.reason || null, recibido: inbox.lastReceivedAt} : 'NO RECIBIDO (la conciliación programada lo cubre)',
  compra: purchase ? {estado: purchase.state, reserva: purchase.reservation, totalCents: purchase.totalCents, subtotalCents: purchase.subtotalCents,
    envioCents: purchase.shippingCents, envio: purchase.shipping, pedidosAdmin: purchase.adminOrderIds, revision: purchase.reviewRequired ? purchase.reviewReason : null,
    destinoCP: purchase.address?.postal, items: purchase.items.map(i => ({id: i.id, nombre: i.brand + ' · ' + i.name, ml: i.size, qty: i.qty, materiales: i.materialsPerUnit}))} : null,
  ledger,
  pedidosAdmin: web.map(p => ({id: p.id, estatus: p.estatus, canal: p.canal, codigo: p.codigo, ml: p.presentacionMl, gramos: p.gramosEsencia, precio: p.precio,
    esenciaDescontada: p.esenciaDescontada, matDescontado: p.matDescontado, pagoId: p.pagoId})),
  outbox: (await listDocs('instinto_web_outbox')).filter(d => d.data.purchaseId === purchaseId).map(d => ({id: d.id, estado: d.data.state, intentos: d.data.attempts || 0})),
  alertas: (await listDocs('instinto_alerts')).filter(d => d.data.state === 'open').map(d => ({id: d.id, tipo: d.data.type, motivo: d.data.reason || null})),
  inventario: {revision: datos.syncRevision ?? null, cliente: datos.syncClient ?? null, pedidos: datos.peds.length, idMax: Math.max(...datos.peds.map(p => +p.id || 0)),
    materiales: Object.fromEntries(datos.materiales.map(m => [m.id, m.stockActual]))},
};
if (antesFile && purchase) {
  const antes = JSON.parse(fs.readFileSync(antesFile, 'utf8')).datos;
  out.inventario.cambiosStock = purchase.items.map(i => ({id: i.id, antes: antes.stockPorId[i.id], despues: datos.cat.find(c => c.id === i.id)?.stockGramos}));
  const diffs = datos.cat.filter(c => antes.stockPorId[c.id] !== Number(c.stockGramos)).map(c => ({id: c.id, antes: antes.stockPorId[c.id], despues: c.stockGramos}));
  out.inventario.todasLasFraganciasConCambio = diffs;
  out.inventario.pedidosAntes = antes.pedidos.n;
  out.inventario.materialesAntes = Object.fromEntries(antes.materiales.map(m => [m.id, m.stockActual]));
}
console.log(JSON.stringify(out, null, 1));

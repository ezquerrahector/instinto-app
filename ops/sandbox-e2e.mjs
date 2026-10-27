// INSTINTO V10 — prueba de extremo a extremo AISLADA (emulador con datos restaurados) contra
// proveedores reales en modo prueba: Skydropx (cotización real) y Mercado Pago (token de prueba).
// El pago lo realiza una persona en el checkout de Mercado Pago con tarjeta de prueba.
//   node ops/sandbox-e2e.mjs crear      → cotiza, crea compra y preferencia; imprime liga de pago
//   node ops/sandbox-e2e.mjs conciliar  → consulta la API de MP, concilia, repite (idempotencia), outbox
// Requiere FIRESTORE_EMULATOR_HOST. Nunca escribe en producción.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw Error('Solo contra el emulador local 127.0.0.1:8085');
const admin = require('../payments/node_modules/firebase-admin');
const checkout = require('../payments/checkout.js');
const m = require('../payments/maintenance.js');
const {createMercadoPagoClient} = require('../payments/mercadopago.js');
const {createShippingClient} = require('../payments/shipping.js');
const {pendingClaims} = require('../payments/availability.js');
const app = admin.initializeApp({projectId: 'instinto-fragancias'}); const db = app.firestore();
const secret = n => execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', n], {encoding: 'utf8'}).trim();
const mpToken = secret('INSTINTO_MP_TEST_ACCESS_TOKEN');
const mp = createMercadoPagoClient({accessToken: async () => mpToken});
const shipping = createShippingClient({credentials: async () => JSON.parse(secret('INSTINTO_SKYDROPX_CREDENTIALS'))});
const STATE = process.env.HOME + '/instinto-sandbox/estado.json';
const snapshot = async ids => {
  const inv = (await db.doc('instinto/datos').get()).data();
  const {available} = pendingClaims(inv);
  return {syncRevision: inv.syncRevision ?? null, pedidos: inv.peds.length, idMax: Math.max(...inv.peds.map(p => +p.id || 0)),
    stock: Object.fromEntries(ids.map(id => [id, {stockGramos: inv.cat.find(x => x.id === id)?.stockGramos, libre: available.get(id)}])),
    materiales: Object.fromEntries(inv.materiales.map(x => [x.id, x.stockActual]))};
};
const cmd = process.argv[2];
if (cmd === 'crear') {
  const cat = await checkout.catalog({db});
  if (!cat.checkoutEnabled || cat.mode !== 'sandbox') throw Error('Runtime del emulador no está en sandbox con checkout encendido');
  const product = cat.products.find(p => p.gender === 'Dama') || cat.products[0];
  const items = [{id: product.id, size: 60, qty: 2, gift: true, giftText: 'Prueba sandbox V10'}];
  const address = {firstName: 'Prueba', lastName: 'Sandbox', email: 'pruebas.sandbox.instinto@gmail.com', phone: '5512345678', postal: '06600',
    state: 'Ciudad de México', city: 'Cuauhtémoc', colony: 'Juárez', street: 'Calle Hamburgo 100', references: 'Prueba técnica, no enviar'};
  const antes = await snapshot([product.id]);
  const q = await checkout.quote({db, shipping, body: {items, address}, clientKey: 'sandbox'});
  const rate = q.options[0];
  const res = await checkout.checkout({db, mp, body: {items, address, quoteId: q.quoteId, rateId: rate.id, requestId: 'sbx' + Date.now() + 'x'.repeat(8)},
    clientKey: 'sandbox', webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook'});
  const pref = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data().preference;
  const despuesReserva = await snapshot([product.id]);
  fs.mkdirSync(process.env.HOME + '/instinto-sandbox', {recursive: true, mode: 0o700});
  fs.writeFileSync(STATE, JSON.stringify({product: product.id, res, antes, despuesReserva, quote: q}, null, 1), {mode: 0o600});
  console.log(JSON.stringify({producto: product.brand + ' · ' + product.name, cotizacion: {quoteId: q.quoteId, opciones: q.options.map(o => o.name + ' $' + o.amount)},
    elegida: rate.name + ' $' + rate.amount, compra: res.purchaseId, total: res.total, subtotal: res.subtotal, envio: res.shipping,
    ligaPago: res.initPoint, preferencia: pref.id, antes: antes.stock, trasReserva: despuesReserva.stock, revision: [antes.syncRevision, despuesReserva.syncRevision]}, null, 1));
} else if (cmd === 'conciliar') {
  const st = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const pagos = await mp.searchPayments(st.res.purchaseId);
  const r1 = await m.reconcileOpenPurchases({db, mp});
  const p = (await db.doc('instinto_web_purchases/' + st.res.purchaseId).get()).data();
  // Idempotencia: repetir conciliación y reprocesar el mismo pago.
  const {reconcilePayment} = require('../payments/reconcile.js');
  const repeticiones = [];
  for (const pay of pagos) for (let i = 0; i < 3; i++) repeticiones.push((await reconcilePayment(db, await mp.getPayment(pay.id))).outcome);
  const o = await m.processOutbox({db, handlers: {purchase_paid: m.purchasePaidHandler}});
  const despues = await snapshot([st.product]);
  const inv = (await db.doc('instinto/datos').get()).data();
  const web = inv.peds.filter(x => x.folioWeb === st.res.purchaseId).map(x => ({id: x.id, estatus: x.estatus, canal: x.canal, codigo: x.codigo,
    presentacionMl: x.presentacionMl, gramos: x.gramosEsencia, precio: x.precio, esenciaDescontada: x.esenciaDescontada, matDescontado: x.matDescontado,
    materialesWeb: x.materialesWeb, pagoId: x.pagoId, notas: x.notas}));
  const ledger = (await db.collection('instinto_payment_ledger').get()).docs.map(d => ({id: d.id, ...d.data()}));
  console.log(JSON.stringify({pagosMP: pagos.map(x => ({id: x.id, status: x.status, detalle: x.status_detail, monto: x.transaction_amount, moneda: x.currency_id,
    liveMode: x.live_mode, collector: x.collector_id, metodo: x.payment_method_id})), conciliacion: r1, compra: {estado: p.state, reserva: p.reservation?.state,
    pagoId: p.paymentId, pedidosAdmin: p.adminOrderIds, revision: p.reviewRequired ? p.reviewReason : null}, repeticiones, outbox: o,
    inventario: {antes: st.antes, trasReserva: st.despuesReserva, despues}, pedidosWeb: web, ledger}, null, 1));
} else throw Error('uso: crear | conciliar');
await app.delete();

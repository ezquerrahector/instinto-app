'use strict';
// Flujo completo de checkout V10 en Firestore Emulator con proveedores simulados.
const {test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const admin = require('../payments/node_modules/firebase-admin');
const checkout = require('../payments/checkout');
const {reconcilePayment} = require('../payments/reconcile');
const m = require('../payments/maintenance');
const actions = require('../payments/admin-actions');
const PROJECT = 'demo-instinto-v10';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw Error('Local emulator required');
let app, db;
const T0 = Date.parse('2026-10-27T18:00:00Z');
const runtime = () => ({checkoutEnabled: true, reconciliationEnabled: true, compatibleWritesValidated: true, liveMode: false, collectorId: 123,
  enabledSizes: [60], pricesCents: {60: 31000},
  recipes: {60: {verified: true, essence: 30, fijador: 6, feromonas: 3.5, perfumol: 21.5}},
  packaging: {60: {Dama: {verified: true, bottle: 'env_cristal', atomizer: 'atomizador', label: null},
    Caballero: {verified: true, bottle: 'env_mate', atomizer: 'atomizador', label: null},
    Unisex: {verified: true, bottle: 'env_mate', atomizer: 'atomizador', label: null}}},
  boxes: {60: {verified: true, length: 20, width: 7, height: 7, packedWeightKg: 0.25}},
  origin: {postal_code: '37000', area_level1: 'Guanajuato', area_level2: 'León', area_level3: 'Centro'},
  shippingLabels: {enabled: true, consignmentNote: '53131620', packageType: '4G', originTemplateId: 'tpl-1'}});
const inventory = () => ({cfg: {gesencia: 30}, syncRevision: 7,
  cat: [{id: 'A', linea: 'Dama', disenador: 'Marca', referencia: 'Fragancia A', stockGramos: 90, costoEsencia: 2.8},
    {id: 'B', linea: 'Caballero', disenador: 'Marca', referencia: 'Fragancia B', stockGramos: 30, costoEsencia: 3}],
  peds: [{id: 10, cliente: 'Cliente WhatsApp', codigo: 'A', estatus: 'Pedido', canal: 'WhatsApp'},
    {id: 11, cliente: 'Para stock', codigo: 'B', estatus: 'Pedido', canal: 'Directo'}],
  materiales: [{id: 'env_cristal', stockActual: 10}, {id: 'env_mate', stockActual: 10}, {id: 'atomizador', stockActual: 10},
    {id: 'fijador', stockActual: 100}, {id: 'feromonas', stockActual: 100}, {id: 'perfumol', stockActual: 300}]});
const address = {firstName: 'Ana', lastName: 'Prueba', email: 'ana@example.com', phone: '4770000000', postal: '06600', state: 'Ciudad de México',
  city: 'Cuauhtémoc', colony: 'Juárez', street: 'Calle 1 #2', references: 'Portón negro'};
const fakeShipping = (over = {}) => ({
  calls: [],
  async createQuote(o, d, parcels) { this.calls.push(['quote', parcels]); return {id: 'q' + this.calls.length, status: 'completed',
    rates: [{id: 'r_cheap', carrier: 'Sendex', service: 'Reg', currency: 'MXN', totalCents: 5125, days: 2},
      {id: 'r_fast', carrier: 'DHL', service: 'Express', currency: 'MXN', totalCents: 17562, days: 1}]}; },
  async getQuote(id) { return {id, status: 'completed', rates: []}; },
  async addressTemplate() { return {name: 'INSTINTO', company: 'INSTINTO', street1: 'Origen 1', phone: '4770000000', email: 'o@example.com', reference: 'Ref'}; },
  async createShipment(args) { this.calls.push(['ship', args]); return {id: 'shp1', packages: []}; },
  async getShipment(id) { return {id, workflowStatus: 'success', carrier: 'sendex', totalCents: 5125, masterTrackingNumber: 'TRK1',
    packages: [{id: 'p1', trackingNumber: 'TRK1', labelUrl: 'https://label.example/1.pdf'}]}; },
  ...over});
const fakeMp = () => ({prefs: 0, refunds: [], payments: [],
  async createPreference(p) { this.prefs++; return {id: 'pref_' + p.id, initPoint: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=x'}; },
  async findPreference() { return null; },
  async searchPayments() { return this.payments; },
  async getPayment(id) { return this.payments.find(p => String(p.id) === String(id)); },
  async refund(id, {idempotencyKey}) { this.refunds.push([id, idempotencyKey]); return {id: 'rf1', status: 'approved', amount: 0}; }});
const paymentFor = (p, over = {}) => ({id: '9001', external_reference: p.purchaseId, metadata: {instinto_purchase: p.purchaseId, instinto_binding: p.binding},
  collector_id: 123, live_mode: false, status: 'approved', currency_id: 'MXN', transaction_amount: p.total, transaction_amount_refunded: 0,
  date_approved: new Date(T0 + 60000).toISOString(), date_last_updated: new Date(T0 + 60000).toISOString(), ...over});
const ident = email => ({email, email_verified: true});
before(() => { app = admin.initializeApp({projectId: PROJECT}, 'checkout-tests'); db = app.firestore(); });
after(async () => { await app?.delete(); });
beforeEach(async () => {
  const r = await fetch(`http://127.0.0.1:8085/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {method: 'DELETE'});
  assert.equal(r.ok, true);
  await db.doc('instinto_private/runtime').set(runtime());
  await db.doc('instinto/datos').set(inventory());
});
async function buy(shipping, mp, items = [{id: 'A', size: 60, qty: 2}], requestId = 'req_' + 'a'.repeat(20), now = T0) {
  const q = await checkout.quote({db, shipping, body: {items, address}, clientKey: 'ip1', now});
  const res = await checkout.checkout({db, mp, body: {items, address, quoteId: q.quoteId, rateId: q.options[0].id, requestId}, clientKey: 'ip1',
    webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook', now});
  return {q, res};
}

test('catalog subtracts pending WhatsApp claims and hides disabled 100 ml', async () => {
  const c = await checkout.catalog({db});
  assert.deepEqual(c.products.map(p => [p.id, p.availableSizes]), [['A', [60]], ['B', [60]]]); // A: 90-30 apartados = 60 libres; B: 'Para stock' no aparta
  assert.equal(c.enabledSizes.length, 1);
});

test('quote packs one verified box per bottle with real packed weight and persists binding', async () => {
  const s = fakeShipping();
  const {q} = await buy(s, fakeMp());
  assert.equal(s.calls[0][1].length, 2); assert.equal(s.calls[0][1][0].weight, 0.25); assert.equal(s.calls[0][1][0].length, 20);
  const doc = (await db.doc('instinto_web_quotes/' + q.quoteId).get()).data();
  assert.equal(doc.rates[0].totalCents, 5125); assert.ok(doc.basketHash);
});

test('cannot buy grams already promised to a pending WhatsApp order', async () => {
  await assert.rejects(buy(fakeShipping(), fakeMp(), [{id: 'A', size: 60, qty: 3}]), {message: 'insufficient_stock'});
});

test('checkout is idempotent, reserves essence once and coordinates with admin revision', async () => {
  const s = fakeShipping(), mp = fakeMp();
  const {q, res} = await buy(s, mp);
  const again = await checkout.checkout({db, mp, body: {items: [{id: 'A', size: 60, qty: 2}], address, quoteId: q.quoteId, rateId: 'r_cheap',
    requestId: 'req_' + 'a'.repeat(20)}, clientKey: 'ip1', webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook', now: T0});
  assert.equal(again.purchaseId, res.purchaseId); assert.equal(mp.prefs, 1);
  assert.equal(res.total, 620 + 51.25);
  const inv = (await db.doc('instinto/datos').get()).data();
  assert.equal(inv.cat[0].stockGramos, 30); assert.equal(inv.syncRevision, 8); assert.equal(inv.peds.length, 2);
  // Un segundo comprador ya no puede tomar los 30 g apartados por el pedido WhatsApp.
  await assert.rejects(buy(s, mp, [{id: 'A', size: 60, qty: 1}], 'req_' + 'b'.repeat(20)), {message: 'insufficient_stock'});
  // Reutilizar requestId con otra cesta se rechaza.
  await assert.rejects(checkout.checkout({db, mp, body: {items: [{id: 'B', size: 60, qty: 1}], address, quoteId: q.quoteId, rateId: 'r_cheap',
    requestId: 'req_' + 'a'.repeat(20)}, clientKey: 'ip1', webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook', now: T0}), {message: 'request_reused'});
});

test('manipulated price/shipping from browser is ignored; unknown rate rejected', async () => {
  const s = fakeShipping(), mp = fakeMp();
  const q = await checkout.quote({db, shipping: s, body: {items: [{id: 'A', size: 60, qty: 1}], address}, clientKey: 'x', now: T0});
  const r = await checkout.checkout({db, mp, body: {items: [{id: 'A', size: 60, qty: 1, unitPrice: 1}], address, quoteId: q.quoteId, rateId: 'r_cheap',
    requestId: 'req_' + 'c'.repeat(20), total: 1, shipping: 0}, clientKey: 'x', webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook', now: T0});
  assert.equal(r.total, 361.25);
  await assert.rejects(checkout.checkout({db, mp, body: {items: [{id: 'A', size: 60, qty: 1}], address, quoteId: q.quoteId, rateId: 'r_fake',
    requestId: 'req_' + 'd'.repeat(20)}, clientKey: 'x', webhookUrl: 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook', now: T0}), {message: 'invalid_shipping_rate'});
});

test('approved payment (duplicated webhooks) consumes the reservation without second deduction and creates one admin order per bottle', async () => {
  const {res} = await buy(fakeShipping(), fakeMp());
  const pay = paymentFor(res);
  const outcomes = await Promise.all([reconcilePayment(db, pay, {now: T0 + 60000}), reconcilePayment(db, pay, {now: T0 + 60000}), reconcilePayment(db, pay, {now: T0 + 60000})]);
  assert.equal(outcomes.filter(o => o.outcome === 'applied').length, 1);
  const inv = (await db.doc('instinto/datos').get()).data();
  assert.equal(inv.cat[0].stockGramos, 30, 'esencia descontada exactamente una vez (90-60)');
  const web = inv.peds.filter(p => p.folioWeb === res.purchaseId);
  assert.equal(web.length, 2); assert.ok(web.every(p => p.esenciaDescontada && !p.matDescontado && p.canal === 'Web' && p.precio === 310));
  assert.deepEqual(web[0].materialesWeb, {env_cristal: 1, atomizador: 1, feromonas: 3.5, fijador: 6, perfumol: 21.5});
  const p = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data();
  assert.equal(p.state, 'paid'); assert.equal(p.reservation.state, 'consumed');
  // El aviso durable se procesa una vez.
  const o1 = await m.processOutbox({db, now: T0 + 70000, handlers: {purchase_paid: m.purchasePaidHandler}});
  const o2 = await m.processOutbox({db, now: T0 + 80000, handlers: {purchase_paid: m.purchasePaidHandler}});
  assert.equal(o1.done, 1); assert.equal(o2.done, 0);
  assert.equal((await db.doc('instinto_alerts/paid_' + res.purchaseId).get()).data().type, 'new_paid_order');
});

test('expired unpaid reservation is released only after the API confirms no payment; then late payment re-deducts if stock allows', async () => {
  const mp = fakeMp();
  const {res} = await buy(fakeShipping(), mp);
  const p0 = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data();
  mp.payments = [{...paymentFor(res), status: 'in_process'}];
  let r = await m.reconcileOpenPurchases({db, mp, now: p0.expiresAt + 11 * 60000});
  assert.equal(r.released, 0, 'pago en curso: no liberar');
  mp.payments = [];
  r = await m.reconcileOpenPurchases({db, mp, now: p0.expiresAt + 11 * 60000});
  assert.equal(r.released, 1);
  assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos, 90);
  r = await m.reconcileOpenPurchases({db, mp, now: p0.expiresAt + 20 * 60000});
  assert.equal(r.released, 0, 'liberación idempotente');
  const late = await reconcilePayment(db, paymentFor(res, {date_approved: new Date(p0.expiresAt + 30 * 60000).toISOString(),
    date_last_updated: new Date(p0.expiresAt + 30 * 60000).toISOString()}), {now: p0.expiresAt + 30 * 60000});
  assert.equal(late.outcome, 'applied');
  assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos, 30);
});

test('late payment without free stock goes to review and never oversells', async () => {
  const mp = fakeMp();
  const {res} = await buy(fakeShipping(), mp);
  const p0 = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data();
  await m.reconcileOpenPurchases({db, mp, now: p0.expiresAt + 11 * 60000});
  const inv = (await db.doc('instinto/datos').get()).data();
  inv.peds.push({id: 12, cliente: 'Otro', codigo: 'A', estatus: 'Pedido', canal: 'Directo'}); // aparta 30 g más
  await db.doc('instinto/datos').set(inv);
  const late = await reconcilePayment(db, paymentFor(res), {now: p0.expiresAt + 30 * 60000});
  assert.equal(late.reason, 'late_payment_no_stock');
  assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos, 90);
});

test('missed webhook is recovered by scheduled reconciliation', async () => {
  const mp = fakeMp();
  const {res} = await buy(fakeShipping(), mp);
  mp.payments = [paymentFor(res)];
  const r = await m.reconcileOpenPurchases({db, mp, now: T0 + 5 * 60000});
  assert.equal(r.applied, 1);
  assert.equal((await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data().state, 'paid');
});

test('label creation is authorized, idempotent and stores tracking; unauthorized users rejected', async () => {
  const s = fakeShipping(), mp = fakeMp();
  const {res} = await buy(s, mp);
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  await assert.rejects(actions.createLabel({db, shipping: s, identity: ident('intruso@example.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'x'.repeat(20)}, now: T0}), {message: 'forbidden'});
  const a = await actions.createLabel({db, shipping: s, identity: ident('osmararobles@hotmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'l'.repeat(20)}, now: T0 + 120000});
  assert.equal(a.outcome, 'label_ready'); assert.equal(a.shipment.trackingNumber, 'TRK1');
  const b = await actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'm'.repeat(20)}, now: T0 + 130000});
  assert.equal(b.outcome, 'already_ready');
  assert.equal(s.calls.filter(c => c[0] === 'ship').length, 1, 'una sola guía comprada');
  const ship = s.calls.find(c => c[0] === 'ship')[1];
  assert.equal(ship.packages.length, 2); assert.equal(ship.packages[0].consignmentNote, '53131620'); assert.equal(ship.rateId, 'r_cheap');
  const st = await checkout.status({db, purchaseId: res.purchaseId, binding: res.binding});
  assert.equal(st.state, 'paid'); assert.equal(st.shipment.trackingNumber, 'TRK1');
  await assert.rejects(checkout.status({db, purchaseId: res.purchaseId, binding: 'f'.repeat(48)}), {message: 'not_found'});
});

test('authorized cancellation refunds once, restocks only unused essence, never materials, and is auditable', async () => {
  const mp = fakeMp();
  const {res} = await buy(fakeShipping(), mp);
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  const body = {purchaseId: res.purchaseId, operationId: 'op_' + 'c'.repeat(20), refund: 'full', restockEssence: true, reason: 'Cliente canceló antes de elaborar'};
  const r1 = await actions.cancelPurchase({db, mp, identity: ident('ezquerrahector@gmail.com'), body, now: T0 + 3600000});
  const r2 = await actions.cancelPurchase({db, mp, identity: ident('ezquerrahector@gmail.com'), body, now: T0 + 3600001});
  assert.equal(r1.outcome, 'cancelled'); assert.equal(r2.outcome, 'already_cancelled'); assert.equal(mp.refunds.length, 1);
  const inv = (await db.doc('instinto/datos').get()).data();
  assert.equal(inv.cat[0].stockGramos, 90);
  assert.ok(inv.peds.filter(p => p.folioWeb === res.purchaseId).every(p => p.estatus === 'Cancelado' && p.esenciaRepuesta));
  assert.equal(inv.materiales.find(x => x.id === 'env_cristal').stockActual, 10);
  assert.equal((await db.doc('instinto_admin_operations/' + body.operationId).get()).data().actor, 'ezquerrahector@gmail.com');
  await assert.rejects(actions.cancelPurchase({db, mp, identity: ident('osmararobles@hotmail.com'), body, now: T0 + 3600002}), {message: 'operation_reused'});
});

test('integrity check detects deleted or edited web orders', async () => {
  const {res} = await buy(fakeShipping(), fakeMp());
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  const inv = (await db.doc('instinto/datos').get()).data();
  inv.peds = inv.peds.filter(p => p.folioWeb !== res.purchaseId || p.uid.endsWith('-1'));
  inv.peds.find(p => p.folioWeb === res.purchaseId).esenciaDescontada = false;
  await db.doc('instinto/datos').set(inv);
  const r = await m.verifyIntegrity({db, now: T0 + 70000});
  assert.equal(r.issues, 2);
});

test('checkout stays closed when any private gate or verified mapping is missing', async () => {
  for (const change of [{checkoutEnabled: false}, {compatibleWritesValidated: false}, {boxes: {60: {verified: false}}}, {recipes: {}}]) {
    await db.doc('instinto_private/runtime').set({...runtime(), ...change});
    await assert.rejects(checkout.quote({db, shipping: fakeShipping(), body: {items: [{id: 'A', size: 60, qty: 1}], address}, clientKey: 'z', now: T0}));
  }
  assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos, 90);
});

test('a rejected label keeps the provider message, creates no shipment and can be retried safely', async () => {
  let fail = true;
  const s = fakeShipping({async createShipment(args) { this.calls.push(['ship', args]);
    if (fail) { const e = Error('shipping_provider_error'); e.status = 422; e.detail = '{"errors":["street1 too long"]}'; throw e; }
    return {id: 'shp2', packages: []}; }});
  const mp = fakeMp();
  const {res} = await buy(s, mp);
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  await assert.rejects(actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'f'.repeat(20)}, now: T0 + 120000}),
    e => e.message === 'label_provider_rejected' && /street1/.test(e.detail));
  const p = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data();
  assert.equal(p.shipment.state, 'failed'); assert.equal(p.shipment.providerStatus, 422);
  assert.ok((await db.doc('instinto_alerts/label_' + res.purchaseId).get()).exists);
  fail = false;
  const ok = await actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'g'.repeat(20)}, now: T0 + 130000});
  assert.equal(ok.outcome, 'label_ready');
  assert.ok(s.calls.filter(c => c[0] === 'ship').every(c => c[1].to.street1.length <= 45 && c[1].to.reference.length <= 40));
});

test('a stale "creating" label without shipment id can be retried; a recent one cannot', async () => {
  const s = fakeShipping(), mp = fakeMp();
  const {res} = await buy(s, mp);
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  await db.doc('instinto_web_purchases/' + res.purchaseId).update({shipment: {state: 'creating', operationId: 'op_' + 'o'.repeat(20), startedAt: T0 + 100000}});
  await assert.rejects(actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'n'.repeat(20)}, now: T0 + 200000}), {message: 'shipment_in_progress'});
  const r = await actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'p'.repeat(20)}, now: T0 + 100000 + 11 * 60000});
  assert.equal(r.outcome, 'label_ready');
});

test('customer emails: paid confirmation and shipped tracking are sent once each, only when enabled', async () => {
  const sent = [];
  const mailerFactory = () => ({async send(msg, opt) { sent.push({...msg, bcc: opt?.bcc}); return {messageId: 'm' + sent.length}; }});
  const s = fakeShipping(), mp = fakeMp();
  const {res} = await buy(s, mp);
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  // Deshabilitado: la tarea se completa sin enviar.
  await m.processOutbox({db, now: T0 + 61000, handlers: {purchase_paid: m.purchasePaidHandler, label_ready: m.labelReadyHandler, mailerFactory}});
  assert.equal(sent.length, 0);
  await db.doc('instinto_private/runtime').set({...runtime(), emails: {enabled: true, copyTo: 'ezquerrahector@gmail.com'}});
  await db.doc('instinto_web_outbox/paidmail_' + res.purchaseId).set({type: 'purchase_paid', purchaseId: res.purchaseId, state: 'pending', createdAt: T0});
  await m.processOutbox({db, now: T0 + 62000, handlers: {purchase_paid: m.purchasePaidHandler, label_ready: m.labelReadyHandler, mailerFactory}});
  assert.equal(sent.length, 1); assert.equal(sent[0].to, 'ana@example.com'); assert.match(sent[0].subject, /confirmado/); assert.equal(sent[0].bcc, 'ezquerrahector@gmail.com');
  assert.match(sent[0].html, /Fragancia A/); assert.doesNotMatch(sent[0].html, /<script/i);
  await actions.createLabel({db, shipping: s, identity: ident('ezquerrahector@gmail.com'), body: {purchaseId: res.purchaseId, operationId: 'op_' + 'e'.repeat(20)}, now: T0 + 70000});
  await m.processOutbox({db, now: T0 + 71000, handlers: {purchase_paid: m.purchasePaidHandler, label_ready: m.labelReadyHandler, mailerFactory}});
  assert.equal(sent.length, 2); assert.match(sent[1].subject, /TRK1/);
  // Reencolar no reenvía.
  await db.doc('instinto_web_outbox/again').set({type: 'purchase_paid', purchaseId: res.purchaseId, state: 'pending', createdAt: T0});
  await m.processOutbox({db, now: T0 + 72000, handlers: {purchase_paid: m.purchasePaidHandler, label_ready: m.labelReadyHandler, mailerFactory}});
  assert.equal(sent.length, 2);
  const p = (await db.doc('instinto_web_purchases/' + res.purchaseId).get()).data();
  assert.ok(p.emails.paidSentAt && p.emails.shippedSentAt);
});

test('email failure retries the task without marking it sent', async () => {
  let fail = true; const sent = [];
  const mailerFactory = () => ({async send(msg) { if (fail) throw Error('smtp_down'); sent.push(msg); return {messageId: 'ok'}; }});
  const {res} = await buy(fakeShipping(), fakeMp());
  await db.doc('instinto_private/runtime').set({...runtime(), emails: {enabled: true}});
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  const h = {purchase_paid: m.purchasePaidHandler, label_ready: m.labelReadyHandler, mailerFactory};
  const r1 = await m.processOutbox({db, now: T0 + 61000, handlers: h});
  assert.equal(r1.retried, 1); assert.equal(sent.length, 0);
  fail = false;
  const r2 = await m.processOutbox({db, now: T0 + 61000 + 3 * 60000, handlers: h});
  assert.equal(r2.done, 1); assert.equal(sent.length, 1);
});

test('pickup is scheduled once for a ready label, with validated window and provider detail on rejection', async () => {
  const calls = [];
  const s = fakeShipping({async schedulePickup(a) { calls.push(a); return {id: 'pk1', status: 'scheduled', requestNumber: 'R-77', errorReason: ''}; }});
  const {res} = await buy(s, fakeMp());
  await reconcilePayment(db, paymentFor(res), {now: T0 + 60000});
  const who = ident('ezquerrahector@gmail.com');
  await assert.rejects(actions.schedulePickup({db, shipping: s, identity: who, body: {purchaseId: res.purchaseId, operationId: 'op_' + 'q'.repeat(20), date: '2026-10-28', from: '10:00', to: '14:00'}, now: T0}), {message: 'label_not_ready'});
  await actions.createLabel({db, shipping: s, identity: who, body: {purchaseId: res.purchaseId, operationId: 'op_' + 'r'.repeat(20)}, now: T0 + 70000});
  await assert.rejects(actions.schedulePickup({db, shipping: s, identity: who, body: {purchaseId: res.purchaseId, operationId: 'op_' + 's'.repeat(20), date: '2026-10-28', from: '10:00', to: '11:00'}, now: T0}), {message: 'invalid_pickup_window'});
  const r = await actions.schedulePickup({db, shipping: s, identity: who, body: {purchaseId: res.purchaseId, operationId: 'op_' + 't'.repeat(20), date: '2026-10-28', from: '10:00', to: '14:00'}, now: T0});
  assert.equal(r.outcome, 'scheduled'); assert.equal(r.pickup.requestNumber, 'R-77');
  assert.deepEqual(calls[0].shipmentIds, ['shp1']); assert.equal(calls[0].packages, 2); assert.equal(calls[0].from, '2026-10-28T10:00:00-06:00');
  const again = await actions.schedulePickup({db, shipping: s, identity: who, body: {purchaseId: res.purchaseId, operationId: 'op_' + 'u'.repeat(20), date: '2026-10-28', from: '10:00', to: '14:00'}, now: T0});
  assert.equal(again.outcome, 'already_scheduled'); assert.equal(calls.length, 1);
});

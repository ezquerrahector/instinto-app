'use strict';
// INSTINTO V10 — codebase instinto-payments.
// Funciones: checkoutApi (tienda), mpWebhook (notificaciones firmadas), webOrderStatus (elaboración),
// webAdmin (acciones autenticadas de ventas Web), maintenance (conciliación/outbox/rastreo cada 5 min).
// Todo efecto automático depende de interruptores privados en instinto_private/runtime:
//   checkoutEnabled, reconciliationEnabled, compatibleWritesValidated, shippingLabels.enabled.
const {onRequest} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const REGION = 'us-central1';
const mpLive = defineSecret('INSTINTO_MP_ACCESS_TOKEN');
const mpTest = defineSecret('INSTINTO_MP_TEST_ACCESS_TOKEN');
const signingKey = defineSecret('INSTINTO_MP_WEBHOOK_SECRET');
const skydropx = defineSecret('INSTINTO_SKYDROPX_CREDENTIALS');
const WEBHOOK_URL = 'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook';
const STORE_ORIGINS = new Set(['https://instintofragancias.com', 'https://www.instintofragancias.com']);
const ADMIN_ORIGIN = 'https://ezquerrahector.github.io';

const {validSignature} = require('./signature');
const {reconcilePayment} = require('./reconcile');
const {createAdminStatusHandler} = require('./admin-api');
const {createMercadoPagoClient} = require('./mercadopago');
const {createShippingClient} = require('./shipping');
const checkout = require('./checkout');
const maintenance = require('./maintenance');
const actions = require('./admin-actions');

async function runtime() { return (await db.doc('instinto_private/runtime').get()).data() || {}; }
async function mpClient() {
  const live = (await runtime()).liveMode === true;
  const token = (live ? mpLive : mpTest).value();
  if (!token || token.length < 20) throw Error('mp_not_configured');
  return createMercadoPagoClient({accessToken: async () => token});
}
let shippingClient;
function shipping() {
  if (!shippingClient) shippingClient = createShippingClient({credentials: async () => JSON.parse(skydropx.value())});
  return shippingClient;
}
const clientKey = req => String(req.get('x-forwarded-for') || req.ip || 'unknown').split(',')[0].trim();
function cors(req, res, allowed, methods) {
  const origin = req.get('origin');
  res.set('Vary', 'Origin'); res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
  res.set('Access-Control-Allow-Methods', methods); res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (origin && allowed(origin)) res.set('Access-Control-Allow-Origin', origin);
  if (origin && !allowed(origin)) { res.status(403).json({error: 'forbidden_origin'}); return false; }
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  return true;
}
function fail(res, e, label) {
  const status = e.status || (e.message === 'checkout_disabled' ? 503 : e.message === 'config_invalid' ? 503 : 500);
  if (status >= 500) console.error(label, e.message, e.reason || '');
  const body = {error: status === 500 ? 'internal_error' : e.message};
  for (const k of ['paidCents', 'currentCents', 'detail']) if (e[k] !== undefined) body[k] = e[k];
  return res.status(status).json(body);
}

exports.checkoutApi = onRequest({region: REGION, timeoutSeconds: 45, memory: '256MiB', maxInstances: 5, invoker: 'public',
  secrets: [mpLive, mpTest, skydropx]}, async (req, res) => {
  if (!cors(req, res, o => STORE_ORIGINS.has(o), 'GET,POST,OPTIONS')) return;
  const path = req.path.replace(/\/+$/, '');
  try {
    if (req.method === 'POST' && Buffer.byteLength(JSON.stringify(req.body ?? {})) > 16000) return res.status(413).json({error: 'request_too_large'});
    if (path === '/api/catalog' && req.method === 'GET') {
      res.set('Cache-Control', 'public,max-age=15,s-maxage=15');
      return res.json(await checkout.catalog({db}));
    }
    if (path === '/api/shipping/quote' && req.method === 'POST')
      return res.json(await checkout.quote({db, shipping: shipping(), body: req.body, clientKey: clientKey(req)}));
    if (path === '/api/checkout' && req.method === 'POST')
      return res.status(201).json(await checkout.checkout({db, mp: await mpClient(), body: req.body, clientKey: clientKey(req), webhookUrl: WEBHOOK_URL}));
    if (path === '/api/checkout/status' && req.method === 'GET')
      return res.json(await checkout.status({db, purchaseId: req.query.id, binding: req.query.b}));
    return res.status(404).json({error: 'not_found'});
  } catch (e) { return fail(res, e, 'checkout_api'); }
});

const scalar = s => typeof s === 'string' ? s : '';
exports.mpWebhook = onRequest({region: REGION, timeoutSeconds: 45, memory: '256MiB', maxInstances: 3,
  secrets: [mpLive, mpTest, signingKey], invoker: 'public'}, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({service: 'instinto-mp-webhook', status: 'ready'});
  if (req.method !== 'POST') return res.status(405).send('method_not_allowed');
  try {
    if (!validSignature(req, signingKey.value())) return res.status(401).send('invalid_signature');
    const type = scalar(req.body?.type) || scalar(req.query.type) || scalar(req.query.topic);
    if (type !== 'payment') return res.status(200).send('ignored');
    const id = String(req.body?.data?.id || req.query['data.id'] || req.query.id || '');
    if (!/^\d{1,30}$/.test(id)) return res.status(400).send('invalid_payment_id');
    const mp = await mpClient();
    let payment;
    try { payment = await mp.getPayment(id); } catch (e) { console.error('mp_payment_lookup_failed', e.message, e.status || ''); return res.status(503).send('retry'); }
    // Buzón de auditoría; NO es pedido. El pedido solo nace de reconcilePayment con pago fresco de la API.
    await db.collection('instinto_mp_webhook_inbox').doc('payment_' + id).set({
      provider: 'mercadopago', paymentId: id, status: String(payment.status || 'unknown'),
      transactionAmount: Number(payment.transaction_amount || 0), currency: String(payment.currency_id || ''),
      externalReference: String(payment.external_reference || '').slice(0, 150), liveMode: payment.live_mode === true,
      integrationState: 'awaiting_order_reconciliation', lastReceivedAt: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
    const config = await runtime();
    if (config.reconciliationEnabled === true && config.compatibleWritesValidated === true) {
      try {
        const result = await reconcilePayment(db, payment);
        await db.collection('instinto_mp_webhook_inbox').doc('payment_' + id).set({integrationState: result.outcome, reason: result.reason || null}, {merge: true});
        if (result.outcome === 'review_required') await maintenance.alert(db, 'payment_' + id, {type: 'payment_review', paymentId: id,
          purchaseId: String(payment.external_reference || ''), reason: result.reason});
      } catch (error) {
        const invalid = new Set(['invalid_payment_reference', 'unknown_purchase', 'collector_mismatch', 'payment_environment_mismatch',
          'purchase_binding_mismatch', 'payment_total_mismatch', 'invalid_payment_timestamp']);
        if (!invalid.has(error.message)) throw error; // transitorio: Mercado Pago reintenta
        await db.collection('instinto_mp_webhook_inbox').doc('payment_' + id).set({integrationState: 'blocked_manual_review', reason: error.message}, {merge: true});
        await maintenance.alert(db, 'payment_' + id, {type: 'payment_rejected_by_validation', paymentId: id, reason: error.message});
      }
    }
    return res.status(200).send('received');
  } catch (e) { console.error('mp_webhook_error', e?.message || 'error'); return res.status(503).send('retry'); }
});

exports.webOrderStatus = onRequest({region: REGION, timeoutSeconds: 30, memory: '256MiB', maxInstances: 3, invoker: 'public'},
  createAdminStatusHandler({db, verifyIdToken: (value, checkRevoked) => admin.auth().verifyIdToken(value, checkRevoked)}));

exports.webAdmin = onRequest({region: REGION, timeoutSeconds: 60, memory: '256MiB', maxInstances: 3, invoker: 'public',
  secrets: [mpLive, mpTest, skydropx]}, async (req, res) => {
  if (!cors(req, res, o => o === ADMIN_ORIGIN, 'GET,POST,OPTIONS')) return;
  try {
    const header = String(req.get('authorization') || '');
    if (!header.startsWith('Bearer ') || header.length > 8192) return res.status(401).json({error: 'authentication_required'});
    let identity;
    try { identity = await admin.auth().verifyIdToken(header.slice(7), true); } catch { return res.status(401).json({error: 'invalid_session'}); }
    actions.actorOf(identity);
    if (req.method === 'POST' && Buffer.byteLength(JSON.stringify(req.body ?? {})) > 4096) return res.status(413).json({error: 'request_too_large'});
    const path = req.path.replace(/\/+$/, ''), ctx = {db, identity, body: req.body};
    if (path === '/overview' && req.method === 'GET') return res.json(await actions.overview(ctx));
    if (path === '/label' && req.method === 'POST') return res.json(await actions.createLabel({...ctx, shipping: shipping()}));
    if (path === '/label/cancel' && req.method === 'POST') return res.json(await actions.cancelLabel({...ctx, shipping: shipping()}));
    if (path === '/cancel' && req.method === 'POST') return res.json(await actions.cancelPurchase({...ctx, mp: await mpClient()}));
    if (path === '/alert/resolve' && req.method === 'POST') return res.json(await actions.resolveAlert(ctx));
    return res.status(404).json({error: 'not_found'});
  } catch (e) { return fail(res, e, 'web_admin'); }
});

exports.maintenance = onSchedule({region: REGION, schedule: 'every 5 minutes', timeZone: 'America/Mexico_City', timeoutSeconds: 240,
  memory: '256MiB', maxInstances: 1, retryCount: 0, secrets: [mpLive, mpTest, skydropx]}, async () => {
  const config = await runtime();
  if (config.reconciliationEnabled !== true || config.compatibleWritesValidated !== true) return;
  const now = Date.now(), report = {at: now};
  try { report.reconcile = await maintenance.reconcileOpenPurchases({db, mp: await mpClient(), now}); } catch (e) { report.reconcileError = e.message; }
  try { report.outbox = await maintenance.processOutbox({db, now, handlers: {purchase_paid: maintenance.purchasePaidHandler}}); } catch (e) { report.outboxError = e.message; }
  try { report.tracking = await maintenance.refreshTracking({db, shipping: shipping(), now}); } catch (e) { report.trackingError = e.message; }
  try { report.integrity = await maintenance.verifyIntegrity({db, now}); } catch (e) { report.integrityError = e.message; }
  await db.doc('instinto_private/maintenance').set({last: report}, {merge: true});
  if (Object.keys(report).some(k => k.endsWith('Error'))) console.error('maintenance_partial', JSON.stringify(report));
});

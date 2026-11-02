'use strict';
// INSTINTO V10.5 — Regalar perfume (sin cuenta), como en institutomara.com.
// Quien regala elige: (a) un perfume específico (el código exige ese perfume mientras haya existencia; si se agota,
// vale su monto para cualquier otro) o (b) un monto abierto ($310/$620/$930 o libre ≥ $310). Puede incluir envío.
// Paga con Mercado Pago (external_reference 'g…'). Al confirmarse el pago se genera el código: un cupón de SALDO
// (instinto_coupons, kind 'gift', 12 meses) que quien recibe usa en su carrito con su propia dirección.
// Entrega: correo automático en la fecha elegida o tarjeta para mandar por WhatsApp desde la liga privada.
const {createHash, randomBytes, timingSafeEqual} = require('node:crypto');
const {httpError, rateLimit, readRuntime, publicCatalog} = require('./checkout');
const {normCode, CODE, evaluateGiftCoupon} = require('./coupons');
const SITE = 'https://instintofragancias.com';
const sha = v => createHash('sha256').update(v).digest('hex');
const text = (v, n = 120) => typeof v === 'string' ? v.trim().slice(0, n) : '';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEAR = 365 * 86400000;
const charged = g => g.chargedCents ?? g.totalCents; // lo que se cobra (con cupón puede ser menor que el saldo del regalo)

function giftConfig(runtime) {
  const g = runtime.gifts || {};
  return {enabled: g.enabled !== false, shippingCreditCents: Number.isSafeInteger(g.shippingCreditCents) ? g.shippingCreditCents : 15000,
    minCents: 31000, maxCents: 300000, holdMs: 48 * 3600000};
}

function publicGift(g, coupon) {
  return {id: g.id, state: g.state, mode: g.mode, productName: g.productName || null, valueCents: g.valueCents,
    shippingIncluded: g.shippingIncluded, totalCents: g.totalCents, from: {name: g.from.name}, to: g.to, message: g.message,
    deliverAt: g.deliverAt || null, delivered: g.delivered || null, code: g.state === 'paid' ? g.code : null,
    balanceCents: coupon ? coupon.balanceCents : null, expiresAt: coupon ? coupon.expiresAt : null,
    redeemUrl: g.state === 'paid' ? `${SITE}/?cupon=${encodeURIComponent(g.code)}` : null,
    editable: g.state === 'paid' ? !!coupon && coupon.balanceCents === coupon.originalCents : g.state === 'awaiting_payment'};
}

function readRecipient(b) {
  const to = {name: text(b?.paraNombre, 80), email: text(b?.paraCorreo, 120).toLowerCase(), phone: text(b?.paraTel, 20).replace(/[^\d+]/g, '')};
  if (!to.name) throw httpError(400, 'gift_recipient_name');
  if (to.email && !EMAIL.test(to.email)) throw httpError(400, 'gift_recipient_email');
  if (to.phone && to.phone.replace(/\D/g, '').length < 10) throw httpError(400, 'gift_recipient_phone');
  if (!to.email && !to.phone) throw httpError(400, 'gift_recipient_contact');
  if (!to.email) delete to.email; if (!to.phone) delete to.phone;
  return to;
}
function readDeliverAt(b, now) {
  if (!b?.entregarEn) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.entregarEn)) throw httpError(400, 'gift_date_invalid');
  const t = Date.parse(b.entregarEn + 'T09:00:00-06:00');
  if (!Number.isFinite(t) || t > now + YEAR) throw httpError(400, 'gift_date_invalid');
  return t <= now ? null : t;
}

async function createGift({db, mp, body, clientKey, webhookUrl, now = Date.now()}) {
  const runtime = (await db.doc('instinto_private/runtime').get()).data() || {};
  const cfg = giftConfig(runtime), config = await readRuntime(db);
  if (!cfg.enabled) throw httpError(503, 'gifts_disabled');
  const rev = body?.soloRevisar === true; // solo calcular el descuento del cupón (sin crear nada)
  const couponCode = body?.cupon ? normCode(body.cupon) : null;
  if (couponCode && !CODE.test(couponCode)) throw httpError(409, 'coupon_invalid');
  await rateLimit(db, (rev ? 'giftcp:' : 'gift:') + clientKey, rev ? 20 : 6, now);
  const requestId = text(body?.requestId, 100);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(requestId)) throw httpError(400, 'invalid_request_id');
  const from = {name: text(body?.deNombre, 80), email: text(body?.deCorreo, 120).toLowerCase()};
  if (!rev && !from.name) throw httpError(400, 'gift_sender_name');
  if (!rev && !EMAIL.test(from.email)) throw httpError(400, 'gift_sender_email');
  const to = rev ? null : readRecipient(body);
  const message = text(body?.mensaje, 300);
  const deliverAt = to?.email ? readDeliverAt(body, now) : null;
  const shippingIncluded = body?.incluirEnvio === true;
  let mode, valueCents, productId = null, productName = null;
  if (body?.abierto === true) {
    mode = 'open'; valueCents = Math.round(Number(body?.monto) * 100);
    if (!Number.isSafeInteger(valueCents) || valueCents < cfg.minCents || valueCents > cfg.maxCents || valueCents % 100) throw httpError(400, 'gift_amount_invalid');
  } else {
    mode = 'chosen'; productId = text(body?.productoId, 80);
    const inv = (await db.doc('instinto/datos').get()).data();
    const p = publicCatalog(inv, config.enabledSizes).find(x => x.id === productId);
    if (!p) throw httpError(409, 'unavailable_product');
    productName = `${p.brand} · ${p.name} · 60 ml`; valueCents = config.prices?.[60] ?? 31000;
  }
  const shippingCreditCents = shippingIncluded ? cfg.shippingCreditCents : 0;
  const couponRef = couponCode ? db.doc('instinto_coupons/' + couponCode) : null;
  const evalCp = c => { try { return evaluateGiftCoupon(c, {productId, valueCents, shippingCreditCents, now}); } catch (e) { throw httpError(409, e.message); } };
  if (rev) {
    if (!couponRef) throw httpError(409, 'coupon_invalid');
    const c = (await couponRef.get()).data(), ev = evalCp(c);
    return {code: couponCode, discount: ev.discountCents / 100, total: ev.chargedCents / 100, value: (valueCents + shippingCreditCents) / 100, type: c.type, amount: c.value, shippingCredit: shippingCreditCents / 100};
  }
  const id = 'g' + sha('instinto-gift:' + requestId).slice(0, 24);
  const ref = db.doc('instinto_web_gifts/' + id);
  let gift = await db.runTransaction(async tx => {
    const ex = (await tx.get(ref)).data();
    if (ex) { if (ex.requestHash !== sha(requestId) || (ex.coupon?.code || null) !== couponCode) throw httpError(409, 'request_reused'); return ex; }
    let coupon = null, chargedCents = valueCents + shippingCreditCents;
    if (couponRef) {
      const c = (await tx.get(couponRef)).data(), ev = evalCp(c);
      coupon = {code: couponCode, discountCents: ev.discountCents, state: 'held', heldAt: now}; chargedCents = ev.chargedCents;
      tx.update(couponRef, {uses: (c.uses || 0) + 1});
    }
    const g = {schemaVersion: 1, id, token: randomBytes(24).toString('hex'), requestHash: sha(requestId), state: 'awaiting_payment', mode,
      productId, productName, valueCents, shippingIncluded, shippingCreditCents, totalCents: valueCents + shippingCreditCents, chargedCents, coupon,
      from, to, message, deliverAt, delivered: null, liveMode: config.liveMode, createdAt: now, expiresAt: now + cfg.holdMs, preference: {state: 'creating'}};
    tx.create(ref, g); return g;
  });
  if (gift.state !== 'awaiting_payment') return {token: gift.token, paid: gift.state === 'paid'};
  if (gift.preference?.state === 'created') return {token: gift.token, initPoint: gift.preference.initPoint};
  let pref;
  try { pref = await mp.createPreference(gift, {webhookUrl, excludedPaymentTypes: config.excludedPaymentTypes, now, gift: true}); }
  catch (e) { await ref.update({'preference.state': 'failed', 'preference.error': e.message}); throw httpError(503, 'payment_provider_retry'); }
  await ref.update({preference: {state: 'created', id: pref.id, initPoint: pref.initPoint, createdAt: now}});
  return {token: gift.token, initPoint: pref.initPoint};
}

function giftPreferencePayload(g, {webhookUrl, excludedPaymentTypes = ['ticket', 'atm']}) {
  const title = g.mode === 'open' ? `Regalo INSTINTO · saldo de $${g.valueCents / 100}` : `Regalo INSTINTO · ${g.productName}`;
  const items = [{id: 'regalo', title: (title + (g.shippingIncluded ? ' + envío' : '')).slice(0, 200), quantity: 1, currency_id: 'MXN', unit_price: charged(g) / 100}];
  return {items, external_reference: g.id, metadata: {instinto_gift: g.id}, payer: {email: g.from.email}, notification_url: webhookUrl,
    back_urls: {success: `${SITE}/regalo.html?t=${g.token}&pago=ok`, failure: `${SITE}/regalo.html?t=${g.token}&pago=error`, pending: `${SITE}/regalo.html?t=${g.token}&pago=pendiente`},
    auto_return: 'approved', expires: true, expiration_date_to: new Date(g.expiresAt).toISOString(),
    payment_methods: {excluded_payment_types: excludedPaymentTypes.map(i => ({id: i})), installments: 1}, binary_mode: true, statement_descriptor: 'INSTINTO'};
}

function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = randomBytes(8);
  let s = ''; for (let i = 0; i < 8; i++) s += A[b[i] % A.length];
  return 'REGALO-' + s.slice(0, 4) + '-' + s.slice(4);
}

// Igual que reconcilePayment, para regalos: SOLO con respuesta fresca de la API de Mercado Pago.
async function reconcileGift(db, payment, {now = Date.now()} = {}) {
  const id = String(payment.id), giftId = payment.external_reference;
  if (!/^\d{1,30}$/.test(id) || !/^g[a-f0-9]{24}$/.test(String(giftId))) throw Error('invalid_payment_reference');
  const runtime = (await db.doc('instinto_private/runtime').get()).data() || {};
  if (!runtime.collectorId || String(payment.collector_id) !== String(runtime.collectorId)) throw Error('collector_mismatch');
  const expectedLive = typeof runtime.paymentLiveMode === 'boolean' ? runtime.paymentLiveMode : runtime.liveMode;
  if (payment.live_mode !== expectedLive) throw Error('payment_environment_mismatch');
  const ref = db.doc('instinto_web_gifts/' + giftId), ledgerRef = db.doc('instinto_payment_ledger/mp_' + id);
  return db.runTransaction(async tx => {
    const g = (await tx.get(ref)).data();
    if (!g || payment.metadata?.instinto_gift !== g.id) throw Error('unknown_purchase');
    if (payment.currency_id !== 'MXN' || Math.round(Number(payment.transaction_amount) * 100) !== charged(g)) throw Error('payment_total_mismatch');
    const record = {giftId, paymentId: id, status: String(payment.status), receivedAt: now};
    if (['refunded', 'charged_back', 'in_mediation'].includes(payment.status)) {
      if (g.state === 'paid') {
        const cRef = db.doc('instinto_coupons/' + g.code), c = (await tx.get(cRef)).data();
        if (c) tx.update(cRef, {active: false, deactivatedReason: 'payment_' + payment.status});
        tx.update(ref, {reviewRequired: true, reviewReason: 'payment_reversal'});
      }
      tx.set(ledgerRef, {...record, disposition: 'gift_reversal'}, {merge: true});
      return {outcome: 'review_required', reason: 'payment_reversal'};
    }
    if (g.state === 'paid') return {outcome: g.paymentId === id ? 'already_applied' : 'review_required', reason: 'second_approved_payment'};
    if (payment.status !== 'approved') { tx.set(ledgerRef, {...record, disposition: 'waiting'}, {merge: true}); return {outcome: 'waiting'}; }
    let code, cRef;
    for (let n = 0; n < 5; n++) { code = newCode(); cRef = db.doc('instinto_coupons/' + code); if (!(await tx.get(cRef)).exists) break; code = null; }
    if (!code) throw Error('code_generation_failed');
    tx.create(cRef, {code, kind: 'gift', giftId, description: `Regalo de ${g.from.name} para ${g.to.name}`, balanceCents: g.totalCents, originalCents: g.totalCents,
      productId: g.productId || null, productName: g.productName || null, shippingIncluded: g.shippingIncluded, active: true,
      expiresAt: now + YEAR, createdAt: now});
    tx.update(ref, {state: 'paid', paidAt: now, paymentId: id, code, ...(g.coupon ? {'coupon.state': 'used'} : {})});
    tx.set(ledgerRef, {...record, disposition: 'gift_paid', code}, {merge: true});
    tx.create(db.doc('instinto_web_outbox/gift_paid_' + giftId), {type: 'gift_paid', giftId, state: 'pending', createdAt: now});
    return {outcome: 'applied', code};
  });
}

async function giftByToken(db, t) {
  if (!/^[a-f0-9]{48}$/.test(String(t))) throw httpError(404, 'not_found');
  const snap = await db.collection('instinto_web_gifts').where('token', '==', t).limit(1).get();
  if (snap.empty) throw httpError(404, 'not_found');
  const g = snap.docs[0].data();
  const a = Buffer.from(g.token), b = Buffer.from(t);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw httpError(404, 'not_found');
  return {g, ref: snap.docs[0].ref};
}
async function viewGift({db, t}) {
  const {g} = await giftByToken(db, t);
  const c = g.code ? (await db.doc('instinto_coupons/' + g.code).get()).data() : null;
  return {regalo: publicGift(g, c)};
}
async function editGift({db, body, clientKey, now = Date.now()}) {
  await rateLimit(db, 'giftedit:' + clientKey, 10, now);
  const {g, ref} = await giftByToken(db, body?.t);
  const c = g.code ? (await db.doc('instinto_coupons/' + g.code).get()).data() : null;
  if (!publicGift(g, c).editable) throw httpError(409, 'gift_already_used');
  const to = readRecipient(body), message = text(body?.mensaje, 300), deliverAt = to.email ? readDeliverAt(body, now) : null;
  const upd = {to, message, deliverAt, updatedAt: now};
  const resend = body?.reenviar === true && g.state === 'paid' && to.email;
  if (resend || (g.delivered && g.delivered.email !== to.email)) upd.delivered = null;
  await ref.update(upd);
  if (resend && !deliverAt) await db.doc(`instinto_web_outbox/gift_deliver_${g.id}_${now}`).create({type: 'gift_deliver', giftId: g.id, state: 'pending', createdAt: now});
  return {ok: true, reenviado: !!resend, regalo: publicGift({...g, ...upd}, c)};
}

// Mantenimiento: concilia regalos sin pago confirmado, vence los abandonados y programa entregas por correo.
async function maintainGifts({db, mp, now = Date.now(), limit = 25}) {
  const out = {checked: 0, applied: 0, expired: 0, deliveries: 0};
  const open = await db.collection('instinto_web_gifts').where('state', '==', 'awaiting_payment').limit(limit).get();
  for (const doc of open.docs) {
    const g = doc.data(); out.checked++;
    const pays = await mp.searchPayments(g.id);
    for (const p of pays) { const r = await reconcileGift(db, await mp.getPayment(p.id), {now}).catch(e => ({outcome: 'error', reason: e.message})); if (r.outcome === 'applied') out.applied++; }
    const after = (await doc.ref.get()).data();
    if (after.state === 'awaiting_payment' && after.expiresAt + 600000 < now && !pays.some(x => ['approved', 'pending', 'in_process', 'authorized'].includes(x.status))) {
      await db.runTransaction(async tx => {
        const g2 = (await tx.get(doc.ref)).data();
        if (g2.state !== 'awaiting_payment') return;
        if (g2.coupon?.state === 'held') {
          const cRef = db.doc('instinto_coupons/' + g2.coupon.code), c = (await tx.get(cRef)).data();
          if (c) tx.update(cRef, {uses: Math.max(0, (c.uses || 0) - 1)});
        }
        tx.update(doc.ref, {state: 'expired', expiredAt: now, ...(g2.coupon?.state === 'held' ? {'coupon.state': 'released'} : {})});
      });
      out.expired++;
    }
  }
  const paid = await db.collection('instinto_web_gifts').where('state', '==', 'paid').where('delivered', '==', null).limit(limit).get();
  for (const doc of paid.docs) {
    const g = doc.data();
    if (!g.to?.email || (g.deliverAt && g.deliverAt > now)) continue;
    const r = db.doc(`instinto_web_outbox/gift_deliver_${g.id}_${g.deliverAt || 0}`);
    await r.create({type: 'gift_deliver', giftId: g.id, state: 'pending', createdAt: now}).then(() => out.deliveries++).catch(() => {});
  }
  return out;
}

module.exports = {giftConfig, createGift, giftPreferencePayload, reconcileGift, viewGift, editGift, maintainGifts, publicGift, newCode};

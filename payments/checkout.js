'use strict';
// INSTINTO V10 — checkout público de la tienda (catálogo, cotización, compra, estado).
// Reglas: precios, existencias, tarifas y totales SIEMPRE del servidor; el navegador solo
// propone cesta y domicilio. La compra se persiste antes de crear la preferencia de pago y
// la reserva descuenta esencia de instinto/datos en la misma transacción, coordinándose con
// los apartados de pedidos Directo/WhatsApp (ver availability.js). La URL de retorno de
// Mercado Pago no confirma nada: solo el webhook/conciliación con la API cambian el estado.
const {createHash, randomBytes, timingSafeEqual} = require('node:crypto');
const {normalizedInput, basketHash, buildPurchase} = require('./purchase');
const {pendingClaims} = require('./availability');
const {checkoutConfig} = require('./config');
const {packCart} = require('./packing');
const {normCode, CODE, evaluateCoupon} = require('./coupons');
const {applyPaidPurchase} = require('./reconcile');

const GRAMS = {60: 30, 100: 50};
const LINES = {dama: 'Dama', caballero: 'Caballero', unisex: 'Unisex'};
const clean = (v, n = 150) => String(v ?? '').trim().slice(0, n);
const sha = v => createHash('sha256').update(v).digest('hex');
function httpError(status, code) { const e = Error(code); e.status = status; return e; }

function publicCatalog(inventory, enabledSizes = [60]) {
  const {available} = pendingClaims(inventory);
  return (Array.isArray(inventory?.cat) ? inventory.cat : []).flatMap(x => {
    const id = clean(x.id, 80), brand = clean(x.disenador), name = clean(x.referencia);
    const gender = LINES[clean(x.linea).toLowerCase()];
    const free = available.get(x.id) ?? 0;
    if (!id || !brand || !name || !gender) return [];
    const availableSizes = enabledSizes.filter(s => free >= GRAMS[s]);
    if (!availableSizes.length) return [];
    // Perfil olfativo opcional, capturado en el catálogo del administrador (solo texto público).
    const profile = {family: clean(x.familia, 80), top: clean(x.notasSalida, 200), heart: clean(x.notasCorazon, 200),
      base: clean(x.notasFondo, 200), intensity: clean(x.intensidad, 20), moment: clean(x.momento, 20)};
    const extra = Object.fromEntries(Object.entries(profile).filter(([, v]) => v));
    return [{id, code: id, brand, name, gender, availableSizes, ...extra}];
  });
}

async function rateLimit(db, key, limit, now) {
  const bucket = Math.floor(now / 60000);
  const ref = db.doc(`instinto_web_ratelimits/${sha(key).slice(0, 32)}_${bucket}`);
  return db.runTransaction(async tx => {
    const n = ((await tx.get(ref)).data()?.n || 0) + 1;
    if (n > limit) throw httpError(429, 'too_many_requests');
    tx.set(ref, {n, expiresAt: new Date((bucket + 2) * 60000)});
  });
}

function destinationOf(address) {
  return {country_code: 'MX', postal_code: address.postal, area_level1: address.state,
    area_level2: address.city, area_level3: address.colony};
}

async function readRuntime(db) {
  return checkoutConfig((await db.doc('instinto_private/runtime').get()).data());
}

async function catalog({db}) {
  const [snap, runtimeSnap] = await Promise.all([db.doc('instinto/datos').get(), db.doc('instinto_private/runtime').get()]);
  if (!snap.exists) throw httpError(503, 'inventory_unavailable');
  const runtime = runtimeSnap.data() || {};
  let sizes = [60], payments = false;
  try { const c = checkoutConfig(runtime); sizes = c.enabledSizes; payments = true; } catch { /* catálogo informativo */ }
  return {products: publicCatalog(snap.data(), sizes), mode: payments ? (runtime.liveMode ? 'live' : 'sandbox') : 'preview',
    checkoutEnabled: payments, enabledSizes: sizes,
    gifts: {enabled: runtime.gifts?.enabled !== false && payments, shippingCredit: (Number.isSafeInteger(runtime.gifts?.shippingCreditCents) ? runtime.gifts.shippingCreditCents : 15000) / 100}, prices: Object.fromEntries(sizes.map(s => [s, (runtime.pricesCents?.[s] ?? ({60: 31000, 100: 49000})[s]) / 100]))};
}

async function quote({db, shipping, body, clientKey, now = Date.now()}) {
  const config = await readRuntime(db);
  await rateLimit(db, 'quote:' + clientKey, 12, now);
  let input;
  try { input = normalizedInput(body); } catch (e) { throw httpError(400, e.message); }
  const inventory = (await db.doc('instinto/datos').get()).data();
  const {available} = pendingClaims(inventory);
  const byId = new Map((inventory?.cat || []).map(x => [x.id, x]));
  const demand = new Map();
  for (const i of input.items) {
    if (!config.enabledSizes.includes(i.size)) throw httpError(400, 'size_not_enabled');
    if (!byId.has(i.id)) throw httpError(409, 'unavailable_product');
    demand.set(i.id, (demand.get(i.id) || 0) + GRAMS[i.size] * i.qty);
    if ((available.get(i.id) ?? 0) < demand.get(i.id)) throw httpError(409, 'insufficient_stock');
  }
  let parcels;
  try {
    const boxes = Object.fromEntries(config.enabledSizes.map(s => [s, config.boxes[s]]));
    parcels = packCart(input.items.map(i => ({sizeMl: i.size, quantity: i.qty})), boxes);
    // Una caja por frasco; peso empacado real por presentación desde configuración verificada.
    let k = 0;
    for (const i of input.items) for (let u = 0; u < i.qty; u++) parcels[k++].weight = config.boxes[i.size].packedWeightKg;
  } catch (e) { throw httpError(503, 'packing_not_configured'); }
  let result;
  try {
    result = await shipping.createQuote(config.origin, destinationOf(input.address), parcels);
    for (let n = 0; n < 6 && result.status === 'pending'; n++) {
      await new Promise(r => setTimeout(r, 1500));
      result = await shipping.getQuote(result.id);
    }
  } catch (e) { throw httpError(e.message === 'invalid_address' ? 400 : 502, e.message === 'invalid_address' ? 'invalid_address' : 'shipping_unavailable'); }
  if (result.status !== 'completed') throw httpError(503, 'shipping_pending');
  let rates = result.rates.filter(r => r.totalCents <= config.maxShippingCents);
  if (config.allowedCarriers) rates = rates.filter(r => config.allowedCarriers.includes(r.carrier.toLowerCase()));
  rates = rates.sort((a, b) => a.totalCents - b.totalCents).slice(0, 6);
  if (!rates.length) throw httpError(409, 'no_shipping_options');
  const doc = {id: result.id, status: 'completed', basketHash: basketHash(input), rates, parcels: parcels.length,
    destinationPostal: input.address.postal, createdAt: now, expiresAt: now + config.quoteTtlMs, liveMode: config.liveMode};
  await db.doc('instinto_web_quotes/' + result.id).set(doc);
  return {quoteId: result.id, expiresAt: new Date(doc.expiresAt).toISOString(),
    options: rates.map(r => ({id: r.id, name: `${r.carrier} · ${r.service}`, amount: r.totalCents / 100,
      eta: r.days != null ? `${r.days} día${r.days === 1 ? '' : 's'} hábil${r.days === 1 ? '' : 'es'}` : ''}))};
}

// Idempotente por requestId (generado en el navegador por intento de compra).
async function checkout({db, mp, body, clientKey, webhookUrl, now = Date.now()}) {
  const config = await readRuntime(db);
  await rateLimit(db, 'checkout:' + clientKey, 6, now);
  const requestId = clean(body?.requestId, 100);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(requestId)) throw httpError(400, 'invalid_request_id');
  const quoteId = clean(body?.quoteId, 100), rateId = clean(body?.rateId, 100);
  let input;
  try { input = normalizedInput(body); } catch (e) { throw httpError(400, e.message); }
  const hash = basketHash(input);
  const couponCode = body?.coupon ? normCode(body.coupon) : null;
  if (couponCode && !CODE.test(couponCode)) throw httpError(409, 'coupon_invalid');
  const id = 'w' + sha('instinto-purchase:' + requestId).slice(0, 24);
  const purchaseRef = db.doc('instinto_web_purchases/' + id), inventoryRef = db.doc('instinto/datos');
  let purchase = await db.runTransaction(async tx => {
    const existing = (await tx.get(purchaseRef)).data();
    if (existing) {
      if (existing.basketHash !== hash || existing.shipping?.rateId !== rateId || (existing.coupon?.code || null) !== couponCode) throw httpError(409, 'request_reused');
      return existing;
    }
    const quoteDoc = (await tx.get(db.doc('instinto_web_quotes/' + quoteId))).data();
    if (!quoteDoc || quoteDoc.liveMode !== config.liveMode) throw httpError(409, 'quote_expired_or_changed');
    const invSnap = await tx.get(inventoryRef), inventory = invSnap.data();
    if (!inventory || !Array.isArray(inventory.cat)) throw httpError(503, 'inventory_unavailable');
    const couponRef = couponCode ? db.doc('instinto_coupons/' + couponCode) : null;
    const couponSnap = couponRef ? await tx.get(couponRef) : null;
    const {available} = pendingClaims(inventory);
    let built;
    try {
      built = buildPurchase({id, binding: randomBytes(24).toString('hex'), input, catalog: inventory.cat, quote: quoteDoc,
        rateId, config, available, now});
    } catch (e) {
      const status = {insufficient_stock: 409, quote_expired_or_changed: 409, invalid_shipping_rate: 409, unavailable_product: 409}[e.message] || 400;
      throw httpError(status, e.message);
    }
    // Cupón / saldo de regalo: se recalcula aquí y se APARTA (saldo o uso) junto con la reserva de esencia.
    if (couponRef) {
      const c = couponSnap.data();
      let ev;
      try { ev = evaluateCoupon(c ? {...c, code: couponCode} : null, {items: built.items, shippingCents: built.shippingCents, now, availableIds: new Set([...available].filter(([, g]) => g >= 30).map(([k]) => k))}); }
      catch (e) { throw httpError(409, e.message); }
      built.discountCents = ev.discountCents; built.totalCents = ev.totalCents;
      built.coupon = {code: couponCode, kind: c.kind, discountCents: ev.discountCents, state: 'held', heldAt: now};
      tx.update(couponRef, c.kind === 'gift' ? {balanceCents: c.balanceCents - ev.discountCents} : {uses: (c.uses || 0) + 1});
    }
    built.expiresAt = Math.min(now + config.holdMs, quoteDoc.expiresAt + config.holdMs);
    built.liveMode = config.liveMode;
    // Reserva coordinada: descontar esencia ahora; se libera solo por conciliación/expiración.
    const grams = {};
    for (const i of built.items) grams[i.id] = (grams[i.id] || 0) + i.gramsPerUnit * i.qty;
    const cat = inventory.cat.map(x => ({...x}));
    for (const [sku, g] of Object.entries(grams)) {
      const entry = cat.find(x => x.id === sku);
      entry.stockGramos = Math.round((Number(entry.stockGramos) - g) * 100) / 100;
    }
    const revision = inventory.syncRevision ?? 0;
    tx.update(inventoryRef, {cat, syncRevision: revision + 1, syncClient: 'v10', lastWriteId: 'hold_' + id,
      updatedAt: new Date(now).toISOString()});
    built.reservation = {state: 'held', grams, heldAt: now};
    built.preference = {state: 'creating', attempts: 0};
    built.requestHash = sha(requestId);
    tx.create(purchaseRef, built);
    return built;
  });
  // Cubierta al 100% con cupón/saldo: se confirma sin pasar por Mercado Pago.
  if (purchase.totalCents === 0 && purchase.state === 'awaiting_payment') {
    const r = await db.runTransaction(async tx => {
      const p = (await tx.get(purchaseRef)).data();
      if (p.state !== 'awaiting_payment') return {state: p.state};
      const out = await applyPaidPurchase(tx, db, {purchase: p, purchaseRef, paymentKey: 'cupon-' + p.coupon.code, now});
      if (out.review) { tx.update(purchaseRef, {reviewRequired: true, reviewReason: out.review}); return {review: out.review}; }
      return {state: 'paid'};
    });
    if (r.review) throw httpError(409, 'coupon_order_review');
    purchase = (await purchaseRef.get()).data();
  }
  if (purchase.state === 'paid' && purchase.totalCents === 0) return {...publicCheckout({...purchase, preference: {initPoint: null}}), paid: true};
  if (purchase.state !== 'awaiting_payment') throw httpError(409, 'purchase_' + purchase.state);
  if (purchase.preference?.state === 'created') return publicCheckout(purchase);
  if (purchase.expiresAt <= now) throw httpError(409, 'purchase_expired');
  // Preferencia fuera de la transacción. Si la respuesta se perdió, se busca antes de recrear.
  let pref = null;
  if (purchase.preference?.state === 'uncertain') {
    try { pref = await mp.findPreference(purchase.id); } catch { throw httpError(503, 'payment_provider_retry'); }
  }
  if (!pref) {
    await purchaseRef.update({'preference.state': 'creating', 'preference.attempts': (purchase.preference?.attempts || 0) + 1});
    try {
      pref = await mp.createPreference(purchase, {webhookUrl, excludedPaymentTypes: config.excludedPaymentTypes, now});
    } catch (e) {
      await purchaseRef.update({'preference.state': e.message === 'mp_request_uncertain' ? 'uncertain' : 'failed',
        'preference.error': e.message});
      throw httpError(503, 'payment_provider_retry');
    }
  }
  await purchaseRef.update({preference: {state: 'created', id: pref.id, initPoint: pref.initPoint, createdAt: now}});
  purchase = {...purchase, preference: {state: 'created', id: pref.id, initPoint: pref.initPoint}};
  return publicCheckout(purchase);
}

function publicCheckout(p) {
  return {purchaseId: p.id, binding: p.binding, initPoint: p.preference.initPoint,
    expiresAt: new Date(p.expiresAt).toISOString(), subtotal: p.subtotalCents / 100, shipping: p.shippingCents / 100,
    total: p.totalCents / 100, discount: (p.discountCents || 0) / 100, currency: 'MXN'};
}

// Vista previa del descuento en el carrito (sin apartar nada). El cobro real lo recalcula checkout().
async function couponCheck({db, body, clientKey, now = Date.now()}) {
  const config = await readRuntime(db);
  await rateLimit(db, 'coupon:' + clientKey, 20, now);
  const code = normCode(body?.coupon);
  if (!CODE.test(code)) throw httpError(409, 'coupon_invalid');
  const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 8).map(i => ({id: clean(i?.id, 80), size: Number(i?.size), qty: Math.min(5, Math.max(1, Number(i?.qty) || 1))}))
    .filter(i => config.enabledSizes.includes(i.size)).map(i => ({...i, unitPriceCents: config.prices?.[i.size] ?? ({60: 31000, 100: 49000})[i.size]}));
  if (!items.length) throw httpError(400, 'invalid_cart');
  const shippingCents = Math.max(0, Math.min(500000, Math.round(Number(body?.shipping || 0) * 100)));
  const [c, inv] = await Promise.all([db.doc('instinto_coupons/' + code).get(), db.doc('instinto/datos').get()]);
  const {available} = pendingClaims(inv.data());
  let ev;
  try { ev = evaluateCoupon(c.exists ? c.data() : null, {items, shippingCents, now, availableIds: new Set([...available].filter(([, g]) => g >= 30).map(([k]) => k))}); }
  catch (e) { const er = httpError(409, e.message); if (e.message === 'coupon_product_required') er.detail = c.data().productId; throw er; }
  const d = c.data();
  return {code, kind: d.kind, discount: ev.discountCents / 100, total: ev.totalCents / 100, productId: d.productId || null,
    balance: d.kind === 'gift' ? d.balanceCents / 100 : null, type: d.kind === 'gift' ? null : d.type, amount: d.kind === 'gift' ? null : d.value};
}

async function status({db, purchaseId, binding}) {
  if (!/^w[a-f0-9]{24}$/.test(String(purchaseId)) || typeof binding !== 'string' || binding.length !== 48) throw httpError(404, 'not_found');
  const p = (await db.doc('instinto_web_purchases/' + purchaseId).get()).data();
  const a = Buffer.from(String(p?.binding || '').padEnd(48)), b = Buffer.from(binding.padEnd(48));
  if (!p || a.length !== b.length || !timingSafeEqual(a, b)) throw httpError(404, 'not_found');
  const labels = {awaiting_payment: 'Esperando confirmación de pago', paid: 'Pago confirmado', expired: 'Reserva vencida sin pago confirmado',
    cancelled: 'Pedido cancelado', refunded: 'Pago reembolsado'};
  return {purchaseId: p.id, state: p.state, label: labels[p.state] || p.state, reviewRequired: p.reviewRequired === true,
    total: p.totalCents / 100, currency: 'MXN', items: p.items.map(i => ({name: i.name, brand: i.brand, size: i.size, qty: i.qty})),
    shipment: p.shipment?.state === 'label_ready' ? {carrier: p.shipment.carrier, trackingNumber: p.shipment.trackingNumber,
      trackingStatus: p.shipment.trackingStatus || null} : (p.state === 'paid' ? {pending: true} : null)};
}

module.exports = {publicCatalog, catalog, quote, checkout, status, couponCheck, rateLimit, httpError, readRuntime};

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
    return [{id, code: id, brand, name, gender, availableSizes}];
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
    checkoutEnabled: payments, enabledSizes: sizes, prices: Object.fromEntries(sizes.map(s => [s, (runtime.pricesCents?.[s] ?? ({60: 31000, 100: 49000})[s]) / 100]))};
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
  const id = 'w' + sha('instinto-purchase:' + requestId).slice(0, 24);
  const purchaseRef = db.doc('instinto_web_purchases/' + id), inventoryRef = db.doc('instinto/datos');
  let purchase = await db.runTransaction(async tx => {
    const existing = (await tx.get(purchaseRef)).data();
    if (existing) {
      if (existing.basketHash !== hash || existing.shipping?.rateId !== rateId) throw httpError(409, 'request_reused');
      return existing;
    }
    const quoteDoc = (await tx.get(db.doc('instinto_web_quotes/' + quoteId))).data();
    if (!quoteDoc || quoteDoc.liveMode !== config.liveMode) throw httpError(409, 'quote_expired_or_changed');
    const invSnap = await tx.get(inventoryRef), inventory = invSnap.data();
    if (!inventory || !Array.isArray(inventory.cat)) throw httpError(503, 'inventory_unavailable');
    const {available} = pendingClaims(inventory);
    let built;
    try {
      built = buildPurchase({id, binding: randomBytes(24).toString('hex'), input, catalog: inventory.cat, quote: quoteDoc,
        rateId, config, available, now});
    } catch (e) {
      const status = {insufficient_stock: 409, quote_expired_or_changed: 409, invalid_shipping_rate: 409, unavailable_product: 409}[e.message] || 400;
      throw httpError(status, e.message);
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
    total: p.totalCents / 100, currency: 'MXN'};
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

module.exports = {publicCatalog, catalog, quote, checkout, status, rateLimit, httpError};

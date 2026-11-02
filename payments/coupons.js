'use strict';
// INSTINTO V10.5 — cupones y saldo de regalos. Cálculo puro (sin E/S): el servidor siempre recalcula.
// Colección instinto_coupons/{CODIGO}:
//   kind 'admin': {type:'percent'|'amount', value, productId|null, usesMax|null, uses, expiresAt|null, active}
//                 percent/amount aplica SOLO a perfumes (nunca al envío).
//   kind 'gift' : {balanceCents, originalCents, productId|null, expiresAt, active, giftId}
//                 el saldo cubre perfumes y envío; si el perfume del regalo sigue disponible, el carrito debe incluirlo.
const CODE = /^[A-Z0-9-]{4,24}$/;
const MIN_CHARGE_CENTS = 1000; // Mercado Pago no cobra montos muy pequeños: o se cubre todo o quedan al menos $10.
const normCode = v => String(v ?? '').trim().toUpperCase().replace(/\s+/g, '');
function fail(code) { const e = Error(code); e.status = 409; return e; }

// items: [{id, unitPriceCents, qty}]; availableIds: Set de ids con existencia (para regalos de perfume elegido).
function evaluateCoupon(c, {items, shippingCents = 0, now = Date.now(), availableIds = null}) {
  if (!c || c.active !== true) throw fail('coupon_invalid');
  if (c.expiresAt && c.expiresAt < now) throw fail('coupon_expired');
  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.qty, 0);
  let discount;
  if (c.kind === 'gift') {
    if (!(c.balanceCents > 0)) throw fail('coupon_used');
    if (c.productId && (!availableIds || availableIds.has(c.productId)) && !items.some(i => i.id === c.productId)) throw fail('coupon_product_required');
    discount = Math.min(c.balanceCents, subtotal + shippingCents);
  } else {
    if (c.usesMax != null && (c.uses || 0) >= c.usesMax) throw fail('coupon_used');
    const eligible = c.productId ? items.filter(i => i.id === c.productId).reduce((s, i) => s + i.unitPriceCents * i.qty, 0) : subtotal;
    if (!eligible) throw fail('coupon_not_applicable');
    discount = c.type === 'percent' ? Math.floor(eligible * Math.min(100, Number(c.value)) / 100) : Math.min(Math.round(Number(c.value) * 100), eligible);
  }
  const total = subtotal + shippingCents;
  if (total - discount > 0 && total - discount < MIN_CHARGE_CENTS) discount = Math.max(0, total - MIN_CHARGE_CENTS);
  if (!(discount > 0)) throw fail('coupon_not_applicable');
  return {discountCents: discount, totalCents: total - discount};
}

function validateAdminCoupon(b) {
  const code = normCode(b?.code);
  if (!CODE.test(code)) throw fail('coupon_code_invalid');
  const type = b.type === 'percent' ? 'percent' : b.type === 'amount' ? 'amount' : null;
  const value = Number(b.value);
  if (!type || !Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100) || (type === 'amount' && value > 100000)) throw fail('coupon_value_invalid');
  const usesMax = b.usesMax === '' || b.usesMax == null ? null : Number(b.usesMax);
  if (usesMax !== null && (!Number.isSafeInteger(usesMax) || usesMax < 1 || usesMax > 100000)) throw fail('coupon_uses_invalid');
  let expiresAt = null;
  if (b.expires) { if (!/^\d{4}-\d{2}-\d{2}$/.test(b.expires)) throw fail('coupon_date_invalid'); expiresAt = Date.parse(b.expires + 'T23:59:59-06:00'); }
  const productId = b.productId ? String(b.productId).slice(0, 80) : null;
  return {code, kind: 'admin', description: String(b.description || '').trim().slice(0, 120), type, value: Math.round(value * 100) / 100,
    productId, usesMax, expiresAt, active: b.active !== false};
}

module.exports = {CODE, MIN_CHARGE_CENTS, normCode, evaluateCoupon, validateAdminCoupon};

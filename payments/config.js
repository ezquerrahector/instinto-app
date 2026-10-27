'use strict';
// Configuración privada en instinto_private/runtime. Solo el servidor la lee (reglas: deny all).
// Nada aquí se acepta desde el navegador. Cualquier valor ausente o no verificado mantiene
// apagada la parte correspondiente del flujo; nunca se rellenan huecos con supuestos.
const SIZES = [60, 100];
const LINES = ['Dama', 'Caballero', 'Unisex'];
const ID = /^[A-Za-z0-9_-]{1,80}$/;
function fail(reason) { const e = Error('config_invalid'); e.reason = reason; throw e; }
function num(v, min, max) { return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max; }

function checkoutConfig(raw) {
  const c = raw || {};
  if (c.checkoutEnabled !== true) { const e = Error('checkout_disabled'); throw e; }
  if (c.compatibleWritesValidated !== true) fail('compatible_writes_not_validated');
  if (typeof c.liveMode !== 'boolean') fail('live_mode');
  if (!c.collectorId) fail('collector_id');
  const enabledSizes = Array.isArray(c.enabledSizes) ? c.enabledSizes.filter(s => SIZES.includes(s)) : [];
  if (!enabledSizes.length) fail('enabled_sizes');
  const prices = {}, recipes = {}, packaging = {}, boxes = {};
  for (const size of enabledSizes) {
    const price = c.pricesCents?.[size];
    if (!Number.isSafeInteger(price) || price < 1000 || price > 1000000) fail('price_' + size);
    prices[size] = price;
    const r = c.recipes?.[size];
    if (!r || r.verified !== true || !num(r.essence, 1, 500)) fail('recipe_' + size);
    for (const k of ['feromonas', 'fijador', 'perfumol']) if (!num(r[k], 0, 500)) fail('recipe_' + size + '_' + k);
    recipes[size] = {essence: r.essence, feromonas: r.feromonas, fijador: r.fijador, perfumol: r.perfumol};
    packaging[size] = {};
    for (const line of LINES) {
      const p = c.packaging?.[size]?.[line];
      if (!p || p.verified !== true || !ID.test(p.bottle) || !ID.test(p.atomizer) || (p.label != null && !ID.test(p.label))) fail('packaging_' + size + '_' + line);
      packaging[size][line] = {verified: true, bottle: p.bottle, atomizer: p.atomizer, label: p.label ?? null};
    }
    const b = c.boxes?.[size];
    if (!b || b.verified !== true) fail('box_' + size);
    for (const k of ['length', 'width', 'height']) if (!Number.isSafeInteger(b[k]) || b[k] < 1 || b[k] > 200) fail('box_' + size + '_' + k);
    if (!num(b.packedWeightKg, 0.01, 70)) fail('box_' + size + '_weight');
    boxes[size] = {verified: true, length: b.length, width: b.width, height: b.height, packedWeightKg: b.packedWeightKg};
  }
  const o = c.origin || {};
  if (!/^\d{5}$/.test(o.postal_code || '') || !o.area_level1 || !o.area_level2 || !o.area_level3) fail('origin');
  return {
    liveMode: c.liveMode, collectorId: String(c.collectorId), enabledSizes, prices, recipes, packaging, boxes,
    origin: {country_code: 'MX', postal_code: o.postal_code, area_level1: o.area_level1, area_level2: o.area_level2,
      area_level3: o.area_level3, ...(o.address_template_id ? {address_template_id: o.address_template_id} : {})},
    quoteTtlMs: Number.isSafeInteger(c.quoteTtlMs) ? Math.min(Math.max(c.quoteTtlMs, 5 * 60000), 6 * 3600000) : 30 * 60000,
    holdMs: Number.isSafeInteger(c.holdMs) ? Math.min(Math.max(c.holdMs, 10 * 60000), 60 * 60000) : 20 * 60000,
    maxShippingCents: Number.isSafeInteger(c.maxShippingCents) ? c.maxShippingCents : 60000,
    allowedCarriers: Array.isArray(c.allowedCarriers) ? c.allowedCarriers.map(String) : null,
    excludedPaymentTypes: Array.isArray(c.excludedPaymentTypes) ? c.excludedPaymentTypes.map(String) : ['ticket', 'atm'],
  };
}
function shippingLabelConfig(raw) {
  const s = raw?.shippingLabels || {};
  if (s.enabled !== true) { throw Error('labels_disabled'); }
  if (!/^\d{8}$/.test(s.consignmentNote || '')) fail('consignment_note');
  if (!/^[A-Z0-9]{2,4}$/.test(s.packageType || '')) fail('package_type');
  if (!s.originTemplateId || !ID.test(String(s.originTemplateId).replace(/-/g, '_'))) fail('origin_template');
  return {consignmentNote: s.consignmentNote, packageType: s.packageType, originTemplateId: s.originTemplateId,
    printingFormat: s.printingFormat === 'thermal' ? 'thermal' : 'standard',
    maxCostDifferenceCents: Number.isSafeInteger(s.maxCostDifferenceCents) ? s.maxCostDifferenceCents : 0};
}
module.exports = {checkoutConfig, shippingLabelConfig, SIZES, LINES};

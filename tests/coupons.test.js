'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {evaluateCoupon, validateAdminCoupon, normCode} = require('../payments/coupons');
const items = [{id: 'A', unitPriceCents: 31000, qty: 1}, {id: 'B', unitPriceCents: 31000, qty: 1}];
test('gift balance covers perfumes and shipping, never more than the balance', () => {
  const g = {kind: 'gift', active: true, balanceCents: 46000, expiresAt: Date.now() + 1e9};
  assert.deepEqual(evaluateCoupon(g, {items: items.slice(0, 1), shippingCents: 5125}), {discountCents: 36125, totalCents: 0});
  assert.deepEqual(evaluateCoupon(g, {items, shippingCents: 5125}), {discountCents: 46000, totalCents: 21125});
});
test('chosen-perfume gift requires that perfume while it is available, otherwise works as balance', () => {
  const g = {kind: 'gift', active: true, balanceCents: 31000, productId: 'B'};
  assert.throws(() => evaluateCoupon(g, {items: items.slice(0, 1), availableIds: new Set(['A', 'B'])}), {message: 'coupon_product_required'});
  assert.equal(evaluateCoupon(g, {items: items.slice(0, 1), availableIds: new Set(['A'])}).discountCents, 31000);
});
test('admin coupons: percent/amount only on perfumes, product restriction, uses, expiry', () => {
  assert.equal(evaluateCoupon({kind: 'admin', active: true, type: 'percent', value: 10}, {items, shippingCents: 5125}).discountCents, 6200);
  assert.equal(evaluateCoupon({kind: 'admin', active: true, type: 'amount', value: 50, productId: 'B'}, {items}).discountCents, 5000);
  assert.throws(() => evaluateCoupon({kind: 'admin', active: true, type: 'percent', value: 10, productId: 'Z'}, {items}), {message: 'coupon_not_applicable'});
  assert.throws(() => evaluateCoupon({kind: 'admin', active: true, type: 'percent', value: 10, usesMax: 2, uses: 2}, {items}), {message: 'coupon_used'});
  assert.throws(() => evaluateCoupon({kind: 'admin', active: true, type: 'percent', value: 10, expiresAt: 1}, {items}), {message: 'coupon_expired'});
  assert.throws(() => evaluateCoupon({kind: 'admin', active: false, type: 'percent', value: 10}, {items}), {message: 'coupon_invalid'});
});
test('never leaves a charge below the Mercado Pago minimum', () => {
  const r = evaluateCoupon({kind: 'gift', active: true, balanceCents: 35800}, {items: items.slice(0, 1), shippingCents: 5125});
  assert.equal(r.totalCents, 3000);
});
test('admin coupon validation and code normalization', () => {
  assert.equal(normCode(' bienvenida 10 '), 'BIENVENIDA10');
  assert.equal(validateAdminCoupon({code: 'bienvenida10', type: 'percent', value: 10, expires: '2026-12-31'}).code, 'BIENVENIDA10');
  assert.throws(() => validateAdminCoupon({code: 'X', type: 'percent', value: 10}), {message: 'coupon_code_invalid'});
  assert.throws(() => validateAdminCoupon({code: 'ABCD', type: 'percent', value: 120}), {message: 'coupon_value_invalid'});
});

const {evaluateGiftCoupon} = require('../payments/coupons');
test('gift purchase: store coupon discounts the perfume value only, keeps $30 minimum', () => {
  const base = {active: true, kind: 'admin', type: 'percent', value: 80, uses: 0};
  assert.deepEqual(evaluateGiftCoupon(base, {productId: 'P1', valueCents: 31000, shippingCreditCents: 15000}), {discountCents: 24800, chargedCents: 21200});
  assert.deepEqual(evaluateGiftCoupon({...base, value: 100}, {valueCents: 31000}), {discountCents: 28000, chargedCents: 3000});
  assert.throws(() => evaluateGiftCoupon({...base, productId: 'P2'}, {productId: 'P1', valueCents: 31000}), /coupon_not_applicable/);
  assert.throws(() => evaluateGiftCoupon({...base, productId: 'P2'}, {valueCents: 31000}), /coupon_not_applicable/);
  assert.throws(() => evaluateGiftCoupon({active: true, kind: 'gift', balanceCents: 31000}, {valueCents: 31000}), /coupon_gift_on_gift/);
});

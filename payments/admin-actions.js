'use strict';
// INSTINTO V10 — acciones administrativas sobre ventas Web (solo colaboradores autorizados).
// Identidad: SIEMPRE del token verificado con revocación. Cada acción con efecto externo
// (guía, reembolso) es idempotente por operationId y queda auditada en instinto_admin_operations.
const {shippingLabelConfig, checkoutConfig} = require('./config');
const {packCart} = require('./packing');
const {alert} = require('./maintenance');

const ALLOWED = new Set(['ezquerrahector@gmail.com', 'osmararobles@hotmail.com']);
const OP = /^[A-Za-z0-9_-]{16,100}$/;
const PID = /^w[a-f0-9]{24}$/;
function err(status, code, extra) { const e = Error(code); e.status = status; Object.assign(e, extra || {}); return e; }
function actorOf(identity) {
  const email = String(identity?.email || '').toLowerCase();
  if (identity?.email_verified !== true || !ALLOWED.has(email)) throw err(403, 'forbidden');
  return email;
}

async function audit(db, operationId, data) {
  const ref = db.doc('instinto_admin_operations/' + operationId);
  return db.runTransaction(async tx => {
    const prev = (await tx.get(ref)).data();
    if (prev) {
      if (prev.action !== data.action || prev.purchaseId !== data.purchaseId || prev.actor !== data.actor) throw err(409, 'operation_reused');
      return prev;
    }
    tx.create(ref, data); return null;
  });
}

async function overview({db, identity}) {
  actorOf(identity);
  const [purchases, alerts] = await Promise.all([
    db.collection('instinto_web_purchases').orderBy('createdAt', 'desc').limit(60).get(),
    db.collection('instinto_alerts').where('state', '==', 'open').limit(100).get()]);
  return {
    purchases: purchases.docs.map(d => {
      const p = d.data();
      return {id: p.id, state: p.state, liveMode: p.liveMode === true, createdAt: p.createdAt, paidAt: p.paidAt || null,
        totalCents: p.totalCents, shippingCents: p.shippingCents, paymentId: p.paymentId || null, adminOrderIds: p.adminOrderIds || [],
        reviewRequired: p.reviewRequired === true, reviewReason: p.reviewReason || null,
        items: p.items.map(i => ({id: i.id, name: i.name, brand: i.brand, size: i.size, qty: i.qty, gift: i.gift, giftText: i.giftText})),
        address: p.address, shippingChoice: p.shipping, reservation: p.reservation?.state || null,
        shipment: p.shipment || null, refund: p.refund || null};
    }),
    alerts: alerts.docs.map(d => d.data()).sort((a, b) => b.lastAt - a.lastAt)};
}

function partyTo(address) {
  const name = `${address.firstName} ${address.lastName}`.trim();
  // La colonia ya viaja en la cotización (area_level3); varias paqueterías limitan street1 a ~45 caracteres.
  // Límites de Skydropx observados en producción 27/10/2026: reference ≤ 40 caracteres.
  // El texto completo de referencias viaja en further_information.
  const full = [address.references, 'Col. ' + address.colony].filter(Boolean).join(' · ');
  return {street1: String(address.street).slice(0, 45), name: name.slice(0, 40), company: name.slice(0, 40), phone: String(address.phone).replace(/\D/g, '').slice(-10),
    email: address.email, reference: full.slice(0, 40), furtherInformation: full.slice(0, 200)};
}

async function createLabel({db, shipping, identity, body, now = Date.now()}) {
  const actor = actorOf(identity);
  const {purchaseId, operationId, acceptCostDifference} = body || {};
  if (!PID.test(String(purchaseId)) || !OP.test(String(operationId))) throw err(400, 'invalid_request');
  const runtime = (await db.doc('instinto_private/runtime').get()).data();
  let labels, config;
  try { labels = shippingLabelConfig(runtime); config = checkoutConfig(runtime); } catch (e) { throw err(503, e.message === 'labels_disabled' ? 'labels_disabled' : 'labels_not_configured'); }
  const ref = db.doc('instinto_web_purchases/' + purchaseId);
  const claim = await db.runTransaction(async tx => {
    const p = (await tx.get(ref)).data();
    if (!p) throw err(404, 'not_found');
    if (p.state !== 'paid' || p.reviewRequired === true) throw err(409, 'purchase_not_shippable');
    if (p.shipment?.state === 'label_ready') return {done: p.shipment};
    // Un intento "creating" sin id de envío por más de 10 min no llegó a crear guía (la creación es
    // síncrona dentro de la misma petición); se permite reintentar. "processing"/"uncertain" nunca.
    const staleCreating = p.shipment?.state === 'creating' && !p.shipment.id && now - (p.shipment.startedAt || 0) > 10 * 60000;
    if (p.shipment && p.shipment.operationId !== operationId && !staleCreating && ['creating', 'processing', 'uncertain'].includes(p.shipment.state))
      throw err(409, 'shipment_in_progress');
    if (p.shipment?.state === 'uncertain') throw err(409, 'shipment_uncertain_check_provider');
    tx.update(ref, {shipment: {...(p.shipment || {}), state: p.shipment?.id ? 'processing' : 'creating', operationId, actor, startedAt: p.shipment?.startedAt || now}});
    return {purchase: p};
  });
  if (claim.done) return {outcome: 'already_ready', shipment: claim.done};
  const p = claim.purchase;
  await audit(db, operationId, {action: 'create_label', purchaseId, actor, createdAt: now}).catch(e => { if (e.message === 'operation_reused') throw e; });
  let shipmentId = p.shipment?.id;
  try {
    if (!shipmentId) {
      // Las tarifas de Skydropx valen 24 h; si venció se recotiza el mismo transportista/servicio.
      let rateId = p.shipping.rateId, costCents = p.shippingCents;
      const quoteDoc = (await db.doc('instinto_web_quotes/' + p.shipping.quotationId).get()).data();
      if (!quoteDoc || now - quoteDoc.createdAt > 23 * 3600000) {
        const parcels = packCart(p.items.map(i => ({sizeMl: i.size, quantity: i.qty})), config.boxes);
        let k = 0; for (const i of p.items) for (let u = 0; u < i.qty; u++) parcels[k++].weight = config.boxes[i.size].packedWeightKg;
        let q = await shipping.createQuote(config.origin, {country_code: 'MX', postal_code: p.address.postal, area_level1: p.address.state,
          area_level2: p.address.city, area_level3: p.address.colony}, parcels);
        for (let n = 0; n < 6 && q.status === 'pending'; n++) { await new Promise(r => setTimeout(r, 1500)); q = await shipping.getQuote(q.id); }
        const same = q.rates.find(r => r.carrier === p.shipping.carrier && r.service === p.shipping.service);
        if (!same) throw err(409, 'original_service_unavailable');
        rateId = same.id; costCents = same.totalCents;
      }
      const diff = costCents - p.shippingCents;
      if (diff > labels.maxCostDifferenceCents && acceptCostDifference !== true) {
        await ref.update({'shipment.state': 'failed', 'shipment.error': 'cost_difference'});
        throw err(409, 'cost_difference', {paidCents: p.shippingCents, currentCents: costCents});
      }
      const from = await shipping.addressTemplate(labels.originTemplateId);
      const packages = Array.from({length: p.items.reduce((n, i) => n + i.qty, 0)}, () => ({consignmentNote: labels.consignmentNote, packageType: labels.packageType}));
      const created = await shipping.createShipment({rateId, originTemplateId: labels.originTemplateId, from, to: partyTo(p.address),
        packages, printingFormat: labels.printingFormat});
      shipmentId = created.id;
      await ref.update({'shipment.id': shipmentId, 'shipment.state': 'processing', 'shipment.rateId': rateId, 'shipment.quotedCents': costCents});
    }
    let s;
    for (let n = 0; n < 8; n++) {
      s = await shipping.getShipment(shipmentId);
      if (s.packages.length && s.packages.every(x => x.labelUrl && x.trackingNumber)) break;
      if (['error', 'cancelled', 'canceled'].includes(s.workflowStatus)) break;
      await new Promise(r => setTimeout(r, 2000));
    }
    if (s.packages.length && s.packages.every(x => x.labelUrl && x.trackingNumber)) {
      const shipment = {state: 'label_ready', id: shipmentId, operationId, actor, carrier: s.carrier, costCents: s.totalCents,
        trackingNumber: s.masterTrackingNumber || s.packages[0].trackingNumber, packages: s.packages, readyAt: now};
      await ref.update({shipment});
      return {outcome: 'label_ready', shipment};
    }
    if (['error', 'cancelled', 'canceled'].includes(s.workflowStatus)) {
      await ref.update({'shipment.state': 'failed', 'shipment.error': s.errorMessage || s.workflowStatus});
      await alert(db, 'label_' + purchaseId, {type: 'label_failed', purchaseId, reason: s.errorMessage || s.workflowStatus}, now);
      throw err(502, 'label_failed', {detail: s.errorMessage});
    }
    return {outcome: 'processing', shipmentId};
  } catch (e) {
    if (e.message === 'shipment_request_uncertain') {
      await ref.update({'shipment.state': 'uncertain'});
      await alert(db, 'label_' + purchaseId, {type: 'label_uncertain', purchaseId, reason: 'Revisar en Skydropx si se generó la guía antes de reintentar.'}, now);
      throw err(503, 'shipment_uncertain_check_provider');
    }
    // Cualquier fallo determinista deja el envío en "failed" con el motivo del proveedor y permite reintentar.
    if (e.message !== 'cost_difference') await ref.update({'shipment.state': shipmentId ? 'processing' : 'failed', 'shipment.error': e.message,
      'shipment.providerStatus': e.status || null, 'shipment.providerDetail': e.detail || null, 'shipment.failedAt': now});
    if (!shipmentId) await alert(db, 'label_' + purchaseId, {type: 'label_failed', purchaseId, reason: (e.detail || e.message).slice(0, 300)}, now);
    if (e.message === 'shipping_provider_error') throw err(502, 'label_provider_rejected', {detail: e.detail || null});
    if (!e.status) throw err(502, e.message);
    throw e;
  }
}

async function cancelLabel({db, shipping, identity, body, now = Date.now()}) {
  const actor = actorOf(identity);
  const {purchaseId, operationId, reason} = body || {};
  if (!PID.test(String(purchaseId)) || !OP.test(String(operationId))) throw err(400, 'invalid_request');
  const ref = db.doc('instinto_web_purchases/' + purchaseId);
  const p = (await ref.get()).data();
  if (!p?.shipment?.id || !['label_ready', 'processing'].includes(p.shipment.state)) throw err(409, 'no_active_label');
  await audit(db, operationId, {action: 'cancel_label', purchaseId, actor, createdAt: now, reason: String(reason || '').slice(0, 200)});
  const r = await shipping.cancelShipment(p.shipment.id, reason);
  await ref.update({shipment: {...p.shipment, state: 'cancel_requested', cancel: {...r, actor, at: now}}, shipmentHistory: [...(p.shipmentHistory || []), p.shipment]});
  return {outcome: 'cancel_requested', provider: r};
}

// Cancelación / devolución autorizada. Distingue explícitamente:
//  - dinero: refund 'full' | 'none' (reembolso real vía Mercado Pago con idempotencia);
//  - esencia: restockEssence solo para frascos aún NO elaborados (esencia sin usar);
//  - materiales: nunca se reponen aquí (un frasco elaborado no regresa envase/atomizador).
// Un contracargo/mediación no se resuelve aquí: queda en revisión hasta su resolución.
async function cancelPurchase({db, mp, identity, body, now = Date.now()}) {
  const actor = actorOf(identity);
  const {purchaseId, operationId, refund, restockEssence, reason} = body || {};
  if (!PID.test(String(purchaseId)) || !OP.test(String(operationId)) || !['full', 'none'].includes(refund) || typeof restockEssence !== 'boolean')
    throw err(400, 'invalid_request');
  const why = String(reason || '').trim().slice(0, 300);
  if (why.length < 5) throw err(400, 'reason_required');
  const ref = db.doc('instinto_web_purchases/' + purchaseId), invRef = db.doc('instinto/datos');
  const prev = await audit(db, operationId, {action: 'cancel_purchase', purchaseId, actor, refund, restockEssence, reason: why, createdAt: now});
  // 1) Dinero primero (idempotente por operationId en Mercado Pago).
  let p = (await ref.get()).data();
  if (!p || !['paid', 'cancelled'].includes(p.state)) throw err(409, 'purchase_not_cancellable');
  if (p.shipment?.state === 'label_ready' && p.shipment.trackingStatus && p.shipment.trackingStatus !== 'created')
    throw err(409, 'already_in_transit_handle_return');
  let refundResult = p.refund || null;
  if (refund === 'full' && !refundResult) {
    try { refundResult = await mp.refund(p.paymentId, {idempotencyKey: 'refund_' + operationId}); }
    catch (e) { await alert(db, 'refund_' + purchaseId, {type: 'refund_failed', purchaseId, reason: e.message}, now); throw err(502, 'refund_failed'); }
    // Persistir de inmediato: si la transacción siguiente falla, el reintento no reembolsa dos veces.
    await ref.update({refund: {...refundResult, actor, at: now, operationId}});
  }
  // 2) Inventario y pedidos administrativos en una transacción.
  return db.runTransaction(async tx => {
    p = (await tx.get(ref)).data();
    const inv = (await tx.get(invRef)).data();
    if (p.state === 'cancelled') return {outcome: 'already_cancelled', refund: p.refund || refundResult};
    const peds = inv.peds.map(x => ({...x})), cat = inv.cat.map(x => ({...x}));
    const mine = peds.filter(x => x.folioWeb === purchaseId);
    if (mine.length !== (p.adminOrderIds || []).length) throw err(409, 'admin_orders_mismatch');
    const restocked = {};
    for (const o of mine) {
      const unused = ['Pedido', 'Comprado proveedor'].includes(o.estatus) && o.matDescontado !== true;
      if (restockEssence && unused && o.esenciaDescontada === true) {
        const entry = cat.find(x => x.id === o.codigo);
        if (!entry) throw err(409, 'catalog_missing');
        entry.stockGramos = Math.round((Number(entry.stockGramos) + o.gramosEsencia) * 100) / 100;
        restocked[o.codigo] = (restocked[o.codigo] || 0) + o.gramosEsencia;
        o.esenciaDescontada = false; o.esenciaRepuesta = true;
      }
      o.estatusAnterior = o.estatus; o.estatus = 'Cancelado';
      o.notas = `${o.notas ? o.notas + ' · ' : ''}Cancelado Web (${actor}): ${why}${refund === 'full' ? ' · Reembolsado' : ''}`.slice(0, 500);
    }
    tx.update(invRef, {peds, cat, syncRevision: (inv.syncRevision ?? 0) + 1, syncClient: 'v10', lastWriteId: 'cancel_' + operationId,
      updatedAt: new Date(now).toISOString()});
    tx.update(ref, {state: 'cancelled', cancelledAt: now, cancel: {actor, reason: why, refund, restockEssence, restocked, operationId},
      ...(refundResult ? {refund: refundResult} : {})});
    return {outcome: 'cancelled', restocked, refund: refundResult};
  });
}

async function resolveAlert({db, identity, body, now = Date.now()}) {
  const actor = actorOf(identity);
  const key = String(body?.key || '');
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(key)) throw err(400, 'invalid_request');
  const ref = db.doc('instinto_alerts/' + key);
  if (!(await ref.get()).exists) throw err(404, 'not_found');
  await ref.update({state: 'resolved', resolvedBy: actor, resolvedAt: now, note: String(body?.note || '').slice(0, 300)});
  return {outcome: 'resolved'};
}

module.exports = {overview, createLabel, cancelLabel, cancelPurchase, resolveAlert, actorOf};

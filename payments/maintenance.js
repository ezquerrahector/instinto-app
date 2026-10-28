'use strict';
// INSTINTO V10 — tareas programadas idempotentes (cada 5 min).
// 1) Conciliación de compras abiertas contra la API de Mercado Pago (recupera webhooks perdidos).
// 2) Liberación de reservas vencidas SOLO si la API confirma que no hay pago aprobado ni en curso.
// 3) Consumidor del outbox con arrendamiento, reintentos limitados y alerta al agotar intentos.
// 4) Actualización de rastreo de guías emitidas.
// 5) Verificación de integridad: pedidos Web en instinto/datos contra la compra autoritativa.
const {reconcilePayment} = require('./reconcile');
const {sendPurchaseEmail} = require('./email');

const GRACE_MS = 10 * 60000;
const MAX_ATTEMPTS = 6;

async function alert(db, key, data, now = Date.now()) {
  // Un documento por clave: repetir una alerta no la duplica; se actualiza el contador.
  const ref = db.doc('instinto_alerts/' + key.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120));
  await db.runTransaction(async tx => {
    const prev = (await tx.get(ref)).data();
    tx.set(ref, {...data, key, state: prev?.state === 'resolved' ? 'open' : (prev?.state || 'open'),
      count: (prev?.count || 0) + 1, firstAt: prev?.firstAt || now, lastAt: now});
  });
}

async function reconcileOpenPurchases({db, mp, now = Date.now(), limit = 25}) {
  const out = {checked: 0, applied: 0, released: 0, waiting: 0, errors: 0};
  const snap = await db.collection('instinto_web_purchases').where('state', '==', 'awaiting_payment').limit(limit).get();
  for (const doc of snap.docs) {
    const p = doc.data(); out.checked++;
    try {
      const payments = await mp.searchPayments(p.id);
      for (const pay of payments) {
        // Fuente: respuesta fresca de la API, nunca el cuerpo del webhook ni la URL de retorno.
        const fresh = await mp.getPayment(pay.id);
        const r = await reconcilePayment(db, fresh, {now}).catch(e => ({outcome: 'error', reason: e.message}));
        if (r.outcome === 'applied') out.applied++;
        if (r.outcome === 'error' || r.outcome === 'review_required') await alert(db, 'payment_' + pay.id,
          {type: 'payment_review', purchaseId: p.id, paymentId: String(pay.id), reason: r.reason || r.outcome}, now);
      }
      const after = (await doc.ref.get()).data();
      if (after.state !== 'awaiting_payment') continue;
      const inFlight = payments.some(x => ['approved', 'pending', 'in_process', 'authorized'].includes(x.status));
      if (inFlight) { out.waiting++; if (now - p.createdAt > 48 * 3600000) await alert(db, 'stuck_' + p.id, {type: 'payment_in_flight_48h', purchaseId: p.id}, now); continue; }
      if (p.expiresAt + GRACE_MS > now) continue;
      if (await releaseReservation(db, p.id, now)) out.released++;
    } catch (e) {
      out.errors++;
      await alert(db, 'reconcile_' + p.id, {type: 'reconcile_error', purchaseId: p.id, reason: e.message}, now);
    }
  }
  return out;
}

async function releaseReservation(db, purchaseId, now = Date.now()) {
  const purchaseRef = db.doc('instinto_web_purchases/' + purchaseId), inventoryRef = db.doc('instinto/datos');
  return db.runTransaction(async tx => {
    const p = (await tx.get(purchaseRef)).data();
    if (!p || p.state !== 'awaiting_payment' || p.reservation?.state !== 'held') return false;
    const inv = (await tx.get(inventoryRef)).data();
    const cat = inv.cat.map(x => ({...x}));
    for (const [sku, g] of Object.entries(p.reservation.grams || {})) {
      const entry = cat.find(x => x.id === sku);
      if (!entry) { tx.update(purchaseRef, {reviewRequired: true, reviewReason: 'release_missing_product'}); return false; }
      entry.stockGramos = Math.round((Number(entry.stockGramos) + g) * 100) / 100;
    }
    tx.update(inventoryRef, {cat, syncRevision: (inv.syncRevision ?? 0) + 1, syncClient: 'v10', lastWriteId: 'release_' + purchaseId,
      updatedAt: new Date(now).toISOString()});
    tx.update(purchaseRef, {state: 'expired', expiredAt: now, reservation: {...p.reservation, state: 'released', releasedAt: now}});
    return true;
  });
}

async function processOutbox({db, handlers, now = Date.now(), limit = 20}) {
  const out = {done: 0, retried: 0, failed: 0};
  const snap = await db.collection('instinto_web_outbox').where('state', 'in', ['pending', 'retry']).limit(limit).get();
  for (const doc of snap.docs) {
    const leased = await db.runTransaction(async tx => {
      const t = (await tx.get(doc.ref)).data();
      if (!t || !['pending', 'retry'].includes(t.state) || (t.nextAttemptAt || 0) > now) return null;
      tx.update(doc.ref, {state: 'processing', leaseUntil: now + 120000, attempts: (t.attempts || 0) + 1});
      return {...t, attempts: (t.attempts || 0) + 1};
    });
    if (!leased) continue;
    try {
      const handler = handlers[leased.type];
      if (!handler) throw Error('no_handler');
      await handler(leased, {db, now, mailerFactory: handlers.mailerFactory});
      await doc.ref.update({state: 'done', doneAt: now}); out.done++;
    } catch (e) {
      if (leased.attempts >= MAX_ATTEMPTS) {
        await doc.ref.update({state: 'failed', lastError: e.message}); out.failed++;
        await alert(db, 'outbox_' + doc.id, {type: 'outbox_failed', task: doc.id, reason: e.message}, now);
      } else {
        await doc.ref.update({state: 'retry', lastError: e.message, nextAttemptAt: now + Math.min(2 ** leased.attempts, 60) * 60000}); out.retried++;
      }
    }
  }
  // Tareas con arrendamiento vencido (caída a mitad de proceso) vuelven a la cola.
  const stale = await db.collection('instinto_web_outbox').where('state', '==', 'processing').limit(limit).get();
  for (const doc of stale.docs) if ((doc.data().leaseUntil || 0) < now) await doc.ref.update({state: 'retry', nextAttemptAt: now});
  return out;
}

// Aviso operativo de compra pagada: queda visible en el panel de pedidos en línea.
async function purchasePaidHandler(task, {db, now, mailerFactory}) {
  const p = (await db.doc('instinto_web_purchases/' + task.purchaseId).get()).data();
  if (!p || p.state !== 'paid') throw Error('purchase_not_paid');
  // create(): un reintento o reencolado no reabre una alerta ya atendida.
  await db.doc('instinto_alerts/paid_' + p.id).create({type: 'new_paid_order', purchaseId: p.id, adminOrderIds: p.adminOrderIds, key: 'paid_' + p.id,
    totalCents: p.totalCents, units: p.items.reduce((n, i) => n + i.qty, 0), state: 'open', firstAt: now, lastAt: now, count: 1}).catch(e => { if (e.code !== 6 && !/already exists/i.test(e.message)) throw e; });
  // Correo "pedido confirmado" al cliente (si está habilitado). Un fallo de envío reintenta la tarea.
  if (mailerFactory) await sendPurchaseEmail({db, mailerFactory, kind: 'paid', purchaseId: p.id, now});
}
async function labelReadyHandler(task, {db, now, mailerFactory}) {
  if (mailerFactory) await sendPurchaseEmail({db, mailerFactory, kind: 'shipped', purchaseId: task.purchaseId, now});
}

async function refreshTracking({db, shipping, now = Date.now(), limit = 20}) {
  const snap = await db.collection('instinto_web_purchases').where('shipment.state', '==', 'label_ready').limit(limit).get();
  let updated = 0;
  for (const doc of snap.docs) {
    const s = doc.data().shipment;
    if (s.trackingStatus === 'delivered' || (s.trackingCheckedAt || 0) > now - 3 * 3600000) continue;
    try {
      const t = await shipping.tracking(s.trackingNumber, s.carrier);
      await doc.ref.update({'shipment.trackingStatus': t.status || s.trackingStatus || null, 'shipment.trackingDetail': t.description || '',
        'shipment.trackingCheckedAt': now});
      if (['exception', 'in_return', 'retained', 'destroyed', 'delivery_attempt'].includes(t.status))
        await alert(db, 'tracking_' + doc.id, {type: 'shipping_exception', purchaseId: doc.id, status: t.status, detail: t.description}, now);
      updated++;
    } catch { /* siguiente ciclo */ }
  }
  return {updated};
}

// Integridad: cada compra pagada debe tener exactamente sus pedidos Web en instinto/datos,
// con fragancia, presentación y banderas intactas. Detecta borrados/ediciones manuales.
async function verifyIntegrity({db, now = Date.now()}) {
  const inv = (await db.doc('instinto/datos').get()).data();
  const peds = Array.isArray(inv?.peds) ? inv.peds : [];
  const snap = await db.collection('instinto_web_purchases').where('state', '==', 'paid').get();
  const issues = [];
  for (const doc of snap.docs) {
    const p = doc.data();
    for (const [n, adminId] of (p.adminOrderIds || []).entries()) {
      const o = peds.find(x => x.id === adminId);
      if (!o) { issues.push({purchaseId: p.id, adminId, issue: 'missing'}); continue; }
      if (o.folioWeb !== p.id || o.pagoId !== p.paymentId || o.esenciaDescontada !== true || o.pagoConfirmadoServidor !== true || o.canal !== 'Web')
        issues.push({purchaseId: p.id, adminId, issue: 'tampered', n});
    }
  }
  const cancelled = await db.collection('instinto_web_purchases').where('state', '==', 'cancelled').get();
  const known = new Set([...snap.docs, ...cancelled.docs].map(d => d.id));
  const orphan = peds.filter(o => o.origenWeb === true && !known.has(o.folioWeb));
  for (const o of orphan) issues.push({purchaseId: o.folioWeb, adminId: o.id, issue: 'orphan_web_order'});
  for (const i of issues) await alert(db, `integrity_${i.purchaseId}_${i.adminId}`, {type: 'web_order_integrity', ...i}, now);
  return {checked: snap.size, issues: issues.length};
}

module.exports = {alert, reconcileOpenPurchases, releaseReservation, processOutbox, purchasePaidHandler, labelReadyHandler, refreshTracking, verifyIntegrity};

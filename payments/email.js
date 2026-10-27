'use strict';
// INSTINTO V10 — correos transaccionales al cliente (pedido confirmado, pedido enviado).
// Se envían desde el outbox (reintentos limitados) y solo si runtime.emails.enabled === true y existe el
// secreto INSTINTO_SMTP = {"host","port","user","pass","from"} (buzón del dominio en Webempresa).
// Idempotencia: cada correo marca purchase.emails.<tipo>SentAt; un reintento no reenvía uno ya enviado.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const money = c => (Number(c || 0) / 100).toLocaleString('es-MX', {style: 'currency', currency: 'MXN'});
const folio = p => p.id.slice(1, 9).toUpperCase();

function layout(title, bodyHtml) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif;color:#12120f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#fffcf7;border:1px solid #e5dfd5" cellpadding="0" cellspacing="0">
<tr><td style="padding:26px 28px;border-bottom:1px solid #e5dfd5;text-align:center">
<div style="font-family:Cinzel,Georgia,serif;letter-spacing:.24em;font-size:20px">INSTINTO</div>
<div style="font-size:9px;letter-spacing:.36em;color:#7e776c;padding-top:6px">FRAGANCIAS</div></td></tr>
<tr><td style="padding:26px 28px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 14px">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e5dfd5;font-size:12px;color:#756f64;text-align:center">
<em>No todo se ve, algunas cosas se sienten.</em><br>instintofragancias.com</td></tr></table></td></tr></table></body></html>`;
}
function itemsTable(p) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0">${p.items.map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.qty} × ${esc(i.brand)} · ${esc(i.name)} · ${i.size} ml${i.gift ? `<br><span style="color:#756f64;font-size:12px">Regalo: ${esc(i.giftText || 'sin dedicatoria')}</span>` : ''}</td>
     <td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${money(i.unitPriceCents * i.qty)}</td></tr>`).join('')}
    <tr><td style="padding:8px 0">Envío (${esc(p.shipping?.carrier || '')} ${esc(p.shipping?.service || '')})</td><td align="right">${money(p.shippingCents)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold">Total pagado</td><td align="right" style="font-weight:bold">${money(p.totalCents)}</td></tr></table>`;
}
function paidEmail(p) {
  const a = p.address;
  const html = layout(`Gracias, ${a.firstName}. Tu pedido está confirmado`,
    `<p style="font-size:14px;line-height:1.6">Mercado Pago confirmó tu pago. Folio <strong>${folio(p)}</strong>. Elaboraremos tu fragancia y te enviaremos otro correo con tu número de rastreo cuando salga.</p>
    ${itemsTable(p)}
    <p style="font-size:13px;line-height:1.6;color:#4a463f"><strong>Entrega:</strong> ${esc(a.street)}, ${esc(a.colony)}, ${esc(a.city)}, ${esc(a.state)}, CP ${esc(a.postal)}</p>
    <p style="font-size:12px;color:#756f64">¿Dudas? Responde a este correo citando tu folio.</p>`);
  return {to: a.email, subject: `INSTINTO · Pedido ${folio(p)} confirmado`, html,
    text: `Gracias, ${a.firstName}. Tu pedido ${folio(p)} está confirmado. Total ${money(p.totalCents)}. Te enviaremos el rastreo cuando salga.`};
}
function shippedEmail(p) {
  const s = p.shipment, a = p.address;
  const url = s.packages?.find(x => x.trackingUrl)?.trackingUrl || '';
  const html = layout('Tu pedido va en camino',
    `<p style="font-size:14px;line-height:1.6">Tu pedido <strong>${folio(p)}</strong> ya tiene guía de envío.</p>
    <p style="font-size:15px;line-height:1.8">Paquetería: <strong>${esc(s.carrier)}</strong><br>Número de rastreo: <strong>${esc(s.trackingNumber)}</strong></p>
    ${url ? `<p><a href="${esc(url)}" style="display:inline-block;background:#12120f;color:#fff;padding:12px 18px;text-decoration:none;font-size:13px;letter-spacing:.08em">RASTREAR MI ENVÍO</a></p>` : ''}
    <p style="font-size:13px;color:#4a463f">Destino: ${esc(a.city)}, ${esc(a.state)}, CP ${esc(a.postal)}</p>`);
  return {to: a.email, subject: `INSTINTO · Pedido ${folio(p)} enviado · rastreo ${s.trackingNumber}`, html,
    text: `Tu pedido ${folio(p)} va en camino. ${s.carrier} · rastreo ${s.trackingNumber}${url ? ' · ' + url : ''}`};
}

function createMailer({smtp, transportFactory}) {
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass || !smtp.from) throw Error('smtp_not_configured');
  const transport = (transportFactory || (o => require('nodemailer').createTransport(o)))({
    host: smtp.host, port: Number(smtp.port) || 465, secure: (Number(smtp.port) || 465) === 465, auth: {user: smtp.user, pass: smtp.pass}});
  return {async send(msg, {bcc} = {}) {
    const info = await transport.sendMail({from: smtp.from, replyTo: smtp.replyTo || smtp.from, ...(bcc ? {bcc} : {}), ...msg});
    return {messageId: String(info.messageId || '')};
  }};
}

// kind: 'paid' | 'shipped'. Devuelve 'sent' | 'already_sent' | 'disabled'.
async function sendPurchaseEmail({db, mailerFactory, kind, purchaseId, now = Date.now()}) {
  const runtime = (await db.doc('instinto_private/runtime').get()).data() || {};
  if (runtime.emails?.enabled !== true) return 'disabled';
  const ref = db.doc('instinto_web_purchases/' + purchaseId);
  const p = (await ref.get()).data();
  if (!p) throw Error('purchase_not_found');
  if (p.emails?.[kind + 'SentAt']) return 'already_sent';
  if (kind === 'paid' && p.state !== 'paid') throw Error('purchase_not_paid');
  if (kind === 'shipped' && p.shipment?.state !== 'label_ready') throw Error('label_not_ready');
  const msg = kind === 'paid' ? paidEmail(p) : shippedEmail(p);
  const info = await mailerFactory().send(msg, {bcc: runtime.emails.copyTo || undefined});
  await ref.update({['emails.' + kind + 'SentAt']: now, ['emails.' + kind + 'MessageId']: info.messageId});
  return 'sent';
}
module.exports = {paidEmail, shippedEmail, createMailer, sendPurchaseEmail};

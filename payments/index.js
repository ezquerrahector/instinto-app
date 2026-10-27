'use strict';
// INSTINTO: receptor de webhooks de pago, producción, SOLO REGISTRO.
// No modifica instinto/datos, inventario, pedidos ni materiales.
const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const token = defineSecret('INSTINTO_MP_ACCESS_TOKEN');
const signingKey = defineSecret('INSTINTO_MP_WEBHOOK_SECRET');
const REGION = 'us-central1';
const {validSignature} = require('./signature');
const scalar = s => typeof s === 'string' ? s : '';
exports.mpWebhook = onRequest({region:REGION, timeoutSeconds:45, memory:'256MiB', maxInstances:3,
  secrets:[token,signingKey], invoker:'public'}, async (req,res)=>{
  if(req.method !== 'POST') return res.status(405).send('method_not_allowed');
  try {
    if(!validSignature(req,signingKey.value())) return res.status(401).send('invalid_signature');
    const type = scalar(req.body?.type) || scalar(req.query.type) || scalar(req.query.topic);
    if(type !== 'payment') return res.status(200).send('ignored');
    const id = String(req.body?.data?.id || req.query['data.id'] || req.query.id || '');
    if(!/^\d{1,30}$/.test(id)) return res.status(400).send('invalid_payment_id');
    const answer = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers:{Authorization:`Bearer ${token.value()}`}, signal:AbortSignal.timeout(10000)});
    if (!answer.ok) {
      console.error('mp_payment_lookup_failed',answer.status);
      return res.status(503).send('retry');
    }
    const payment = await answer.json();
    if(String(payment.id)!==id) return res.status(503).send('payment_mismatch');
    // Esta colección es un buzón de auditoría, NO una orden administrativa.
    // No tratar el pago como pedido confirmado hasta cotejarlo con una compra iniciada por nuestra API.
    const record = {
      provider:'mercadopago', paymentId:id,
      status:String(payment.status||'unknown'),
      transactionAmount:Number(payment.transaction_amount||0),
      currency:String(payment.currency_id||''),
      externalReference:String(payment.external_reference||'').slice(0,150),
      liveMode:payment.live_mode === true,
      integrationState:'awaiting_order_reconciliation',
      lastReceivedAt:admin.firestore.FieldValue.serverTimestamp()
    };
    await admin.firestore().collection('instinto_mp_webhook_inbox').doc('payment_'+id).set(record,{merge:true});
    return res.status(200).send('received');
  } catch(e) { console.error('mp_webhook_error',e?.message||'error'); return res.status(503).send('retry'); }
});

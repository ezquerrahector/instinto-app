'use strict';
const {preferencePayload}=require('./purchase');
// Transport only. The caller must durably store purchase/binding before creating
// a preference. An ambiguous POST is queued for reconciliation, never retried blind.
function createMercadoPagoClient({accessToken,fetchImpl=fetch}) {
  async function request(path,options={}) {
    let response;
    try {response=await fetchImpl('https://api.mercadopago.com'+path,{...options,redirect:'error',
      headers:{Authorization:'Bearer '+await accessToken(),'Content-Type':'application/json',
        ...(options.idempotencyKey?{'X-Idempotency-Key':options.idempotencyKey}:{})},signal:AbortSignal.timeout(10000)});}
    catch {throw Error('mp_request_uncertain');}
    if(!response.ok){const error=Error('mp_request_failed');error.status=response.status;throw error;}
    try{return await response.json();}catch{throw Error('mp_response_invalid');}
  }
  return {
    async createPreference(purchase,config) {
      const result=await request('/checkout/preferences',{method:'POST',idempotencyKey:'pref_'+purchase.id,body:JSON.stringify(preferencePayload(purchase,config))});
      if(typeof result.id!=='string'||!result.id||result.external_reference!==purchase.id)throw Error('mp_preference_mismatch');
      let url;try{url=new URL(result.init_point);}catch{throw Error('mp_checkout_url_invalid');}
      if(url.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(url.hostname)||url.username||url.password)throw Error('mp_checkout_url_invalid');
      return {id:result.id,initPoint:url.href};
    },
    // Recuperación: localizar una preferencia creada cuya respuesta se perdió.
    async findPreference(purchaseId) {
      if(!/^[A-Za-z0-9_-]{1,100}$/.test(purchaseId))throw Error('invalid_purchase_id');
      const out=await request('/checkout/preferences/search?external_reference='+encodeURIComponent(purchaseId));
      const hit=(Array.isArray(out.elements)?out.elements:[]).find(p=>p.external_reference===purchaseId);
      if(!hit)return null;
      const full=await request('/checkout/preferences/'+encodeURIComponent(hit.id));
      let url;try{url=new URL(full.init_point);}catch{throw Error('mp_checkout_url_invalid');}
      if(url.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(url.hostname))throw Error('mp_checkout_url_invalid');
      return {id:full.id,initPoint:url.href};
    },
    // Conciliación periódica: pagos de una compra aunque no haya llegado el webhook.
    async searchPayments(purchaseId) {
      if(!/^[A-Za-z0-9_-]{1,100}$/.test(purchaseId))throw Error('invalid_purchase_id');
      const out=await request('/v1/payments/search?sort=date_created&criteria=desc&limit=20&external_reference='+encodeURIComponent(purchaseId));
      return (Array.isArray(out.results)?out.results:[]).filter(p=>p.external_reference===purchaseId);
    },
    // Reembolso REAL de dinero: solo desde acción administrativa autenticada con clave de idempotencia.
    async refund(paymentId,{amountCents=null,idempotencyKey}) {
      if(!/^\d{1,30}$/.test(String(paymentId)))throw Error('invalid_payment_id');
      if(typeof idempotencyKey!=='string'||!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey))throw Error('invalid_idempotency_key');
      const body=amountCents==null?{}:{amount:amountCents/100};
      const out=await request('/v1/payments/'+paymentId+'/refunds',{method:'POST',idempotencyKey,body:JSON.stringify(body)});
      return {id:String(out.id),status:String(out.status||''),amount:Number(out.amount)};
    },
    async getPayment(id) {
      if(!/^\d{1,30}$/.test(String(id)))throw Error('invalid_payment_id');
      const payment=await request('/v1/payments/'+id);
      if(String(payment.id)!==String(id))throw Error('mp_payment_mismatch');
      return payment;
    }
  };
}
module.exports={createMercadoPagoClient};

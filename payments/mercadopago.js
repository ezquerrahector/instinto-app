'use strict';
const {preferencePayload}=require('./purchase');
// Transport only. The caller must durably store purchase/binding before creating
// a preference. An ambiguous POST is queued for reconciliation, never retried blind.
function createMercadoPagoClient({accessToken,fetchImpl=fetch}) {
  async function request(path,options={}) {
    let response;
    try {response=await fetchImpl('https://api.mercadopago.com'+path,{...options,redirect:'error',
      headers:{Authorization:'Bearer '+await accessToken(),'Content-Type':'application/json'},signal:AbortSignal.timeout(10000)});}
    catch {throw Error('mp_request_uncertain');}
    if(!response.ok){const error=Error('mp_request_failed');error.status=response.status;throw error;}
    try{return await response.json();}catch{throw Error('mp_response_invalid');}
  }
  return {
    async createPreference(purchase,config) {
      const result=await request('/checkout/preferences',{method:'POST',body:JSON.stringify(preferencePayload(purchase,config))});
      if(typeof result.id!=='string'||!result.id||result.external_reference!==purchase.id)throw Error('mp_preference_mismatch');
      let url;try{url=new URL(result.init_point);}catch{throw Error('mp_checkout_url_invalid');}
      if(url.protocol!=='https:'||!['www.mercadopago.com.mx','www.mercadopago.com'].includes(url.hostname)||url.username||url.password)throw Error('mp_checkout_url_invalid');
      return {id:result.id,initPoint:url.href};
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

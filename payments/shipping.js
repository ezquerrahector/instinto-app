'use strict';
// Server-only adapter. No public endpoint and no label purchases/recollections.
// Contract: https://app.skydropx.com/es-MX/api-docs.json (2026-10-27).
const BASE='https://api-pro.skydropx.com';
const ID=/^[a-zA-Z0-9_-]{1,100}$/;
function address(value) {
  if(!value || value.country_code!=='MX' || !/^\d{5}$/.test(value.postal_code))throw Error('invalid_address');
  const out={country_code:'MX',postal_code:value.postal_code};
  for(const key of ['area_level1','area_level2','area_level3']) {
    if(typeof value[key]!=='string' || !value[key].trim() || value[key].length>120)throw Error('invalid_address');
    out[key]=value[key].trim();
  }
  if(value.address_template_id) {
    if(!ID.test(value.address_template_id))throw Error('invalid_template');
    out.address_template_id=value.address_template_id;
  }
  return out; // No phone, street, email or tax ID needed for this quote contract.
}
function quotePayload(origin,destination,parcels) {
  if(!Array.isArray(parcels)||parcels.length<1||parcels.length>12)throw Error('invalid_parcels');
  return {quotation:{address_from:address(origin),address_to:address(destination),parcels:parcels.map(p=>{
    if(!p)throw Error('invalid_parcel');
    for(const k of ['length','width','height'])if(!Number.isSafeInteger(p[k])||p[k]<1||p[k]>200)throw Error('invalid_parcel');
    if(typeof p.weight!=='number'||!Number.isFinite(p.weight)||p.weight<1||p.weight>70)throw Error('invalid_parcel');
    return {length:p.length,width:p.width,height:p.height,weight:p.weight,package_protected:false};
  })}};
}
function cents(value) {
  if(typeof value!=='string'&&typeof value!=='number')return null;
  const match=String(value).match(/^(\d{1,7})(?:\.(\d{1,2}))?$/);
  if(!match)return null;
  const n=Number(match[1])*100+Number((match[2]||'').padEnd(2,'0'));
  return n>0?n:null;
}
function normalizeQuote(data,expectedId) {
  if(!data||typeof data.id!=='string'||!ID.test(data.id)||
     (expectedId&&data.id!==expectedId)||typeof data.is_completed!=='boolean')throw Error('invalid_provider_response');
  if(!data.is_completed)return {id:data.id,status:'pending',rates:[]};
  if(!Array.isArray(data.rates))throw Error('invalid_provider_response');
  const seen=new Set();
  const rates=data.rates.filter(r=>r && r.success===true && r.currency_code==='MXN' &&
    ['approved','coverage_checked','price_found_internal','price_found_external'].includes(r.status) &&
    r.requires_origin_verification!==true && typeof r.id==='string' && ID.test(r.id) &&
    typeof r.provider_display_name==='string' && typeof r.provider_service_name==='string' &&
    cents(r.total)!==null).flatMap(r=>{
      if(seen.has(r.id))return [];seen.add(r.id);
      return [{id:r.id,carrier:r.provider_display_name.slice(0,100),service:r.provider_service_name.slice(0,150),
        currency:'MXN',totalCents:cents(r.total),days:Number.isSafeInteger(r.days)&&r.days>=0?r.days:null,
        pickupAvailable:r.pickup===true,pickupAutomatic:r.pickup_automatic===true,
        minimumPickupPackages:Number.isSafeInteger(r.pickup_package_min)&&r.pickup_package_min>0?r.pickup_package_min:null}];
    });
  return {id:data.id,status:'completed',rates};
}
function createShippingClient({credentials,fetchImpl=fetch,now=Date.now}) {
  let cached=null,refresh=null;
  async function request(path,options) {
    let response;
    try {response=await fetchImpl(BASE+path,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});}
    catch {throw Error('shipping_network_error');}
    if(!response.ok) {
      const e=Error('shipping_provider_error');e.status=response.status;throw e;
    }
    try {return await response.json();}catch {throw Error('invalid_provider_response');}
  }
  async function accessToken() {
    if(cached&&cached.until>now())return cached.value;
    if(refresh)return refresh;
    refresh=(async()=>{
      const c=await credentials();
      if(!c||typeof c.client_id!=='string'||!c.client_id||typeof c.client_secret!=='string'||!c.client_secret)throw Error('shipping_not_configured');
      const result=await request('/api/v1/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({grant_type:'client_credentials',client_id:c.client_id,client_secret:c.client_secret,scope:'default'}).toString()});
      if(typeof result.access_token!=='string'||!result.access_token||!Number.isFinite(result.expires_in)||result.expires_in<=0)throw Error('invalid_provider_response');
      cached={value:result.access_token,until:now()+Math.max(0,result.expires_in-60)*1000};
      return cached.value;
    })();
    try{return await refresh;}finally{refresh=null;}
  }
  async function authorized(path,options) {
    const token=await accessToken();
    try{return await request(path,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}});}
    catch(e){if(e.status===401)cached=null;throw e;} // Do not blindly replay a timed-out POST.
  }
  return {
    async createQuote(origin,destination,serverParcels) {
      const payload=quotePayload(origin,destination,serverParcels);
      return normalizeQuote(await authorized('/api/v1/quotations',{method:'POST',body:JSON.stringify(payload)}));
    },
    async getQuote(id) {
      if(typeof id!=='string'||!ID.test(id))throw Error('invalid_quotation_id');
      return normalizeQuote(await authorized('/api/v1/quotations/'+encodeURIComponent(id),{method:'GET'}),id);
    }
  };
}
module.exports={quotePayload,normalizeQuote,createShippingClient};

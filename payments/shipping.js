'use strict';
// Server-only adapter. Quotes are public through checkoutApi; label purchase, pickups and
// cancellations are only reachable from authenticated, idempotent admin actions.
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
    if(typeof p.weight!=='number'||!Number.isFinite(p.weight)||p.weight<=0||p.weight>70)throw Error('invalid_parcel');
    // Documented v1 quotation contract requires >= 1 kg. Preserve actual weight
    // in the packing result; apply this minimum only to the provider request.
    return {length:p.length,width:p.width,height:p.height,weight:Math.max(1,p.weight),package_protected:false};
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
      const e=Error('shipping_provider_error');e.status=response.status;
      // Mensaje de validación del proveedor (sin credenciales): necesario para atender excepciones.
      try{e.detail=(await response.text()).replace(/\s+/g,' ').slice(0,600);}catch{}
      throw e;
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
  const text=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
  function shipmentView(body) {
    const d=body?.data,a=d?.attributes;
    if(!d||typeof d.id!=='string'||!ID.test(d.id))throw Error('invalid_provider_response');
    const pkgs=(Array.isArray(body.included)?body.included:[]).filter(x=>x?.type==='package').map(x=>({
      id:String(x.id),trackingNumber:text(x.attributes?.tracking_number,80)||null,labelUrl:text(x.attributes?.label_url,600)||null,
      trackingStatus:text(x.attributes?.tracking_status,60)||null,trackingUrl:text(x.attributes?.tracking_url_provider,600)||null}));
    return {id:d.id,workflowStatus:text(a?.workflow_status,60),paymentStatus:text(a?.payment_status,60),
      carrier:text(a?.carrier_name,60),masterTrackingNumber:text(a?.master_tracking_number,80)||null,
      totalCents:cents(a?.total),errorCode:text(a?.error_code,80)||null,errorMessage:text(a?.error_message,300)||null,packages:pkgs};
  }
  return {
    async addressTemplate(id) {
      if(typeof id!=='string'||!/^[A-Za-z0-9-]{1,80}$/.test(id))throw Error('invalid_template');
      const out=await authorized('/api/v1/address_templates/'+encodeURIComponent(id),{method:'GET'});
      const a=out?.data?.address;if(!a)throw Error('invalid_provider_response');
      return {name:text(a.name),company:text(a.company)||text(a.name),street1:text(a.street1,200),phone:text(a.phone,30),
        email:text(a.email),reference:text(a.reference,200)||'Sin referencia',postal_code:text(a.postal_code,5)};
    },
    // Compra una guía REAL (cargo a créditos Skydropx). Solo se invoca desde una acción
    // administrativa autenticada e idempotente; nunca automáticamente sin interruptor privado.
    async createShipment({rateId,originTemplateId,from,to,packages,printingFormat='standard'}) {
      if(typeof rateId!=='string'||!ID.test(rateId))throw Error('invalid_rate');
      if(!Array.isArray(packages)||!packages.length||packages.length>12)throw Error('invalid_parcels');
      const party=(x,ref)=>({street1:text(x.street1,200),name:text(x.name),company:text(x.company)||text(x.name),
        phone:text(x.phone,30),email:text(x.email),reference:text(x.reference,200)||ref});
      const body={shipment:{rate_id:rateId,printing_format:printingFormat,
        address_from:{address_template_id:originTemplateId,...party(from,'Origen INSTINTO')},
        address_to:party(to,'Sin referencia'),
        packages:packages.map((p,i)=>({package_number:String(i+1),consignment_note:p.consignmentNote,package_type:p.packageType,
          package_protected:false}))}};
      for(const side of ['address_from','address_to'])for(const k of ['street1','name','phone','email'])
        if(!body.shipment[side][k])throw Error('shipment_address_incomplete');
      let out;
      try{out=await authorized('/api/v1/shipments',{method:'POST',body:JSON.stringify(body)});}
      catch(e){if(e.message==='shipping_network_error')throw Error('shipment_request_uncertain');throw e;}
      return shipmentView(out);
    },
    async getShipment(id) {
      if(typeof id!=='string'||!ID.test(id))throw Error('invalid_shipment_id');
      return shipmentView(await authorized('/api/v1/shipments/'+encodeURIComponent(id),{method:'GET'}));
    },
    async cancelShipment(id,reason) {
      if(typeof id!=='string'||!ID.test(id))throw Error('invalid_shipment_id');
      const out=await authorized('/api/v1/shipments/'+encodeURIComponent(id)+'/cancellations',{method:'POST',
        body:JSON.stringify({reason:text(reason,200)||'Cancelación solicitada por INSTINTO',shipment_id:id})});
      return {status:text(out?.status,60),success:out?.success===true};
    },
    async tracking(trackingNumber,carrier) {
      if(!/^[A-Za-z0-9-]{4,60}$/.test(String(trackingNumber))||!/^[a-z0-9_-]{2,40}$/i.test(String(carrier)))throw Error('invalid_tracking');
      const out=await authorized('/api/v1/shipments/tracking?tracking_number='+encodeURIComponent(trackingNumber)+'&carrier_name='+encodeURIComponent(carrier),{method:'GET'});
      const a=out?.data?.attributes||{};
      return {status:text(a.status,60),description:text(a.description,300),location:text(a.location,120),date:text(a.date,40)};
    },
    async schedulePickup({shipmentIds,packages,totalWeightKg,from,to}) {
      const out=await authorized('/api/v2/pickups',{method:'POST',body:JSON.stringify({pickup:{shipment_ids:shipmentIds,
        packages,total_weight:String(totalWeightKg),scheduled_from:from,scheduled_to:to}})});
      const a=out?.data?.attributes||{};
      return {id:text(out?.data?.id,80),status:text(a.status,60),requestNumber:text(a.request_number,80),errorReason:text(a.error_reason,300)};
    },
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
module.exports={quotePayload,normalizeQuote,createShippingClient,cents};

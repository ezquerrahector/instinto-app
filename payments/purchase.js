'use strict';
const {createHash}=require('node:crypto');
const {requirements}=require('./materials');
const PRICES=Object.freeze({60:31000,100:49000});
const GRAMS=Object.freeze({60:30,100:50});
const KEY=/^[A-Za-z0-9_-]{1,100}$/;
const text=(v,max=150)=>typeof v==='string'?v.trim().slice(0,max):'';
function normalizedInput(input) {
  if(!Array.isArray(input?.items)||input.items.length<1||input.items.length>8)throw Error('invalid_cart');
  const seen=new Set();let count=0;
  const items=input.items.map(i=>{
    if(!i||!KEY.test(i.id)||typeof i.id!=='string'||![60,100].includes(i.size)||!Number.isSafeInteger(i.qty)||i.qty<1||i.qty>5)throw Error('invalid_cart');
    const key=i.id+'_'+i.size;if(seen.has(key))throw Error('duplicate_item');seen.add(key);count+=i.qty;
    return {id:i.id,size:i.size,qty:i.qty,gift:i.gift===true,giftText:i.gift===true?text(i.giftText,60):''};
  }).sort((a,b)=>a.id.localeCompare(b.id)||a.size-b.size);
  if(count>12)throw Error('too_many_units');
  const address={};
  for(const k of ['firstName','lastName','email','phone','postal','state','city','colony','street','references'])address[k]=text(input.address?.[k],k==='references'?250:120);
  if(['firstName','lastName','email','phone','postal','state','city','colony','street'].some(k=>!address[k]))throw Error('incomplete_address');
  if(!/^\d{5}$/.test(address.postal)||!/^\S+@\S+\.\S+$/.test(address.email)||!/^\+?[\d ()-]{10,20}$/.test(address.phone))throw Error('invalid_address');
  return {items,address};
}
function basketHash(input) {return createHash('sha256').update(JSON.stringify(normalizedInput(input))).digest('hex');}
// quote and config MUST come from private server storage, never from req.body.
function buildPurchase({id,binding,input,catalog,quote,rateId,config,now=Date.now()}) {
  if(!KEY.test(id)||typeof id!=='string'||typeof binding!=='string'||binding.length<32)throw Error('invalid_purchase_identity');
  const normalized=normalizedInput(input),hash=basketHash(normalized);
  if(!quote||quote.basketHash!==hash||quote.status!=='completed'||!Number.isFinite(quote.expiresAt)||quote.expiresAt<=now)throw Error('quote_expired_or_changed');
  const rate=quote.rates?.find(r=>r.id===rateId);
  if(!rate||rate.currency!=='MXN'||!Number.isSafeInteger(rate.totalCents)||rate.totalCents<=0)throw Error('invalid_shipping_rate');
  if(!Array.isArray(catalog))throw Error('invalid_catalog');
  const byId=new Map();for(const entry of catalog){if(byId.has(entry.id))throw Error('duplicate_catalog_id');byId.set(entry.id,entry);}
  const demands=new Map();
  const items=normalized.items.map(i=>{
    const product=byId.get(i.id);
    if(!product||!['Dama','Caballero','Unisex'].includes(product.linea))throw Error('unavailable_product');
    const grams=GRAMS[i.size]*i.qty;demands.set(i.id,(demands.get(i.id)||0)+grams);
    if(!Number.isFinite(Number(product.stockGramos))||Number(product.stockGramos)<demands.get(i.id))throw Error('insufficient_stock');
    const packaging=config?.packaging?.[i.size]?.[product.linea];
    if(packaging?.verified!==true)throw Error('materials_mapping_not_verified');
    return {...i,brand:text(product.disenador),name:text(product.referencia),linea:product.linea,
      unitPriceCents:PRICES[i.size],gramsPerUnit:GRAMS[i.size],costoEsencia:Number(product.costoEsencia)||0,
      materialsPerUnit:requirements(i.size,1,packaging)};
  });
  const subtotalCents=items.reduce((sum,i)=>sum+i.qty*i.unitPriceCents,0);
  return {schemaVersion:10,id,binding,basketHash:hash,items,address:normalized.address,currency:'MXN',
    subtotalCents,shippingCents:rate.totalCents,totalCents:subtotalCents+rate.totalCents,
    shipping:{quotationId:quote.id,rateId:rate.id,carrier:rate.carrier,service:rate.service},
    createdAt:now,expiresAt:Math.min(now+15*60*1000,quote.expiresAt),state:'awaiting_payment',paymentId:null};
}
function preferencePayload(purchase,{webhookUrl,now=Date.now()}) {
  if(purchase.state!=='awaiting_payment'||purchase.expiresAt<=now)throw Error('purchase_not_payable');
  const callback=new URL(webhookUrl);
  if(callback.protocol!=='https:'||callback.hostname!=='us-central1-instinto-fragancias.cloudfunctions.net'||callback.pathname!=='/mpWebhook'||callback.search||callback.username||callback.password)throw Error('invalid_webhook_url');
  const items=purchase.items.map(i=>({id:i.id+'_'+i.size,title:(i.name+' '+i.size+' ml').slice(0,200),quantity:i.qty,currency_id:'MXN',unit_price:i.unitPriceCents/100}));
  items.push({id:'shipping',title:'Envío',quantity:1,currency_id:'MXN',unit_price:purchase.shippingCents/100});
  const total=items.reduce((n,i)=>n+Math.round(i.unit_price*100)*i.quantity,0);
  if(total!==purchase.totalCents)throw Error('purchase_total_mismatch');
  return {items,external_reference:purchase.id,metadata:{instinto_purchase:purchase.id,instinto_binding:purchase.binding},
    payer:{email:purchase.address.email},notification_url:callback.href,
    back_urls:{success:'https://instintofragancias.com/?payment=success',failure:'https://instintofragancias.com/?payment=failure',pending:'https://instintofragancias.com/?payment=pending'},
    auto_return:'approved',expires:true,expiration_date_to:new Date(purchase.expiresAt).toISOString()};
}
module.exports={normalizedInput,basketHash,buildPurchase,preferencePayload};

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {basketHash,buildPurchase,preferencePayload}=require('../payments/purchase');
const {createMercadoPagoClient}=require('../payments/mercadopago');
const input={items:[{id:'A',size:60,qty:1,unitPrice:1}],address:{firstName:'Prueba',lastName:'Local',email:'test@example.com',phone:'5500000000',postal:'01000',state:'Estado',city:'Ciudad',colony:'Colonia',street:'Calle 1'}};
const catalog=[{id:'A',stockGramos:100,linea:'Unisex',referencia:'Fragancia',disenador:'Marca',costoEsencia:2.8}];
const config={packaging:{60:{Unisex:{verified:true,bottle:'env60',atomizer:'atomizador',label:'etiqueta'}}}};
const quote={id:'q1',basketHash:basketHash(input),status:'completed',expiresAt:1000000,rates:[{id:'r1',currency:'MXN',totalCents:15000,carrier:'Carrier',service:'Ground'}]};
const make=overrides=>buildPurchase({id:'purchase_1',binding:'x'.repeat(40),input,catalog,quote,rateId:'r1',config,now:1000,...overrides});
test('purchase uses catalog and fixed server prices, preserving separate shipping and material recipe',()=>{
 const p=make();assert.equal(p.totalCents,46000);assert.equal(p.items[0].unitPriceCents,31000);
 assert.equal(p.items[0].materialsPerUnit.feromonas,3.5);assert.equal(p.items[0].gramsPerUnit,30);
});
test('shipping quotes cannot be reused after basket, destination, expiry or rate changes',()=>{
 assert.throws(()=>make({quote:{...quote,expiresAt:1000}}));
 assert.throws(()=>make({input:{...input,address:{...input.address,postal:'01001'}}}));
 assert.throws(()=>make({rateId:'unknown'}));
 assert.throws(()=>make({quote:{...quote,rates:[{...quote.rates[0],currency:'USD'}]}}));
});
test('combined demand is checked across sizes and unverified material mappings block checkout',()=>{
 const cart={...input,items:[{id:'A',size:60,qty:2},{id:'A',size:100,qty:1}]};
 assert.throws(()=>make({input:cart,quote:{...quote,basketHash:basketHash(cart)}}),/insufficient_stock/);
 assert.throws(()=>make({config:{}}),/materials_mapping_not_verified/);
});
test('preference binds purchase to payment and return URLs do not imply payment confirmation',()=>{
 const p=make(),payload=preferencePayload(p,{now:1000,webhookUrl:'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook'});
 assert.equal(payload.external_reference,p.id);assert.equal(payload.metadata.instinto_binding,p.binding);
 assert.equal(payload.items[0].unit_price,310);assert.equal(payload.items[1].unit_price,150);
 assert.throws(()=>preferencePayload(p,{now:1000,webhookUrl:'https://evil.example/mpWebhook'}));
 assert.throws(()=>preferencePayload(p,{now:1000001,webhookUrl:'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook'}));
});
test('Mercado Pago transport rejects untrusted checkout destinations and does not replay uncertain requests',async()=>{
 let calls=0;
 const api=createMercadoPagoClient({accessToken:async()=>'fake',fetchImpl:async()=>{calls++;throw Error('secret-token');}});
 const options={now:1000,webhookUrl:'https://us-central1-instinto-fragancias.cloudfunctions.net/mpWebhook'};
 await assert.rejects(api.createPreference(make(),options),{message:'mp_request_uncertain'});assert.equal(calls,1);
 const bad=createMercadoPagoClient({accessToken:async()=>'fake',fetchImpl:async()=>({ok:true,json:async()=>({id:'pref1',external_reference:'purchase_1',init_point:'https://evil.example/pay'})})});
 await assert.rejects(bad.createPreference(make(),options),{message:'mp_checkout_url_invalid'});
});

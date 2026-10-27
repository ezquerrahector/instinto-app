'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {quotePayload,normalizeQuote,createShippingClient}=require('../payments/shipping');
const a={country_code:'MX',postal_code:'01000',area_level1:'Estado',area_level2:'Ciudad',area_level3:'Colonia'};
const parcels=[{length:7,width:7,height:20,weight:1}];
const rate={id:'rate-1',success:true,currency_code:'MXN',status:'approved',total:'150.25',amount:'100',provider_display_name:'Carrier',provider_service_name:'Ground',pickup:true};
const response=(data,status=200)=>({ok:status<300,status,json:async()=>data});
const creds=()=>({client_id:'test-id',client_secret:'test-secret'});
test('quote sends only domestic geographic fields and explicit package measurements',()=>{
 const p=quotePayload({...a,street:'PRIVATE',phone:'PRIVATE'},a,parcels);
 assert.equal(p.quotation.address_from.street,undefined);assert.equal(p.quotation.address_from.phone,undefined);
 assert.equal(p.quotation.parcels[0].package_protected,false);
 assert.throws(()=>quotePayload({...a,country_code:'US'},a,parcels));
 assert.throws(()=>quotePayload(a,a,[{...parcels[0],weight:NaN}]));
 assert.throws(()=>quotePayload(a,a,[{...parcels[0],length:0}]));
});
test('pending quotes expose no provisional rates',()=>{
 assert.deepEqual(normalizeQuote({id:'q1',is_completed:false,rates:[rate]}),{id:'q1',status:'pending',rates:[]});
});
test('only successful MXN rates with a valid total and usable origin are offered',()=>{
 const result=normalizeQuote({id:'q1',is_completed:true,rates:[rate,rate,{...rate,id:'b',currency_code:'USD'},
 {...rate,id:'c',success:false},{...rate,id:'d',requires_origin_verification:true},{...rate,id:'e',total:null},
 {...rate,id:'f',total:'-1'},{...rate,id:'g',total:'1e2'},{...rate,id:'h',status:'pending'}]});
 assert.equal(result.rates.length,1);assert.equal(result.rates[0].totalCents,15025);assert.equal(result.rates[0].pickupAvailable,true);
 assert.equal(result.rates[0].pickupAutomatic,false);
});
test('mismatched or malformed provider responses are rejected',()=>{
 assert.throws(()=>normalizeQuote({id:'other',is_completed:true,rates:[]},'q1'));
 assert.throws(()=>normalizeQuote({id:'q1',is_completed:true}));
});
test('concurrent quotes share token acquisition and use documented endpoints',async()=>{
 const calls=[];
 const client=createShippingClient({credentials:creds,fetchImpl:async(url,options)=>{
 calls.push({url,options});return response(url.endsWith('/token')?{access_token:'fake',expires_in:3600}:{id:'q1',is_completed:false});}});
 await Promise.all([client.createQuote(a,a,parcels),client.createQuote(a,a,parcels)]);
 assert.equal(calls.filter(c=>c.url.endsWith('/token')).length,1);
 assert.equal(calls[1].options.headers.Authorization,'Bearer fake');
 assert.ok(calls.every(c=>c.url.startsWith('https://api-pro.skydropx.com/api/v1/')));
 assert.ok(calls.every(c=>c.options.redirect==='error'));
});
test('expired tokens refresh without exposing credentials in errors',async()=>{
 let time=0,count=0;
 const client=createShippingClient({credentials:creds,now:()=>time,fetchImpl:async(url)=>{
 if(url.endsWith('/token')){count++;return response({access_token:'fake',expires_in:120});}
 return response({id:'q1',is_completed:false});}});
 await client.getQuote('q1');time=61000;await client.getQuote('q1');assert.equal(count,2);
 const failing=createShippingClient({credentials:creds,fetchImpl:async()=>{throw Error('test-secret');}});
 await assert.rejects(failing.getQuote('q1'),{message:'shipping_network_error'});
});
test('401 invalidates cache but does not replay a quotation POST',async()=>{
 let authCalls=0,quoteCalls=0;
 const client=createShippingClient({credentials:creds,fetchImpl:async(url)=>{
 if(url.endsWith('/token')){authCalls++;return response({access_token:'fake',expires_in:3600});}
 quoteCalls++;return response({},401);}});
 await assert.rejects(client.createQuote(a,a,parcels));assert.equal(quoteCalls,1);
 await assert.rejects(client.getQuote('q1'));assert.equal(authCalls,2);
});
test('invalid input never contacts provider; GET cannot escape the quotation path',async()=>{
 let calls=0;const client=createShippingClient({credentials:creds,fetchImpl:async()=>{calls++;}});
 await assert.rejects(client.getQuote('../shipments'));await assert.rejects(client.createQuote(a,a,[]));assert.equal(calls,0);
});
test('provider validation errors keep the provider message for operators',async()=>{
 const {createShippingClient}=require('../payments/shipping');
 let n=0;
 const client=createShippingClient({credentials:async()=>({client_id:'a',client_secret:'b'}),fetchImpl:async()=>{n++;
   if(n===1)return {ok:true,json:async()=>({access_token:'t',expires_in:7200})};
   return {ok:false,status:422,text:async()=>'{"errors":{"address_to":["street1 is too long"]}}'};}});
 await assert.rejects(client.createShipment({rateId:'r1',originTemplateId:'tpl',from:{street1:'a',name:'b',phone:'1',email:'e@x.com'},to:{street1:'a',name:'b',phone:'1',email:'e@x.com'},packages:[{consignmentNote:'53131620',packageType:'4G'}]}),
   e=>e.status===422&&/street1 is too long/.test(e.detail));
});

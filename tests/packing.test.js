'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {packCart}=require('../payments/packing');
const {quotePayload}=require('../payments/shipping');
const box={verified:true,length:7,width:7,height:20};
const config={60:box,100:box};
test('one parcel per perfume with owner supplied packed weights, independent of client weights',()=>{
 const parcels=packCart([{sizeMl:60,quantity:2,weight:0},{sizeMl:100,quantity:1}],config);
 assert.deepEqual(parcels.map(p=>p.weight),[0.25,0.25,0.299]);
 assert.notEqual(parcels[0],parcels[1]);
});
test('unverified packaging, unknown sizes and invalid quantities cannot be quoted',()=>{
 for(const cart of [[],[{sizeMl:20,quantity:1}],[{sizeMl:60,quantity:0}],[{sizeMl:60,quantity:1.5}],[{sizeMl:60,quantity:12},{sizeMl:100,quantity:1}]])assert.throws(()=>packCart(cart,config));
 assert.throws(()=>packCart([{sizeMl:100,quantity:1}],{100:{...box,verified:false}}));
});
test('provider minimum affects quote payload only; actual parcel weights stay intact',()=>{
 const parcels=packCart([{sizeMl:60,quantity:1},{sizeMl:100,quantity:1}],config);
 const address={country_code:'MX',postal_code:'01000',area_level1:'Estado',area_level2:'Ciudad',area_level3:'Colonia'};
 const payload=quotePayload(address,address,parcels);
 assert.deepEqual(payload.quotation.parcels.map(p=>p.weight),[1,1]);
 assert.deepEqual(parcels.map(p=>p.weight),[0.25,0.299]);
 assert.throws(()=>quotePayload(address,address,[{...parcels[0],weight:0}]));
});

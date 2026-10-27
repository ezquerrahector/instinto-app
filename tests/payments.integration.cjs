'use strict';
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const admin=require('../payments/node_modules/firebase-admin');
const {reconcilePayment}=require('../payments/reconcile');
const {changeWebOrderStatus}=require('../payments/production');
const PROJECT='demo-instinto-v10';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('Local emulator required');
let app,db;
const now=Date.parse('2026-10-27T04:00:00Z');
const inventory=()=>({cat:[{id:'A',stockGramos:200}],peds:[{id:1,cliente:'Existing',canal:'Directo'}],materiales:[{id:'fijador',stockActual:500}],syncRevision:0});
const purchase=(id='order1')=>({schemaVersion:10,id,binding:'b'.repeat(40),state:'awaiting_payment',expiresAt:now+60000,
 items:[{id:'A',size:60,qty:2,gramsPerUnit:30,unitPriceCents:31000,costoEsencia:2.8,name:'Fragancia',brand:'Marca',linea:'Unisex',gift:false,giftText:'',materialsPerUnit:{fijador:5}}],
 address:{firstName:'Prueba',lastName:'Local'},shippingCents:15000,totalCents:77000});
const payment=(id='101',order='order1')=>({id,external_reference:order,metadata:{instinto_purchase:order,instinto_binding:'b'.repeat(40)},collector_id:123,
 live_mode:false,status:'approved',currency_id:'MXN',transaction_amount:770,transaction_amount_refunded:0,date_approved:new Date(now).toISOString(),date_last_updated:new Date(now).toISOString()});
before(()=>{app=admin.initializeApp({projectId:PROJECT},'payment-tests');db=app.firestore();});
after(async()=>{await app?.delete();});
beforeEach(async()=>{
 const result=await fetch('http://127.0.0.1:8085/emulator/v1/projects/'+PROJECT+'/databases/(default)/documents',{method:'DELETE'});assert.equal(result.ok,true);
 await db.doc('instinto_private/runtime').set({reconciliationEnabled:true,compatibleWritesValidated:true,collectorId:123,liveMode:false});
 await db.doc('instinto/datos').set(inventory());await db.doc('instinto_web_purchases/order1').set(purchase());
});
test('simultaneous webhook deliveries deduct once and create linked admin orders atomically',async()=>{
 await Promise.all([reconcilePayment(db,payment(),{now}),reconcilePayment(db,payment(),{now}),reconcilePayment(db,payment(),{now})]);
 const data=(await db.doc('instinto/datos').get()).data();assert.equal(data.cat[0].stockGramos,140);assert.equal(data.peds.length,3);
 assert.equal(data.materiales[0].stockActual,500);assert.equal(data.peds[0].cliente,'Existing');
 assert.equal(data.peds[1].folioWeb,'order1');assert.equal(data.peds[1].esenciaDescontada,true);assert.equal(data.peds[1].matDescontado,false);
 assert.equal((await db.collection('instinto_web_outbox').get()).size,1);
});
test('recovery after lost response is safe and stale pending notifications cannot undo payment',async()=>{
 await reconcilePayment(db,payment(),{now});await reconcilePayment(db,payment(),{now});
 await reconcilePayment(db,{...payment(),status:'pending',date_last_updated:new Date(now-1000).toISOString()},{now});
 assert.equal((await db.doc('instinto_web_purchases/order1').get()).data().state,'paid');
 assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos,140);
});
test('wrong amount, seller, environment, binding and unknown purchase never change inventory',async()=>{
 for(const change of [{transaction_amount:1},{collector_id:999},{live_mode:true},{metadata:{}},{external_reference:'missing'}])
 await assert.rejects(reconcilePayment(db,{...payment(),...change},{now}));
 assert.deepEqual((await db.doc('instinto/datos').get()).data(),inventory());
});
test('two different approved payments for the same purchase require review without another deduction',async()=>{
 await reconcilePayment(db,payment(),{now});const result=await reconcilePayment(db,payment('102'),{now});
 assert.equal(result.reason,'second_approved_payment');assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos,140);
});
test('insufficient stock leaves every inventory and admin field unchanged and records durable review',async()=>{
 const data=inventory();data.cat[0].stockGramos=59;await db.doc('instinto/datos').set(data);
 const result=await reconcilePayment(db,payment(),{now});assert.equal(result.reason,'insufficient_stock');
 assert.deepEqual((await db.doc('instinto/datos').get()).data(),data);
 assert.equal((await db.doc('instinto_payment_ledger/mp_101').get()).data().disposition,'review_required');
});
test('concurrent independent purchases cannot oversell remaining essence',async()=>{
 const data=inventory();data.cat[0].stockGramos=100;await db.doc('instinto/datos').set(data);
 await db.doc('instinto_web_purchases/order2').set(purchase('order2'));
 const outcomes=await Promise.all([reconcilePayment(db,payment(),{now}),reconcilePayment(db,payment('102','order2'),{now})]);
 assert.equal(outcomes.filter(x=>x.outcome==='applied').length,1);assert.equal(outcomes.filter(x=>x.outcome==='review_required').length,1);
 assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos,40);
});
test('refund preserves essence until administrative authorization',async()=>{
 await reconcilePayment(db,payment(),{now});
 await reconcilePayment(db,{...payment(),status:'refunded',transaction_amount_refunded:770,date_last_updated:new Date(now+1000).toISOString()},{now});
 assert.equal((await db.doc('instinto/datos').get()).data().cat[0].stockGramos,140);
 assert.equal((await db.doc('instinto_web_purchases/order1').get()).data().reviewRequired,true);
});
test('partial refund discovered before fulfillment requires review without consuming stock',async()=>{
 const result=await reconcilePayment(db,{...payment(),transaction_amount_refunded:10},{now});
 assert.equal(result.reason,'payment_reversal');assert.deepEqual((await db.doc('instinto/datos').get()).data(),inventory());
});
test('late payment and disabled rollout gates cannot create paid orders',async()=>{
 const late=await reconcilePayment(db,{...payment(),date_approved:new Date(now+120000).toISOString()},{now});assert.equal(late.reason,'late_payment');
 await db.doc('instinto_private/runtime').update({reconciliationEnabled:false});
 await assert.rejects(reconcilePayment(db,payment(),{now}),/reconciliation_disabled/);
 assert.deepEqual((await db.doc('instinto/datos').get()).data(),inventory());
});
test('Elaborado uses stored material recipe once and never consumes essence again',async()=>{
 await reconcilePayment(db,payment(),{now});
 const command={orderId:2,status:'Elaborado',expectedStatus:'Pedido',operationId:'production_operation_01'};
 const actor={email:'osmararobles@hotmail.com',email_verified:true};
 await Promise.all([changeWebOrderStatus(db,command,actor,{now}),changeWebOrderStatus(db,command,actor,{now})]);
 const data=(await db.doc('instinto/datos').get()).data();assert.equal(data.cat[0].stockGramos,140);
 assert.equal(data.materiales[0].stockActual,495);assert.equal(data.peds[1].matDescontado,true);
 await changeWebOrderStatus(db,{...command,status:'Pedido',expectedStatus:'Elaborado',operationId:'production_operation_02'},actor,{now});
 const reverted=(await db.doc('instinto/datos').get()).data();assert.equal(reverted.cat[0].stockGramos,140);assert.equal(reverted.materiales[0].stockActual,500);
});
test('unverified actors, stale transitions and insufficient materials leave the entire document intact',async()=>{
 await reconcilePayment(db,payment(),{now});
 await db.doc('instinto/datos').update({materiales:[{id:'fijador',stockActual:1}]});
 const before=(await db.doc('instinto/datos').get()).data();
 const command={orderId:2,status:'Elaborado',expectedStatus:'Pedido',operationId:'production_operation_03'};
 const actor={email:'ezquerrahector@gmail.com',email_verified:true};
 await assert.rejects(changeWebOrderStatus(db,command,{...actor,email_verified:false},{now}),/forbidden/);
 await assert.rejects(changeWebOrderStatus(db,{...command,expectedStatus:'Elaborado'},actor,{now}),/status_conflict/);
 await assert.rejects(changeWebOrderStatus(db,command,actor,{now}),/insufficient_material/);
 assert.deepEqual((await db.doc('instinto/datos').get()).data(),before);
});
test('100 ml elaboration consumes the stored 100 ml amounts instead of the global 60 ml recipe',async()=>{
 const p=purchase();p.items=[{...p.items[0],size:100,qty:1,gramsPerUnit:50,unitPriceCents:49000,materialsPerUnit:{fijador:8.33}}];p.totalCents=64000;
 await db.doc('instinto_web_purchases/order1').set(p);await reconcilePayment(db,{...payment(),transaction_amount:640},{now});
 await changeWebOrderStatus(db,{orderId:2,status:'Elaborado',expectedStatus:'Pedido',operationId:'production_operation_100'},
   {email:'ezquerrahector@gmail.com',email_verified:true},{now});
 const data=(await db.doc('instinto/datos').get()).data();assert.equal(data.cat[0].stockGramos,150);assert.equal(data.materiales[0].stockActual,491.67);
});

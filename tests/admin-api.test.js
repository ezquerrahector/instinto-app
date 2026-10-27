'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createAdminStatusHandler}=require('../payments/admin-api');
function response(){return {statusCode:200,headers:{},set(k,v){this.headers[k]=v;return this;},
  status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;},end(){return this;}};}
const req=(changes={})=>({method:'POST',body:{orderId:1,status:'Elaborado',expectedStatus:'Pedido',operationId:'a'.repeat(32)},
  get:name=>({origin:'https://ezquerrahector.github.io',authorization:'Bearer token'})[name],...changes});
test('revoked or invalid session never reaches inventory mutation',async()=>{
  let calls=0;const handler=createAdminStatusHandler({db:{},verifyIdToken:async(_,revoked)=>{
    assert.equal(revoked,true);throw Error('revoked');},changeStatus:async()=>{calls++;}});
  const res=response();await handler(req(),res);assert.equal(res.statusCode,401);assert.equal(calls,0);
});
test('body cannot replace authenticated identity or introduce server configuration',async()=>{
  const verified={email:'allowed@example.com',email_verified:true};let input;
  const handler=createAdminStatusHandler({db:{},verifyIdToken:async()=>verified,
    changeStatus:async(_,body,identity)=>{input=body;assert.equal(identity,verified);return {outcome:'applied'};}});
  const request=req();request.body.identity={email:'attacker@example.com'};request.body.config={productionEnabled:true};
  const res=response();await handler(request,res);assert.equal(res.statusCode,200);
  assert.deepEqual(Object.keys(input).sort(),['expectedStatus','operationId','orderId','status']);
});
test('untrusted origin and oversized input are rejected before token verification',async()=>{
  let calls=0;const handler=createAdminStatusHandler({db:{},verifyIdToken:async()=>{calls++;}});
  const blocked=response();await handler(req({get:()=> 'https://other.example'}),blocked);
  assert.equal(blocked.statusCode,403);assert.equal(blocked.headers['Access-Control-Allow-Origin'],undefined);
  const big=response();await handler(req({body:{note:'x'.repeat(5000)}}),big);
  assert.equal(big.statusCode,413);assert.equal(calls,0);
});
test('stock conflicts are reported without success, internal details stay private',async()=>{
  for(const [error,status,publicError] of [['insufficient_material',409,'insufficient_material'],['private detail',500,'internal_error']]){
    const handler=createAdminStatusHandler({db:{},verifyIdToken:async()=>({}),changeStatus:async()=>{throw Error(error);}});
    const res=response();await handler(req(),res);assert.equal(res.statusCode,status);assert.equal(res.body.error,publicError);
  }
});

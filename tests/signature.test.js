'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {validSignature} = require('../payments/signature');
const now=1793066400000, secret='test-only-secret';
function request(id='1234',ts=String(now),bodyId=id){
  const signature=crypto.createHmac('sha256',secret).update(`id:${id.toLowerCase()};request-id:request-1;ts:${ts};`).digest('hex');
  const headers={'x-request-id':'request-1','x-signature':`ts=${ts},v1=${signature}`};
  return {query:{'data.id':id},body:{data:{id:bodyId}},get:key=>headers[key]};
}
test('accepts provider manifest in milliseconds and seconds',()=>{
  assert.equal(validSignature(request(),secret,now),true);
  assert.equal(validSignature(request('1234',String(now/1000)),secret,now),true);
});
test('rejects wrong secret, stale timestamp, future timestamp and missing query id',()=>{
  assert.equal(validSignature(request(),'wrong',now),false);
  assert.equal(validSignature(request('1234',String(now-660000)),secret,now),false);
  assert.equal(validSignature(request('1234',String(now+660000)),secret,now),false);
  const r=request();delete r.query['data.id'];assert.equal(validSignature(r,secret,now),false);
});
test('rejects body/url mismatch and malformed headers',()=>{
  assert.equal(validSignature(request('1234',String(now),'5678'),secret,now),false);
  const r=request();r.get=()=>['invalid'];assert.equal(validSignature(r,secret,now),false);
});

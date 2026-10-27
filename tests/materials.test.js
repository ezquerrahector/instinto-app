'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RECIPES,requirements}=require('../payments/materials');
const packaging={bottle:'env_100',atomizer:'atomizador',label:'sticker'};
test('100 ml matches recovered calculation and excludes essence at production',()=>{
  assert.deepEqual(RECIPES[100],{essence:50,feromonas:5.83,fijador:8.33,perfumol:35.84});
  assert.deepEqual(requirements(100,2,packaging),{env_100:2,atomizador:2,sticker:2,feromonas:11.66,fijador:16.66,perfumol:71.68});
});
test('60 ml uses its existing consumptions',()=>{
  assert.deepEqual(requirements(60,1,{...packaging,bottle:'env_60'}),{env_60:1,atomizador:1,sticker:1,feromonas:3.5,fijador:5,perfumol:21.5});
});
test('missing packaging cannot silently consume the wrong bottle',()=>{
  assert.throws(()=>requirements(100,1,null));assert.throws(()=>requirements(100,0,packaging));
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RECIPES,requirements}=require('../payments/materials');
const packaging={bottle:'env_100',atomizer:'atomizador',label:'sticker'};
test('100 ml matches recovered calculation and excludes essence at production',()=>{
  assert.deepEqual(RECIPES[100],{essence:50,feromonas:5.83,fijador:8.33,perfumol:35.84});
  assert.deepEqual(requirements(100,2,packaging),{env_100:2,atomizador:2,sticker:2,feromonas:11.66,fijador:16.66,perfumol:71.68});
});
test('60 ml uses the owner-confirmed admin recipe (fijador 6 g, 27/10/2026)',()=>{
  assert.deepEqual(RECIPES[60],{essence:30,feromonas:3.5,fijador:6,perfumol:21.5});
  assert.deepEqual(requirements(60,1,{...packaging,bottle:'env_60'}),{env_60:1,atomizador:1,sticker:1,feromonas:3.5,fijador:6,perfumol:21.5});
});
test('label null means label is not inventoried; undefined label is still a missing mapping',()=>{
  assert.deepEqual(requirements(60,2,{bottle:'env_cristal',atomizer:'atomizador',label:null}),{env_cristal:2,atomizador:2,feromonas:7,fijador:12,perfumol:43});
  assert.throws(()=>requirements(60,1,{bottle:'env_cristal',atomizer:'atomizador'}));
});
test('explicit recipe from private runtime config overrides defaults',()=>{
  assert.equal(requirements(60,1,{bottle:'b',atomizer:'a',label:null},{essence:30,feromonas:3,fijador:6,perfumol:21}).feromonas,3);
});
test('missing packaging cannot silently consume the wrong bottle',()=>{
  assert.throws(()=>requirements(100,1,null));assert.throws(()=>requirements(100,0,packaging));
});

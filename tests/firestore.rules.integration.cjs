'use strict';
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,updateDoc,deleteDoc,runTransaction}=require('firebase/firestore');
const {readFileSync}=require('node:fs');
const {checkedUpdate}=require('../assets/safe-sync');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-instinto-v10',firestore:{host:'127.0.0.1',port:8085,rules:readFileSync('security/firestore.transition.rules','utf8')}})});
after(async()=>{await env?.cleanup()});
const data=()=>({cfg:{gesencia:30},cat:[{id:'A',stockGramos:100}],peds:[],materiales:[],gramosEditados:{}});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'instinto/datos'),data())})});
function db(email,verified=true){return env.authenticatedContext(email,{email,email_verified:verified}).firestore()}
test('both authorized verified collaborators can read',async()=>{
  for(const email of ['ezquerrahector@gmail.com','osmararobles@hotmail.com'])await assertSucceeds(getDoc(doc(db(email),'instinto/datos')));
});
test('public, foreign and unverified users cannot read or write',async()=>{
  for(const client of [env.unauthenticatedContext().firestore(),db('outsider@example.com'),db('ezquerrahector@gmail.com',false)]){
    await assertFails(getDoc(doc(client,'instinto/datos')));await assertFails(setDoc(doc(client,'instinto/datos'),data()));
  }
});
test('legacy full document writers are rejected',async()=>{
  await assertFails(setDoc(doc(db('osmararobles@hotmail.com'),'instinto/datos'),data()));
});
test('compatible transactional writer succeeds, stale writer cannot erase the first update',async()=>{
  const a=db('ezquerrahector@gmail.com'),b=db('osmararobles@hotmail.com');
  const ar=doc(a,'instinto/datos'),br=doc(b,'instinto/datos');
  const base=(await getDoc(ar)).data();
  await assertSucceeds(runTransaction(a,async tx=>{const remote=(await tx.get(ar)).data();tx.update(ar,checkedUpdate(base,remote,{peds:[{id:1}]},'first','today'))}));
  await assert.rejects(runTransaction(b,async tx=>{const remote=(await tx.get(br)).data();tx.update(br,checkedUpdate(base,remote,{peds:[{id:2}]},'second','today'))}),{code:'instinto/conflict'});
  const result=(await getDoc(ar)).data();if(result.peds.length!==1||result.peds[0].id!==1)throw Error('First order was lost');
});
test('deletion, new documents, protected fields, and payment collections are denied',async()=>{
  const client=db('ezquerrahector@gmail.com');
  await assertFails(deleteDoc(doc(client,'instinto/datos')));
  await assertFails(setDoc(doc(client,'instinto/other'),data()));
  await assertFails(updateDoc(doc(client,'instinto/datos'),{syncClient:'v10',syncRevision:1,lastWriteId:'x',paymentsEnabled:true}));
  await assertFails(setDoc(doc(client,'instinto_mp_webhook_inbox/payment_1'),{status:'approved'}));
});

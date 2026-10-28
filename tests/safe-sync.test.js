'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {clone, checkedUpdate, SaveQueue} = require('../assets/safe-sync');
const initial = () => ({cfg:{gesencia:30},cat:[{id:'A',stockGramos:100}],peds:[],materiales:[],gramosEditados:{},unknown:{keep:true}});
test('does not overwrite an inventory deduction from a concurrent payment', () => {
  const base=initial(), remote=initial();remote.cat[0].stockGramos=70;
  assert.throws(()=>checkedUpdate(base,remote,{peds:[{id:1}]},'x','today'),{code:'instinto/conflict'});
  assert.equal(remote.cat[0].stockGramos,70);
});
test('detects a concurrent legacy writer even without revision metadata', () => {
  const base=initial(), remote=initial();remote.peds.push({id:1});
  assert.throws(()=>checkedUpdate(base,remote,{peds:[]},'x','today'));
});
test('preserves fields owned by other services and increments revision',()=>{
  const base=initial();const result=checkedUpdate(base,clone(base),{peds:[{id:1}]},'one','today');
  assert.deepEqual(result.unknown,{keep:true});assert.equal(result.syncRevision,1);
  assert.equal(base.peds.length,0);
});
test('does not create a missing production document from local storage',()=>{
  assert.throws(()=>checkedUpdate(initial(),null,{},'x','today'));
  assert.throws(()=>checkedUpdate(null,initial(),{},'x','today'));
});
test('property ordering does not produce false conflicts',()=>{
  assert.equal(checkedUpdate({a:1,b:2},{b:2,a:1},{},'x','today').syncRevision,1);
});
function queue(commit){
  let saved=null,id=0;
  const q=new SaveQueue({commit,persist:r=>{saved=clone(r)},clear:()=>{saved=null},makeId:()=>String(++id)});
  q.accept(initial());return {q,saved:()=>saved};
}
test('rapid saves are drained instead of silently dropped',async()=>{
  const writes=[];let release;
  const {q,saved}=queue(async(base,desired,id)=>{
    writes.push(desired);if(writes.length===1)await new Promise(r=>{release=r});
    return checkedUpdate(base,base,desired,id,'today');
  });
  const first=q.save({peds:[{id:1}]});await Promise.resolve();
  const second=q.save({peds:[{id:1},{id:2}]});
  assert.equal(q.accept(initial()),false);release();await Promise.all([first,second]);
  assert.equal(writes.length,2);assert.equal(q.base.peds.length,2);assert.equal(saved(),null);
});
test('offline failure keeps recovery record and retries the same operation id',async()=>{
  let fail=true;const ids=[];
  const {q,saved}=queue(async(base,desired,id)=>{
    ids.push(id);if(fail)throw Error('offline');return checkedUpdate(base,base,desired,id,'today');
  });
  await assert.rejects(q.save({peds:[{id:1}]}));assert.equal(saved().desired.peds.length,1);
  assert.equal(q.accept(initial()),false);fail=false;await q.retry();assert.deepEqual(ids,['1','1']);
});
test('a browser restart restores the pending base instead of overwriting it with fresh cloud data',async()=>{
  const {q,saved}=queue(async()=>{throw Error('offline')});
  await assert.rejects(q.save({peds:[{id:1}]}));
  const other=queue(async(base,desired,id)=>checkedUpdate(base,base,desired,id,'today')).q;
  other.restore(saved());assert.equal(other.accept(initial()),false);await other.retry();
  assert.equal(other.base.peds.length,1);
});
test('storage failure prevents network writes',async()=>{
  let commits=0;
  const q=new SaveQueue({commit:async()=>{commits++},persist:()=>{throw Error('quota')},clear:()=>{},makeId:()=> 'x'});
  q.accept(initial());assert.throws(()=>q.save({peds:[]}));assert.equal(commits,0);
});
test('rejects corrupt recovery records',()=>{
  const {q}=queue(async()=>{});assert.throws(()=>q.restore({version:0}));
});
test('nested synchronous changes commit only their final complete state',async()=>{
  const writes=[];
  const {q}=queue(async(base,desired,id)=>{writes.push(desired);return checkedUpdate(base,base,desired,id,'today')});
  const a=q.save({peds:[{id:1,matDescontado:false}],materiales:[]});
  const b=q.save({peds:[{id:1,matDescontado:true}],materiales:[]});
  await Promise.all([a,b]);assert.equal(writes.length,1);assert.equal(writes[0].peds[0].matDescontado,true);
});
test('saving identical data after a lost acknowledgement reuses its operation id',async()=>{
  let fail=true;const ids=[];
  const {q}=queue(async(base,desired,id)=>{ids.push(id);if(fail)throw Error('lost acknowledgement');return checkedUpdate(base,base,desired,id,'today')});
  await assert.rejects(q.save({peds:[{id:1}]}));fail=false;await q.save({peds:[{id:1}]});
  assert.deepEqual(ids,['1','1']);
});

// V10.2 — combinación de cambios concurrentes
const {rebasedUpdate} = require('../assets/safe-sync');
const doc = () => ({cfg:{gesencia:30},cat:[{id:'A',stockGramos:100},{id:'B',stockGramos:60}],peds:[{id:1,estado:'Pedido'},{id:2,estado:'Pedido'}],
  materiales:[{id:'fijador',stockActual:500}],gramosEditados:{},syncRevision:4,lastWriteId:'w0',webLedger:{keep:true}});
const desiredOf = d => ({cfg:d.cfg,cat:d.cat,peds:d.peds,materiales:d.materiales,gramosEditados:d.gramosEditados});
test('a web reservation while editing an order is merged, not blocked', () => {
  const base=doc(), remote=doc(); remote.cat[0].stockGramos=70; remote.syncRevision=5; remote.lastWriteId='srv'; // compra en línea
  const local=doc(); local.peds[1].estado='Elaborado'; local.cat[1].stockGramos=30; local.materiales[0].stockActual=495;
  const {doc:out,merged}=rebasedUpdate(base,remote,desiredOf(local),'me','now');
  assert.equal(merged,true); assert.equal(out.cat[0].stockGramos,70); assert.equal(out.cat[1].stockGramos,30);
  assert.equal(out.peds[1].estado,'Elaborado'); assert.equal(out.materiales[0].stockActual,495);
  assert.equal(out.syncRevision,6); assert.deepEqual(out.webLedger,{keep:true});
});
test('both sides deducting the same essence keep both deductions', () => {
  const base=doc(), remote=doc(); remote.cat[0].stockGramos=70;
  const local=doc(); local.cat[0].stockGramos=40;
  assert.equal(rebasedUpdate(base,remote,desiredOf(local),'me','now').doc.cat[0].stockGramos,10);
});
test('two collaborators editing different orders both persist', () => {
  const base=doc(), remote=doc(); remote.peds[0].estado='Cobrado';
  const local=doc(); local.peds[1].estado='Entregado';
  const out=rebasedUpdate(base,remote,desiredOf(local),'me','now').doc;
  assert.equal(out.peds[0].estado,'Cobrado'); assert.equal(out.peds[1].estado,'Entregado');
});
test('same new order number on two devices keeps both and renumbers mine', () => {
  const base=doc(), remote=doc(); remote.peds.unshift({id:3,cliente:'Osmara'});
  const local=doc(); local.peds.unshift({id:3,cliente:'Héctor'});
  const r=rebasedUpdate(base,remote,desiredOf(local),'me','now');
  assert.deepEqual(r.doc.peds.map(p=>p.id).sort(),[1,2,3,4]);
  assert.equal(r.doc.peds.find(p=>p.id===3).cliente,'Osmara'); assert.equal(r.doc.peds.find(p=>p.id===4).cliente,'Héctor');
  assert.equal(r.notes[0].kind,'renumbered');
});
test('a deletion is applied unless the other side changed that order', () => {
  const base=doc(), remote=doc(); remote.peds.push({id:9,estado:'Pedido'});
  const local=doc(); local.peds=local.peds.filter(p=>p.id!==2);
  assert.deepEqual(rebasedUpdate(base,remote,desiredOf(local),'me','now').doc.peds.map(p=>p.id),[1,9]);
  const remote2=doc(); remote2.peds[1].estado='Cobrado';
  const r=rebasedUpdate(base,remote2,desiredOf(local),'me','now');
  assert.deepEqual(r.doc.peds.map(p=>p.id),[1,2]); assert.equal(r.notes[0].kind,'kept_remote_after_local_delete');
});
test('unchanged server keeps the plain path', () => {
  const r=rebasedUpdate(doc(),doc(),desiredOf(doc()),'me','now'); assert.equal(r.merged,false); assert.equal(r.doc.syncRevision,5);
});

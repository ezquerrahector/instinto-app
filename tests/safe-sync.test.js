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

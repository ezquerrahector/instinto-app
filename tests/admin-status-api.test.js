'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('const webStatusRequests='),html.indexOf('\nfunction verificarStockAlCargar'));
function setup(fetchImpl,pending=false){
  const messages=[],context={syncPending:()=>pending,toast:x=>messages.push(x),
    crypto:{randomUUID:()=> 'operation_1234567890123456'},AbortSignal,
    InstintoAccess:{requireUser:async()=>({getIdToken:async()=>'verified-session'})},
    fetch:fetchImpl,renderAll:()=>{}};
  vm.createContext(context);vm.runInContext(source,context);
  return {context,messages};
}
test('paid Web transitions never fall back to local inventory after a failed server request',async()=>{
  const order={id:1,estatus:'Pedido',matDescontado:false,esenciaDescontada:true};
  const before=JSON.stringify(order),requests=[];
  const {context}=setup(async(_,request)=>{requests.push(JSON.parse(request.body));throw Error('network');});
  await context.cambiarEstWebServidor(order,'Elaborado');
  await context.cambiarEstWebServidor(order,'Elaborado');
  assert.equal(JSON.stringify(order),before);assert.equal(requests.length,2);
  assert.equal(requests[0].operationId,requests[1].operationId);
});
test('pending administrative edits block server transitions before any request',async()=>{
  let called=false;const {context}=setup(async()=>{called=true;},true);
  await context.cambiarEstWebServidor({id:1,estatus:'Pedido'},'Elaborado');assert.equal(called,false);
});
test('server confirmation waits for the Firestore listener instead of applying a second local deduction',async()=>{
  const order={id:1,estatus:'Pedido',matDescontado:false};let called=0;
  const {context,messages}=setup(async(_,request)=>{
    called++;assert.equal(request.headers.Authorization,'Bearer verified-session');
    return {ok:true,json:async()=>({outcome:'already_applied'})};
  });
  await context.cambiarEstWebServidor(order,'Elaborado');assert.equal(called,1);
  assert.equal(order.estatus,'Pedido');assert.equal(order.matDescontado,false);
  assert.match(messages[0],/confirmado por el servidor/);
});

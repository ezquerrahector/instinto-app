'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function cambiarEst(id,est){');
const end=html.indexOf('\nconst webStatusRequests=',start+1);
function run(web,from,to,discounted){
  const p={id:1,estatus:from,codigo:'A',esenciaDescontada:discounted,matDescontado:discounted,
    ...(web?{canal:'Web',origenWeb:true,pagoConfirmadoServidor:true}:{canal:'Directo'})};
  const context={peds:[p],cat:[{id:'A',stockGramos:100}],cfg:{gesencia:30},window:{},
    descontarMateriales:()=>{},revertirMateriales:()=>{},save:()=>{},fbSave:()=>{},renderAll:()=>{},toast:()=>{},
    cambiarEstWebServidor:()=>{},proponerResurtido:()=>{},setTimeout:()=>{}};
  vm.createContext(context);vm.runInContext(html.slice(start,end),context);context.cambiarEst(1,to);
  return {p,stock:context.cat[0].stockGramos};
}
test('web prepaid order does not consume essence twice',()=>assert.equal(run(true,'Pedido','Elaborado',true).stock,100));
test('web prepaid order cannot refund essence through a status reversal',()=>{
  const result=run(true,'Elaborado','Pedido',true);assert.equal(result.stock,100);assert.equal(result.p.esenciaDescontada,true);
});
test('web prepaid state is not changed locally before server confirmation',()=>{
  assert.equal(run(true,'Pedido','Elaborado',true).p.estatus,'Pedido');
  assert.equal(run(true,'Elaborado','Pedido',true).p.estatus,'Elaborado');
});
test('existing direct orders retain consumption and reversal',()=>{
  assert.equal(run(false,'Pedido','Elaborado',false).stock,70);
  assert.equal(run(false,'Elaborado','Pedido',true).stock,130);
});
test('all inline JavaScript parses',()=>{
  for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});

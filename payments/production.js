'use strict';
const ALLOWED=new Set(['ezquerrahector@gmail.com','osmararobles@hotmail.com']);
const STATUSES=new Set(['Pedido','Comprado proveedor','Elaborado','Entregado','Cobrado','Entregado/Cobrado']);
const MADE=new Set(['Elaborado','Entregado','Cobrado','Entregado/Cobrado']);
// identity must be returned by verifyIdToken(token,true), never by the request body.
async function changeWebOrderStatus(db,{orderId,status,expectedStatus,operationId},identity,{now=Date.now()}={}) {
  if(identity?.email_verified!==true||!ALLOWED.has(String(identity.email||'').toLowerCase()))throw Error('forbidden');
  if(!Number.isSafeInteger(orderId)||!STATUSES.has(status)||!STATUSES.has(expectedStatus)||
    typeof operationId!=='string'||!/^[A-Za-z0-9_-]{16,100}$/.test(operationId))throw Error('invalid_transition');
  const ref=db.doc('instinto/datos'),operationRef=db.doc('instinto_admin_operations/'+operationId);
  return db.runTransaction(async tx=>{
    const config=(await tx.get(db.doc('instinto_private/runtime'))).data()||{};
    if(config.reconciliationEnabled!==true||config.compatibleWritesValidated!==true)throw Error('production_disabled');
    const operation=(await tx.get(operationRef)).data();
    if(operation){if(operation.orderId!==orderId||operation.status!==status||operation.actor!==identity.email)throw Error('operation_reused');return {outcome:'already_applied'};}
    const snapshot=await tx.get(ref),data=snapshot.data();
    if(!Array.isArray(data?.peds)||!Array.isArray(data.materiales))throw Error('invalid_inventory');
    const peds=data.peds.map(p=>({...p})),matches=peds.filter(p=>p.id===orderId);
    if(matches.length!==1)throw Error('order_not_found');
    const order=matches[0];
    if(order.canal!=='Web'||order.origenWeb!==true||order.pagoConfirmadoServidor!==true||order.esenciaDescontada!==true)throw Error('not_prepaid_web_order');
    if(order.estatus!==expectedStatus)throw Error('status_conflict');
    const materials=data.materiales.map(m=>({...m})),byId=new Map(materials.map(m=>[m.id,m]));
    if(byId.size!==materials.length)throw Error('duplicate_material');
    const wasMade=MADE.has(order.estatus),willBeMade=MADE.has(status);
    if(wasMade!==willBeMade){
      if(order.matDescontado!==wasMade)throw Error('material_state_mismatch');
      const plan=order.materialesWeb;
      if(!plan||typeof plan!=='object'||Array.isArray(plan)||!Object.keys(plan).length)throw Error('missing_material_plan');
      for(const [id,quantity] of Object.entries(plan)) {
        const material=byId.get(id),stock=Number(material?.stockActual);
        if(!material||!Number.isFinite(stock)||stock<0||!Number.isFinite(quantity)||quantity<=0)throw Error('invalid_material');
        if(willBeMade&&stock<quantity)throw Error('insufficient_material');
        material.stockActual=Math.round((stock+(willBeMade?-quantity:quantity))*100)/100;
      }
      order.matDescontado=willBeMade;
    }
    order.estatus=status;const day=new Date(now).toISOString().slice(0,10);
    if(status==='Elaborado')order.fechaElab=day;
    if(status==='Entregado'||status==='Cobrado')order.fechaEntrega=day;
    const revision=data.syncRevision??0;if(!Number.isSafeInteger(revision)||revision<0)throw Error('invalid_revision');
    tx.update(ref,{peds,materiales:materials,syncRevision:revision+1,syncClient:'v10',lastWriteId:operationId,updatedAt:new Date(now).toISOString()});
    tx.create(operationRef,{orderId,status,previousStatus:expectedStatus,actor:identity.email,createdAt:now});
    return {outcome:'applied'};
  });
}
module.exports={changeWebOrderStatus};

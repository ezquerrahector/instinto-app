'use strict';
function toCents(value) {
  if(!['number','string'].includes(typeof value)||!/^\d{1,9}(\.\d{1,2})?$/.test(String(value)))return null;
  return Math.round(Number(value)*100);
}
function validatePayment(payment,purchase,config) {
  if(!/^\d{1,30}$/.test(String(payment.id))||!purchase||purchase.schemaVersion!==10)throw Error('unknown_purchase');
  if(!config.collectorId||String(payment.collector_id)!==String(config.collectorId))throw Error('collector_mismatch');
  if(typeof config.liveMode!=='boolean'||payment.live_mode!==config.liveMode)throw Error('payment_environment_mismatch');
  if(payment.external_reference!==purchase.id||payment.metadata?.instinto_purchase!==purchase.id||
     !purchase.binding||payment.metadata?.instinto_binding!==purchase.binding)throw Error('purchase_binding_mismatch');
  if(payment.currency_id!=='MXN'||toCents(payment.transaction_amount)!==purchase.totalCents)throw Error('payment_total_mismatch');
  if(!Number.isFinite(Date.parse(payment.date_last_updated)))throw Error('invalid_payment_timestamp');
}
// Call only with a fresh API response, not the webhook body or return URL.
// No public endpoint invokes this candidate yet. Rollout gates are private.
async function reconcilePayment(db,payment,{now=Date.now()}={}) {
  const id=String(payment.id),purchaseId=payment.external_reference;
  if(!/^\d{1,30}$/.test(id)||typeof purchaseId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(purchaseId))throw Error('invalid_payment_reference');
  const configRef=db.doc('instinto_private/runtime'),purchaseRef=db.doc('instinto_web_purchases/'+purchaseId),
    ledgerRef=db.doc('instinto_payment_ledger/mp_'+id),inventoryRef=db.doc('instinto/datos');
  return db.runTransaction(async tx=>{
    const configSnap=await tx.get(configRef),purchaseSnap=await tx.get(purchaseRef),ledgerSnap=await tx.get(ledgerRef);
    const config=configSnap.data()||{},purchase=purchaseSnap.data(),ledger=ledgerSnap.data();
    if(config.reconciliationEnabled!==true||config.compatibleWritesValidated!==true)throw Error('reconciliation_disabled');
    validatePayment(payment,purchase,config);
    const providerUpdatedAt=Date.parse(payment.date_last_updated);
    if(ledger?.providerUpdatedAt>=providerUpdatedAt)return {outcome:'already_processed'};
    if(ledger?.disposition==='review_required')return {outcome:'review_required'};
    const record={purchaseId,paymentId:id,status:String(payment.status),providerUpdatedAt,receivedAt:now};
    const review=reason=>{
      tx.set(ledgerRef,{...record,disposition:'review_required',reason},{merge:true});
      tx.update(purchaseRef,{reviewRequired:true,reviewReason:reason});
      return {outcome:'review_required',reason};
    };
    if(purchase.reviewRequired===true)return review('purchase_requires_review');
    // Refunds and chargebacks never replenish essence without an authorized workflow.
    if(['refunded','charged_back','in_mediation'].includes(payment.status)||Number(payment.transaction_amount_refunded)>0)return review('payment_reversal');
    if(purchase.paymentId && purchase.paymentId!==id && payment.status==='approved')return review('second_approved_payment');
    if(purchase.paymentId===id) {
      tx.set(ledgerRef,{...record,disposition:'applied'},{merge:true});return {outcome:'already_applied'};
    }
    if(payment.status!=='approved') {
      tx.set(ledgerRef,{...record,disposition:'waiting'},{merge:true});return {outcome:'waiting'};
    }
    if(purchase.state!=='awaiting_payment')return review('purchase_not_payable');
    if(!Number.isFinite(Date.parse(payment.date_approved))||Date.parse(payment.date_approved)>purchase.expiresAt)return review('late_payment');
    const inventorySnap=await tx.get(inventoryRef),inventory=inventorySnap.data();
    if(!inventory||!Array.isArray(inventory.cat)||!Array.isArray(inventory.peds))return review('inventory_invalid');
    if(!Array.isArray(purchase.items)||!purchase.items.length)return review('purchase_invalid');
    const catalog=inventory.cat.map(x=>({...x})),byId=new Map(catalog.map(x=>[x.id,x]));
    if(byId.size!==catalog.length)return review('duplicate_catalog_id');
    const demands=new Map();let units=0;
    for(const item of purchase.items) {
      if(![60,100].includes(item.size)||!Number.isSafeInteger(item.qty)||item.qty<1||item.qty>5||
        item.gramsPerUnit!==({60:30,100:50})[item.size]||item.unitPriceCents!==({60:31000,100:49000})[item.size])return review('purchase_invalid');
      units+=item.qty;demands.set(item.id,(demands.get(item.id)||0)+item.gramsPerUnit*item.qty);
    }
    if(units>12)return review('purchase_invalid');
    if(!Number.isSafeInteger(purchase.shippingCents)||purchase.shippingCents<=0||
       purchase.items.reduce((sum,i)=>sum+i.unitPriceCents*i.qty,0)+purchase.shippingCents!==purchase.totalCents)return review('purchase_invalid');
    for(const [sku,grams] of demands) {
      const entry=byId.get(sku),stock=Number(entry?.stockGramos);
      if(!entry||!Number.isFinite(stock)||stock<grams)return review('insufficient_stock');
      entry.stockGramos=Math.round((stock-grams)*100)/100;
    }
    const peds=inventory.peds.map(p=>({...p}));
    if(peds.some(p=>p.folioWeb===purchaseId))return review('existing_orders_without_ledger');
    let nextId=1;
    for(const p of peds){if(!Number.isSafeInteger(p.id)||p.id<0)return review('admin_ids_invalid');nextId=Math.max(nextId,p.id+1);}
    const adminIds=[],date=new Date(now).toISOString(),day=date.slice(0,10);
    for(const item of purchase.items)for(let unit=0;unit<item.qty;unit++) {
      if(!Number.isSafeInteger(nextId))return review('admin_ids_invalid');
      const adminId=nextId++;adminIds.push(adminId);
      peds.push({id:adminId,uid:'WEB-'+purchaseId+'-'+adminIds.length,folioWeb:purchaseId,pagoId:id,
        origenWeb:true,pagoConfirmadoServidor:true,esenciaDescontada:true,matDescontado:false,
        creadoEn:date,fecha:day,cliente:[purchase.address.firstName,purchase.address.lastName].join(' '),
        codigo:item.id,fragancia:item.name,disenador:item.brand,linea:item.linea,presentacionMl:item.size,
        gramosEsencia:item.gramsPerUnit,precio:item.unitPriceCents/100,costoEsencia:item.costoEsencia,
        materialesWeb:item.materialsPerUnit,estatus:'Pedido',canal:'Web',fechaPromesa:'',
        notas:item.gift?'Regalo: '+item.giftText:'',emailNuevoEnviado:false});
    }
    // Stay below Firestore's 1 MiB document limit, including field overhead.
    if(Buffer.byteLength(JSON.stringify({...inventory,cat:catalog,peds}))>850000)return review('inventory_document_capacity');
    const revision=inventory.syncRevision??0;
    if(!Number.isSafeInteger(revision)||revision<0)return review('inventory_revision_invalid');
    tx.update(inventoryRef,{cat:catalog,peds,syncRevision:revision+1,syncClient:'v10',lastWriteId:'mp_'+id,updatedAt:date});
    tx.update(purchaseRef,{state:'paid',paymentId:id,paidAt:now,adminOrderIds:adminIds});
    tx.set(ledgerRef,{...record,disposition:'applied',adminOrderIds:adminIds},{merge:true});
    // Durable task, not an email side effect inside a retryable transaction.
    tx.create(db.doc('instinto_web_outbox/paid_'+purchaseId),{type:'purchase_paid',purchaseId,state:'pending',createdAt:now});
    return {outcome:'applied',adminOrderIds:adminIds};
  });
}
module.exports={toCents,validatePayment,reconcilePayment};

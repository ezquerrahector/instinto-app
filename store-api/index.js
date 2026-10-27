"use strict";
const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
const crypto=require('node:crypto');
admin.initializeApp();
const db=admin.firestore();
const TEST_KEY=defineSecret('INSTINTO_V7_TEST_KEY');
const {isAllowedIdentity}=require('./access');
const ALLOWED=new Set(['https://instintofragancias.com','https://www.instintofragancias.com','https://ezquerrahector.github.io']);
const PRICES={60:310,100:490},GRAMS={60:30,100:50};
const HOLD_MS=15*60*1000;
const clean=(v,n=150)=>String(v??'').trim().slice(0,n);
const gender=x=>{const s=clean(x).toLowerCase();return ({dama:'Dama',caballero:'Caballero',unisex:'Unisex'})[s]||null};
function failure(code,message){const e=new Error(message);e.status=code;throw e}
function verifyPass(s){const a=Buffer.from(clean(s,200));const b=Buffer.from(TEST_KEY.value());return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function publicCatalog(data){return (Array.isArray(data.cat)?data.cat:[]).flatMap(x=>{
 const id=clean(x.id,80),brand=clean(x.disenador),name=clean(x.referencia),g=gender(x.linea),stock=Number(x.stockGramos);
 if(!id||!brand||!name||!g||!Number.isFinite(stock)||stock<30)return [];
 const availableSizes=[60];if(stock>=50)availableSizes.push(100);
 return [{id,code:id,brand,name,gender:g,availableSizes}];
})}
function parseInput(body){
 if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>8)failure(400,'El pedido requiere de 1 a 8 fragancias diferentes');
 let totalUnits=0;const keys=new Set();
 const items=body.items.map(x=>{
  const id=clean(x.id,80),size=Number(x.size),qty=Number(x.qty);
  if(!id||![60,100].includes(size)||!Number.isInteger(qty)||qty<1||qty>5)failure(400,'Cantidad o presentación inválida');
  const key=id+'_'+size;if(keys.has(key))failure(400,'Repetiste una presentación');keys.add(key);totalUnits+=qty;
  return {id,size,qty,gift:!!x.gift,giftText:x.gift?clean(x.giftText,60):''};
 });
 if(totalUnits>12)failure(400,'Máximo 12 frascos por prueba');
 const a=body.address||{};const address={};for(const k of ['firstName','lastName','email','phone','postal','state','city','colony','street','references'])address[k]=clean(a[k],k==='references'?250:120);
 if(['firstName','lastName','email','phone','postal','state','city','colony','street'].some(k=>!address[k]))failure(400,'Faltan datos de entrega');
 if(!/^\d{5}$/.test(address.postal)||!/^\S+@\S+\.\S+$/.test(address.email)||!/^\+?[\d\s()-]{10,20}$/.test(address.phone))failure(400,'Revisa correo, teléfono y código postal');
 return {items,address};
}
exports.storeApi=onRequest({region:'us-central1',memory:'256MiB',timeoutSeconds:45,maxInstances:3,secrets:[TEST_KEY]},async(req,res)=>{
 const origin=req.get('origin');if(origin&&ALLOWED.has(origin))res.set('Access-Control-Allow-Origin',origin);
 res.set('Vary','Origin');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','no-store');
 res.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type,X-Instinto-Test-Key,Authorization');
 if(req.method==='OPTIONS')return res.status(origin&&!ALLOWED.has(origin)?403:204).end();
 if(origin&&!ALLOWED.has(origin))return res.status(403).json({error:'Origen no autorizado'});
 const path=req.path.replace(/\/+$/,'');
 try{
  if(path==='/api/catalog'&&req.method==='GET'){
   const snap=await db.doc('instinto/datos').get();if(!snap.exists)failure(503,'Inventario no disponible');
   const products=publicCatalog(snap.data());res.set('Cache-Control','public,max-age=15,s-maxage=15');
   return res.json({products,mode:'test',inventoryUpdatedAt:snap.data().updatedAt||null});
  }
  if(path==='/api/admin/orders'&&req.method==='GET'){
   // Solo Firebase Auth verificado, correo Google validado y autorizado en Secret Manager.
   const authHeader=String(req.get('authorization')||'');
   if(!authHeader.startsWith('Bearer '))failure(401,'Inicia sesión como administrador');
   let identity;
   try {identity=await admin.auth().verifyIdToken(authHeader.slice(7),true)}
   catch(_){failure(401,'Sesión inválida o vencida')}
   if(!isAllowedIdentity(identity))
     failure(403,'Esta cuenta no está autorizada para consultar los pedidos');
   const limit=Math.min(Math.max(Number(req.query.limit)||30,1),50);
   const collection=db.collection('instinto_tienda_v7_pedidos_prueba');
   const snapshot=await collection.orderBy('createdAt','desc').limit(limit).get();
   const orders=snapshot.docs.map(doc=>{
     const x=doc.data();
     const date=v=>v?.toDate?.()?.toISOString?.()||null;
     return {id:doc.id,type:x.type||'TEST_ONLY',status:x.status||'',paymentStatus:x.paymentStatus||'',
       currency:x.currency||'MXN',subtotal:x.subtotal||0,shippingAmount:x.shippingAmount??null,
       items:Array.isArray(x.items)?x.items.map(i=>({id:i.id,name:i.name,brand:i.brand,size:i.size,qty:i.qty,grams:i.grams,gift:!!i.gift,giftText:i.giftText||'',unitPrice:i.unitPrice})):[],
       address:x.address||{},createdAt:date(x.createdAt),expiresAt:date(x.expiresAt)};
   });
   return res.json({orders,readOnly:true,source:'instinto_tienda_v7_pedidos_prueba'});
  }
  if(path==='/api/admin/inventory-audit'&&req.method==='GET'){
   // Solo lectura: exige usuario autenticado, Google verificado y correo autorizado.
   const authHeader=String(req.get('authorization')||'');
   if(!authHeader.startsWith('Bearer '))failure(401,'Inicia sesión como administrador');
   let identity;
   try {identity=await admin.auth().verifyIdToken(authHeader.slice(7),true)}
   catch(_){failure(401,'Sesión inválida o vencida')}
   if(!isAllowedIdentity(identity))
     failure(403,'Esta cuenta no está autorizada');
   const inventorySnap=await db.doc('instinto/datos').get();
   if(!inventorySnap.exists)failure(503,'Inventario no disponible');
   const data=inventorySnap.data();
   const catalog=Array.isArray(data.cat)?data.cat:[];
   const reservations=await db.collection('instinto_tienda_v7_reservas_prueba').get();
   const now=Date.now(),activeById=new Map();let activeHolds=0,expiredHolds=0,invalidHolds=0;
   for(const r of reservations.docs){
     const holds=r.data().holds||{};let total=0;
     for(const hold of Object.values(holds)){
       const expiry=Number(hold?.expiresAt),grams=Number(hold?.grams);
       if(!Number.isFinite(expiry)||!Number.isFinite(grams)||grams<0){invalidHolds++;continue}
       if(expiry<=now){expiredHolds++;continue}
       total+=grams;activeHolds++;
     }
     if(total>0)activeById.set(r.id,total);
   }
   const allIds=new Set(),issues=[];let available60=0,available100=0,zeroStock=0;
   for(const x of catalog){
     const id=clean(x.id,80),stock=Number(x.stockGramos),reserved=activeById.get(id)||0;
     if(!id||allIds.has(id)){if(issues.length<80)issues.push({id:id||'(sin código)',issue:'ID ausente o duplicado'});continue}
     allIds.add(id);
     if(!Number.isFinite(stock)||stock<0){if(issues.length<80)issues.push({id,issue:'Stock inválido'});continue}
     if(stock===0)zeroStock++;
     const effective=stock-reserved;
     if(effective<0&&issues.length<80)issues.push({id,issue:'Reservas de prueba mayores al stock',stockGramos:stock,reservedGrams:reserved});
     if(effective>=30)available60++;
     if(effective>=50)available100++;
   }
   for(const [id,reserved] of activeById){if(!allIds.has(id)&&issues.length<80)issues.push({id,issue:'Reserva sin producto en catálogo',reservedGrams:reserved})}
   return res.json({mode:'READ_ONLY',scope:'Diagnóstico provisional, no sincronización transaccional',checkedAt:new Date(now).toISOString(),
     catalogCount:catalog.length,adminOrdersCount:Array.isArray(data.peds)?data.peds.length:null,
     inventoryUpdatedAt:data.updatedAt||null,zeroStock,available60,available100,
     activeHolds,expiredHolds,invalidHolds,skuWithActiveHolds:activeById.size,
     issuesTruncated:issues.length===80,issues,
     warning:'El sistema administrativo usa ref.set de documento completo. No activar pagos/descuentos hasta migrar escrituras y comprobar reglas de Firestore.'});
  }
  if(path==='/api/orders/test'&&req.method==='POST'){
   if(!verifyPass(req.get('X-Instinto-Test-Key')))failure(403,'Clave de pruebas incorrecta');
   if(Number(req.get('content-length')||0)>16000)failure(413,'Pedido demasiado grande');
   const {items,address}=parseInput(req.body);
   const now=Date.now(),orderRef=db.collection('instinto_tienda_v7_pedidos_prueba').doc();
   const result=await db.runTransaction(async tx=>{
    const snap=await tx.get(db.doc('instinto/datos'));
    if(!snap.exists)failure(503,'Inventario no disponible');
    const all=Array.isArray(snap.data().cat)?snap.data().cat:[];
    const byId=new Map(all.map(x=>[clean(x.id,80),x]));
    const demands=new Map(),productInfo=[];
    for(const item of items){
     const entry=byId.get(item.id);if(!entry||!gender(entry.linea))failure(409,'Fragancia no disponible: '+item.id);
     const stock=Number(entry.stockGramos),required=GRAMS[item.size]*item.qty;
     if(!Number.isFinite(stock)||stock<required)failure(409,'Existencias insuficientes para '+clean(entry.referencia));
     demands.set(item.id,(demands.get(item.id)||0)+required);
     productInfo.push({...item,brand:clean(entry.disenador),name:clean(entry.referencia),grams:required,unitPrice:PRICES[item.size]});
    }
    const refs=[...demands.keys()].sort().map(id=>({id,ref:db.collection('instinto_tienda_v7_reservas_prueba').doc(id)}));
    const snaps=[];for(const r of refs)snaps.push(await tx.get(r.ref));
    for(let i=0;i<refs.length;i++){
     const {id,ref}=refs[i];const doc=snaps[i].data()||{};const active=Object.fromEntries(Object.entries(doc.holds||{}).filter(([,h])=>Number(h.expiresAt)>now));
     if(Object.keys(active).length>100)failure(429,'Demasiadas reservas de prueba en curso');
     const reserved=Object.values(active).reduce((s,h)=>s+Number(h.grams||0),0);
     const current=Number(byId.get(id).stockGramos);
     if(current-reserved<demands.get(id))failure(409,'La existencia cambió para '+id+'. Actualiza la página e inténtalo de nuevo.');
     active[orderRef.id]={grams:demands.get(id),expiresAt:now+HOLD_MS};
     tx.set(ref,{sku:id,holds:active,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
    }
    const subtotal=productInfo.reduce((s,x)=>s+x.unitPrice*x.qty,0);
    tx.create(orderRef,{type:'TEST_ONLY',status:'reserva_provisional',inventoryMode:'NO_DEDUCT_ADMIN_STOCK',items:productInfo,address,subtotal,shippingAmount:null,total:null,currency:'MXN',paymentStatus:'not_enabled',expiresAt:admin.firestore.Timestamp.fromMillis(now+HOLD_MS),createdAt:admin.firestore.FieldValue.serverTimestamp()});
    return {orderId:orderRef.id,subtotal,expiresAt:new Date(now+HOLD_MS).toISOString()};
   },{maxAttempts:3});
   return res.status(201).json({...result,status:'reserva_provisional',shipping:'pending',payment:'disabled',message:'Pedido de prueba registrado. No se cobró ni se descontó inventario administrativo.'});
  }
  return res.status(404).json({error:'Ruta no disponible'});
 }catch(e){const status=e.status||500;if(status===500)console.error('INSTINTO V7 internal',e);return res.status(status).json({error:status===500?'Error interno al registrar la prueba':e.message});}
});

'use strict';
// HTTP boundary for the existing transactional production method.
// Identity always comes from a verified, revocation-checked Firebase token.
const {changeWebOrderStatus}=require('./production');
const ORIGIN='https://ezquerrahector.github.io';
const codes={forbidden:403,invalid_transition:400,operation_reused:409,
  production_disabled:503,invalid_inventory:409,order_not_found:404,
  not_prepaid_web_order:409,status_conflict:409,duplicate_material:409,
  material_state_mismatch:409,missing_material_plan:409,invalid_material:409,
  insufficient_material:409,invalid_revision:409};
function createAdminStatusHandler({db,verifyIdToken,changeStatus=changeWebOrderStatus}) {
  return async (req,res)=>{
    const origin=req.get('origin');
    res.set('Vary','Origin');res.set('Cache-Control','no-store');
    res.set('X-Content-Type-Options','nosniff');
    res.set('Access-Control-Allow-Methods','POST,OPTIONS');
    res.set('Access-Control-Allow-Headers','Content-Type,Authorization');
    if(origin===ORIGIN)res.set('Access-Control-Allow-Origin',origin);
    if(origin&&origin!==ORIGIN)return res.status(403).json({error:'forbidden_origin'});
    if(req.method==='OPTIONS')return res.status(204).end();
    if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
    if(Buffer.byteLength(JSON.stringify(req.body??{}))>4096)return res.status(413).json({error:'request_too_large'});
    const header=req.get('authorization')||'';
    if(!header.startsWith('Bearer ')||header.length>8192)return res.status(401).json({error:'authentication_required'});
    let identity;
    try {identity=await verifyIdToken(header.slice(7),true);}
    catch {return res.status(401).json({error:'invalid_session'});}
    const {orderId,status,expectedStatus,operationId}=req.body||{};
    try {
      const result=await changeStatus(db,{orderId,status,expectedStatus,operationId},identity);
      return res.json(result);
    } catch(e) {
      const statusCode=codes[e.message];
      if(!statusCode)console.error('admin_status_failed');
      return res.status(statusCode||500).json({error:statusCode?e.message:'internal_error'});
    }
  };
}
module.exports={createAdminStatusHandler};

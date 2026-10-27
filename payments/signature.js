'use strict';
const crypto = require('node:crypto');
function scalar(s) { return typeof s === 'string' ? s : ''; }
function equalHex(a,b) {
  if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a.toLowerCase(),'hex'),Buffer.from(b.toLowerCase(),'hex'));
}
function validSignature(req, secret, now = Date.now()) {
  const sig = scalar(req.get('x-signature'));
  const reqId = scalar(req.get('x-request-id'));
  const parts = Object.fromEntries(sig.split(',').map(x=>x.trim().split('=',2)));
  const ts = scalar(parts.ts), v1=scalar(parts.v1);
  // Mercado Pago usa el data.id de la URL; verificar que coincide con el cuerpo si hay ambos.
  const urlId = scalar(req.query['data.id']);
  const bodyId = String(req.body?.data?.id ?? '');
  if(urlId && bodyId && urlId !== bodyId) return false;
  const dataId = urlId.toLowerCase();
  if (!dataId || !reqId || !/^\d{10,16}$/.test(ts) || !v1 || !secret) return false;
  const timestamp = Number(ts);
  const ms = ts.length >= 13 ? timestamp : timestamp * 1000;
  if (!Number.isFinite(ms) || Math.abs(now-ms)>10*60*1000) return false;
  const canonical = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = crypto.createHmac('sha256',secret).update(canonical).digest('hex');
  return equalHex(expected,v1);
}
module.exports = {validSignature};

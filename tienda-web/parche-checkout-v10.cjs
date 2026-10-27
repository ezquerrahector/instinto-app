// Aplica el checkout V10 a tienda-web/index.html sustituyendo SOLO funciones del script principal
// (loadCatalog, quoteShipping, pay) y dos sentencias que deshabilitaban la cotización.
// El HTML, estilos, video, carrito y textos de marca no se tocan. Uso:
//   node tienda-web/parche-checkout-v10.cjs tienda-web/index.html
'use strict';
const fs = require('fs');
const acorn = require(process.env.ACORN || 'acorn');
const file = process.argv[2];
let html = fs.readFileSync(file, 'utf8');
if (html.includes('INSTINTO_CHECKOUT_V10')) { console.log('ya aplicado'); process.exit(0); }

const re = /<script>([\s\S]*?)<\/script>/g; let m, best = null;
while ((m = re.exec(html))) if (!best || m[1].length > best[1].length) best = m;
const js = best[1], base = best.index + '<script>'.length;
const ast = acorn.parse(js, {ecmaVersion: 2022});
const edits = [];
const fn = name => ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === name);
const stmt = test => ast.body.filter(n => n.type === 'ExpressionStatement' && test(js.slice(n.start, n.end)));

const NEW_LOAD = `async function loadCatalog(){/* INSTINTO_CHECKOUT_V10 */
 if(/\\/storeApi$/.test(CONFIG.apiBase))CONFIG.apiBase=CONFIG.apiBase.replace(/storeApi$/,'checkoutApi');
 if(!CONFIG.apiBase){products=REFERENCE_PRODUCTS.map(p=>({...p,availableSizes:[]}));catalogIsLive=false;ready();return}
 try{const res=await fetch(CONFIG.apiBase+CONFIG.catalogEndpoint,{cache:'no-store'});
  if(!res.ok)throw Error('No se pudo consultar el inventario');const result=await res.json();
  if(!Array.isArray(result.products))throw Error('Formato de catálogo inválido');
  products=result.products.filter(p=>p.id&&p.brand&&p.name&&Array.isArray(p.availableSizes)).map(p=>({...p,availableSizes:p.availableSizes.map(Number)}));
  catalogIsLive=true;checkoutEnabled=result.checkoutEnabled===true;
  if(result.prices)for(const [k,v] of Object.entries(result.prices))if(Number(v)>0)CONFIG.prices[k]=Number(v);
  enabledSizes=Array.isArray(result.enabledSizes)&&result.enabledSizes.length?result.enabledSizes.map(Number):[60];
  document.querySelectorAll('[data-size]').forEach(b=>{const on=enabledSizes.includes(Number(b.dataset.size));b.hidden=!on;b.style.display=on?'':'none'});
  if(!enabledSizes.includes(size)){size=enabledSizes[0];document.querySelectorAll('[data-size]').forEach(x=>x.classList.toggle('active',Number(x.dataset.size)===size))}
  $('displayPrice').textContent=money(CONFIG.prices[size]);
  $('modeNotice').textContent=result.mode==='live'?'ENVÍOS A TODO MÉXICO · PAGO SEGURO CON MERCADO PAGO':result.mode==='sandbox'?'MODO DE PRUEBA · PAGOS DE PRUEBA, SIN CARGOS REALES':'CATÁLOGO CONECTADO · COMPRA EN LÍNEA PRÓXIMAMENTE';
  const intro=document.querySelector('#checkout > .status');if(intro)intro.textContent=checkoutEnabled?'Cotiza tu envío con tu domicilio y paga de forma segura con Mercado Pago. El pedido se confirma cuando Mercado Pago aprueba el pago.':'La compra en línea estará disponible muy pronto.';
 }catch(e){products=[];catalogIsLive=false;const local=location.protocol==='file:';
  const hint=local?'Abre esta tienda desde su dirección HTTPS, no con doble clic en el HTML.':\`Error de conexión: \${e.message}. Intenta de nuevo en unos minutos.\`;
  $('modeNotice').textContent='No se cargó el catálogo. '+hint;console.error('INSTINTO catálogo:',e)}
 ready();checkReturn()}
let checkoutEnabled=false,enabledSizes=[60],quoteId=null,purchaseAttempt=null;
const PENDING_KEY='instinto_compra_pendiente';
function storeGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function storeSet(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch{}}
function cartSignature(){return JSON.stringify([cart.map(({id,size,qty,gift,giftText})=>[id,size,qty,!!gift,gift?giftText||'':'']),details(),quoteId,selectedQuote])}
async function checkReturn(){
 const pending=storeGet(PENDING_KEY);if(!pending||!pending.id||!pending.b)return;
 const box=$('checkoutMessage');openCart();$('checkout').classList.remove('hidden');
 box.textContent='Consultando el estado de tu pago con el servidor…';
 for(let i=0;i<20;i++){
  try{const r=await fetch(CONFIG.apiBase+'/api/checkout/status?id='+encodeURIComponent(pending.id)+'&b='+encodeURIComponent(pending.b),{cache:'no-store'});
   const s=await r.json();if(!r.ok)throw Error(s.error||'estado');
   if(s.state==='paid'){box.textContent='✓ PAGO CONFIRMADO · Folio '+s.purchaseId.slice(1,9).toUpperCase()+' · Total '+money(s.total)+'. Te avisaremos por correo cuando tu pedido se envíe. Guarda este folio.';storeSet(PENDING_KEY,null);cart=[];renderCart();return}
   if(s.state==='expired'||s.state==='cancelled'||s.state==='refunded'){box.textContent=s.label+'. Si se realizó un cargo, contáctanos con tu folio '+s.purchaseId.slice(1,9).toUpperCase()+'.';storeSet(PENDING_KEY,null);return}
   box.textContent=s.label+' · Folio '+s.purchaseId.slice(1,9).toUpperCase()+'. Esta página se actualiza sola.';
  }catch(e){box.textContent='No pudimos consultar tu pago todavía. Reintentando…'}
  await new Promise(r=>setTimeout(r,i<5?3000:8000))}
 box.textContent+=' Si ya pagaste, tu pedido se confirmará en unos minutos aunque cierres esta página.'}`;

const NEW_QUOTE = `async function quoteShipping(){try{
 if(!CONFIG.apiBase||!checkoutEnabled)throw Error('La compra en línea estará disponible muy pronto.');
 if(!cart.length)throw Error('Agrega una fragancia.');
 const d=validateDetails();$('quoteShipping').disabled=true;$('shippingOptions').textContent='Cotizando con paqueterías…';
 const r=await fetch(CONFIG.apiBase+CONFIG.shippingEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({address:d,items:cart.map(({id,size,qty,gift,giftText})=>({id,size,qty,gift:!!gift,giftText:gift?giftText||'':''}))})});
 const data=await r.json().catch(()=>({}));
 const errors={insufficient_stock:'Una de tus fragancias ya no tiene existencia suficiente. Ajusta tu selección.',invalid_address:'Revisa código postal, estado, ciudad y colonia.',
  no_shipping_options:'No encontramos paqueterías para este domicilio.',too_many_requests:'Demasiados intentos. Espera un minuto.',size_not_enabled:'Esa presentación no está disponible en línea.'};
 if(!r.ok||!Array.isArray(data.options))throw Error(errors[data.error]||'No fue posible cotizar el envío. Intenta de nuevo.');
 quotes=data.options.filter(x=>x.id&&Number.isFinite(Number(x.amount))&&Number(x.amount)>0);quoteId=data.quoteId;
 if(!quotes.length)throw Error('No hay opciones de envío para este domicilio.');
 $('shippingOptions').innerHTML='<label class="caps">Selecciona envío</label>'+quotes.map((q,i)=>\`<label style="display:block;padding:10px 0"><input type="radio" name="ship" value="\${i}" \${i===0?'checked':''}> \${safe(q.name)} · \${money(Number(q.amount))} \${q.eta?safe(q.eta):''}</label>\`).join('');
 setShipping(0);$('checkoutMessage').textContent=''}catch(e){resetQuote();quoteId=null;$('shippingOptions').textContent=e.message;renderCart()}finally{$('quoteShipping').disabled=false}}`;

const NEW_PAY = `async function pay(){try{
 if(!cart.length)throw Error('Agrega una fragancia.');
 if($('checkout').classList.contains('hidden')){$('checkout').classList.remove('hidden');renderCart();$('checkout').scrollIntoView({behavior:'smooth',block:'nearest'});return}
 if(!checkoutEnabled)throw Error('La compra en línea estará disponible muy pronto.');
 const address=validateDetails();
 if(!shipping||!quoteId||!selectedQuote)throw Error('Cotiza y selecciona tu envío antes de pagar.');
 const signature=cartSignature();
 if(!purchaseAttempt||purchaseAttempt.signature!==signature)purchaseAttempt={signature,requestId:crypto.randomUUID().replace(/-/g,'')};
 $('checkoutBtn').disabled=true;$('checkoutMessage').textContent='Apartando tus fragancias y preparando el pago seguro…';
 const r=await fetch(CONFIG.apiBase+CONFIG.checkoutEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({requestId:purchaseAttempt.requestId,quoteId,rateId:selectedQuote,address,items:cart.map(({id,size,qty,gift,giftText})=>({id,size,qty,gift:!!gift,giftText:gift?giftText||'':''}))})});
 const data=await r.json().catch(()=>({}));
 const errors={insufficient_stock:'Una fragancia se agotó mientras comprabas. Ajusta tu selección.',quote_expired_or_changed:'Tu cotización venció o cambió. Vuelve a cotizar el envío.',
  invalid_shipping_rate:'Vuelve a cotizar el envío.',payment_provider_retry:'Mercado Pago no respondió. Presiona pagar de nuevo; no se duplicará tu pedido.',
  too_many_requests:'Demasiados intentos. Espera un minuto.',purchase_expired:'Tu apartado venció. Vuelve a cotizar.',request_reused:'Tu carrito cambió. Vuelve a cotizar.'};
 if(!r.ok||!data.initPoint){if(['quote_expired_or_changed','invalid_shipping_rate','purchase_expired','request_reused'].includes(data.error)){resetQuote();quoteId=null;purchaseAttempt=null}
  throw Error(errors[data.error]||'No se pudo iniciar el pago. Intenta de nuevo.')}
 storeSet(PENDING_KEY,{id:data.purchaseId,b:data.binding,at:Date.now()});
 $('checkoutMessage').textContent='Total '+money(data.total)+' (incluye envío '+money(data.shipping)+'). Te llevamos a Mercado Pago…';
 location.assign(data.initPoint)}catch(e){$('checkoutMessage').textContent=e.message;renderCart()}}`;

edits.push([fn('loadCatalog'), NEW_LOAD], [fn('quoteShipping'), NEW_QUOTE], [fn('pay'), NEW_PAY]);
const dis = stmt(s => s.startsWith("$('quoteShipping').disabled=true"));
const txt = stmt(s => s.startsWith("$('quoteShipping').textContent="));
if (dis.length !== 1 || txt.length !== 1) throw Error('sentencias de cotización no encontradas');
edits.push([dis[0], "$('quoteShipping').addEventListener('click',quoteShipping);"], [txt[0], "$('quoteShipping').textContent='COTIZAR ENVÍO';"]);
for (const [node] of edits) if (!node) throw Error('función no encontrada');
edits.sort((a, b) => b[0].start - a[0].start);
for (const [node, code] of edits) html = html.slice(0, base + node.start) + code + html.slice(base + node.end);
// Etiquetas del botón principal (renderCart) y aviso inicial.
const swaps = [["'CONTINUAR CON PRUEBA →'", "'CONTINUAR CON EL PEDIDO →'"], ["'REGISTRAR PEDIDO DE PRUEBA →'", "(checkoutEnabled?'PAGAR CON MERCADO PAGO →':'COMPRA EN LÍNEA PRÓXIMAMENTE')"],
  ['Prueba interna: el pedido se guardará en Firebase sin cobro ni envío. No compartas la clave de prueba.', 'Cotiza tu envío con tu domicilio y paga de forma segura con Mercado Pago.']];
swaps.push(['<script src="config.js">', '<script src="config.js?v=10.1">']);
for (const [a, b] of swaps) { if (!html.includes(a)) throw Error('texto no encontrado: ' + a); html = html.replace(a, b); }
if (html.includes('X-Instinto-Test-Key')) throw Error('quedó la clave de prueba');
acorn.parse(/<script>([\s\S]*?)<\/script>/g.exec(html.slice(best.index))[1], {ecmaVersion: 2022});
fs.writeFileSync(file, html);
console.log('parche aplicado', html.length);

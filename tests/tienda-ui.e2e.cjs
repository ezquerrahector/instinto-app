// Prueba de interfaz de la tienda parchada con Chromium y API simulada (sin red externa).
// Uso: node tests/tienda-ui.e2e.cjs   (requiere playwright instalado en el entorno)
'use strict';
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..', 'tienda-web');
const API = 'https://us-central1-instinto-fragancias.cloudfunctions.net/checkoutApi';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const calls = [];
  let paid = false;
  await page.route('https://instintofragancias.com/**', async route => {
    const u = new URL(route.request().url());
    const f = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
    if (f === 'config.js') return route.fulfill({contentType: 'application/javascript', body: `window.INSTINTO_API_BASE='${API}';`});
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) return route.fulfill({status: 404, body: ''});
    route.fulfill({body: fs.readFileSync(p), contentType: f.endsWith('.html') ? 'text/html' : f.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'});
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({body: ''}));
  await page.route(API + '/**', async route => {
    const req = route.request(), u = new URL(req.url()); calls.push([req.method(), u.pathname, req.postData()]);
    const json = (b, s = 200) => route.fulfill({status: s, contentType: 'application/json', headers: {'access-control-allow-origin': 'https://instintofragancias.com'}, body: JSON.stringify(b)});
    if (u.pathname.endsWith('/api/catalog')) return json({mode: 'sandbox', checkoutEnabled: true, enabledSizes: [60], prices: {60: 310},
      products: [{id: 'DP1-TEST', code: 'DP1', brand: 'MARCA', name: 'FRAGANCIA DAMA', gender: 'Dama', availableSizes: [60]}]});
    if (u.pathname.endsWith('/api/shipping/quote')) return json({quoteId: 'q1', options: [{id: 'r1', name: 'Sendex · Reg', amount: 51.25, eta: '2 días hábiles'}]});
    if (u.pathname.endsWith('/api/checkout')) return json({purchaseId: 'w' + 'a'.repeat(24), binding: 'b'.repeat(48), total: 361.25, shipping: 51.25,
      initPoint: 'https://instintofragancias.com/?payment=success&simulado=1'}, 201);
    if (u.pathname.endsWith('/api/checkout/status')) return json({purchaseId: 'w' + 'a'.repeat(24), state: paid ? 'paid' : 'awaiting_payment',
      label: paid ? 'Pago confirmado' : 'Esperando confirmación de pago', total: 361.25});
    return json({error: 'not_found'}, 404);
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('https://instintofragancias.com/');
  await page.waitForFunction(() => document.getElementById('modeNotice').textContent.includes('MODO DE PRUEBA'));
  assert.equal(await page.locator('[data-size="100"]').isVisible(), false, '100 ml oculto');
  assert.ok(await page.locator('video').count() >= 1, 'video conservado');
  await page.selectOption('#designer', 'MARCA');
  await page.selectOption('#fragrance', 'DP1-TEST');
  await page.click('#addSelected');
  await page.click('#checkoutBtn');
  for (const [id, v] of Object.entries({firstName: 'Ana', lastName: 'Prueba', email: 'ana@example.com', phone: '4771234567', postal: '06600',
    state: 'Ciudad de México', city: 'Cuauhtémoc', colony: 'Juárez', street: 'Calle 1 #2'})) await page.fill('#' + id, v);
  assert.equal(await page.locator('#checkoutBtn').textContent(), 'PAGAR CON MERCADO PAGO →');
  await page.click('#checkoutBtn');
  assert.match(await page.locator('#checkoutMessage').textContent(), /Cotiza y selecciona tu envío/);
  await page.click('#quoteShipping');
  await page.waitForSelector('input[name="ship"]');
  assert.match(await page.locator('#total').textContent(), /361/);
  await page.screenshot({path: process.env.SHOT || '/tmp/tienda-checkout.png', fullPage: false});
  await Promise.all([page.waitForURL(/simulado=1/), page.click('#checkoutBtn')]);
  const body = JSON.parse(calls.find(c => c[1].endsWith('/api/checkout'))[2]);
  assert.equal(body.quoteId, 'q1'); assert.equal(body.rateId, 'r1'); assert.ok(/^[a-f0-9]{32}$/.test(body.requestId));
  assert.equal(body.total, undefined, 'el navegador no envía totales');
  // Al volver de Mercado Pago, el estado viene SOLO del servidor.
  await page.waitForFunction(() => /Esperando confirmación/.test(document.getElementById('checkoutMessage').textContent));
  paid = true;
  await page.waitForFunction(() => /PAGO CONFIRMADO/.test(document.getElementById('checkoutMessage').textContent), null, {timeout: 15000});
  assert.deepEqual(errors, []);
  console.log('OK tienda UI: catálogo, 100 ml oculto, video, cotización, pago, retorno confirmado por servidor; llamadas:', calls.map(c => c[1].split('/api/')[1]).join(','));
  await browser.close();
})().catch(e => { console.error('FALLO', e); process.exit(1); });

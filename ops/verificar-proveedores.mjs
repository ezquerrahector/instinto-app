// INSTINTO V10 — verificación de proveedores SIN exponer secretos ni crear cargos/guías.
// Ejecutar en Cloud Shell: node ops/verificar-proveedores.mjs
// Lee secretos de Secret Manager en memoria; imprime solo metadatos no sensibles.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {createShippingClient} = require('../payments/shipping.js');
const secret = name => execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret', name],
  {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
const report = {fecha: new Date().toISOString()};

try {
  const token = secret('INSTINTO_MP_ACCESS_TOKEN');
  report.mercadoPago = {tipoCredencial: token.startsWith('TEST-') ? 'TEST' : token.startsWith('APP_USR-') ? 'APP_USR (productiva o de usuario de prueba)' : 'desconocido'};
  const me = await fetch('https://api.mercadopago.com/users/me', {headers: {Authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(10000)});
  report.mercadoPago.usersMe = me.status;
  if (me.ok) {
    const u = await me.json();
    report.mercadoPago.collectorId = u.id; report.mercadoPago.siteId = u.site_id;
    report.mercadoPago.esUsuarioDePrueba = Array.isArray(u.tags) ? u.tags.includes('test_user') : null;
    report.mercadoPago.tags = u.tags;
  }
} catch (e) { report.mercadoPago = {error: e.message.split('\n')[0]}; }

try {
  const raw = secret('INSTINTO_SKYDROPX_CREDENTIALS');
  let creds; try { creds = JSON.parse(raw); } catch { const [client_id, client_secret] = raw.split(/[:\n]/); creds = {client_id, client_secret}; }
  report.skydropx = {formatoCredencial: Object.keys(creds).sort()};
  const client = createShippingClient({credentials: async () => creds});
  // Prueba técnica de conectividad con medidas PROVISIONALES 7x7x20 / 250 g. NO es tarifa para checkout.
  const q = await client.createQuote(
    {country_code: 'MX', postal_code: '37000', area_level1: 'Guanajuato', area_level2: 'León', area_level3: 'Centro'},
    {country_code: 'MX', postal_code: '06600', area_level1: 'Ciudad de México', area_level2: 'Cuauhtémoc', area_level3: 'Juárez'},
    [{length: 20, width: 7, height: 7, weight: 0.25}]);
  let quote = q;
  for (let i = 0; i < 10 && quote.status === 'pending'; i++) { await new Promise(r => setTimeout(r, 2000)); quote = await client.getQuote(q.id); }
  report.skydropx.cotizacionTecnica = {estado: quote.status, tarifas: quote.rates.length,
    muestra: quote.rates.slice(0, 6).map(r => `${r.carrier} ${r.service} $${(r.totalCents / 100).toFixed(2)} ${r.days ?? '?'}d recolección:${r.pickupAvailable}`)};
} catch (e) { report.skydropx = {...(report.skydropx || {}), error: e.message, status: e.status}; }
console.log(JSON.stringify(report, null, 1));

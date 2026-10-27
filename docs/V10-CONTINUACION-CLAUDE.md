# V10 — continuación con Claude (27/10/2026)

Estado global: **NO LISTA PARA VENDER**. El checkout está desplegado con interruptores apagados.
Leyenda: **P** preparado · **E** probado en emulador · **D** desplegado · **V** verificado con proveedor real.

## Accesos comprobados (27/10/2026, 17:53–18:40 UTC)

| Sistema | Resultado |
| --- | --- |
| GitHub | Escritura en `codex/v10-produccion-segura` (commits normales, sin force push). La rama remota estaba en `e82be37`; sin cambios ajenos. |
| Firebase / GCP | Cloud Shell autenticado como propietario en `instinto-fragancias`: gcloud, Secret Manager, Firestore export, despliegue de funciones. |
| Mercado Pago | Sesión en Developers; los detalles de la app piden verificación 2FA del propietario. Token productivo = app **InstintoFragancias 5234016561184915**, vendedor 71623902 (MLM), cuenta real. |
| Skydropx | Sesión web y API: OAuth y cotización real OK (11 tarifas León→CDMX). Plantilla origen "INSTINTO Origen" (CP 37530, predeterminada, completa). Paquete guardado "Instinto" 4G / Carta Porte 53131620 / 7×7×20 cm / 1 kg. |
| Webempresa | WePanel → administrador de archivos `public_html/instintofragancias.com` (6 elementos, 69 KB). |
| Mac del propietario | Solo carpetas Descargas e `instinto-checkout-api` (V5 antiguo); red restringida. |

## Producción observada

- Funciones previas: `storeApi` (actualizada 27/10 00:51 UTC; autoriza 1 correo vía `INSTINTO_V8_ADMIN_EMAIL`, difiere de la rama) y `mpWebhook` (bootstrap: POST → 503, no procesa).
- Reglas Firestore (desde 07/04/2026): `/instinto/{document}` **abierto** `allow read, write: if true`.
- Firestore: sin PITR, sin respaldos programados, sin protección de borrado. Colecciones: `instinto`, `instinto_tienda_v7_pedidos_prueba`, `instinto_tienda_v7_reservas_prueba`. Sin `instinto_private/runtime`.
- `instinto/datos`: 1 318 fragancias, 564 pedidos (399 WhatsApp, 165 Directo, 0 Web), sin `syncRevision` (cliente V10 no publicado). Materiales: env_mate 51, env_cristal 59, atomizador 44, feromonas 265 g, fijador 1 267 g, perfumol 1 707.5 g. **No hay envase de 100 ml ni etiquetas inventariadas.** `cfg`: gesencia 30, gfijador 6, gferomonas 3.5, gperfumol 21.5, pventa 250.
- Auth: solo Google; enlace por correo **no habilitado**. Dominio `ezquerrahector.github.io` autorizado.
- Tienda: modo prueba, catálogo vía `storeApi`, pedidos de prueba con clave interna; `.htaccess` con `noindex`.

## Respaldo y restauración (V)

- `ops/respaldo-produccion.sh` → bucket privado `gs://instinto-fragancias-respaldos-v10` (acceso uniforme, prevención de acceso público, versiones). Sello `20261027T180340Z`: export administrado Firestore, reglas, índices, fuentes desplegadas, IAM, nombres/versiones de secretos (sin valores), copia de la tienda. SHA-256 paquete `99077204…fcb6c9`.
- `ops/restauracion-aislada.sh`: restaura el export en el emulador de Cloud Shell y coteja con producción. **Resultado: idéntica** (hash del documento, catálogo, stock por id, pedidos, materiales, 3 colecciones).
- Tienda versionada en `tienda-web/` (commit `e51a7bb` = producción exacta).

## Decisiones del propietario (27/10/2026)

Receta 60 ml = la de la administración (30/6/3.5/21.5 g). Solo 60 ml al inicio. Precio Web $310 (60 ml). Envase: Dama → `env_cristal`; Caballero/Unisex → `env_mate`; atomizador 1; etiqueta sin control de inventario.

## Trabajo realizado

| Renglón | Estado | Detalle |
| --- | --- | --- |
| Disponibilidad compartida Web/Directo | P E D | `availability.js` replica `calcularStockPedidos`: la tienda solo vende lo que queda tras apartar 30 g por pedido Directo/WhatsApp pendiente. Verificado en producción: catálogo nuevo = 159 fragancias 60 ml. |
| Cotización persistida | P E D, V parcial | `/api/shipping/quote`: cesta+domicilio validados, una caja verificada por frasco con peso empacado de configuración, cotización Skydropx guardada y ligada (hash) con caducidad. Cotización real comprobada con medidas provisionales (prueba técnica). |
| Checkout idempotente con reserva | P E D | `/api/checkout`: `requestId` idempotente, precios del servidor, compra persistida antes de la preferencia, reserva que descuenta esencia en la misma transacción (revisión +1), recuperación de preferencia incierta, sin efectivo/OXXO, `binary_mode`. |
| Conciliación | P E D | Consume la reserva sin segundo descuento; un pedido admin por frasco con folio compartido; pago tardío solo con existencia libre; segundos pagos, reversos y faltantes → revisión. |
| Recuperación y avisos | P E D | `maintenance` cada 5 min (apagado por interruptor): conciliación por API antes de liberar reservas, outbox con arrendamiento y 6 reintentos, alertas, rastreo, integridad de pedidos Web. |
| Guías | P E D | `webAdmin /label`: autenticado, idempotente, recotiza si la tarifa >23 h, bloquea diferencia de costo, Carta Porte 53131620 / 4G, guía y rastreo guardados. Cancelación de guía. |
| Cancelación / devolución | P E D | `webAdmin /cancel`: motivo obligatorio, reembolso MP con idempotencia, reposición solo de esencia no usada, nunca materiales, auditoría. |
| Tienda | P E | Parche AST solo en `loadCatalog`, `quoteShipping`, `pay`; video/diseño intactos; 100 ml oculto; retorno confirmado solo por servidor. Prueba Chromium móvil OK. **No publicado en Webempresa.** |
| Administración | P | Simulación de stock ya no reaparta pedidos Web; panel Ventas Web (guías, cancelaciones, alertas). **No publicado** (GitHub Pages sigue en main). |
| Pruebas | E | 54 unitarias + 30 integración (13 nuevas de checkout) en emulador de Cloud Shell. |

Despliegue 27/10/2026 18:35 UTC (commit `a9d2169`): `checkoutApi`, `webAdmin`, `maintenance`, `webOrderStatus` (codebase `instinto-payments`). Verificado: catálogo 200 en modo `preview`; cotizar/pagar 503 `checkout_disabled`; otro origen 403; `webAdmin` 401 sin sesión. `storeApi` y `mpWebhook` sin cambios. Secretos `INSTINTO_MP_TEST_ACCESS_TOKEN` y `INSTINTO_MP_WEBHOOK_SECRET` creados con marcador `PENDIENTE_CONFIGURAR` (no son credenciales).

## Pendientes que requieren al propietario

1. Confirmar medidas reales de la caja de 60 ml (L×A×H cm) y peso empacado (¿250 g?).
2. Mercado Pago: verificación 2FA; guardar token de prueba y clave secreta del webhook en Secret Manager (comando con `read -s`, sin chat).
3. Autorizar habilitar "enlace por correo" en Firebase Auth y la publicación del cliente administrativo V10 (inicio de sesión de ambos colaboradores).
4. Aceptación de Osmara en su dispositivo.
5. Saldo Skydropx y autorización de importe para la guía real; confirmar paqueterías que aceptan perfume.
6. Autorización del cargo real de la compra de aceptación.

## Pendientes técnicos (en orden)

1. Sandbox E2E aislado: emulador con datos restaurados + MP pruebas + cotización real; conciliación por API.
2. Publicar `mpWebhook` V10 (firma) y probar notificación simulada desde MP.
3. Transición de colaboradores → reglas finales (`security/firestore.transition.rules` ya niega todo salvo `instinto/datos` a colaboradores con escritura V10).
4. Publicar tienda en Webempresa (`tienda-web/index.html`, `config.js`).
5. Activar interruptores en producción, compra real, guía real, inventario antes/después.
6. Retirar `noindex` cuando el propietario decida lanzar.

## Reversión

- Tienda: volver a subir `index.html`/`config.js` del commit `e51a7bb`.
- Funciones: borrar `instinto_private/runtime.checkoutEnabled` (apaga cotizar/pagar al instante) y `reconciliationEnabled` (apaga mantenimiento); `webhook` y conciliación se mantienen para pagos en tránsito.
- Datos: nunca restaurar a ciegas; usar `ops/huella-datos.mjs` para cotejar, compensar por movimiento (`instinto_admin_operations`, `instinto_payment_ledger`).

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

## Evidencia: compra sandbox de extremo a extremo (27/10/2026 18:47–18:58 UTC)

Ambiente: emulador Firestore en Cloud Shell con el respaldo `20261027T180340Z` restaurado (copia idéntica de
producción), código commit `a48d7cf`, proveedores reales en modo prueba: Skydropx (credencial productiva,
solo cotización) y Mercado Pago (vendedor de prueba 3315715461, comprador de prueba 3315715463).
Caja 60 ml confirmada por el propietario: 7×7×20 cm, 250 g empacada.

| Paso | Resultado |
| --- | --- |
| Cesta | 2 × ARIANA GRANDE · CLOUD (DP02522), 60 ml, con dedicatoria de regalo |
| Cotización real Skydropx (2 cajas, León 37530 → CDMX 06600) | quote `d0b508b1-17f9-4273-8c75-8a4368e1114d`: ampm $102.50, Sendex $102.50, 99minutos $175.97, FedEx $181 / $182.41, PuntoPost $221.15 |
| Compra persistida | `wd29b1cf758f1d94647e2ad3a`: subtotal $620 + envío $102.50 = **$722.50** (servidor) |
| Reserva | DP02522 60 g → 0 g; revisión de inventario null → 1; libre 60 → 0 |
| Preferencia MP | `3315715461-2c296cfc-d4fb-41eb-951f-d647c8efdf79` |
| Pago (persona, comprador de prueba, tarjeta APRO) | MP operación **185338674611**: approved/accredited, $722.50 MXN, master |
| Primer intento de conciliación | Bloqueado `payment_environment_mismatch` (MP reporta live_mode=true en cuentas de prueba). Sin efectos. Corregido con `paymentLiveMode` (commit `a48d7cf`). |
| Conciliación por API (sin webhook) | applied 1; compra `paid`, reserva `consumed`; pedidos admin **#857 y #858** (canal Web, 60 ml, 30 g c/u, $310, esencia descontada, materiales pendientes de elaboración: env_cristal 1, atomizador 1, feromonas 3.5, fijador 6, perfumol 21.5) |
| Repetición ×3 del mismo pago | `already_processed` ×3 — sin segundo descuento ni pedidos duplicados |
| Outbox | 1 aviso procesado (alerta `new_paid_order`) |
| Inventario antes / después | DP02522 60 → 0 g (exactamente 60 g, una vez). Pedidos 564 → 566 (id máx. 856 → 858). Materiales sin cambio hasta "Elaborado". Revisión null → 2. |
| Ledger | `mp_185338674611` disposition `applied` |

Pendiente para cerrar el flujo real: webhook firmado desplegado, guía real (cargo Skydropx), transición de colaboradores, publicación y compra con cargo real autorizado.

## Producción activada (27/10/2026)

| Hora UTC | Acción | Verificación |
| --- | --- | --- |
| 20:12 aprox. | Enlace por correo habilitado en Firebase Auth | `signIn.email.enabled=true`; dominio github.io autorizado |
| 20:16 aprox. | Administración V10 publicada (`main` 426a3c7 → 934b2e5, avance rápido) | Sesión Google de Héctor verificada; 1 318 fragancias / 564 pedidos; safe-sync activo |
| 20:37 | Respaldo fresco `20261027T203714Z` (SHA-256 `2723b17f…eb52cb`) | — |
| 20:39 | Reglas Firestore cerradas (`security/firestore.transition.rules`) | Lectura autenticada de Héctor OK con reglas cerradas |
| 20:47 | Funciones redeplegadas; `mpWebhook` bootstrap reemplazado por receptor firmado | GET `ready`; POST sin firma → 401 |
| 20:47 | `instinto_private/runtime` modo real: vendedor 71623902, 60 ml $310, caja 7×7×20/250 g, conciliación y guías activas | Catálogo `live`, 159 fragancias |
| 20:50 aprox. | Tienda V10 publicada en Webempresa (`index.html`, `config.js`) | Cotización real Monterrey: 6 opciones desde $51.25 |

## Evidencia: primera compra REAL (27/10/2026 20:55–20:56 UTC)

| Paso | Resultado |
| --- | --- |
| Compra | `wb4332ab4ab5d9df037f0b720`: 1 × CREED · AVENTUS (CP02269) 60 ml, dedicatoria de regalo |
| Total servidor | $310 + Paquetexpress Nacional $51.25 = **$361.25** (destino CP 37210) |
| Pago Mercado Pago | **185359125309** approved/accredited, $361.25 MXN, vendedor 71623902, Mastercard 1 cuota; comisión $19.27, neto $341.98 |
| Webhook firmado | Recibido 20:56:02Z, `applied` (1 s después de la aprobación) |
| Reserva | held 20:55:05Z → consumed 20:56:03Z |
| Pedido administrativo | **#857**, canal Web, 60 ml, 30 g, $310, esencia descontada, materiales pendientes (env_mate 1, atomizador 1, feromonas 3.5, fijador 6, perfumol 21.5) |
| Inventario antes / después | CP02269 **60 → 30 g** (única fragancia con cambio en todo el catálogo). Pedidos 564 → 565. Materiales sin cambio (se descuentan al pasar a Elaborado). Revisión null → 2, cliente `v10`. |
| Ledger / outbox / alerta | `mp_185359125309` applied; outbox `done` 1 intento; alerta `new_paid_order` visible en el panel |

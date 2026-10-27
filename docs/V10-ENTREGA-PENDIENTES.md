# INSTINTO V10 — entrega y pendientes de liberación

Fecha: 27 de octubre de 2026. Estado: **NO LISTA PARA VENDER**.
Rama: `codex/v10-produccion-segura`, PR #1 en borrador. No se ha fusionado `main`.
El propietario autorizó preparar y publicar cuando la integración quede validada.
No se activaron cobros, no se tocaron inventarios productivos y no se cerraron reglas.

## Trabajo preparado

| Área | Resultado real |
| --- | --- |
| Administración | Guardado transaccional con detección de conflicto y recuperación local; acceso persistente para los dos correos autorizados. Solo en rama. |
| Skydropx | Credencial creada con autorización, default sin Orders.create, vence 26/04/2027; almacenada en Secret Manager. Origen y contacto guardados como predeterminados. |
| Paquetes | Una caja por perfume, 250 g para 60 ml y 299 g para 100 ml. Medida provisional 7×7×20 cm procedente de la plantilla existente; no calculada a partir del peso ni verificada físicamente. |
| Cotización | Adaptador de API probado con respuestas controladas, importes en centavos y protección ante errores; pendiente consulta real y enlace a tienda. |
| Mercado Pago | Firma y consulta de pago; constructor de preferencia con precios de servidor. Falta desplegar/configurar la integración final. |
| Conciliación | Transacciones probadas para descuento único de esencia, pedidos ligados por folio y tareas de notificación persistidas. No habilitadas. |
| Elaboración | Método de servidor usa receta por presentación y no vuelve a descontar esencia. Pendiente conexión con la interfaz. |
| Reversión | Procedimiento documentado para código y compensaciones de datos; aún no se hizo respaldo/restauración de producción. |

## Todos los puntos pendientes antes de abrir cobros

1. **Acceso de despliegue.** El navegador conectado dejó de estar disponible en
   esta sesión. Recuperar acceso autorizado a Firebase, Mercado Pago y Webempresa.
   GitHub sigue disponible. No se solicitarán claves por chat.
2. **Respaldo.** Copiar tienda, reglas, configuración y datos consistentes; guardar
   con acceso restringido y probar restauración aislada. Los CSV anteriores no lo sustituyen.
3. **Transición de colaboradores.** Habilitar/probar el método de acceso de ambos,
   desplegar cliente compatible y comprobar una sesión persistente en sus dispositivos.
   Bloquear escritores antiguos cuando todos usen la versión compatible.
4. **Escrituras y reglas finales.** Conectar mutaciones administrativas a servidor,
   proteger pedidos pagados contra edición/borrado/manipulación de flags, cerrar
   lectura/escritura pública y probar cliente antiguo, revocado y concurrente.
   Las reglas de transición actuales NO son las reglas finales de pagos.
5. **Materiales reales.** Mapear envases de 100 ml y etiquetas a IDs del inventario
   real; validar receta de producción y conectar `production.js` al cambio de estado.
   No usar el envase de 60 ml como sustituto silencioso del de 100 ml.
6. **Embalaje y paquetería.** Validar la caja provisional para ambos frascos y las
   condiciones del transportista para perfumes. Comprobar cotizaciones reales,
   recolección disponible y modalidad multipaquete/multienvío. Una estimación no
   acredita dimensiones físicas, cobertura ni aceptación del producto.
7. **Checkout completo.** Crear endpoints con validación, límites de uso, compra
   persistida, titularidad de cotización y protección ante reintentos; conectar el
   carrito actual conservando diseño y video. La pantalla de retorno no confirma pagos.
8. **Reservas.** Coordinar reservas web con ventas administrativas, caducidad,
   pago tardío y liberación. La transacción nueva impide stock negativo, pero un
   pago sin stock queda para revisión; por sí sola no evita que alguien pague sin existencia.
9. **Mercado Pago productivo.** Configurar secreto de firma, webhook, identidad de
   vendedor y ambiente; desplegar receptor. Probar flujo de cuenta de prueba de
   extremo a extremo antes de habilitar preferencias productivas.
10. **Recuperación y avisos.** Implementar trabajador de tareas pendientes y
    conciliación periódica de pagos/preferencias de resultado incierto, con alertas,
    reintentos limitados y supervisión de excepciones. Existe la tarea durable,
    pero todavía no el consumidor. No se enviaron correos en esta sesión.
11. **Cancelaciones y devoluciones.** Interfaz y operación administrativa autorizada,
    auditada e idempotente para devolver esencia. Los módulos actuales detectan
    devolución/contracargo y detienen automatismos; no realizan reembolsos monetarios.
12. **Publicación y aceptación.** Prueba integral en entorno aislado, revisión visual
    y móvil, compra completa, inventario antes/después y recuperación; despliegue
    controlado en GitHub, Firebase y Webempresa con verificación final del sitio público.

## Límites de las pruebas

Resultado de esta entrega: **44 pruebas locales y 17 de integración aprobadas**.
Incluyen reglas, concurrencia, pagos duplicados, errores de vinculación, faltantes,
devoluciones, cambios de estado y receta de 100 ml. Sintaxis y diff revisados.

Las pruebas locales y del emulador son comprobaciones de código real y transacciones
de Firestore. No acreditan credenciales productivas, políticas desplegadas, aceptación
de transporte ni un pago de Mercado Pago real. No hay autorización técnica para
presentar esta entrega como tienda publicada y lista mientras estos pendientes sigan abiertos.

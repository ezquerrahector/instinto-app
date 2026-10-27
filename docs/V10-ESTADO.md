# V10 — rama de preparación, no lista para producción

Inspección: 26 de octubre de 2026. Base administrativa:
`426a3c73cb6fe40ee54a265cd0fcf76c62434dac` en `main`.

## Verificado

- El repositorio contiene administración, panel de pruebas, manifest, iconos y SW.
- La tienda pública conserva la API `storeApi`, precios 310/490 y modo de prueba.
- `fbSave()` anterior hacía lectura y después `ref.set()` fuera de transacción.
  Recuperaba pedidos ausentes por ID, pero sobrescribía inventario, materiales y
  cambios a pedidos existentes. Las llamadas durante un guardado se descartaban.
- Reglas observadas en Firebase Console: `allow read, write: if true` dentro de
  `/instinto/{document}`. No se modificaron.
- La administración principal no carga Firebase Authentication.
- El panel `pedidos-en-linea.html` usa Google y API con autorización de servidor.
- Se recuperaron el receptor V10 de solo recepción, bootstrap, candidata de
  compatibilidad y fuente V9 de `storeApi` de los archivos previos. No se asume
  que el contenido recuperado coincida byte por byte con las funciones desplegadas.

## Cambios en esta rama

- Guardado transaccional con comparación del documento leído originalmente.
  Si otro cliente cambia cualquier dato, se rechaza la escritura y se conserva
  un respaldo local pendiente. No se fusionan automáticamente saldos, pedidos ni IDs.
- Cola de guardados con captura inmutable, agrupación de cambios síncronos y
  reintento con ID de operación. Una notificación del servidor no sustituye
  cambios pendientes. Se preservan campos ajenos a la administración.
- Protección de esencia en cambios de estatus de órdenes Web con indicadores
  de pago confirmado por servidor. No descuenta otra vez ni devuelve esencia
  al retroceder el estatus. Los pedidos Directo conservan el comportamiento previo.
- Receptor MP recuperado con validación de firma extraída para pruebas;
  ahora exige `data.id` de la URL y compara con el cuerpo. Sigue siendo SOLO
  recepción y auditoría: no confirma órdenes ni toca inventario.
- SW versionado, incorpora el módulo nuevo y limpia solo cachés `instinto-*`.

## Límites que impiden liberar

Estos cambios NO cierran por sí solos el acceso público y NO vuelven seguros
los clientes antiguos. Un cliente antiguo todavía puede sobrescribir datos
mientras las reglas públicas sigan vigentes.

Falta implementar y validar la transición autenticada de TODOS los colaboradores,
las mutaciones autorizadas en servidor, reglas finales, preferencias Checkout Pro,
Skydropx, conciliación transaccional, cola de recuperación y devolución autorizada.
Las ediciones/eliminaciones manuales de órdenes web deberán restringirse en servidor.
El consumo de materiales actual es por pedido con receta global; falta definir y
validar la representación de cantidades y materiales/envases de 100 ml antes de
incorporar pedidos web. No inferir la receta de 100 ml a partir de la de 60 ml.

No se ejecutaron pruebas de Firestore Emulator, permisos reales, checkout sandbox,
cotización de Skydropx ni aceptación con colaboradores. Las pruebas unitarias no
sustituyen estas verificaciones.

## Entradas necesarias

1. Identidad de los colaboradores actuales y quién puede autorizar devoluciones.
   Tener cuentas en Authentication no basta para asumir que están autorizadas.
2. Sesiones disponibles en Webempresa y Skydropx. Contraseñas y secretos solo
   mediante los mecanismos seguros del proveedor, nunca en chat ni Git.
3. Dirección de origen y medidas/pesos de paquetes, preferentemente recuperados
   de la cuenta Skydropx, más receta/materiales de 100 ml si no están configurados.
4. Verificar fuente/configuración desplegada y establecer un medio autorizado
   de despliegue Firebase. Ver una sesión Console no acredita acceso CLI.

## Fuentes técnicas

- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks

Validación local: `npm test`. Los casos cubren conflictos con escritor antiguo,
stock cambiado por otro escritor, cola, desconexión, reinicio, persistencia fallida,
firma manipulada/vencida, reglas de estatus y sintaxis de scripts administrativos.

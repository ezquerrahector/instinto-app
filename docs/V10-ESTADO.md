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

Falta publicar y validar la transición autenticada de TODOS los colaboradores,
las mutaciones autorizadas en servidor, reglas finales, preferencias Checkout Pro,
Skydropx, conciliación transaccional, cola de recuperación y devolución autorizada.
Las ediciones/eliminaciones manuales de órdenes web deberán restringirse en servidor.
El consumo de materiales actual es por pedido con receta global. Se recuperó el
cálculo previo de 100 ml (50 g esencia, 5.83 g feromonas, 8.33 g fijador y 35.84 g
perfumol) y se incorporó como módulo verificable, sin activarlo contra inventario.
Falta mapear los envases de 100 ml y etiquetas reales antes de incorporar pedidos.

Se ejecutaron cinco pruebas de reglas/transacciones en Firestore Emulator y 36
pruebas locales de lógica/UI. No se probaron permisos desplegados, checkout sandbox,
cotización de Skydropx ni aceptación con colaboradores.

## Entradas necesarias

1. Colaboradores autorizados por el propietario: ezquerrahector@gmail.com y
   osmararobles@hotmail.com. Sesión LOCAL persistente, Google o enlace por correo.
   Firebase Console muestra únicamente la cuenta de Héctor y proveedor Google.
   El proveedor de enlace por correo sigue pendiente de activación/publicación.
2. Webempresa y Skydropx accesibles por las sesiones abiertas. Carpeta de tienda
   confirmada: public_html/instintofragancias.com. No se modificaron archivos vivos.
3. Skydropx: plantilla Instinto 7×7×20 cm, 1 kg. Credencial autorizada y creada
   como INSTINTO V10 Cotizaciones, permiso general default, sin Orders.create,
   vigente hasta 26/04/2027. Client ID y Secret guardados exclusivamente en
   Secret Manager, secreto INSTINTO_SKYDROPX_CREDENTIALS, versión 1 habilitada.
   No se concedieron nuevos permisos IAM ni se desplegaron funciones.
   Dirección de origen proporcionada por el propietario y preparada en Skydropx;
   pendiente de guardar por teléfono, correo de contacto y referencia obligatorios.
   No guardar domicilio particular ni credenciales en este repositorio público.
   Falta confirmar empaquetado real de uno y múltiples frascos.
4. Verificar fuente/configuración desplegada y establecer un medio autorizado
   de despliegue Firebase. Ver una sesión Console no acredita acceso CLI.

## Fuentes técnicas

- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks
- https://app.skydropx.com/es-MX/api-docs.json

## Cotización preparada, todavía no conectada a checkout

`payments/shipping.js` implementa el contrato público OAuth client_credentials,
POST /api/v1/quotations y GET /api/v1/quotations/{id}. Token en memoria con
renovación, tiempos límite y sin seguir redirecciones. No registra secretos ni
respuestas crudas. Conserva pendiente/completada, filtra tarifas fallidas, monedas
distintas de MXN, importes inválidos y orígenes pendientes de verificación.
Ocho pruebas nuevas usan respuestas de API simuladas; no son cotizaciones reales.

El adaptador NO está exportado como función pública. Antes de conectarlo:
validar identidad/cesta, tomar medidas desde configuración privada validada,
limitar peticiones, persistir cotización y su vínculo con cesta/destino, aplicar
caducidad y cotejar el rate elegido en servidor. Nunca aceptar el costo ni las
dimensiones que envíe el navegador como autoridad. La compra de guías y solicitud
de recolección no forman parte de este módulo. No se garantiza recolección para
un CP hasta comprobar la tarifa y condiciones de la paquetería.

Validación local: `npm test`. Los casos cubren conflictos con escritor antiguo,
stock cambiado por otro escritor, cola, desconexión, reinicio, persistencia fallida,
firma manipulada/vencida, reglas de estatus y sintaxis de scripts administrativos.

Pruebas aisladas: `npm run test:rules` usa exclusivamente `demo-instinto-v10`
en localhost:8085. No usa credenciales ni datos de producción. Las reglas de
`security/firestore.transition.rules` son solo la transición con pagos apagados;
NO deben usarse como reglas finales de una tienda con descuentos automáticos.

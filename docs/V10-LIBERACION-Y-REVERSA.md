# Preparación de liberación y reversión

Estado: procedimiento preparado, NO ejecutado. No existe todavía un respaldo
verificado de producción creado en esta sesión. No confundir los CSV anteriores
con una copia consistente de Firestore.

## Antes de la transición

1. Mantener checkout y descuentos web desactivados.
2. Inventariar usuarios/dispositivos/PWA y dar de alta únicamente identidades
   autorizadas. Probar acceso y operaciones en ambiente aislado.
3. Obtener exportación consistente de Firestore y copia de las reglas/índices,
   configuración de funciones, versiones de secretos (sin exportar valores),
   fuentes realmente desplegadas, directorio completo Webempresa y referencia Git.
   Guardar respaldos con acceso restringido, nunca en este repositorio público.
4. Restaurar el respaldo en un proyecto aislado y validar cantidades de pedidos,
   identificadores, gramos y materiales. Registrar hora y checksum de la copia.
5. Preparar funciones autenticadas, clientes compatibles y reglas que rechacen
   escritores anteriores. No cerrar reglas antes de comprobar todos los accesos.
6. Acordar el instante de transición; una pestaña antigua no puede seguir teniendo
   permiso para escribir el documento completo si se habilitan cobros automáticos.
   No prometer compatibilidad transparente con clientes antiguos sin autenticación.

## Criterios para solicitar autorización de publicación

- Pruebas de concurrencia de dos colaboradores y pago simultáneo en Emulator.
- Firma válida/inválida, webhook duplicado y fuera de orden, importe/moneda/
  vendedor/orden distintos, expiración y pagos pendientes.
- Pago aprobado, esencia exacta, órdenes por fragancia, materiales por unidades
  y presentación, reversión de estatus sin devolución de esencia.
- Cotización real verificable, ligada a carrito/domicilio, no manipulable,
  expiración y ausencia de servicios. No usar tarifas ficticias o envío cero.
- Recuperación de caídas entre proveedor y escritura; conciliación de pagos.
- Reglas: desconocido denegado, colaborador vigente autorizado, revocado denegado;
  ningún cliente público puede cambiar stock, pagos o autorizaciones.
- Respaldo/restauración probados, monitoreo y responsables de incidentes definidos.

## Reversión de código

Antes de cualquier cobro nuevo, puede revertirse la candidata mediante un commit
de reversión a la referencia base y una versión nueva del SW. No usar force push.
Conservar la rama y el historial para auditoría.

Después de habilitar cobros, primero desactivar nuevas preferencias. Mantener el
webhook y la conciliación para pagos en tránsito. Volver a una versión segura
compatible con el esquema vigente; no reabrir reglas públicas para admitir el
cliente anterior. No desplegar todos los codebases indiscriminadamente.

## Reversión de datos

Nunca restaurar a ciegas un documento antiguo sobre ventas posteriores.
Antes de corregir: snapshot adicional del estado afectado, detener solo las
mutaciones afectadas, determinar los pagos/órdenes/movimientos posteriores al
respaldo y conciliar contra Mercado Pago. Aplicar compensaciones identificadas
por movimiento, autorizadas e idempotentes; validar saldos antes/después.
Una reversión de código no implica devolver dinero ni esencia automáticamente.
Registrar quién autorizó cada compensación y verificar que no se duplique.

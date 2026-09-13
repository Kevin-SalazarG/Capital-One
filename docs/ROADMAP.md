# Roadmap — CFDI, cobranza y notificaciones

## Objetivo

Convertir a Colchón en una herramienta que mantenga actualizado el flujo de
caja de la PyME con CFDI reales y que avise a la persona correcta cuando exista
un riesgo de liquidez o una factura por cobrar.

La recomendación de implementar Facturapi y WhatsApp es válida para una etapa
posterior al prototipo. No es necesaria para la demo actual.

## Aclaración de términos

- El nombre correcto es **descarga masiva de CFDI**, no “carga masiva”.
- El SAT ofrece la descarga de CFDI emitidos o recibidos mediante portal o Web
  Service. Para el Web Service se requiere e.firma; el SAT procesa la solicitud
  de forma asíncrona.
- Facturapi puede funcionar como proveedor de esa integración: su API incluye
  solicitudes de ZIP mensual, lectura de facturas y descarga de XML/PDF/ZIP.
- Facturapi no sustituye el análisis de caja. Un CFDI indica información fiscal,
  pero no garantiza que el cliente ya pagó ni define por sí solo la fecha real
  de cobro.

## Decisión recomendada

### Primera integración: Facturapi

Usar Facturapi como adaptador inicial para descargar y normalizar CFDI, detrás
de una interfaz propia de Colchón. Esto reduce el trabajo de implementar SOAP,
firmado, paquetes y reintentos del Web Service del SAT.

### Segunda opción: Web Service directo del SAT

Dejarlo como proveedor alternativo, no como requisito del MVP comercial. Se
justifica si el costo de Facturapi, sus límites, la dependencia del proveedor o
los requisitos de clientes grandes lo hacen necesario.

La aplicación no debe acoplar el motor de tesorería a Facturapi ni al SAT.

```text
Facturapi / SAT / XML manual
            ↓
      CfdiSourcePort
            ↓
  descarga → validación → normalización → deduplicación
            ↓
      cfdi_invoices + documentos privados
            ↓
     pronóstico de liquidez y alertas
```

## Fases

### Fase 0 — Definición y seguridad

Prioridad: P0. Antes de programar la conexión real.

- Confirmar si el producto necesita CFDI emitidos, recibidos o ambos.
- Definir si se requiere XML, metadata o los dos.
- Confirmar el RFC, ambiente Live/Test, suscripción y límites de Facturapi.
- Diseñar el consentimiento para que el usuario autorice la sincronización.
- No guardar e.firma, contraseñas ni llaves de proveedor en el navegador.
- Decidir la política de retención y borrado de XML.
- Mantener carga manual de XML como fallback.

Entregable: decisión técnica de proveedor, threat model corto y contrato de
datos normalizado.

### Fase 1 — Sincronización de CFDI con Facturapi

Prioridad: P0. Primera funcionalidad de producción.

#### Backend

- Crear `CfdiSourcePort` con operaciones de:
  - crear solicitud de descarga;
  - consultar estado;
  - descargar paquete terminado;
  - leer documentos y metadata;
  - consultar detalle o estatus fiscal cuando sea necesario.
- Implementar `FacturapiCfdiProvider` en `apps/api/src/modules/cfdi`.
- Crear un worker para consultar solicitudes asíncronas, con backoff, timeout y
  reintentos idempotentes.
- Guardar cada corrida de sincronización: organización, periodo, dirección,
  estado, conteos, errores, fecha de inicio y fecha de término.
- Almacenar XML en bucket privado, no en respuestas públicas de la API.
- Validar RFC emisor/receptor, UUID, sello/timbre, tipo de CFDI, moneda, total,
  fecha y estatus de cancelación.
- Deduplicar por organización, UUID y dirección.

#### Datos

Reutilizar `cfdi_import_batches` y `cfdi_invoices`, agregando lo que falte para:

- `provider`, `provider_document_id` y `provider_request_id`;
- `source_period_start` y `source_period_end`;
- `raw_document_path`;
- `fiscal_status` separado de `payment_status`;
- `last_seen_at` y `last_synced_at`.

#### UX

- Pantalla “Conectar CFDI”.
- Botón “Sincronizar ahora”.
- Historial de corridas y errores accionables.
- Fecha de última sincronización visible en dashboard.
- Mensaje claro cuando una factura fue cancelada o actualizada.

Definition of done:

- Una organización puede sincronizar un periodo.
- Repetir la misma sincronización no duplica CFDI.
- Un fallo parcial puede reintentarse sin perder los documentos ya importados.
- El usuario puede descargar su XML mediante URL temporal auditada.
- La carga manual sigue funcionando si Facturapi no responde.

### Fase 2 — Normalización fiscal útil para caja

Prioridad: P0. Sin esta fase, traer más CFDI solo agrega ruido.

- Separar claramente:
  - CFDI emitido vs. recibido;
  - ingreso vs. gasto;
  - PUE vs. PPD;
  - vigente vs. cancelado;
  - factura original vs. complemento de pago;
  - monto fiscal vs. saldo pendiente operativo.
- Procesar complementos de pago para actualizar evidencia de pago.
- Mantener el banco como fuente de verdad para “dinero recibido”.
- Pedir al usuario términos de pago, fecha esperada y flexibilidad; no inferir
  automáticamente una fecha de vencimiento que no exista en el CFDI.
- Recalcular el pronóstico únicamente cuando cambia una fuente relevante.
- Registrar por qué una factura impacta el pronóstico y de qué fuente viene cada
  dato.

Definition of done:

- Una factura cancelada no se cuenta como entrada o salida futura.
- Un complemento de pago no crea una factura duplicada.
- Un acuerdo de cobro no se cuenta como dinero recibido.
- El usuario puede corregir la fecha operativa sin alterar el XML fiscal.

### Fase 3 — Notificaciones al usuario por WhatsApp

Prioridad: P1. Recomendado después de que el pronóstico sea confiable.

El primer destinatario debe ser el dueño o responsable de caja, no el cliente.

#### Eventos iniciales

- La proyección cae debajo de la reserva.
- La proyección se vuelve negativa.
- Una nómina o pago protegido queda expuesto.
- Una factura relevante está vencida.
- La sincronización de CFDI terminó, falló o quedó incompleta.
- Se detectó una cancelación o cambio relevante.

#### Componentes

- `NotificationChannel` para no acoplar la aplicación a un proveedor.
- Proveedor WhatsApp intercambiable, por ejemplo Cloud API, Twilio u otro BSP
  aprobado después de validar precio, cobertura y requisitos del negocio.
- Plantillas aprobadas, variables seguras y enlace profundo al dashboard.
- Preferencias por usuario: canal, eventos, horario silencioso y frecuencia.
- Idempotencia, deduplicación, reintentos y registro de entrega.
- Opt-in, opt-out y manejo de números inválidos.

No enviar el mismo riesgo todos los días. Agrupar alertas y avisar solo cuando
el riesgo aparece, cambia materialmente, se resuelve o requiere acción.

### Fase 4 — Notificaciones de cobranza al cliente

Prioridad: P1/P2. Requiere más cuidado que las alertas internas.

Antes de enviar mensajes se necesita:

- catálogo de clientes y contactos;
- teléfono validado y consentimiento por cliente;
- relación entre contacto, RFC y facturas;
- plantillas de aviso y frecuencia configurable;
- exclusión por cliente, factura o usuario;
- registro de mensaje enviado, entregado, leído, fallido y respuesta;
- enlace seguro para consultar la factura o confirmar una intención de pago.

Secuencia recomendada:

1. Generar borrador de mensaje.
2. Mostrar factura, importe, fecha y motivo del aviso.
3. Solicitar aprobación del usuario en la primera versión.
4. Enviar por WhatsApp.
5. Registrar la respuesta como seguimiento, nunca como cobro confirmado.
6. Confirmar el cobro únicamente con banco o evidencia fiscal compatible.

No automatizar cancelaciones, descuentos, convenios ni transferencias. El
cliente debe poder dejar de recibir mensajes.

### Fase 5 — Operación, observabilidad y control

Prioridad: P1. Necesaria antes de escalar.

- Panel interno de sincronizaciones, errores y reintentos.
- Métricas: tiempo de sincronización, documentos procesados, duplicados,
  cancelaciones detectadas, entregabilidad y tasa de opt-out.
- Alertas internas si un proveedor está degradado.
- Auditoría de accesos a XML, cambios de fechas operativas y mensajes enviados.
- Cifrado, secretos server-side, aislamiento por organización y RLS.
- Pruebas con XML reales anonimizados y casos de CFDI cancelado, PPD, pagos
  parciales, moneda distinta y duplicados.

### Fase 6 — SAT directo, solo si hace falta

Prioridad: P2.

Implementar `SatCfdiProvider` detrás del mismo `CfdiSourcePort`:

- autenticación y token con e.firma;
- solicitud de descarga;
- consulta de estado;
- descarga de paquetes;
- límites, ventanas de disponibilidad y reintentos;
- trazabilidad de folio y paquete;
- pruebas de compatibilidad con los XML que ya procesa Colchón.

El cambio de Facturapi a SAT debe ser una configuración de proveedor, no una
reescritura del motor de pronóstico ni de la interfaz.

## Qué sí y qué no priorizar

| Iniciativa                                 |        Prioridad | Recomendación                                     |
| ------------------------------------------ | ---------------: | ------------------------------------------------- |
| Importación manual XML                     |               P0 | Mantener como fallback y para onboarding          |
| Facturapi para descarga masiva             |               P0 | Implementar después de validar el MVP             |
| Complementos de pago y cancelaciones       |               P0 | Necesarios para que la caja sea confiable         |
| Sincronización automática incremental      |               P0 | Más valor que un botón de carga única             |
| WhatsApp al responsable de caja            |               P1 | Empezar con alertas internas                      |
| WhatsApp al cliente                        |            P1/P2 | Primero borrador y aprobación humana              |
| SAT Web Service directo                    |               P2 | Solo por costo, escala o independencia            |
| Emisión de CFDI desde Colchón              |               P2 | Fuera del problema central actual                 |
| Cobro automático, crédito o transferencias | Fuera de alcance | No mezclar con el motor de decisión               |
| Machine learning para pronóstico           |               P2 | Primero validar datos reales y reglas explicables |

## Cambios técnicos propuestos en este repositorio

### Backend

```text
apps/api/src/modules/cfdi/
  cfdi-source.port.ts
  facturapi-cfdi.provider.ts
  sat-cfdi.provider.ts                 # fase posterior
  cfdi-sync.service.ts
  cfdi-sync.worker.ts
  cfdi-webhook.controller.ts            # si aplica al proveedor

apps/api/src/modules/notifications/
  notification-channel.port.ts
  whatsapp.provider.ts
  notification-preferences.service.ts
  notification-delivery.repository.ts
  notification-events.service.ts
```

### Base de datos

Tablas o extensiones sugeridas:

- `cfdi_connections`;
- `cfdi_sync_runs`;
- `cfdi_documents`;
- `customer_contacts`;
- `notification_preferences`;
- `notification_deliveries`;
- `collection_follow_ups`.

Todas deben tener `organization_id`, políticas RLS, auditoría y estados
explícitos. Los documentos originales deben vivir en almacenamiento privado.

## Métricas de éxito

- Más de 95% de corridas terminan sin intervención manual.
- Cero duplicados por UUID dentro de una organización.
- Menos de 5 minutos entre una sincronización iniciada y sus datos disponibles,
  excluyendo el tiempo de procesamiento del SAT/proveedor.
- 100% de las alertas críticas tienen causa, fecha, monto y fuente visibles.
- Menos de una alerta repetida por evento de riesgo en la ventana configurada.
- El responsable puede corregir un dato operativo sin modificar el comprobante
  fiscal original.
- Cada mensaje tiene consentimiento, plantilla, estado de entrega y auditoría.

## Resumen ejecutivo

La recomendación es: **sí a Facturapi y sí a WhatsApp, pero después de validar
el núcleo de pronóstico**. El orden correcto es:

```text
CFDI confiables → complementos/cancelaciones → pronóstico confiable
→ alertas al usuario → cobranza asistida al cliente → SAT directo si conviene
```

La parte más valiosa no es “traer muchos XML”, sino mantener una separación
auditable entre dato fiscal, saldo operativo, promesa de pago y dinero realmente
recibido.

## Fuentes consultadas

- [SAT — Consulta y recuperación de comprobantes](https://wwwmatnp.sat.gob.mx/consultas/42968/consulta-y-recuperacion-de-comprobantes-%28nuevo%29)
- [SAT — Servicio de descarga masiva de CFDI](https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461174995026&ssbinary=true)
- [Facturapi — Configuración inicial de una organización](https://docs.facturapi.io/docs/getting-started/organization-onboarding/)
- [Facturapi — Referencia de API](https://docs.facturapi.io/api/)
- [Facturapi — Introducción](https://docs.facturapi.io/docs/intro/)

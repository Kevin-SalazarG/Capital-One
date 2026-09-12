# Backend de Mirror para PyMEs

**Versión:** 1.0  
**Fecha:** 12 de septiembre de 2026.  
**Estado:** implementación local en verificación; validaciones de proveedores y despliegue pendientes de configuración del usuario.  
**Enfoque:** problemática 2 de Capital One Challenge HackMTY 2026.  
**Producto:** aplicación móvil y backend propio, con datos sintéticos y Nessie como fuente bancaria simulada.

## 1. Propósito y relación con la idea

Este documento define cómo organizaremos el backend de Mirror: tecnologías, responsabilidades, estructura, contratos, seguridad y criterios de calidad. Complementa [Idea.md](Idea.md), que sigue siendo el documento rector del producto y del alcance del MVP.

Las convenciones de escritura se definen en [Code.md](Code.md) y las reglas de colaboración en [GitHub.md](GitHub.md). Estos documentos técnicos se redactan en inglés.

Las menciones de stack pendiente en `Idea.md` corresponden a una etapa anterior. Para lenguaje, framework, base de datos, autenticación y organización del backend, las decisiones vigentes son las de este documento. Esto no amplía las funciones del MVP ni implica que la infraestructura ya exista.

La decisión central es:

> El backend será la autoridad de datos, cálculos financieros y decisiones. La app móvil será la interfaz para capturar información, consultar resultados y operar sobre ellos.

El backend debe integrar ingresos y gastos, proyectar la liquidez de 30 días, apoyar el control de gastos generales y calcular reservas oportunas. Su diferenciador será evaluar qué anticipo o calendario de pagos permitiría aceptar un trabajo bajo restricciones explícitas.

No ejecutará pagos reales, custodiará dinero ni aprobará créditos. Registrar un plan solo modificará la planeación interna de Mirror.

## 2. Stack acordado

| Componente                    | Elección                                              | Uso en Mirror                                                           |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Runtime                       | Node.js 24 LTS                                        | Ejecutar la API y consumir el SDK de Nessie.                            |
| Lenguaje                      | TypeScript estricto, con módulos ESM                  | Contratos explícitos y comprobaciones estáticas.                        |
| Framework                     | NestJS 12                                             | Organizar módulos, dependencias, controladores y casos de uso.          |
| Servidor HTTP                 | Express mediante el adaptador de NestJS               | Base inicial para la API REST.                                          |
| Base de datos                 | PostgreSQL administrado en Supabase                   | Persistir movimientos, compromisos, escenarios y decisiones.            |
| Acceso a datos                | Supabase JavaScript SDK y funciones SQL RPC           | Snapshots tipados, validación y confirmación atómica por revisión.      |
| Autenticación                 | Supabase Auth, integrado a través de NestJS           | Inicio de sesión, renovación y verificación de identidad.               |
| Validación                    | Valibot                                               | Validar entradas, configuración y contratos de salida.                  |
| Documentación de API          | OpenAPI/Swagger                                       | Describir operaciones y generar el cliente de mobile.                   |
| Aritmética monetaria          | decimal.js y tipos `numeric` en PostgreSQL            | Operaciones decimales con precisión y redondeo definidos.               |
| Integración bancaria          | SDK propio `nessie-node-sdk`                          | Consumir únicamente los recursos necesarios de Nessie.                  |
| Pruebas                       | Vitest, `@nestjs/testing` y Supertest                 | Pruebas unitarias, de integración y de endpoints.                       |
| Calidad de código             | Prettier, Biome y comprobación de tipos de TypeScript | Prettier para formato; Biome para lint; TypeScript para tipos.          |
| Registros                     | Pino                                                  | Registros estructurados y correlación de solicitudes.                   |
| Paquetes y workspace          | pnpm workspaces                                       | Relacionar API, app, cliente generado y SDK local.                      |
| Empaquetado                   | Docker                                                | Construcción reproducible y despliegue del backend.                     |
| Integración continua          | GitHub Actions                                        | Ejecutar verificaciones antes de integrar o desplegar cambios.          |
| Alojamiento inicial propuesto | Railway con Docker                                    | Publicar la API; plan, región y disponibilidad pendientes de confirmar. |

### 2.1 Versiones y compatibilidad

Node 24 es una línea LTS en la fecha de revisión. NestJS 12 documenta ESM, validación con Standard Schema y flujos de pruebas con Vitest. El runtime elegido deberá satisfacer también los mínimos de la CLI, no solo los del servidor. [Node.js](https://nodejs.org/en/about/previous-releases), [guía de NestJS 12](https://docs.nestjs.com/migration-guide).

Usaremos una versión exacta del SDK oficial de Supabase, fijada en el manifiesto y lockfile. El acceso a datos se realizará mediante funciones SQL llamadas con `rpc`; Valibot validará los contratos de entrada y los registros recibidos. [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/introduction), [funciones RPC](https://supabase.com/docs/reference/javascript/rpc).

Los parches exactos se fijarán al implementar, junto con el lockfile y la versión de pnpm. La versión mayor de PostgreSQL se confirmará según la oferta estable del proveedor. No se instalarán betas o candidatos de publicación para el recorrido principal.

La selección es una decisión de arquitectura; todavía no demuestra que el conjunto compile o funcione integrado. El primer montaje deberá comprobar build, importación del SDK, conexión a PostgreSQL, validación, OpenAPI y pruebas.

### 2.2 Motivos de las elecciones

- **NestJS:** permite separar responsabilidades y sustituir integraciones durante las pruebas.
- **Express:** será el adaptador inicial. No tenemos evidencia de que cambiar el servidor HTTP mejore el recorrido del MVP; cualquier cambio posterior requerirá mediciones y revisión de compatibilidad.
- **PostgreSQL:** encaja con relaciones y operaciones que deben confirmarse juntas, como registrar un plan y sus compromisos.
- **Supabase SDK y RPC:** permiten usar la configuración del proyecto y ejecutar las operaciones atómicas en PostgreSQL. Los contratos tipados no sustituyen las restricciones de base de datos, membresías ni RLS.
- **Valibot:** mantiene coherencia con el SDK existente. En NestJS se utilizará la integración Standard Schema y, para OpenAPI, el conversor correspondiente.
- **Supabase:** aporta PostgreSQL y autenticación administrados; NestJS conserva toda la lógica de Mirror.

Referencias: [validación en NestJS](https://docs.nestjs.com/techniques/validation), [Valibot y OpenAPI](https://docs.nestjs.com/openapi/introduction), [funciones de base de datos](https://supabase.com/docs/guides/database/functions).

## 3. División entre mobile y backend

| Responsabilidad                                   | Mobile                                                        | Backend                                               |
| ------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Formularios, navegación, accesibilidad y gráficas | Implementa la experiencia.                                    | Entrega datos y estados interpretables.               |
| Validación de formularios                         | Da retroalimentación inmediata.                               | Revalida siempre; no confía en el cliente.            |
| Sesión                                            | Conserva los tokens necesarios en almacenamiento seguro.      | Gestiona acceso, renovación y permisos.               |
| Consulta de información                           | Consume exclusivamente nuestra API para el recorrido del MVP. | Consulta almacenamiento propio e integra proveedores. |
| Caché y desconexión                               | Muestra resultados guardados con su antigüedad.               | Define vigencia y rechaza confirmaciones inválidas.   |
| Proyección, reservas y alternativas               | Presenta el resultado.                                        | Calcula y explica el resultado.                       |
| Confirmación de decisiones                        | Envía la intención del usuario.                               | Comprueba restricciones, versión e idempotencia.      |
| Nessie y credenciales de infraestructura          | No tiene acceso directo.                                      | Mantiene las conexiones y los secretos.               |

Una caché local no convierte a mobile en autoridad financiera. Sin conexión podrá mostrar información anterior claramente identificada, pero no confirmar que un plan fue registrado ni presentar una conclusión antigua como vigente.

Consultar nuestra API tampoco significa consultar Nessie en cada petición. La API servirá datos previamente sincronizados, con fecha de corte y estado de actualización. Se refrescarán cuando el usuario lo solicite o mediante un mecanismo posterior explícitamente definido.

## 4. Arquitectura: monolito modular

Construiremos una aplicación backend desplegable, organizada por funcionalidades de negocio. Cada módulo tendrá límites claros y expondrá operaciones específicas a los demás.

```text
App móvil
    │ HTTPS / API REST de Mirror
    ▼
Backend NestJS
    ├── Identidad y autorización ── Supabase Auth
    ├── Casos de uso y motor financiero
    ├── Persistencia ── Supabase SDK ── RPC SQL ── PostgreSQL
    └── Adaptador bancario ── SDK propio ── Nessie sandbox
```

La organización modular facilita mantener y probar el sistema. No equivale por sí sola a escalabilidad ilimitada: también habrá que medir consultas, uso de conexiones, duración de cálculos y concurrencia.

### 4.1 Módulos funcionales

| Módulo        | Responsabilidad                                                                         | Límite importante                                                              |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `auth`        | Inicio de sesión, renovación, cierre y verificación de identidad.                       | No decide fórmulas financieras ni contiene credenciales compartidas en la app. |
| `businesses`  | Perfil del negocio, membresías, moneda, zona horaria y políticas.                       | Un identificador enviado por el cliente no concede acceso.                     |
| `banking`     | Adaptador de Nessie, sincronización, cuentas y movimientos normalizados.                | No interpreta todo depósito como venta ni inventa datos faltantes.             |
| `commitments` | Cobros pendientes, obligaciones, recurrencias y presupuestos.                           | Distingue obligaciones futuras de movimientos ya realizados.                   |
| `planning`    | Proyección, reservas, escenarios y búsqueda de condiciones.                             | No llama directamente a Nessie ni depende de una IA para calcular.             |
| `decisions`   | Fichas registradas, condiciones, vigencia, historial y coordinación de su confirmación. | No confirma planes basados en versiones desactualizadas.                       |
| `dashboard`   | Componer resúmenes para las pantallas móviles.                                          | Reutiliza resultados; no mantiene una segunda implementación de fórmulas.      |

`banking` conservará la identidad del movimiento observado; `commitments` conservará el pendiente y su relación con ese movimiento. La conciliación coordinará ambos a través de operaciones explícitas, para aplicar un cobro una sola vez.

### 4.2 Reglas de dependencia

- Cada módulo controla sus escrituras; los demás utilizan sus servicios o contratos públicos.
- No se importarán repositorios privados de otro módulo para modificar sus tablas.
- Los casos de uso que afecten varios módulos definirán una única transacción compartida para las escrituras relacionadas. Cada servicio no abrirá una transacción independiente para la misma confirmación.
- Se usará inyección por constructor y adaptadores sustituibles en las fronteras externas.
- No habrá dependencias circulares. `dashboard` compone lecturas y `decisions` coordina confirmaciones; los módulos inferiores no dependerán de ellos.
- `platform` agrupa capacidades técnicas, no reglas de tesorería.

## 5. Estructura del proyecto

Estructura objetivo. Las rutas que todavía no existen se crearán únicamente cuando se autorice la implementación.

```text
/
├── docs/
│   ├── Idea.md
│   ├── Backend.md
│   ├── Code.md
│   └── GitHub.md
├── Capital One Challenge HackMTY 2026.pdf
├── nessie-node-sdk/                 # SDK existente; se conserva como paquete
├── apps/
│   ├── mobile/                     # Aplicación móvil
│   └── api/
│       ├── supabase/
│       │   └── migrations/          # SQL versionado del esquema y RPC
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/
│       │   ├── platform/
│       │   │   ├── database/
│       │   │   ├── logging/
│       │   │   ├── security/
│       │   │   └── health/
│       │   └── modules/
│       │       ├── auth/
│       │       ├── businesses/
│       │       ├── banking/
│       │       ├── commitments/
│       │       ├── planning/
│       │       ├── decisions/
│       │       └── dashboard/
│       ├── test/
│       │   ├── integration/
│       │   ├── e2e/
│       │   └── fixtures/
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── api-client/                 # Cliente generado para la API de Mirror
├── .github/
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

El SDK se incorporará como dependencia local del workspace por su interfaz pública. No se copiará su código dentro de la API ni se importarán archivos internos de `src`. Su organización y pruebas existentes se respetarán.

### 5.1 Organización interna de un módulo complejo

```text
planning/
├── planning.module.ts
├── api/                    # Controladores y contratos HTTP
├── application/            # Casos de uso y coordinación
├── domain/                 # Cálculos, restricciones y modelos propios
└── infrastructure/         # Adaptadores y persistencia necesarios
```

- **API:** valida solicitudes, llama un caso de uso y presenta una respuesta.
- **Application:** obtiene los datos autorizados, prepara la entrada del motor y coordina persistencia.
- **Domain:** aplica reglas financieras sin conocer HTTP, NestJS, Nessie ni Supabase.
- **Infrastructure:** implementa conexiones y persistencia mediante contratos definidos por el módulo.

Esta separación se aplicará cuando aporte claridad. Los módulos pequeños podrán comenzar con controlador, servicio, esquemas y pruebas, sin crear capas vacías.

### 5.2 Legibilidad y mantenimiento

- Nombres de archivos en `kebab-case`, símbolos de código en inglés y documentación de producto en español.
- Casos de uso con nombres concretos, como `evaluate-job` o `confirm-decision`.
- Controladores pequeños; fórmulas fuera de controladores y repositorios.
- Tipos explícitos en fronteras; `unknown` para datos externos hasta validarlos.
- Pruebas unitarias junto al archivo probado; integración y E2E en `test`.
- Evitar servicios gigantes y carpetas genéricas como `utils` que acumulen reglas sin dueño.
- Compartir solo contratos destinados al consumidor; no exponer modelos de base de datos como API pública.
- Añadir abstracciones por una responsabilidad identificada, no por anticipar todas las posibles tecnologías futuras.

## 6. Contrato de API y cliente móvil

La API será REST sobre HTTPS, con prefijo de versión como `/v1`. OpenAPI describirá entradas, salidas, autenticación y errores.

Los esquemas de Valibot serán la referencia de validación para los contratos de Mirror. El documento OpenAPI se generará con la integración de NestJS y `@valibot/to-json-schema`. El generador concreto del cliente TypeScript se elegirá al montar el proyecto y deberá comprobarse con los contratos reales.

`packages/api-client` contendrá el cliente generado para mobile. No incluirá clientes de base de datos, el SDK de Nessie, secretos ni el motor financiero. Los contratos de Nessie y los de Mirror son distintos y se mapearán en el backend.

### 6.1 Respuestas listas para presentar

El resumen de liquidez reunirá saldo observado, calendario diario, gastos, reserva, advertencias y metadatos de vigencia. Mobile no necesitará sumar movimientos ni combinar respuestas para reconstruir reglas financieras.

Las respuestas de cálculos incluirán, según corresponda:

- Moneda e importes como cadenas decimales.
- Fecha de corte y horizonte evaluado.
- Identificador y versión de los datos utilizados.
- Versión del motor y momento del cálculo.
- Origen, última sincronización y estado de antigüedad.
- Supuestos, información faltante y condiciones pendientes.
- Resultado financiero y vigencia como dimensiones separadas.

Los errores tendrán códigos estables, mensaje comprensible e identificador de solicitud. Nunca devolverán consultas SQL, stack traces, tokens ni URLs con la llave de Nessie. Las listas tendrán paginación y límites; las evaluaciones tendrán un tamaño de entrada acotado.

OpenAPI es un contrato versionado: cambiar la estructura de una respuesta exige revisar la compatibilidad del cliente móvil, no solo regenerar archivos.

## 7. Persistencia, dinero y fechas

La información se separará conceptualmente en hechos observados, compromisos o estimaciones, escenarios y decisiones registradas. No se almacenará todo como un único documento opaco que impida validar relaciones.

### 7.1 Reglas monetarias

- PostgreSQL utilizará `numeric` para importes; el motor utilizará decimal.js.
- No se usará aritmética de punto flotante de `number` para calcular dinero.
- Los importes viajarán en JSON como cadenas decimales acompañadas por su moneda.
- La escala, límites de importe, precisión interna y redondeo se definirán explícitamente antes de crear el esquema. Dos decimales serán una hipótesis para el ejemplo en MXN, no una inferencia sobre las unidades de Nessie.
- Los ajustes se cuantizarán a la unidad monetaria admitida. Un anticipo requerido no podrá redondearse hacia abajo y dejar de cubrir el piso.
- Se rechazarán valores no finitos, monedas incompatibles y precisión no admitida; no habrá conversiones silenciosas.

`numeric` permite cálculos exactos dentro de la precisión definida. No elimina la necesidad de una política de redondeo ni corrige unidades mal interpretadas al importar. [PostgreSQL: tipos numéricos](https://www.postgresql.org/docs/current/datatype-numeric.html), [decimal.js](https://mikemcl.github.io/decimal.js/).

### 7.2 Fechas y trazabilidad

- Los instantes, como creación y sincronización, se almacenarán con zona horaria y se intercambiarán en UTC.
- Los vencimientos por día se modelarán como fechas de calendario, interpretadas en la zona horaria del negocio.
- No se convertirá una fecha de pago en otro día por aplicar indiscriminadamente una conversión de zona horaria.
- Cada movimiento tendrá referencia de proveedor, recurso e identificador externo, dentro del ámbito del negocio y la conexión.
- Las claves únicas, relaciones e índices respaldarán las invariantes. Un chequeo previo en JavaScript no sustituye una restricción de base de datos.

### 7.3 Migraciones y conexiones

Las migraciones SQL de `apps/api/supabase/migrations` serán la referencia versionada del esquema propio y sus funciones RPC. No habrá dos historiales modificando las mismas tablas ni cambios manuales permanentes sin registrar. Los esquemas administrados de Supabase, como `auth`, no pertenecerán a nuestras migraciones.

La aplicación utilizará `SUPABASE_URL`, `SUPABASE_ANON_KEY` para Auth y `SUPABASE_SERVICE_ROLE_KEY` para RPC. La llave de servicio permanecerá exclusivamente en el backend. Las migraciones se aplicarán mediante las herramientas administrativas autorizadas de Supabase; el proceso de la API no necesitará credenciales de conexión PostgreSQL. Las transacciones SQL serán cortas y no incluirán llamadas a Nessie o Auth.

## 8. Integración con Nessie

El SDK resuelve transporte y contratos del proveedor. `banking` agregará la interpretación necesaria para Mirror: clasificación, deduplicación, conciliación, unidades monetarias y fecha de corte.

La llave existente se configurará únicamente en el servidor. No hace falta solicitar una nueva y su valor no se incluirá en este documento, repositorio, app, capturas o registros.

### 8.1 Flujo de sincronización

1. Comprobar identidad y permiso sobre el negocio.
2. Consultar mediante el SDK las cuentas y movimientos de la conexión autorizada.
3. Validar estructura, estados, importes y fechas; conservar las referencias de origen.
4. Normalizar y aplicar inserciones o actualizaciones idempotentes.
5. Conciliar cobros y pagos inequívocos; solicitar revisión cuando la correspondencia sea ambigua.
6. Publicar una nueva versión de los datos solo después de completar las escrituras relacionadas.
7. Invalidar la vigencia de los planes afectados y recalcular cuando corresponda.

Las lecturas de varios endpoints de Nessie no son una transacción bancaria atómica. Mirror deberá comprobar la coherencia del corte y advertir o rechazar un conjunto incompleto; guardarlo en PostgreSQL no elimina esa limitación del origen.

### 8.2 Restricciones

- Reimportar un movimiento no duplica un ingreso ni reduce dos veces un pendiente.
- Un saldo de corte ya contiene movimientos anteriores: no se vuelven a sumar.
- Un depósito puede corresponder a un préstamo, transferencia u otro concepto; no necesariamente es una venta.
- Las simulaciones se ejecutan sobre datos internos y no crean movimientos en Nessie.
- La incorporación de un movimiento sintético de demostración será una acción explícita y protegida. Una escritura con resultado incierto se conciliará antes de intentar repetirla.
- No se prometerán webhooks o actualización instantánea sin verificarlos. El MVP parte de refresco explícito.
- Si falla la API, se conservará la última versión completa, mostrando antigüedad y error. Una reproducción de respaldo se identificará como tal.

El contrato autenticado, las unidades y el comportamiento de estados y saldos siguen pendientes de prueba. La documentación pública y los tests locales del SDK no sustituyen esa comprobación. [Nessie](https://nessieisreal.com/docs).

## 9. Motor financiero

`planning/domain` contendrá funciones deterministas: los mismos datos, reglas y versión del motor deben producir el mismo resultado. La fecha de corte será una entrada explícita; no se tomará silenciosamente del reloj durante el cálculo.

El motor recibirá saldo de corte, calendario de entradas y salidas, colchón, restricciones, condiciones de un trabajo y escenarios permitidos. Devolverá proyección diaria, saldo mínimo, faltantes, reserva objetivo, fechas críticas y alternativas explicables.

Para el MVP:

- Se evaluarán 30 días y también el saldo inicial.
- Se compararán el escenario base y el retraso de cobro definido.
- Las alternativas serán anticipo del cliente y pago escalonado de proveedor.
- Se conservarán los importes totales al mover un cobro o pago, incluyendo costos conocidos.
- No se modificarán obligaciones declaradas no negociables.
- Un anticipo pendiente no aumentará el efectivo observado ni habilitará capacidad incondicional.
- Se devolverá información insuficiente o ausencia de alternativa factible cuando corresponda.
- Los efectos relevantes después del horizonte se advertirán, aunque la gráfica de 30 días mejore.

La búsqueda estará acotada por las opciones y límites proporcionados. No se aceptarán simulaciones de tamaño ilimitado ni se afirmará una optimización global fuera del conjunto evaluado.

Una IA opcional podrá explicar o sugerir clasificaciones revisables. No será responsable de los saldos ni una dependencia necesaria para terminar el recorrido.

## 10. Registro de decisiones y concurrencia

Cada evaluación conservará un snapshot inmutable de los datos utilizados, sus supuestos y la versión del motor. También mantendrá una referencia a la versión del estado de planeación del negocio.

Al registrar un plan:

1. El backend comprobará acceso, condiciones y correspondencia con una evaluación conocida.
2. Dentro de una transacción, verificará y avanzará de forma atómica la versión esperada del negocio.
3. Guardará la decisión, sus compromisos y el evento de auditoría en esa misma transacción.
4. Si la versión ya cambió, revertirá la operación y devolverá un conflicto que requiera recálculo.

Toda modificación relevante, incluida la sincronización o la edición de compromisos, deberá participar en este protocolo de versionado. Un `SELECT` seguido de escrituras sin protección atómica no es suficiente.

Las confirmaciones admitirán idempotencia: repetir una solicitud con la misma clave, usuario, negocio y contenido devolverá el resultado ya registrado. Reutilizar la clave con otro contenido será un conflicto. La protección se persistirá en PostgreSQL, no solo en memoria de un proceso.

Ejemplo: si dos planes se evaluaron sobre la versión 8, el primero que se confirme la avanzará. El segundo no podrá registrar compromisos utilizando todavía la capacidad de la versión 8.

Esto protege la consistencia de la planeación, pero no constituye una reserva bancaria real ni garantiza el cumplimiento de condiciones que dependen del cliente o proveedor.

## 11. Autenticación, permisos y secretos

### 11.1 Sesiones

Para el recorrido inicial, mobile enviará login, renovación y cierre a nuestra API; NestJS integrará Supabase Auth. No habrá un segundo sistema propio de contraseñas.

La API verificará los tokens, su firma, emisor, audiencia y expiración según el contrato configurado. Decodificar un JWT o leer una sesión almacenada no basta para autorizar una solicitud. La verificación de firma tampoco demuestra por sí sola que una sesión no haya sido revocada; las operaciones sensibles deberán comprobar su vigencia según la política elegida. [Verificación de claims](https://supabase.com/docs/reference/javascript/auth-getclaims).

No se guardará la sesión mutable de un usuario en un cliente global compartido entre solicitudes. El aislamiento de contexto y la renovación concurrente se probarán explícitamente.

### 11.2 Aislamiento por negocio

- La identidad se obtiene del token verificado; el acceso al negocio se comprueba con una membresía vigente.
- No se confiará en un `businessId` recibido ni en `user_metadata` editable para conceder permisos.
- Todas las lecturas y escrituras se acotarán al negocio autorizado, incluso cuando se conozca el identificador de un objeto.
- El MVP podrá tener un negocio ficticio y permisos simples; eso no justifica omitir las comprobaciones de aislamiento.

NestJS verificará identidad y sesión antes de llamar las funciones RPC con la identidad verificada. La llave de servicio identifica al backend, pero no reemplaza la autorización por membresía del usuario en cada negocio.

Las funciones públicas autorizadas para `service_role` ejecutarán la lógica de negocio bajo `mirror_executor`, un rol sin inicio de sesión ni capacidad para saltarse RLS. Instalarán el contexto verificado solamente dentro de su transacción, comprobarán membresía vigente y usarán RLS forzado en las tablas del esquema privado `mirror`. La ausencia de contexto no concederá acceso. Se probará que la reutilización de conexiones no arrastre contexto entre usuarios.

La Data API permanecerá habilitada para las funciones RPC del esquema `public`; `anon`, `authenticated` y `PUBLIC` no podrán ejecutarlas. Las tablas de Mirror permanecerán fuera de los esquemas expuestos y sin acceso directo para clientes móviles. Cada función limitará sus permisos y fijará un `search_path` seguro. [Seguridad de la API](https://supabase.com/docs/guides/api/securing-your-api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 11.3 Protección operativa

- Secretos en configuración del servidor; nunca en el bundle móvil, cliente generado o imagen pública.
- Credenciales de ejecución distintas de las usadas para migraciones o administración.
- Censura de tokens, contraseñas y llaves tanto en logs de aplicación como en URLs y telemetría HTTP.
- Validación al arrancar: una configuración incompleta impide iniciar el servicio.
- Límites de solicitudes, tamaño de payload y complejidad de simulación, especialmente en login, sincronización y evaluación.
- HTTPS, cabeceras defensivas y configuración del proxy ajustada al despliegue. CORS no se tratará como autorización.
- Scripts de preparación de demo protegidos; no habrá endpoints públicos para reiniciar o borrar datos.

Estas medidas son requisitos por implementar y comprobar, no una certificación de seguridad o cumplimiento legal. El uso posterior con empresas reales requerirá una revisión adicional del alcance, privacidad y operación.

## 12. Pruebas y criterios de aceptación

Las herramientas serán Vitest, `@nestjs/testing` y Supertest. Las pruebas financieras puras no necesitarán NestJS ni una conexión de red. Las de persistencia y concurrencia usarán PostgreSQL de prueba, no SQLite como sustituto de sus comportamientos. [Pruebas en NestJS](https://docs.nestjs.com/fundamentals/testing).

| Nivel         | Qué comprobará                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Unitarias     | Fórmulas, redondeo, calendario, restricciones, conservación de importes y estados del resultado.       |
| Integración   | Repositorios, restricciones únicas, RLS, contexto del pool, transacciones y adaptadores.               |
| E2E           | Login, consulta, evaluación, confirmación y rechazo de operaciones no autorizadas.                     |
| Contratos     | Validación y serialización de la API, OpenAPI y compatibilidad del cliente generado.                   |
| SDK y sandbox | Tests existentes del SDK y una prueba autenticada separada, limitada al conjunto sintético autorizado. |

Las pruebas normales de CI no dependerán de la disponibilidad de Nessie ni de credenciales reales. Se usarán fixtures identificados; una prueba autenticada será un paso separado y explícito.

Casos indispensables:

- Ejemplo de `Idea.md`: sin anticipo, saldo mínimo de -20,000 y brecha de protección de 30,000.
- Anticipo de 30,000: saldo mínimo de 10,000 sin aumentar el ingreso total del trabajo.
- Anticipo limitado a 20,000: no conserva el colchón del ejemplo.
- Pago escalonado de 10,000 y 30,000: conserva importes y explicita las condiciones pendientes.
- Depósito parcial, duplicado o ya incluido en el saldo de corte.
- Movimiento que no representa ingreso operativo.
- Dos confirmaciones simultáneas y reintento de una confirmación ya registrada.
- Cambio de compromisos o sincronización durante una evaluación.
- Token inválido, acceso a otro negocio y ausencia de contexto de autorización.
- Datos incompletos, fuente caída, información antigua y efecto posterior al día 30.
- IA no disponible y mensajes consistentes con el cálculo estructurado.

Los valores anteriores pertenecen exclusivamente al conjunto de referencia de `Idea.md`. No se reutilizarán como resultados fijos cuando cambien los datos de la demo.

## 13. Entrega, observabilidad y operación

GitHub Actions verificará formato, lint, tipos, pruebas y build. También comprobará la generación del cliente de API y los cambios de contrato. Las migraciones se ensayarán en un entorno de prueba antes de ejecutarlas sobre el entorno de demo.

Docker empaquetará el backend. Railway es el alojamiento inicial propuesto y admite builds con Dockerfile; la configuración de monorepo deberá incluir el SDK local en el contexto de construcción. [Railway](https://docs.railway.com/builds/dockerfiles).

Antes de la demo se confirmarán presupuesto, región, disponibilidad, conectividad con Supabase, límites de conexiones y recuperación de datos. No se asumirá que un plan gratuito permanece activo o incluye todas las garantías necesarias.

El servicio deberá contar con:

- Registros JSON con identificador de solicitud, operación y duración, sin payloads sensibles completos.
- Indicadores de errores, duración de sincronización, tiempo de cálculo y antigüedad de datos.
- Comprobaciones separadas de proceso vivo y disponibilidad de dependencias críticas.
- Apagado ordenado y cierre de conexiones.
- Preparación y recuperación reproducible del conjunto sintético.
- Política de respaldo acorde al entorno y una recuperación ensayada antes de un piloto real.

No se construirá un panel de administración para el MVP. Las tareas operativas mínimas se resolverán mediante herramientas del proveedor y scripts protegidos, sin hacer depender el recorrido móvil de acciones ocultas de un administrador.

## 14. Crecimiento y límites del MVP

El backend comenzará con un negocio ficticio, una cuenta, una moneda, un horizonte de 30 días y las dos alternativas definidas en `Idea.md`.

No se incorporarán inicialmente microservicios, Kubernetes, Redis, colas, WebSockets, GraphQL, un ERP, múltiples monedas ni una arquitectura de agentes.

| Necesidad observada posteriormente                          | Evolución posible                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Sincronizaciones largas o necesidad de reintentos duraderos | Cola persistente y workers idempotentes.                                                |
| Simulaciones que bloquean el proceso HTTP                   | Ejecutar el mismo motor en procesos de trabajo separados.                               |
| Mayor tráfico de consultas                                  | Medir e indexar consultas; después evaluar caché por negocio y versión.                 |
| Más instancias de API                                       | Mantener estado compartido en PostgreSQL y coordinar límites y tareas entre instancias. |
| Nuevas fuentes bancarias                                    | Agregar adaptadores manteniendo los contratos internos de Mirror.                       |
| Más usuarios por empresa                                    | Ampliar permisos y pruebas de aislamiento sin cambiar las fórmulas.                     |

Ninguna de estas ampliaciones está autorizada por este documento. Se elegirá cuando una necesidad o medición la justifique.

## 15. Orden de implementación y pendientes

Cuando se autorice construir:

1. Fijar versiones compatibles y verificar un montaje mínimo del backend con el SDK.
2. Validar Nessie con la llave existente y preparar datos sintéticos coherentes.
3. Definir el esquema, dinero, fechas, identidad y aislamiento por negocio.
4. Implementar y probar el motor financiero con el caso de referencia.
5. Exponer los casos de uso y generar el cliente para mobile.
6. Implementar confirmaciones atómicas, idempotencia, conciliación y vigencia.
7. Ejecutar pruebas completas y preparar el despliegue y la demo.

Pendientes concretos: parches de dependencias, versión ofrecida de PostgreSQL, generador del cliente, precisión monetaria final, políticas de sesión, configuración de RLS, región y plan de alojamiento, y contrato autenticado de Nessie.

También se confirmarán con los mentores las reglas aplicables al SDK preexistente, materiales, código previo y uso de IA. La arquitectura no supone que esas condiciones ya fueron aprobadas.

**Resultado esperado:** una app móvil conectada a una API propia, con datos trazables, cálculos reproducibles y decisiones verificables. Este documento registra el diseño; no afirma que el backend ya esté construido, desplegado o validado.

## 16. Local implementation decisions

The user authorized the complete backend implementation on 2026-09-12 and explicitly deferred external credentials, provider account selection, and deployment configuration. Local implementation and synthetic verification proceed independently; authenticated Supabase/Nessie and hosted HTTPS evidence remain separate gates in [Backend-Plan.md](Backend-Plan.md).

### 16.1 Money, calendar, and source policy

- The synthetic working currency is MXN in major units, with at most two decimal places. PostgreSQL uses `numeric(18,2)` and enforces a maximum absolute input of `999999999999.99`; nonnegative policy amounts and strictly positive commitments/movements are checked independently. Public amounts are decimal strings. This is a Mirror fixture policy, not a verified interpretation of Nessie units.
- decimal.js uses a private constructor with precision 40. Required adjustments round upward to a cent. No monetary calculation uses JavaScript floating-point arithmetic.
- Calendar dates are strict `YYYY-MM-DD` labels in `America/Monterrey`. The cutoff is explicit, and the projection checks the opening balance plus the next 30 dates. Debits precede credits on the same date. Completed history is already included in the opening balance and is never added again.
- Monthly recurrence uses a selected day, clamped to the last day of short months. Occurrences retain their series/source and date identity. The MVP expands finite requests of at most 12 occurrences; imported recurring bills expand only through the forecast horizon.
- Projections include expected and conditional receipts visibly. Unconditional additional-expense capacity uses observed opening cash and excludes future receipts. A pending supplier extension retains the original payment date for that capacity calculation until both supplier agreement and delivery conditions are confirmed.
- The replay dataset retains its original cutoff and timestamps, including when it becomes old. Source freshness uses a 15-minute threshold, the business calendar date, and the latest failed refresh. A new evaluation cannot make old source data current. Failed live refreshes, missing sources, and stale live data block confirmation. Explicitly labeled replay remains usable for local demonstrations.
- A live refresh prepares the current business-calendar cutoff and rejects an upstream read that crosses midnight. It cannot label completed movements after that cutoff as observed cash. Refresh publication order uses a database-generated sequence, independent of clock precision. A registered job identity is unique within the business across evaluations.
- The source adapter defaults to unclassified deposits and requires explicit verified-unit configuration before live use. Stable before/after account reads are a consistency heuristic, not an upstream transaction. The live cutoff, balance semantics, authenticated response variants, and controlled deposit must still be verified for the selected synthetic account.

### 16.2 Persistence, sessions, and contracts

Persistence uses the official Supabase JavaScript SDK with authored Valibot record contracts. `mirror_state` reads one coherent business snapshot. Application services derive a bounded change set, and `mirror_apply_state` atomically checks membership and the captured `dataRevision` before applying that change set. A competing write rejects the entire operation. The separate `planningVersion` remains the public financial-data version; internal revision changes also protect operations that do not advance it, such as evaluation persistence or failed refresh recording.

The synthetic MVP admits at most 32 MiB for one business state or change set and at most 10,000 rows per collection. SQL validates the resulting state before committing a mutation, so reaching a limit returns `DATASET_LIMIT` with HTTP 422 and preserves the previous readable dataset. Nothing is truncated or silently deleted. The internal RPC transport allows 33 MiB for the bounded change set and its envelope; the public HTTP request limit remains 256 KiB. These are explicit dataset limits, not a history-retention or scaling guarantee. Large descriptions and repeated immutable evaluations can exhaust the dataset before reaching a row-count limit.

The `mirror` schema is private. Public RPC functions are callable only by `service_role` and execute business-table operations as the non-login `mirror_executor` role, with forced RLS and transaction-local verified user/business context. Managed `auth.sessions` remains owned by Supabase; the bounded session-status function checks the required session identity without exposing provider session records. Fresh SQL migrations and the RPC replacement require new integration evidence; previous adapter checks do not verify them.

Supabase clients are created per operation without persisted or automatically refreshed global sessions. Each protected request verifies signature, issuer, audience, expiry, provider identity, local logout revocation, and the continued existence of the provider session. Mirror stores no passwords. Failed verification denies access. Synthetic Auth-contract tests are distinct from connecting to a real Supabase project.

Evaluations are immutable snapshots. Confirmation writes the decision, derived commitments, conditions, idempotency record, and audit event in one transaction after an atomic planning-version increment. Replaying the same key and content returns the original registration response, including after reconnecting. Reevaluation preserves history and evaluates the registered calendar without adding the same job again.

OpenAPI is generated from the compiled NestJS controllers and their Valibot schemas. Compilation is necessary because the framework's parameter discovery requires TypeScript decorator metadata. A small checked-in generator converts this finite contract into a browser-compatible Valibot client with named operations and runtime response validation. It fails on unsupported schema constructs; generated files are never hand-edited. Calendar predicates and cross-field financial constraints remain authoritative server validation and are described in the contract where OpenAPI 3.0 cannot express them. Native bundling and device networking remain mobile-stage checks.

### 16.3 Bounded workload and operations

The API limits JSON requests to 256 KiB, lists to 100 rows, financial calendars to 500 events, job costs to 100, supplier schedules and advance dates to 32 each, and collection delays to 30 days. Pagination never silently truncates financial inputs: excess financial input returns a limit error. The account adapter admits at most 500 combined source records.

Initial local measurement targets are p95 below 500 ms for ordinary reads and confirmations, below 750 ms for a normal job evaluation, and below 2 seconds for a bounded worst-case domain evaluation. Replay refresh has a 2-second local target; live provider timing is measured separately after configuration. Provider reads have a 15-second overall deadline, authentication an 8-second request timeout, database statements 5 seconds, and transactions 8 seconds. These are local MVP budgets, not production throughput claims. Actual measurements and environment are recorded under [verification](verification/financial-engine.md).

Rate limits are per process and source IP: 20 authentication requests and 120 other requests per minute, with bounded retained keys. The initial deployment must use one API instance; adding instances requires shared rate-limit coordination and a revised connection budget. Proxy trust is explicitly limited to zero, one, or two verified hops. Logs contain generated request IDs, method, status, and duration, without raw URLs or payloads.

Operational scripts create a new synthetic business and refuse to overwrite an existing one. There is no reset endpoint. Environment setup, migrations, container validation, recovery, and the remaining cloud gates are described in the [operations guide](verification/operations.md).

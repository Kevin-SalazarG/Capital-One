# Colchón — Diseño del backend

> Estado: backend MVP implementado y verificado localmente
>
> Fuente funcional: [Idea.md](Idea.md)
>
> Última actualización: 2026-09-12

Este documento define la estructura objetivo del backend de **Colchón**, el motor de liquidez predictiva para PyMEs mexicanas. Está pensado para un equipo de cuatro personas y una ventana de construcción de 36 horas, pero deja claros los límites para evolucionar el prototipo hacia un producto multiempresa.

La arquitectura descrita está implementada en `apps/api` y `supabase`. Los apartados de evolución futura distinguen explícitamente lo que queda fuera del MVP.

## 1. Objetivo y alcance

### 1.1 Responsabilidades del backend

El backend debe:

1. Autenticar usuarios y autorizar su acceso a una PyME.
2. Mantener los datos aislados por organización.
3. Ingerir movimientos bancarios desde Nessie en el prototipo.
4. Importar y normalizar CFDI sintético y payloads CFDI provenientes del
   frontend; la conexión fiscal directa queda para una evolución posterior.
5. Calcular el saldo proyectado día por día durante 30 días.
6. Detectar el primer día en que la caja cae por debajo del umbral de seguridad.
7. Generar una recomendación explicable y accionable.
8. Exponer un contrato estable para el dashboard.
9. Registrar frescura de datos, ejecuciones, errores y auditoría.

### 1.2 Fuera de alcance del MVP

- Aprobación o decisión automática de crédito.
- Transferencias, pagos o cobranza automática.
- Integración real con el buzón fiscal del SAT.
- Machine learning o una caja negra: el motor inicial será determinista.
- Soporte completo multi-moneda.
- Notificaciones multicanal complejas.
- Microservicios separados.

La recomendación es informativa: el dueño decide qué acción ejecutar. El backend no debe mover dinero ni presentar una recomendación como aprobación de financiamiento.

### 1.3 Frontera frontend/backend

El frontend será únicamente una capa de presentación. El backend NestJS es el dueño de todo el proceso:

- autenticación y sesión;
- autorización y permisos;
- ingesta de Nessie y CFDI;
- validación y normalización;
- persistencia en Supabase;
- cálculo del pronóstico;
- detección de huecos;
- generación de recomendaciones;
- serialización del payload del dashboard;
- manejo de errores, auditoría y reintentos.

El frontend solo renderiza respuestas del backend y mantiene estado visual local. No debe consultar Supabase, Nessie ni Storage directamente, calcular saldos, decidir permisos, importar datos o reconstruir reglas del pronóstico. Si un dato afecta al negocio, debe venir del backend.

## 2. Decisiones de arquitectura

| Decisión            | Elección                                                | Motivo                                                                                          |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Forma de despliegue | Monolito modular NestJS                                 | Reduce coordinación y latencia de desarrollo en 36 horas; cada dominio conserva límites claros. |
| Persistencia        | Supabase Postgres                                       | Fuente de verdad para datos normalizados, proyecciones y auditoría.                             |
| Autenticación       | Supabase Auth                                           | Evita construir usuarios, sesiones, recuperación de contraseña y emisión de tokens.             |
| Autorización        | Roles de organización en Postgres + guards NestJS + RLS | El guard mejora la experiencia; RLS es la defensa final ante fugas entre empresas.              |
| Archivos            | Supabase Storage, bucket privado                        | Los XML originales no deben guardarse como blobs grandes dentro de una tabla.                   |
| Banco en MVP        | Adaptador `NessieBankProvider`                          | El dominio no queda acoplado a la API de Capital One/Nessie.                                    |
| CFDI en MVP         | `SyntheticCfdiProvider` y carga de lote                 | Permite una demo reproducible; luego se sustituye por XML o proveedor fiscal.                   |
| Pronóstico          | Servicio puro y versionado (`rules-v1`)                 | Se puede probar con determinismo y explicar cada resultado.                                     |
| Procesamiento       | Síncrono para la demo; `sync_runs` desde el primer día  | La API funciona rápido con el dataset pequeño y queda preparada para pasar a jobs.              |
| Acceso a datos      | Repositories; no consultas dispersas desde controllers  | Facilita tests, evita N+1 y mantiene la lógica de persistencia aislada.                         |
| Frontera frontend   | Frontend de presentación → NestJS API                   | El frontend no ejecuta procesos de negocio ni habla con proveedores.                            |

### 2.1 Principios

- Organizar el código por **feature**, no por carpetas globales de `controllers`, `services` y `repositories`.
- Mantener el motor de pronóstico libre de NestJS, Supabase y Nessie.
- No compartir providers entre módulos sin una interfaz explícita.
- No usar el JWT del usuario para decidir roles de organización; los roles viven en `organization_members`.
- Usar dinero como `numeric`, nunca como `float`.
- Hacer que las importaciones sean idempotentes.
- Exponer el dashboard mediante un endpoint agregado para evitar múltiples consultas desde el frontend.
- Versionar el algoritmo y conservar la fecha de corte de sus entradas.

## 3. Contexto del sistema

```text
┌──────────────────────┐
│      Web dashboard    │
│ Presentación + HTTP   │
└──────────┬───────────┘
           │ Cookie de sesión HTTP-only
           ▼
┌──────────────────────────────────────────────────────────────┐
│                         NestJS API                            │
│ Auth · tenancy · DTOs · casos de uso · adapters · observability│
└─────────┬─────────────────────┬───────────────────────┬──────┘
          │                     │                       │
          ▼                     ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Supabase Auth    │  │ Supabase Postgres │  │ Supabase Storage │
│ usuarios/JWT     │  │ datos + RLS       │  │ XML privados     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          ▲                     ▲
          │                     │
          │             normalización y persistencia
          │                     │
          └──────────────┬──────┘
                         ▼
                 ┌────────────────┐
                 │ Nessie API      │
                 │ adaptador banco  │
                 └────────────────┘
```

El navegador solo habla con NestJS. NestJS usa Supabase Auth como proveedor de identidad y Supabase Postgres/Storage como infraestructura interna. No se debe enviar la publishable key al navegador ni permitir que el frontend consulte directamente tablas, Storage o proveedores sensibles.

## 4. Stack y convenciones

| Capa            | Tecnología implementada                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Runtime         | Node.js 22+                                                                                     |
| Lenguaje        | TypeScript con `strict: true`                                                                   |
| API             | NestJS, REST JSON                                                                               |
| Validación      | `ValidationPipe` global con DTOs, `class-validator` y `class-transformer`                       |
| Auth            | Supabase Auth + JWT                                                                             |
| JWT asimétrico  | `jose` + JWKS del proyecto Supabase                                                             |
| Persistencia    | `@supabase/supabase-js` detrás de repositories; RPC o transacción SQL para operaciones atómicas |
| Tipos de DB     | `supabase gen types --lang typescript`                                                          |
| Observabilidad  | Logs estructurados JSON, `requestId`, health checks y métricas                                  |
| Rate limiting   | `@nestjs/throttler` o gateway equivalente                                                       |
| Tests           | Jest/Nest testing utilities, Supertest, pgTAP para RLS                                          |
| Banco demo      | `NessieClient` del `nessie-node-sdk` local existente en el repositorio                          |
| Package manager | pnpm; el SDK existente fija pnpm 11.1.3                                                         |

El SDK existente requiere Node.js 22 o superior y todavía no está publicado en npm. **Decisión confirmada: el backend usará ese SDK local directamente.** Durante el hackathon se puede consumir como paquete local/workspace o como tarball generado desde [`nessie-node-sdk`](../nessie-node-sdk/README.md). No se debe reimplementar su transporte HTTP, validación, redacción de errores ni política de reintentos. El API key de Nessie debe vivir únicamente en el servidor.

### 4.1 Fuentes de contrato de Nessie

Usaremos las dos fuentes de forma complementaria:

1. [Documentación oficial de Nessie](https://prod.nessieisreal.com/docs): referencia del contrato de la API.
2. [Repositorio `nessie-node-sdk`](https://github.com/Kevin-SalazarG/nessie-node-sdk): implementación tipada que se integra al backend.

La documentación no es el servidor de datos. El SDK apunta por defecto a `https://prod-api.nessieisreal.com`; esa será la URL que usará NestJS a través de `NessieClient`.

## 5. Estructura propuesta del proyecto

Si el frontend vive en el mismo repositorio, la estructura recomendada es:

```text
.
├── apps/
│   └── api/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/
│       │   ├── common/
│       │   │   ├── auth/
│       │   │   ├── database/
│       │   │   ├── errors/
│       │   │   ├── http/
│       │   │   ├── logging/
│       │   │   └── tenancy/
│       │   └── modules/
│       │       ├── health/
│       │       ├── identity/
│       │       ├── organizations/
│       │       ├── connections/
│       │       ├── bank-data/
│       │       ├── cfdi/
│       │       ├── forecasting/
│       │       ├── recommendations/
│       │       ├── dashboard/
│       │       └── ingestion/
│       ├── test/
│       └── package.json
├── packages/
│   └── domain/                 # Opcional; tipos/reglas compartidos
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── docs/
│   ├── Idea.md
│   └── Backend.md
└── nessie-node-sdk/
```

Dentro de cada feature:

```text
forecasting/
├── forecasting.module.ts
├── presentation/
│   └── http/
│       ├── forecasting.controller.ts
│       └── dto/
├── application/
│   ├── commands/
│   └── queries/
├── domain/
│   ├── forecast-engine.ts
│   ├── forecast.types.ts
│   └── forecast.errors.ts
└── infrastructure/
    ├── persistence/
    │   └── forecast.repository.ts
    └── providers/
```

Los controllers solo traducen HTTP a casos de uso. No deben calcular saldos, construir SQL ni llamar a Nessie directamente.

### 5.1 Mapa de módulos

| Módulo            | Responsabilidad                                          | Depende de                                |
| ----------------- | -------------------------------------------------------- | ----------------------------------------- |
| `health`          | Liveness, readiness y versión                            | Config                                    |
| `identity`        | Validación del JWT y contexto de usuario                 | Supabase Auth, Config                     |
| `organizations`   | PyMEs, miembros, roles y zona horaria                    | Identity                                  |
| `connections`     | Conexiones bancarias/fiscales y estado de sincronización | Organizations                             |
| `bank-data`       | Cuentas y movimientos normalizados                       | Connections                               |
| `cfdi`            | Lotes, facturas emitidas/recibidas y archivos XML        | Connections, Storage                      |
| `forecasting`     | Inputs, motor `rules-v1`, corridas y puntos diarios      | Bank Data, CFDI, Organizations            |
| `recommendations` | Huecos y acciones sugeridas                              | Forecasting, CFDI                         |
| `dashboard`       | Respuesta agregada para la pantalla principal            | Forecasting, Recommendations              |
| `ingestion`       | Orquestación de importaciones y regeneración             | Connections, Bank Data, CFDI, Forecasting |

`ingestion` debe coordinar los módulos mediante casos de uso o eventos; no debe convertir al módulo en un “god service”. Si una operación empieza a crecer, separar el job executor es preferible a crear dependencias circulares.

## 6. Identidad, multi-tenancy y autorización

### 6.1 Flujo de autenticación

1. El frontend muestra el formulario de acceso y envía las credenciales a `POST /api/v1/auth/sign-in`.
2. NestJS llama a Supabase Auth y nunca expone la integración interna al navegador.
3. NestJS establece cookies `HttpOnly`, `Secure` en producción y `SameSite=Lax` o más restrictivo.
4. El navegador envía la cookie en cada request al API; para clientes no-browser se puede aceptar `Authorization: Bearer`.
5. `SupabaseJwtGuard` extrae y valida firma, emisor, audiencia, expiración y `sub`.
6. NestJS crea un `RequestContext` con `userId`, `requestId` y, si aplica, `organizationId`.
7. `PermissionGuard` verifica el permiso requerido para la ruta y `OrganizationAccessService` comprueba membresía/rol actual.
8. El repository crea un cliente Supabase server-side con el contexto autorizado para que RLS aplique la misma restricción en Postgres.

Para requests mutating con cookies, validar `Origin`/`Referer` y aplicar una protección CSRF apropiada. El frontend no debe guardar refresh tokens en `localStorage`.

Se debe preferir firma asimétrica y verificación con JWKS. Si el proyecto usa una clave HS256 compartida, el backend debe validar el token contra Auth o seguir la configuración oficial; no se debe copiar una clave compartida en más servicios de los necesarios.

### 6.2 Roles de organización

| Rol       | Alcance                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `owner`   | Control total de la organización, incluidos miembros, conexiones, configuración y eliminación controlada. |
| `admin`   | Operación diaria completa, excepto eliminar la organización o transferir ownership.                       |
| `analyst` | Lectura financiera y ejecución/análisis de pronósticos; no administra conexiones ni miembros.             |
| `viewer`  | Solo lectura de dashboard, pronósticos, huecos y recomendaciones; no ve datos fuente crudos.              |

Para el hackathon se puede comenzar con `owner` y `viewer`, pero conviene guardar el rol como enum/texto validado desde la primera migración.

### 6.3 Catálogo granular de permisos

Los roles son bundles de permisos. El permiso, no el nombre del rol, es lo que una ruta debe exigir.

| Área            | Permiso                      | Owner | Admin | Analyst | Viewer |
| --------------- | ---------------------------- | :---: | :---: | :-----: | :----: |
| Dashboard       | `dashboard:read`             |   ✓   |   ✓   |    ✓    |   ✓    |
| Organización    | `organization:create`*       |   —   |   —   |    —    |   —    |
| Organización    | `organization:read`          |   ✓   |   ✓   |    ✓    |   ✓    |
| Organización    | `organization:update`        |   ✓   |   ✓   |    —    |   —    |
| Organización    | `organization:delete`        |   ✓   |   —   |    —    |   —    |
| Miembros        | `member:read`                |   ✓   |   ✓   |    —    |   —    |
| Miembros        | `member:invite`              |   ✓   |   ✓   |    —    |   —    |
| Miembros        | `member:update`              |   ✓   |   ✓   |    —    |   —    |
| Miembros        | `member:remove`              |   ✓   |   ✓   |    —    |   —    |
| Conexiones      | `connection:read`            |   ✓   |   ✓   |    ✓    |   —    |
| Conexiones      | `connection:create`          |   ✓   |   ✓   |    —    |   —    |
| Conexiones      | `connection:sync`            |   ✓   |   ✓   |    —    |   —    |
| Conexiones      | `connection:update`          |   ✓   |   ✓   |    —    |   —    |
| Conexiones      | `connection:revoke`          |   ✓   |   —   |    —    |   —    |
| Banco           | `bank-account:read`          |   ✓   |   ✓   |    ✓    |   —    |
| Banco           | `bank-transaction:read`      |   ✓   |   ✓   |    ✓    |   —    |
| Banco           | `bank-transaction:reconcile` |   ✓   |   ✓   |    —    |   —    |
| CFDI            | `cfdi:read`                  |   ✓   |   ✓   |    ✓    |   —    |
| CFDI            | `cfdi:import`                |   ✓   |   ✓   |    —    |   —    |
| CFDI            | `cfdi:update`                |   ✓   |   ✓   |    —    |   —    |
| CFDI            | `cfdi:download`              |   ✓   |   ✓   |    —    |   —    |
| Forecast        | `forecast:read`              |   ✓   |   ✓   |    ✓    |   ✓    |
| Forecast        | `forecast:run`               |   ✓   |   ✓   |    ✓    |   —    |
| Forecast        | `forecast:configure`         |   ✓   |   ✓   |    —    |   —    |
| Liquidez        | `liquidity-gap:read`         |   ✓   |   ✓   |    ✓    |   ✓    |
| Liquidez        | `liquidity-gap:update`       |   ✓   |   ✓   |    ✓    |   —    |
| Recomendaciones | `recommendation:read`        |   ✓   |   ✓   |    ✓    |   ✓    |
| Recomendaciones | `recommendation:update`      |   ✓   |   ✓   |    ✓    |   —    |
| Auditoría       | `audit:read`                 |   ✓   |   ✓   |    —    |   —    |

`organization:create` es una permission de usuario autenticado, no una permission de tenant; por eso no depende del rol de una organización existente.

Reglas especiales:

- `member:update` nunca puede asignar el rol `owner` ni quitar el último owner.
- `member:remove` y `connection:revoke` deben requerir confirmación y auditarse.
- `cfdi:download` debe entregar una URL firmada de corta duración y registrar quién descargó el archivo.
- `organization:delete` no se habilita en el MVP aunque exista en el catálogo.
- `viewer` obtiene un dashboard agregado, no las tablas crudas de transacciones o CFDI.
- Un worker interno no es un rol de usuario: recibe un contexto de job limitado, valida el tenant y solo ejecuta la operación para la que fue creado.

### 6.4 Cadena de evaluación de permisos

Cada request protegido debe pasar por estas capas, en orden:

1. **Autenticación:** existe un usuario válido.
2. **Formato:** `organizationId` y resource IDs tienen formato válido.
3. **Membresía:** el usuario pertenece a la organización y está `active`.
4. **Permiso:** la ruta exige un permiso concreto.
5. **Alcance:** el recurso consultado pertenece al mismo `organizationId`.
6. **RLS:** Postgres vuelve a aplicar el aislamiento.
7. **Auditoría:** mutaciones sensibles dejan un evento sin datos secretos.

Nunca resolver autorización con `role === 'admin'` repetido en controllers. Centralizarlo en `PermissionGuard` y `OrganizationAccessService`.

### 6.3 Reglas de tenancy

- Toda tabla de negocio tiene `organization_id`.
- Toda ruta de negocio incluye `:organizationId` o resuelve una organización activa explícita.
- Nunca aceptar un `organization_id` del body y usarlo sin validarlo contra la ruta y la membresía.
- Los roles se leen desde `organization_members`, no desde `user_metadata`.
- Una consulta sin organización explícita debe ser un error de diseño, salvo `GET /me` y health checks.
- RLS debe negar por defecto; el guard de NestJS no sustituye las políticas de Postgres.

Cliente Supabase por request:

```ts
createClient(supabaseUrl, supabasePublishableKey, {
  accessToken: async () => userAccessToken,
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
```

El cliente administrativo, inicializado con una secret key o la clave legacy `service_role`, debe estar separado, ser server-only y usarse únicamente en jobs confiables. Como esa clave puede saltarse RLS, cada job debe revalidar `organizationId`, `connectionId` y el estado de la conexión antes de leer o escribir.

## 7. Modelo de datos de Supabase

### 7.1 Esquemas

| Esquema   | Uso                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------- |
| `auth`    | Administrado por Supabase Auth; no modificar tablas internas.                                  |
| `public`  | Tablas de negocio expuestas por la API; todas con RLS.                                         |
| `private` | Helpers SQL internos, funciones de autorización y objetos que no deben exponerse por Data API. |
| `storage` | Metadatos administrados por Supabase Storage; proteger `storage.objects` con policies.         |

### 7.2 Tablas principales

#### `organizations`

Representa una PyME.

- `id uuid primary key`
- `name text not null`
- `legal_name text`
- `rfc text`
- `currency char(3) not null default 'MXN'`
- `time_zone text not null default 'America/Mexico_City'`
- `minimum_cash_reserve numeric(19,4) not null default 0`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz`, `updated_at timestamptz`

#### `organization_members`

Relaciona usuarios de Supabase Auth con una organización.

- `organization_id uuid references organizations(id)`
- `user_id uuid references auth.users(id)`
- `role text not null check (role in ('owner', 'admin', 'analyst', 'viewer'))`
- `status text not null check (status in ('active', 'invited', 'suspended'))`
- `created_at`, `updated_at`
- `primary key (organization_id, user_id)`

#### `data_connections`

Representa una fuente conectada, sin guardar secretos crudos.

- `id uuid primary key`
- `organization_id uuid not null`
- `kind text not null check (kind in ('bank', 'cfdi'))`
- `provider text not null` — `nessie`, `synthetic_cfdi`, `xml_upload`, etc.
- `status text not null check (status in ('pending', 'active', 'error', 'revoked'))`
- `external_customer_id text`
- `credential_ref text` — referencia a secret manager, nunca el token.
- `last_synced_at timestamptz`
- `last_error_code text`
- `metadata jsonb not null default '{}'::jsonb`
- timestamps

#### `sync_runs`

Permite observar y volver idempotente una sincronización.

- `id uuid primary key`
- `organization_id uuid not null`
- `connection_id uuid not null references data_connections(id)`
- `status text not null check (status in ('queued', 'running', 'completed', 'partial', 'failed'))`
- `started_at`, `completed_at`
- `records_seen integer`, `records_inserted integer`, `records_updated integer`, `records_rejected integer`
- `provider_request_id text`
- `error_code text`, `error_message_safe text`
- `metadata jsonb not null default '{}'::jsonb`

#### `bank_accounts`

- `id uuid primary key`
- `organization_id uuid not null`
- `connection_id uuid not null references data_connections(id)`
- `external_id text not null`
- `name text not null`
- `institution_name text`
- `currency char(3) not null default 'MXN'`
- `current_balance numeric(19,4) not null`
- `balance_as_of timestamptz not null`
- unique `(connection_id, external_id)`

#### `bank_transactions`

Movimientos normalizados. La convención del dominio es: entrada positiva, salida negativa.

- `id uuid primary key`
- `organization_id uuid not null`
- `bank_account_id uuid not null references bank_accounts(id)`
- `external_id text not null`
- `posted_at timestamptz not null`
- `value_date date`
- `signed_amount numeric(19,4) not null`
- `currency char(3) not null default 'MXN'`
- `category text`
- `merchant_name text`
- `description text`
- `is_reconciled boolean not null default false`
- `raw_payload jsonb not null default '{}'::jsonb`
- unique `(bank_account_id, external_id)`

#### `cfdi_import_batches`

Agrupa una carga sintética o un lote de XMLs.

- `id uuid primary key`
- `organization_id uuid not null`
- `connection_id uuid references data_connections(id)`
- `source text not null check (source in ('synthetic', 'xml_upload', 'sat_connector'))`
- `status text not null check (status in ('received', 'processing', 'completed', 'partial', 'failed'))`
- `storage_prefix text`
- contadores de recibidos, aceptados y rechazados
- timestamps y error seguro

#### `cfdi_invoices`

Tabla normalizada para cuentas por cobrar y por pagar.

- `id uuid primary key`
- `organization_id uuid not null`
- `import_batch_id uuid references cfdi_import_batches(id)`
- `cfdi_uuid text not null`
- `direction text not null check (direction in ('receivable', 'payable'))`
- `issuer_rfc text not null`
- `receiver_rfc text not null`
- `counterparty_name text`
- `issued_at timestamptz not null`
- `due_on date`
- `total_amount numeric(19,4) not null check (total_amount >= 0)`
- `outstanding_amount numeric(19,4) not null check (outstanding_amount >= 0)`
- `currency char(3) not null default 'MXN'`
- `payment_status text not null check (payment_status in ('open', 'partial', 'paid', 'cancelled', 'unknown'))`
- `expected_collection_probability numeric(5,4)` — opcional para CxC; acotada entre 0 y 1.
- `xml_storage_path text` — ruta privada, no URL pública.
- `raw_payload jsonb not null default '{}'::jsonb`
- unique `(organization_id, cfdi_uuid, direction)`

En el MVP, `due_on` debe venir en el dataset sintético. Si una fuente real no proporciona fecha, no inventar silenciosamente una fecha: marcar el supuesto y reducir la confianza del pronóstico.

#### `recurring_obligations`

Para nómina, renta, servicios y otros gastos fijos.

- `id uuid primary key`
- `organization_id uuid not null`
- `name text not null`
- `category text not null`
- `expected_amount numeric(19,4) not null check (expected_amount >= 0)`
- `frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly'))`
- `next_due_on date not null`
- `active boolean not null default true`
- timestamps

#### `forecast_runs`

Una fotografía reproducible del cálculo.

- `id uuid primary key`
- `organization_id uuid not null`
- `as_of_on date not null`
- `horizon_days integer not null default 30 check (horizon_days between 1 and 90)`
- `current_balance numeric(19,4) not null`
- `safety_threshold numeric(19,4) not null`
- `algorithm_version text not null default 'rules-v1'`
- `source_cutoff_at timestamptz not null`
- `input_hash text not null`
- `status text not null check (status in ('running', 'completed', 'failed'))`
- `confidence text not null check (confidence in ('low', 'medium', 'high'))`
- `metadata jsonb not null default '{}'::jsonb`
- timestamps

`input_hash` evita crear corridas idénticas innecesarias y ayuda a explicar por qué dos resultados cambiaron.

#### `forecast_points`

Una fila por día de una corrida completada.

- `id uuid primary key`
- `organization_id uuid not null`
- `forecast_run_id uuid not null references forecast_runs(id)`
- `forecast_on date not null`
- `projected_balance numeric(19,4) not null`
- `expected_inflows numeric(19,4) not null default 0`
- `expected_outflows numeric(19,4) not null default 0`
- `threshold numeric(19,4) not null`
- unique `(forecast_run_id, forecast_on)`

#### `liquidity_gaps`

- `id uuid primary key`
- `organization_id uuid not null`
- `forecast_run_id uuid not null references forecast_runs(id)`
- `gap_on date not null`
- `projected_balance numeric(19,4) not null`
- `threshold numeric(19,4) not null`
- `deficit_amount numeric(19,4) not null check (deficit_amount >= 0)`
- `minimum_reserve_amount numeric(19,4) not null check (minimum_reserve_amount >= 0)`
- `status text not null check (status in ('open', 'acknowledged', 'resolved', 'dismissed'))`
- unique `(forecast_run_id)`

Una corrida puede no tener hueco; en ese caso no se crea una fila en `liquidity_gaps`.

#### `recommendations`

- `id uuid primary key`
- `organization_id uuid not null`
- `liquidity_gap_id uuid not null references liquidity_gaps(id)`
- `type text not null check (type in ('collect_receivable', 'negotiate_payable', 'reserve_cash'))`
- `source_invoice_id uuid references cfdi_invoices(id)`
- `title text not null`
- `rationale text not null`
- `recommended_amount numeric(19,4) not null check (recommended_amount >= 0)`
- `action_by date`
- `priority integer not null check (priority between 1 and 5)`
- `status text not null check (status in ('new', 'viewed', 'accepted', 'dismissed'))`
- `evidence jsonb not null default '{}'::jsonb`
- timestamps

`evidence` debe contener referencias a IDs y valores usados por la regla; no debe contener secretos ni una copia innecesaria de XML.

#### `audit_events`

Registro mínimo de acciones relevantes:

- `id uuid primary key`
- `organization_id uuid`
- `actor_user_id uuid references auth.users(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

### 7.3 Relaciones

```text
organizations
├── organization_members
├── data_connections ──┬── bank_accounts ── bank_transactions
│                      └── sync_runs
├── cfdi_import_batches ── cfdi_invoices
├── recurring_obligations
└── forecast_runs ── forecast_points
                      └── liquidity_gaps ── recommendations
```

### 7.4 Índices mínimos

Crear índices que sigan las consultas reales y las políticas de tenancy:

- `organization_members (user_id, status)` y `(organization_id, role)`.
- `data_connections (organization_id, kind, status)`.
- `bank_accounts (organization_id)`.
- `bank_transactions (organization_id, posted_at desc)`.
- `bank_transactions (bank_account_id, posted_at desc)`.
- `cfdi_invoices (organization_id, direction, payment_status, due_on)`.
- Índice parcial para facturas abiertas: `where payment_status in ('open', 'partial')`.
- `forecast_runs (organization_id, created_at desc)`.
- `forecast_points (forecast_run_id, forecast_on)`.
- `liquidity_gaps (organization_id, status, gap_on)`.
- `recommendations (organization_id, status, priority)`.

No cargar todas las transacciones o facturas para construir el dashboard. Usar filtros, selección de columnas y paginación por cursor en endpoints de detalle.

## 8. Seguridad Supabase

### 8.1 RLS obligatorio

Toda tabla en `public` debe tener RLS habilitado. Una policy no revoca grants; hay que revisar ambos. El patrón base es:

```sql
alter table public.bank_transactions enable row level security;

create policy "active members can read bank transactions"
on public.bank_transactions
for select
to authenticated
using (private.is_org_member(organization_id));

create policy "admins can write bank transactions"
on public.bank_transactions
for insert
to authenticated
with check (private.is_org_admin(organization_id));

create policy "admins can update bank transactions"
on public.bank_transactions
for update
to authenticated
using (private.is_org_admin(organization_id))
with check (private.is_org_admin(organization_id));
```

No usar `auth.role()` en las policies. Especificar `to authenticated` o `to anon` y combinarlo con la pertenencia a la organización. Para `UPDATE` siempre definir `USING` y `WITH CHECK`.

Si se usa un helper `SECURITY DEFINER` para evitar recursión al consultar `organization_members`, debe vivir en `private`, tener `search_path` fijo, aceptar solo valores tipados, comprobar `auth.uid()` y exponer únicamente un resultado booleano. Revocar `EXECUTE` a `public` y otorgarlo solo a los roles que lo necesiten. Es una excepción controlada, no una solución genérica para permisos.

Ejemplo conceptual del helper:

```sql
create schema if not exists private;

create or replace function private.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  );
$$;

revoke all on function private.is_org_member(uuid) from public;
grant execute on function private.is_org_member(uuid) to authenticated;
```

La función de admin debe seguir la misma disciplina y debe probarse con casos de usuario de otra organización, usuario suspendido y usuario anónimo.

### 8.2 Secretos y datos sensibles

- `SUPABASE_PUBLISHABLE_KEY` puede estar en clientes públicos; las secret keys y la legacy `service_role` no.
- `NESSIE_API_KEY` solo existe en el proceso backend/worker.
- No registrar URLs autenticadas, tokens, XML completo, RFC innecesario ni cuerpos crudos de proveedores.
- `raw_payload` se conserva solo si aporta valor para depuración o auditoría; aplicar retención.
- Los XML van a un bucket privado, por ejemplo `cfdi-private`, con rutas `org/<organization-id>/<batch-id>/<file>.xml`.
- No generar URLs públicas permanentes; entregar URLs firmadas de vida corta después de autorizar.
- Si Storage usa `upsert`, sus policies deben cubrir `INSERT`, `SELECT` y `UPDATE`.
- Los secretos de producción deben vivir en el secret manager de la plataforma, no en `.env` versionado.

### 8.3 Storage y archivos

Las policies sobre `storage.objects` deben comprobar bucket, prefijo de organización y pertenencia activa. Los archivos CFDI no deben ser accesibles a `anon`. Para la demo, también se puede omitir el XML y guardar solo el dataset sintético normalizado.

### 8.4 Controles HTTP

- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- `helmet`, CORS con allow-list y límites de body.
- Rate limit por IP y usuario en endpoints de importación y sincronización.
- `X-Request-Id` generado o propagado; incluirlo en logs y respuestas de error.
- `Idempotency-Key` en mutaciones que puedan repetirse por reintentos.
- Respuestas de error sin stack traces ni mensajes crudos de Postgres/Nessie.
- Timeouts explícitos para todo proveedor externo.

## 9. Ingesta y normalización

### 9.1 Puertos de proveedores

El dominio depende de interfaces, no de SDKs concretos:

```ts
export interface BankDataProvider {
  ensureCustomer(input: EnsureCustomerInput): Promise<ExternalCustomer>;
  listAccounts(externalCustomerId: string): Promise<ExternalAccount[]>;
  listTransactions(externalAccountId: string): Promise<ExternalTransaction[]>;
}

export interface CfdiProvider {
  importBatch(input: CfdiImportInput): Promise<ExternalCfdiDocument[]>;
}
```

Implementaciones iniciales:

- `NessieBankProvider`: instancia y usa `NessieClient` desde `nessie-node-sdk`; traduce los nombres externos a modelos internos.
- `SyntheticCfdiProvider`: genera o recibe el lote de 20–30 CxC y 15–20 CxP de la demo.
- Futuras: `BelvoBankProvider`, `FinerioBankProvider`, `SyncfyBankProvider`, `XmlCfdiProvider` o un conector autorizado.

### 9.2 Pipeline

```text
crear sync_run
      │
      ▼
leer proveedor con timeout
      │
      ▼
validar forma y tipos del payload
      │
      ▼
normalizar fechas, moneda, dirección y montos
      │
      ▼
deduplicar por external_id / cfdi_uuid
      │
      ▼
upsert en tablas fuente
      │
      ▼
marcar sync_run y actualizar last_synced_at
      │
      ▼
generar nueva corrida de pronóstico
```

Reglas:

- Una importación repetida no crea otra transacción ni otra factura.
- Los identificadores externos son únicos dentro de su conexión/organización.
- Un `sync_run` conserva contadores y un error seguro.
- Los datos rechazados se contabilizan y se pueden consultar sin bloquear todo el lote.
- El balance actual y las transacciones llevan fecha de corte.
- No mezclar monedas sin una estrategia explícita de conversión.
- La regeneración del pronóstico solo lee entradas normalizadas; no llama a Nessie desde el motor.

### 9.3 Nessie en la demo

1. Crear o localizar el customer simulado.
2. Resolver la cuenta de cheques asociada.
3. Leer transacciones de nómina, renta, ventas y compras.
4. Traducirlas a `bank_accounts` y `bank_transactions`.
5. Sembrar el dataset CFDI sintético.
6. Ejecutar `rules-v1`.

El SDK ya limita reintentos automáticos a operaciones de lectura. Mantener esa propiedad: no reintentar ciegamente mutaciones de Nessie y usar backoff acotado para errores transitorios. No registrar requests con el API key en la URL.

### 9.4 Integración concreta con el SDK local

El `NessieClient` debe registrarse como singleton dentro de un módulo de infraestructura. La configuración vive en NestJS; el SDK sigue siendo responsable del transporte y de validar las respuestas.

La regla de implementación es: consultar la documentación/OpenAPI para entender el contrato, pero llamar a Nessie exclusivamente a través del SDK local. Si existe una diferencia entre la documentación y una respuesta real, registrar el caso en el contrato del SDK y adaptar únicamente `NessieBankProvider`; no filtrar esa diferencia al dominio ni reescribir el transporte.

```ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NessieClient } from "nessie-node-sdk";

@Injectable()
export class NessieClientFactory {
  constructor(private readonly config: ConfigService) {}

  create(): NessieClient {
    return new NessieClient({
      apiKey: this.config.getOrThrow<string>("NESSIE_API_KEY"),
      baseUrl: this.config.get<string>(
        "NESSIE_BASE_URL",
        "https://prod-api.nessieisreal.com",
      ),
      timeoutMs: this.config.get<number>("NESSIE_TIMEOUT_MS", 10_000),
      maxRetries: 2,
    });
  }
}
```

En la aplicación real, `NessieClientFactory` se puede exponer como provider `NESSIE_CLIENT` y `NessieBankProvider` lo recibe por inyección de dependencias. No crear un cliente nuevo en cada request.

El SDK no expone un recurso genérico `transactions.listByAccount`. Para construir `bank_transactions`, el adapter debe combinar los recursos publicados por el SDK:

| Recurso del SDK                        |               Signo interno | Uso                                           |
| -------------------------------------- | --------------------------: | --------------------------------------------- |
| `accounts.get(accountId)`              |                           — | Balance actual y metadatos de la cuenta.      |
| `deposits.listByAccount(accountId)`    |                         `+` | Entradas de efectivo.                         |
| `withdrawals.listByAccount(accountId)` |                         `-` | Retiros/salidas.                              |
| `purchases.listByAccount(accountId)`   |                         `-` | Compras y gastos.                             |
| `transfers.listByAccount(accountId)`   | Según `payer_id`/`payee_id` | Transferencias; determinar si salen o entran. |
| `bills.listByAccount(accountId)`       |              `-` programado | Obligaciones recurrentes opcionales.          |

Flujo exacto del adapter:

```ts
const accounts = await client.accounts.listByCustomer(externalCustomerId);

for (const account of accounts.filter((item) => item.type === "Checking")) {
  const [deposits, withdrawals, purchases, transfers] = await Promise.all([
    client.deposits.listByAccount(account._id),
    client.withdrawals.listByAccount(account._id),
    client.purchases.listByAccount(account._id),
    client.transfers.listByAccount(account._id),
  ]);

  // Cada recurso se normaliza a BankTransactionInput y se persiste por lote.
}
```

El código anterior es una guía del adapter, no debe copiarse al controller. Antes de persistir:

- usar `account._id` como `external_account_id`;
- usar un `external_id` compuesto como `<resource>:<record._id>` para evitar colisiones entre recursos;
- tomar `transaction_date` de depósitos/retiros/transferencias;
- aceptar `purchase_date` y `transaction_date` en compras, según cuál entregue la respuesta;
- conservar el payload normalizado mínimo en `raw_payload`, sin incluir el API key;
- convertir `amount` a `numeric(19,4)` y aplicar el signo en el adapter;
- usar el `RequestOptions` final del SDK para propagar `AbortSignal` y timeout cuando el job sea cancelable.

Para crear o localizar el customer simulado, manejar la unión `CreationResult<T>` del SDK de forma explícita: si la respuesta contiene `objectCreated`, usar su `_id`; si es un acknowledgement de texto, consultar/listar y resolver el customer por un identificador estable del seed. No asumir que un `POST` siempre devuelve el objeto creado.

Los errores del SDK (`NessieHttpError`, `NessieTimeoutError`, `NessieNetworkError`, `NessieResponseError`, etc.) se convierten en errores internos del adapter y luego en códigos HTTP del API. Nunca pasar el body crudo del error al cliente.

## 10. Motor de pronóstico

### 10.1 Contrato del dominio

```ts
type ForecastInput = {
  asOf: Date;
  horizonDays: number;
  currentBalance: Money;
  receivables: ScheduledCashEvent[];
  payables: ScheduledCashEvent[];
  recurringObligations: RecurringCashEvent[];
  variableOutflowAverage: Money;
  minimumCashReserve: Money;
};

type ForecastOutput = {
  algorithmVersion: "rules-v1";
  points: ForecastPoint[];
  safetyThreshold: Money;
  firstGap?: LiquidityGap;
  confidence: "low" | "medium" | "high";
  explanation: Explanation;
};
```

`Money` debe representar monto y moneda con precisión decimal. El engine recibe fechas de negocio ya convertidas a la zona horaria de la organización.

### 10.2 Cálculo diario

Convención: entradas positivas, salidas negativas.

```text
saldo[0] = saldo_actual

saldo[día] = saldo[día - 1]
           + entradas_CxC_esperadas(día)
           + movimientos_bancarios_conocidos(día)
           + salidas_CxP_esperadas(día)
           + gastos_recurrentes(día)
           + gasto_variable_estimado(día)
```

Las salidas deben llegar como valores negativos al engine. Para CxC se puede usar:

```text
entrada_esperada = outstanding_amount * expected_collection_probability
```

En `rules-v1`, si la probabilidad no existe se usa 1 para el dataset sintético y se reduce la confianza si la fuente real no tiene suficiente evidencia. Las facturas pagadas o canceladas quedan fuera.

### 10.3 Umbral y hueco

```text
promedio_gasto_mensual = promedio de salidas operativas recientes
umbral_seguridad = max(
  minimum_cash_reserve,
  promedio_gasto_mensual * 0.15
)

primer_día_de_hueco = primer día donde saldo[día] < umbral_seguridad
déficit_del_hueco = umbral_seguridad - saldo[primer_día_de_hueco]
reserva_mínima = max(0, umbral_seguridad - min(saldo[0..29]))
```

Si no hay suficiente histórico, usar la suma de obligaciones conocidas como fallback y guardar `threshold_source` y el supuesto en `forecast_runs.metadata`. Nunca ocultar que el umbral es estimado.

### 10.4 Recomendaciones deterministas

Prioridad de reglas para `recommendations`:

1. **Cobrar una CxC:** buscar una factura abierta, vencida o próxima a vencer, cuya cobranza esperada reduzca el déficit antes de la fecha crítica.
2. **Negociar una CxP:** identificar una obligación cercana al hueco cuya reprogramación reduzca el mínimo negativo.
3. **Reservar efectivo:** si ninguna acción anterior cubre el problema, recomendar `minimum_reserve_amount`.

Cada recomendación debe responder:

- ¿Qué fecha es crítica?
- ¿Cuál es el déficit?
- ¿Qué factura/obligación originó la sugerencia?
- ¿Qué monto se propone?
- ¿Antes de qué fecha tendría que actuar el usuario?
- ¿Qué supuesto reduce o aumenta la confianza?

No generar texto libre sin evidencia. El `title`, `rationale` y `evidence` se construyen a partir de IDs y valores calculados.

### 10.5 Persistencia de una corrida

Una corrida se crea como `running`, se escriben sus puntos en lote, se crea el hueco y la recomendación si aplican, y solo al final se marca `completed`. El dashboard solo lee corridas completadas.

Para producción, la escritura de `forecast_runs`, `forecast_points`, `liquidity_gaps` y `recommendations` debe ejecutarse en una transacción SQL/RPC. En el MVP, el estado `running` más un `input_hash` permite reintentar sin publicar resultados parciales mientras se mantiene el dataset pequeño.

## 11. API REST

### 11.1 Convenciones

- Base URL: `/api/v1`.
- JSON en `camelCase` hacia el cliente; nombres SQL pueden permanecer en `snake_case`.
- Fechas de negocio como `YYYY-MM-DD`; timestamps como ISO 8601 UTC.
- Montos como string decimal o número seguro documentado; no usar floats para cálculos monetarios.
- Paginación con cursor en transacciones, facturas y auditoría.
- `meta.requestId` en cada respuesta.

Error estándar:

```json
{
  "error": {
    "code": "FORECAST_INPUTS_INCOMPLETE",
    "message": "No hay saldo bancario actualizado para generar el pronóstico.",
    "details": []
  },
  "meta": { "requestId": "req_123" }
}
```

### 11.2 Endpoints MVP

| Método  | Ruta                                                               | Rol mínimo              | Propósito                                                       |
| ------- | ------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- |
| `GET`   | `/health/live`                                                     | Público                 | Comprueba que el proceso está vivo.                             |
| `GET`   | `/health/ready`                                                    | Público                 | Comprueba dependencias esenciales.                              |
| `POST`  | `/auth/sign-up`                                                    | Público                 | Crea una cuenta mediante NestJS/Supabase Auth.                  |
| `POST`  | `/auth/sign-in`                                                    | Público                 | Inicia sesión y establece cookie segura.                        |
| `POST`  | `/auth/refresh`                                                    | Sesión válida           | Renueva la sesión.                                              |
| `POST`  | `/auth/sign-out`                                                   | Sesión válida           | Revoca/cierra la sesión y limpia cookies.                       |
| `GET`   | `/auth/session`                                                    | Sesión válida           | Devuelve el usuario autenticado.                                |
| `GET`   | `/me`                                                              | Autenticado             | Devuelve usuario y organizaciones accesibles.                   |
| `POST`  | `/organizations`                                                   | Autenticado             | Crea la PyME y agrega al creador como `owner`.                  |
| `GET`   | `/organizations`                                                   | Autenticado             | Lista organizaciones del usuario.                               |
| `GET`   | `/organizations/:organizationId`                                   | `organization:read`     | Detalle y frescura de datos.                                    |
| `POST`  | `/organizations/:organizationId/connections`                       | `connection:create`     | Registra conexión `nessie` o `synthetic_cfdi`.                  |
| `POST`  | `/organizations/:organizationId/syncs`                             | `connection:sync`       | Importa fuentes; devuelve `syncRunId`.                          |
| `GET`   | `/organizations/:organizationId/syncs/:syncId`                     | `connection:read`       | Estado y contadores de una importación.                         |
| `POST`  | `/organizations/:organizationId/cfdi/imports`                      | `cfdi:import`           | Recibe lote CFDI; JSON sintético en la demo, multipart después. |
| `GET`   | `/organizations/:organizationId/bank/accounts`                     | `bank-account:read`     | Cuentas bancarias normalizadas.                                 |
| `GET`   | `/organizations/:organizationId/bank/transactions`                 | `bank-transaction:read` | Movimientos paginados y filtrables.                             |
| `GET`   | `/organizations/:organizationId/invoices`                          | `cfdi:read`             | CxC/CxP por dirección y estado.                                 |
| `POST`  | `/organizations/:organizationId/forecasts/runs`                    | `forecast:run`          | Genera `rules-v1`.                                              |
| `GET`   | `/organizations/:organizationId/forecasts/latest`                  | `forecast:read`         | Última corrida completada.                                      |
| `GET`   | `/organizations/:organizationId/forecasts/:forecastId/points`      | `forecast:read`         | Serie diaria de la corrida.                                     |
| `GET`   | `/organizations/:organizationId/liquidity-gaps`                    | `liquidity-gap:read`    | Huecos abiertos o históricos.                                   |
| `GET`   | `/organizations/:organizationId/recommendations`                   | `recommendation:read`   | Recomendaciones accionables.                                    |
| `PATCH` | `/organizations/:organizationId/recommendations/:recommendationId` | `recommendation:update` | Marca vista, aceptada o descartada.                             |
| `GET`   | `/organizations/:organizationId/dashboard`                         | `dashboard:read`        | Payload agregado para la pantalla principal.                    |

### 11.3 Respuesta del dashboard

```json
{
  "data": {
    "organization": { "id": "org_123", "currency": "MXN" },
    "asOf": "2026-09-12",
    "currentBalance": "185000.00",
    "safetyThreshold": "75000.00",
    "forecast": [
      {
        "date": "2026-09-13",
        "projectedBalance": "172000.00",
        "inflows": "0.00",
        "outflows": "13000.00",
        "isBelowThreshold": false
      }
    ],
    "gap": {
      "date": "2026-09-25",
      "deficit": "30000.00",
      "minimumReserve": "45000.00"
    },
    "recommendation": {
      "type": "collect_receivable",
      "title": "Cobra la factura de Cliente X antes del 25 de septiembre",
      "amount": "45000.00",
      "actionBy": "2026-09-24",
      "confidence": "medium"
    },
    "dataFreshness": {
      "bankLastSyncedAt": "2026-09-12T14:00:00Z",
      "cfdiLastImportedAt": "2026-09-12T14:02:00Z"
    }
  },
  "meta": { "requestId": "req_123" }
}
```

El endpoint debe responder con la última corrida `completed`. Si no hay datos suficientes, devolver un error de dominio accionable o un estado de onboarding; no devolver una gráfica vacía que parezca un saldo real.

### 11.4 Códigos de error de dominio

| Código                       |    HTTP | Situación                                              |
| ---------------------------- | ------: | ------------------------------------------------------ |
| `UNAUTHENTICATED`            |     401 | Falta o expira el JWT.                                 |
| `ORG_ACCESS_DENIED`          |     403 | Usuario fuera de la organización o sin rol suficiente. |
| `RESOURCE_NOT_FOUND`         |     404 | Recurso inexistente dentro del tenant.                 |
| `DUPLICATE_IMPORT`           |     409 | Idempotency key o lote ya procesado.                   |
| `FORECAST_INPUTS_INCOMPLETE` |     422 | No existe balance, fecha o fuente necesaria.           |
| `UPSTREAM_TIMEOUT`           |     504 | Nessie/proveedor no respondió a tiempo.                |
| `UPSTREAM_RATE_LIMITED`      | 429/503 | Proveedor limitó la operación.                         |
| `INTERNAL_ERROR`             |     500 | Error no esperado; detalle solo en logs.               |

## 12. Flujo end-to-end de la demo

```text
1. POST /organizations
2. POST /organizations/:id/connections       → Nessie + CFDI sintético
3. POST /organizations/:id/syncs             → sync_run
4. Normalizar cuentas, movimientos y facturas
5. POST /organizations/:id/forecasts/runs    → rules-v1
6. GET  /organizations/:id/dashboard
7. Mostrar curva, primer hueco y recomendación
8. PATCH recommendation                       → viewed/accepted/dismissed
```

La API solo expone modelos normalizados. El frontend puede interpretar un XML
localmente al cargarlo, pero el backend recibe y almacena únicamente ese modelo
normalizado.

## 13. Configuración y variables de entorno

```dotenv
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
APP_ORIGIN=http://localhost:3001

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<server-only-secret-key>
# Alternativas legacy aceptadas por la configuración:
# SUPABASE_ANON_KEY=<anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>

NESSIE_API_KEY=<server-only-nessie-key>
NESSIE_BASE_URL=https://prod-api.nessieisreal.com
NESSIE_TIMEOUT_MS=10000
```

La configuración se valida al arrancar. Si falta una variable crítica, el proceso debe fallar temprano con un mensaje que nombre la variable, nunca su valor.

No agregar claves con prefijo `NEXT_PUBLIC_` para secretos. El frontend solo debe conocer la URL del backend; la integración con Supabase Auth, la publishable key interna y las secret/service keys viven del lado NestJS.

## 14. Observabilidad y resiliencia

### 14.1 Logs

Cada request debe incluir:

- `requestId`
- método, ruta y status
- latencia
- `userId` y `organizationId` hashados o IDs internos, según política de privacidad
- `syncRunId` o `forecastRunId` cuando aplique
- proveedor y código de error

Nunca incluir access tokens, API keys, XML completo, URLs firmadas ni respuestas crudas de proveedores.

### 14.2 Health checks

- `/health/live`: no hace llamadas externas; solo confirma que el proceso responde.
- `/health/ready`: comprueba configuración, acceso mínimo a Supabase y capacidad de consultar una tabla de salud.
- Nessie no debe hacer que liveness falle. Puede marcar readiness degradado si la demo requiere sincronización en vivo.

### 14.3 Timeouts, retries y concurrencia

- Timeout obligatorio para Nessie y cualquier conector futuro.
- Reintentar únicamente lecturas idempotentes y errores transitorios conocidos.
- No reintentar `POST`, `PUT` o `DELETE` sin `Idempotency-Key`.
- Hacer upserts por lote; no insertar una fila a la vez desde un loop HTTP.
- Evitar N+1: el dashboard debe usar consultas agregadas o pocos queries bien definidos.
- Si se introduce un cliente directo de Postgres, usar pool acotado y la conexión/pooler apropiada; no abrir una conexión por request.
- Cerrar correctamente el proceso en `SIGTERM` y dejar jobs en estado recuperable.

### 14.4 Métricas útiles

- `sync_duration_ms` por proveedor.
- `provider_error_total` por código.
- `forecast_duration_ms` y número de registros de entrada.
- `forecast_runs_total` por resultado con/sin hueco.
- `dashboard_latency_ms`.
- antigüedad de la última sincronización bancaria y CFDI.
- ratio de registros CFDI rechazados.

## 15. Migraciones, tipos y entorno local

Usar migraciones imperativas versionadas mientras no exista `supabase/schemas/`.

Flujo esperado:

```bash
supabase init
supabase start
supabase migration new create_colchon_core
supabase db reset
supabase test db
supabase gen types --lang typescript --local > apps/api/src/common/database/database.types.ts
supabase db push
```

Reglas:

- No crear tablas de producción manualmente desde el Dashboard sin capturar luego la migración.
- Toda tabla, índice, grant, policy, función y bucket requerido debe quedar reproducible.
- Revisar cada migración generada antes de commitearla.
- Usar `seed.sql` solo para desarrollo y pruebas; no incluir datos reales.
- Ejecutar tests de RLS con casos permitidos y denegados para `anon`, `authenticated` y otra organización.
- Nunca usar `supabase db reset --linked` sobre producción.

Estructura adicional:

```text
supabase/
├── config.toml
├── migrations/
│   ├── <timestamp>_create_colchon_core.sql
│   ├── <timestamp>_add_rls_policies.sql
│   └── <timestamp>_create_storage_policies.sql
├── seed.sql
└── tests/
    ├── rls_organizations.sql
    ├── rls_financial_data.sql
    └── forecast_invariants.sql
```

## 16. Estrategia de pruebas

### 16.1 Unitarias

Cubrir el engine sin NestJS ni Supabase:

- saldo constante sin movimientos futuros;
- CxC antes y después del hueco;
- CxP, nómina y renta en fechas distintas;
- umbral mínimo configurado;
- fallback sin histórico suficiente;
- primera fecha bajo el umbral;
- cálculo de déficit y reserva máxima;
- factura pagada/cancelada excluida;
- repetición del mismo input produce el mismo `input_hash` y resultado;
- fechas en la zona horaria de la organización.

### 16.2 Integración

- Repository contra Supabase local.
- Upsert repetido de una transacción y un CFDI.
- Fallo de proveedor no deja `sync_run` en `running` indefinidamente.
- Corrida incompleta no aparece en dashboard.
- RPC/transacción de persistencia no publica puntos parciales.

### 16.3 RLS con pgTAP

Verificar explícitamente:

- un miembro ve solo su organización;
- un usuario de otra organización no ve cuentas, transacciones, CFDI, corridas ni recomendaciones;
- `viewer` no inserta ni actualiza;
- `admin` no puede cambiar el `organization_id` de una fila;
- `anon` no accede a datos financieros;
- un usuario suspendido pierde acceso;
- Storage no permite leer el bucket privado de otra organización.

### 16.4 E2E

Flujo mínimo con Supertest:

```text
crear usuario de prueba
→ crear organización
→ cargar dataset sintético
→ ejecutar forecast
→ consultar dashboard
→ comprobar fecha, déficit y recomendación esperados
```

La métrica de error menor al 10% a 30 días de la idea debe tratarse como objetivo del prototipo y medirse con un dataset de evaluación separado; no debe maquillarse ajustando el resultado esperado al resultado calculado.

## 17. Plan de implementación para 36 horas

| Tiempo | Backend                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------- |
| 0–2h   | Crear `apps/api`, configurar NestJS, ConfigModule, ValidationPipe, health y estructura de módulos. |
| 2–5h   | Inicializar Supabase local, migración base, seed sintético, Auth de desarrollo y RLS mínima.       |
| 5–9h   | Implementar `identity`, `organizations`, repositories y tenancy.                                   |
| 9–13h  | Implementar `NessieBankProvider`, conexión, cuentas y transacciones.                               |
| 13–16h | Implementar lote CFDI sintético, normalización y deduplicación.                                    |
| 16–21h | Implementar `ForecastEngine rules-v1` y pruebas unitarias.                                         |
| 21–24h | Persistir corridas, puntos, huecos y recomendaciones.                                              |
| 24–27h | Implementar `GET /dashboard` y contrato consumible por frontend.                                   |
| 27–30h | E2E, RLS, manejo de errores de Nessie y fallback de demo.                                          |
| 30–33h | Integración con dashboard y ensayo de la historia completa.                                        |
| 33–36h | Video de respaldo, smoke test limpio y documentación de ejecución.                                 |

### 17.1 Recorte si el tiempo se reduce

Conservar en este orden:

1. Seed/ingesta reproducible.
2. Engine determinista.
3. Persistencia de una corrida.
4. Endpoint `/dashboard`.
5. Auth/RLS básica.
6. Adapter Nessie en vivo.
7. Importación XML real, jobs y notificaciones.

## 18. Evolución después del hackathon

### Fase 2 — producto piloto

- Worker/cola para sincronizaciones largas.
- Conectores de agregación bancaria.
- Carga de XML con validación de tamaño, MIME, UUID y firma.
- Conciliación de pagos contra movimientos bancarios.
- Configuración de gastos recurrentes desde la UI.
- Notificaciones por email/push.
- Escenarios “base”, “cobranza acelerada” y “pago negociado”.
- Retención, exportación y eliminación de datos.

### Fase 3 — producción

- Separar el ejecutor de jobs solo si el volumen lo justifica.
- Versionar datasets y evaluar precisión con datos reales consentidos.
- Alertas operativas, backups verificados y recuperación ante desastre.
- Revisión legal de consentimiento, CFDI, datos financieros y socio de crédito.
- Integración white-label con una entidad mexicana autorizada.
- Modelo de permisos más fino y auditoría de cada cambio de conexión.

## 19. Decisiones abiertas

| Tema             | Decisión provisional                                           | Pregunta pendiente                                         |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Frontend         | Solo presentación; NestJS funciona como BFF y único entrypoint | ¿Se usará cookie HTTP-only también para clientes móviles?  |
| CFDI real        | XML upload antes que buzón SAT                                 | ¿Qué proveedor y consentimiento legal se usarán?           |
| Banco producción | Puerto/adaptador                                               | ¿Belvo, Finerio, Syncfy u otro?                            |
| Jobs             | Síncrono para MVP                                              | ¿Qué cola y scheduler se adoptan en piloto?                |
| Umbral           | `max(reserva mínima, 15% del gasto mensual)`                   | ¿Se configura por usuario o se aprende del histórico?      |
| Moneda           | MXN en MVP                                                     | ¿Cómo se manejarán cuentas en USD?                         |
| Retención        | A definir con legal                                            | ¿Cuánto tiempo conservar XML y movimientos?                |
| Recomendaciones  | Reglas explicables                                             | ¿Qué evidencia y disclaimers requiere el socio de crédito? |

## 20. Definition of Done del backend MVP

- [x] Un usuario autenticado puede crear o seleccionar una organización.
- [x] Un usuario de otra organización no puede leer ni mutar datos financieros.
- [x] La demo importa Nessie y el dataset CFDI sintético sin duplicados.
- [x] Existe una corrida `rules-v1` con 30 puntos diarios.
- [x] Se persiste el primer hueco, el déficit y la reserva mínima cuando aplican.
- [x] Se genera al menos una recomendación con evidencia referenciable.
- [x] `GET /dashboard` devuelve todo lo necesario para la gráfica y las tarjetas.
- [x] Los errores de proveedor son seguros, trazables y recuperables.
- [x] Hay tests unitarios del engine, tests de RLS y un E2E del flujo principal.
- [x] Auth, permisos por acción y aislamiento cross-tenant están cubiertos por tests.
- [x] GitHub Actions valida UTF-8, formato, lint, compilación y tests críticos.
- [x] Migraciones, seed y tipos se pueden reproducir desde un checkout limpio.
- [x] Ningún secreto aparece en el frontend, logs o repositorio.

## 21. Referencias técnicas

- [Idea funcional de Colchón](Idea.md)
- [NestJS — Modules](https://docs.nestjs.com/modules)
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation)
- [Supabase — JWT](https://supabase.com/docs/guides/auth/jwts)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase — Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Nessie — documentación oficial](https://prod.nessieisreal.com/docs)
- [Nessie Node SDK — repositorio](https://github.com/Kevin-SalazarG/nessie-node-sdk)
- [Nessie Node SDK del repositorio](../nessie-node-sdk/README.md)

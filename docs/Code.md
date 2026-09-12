# Colchón — Estándares de código

> Estado: guía obligatoria para el backend y cualquier código TypeScript nuevo
>
> Arquitectura relacionada: [Backend.md](Backend.md)
>
> Última actualización: 2026-09-12

Este documento define cómo escribir código en Colchón: claro, modular, escalable, seguro, reutilizable y completamente tipado. Las reglas aplican especialmente a NestJS, Supabase, el `nessie-node-sdk` local y el motor de pronóstico.

## 1. Reglas no negociables

1. TypeScript estricto; no se acepta `any` explícito, implícito ni disfrazado.
2. No crear barrel files. `index.ts` usado únicamente para reexportar está prohibido.
3. Cada archivo debe tener una responsabilidad clara y un export principal reconocible.
4. Importar desde el archivo concreto, nunca desde una carpeta que dependa de un `index.ts`.
5. Los controllers son delgados: reciben DTOs, autorizan y delegan a un caso de uso.
6. El dominio no conoce NestJS, Supabase, HTTP, Nessie ni variables de entorno.
7. Las dependencias se inyectan por constructor y las interfaces se resuelven con tokens explícitos.
8. La lógica repetida se centraliza en una utilidad, helper, value object, caso de uso o adapter con nombre específico.
9. No abstraer solo para reducir líneas: una abstracción compartida debe proteger una regla o contrato real.
10. Los secretos jamás llegan al navegador, logs, errores públicos, fixtures o commits.
11. Todo input externo se valida y todo output público se serializa.
12. Todo cambio funcional incluye pruebas proporcionales al riesgo.
13. Comentarios solo para decisiones importantes, invariantes, riesgos de seguridad o peculiaridades externas.
14. No dejar `TODO`, `FIXME`, `@ts-ignore`, `@ts-expect-error` ni `eslint-disable` sin razón documentada y issue asociado.

### 1.1 El frontend solo presenta

El frontend no contiene lógica de negocio. Puede mostrar formularios, enviar credenciales al backend, mantener estado visual y renderizar el payload recibido. Todo lo demás pertenece a NestJS:

- autenticación, sesión y renovación de sesión;
- permisos, roles y validación cross-tenant;
- llamadas a Supabase, Storage, Nessie y futuros proveedores;
- ingesta, deduplicación y normalización;
- cálculo de saldo, umbral, hueco y recomendación;
- reglas de dinero, fechas, errores, reintentos y auditoría;
- composición del dashboard.

El frontend no debe consultar tablas de Supabase, llamar a `nessie-node-sdk`, recalcular el forecast, ocultar permisos como mecanismo de seguridad ni duplicar validaciones de negocio. Ocultar un botón mejora la UX; la autorización real siempre ocurre en NestJS y RLS.

## 2. TypeScript completamente tipado

### 2.1 Configuración mínima

El `tsconfig` de la API debe mantener, como mínimo:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

Si una librería externa no es compatible con una regla, resolver el problema en el adapter o en una declaración tipada y revisada. No relajar `strict` para hacer que compile una feature.

### 2.2 Prohibiciones de tipos

```ts
// Prohibido.
function parsePayload(payload: any): any {
  return payload.data;
}

// Prohibido: oculta un error del contrato.
const account = response as any;

// Prohibido: elimina la seguridad del compilador.
// @ts-ignore
client.fetch();
```

Usar `unknown` en toda frontera que no esté bajo nuestro control y estrecharlo con validación:

```ts
type ExternalPayload = {
  readonly id: string;
  readonly amount: number;
};

function isExternalPayload(value: unknown): value is ExternalPayload {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.amount === "number";
}

function readAmount(payload: unknown): number {
  if (!isExternalPayload(payload)) {
    throw new Error("Invalid external payload");
  }

  return payload.amount;
}
```

Para payloads complejos, preferir un schema de runtime en el borde —por ejemplo, Valibot— en lugar de escribir type assertions manuales. El `nessie-node-sdk` ya usa schemas de Valibot y sus tipos exportados deben aprovecharse dentro del adapter.

### 2.3 `catch` y errores

Todo error capturado es `unknown` y debe estrecharse o envolverse:

```ts
try {
  await provider.listTransactions(accountId);
} catch (error: unknown) {
  throw mapProviderError(error);
}
```

Nunca:

```ts
try {
  await repository.save(entity);
} catch {
  // Ignorar errores deja el sistema en un estado desconocido.
}
```

### 2.4 Uniones y estados exhaustivos

Preferir uniones literales y `switch` exhaustivo sobre strings sin contrato:

```ts
const recommendationTypes = [
  "collect_receivable",
  "negotiate_payable",
  "reserve_cash",
] as const;

type RecommendationType = (typeof recommendationTypes)[number];

function recommendationLabel(type: RecommendationType): string {
  switch (type) {
    case "collect_receivable":
      return "Collect receivable";
    case "negotiate_payable":
      return "Negotiate payable";
    case "reserve_cash":
      return "Reserve cash";
  }
}
```

Cuando una unión crezca, el compilador debe obligar a revisar todos sus consumidores.

### 2.5 `null`, `undefined` y opcionales

- Diferenciar “no enviado” (`undefined`) de “valor vacío” (`null`).
- No usar `value || fallback` para montos o booleanos; puede reemplazar valores válidos como `0` o `false`.
- Usar `??` cuando el fallback corresponda a `null`/`undefined`.
- No usar non-null assertions (`value!`) para silenciar un posible estado inválido; validar o modelar el estado.

## 3. Organización del código

### 3.1 Estructura de la API

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── provider.config.ts
│   └── environment.schema.ts
├── common/
│   ├── auth/
│   ├── database/
│   ├── decorators/
│   ├── errors/
│   ├── filters/
│   ├── guards/
│   ├── helpers/
│   ├── hooks/
│   ├── interceptors/
│   ├── logging/
│   ├── pipes/
│   ├── serialization/
│   ├── types/
│   └── utilities/
└── modules/
    ├── health/
    ├── identity/
    ├── organizations/
    ├── connections/
    ├── bank-data/
    ├── cfdi/
    ├── forecasting/
    ├── recommendations/
    ├── dashboard/
    └── ingestion/
```

No crear carpetas genéricas como `misc`, `stuff`, `helpers-and-utils` o `services` global. Si algo pertenece a una sola feature, debe vivir dentro de esa feature.

### 3.2 Estructura de una feature

```text
modules/forecasting/
├── forecasting.module.ts
├── presentation/
│   └── http/
│       ├── forecasting.controller.ts
│       ├── generate-forecast.dto.ts
│       └── forecast-response.dto.ts
├── application/
│   ├── generate-forecast.use-case.ts
│   ├── get-latest-forecast.use-case.ts
│   └── ports/
│       ├── forecast-repository.port.ts
│       └── forecast-repository.token.ts
├── domain/
│   ├── forecast-engine.ts
│   ├── forecast.types.ts
│   ├── forecast.errors.ts
│   └── value-objects/
│       ├── forecast-horizon.ts
│       └── money.ts
└── infrastructure/
    └── persistence/
        └── supabase-forecast.repository.ts
```

Un archivo por concepto. Si un archivo empieza a contener varios servicios, varios DTOs no relacionados o múltiples adapters, dividirlo.

### 3.3 Regla de dependencias

```text
presentation → application → domain
infrastructure → application/domain mediante interfaces
domain → nada externo
```

- `domain` no importa `@nestjs/*`, `@supabase/*`, `nessie-node-sdk`, `ConfigService` ni `process.env`.
- `application` coordina casos de uso y depende de ports/interfaces.
- `infrastructure` implementa ports.
- `presentation` traduce HTTP y llama a application.
- `app.module.ts` es el composition root; no contiene reglas de negocio.

Evitar `forwardRef`. Si aparece una dependencia circular, rediseñar el límite o introducir un port/evento. Usar `forwardRef` únicamente con una razón escrita en el PR.

## 4. Sin barrel files ni exports escondidos

### 4.1 Regla

No crear archivos `index.ts` para agrupar exports:

```text
// Prohibido
forecasting/index.ts
common/utilities/index.ts
modules/index.ts
```

Cada módulo y archivo exporta su propio símbolo. Los imports deben apuntar al archivo real:

```ts
import { ForecastEngine } from "../domain/forecast-engine";
import { Money } from "../domain/value-objects/money";
import { GenerateForecastUseCase } from "../application/generate-forecast.use-case";
```

No usar:

```ts
// Prohibido: depende de un barrel file o de exports indirectos.
import { ForecastEngine, Money } from "../forecasting";
```

### 4.2 Motivos

- Hace visible el origen real de cada dependencia.
- Evita ciclos accidentales y side effects escondidos.
- Facilita tree-shaking, búsqueda, refactor y ownership.
- Permite mover una feature sin mantener un archivo exportador gigante.

Usar exports nombrados en archivos concretos. No usar default exports para clases de dominio, use cases, repositories o adapters.

## 5. Responsabilidad de cada capa

### 5.1 Controllers

Un controller debe:

- declarar la ruta y el verbo HTTP;
- recibir un DTO validado;
- obtener el usuario/tenant desde el contexto autenticado;
- delegar a un use case;
- devolver un response DTO o resultado serializable.

```ts
@Controller("organizations/:organizationId/forecasts")
export class ForecastingController {
  constructor(private readonly generateForecast: GenerateForecastUseCase) {}

  @Post("runs")
  async createRun(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() input: GenerateForecastDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ForecastResponseDto> {
    const result = await this.generateForecast.execute({
      organizationId,
      userId: user.id,
      input,
    });

    return ForecastResponseDto.fromDomain(result);
  }
}
```

Un controller no debe contener loops de pronóstico, llamadas a Supabase, manejo de errores de Nessie ni lógica de permisos basada en strings.

### 5.2 Use cases

Un use case representa una acción del sistema y tiene una entrada y una salida tipadas.

```ts
export type GenerateForecastCommand = Readonly<{
  organizationId: string;
  userId: string;
  input: GenerateForecastInput;
}>;

@Injectable()
export class GenerateForecastUseCase {
  constructor(
    private readonly access: OrganizationAccessService,
    private readonly inputs: ForecastInputReader,
    private readonly engine: ForecastEngine,
    private readonly forecasts: ForecastRepository,
  ) {}

  async execute(command: GenerateForecastCommand): Promise<Forecast> {
    await this.access.requireRole(command.userId, command.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const forecastInput = await this.inputs.read(
      command.organizationId,
      command.input,
    );
    const forecast = this.engine.calculate(forecastInput);

    await this.forecasts.saveCompletedRun(command.organizationId, forecast);
    return forecast;
  }
}
```

Un use case no debe convertirse en un `ApplicationService` gigante. Si coordina demasiadas acciones, dividir por comando/query y extraer un port específico.

### 5.3 Domain

El dominio contiene:

- entidades y value objects;
- invariantes;
- reglas del pronóstico;
- tipos de entrada y salida;
- errores de negocio.

El `ForecastEngine` debe ser una función/clase pura: mismo input, mismo output, sin reloj del sistema, red, base de datos o estado global.

### 5.4 Repositories

La aplicación depende de un contrato, no de Supabase:

```ts
export interface ForecastRepository {
  saveCompletedRun(
    organizationId: string,
    forecast: Forecast,
  ): Promise<ForecastRunId>;

  findLatestCompleted(organizationId: string): Promise<Forecast | null>;
}
```

La implementación concreta puede usar `@supabase/supabase-js`, pero esa dependencia no debe escapar a `infrastructure`.

### 5.5 Adapters y ports

Todo proveedor externo tiene un port y un adapter:

```ts
export interface BankDataProvider {
  listAccounts(customerId: string): Promise<readonly ExternalBankAccount[]>;
  listTransactions(
    accountId: string,
  ): Promise<readonly ExternalBankTransaction[]>;
}
```

`NessieBankProvider` es el único lugar de la API donde se importa `nessie-node-sdk`. El resto del sistema trabaja con modelos internos como `BankTransactionInput`.

No devolver tipos de Nessie desde un controller, repository o domain service. Si se cambia el proveedor, solo debe cambiar el adapter y sus pruebas de contrato.

## 6. Dependencias e inyección

### 6.1 Constructor injection

Siempre preferir inyección por constructor:

```ts
@Injectable()
export class ImportBankDataUseCase {
  constructor(
    @Inject(BANK_DATA_PROVIDER)
    private readonly provider: BankDataProvider,
    @Inject(BANK_TRANSACTION_REPOSITORY)
    private readonly transactions: BankTransactionRepository,
  ) {}
}
```

No usar service locator, `ModuleRef.get()` o acceso global a un contenedor para resolver dependencias. Si una clase necesita algo, debe declararlo en su constructor.

### 6.2 Tokens por port

El token vive cerca de su port y tiene nombre explícito:

```ts
export const BANK_DATA_PROVIDER = Symbol("BANK_DATA_PROVIDER");
```

Archivo recomendado: `bank-data-provider.token.ts`. No crear un `tokens.ts` global con todos los tokens del sistema.

### 6.3 Singleton y scopes

- Providers puros y clients externos: singleton.
- No usar request scope salvo que exista una necesidad medida.
- El contexto del usuario viaja explícitamente en un objeto tipado; no usar variables globales mutables.
- `NessieClient` y factories de Supabase se registran una sola vez, respetando la separación entre cliente de usuario y cliente administrativo.

## 7. DRY extremo sin crear abstracciones inútiles

### 7.1 Qué centralizar

Debe existir una sola implementación para cada regla transversal:

| Regla repetida                           | Ubicación sugerida                                   |
| ---------------------------------------- | ---------------------------------------------------- |
| Fechas y zona horaria de la organización | `common/utilities/organization-date.util.ts`         |
| Operaciones monetarias                   | `common/types/money.ts` o value object de dominio    |
| Cursor pagination                        | `common/utilities/cursor-pagination.util.ts`         |
| Respuestas y errores HTTP                | `common/interceptors` y `common/filters`             |
| Validación de environment                | `config/environment.schema.ts`                       |
| Redacción de secretos                    | `common/logging/redact-sensitive-data.util.ts`       |
| Cliente Supabase por request             | `common/database/supabase-user-client.factory.ts`    |
| Cliente Supabase administrativo          | `common/database/supabase-admin-client.factory.ts`   |
| Mapeo de errores de proveedor            | adapter base o mapper específico por proveedor       |
| Acceso a organización/roles              | `organizations` y su port, no copiado en cada módulo |

### 7.2 Qué no centralizar

No mover a `common` una regla que solo pertenece a forecast, CFDI o recomendaciones. Por ejemplo, la selección de la factura que reduce un hueco debe vivir en `recommendations`, no en `common/helpers`.

Antes de crear una utilidad compartida, confirmar:

1. La regla aparece en al menos dos lugares.
2. Los dos lugares tienen el mismo significado, no solo código parecido.
3. La API propuesta es estable y tiene nombre de negocio o responsabilidad clara.
4. La utilidad puede probarse de forma aislada.

Si no se cumplen las cuatro, mantener la función local y evitar una abstracción prematura.

### 7.3 Nombres obligatorios

Prohibido crear:

```text
common/utils.ts
common/helpers.ts
common/misc.ts
common/constants.ts
common/hooks.ts
```

Preferir:

```text
common/utilities/parse-cursor.util.ts
common/utilities/organization-date.util.ts
common/helpers/map-provider-error.helper.ts
common/hooks/application-shutdown.hook.ts
common/constants/http-status.constant.ts
```

Cada archivo debe explicar su responsabilidad por el nombre; la carpeta no es excusa para ocultarla.

## 8. Utilities, helpers y hooks

### 8.1 Utilities

Una utility es pura, determinista y sin dependencia de NestJS:

```ts
export function clampInteger(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}
```

No leer `process.env`, no acceder a DB y no depender de estado global desde una utility.

### 8.2 Helpers

Un helper resuelve una operación pequeña de una frontera concreta. Debe tener entrada/salida tipadas y no convertirse en un segundo service:

```ts
export function safeProviderMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown provider error";
}
```

Si un helper empieza a contener reglas, dependencias y efectos secundarios, convertirlo en un service, adapter o use case con nombre explícito.

### 8.3 Hooks de NestJS

En backend, “hooks” significa lifecycle hooks de NestJS, no lógica de negocio oculta. Usarlos para:

- inicializar recursos externos;
- validar readiness;
- cerrar clientes, workers y conexiones en shutdown;
- liberar recursos ante `SIGTERM`.

Ejemplo:

```ts
@Injectable()
export class ApplicationShutdownHook implements OnApplicationShutdown {
  constructor(private readonly jobs: JobExecutor) {}

  async onApplicationShutdown(): Promise<void> {
    await this.jobs.stopAcceptingNewWork();
    await this.jobs.finishOrRecoverRunningWork();
  }
}
```

No usar lifecycle hooks para importar datos automáticamente sin un control de idempotencia, ni para ejecutar reglas que deberían ser casos de uso explícitos.

## 9. Fechas, dinero y datos financieros

### 9.1 Dinero

- Base de datos: `numeric(19,4)`.
- Dominio: `Decimal`/value object; nunca operaciones con `number`.
- API: string decimal estable, por ejemplo `"185000.00"`.
- Siempre transportar moneda junto con el monto.
- No redondear en capas intermedias sin una regla documentada.
- No mezclar monedas en el engine.

```ts
import Decimal from "decimal.js";

export type Currency = "MXN" | "USD";

export type Money = Readonly<{
  amount: string;
  currency: Currency;
}>;

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new Error("Cannot add money with different currencies");
  }

  return {
    amount: new Decimal(left.amount).plus(right.amount).toFixed(4),
    currency: left.currency,
  };
}
```

El ejemplo requiere importar `Decimal` desde la dependencia decimal elegida y fijada en lockfile. No sustituirlo con `parseFloat`, `toFixed` sobre floats ni sumas de `number`.

### 9.2 Fechas

- `timestamptz`/ISO UTC para eventos técnicos.
- `date`/`YYYY-MM-DD` para vencimientos y días de negocio.
- Convertir a la zona horaria de la organización en un único lugar.
- No llamar `new Date()` desde el engine; recibir `asOf` como input.
- Probar cambios de día, vencimientos y fechas cercanas a medianoche.

## 10. Validación y serialización

### 10.1 DTOs

Los DTOs de HTTP son contratos de entrada, no entidades ni tipos de DB:

```ts
export class GenerateForecastDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  readonly horizonDays?: number;
}
```

Configurar una sola `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`. No repetir la misma validación manual en cada controller.

### 10.2 Fronteras externas

Validar y normalizar en la frontera:

- Nessie → `NessieBankProvider`.
- JSON de CFDI → `SyntheticCfdiProvider`/parser.
- Supabase → repository y tipos generados.
- HTTP → DTO y pipes.

El dominio debe recibir modelos internos válidos y no repetir validaciones de transporte.

### 10.3 Output DTOs

No devolver filas de Supabase directamente. Convertirlas a response DTOs para:

- evitar filtrar columnas nuevas accidentalmente;
- controlar nombres `camelCase`;
- ocultar `raw_payload`, IDs externos y metadatos sensibles;
- mantener estable el API aunque cambie la DB.

## 11. Supabase y acceso a datos

### 11.1 Clientes separados

Mantener dos caminos explícitos:

```text
User-scoped client  → JWT del usuario → RLS → requests de negocio
Admin client        → secret/service key → jobs confiables y tareas administrativas
```

- El cliente administrativo nunca se importa en controllers públicos.
- No usar la secret key para evitar arreglar una policy rota.
- El job administrativo recibe y valida `organizationId`/`connectionId` antes de usarla.
- La key de Nessie también queda confinada al adapter/server.

### 11.2 RLS

Para cada tabla de `public`:

1. Habilitar RLS.
2. Definir grants mínimos.
3. Definir policies por operación.
4. Probar lectura y escritura permitida y denegada.

Las policies deben usar pertenencia real a la organización; `TO authenticated` por sí solo no autoriza acceso a cualquier fila. Las policies de `UPDATE` requieren `USING` y `WITH CHECK`.

No usar `user_metadata` ni campos editables por el usuario para autorizar roles. Los roles de organización viven en Postgres.

### 11.3 Queries

- Seleccionar columnas explícitas; evitar `select('*')` en producción.
- Filtrar siempre por `organization_id` en el repository.
- Usar índices alineados con `organization_id`, fechas y estados.
- Hacer batch insert/upsert; nunca un request HTTP por registro.
- Usar paginación por cursor para transacciones, facturas y auditoría.
- Evitar N+1 en dashboard y recomendaciones.
- No interpolar SQL; usar query builders o funciones SQL parametrizadas.
- Las operaciones multi-tabla deben usar transacción/RPC o un estado intermedio que jamás se exponga como completado.

### 11.4 Tipos generados

Regenerar los tipos de Supabase después de cada migración y revisar el diff. Los tipos generados sirven en infrastructure; mapearlos a modelos de dominio en el repository.

No usar el tipo generado de una tabla como DTO público ni como entidad de negocio.

## 12. Nessie y el SDK local

- Importar `NessieClient` solo en `NessieBankProvider` o en su módulo de infraestructura.
- Registrar un solo client con inyección de dependencias.
- Usar el `nessie-node-sdk` local; no recrear fetch, retries, timeout o validación.
- Mapear `deposits`, `withdrawals`, `purchases`, `transfers`, `accounts` y `bills` a modelos internos.
- No asumir que existe `transactions.listByAccount`.
- Usar `RequestOptions` para timeout y cancelación de jobs.
- No reintentar mutaciones sin idempotencia; respetar los reintentos de lectura del SDK.
- Transformar errores del SDK a errores internos sin exponer body crudo.
- Probar el adapter con el `fetch` inyectable del SDK; no llamar la API real en tests unitarios.

El adapter es el único lugar que conoce nombres como `_id`, `transaction_date`, `purchase_date`, `payer_id` o `payee_id`.

## 13. Seguridad de aplicación

### 13.1 Auth y autorización

- Validar firma, issuer, audience, expiración y `sub` del JWT.
- Usar `AuthGuard` y `OrganizationGuard` en rutas protegidas.
- Resolver `organizationId` desde la ruta y validar membresía.
- No confiar en un `organizationId` enviado en el body.
- No autorizar con `user_metadata`.
- Mantener reglas de autorización también en RLS.

### 13.2 HTTP

- `helmet` y CORS con allow-list.
- Límites de body y upload.
- Rate limit en importaciones, sincronizaciones y autenticación si aplica.
- `requestId` en logs y respuestas.
- Mensajes públicos seguros; detalles completos solo en logs controlados.
- Serializar y escapar texto externo antes de renderizarlo en el frontend.

### 13.3 Logs y secretos

```ts
logger.error(
  {
    requestId,
    organizationId,
    provider: "nessie",
    errorCode: error.code,
  },
  "Bank synchronization failed",
);
```

Nunca registrar:

- JWTs, refresh tokens, API keys o secret keys;
- URLs autenticadas;
- XML completo o payloads crudos de terceros;
- contraseñas o headers `Authorization`;
- datos financieros que no sean necesarios para diagnosticar.

### 13.4 Sistema de permisos granular

La autorización tiene tres conceptos separados:

1. **Autenticación:** ¿la identidad es válida?
2. **Membresía:** ¿el usuario pertenece a esta organización y está activo?
3. **Permiso:** ¿puede realizar esta acción concreta sobre este tenant y recurso?

El frontend puede ocultar acciones no permitidas, pero nunca es la fuente de verdad. El backend debe rechazar la acción aunque se invoque manualmente desde un cliente HTTP.

#### Capas de acceso

| Capa            | Actor                     | Responsabilidad                                                             |
| --------------- | ------------------------- | --------------------------------------------------------------------------- |
| `public`        | Cualquiera                | Solo health checks y endpoints de autenticación permitidos.                 |
| `authenticated` | Usuario con sesión válida | `/me` y creación/listado inicial de organizaciones.                         |
| `organization`  | Miembro activo            | Datos y acciones según permiso.                                             |
| `system`        | Worker interno            | Jobs limitados, con tenant y operación explícitos; no es un rol de usuario. |

#### Catálogo de permisos

El catálogo es una unión literal centralizada en un archivo específico, por ejemplo `organization-permission.ts`. No crear strings de permisos repartidos por controllers.

```ts
export const ALL_PERMISSIONS = [
  "dashboard:read",
  "organization:create",
  "organization:read",
  "organization:update",
  "organization:delete",
  "member:read",
  "member:invite",
  "member:update",
  "member:remove",
  "connection:read",
  "connection:create",
  "connection:sync",
  "connection:update",
  "connection:revoke",
  "bank-account:read",
  "bank-transaction:read",
  "bank-transaction:reconcile",
  "cfdi:read",
  "cfdi:import",
  "cfdi:update",
  "cfdi:download",
  "forecast:read",
  "forecast:run",
  "forecast:configure",
  "liquidity-gap:read",
  "liquidity-gap:update",
  "recommendation:read",
  "recommendation:update",
  "audit:read",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type OrganizationRole = "owner" | "admin" | "analyst" | "viewer";
```

La matriz de roles completa vive en [Backend.md](Backend.md). Si se agrega un permiso, actualizar el catálogo, la matriz, las policies/guards necesarias y sus tests en el mismo cambio.

#### Bundles de roles

```ts
export const ROLE_PERMISSIONS: Readonly<
  Record<OrganizationRole, readonly Permission[]>
> = {
  owner: ALL_PERMISSIONS,
  admin: [
    "dashboard:read",
    "organization:read",
    "organization:update",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "connection:read",
    "connection:create",
    "connection:sync",
    "connection:update",
    "bank-account:read",
    "bank-transaction:read",
    "bank-transaction:reconcile",
    "cfdi:read",
    "cfdi:import",
    "cfdi:update",
    "cfdi:download",
    "forecast:read",
    "forecast:run",
    "forecast:configure",
    "liquidity-gap:read",
    "liquidity-gap:update",
    "recommendation:read",
    "recommendation:update",
    "audit:read",
  ],
  analyst: [
    "dashboard:read",
    "organization:read",
    "connection:read",
    "bank-account:read",
    "bank-transaction:read",
    "cfdi:read",
    "forecast:read",
    "forecast:run",
    "liquidity-gap:read",
    "liquidity-gap:update",
    "recommendation:read",
    "recommendation:update",
  ],
  viewer: [
    "dashboard:read",
    "organization:read",
    "forecast:read",
    "liquidity-gap:read",
    "recommendation:read",
  ],
};

export function roleHasPermission(
  role: OrganizationRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
```

No usar `role === 'admin'` dentro de cada controller. El controller declara el permiso y un servicio central resuelve el bundle del rol.

#### Decorator y guard

Cada ruta protegida declara su permiso con metadata. El guard debe obtener el `organizationId` desde la ruta, nunca del body.

```ts
export const REQUIRED_PERMISSIONS = "requiredPermissions";

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);
```

Uso:

```ts
@Post('runs')
@RequirePermissions('forecast:run')
async createForecastRun(): Promise<ForecastResponseDto> {
  return this.generateForecast.execute(/* command validado */);
}
```

`PermissionGuard` debe aplicar esta secuencia:

1. Leer las permissions requeridas de handler/class.
2. Obtener `request.user` ya validado por `SupabaseJwtGuard`.
3. Obtener y validar `request.params.organizationId`.
4. Cargar membresía actual desde `OrganizationAccessService`.
5. Rechazar usuarios `invited` o `suspended`.
6. Comprobar todas las permissions requeridas.
7. Permitir que el use case haga las validaciones específicas del recurso.

El guard no reemplaza al use case ni a RLS. Un recurso siempre se carga con un método acotado al tenant, por ejemplo `findByIdInOrganization(resourceId, organizationId)`, nunca con un `findById` global que pueda producir IDOR.

#### Permisos de recursos y mutaciones

- Toda lectura filtra por `organizationId`.
- Toda inserción fuerza el `organizationId` validado por el backend.
- Todo update verifica `USING` y `WITH CHECK` en RLS.
- Nunca permitir que el cliente cambie `organizationId`, `createdBy`, `owner` o IDs externos.
- `member:update` no puede asignar `owner` ni quitar el último owner.
- `connection:revoke`, `cfdi:download` y `organization:delete` requieren auditoría.
- `cfdi:download` entrega solo una URL firmada de corta duración.
- `viewer` recibe agregados del dashboard, no movimientos ni XML crudos.
- El worker valida que el job, `organizationId`, `connectionId` y operación coincidan antes de usar una secret/service key.

#### Auditoría de permisos

Registrar actor, organización, acción, recurso, resultado y timestamp para:

- invitar, cambiar o remover miembros;
- crear, sincronizar, actualizar o revocar conexiones;
- importar, corregir o descargar CFDI;
- cambiar configuración del forecast;
- cambiar estado de huecos o recomendaciones;
- exportar o eliminar información.

No guardar tokens, XML completo, API keys ni payloads crudos en `audit_events`.

## 14. Manejo de errores

Usar una jerarquía de errores interna con código estable:

```ts
export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "ORG_ACCESS_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "FORECAST_INPUTS_INCOMPLETE"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_RATE_LIMITED"
  | "INTERNAL_ERROR";

export type AppErrorOptions = Readonly<{
  details?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}>;

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    readonly safeMessage: string,
    readonly status: number,
    options: AppErrorOptions = {},
  ) {
    super(safeMessage, { cause: options.cause });
    this.name = "AppError";
    this.details = options.details;
  }

  readonly details?: Readonly<Record<string, unknown>>;
}
```

Un exception filter global debe convertir `AppError`, errores de validación, errores de Supabase y errores de providers al envelope definido en [Backend.md](Backend.md). Nunca retornar stack trace ni error crudo.

Si un catch agrega contexto, preservar la causa:

```ts
throw new AppError(
  "UPSTREAM_TIMEOUT",
  "The bank provider did not respond in time.",
  504,
  {
    details: { provider: "nessie" },
    cause: error,
  },
);
```

Si el constructor de la versión de Node/Nest no soporta ese overload, implementar `cause` como propiedad tipada en la clase propia; no usar `any`.

## 15. Eventos, jobs e idempotencia

- Los eventos desacoplan sincronización y regeneración de forecast.
- El payload de un job debe tener un schema versionado y todos sus IDs tipados.
- Un job se puede reintentar sin duplicar transacciones, CFDI o corridas.
- Usar claves únicas externas y `Idempotency-Key` para mutaciones HTTP.
- Guardar `syncRunId`, estado y contadores.
- Marcar una corrida como `completed` solo cuando sus puntos, hueco y recomendación estén consistentes.
- No disparar side effects desde getters, constructors o serializers.

## 16. Testing

### 16.1 Pirámide

1. Unit tests para value objects, utilities y `ForecastEngine`.
2. Tests de aplicación para use cases con ports falsos.
3. Integration tests para repositories con Supabase local.
4. pgTAP para RLS, grants y funciones SQL.
5. E2E con Supertest para el flujo HTTP principal.
6. Contract tests del adapter Nessie usando el `fetch` inyectable del SDK.

### 16.2 Reglas

- No depender de la API real de Nessie en CI normal.
- No mockear la clase interna que se está probando; mockear ports.
- Cada test debe tener un nombre que describa comportamiento observable.
- Usar fixtures pequeñas, explícitas y sin datos reales.
- Probar aislamiento cross-tenant en lectura y escritura.
- Probar inputs vacíos, límites, fechas, `null`, timeouts, duplicados y reintentos.
- El motor de forecast debe ser determinista y no depender del reloj del sistema.
- No aceptar tests que solo comprueban que un mock fue llamado si no verifican el resultado.

### 16.3 Tests críticos de Colchón

- primer día bajo el umbral;
- déficit y reserva mínima;
- CxC esperada y CxP programada;
- factura pagada/cancelada excluida;
- saldo y montos con precisión decimal;
- importación repetida sin duplicados;
- `viewer` no puede mutar datos;
- usuario de otra organización no ve datos;
- fallo de Nessie deja `sync_run` recuperable;
- dashboard no muestra corridas incompletas.

## 17. Rendimiento y escalabilidad

- Preferir un monolito modular hasta que una métrica justifique separar un worker.
- Medir antes de cachear.
- Cachear solo datos derivados y con invalidación clara; nunca usar cache para evadir RLS.
- Leer solo columnas necesarias.
- Insertar en lote.
- Paginar listas grandes.
- Indexar filtros reales, especialmente tenancy + fecha/estado.
- Revisar `EXPLAIN` de queries críticas.
- Limitar concurrencia contra Nessie y proveedores externos.
- Mantener pools/conexiones acotados y cerrar recursos en shutdown.

## 18. Estilo, nombres y archivos

| Elemento          | Convención                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| Archivos          | `kebab-case`, por ejemplo `generate-forecast.use-case.ts`                    |
| Clases            | `PascalCase`                                                                 |
| Funciones/métodos | `camelCase`, verbo claro                                                     |
| Tipos/interfaces  | `PascalCase`; interfaces con nombre de dominio, no prefijo `I` obligatorio   |
| Constantes        | `UPPER_SNAKE_CASE` solo para valores constantes globales                     |
| DTOs              | `*.dto.ts`                                                                   |
| Controllers       | `*.controller.ts`                                                            |
| Use cases         | `*.use-case.ts`                                                              |
| Repositories      | `*.repository.ts` / `*.repository.port.ts`                                   |
| Adapters          | `*.adapter.ts` o nombre del proveedor, por ejemplo `nessie-bank.provider.ts` |
| Guards            | `*.guard.ts`                                                                 |
| Pipes             | `*.pipe.ts`                                                                  |
| Interceptors      | `*.interceptor.ts`                                                           |
| Filters           | `*.filter.ts`                                                                |
| Hooks             | `*.hook.ts`                                                                  |
| Tests             | `*.spec.ts` para unit/integration; `*.e2e-spec.ts` para E2E                  |

No usar nombres vagos como `data.service.ts`, `common.service.ts`, `manager.ts`, `helpers.ts` o `utils.ts` si no describen una responsabilidad concreta.

### 18.1 Formato

- **Prettier** es el formatter oficial. “Pretty” en el flujo del proyecto significa ejecutar Prettier; no crear otro formatter.
- Biome se usa para lint, con su formatter deshabilitado para evitar dos fuentes de formato. Esta separación sigue la configuración del SDK local.
- Versiones fijadas en `package.json` y lockfile commiteado.
- Formato automático antes de revisar lógica.
- Imports de tipo con `import type`.
- Sin exports sin usar, variables muertas ni parámetros ignorados.
- No mezclar cambios de formato masivos con cambios funcionales.

Configuración base alineada con el SDK existente:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "endOfLine": "lf",
  "proseWrap": "preserve"
}
```

### 18.2 UTF-8 y finales de línea

Todo archivo de texto del proyecto debe ser UTF-8 sin BOM, usar LF y terminar con newline:

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

```gitattributes
* text=auto eol=lf
*.tgz binary
```

Crear un único `scripts/check-encoding.mjs` en la raíz para escanear `apps`, `packages`, `docs`, `supabase` y `.github`. Debe rechazar bytes inválidos UTF-8, BOM inesperado, `CRLF` y archivos sin newline final. El script existente de `nessie-node-sdk` es la referencia; no duplicar variantes por cada app.

### 18.3 Scripts obligatorios

Los nombres pueden vivir en el `package.json` de la API o en el workspace raíz, pero deben tener un único dueño y comportamiento estable:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check:encoding": "node ../../scripts/check-encoding.mjs",
    "lint": "biome lint src test --error-on-warnings",
    "typecheck": "tsc --noEmit",
    "build": "nest build",
    "test:unit": "jest --config test/jest-unit.config.ts --runInBand",
    "test:integration": "jest --config test/jest-integration.config.ts --runInBand",
    "test:e2e": "jest --config test/jest-e2e.config.ts --runInBand",
    "verify": "pnpm check:encoding && pnpm format:check && pnpm lint && pnpm typecheck && pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:e2e"
  }
}
```

Para la base de datos, el workspace debe ejecutar además `supabase test db`. No usar `test` como un comando ambiguo que oculte qué suite pasó; cada suite importante debe tener un script identificable.

### 18.4 GitHub Actions

El CI es una barrera obligatoria, no un reporte informativo. Toda Pull Request que toque backend, packages o Supabase debe comprobar:

1. Encoding UTF-8 y LF.
2. Prettier sin diferencias.
3. Biome lint sin warnings.
4. TypeScript compilando en modo estricto.
5. Build de NestJS exitoso.
6. Unit tests del dominio.
7. Integration tests contra Supabase local.
8. Tests pgTAP/RLS.
9. E2E del API.
10. Auditoría de dependencias con severidad alta o crítica.

Los checks requeridos y su workflow están definidos en [Github.md](Github.md). Ningún job debe usar `continue-on-error: true` para ocultar fallas importantes. Si el backend aún no existe, no activar un workflow que reporte falso éxito: crear el workflow junto con `apps/api` y hacer que sus checks sean required en branch protection.

## 19. Comentarios

### Permitidos

```ts
// Nessie may return `purchase_date` or `transaction_date`; keep both for compatibility.
const transactionDate = purchase.purchase_date ?? purchase.transaction_date;
```

El comentario explica una peculiaridad externa que no se deduce del código.

### Prohibidos

```ts
// Add one to the counter.
counter += 1;

// Loop through transactions.
for (const transaction of transactions) {
  // ...
}
```

El código ya expresa esas acciones. Si una decisión es temporal, incluir el issue:

```ts
// Temporary fallback until CFDI XML parsing is enabled: see #42.
```

## 20. Definition of Done de código

- [ ] La feature vive en el módulo correcto.
- [ ] No se creó ningún barrel file ni `index.ts` de exports.
- [ ] No existe `any`, assertion insegura ni suppress del compilador.
- [ ] La frontera externa valida `unknown` y se convierte a un modelo interno.
- [ ] Controllers delgados y use cases con responsabilidad única.
- [ ] Dependencias por constructor y ports con tokens explícitos.
- [ ] Se reutilizaron utilities/helpers existentes cuando la regla era la misma.
- [ ] No se duplicaron reglas de tenancy, fechas, dinero, errores o logging.
- [ ] La feature tiene tests unitarios/integración apropiados.
- [ ] RLS y autorización fueron revisados si se toca información de una organización.
- [ ] No hay secretos, PII innecesaria ni payloads crudos en logs.
- [ ] UTF-8/LF check, `format:check`, `lint`, `typecheck`, `build` y todas las suites de tests pasan.
- [ ] GitHub Actions reporta verdes los checks requeridos del backend.
- [ ] Los comentarios agregados explican solo decisiones importantes.

## 21. Comandos de calidad

Los scripts ejecutables viven en el `package.json` de `apps/api` y en el `package.json` raíz. El pipeline mínimo incluye:

```bash
pnpm check:encoding
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
supabase test db
```

Si se toca Supabase:

```bash
supabase db reset
supabase test db
supabase gen types --lang typescript --local > apps/api/src/common/database/database.types.ts
```

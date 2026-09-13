# Colchón

Plan de caja para constructoras pequeñas: anticipa el faltante que puede provocar
una estimación retrasada y ayuda a proteger nómina y materiales sin ejecutar dinero.

Monorepo con Next.js, NestJS, Supabase y el `nessie-node-sdk` local.
El frontend solo presenta la información; la autenticación, permisos, ingesta, normalización,
pronóstico, auditoría y manejo de errores viven en esta API.

## Requisitos

- Node.js 22 o superior
- pnpm 11.1.3
- Docker. En macOS se puede usar Colima:

```bash
colima start --cpu 4 --memory 6 --disk 20
```

## Configuración

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
```

Completa `apps/api/.env` con las credenciales de Supabase y Nessie. Se prefieren
`SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`; también se aceptan
`SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` como nombres compatibles.

El archivo `.env` es local y no debe versionarse.

## Supabase local

```bash
supabase start --workdir .
supabase migration up --local
pnpm test:db
```

Si Colima no puede montar el contenedor Vector, inicia el entorno local con:

```bash
supabase start --workdir . --exclude vector --yes
```

Vector no es necesario para la API, Postgres, Auth, Storage ni los tests RLS.
Las migraciones son aditivas. No es necesario borrar la base actual. Las pruebas
HTTP de tesorería crean datos sintéticos únicamente en Supabase local y los limpian al terminar.

## Desarrollo

Levanta API y frontend juntos (puertos 3000 y 3001):

```bash
pnpm dev
```

El frontend usa Next.js App Router, Tailwind y shadcn/ui. Configura únicamente
`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1` en `apps/web/.env`.
No agregues claves de proveedores ni de Supabase al frontend.

- Aplicación: [localhost:3001](http://localhost:3001).
- Ejemplo sin credenciales: [demo](http://localhost:3001/demo/dashboard).
- Flujo inicial: crear empresa → conectar un cliente de Nessie → sincronizar →
  importar estimaciones y facturas XML/JSON → registrar nómina de cuadrilla,
  materiales y otros pagos protegidos → revisar fechas y flexibilidad → comparar
  conversaciones posibles.
- El cliente de Nessie debe existir y tener cuentas. La demo del servidor de
  CFDI usa MXN; una empresa en USD debe importar facturas en USD.

Verificación del frontend:

```bash
pnpm verify:web
pnpm --filter @colchon/web exec playwright install chromium
pnpm --filter @colchon/web test:e2e
```

La suite E2E usa fixtures e intercepta la API; no envía invitaciones, revoca
conexiones ni modifica la empresa real. El navegador puede usarse para revisar
los datos integrados en vivo sin ejecutar acciones destructivas.

Para iniciar solamente la API:

```bash
pnpm --filter @colchon/api start:dev
```

La API usa el prefijo `/api/v1`. Endpoints principales:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/sign-up`
- `POST /api/v1/auth/sign-in`
- `GET /api/v1/me`
- `GET /api/v1/organizations/:organizationId/treasury`
- `GET /api/v1/organizations/:organizationId/treasury?delayedReceiptId=:eventId`
- `POST /api/v1/organizations/:organizationId/treasury/decisions`
- `PATCH /api/v1/organizations/:organizationId/treasury/decisions/:id`
- `PATCH /api/v1/organizations/:organizationId/treasury/invoices/:id`
- `POST /api/v1/organizations/:organizationId/connections/:connectionId/sync`

## Verificación

```bash
pnpm verify
pnpm test:db
pnpm audit --prod --audit-level=high
```

`verify` comprueba UTF-8/LF, Prettier, Biome, tipos, compilación y las suites del SDK y
la API. GitHub Actions ejecuta además las suites unitarias, de integración, RLS, E2E y
seguridad de dependencias.

## Arquitectura y colaboración

- [Despliegue de Supabase remoto](docs/Supabase.md)
- [Diseño del backend](docs/Backend.md)
- [Estándares de código](docs/Code.md)
- [Convenciones de GitHub](docs/Github.md)
- [Enfoque del producto](docs/PRODUCT-DIRECTION.md)
- [Experiencia y rutas vigentes](docs/Frontend.md)
- [Verificación y puesta en marcha](docs/TREASURY-DELIVERY.md)
- [Variables de entorno de la API](apps/api/.env.example)

# Colchón

Plan de caja para constructoras pequeñas: anticipa el faltante que puede provocar
una estimación retrasada y ayuda a proteger nómina y materiales sin ejecutar dinero.

Monorepo con Next.js, NestJS, Supabase y el `nessie-node-sdk` local.
El frontend solo presenta la información; la autenticación, permisos, ingesta, normalización,
pronóstico, auditoría y manejo de errores viven en esta API.

## Estado y roadmap

El prototipo actual utiliza Nessie y CFDI sintéticos, además de importación
manual de XML/JSON y notificaciones por correo. La siguiente etapa está
documentada en [docs/ROADMAP.md](docs/ROADMAP.md):

1. Integrar Facturapi para la descarga masiva de CFDI emitidos y recibidos.
2. Normalizar complementos de pago, cancelaciones y estados fiscales sin
   confundirlos con dinero cobrado.
3. Enviar alertas de liquidez por WhatsApp al responsable de caja.
4. Incorporar cobranza asistida por WhatsApp al cliente, inicialmente con
   borrador y aprobación humana.
5. Evaluar el Web Service directo del SAT únicamente si se necesita por costo,
   escala o independencia del proveedor.

La descarga masiva de CFDI y las notificaciones no forman parte del flujo
necesario para ejecutar la demo actual. El producto no ejecuta cobros,
transferencias, cancelaciones ni convenios automáticamente.

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

La integración real con Facturapi será server-side y conservará la carga manual
como fallback. La fecha esperada de cobro seguirá siendo un dato operativo del
usuario, complemento de pago o banco; no se inferirá únicamente del CFDI.

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
- [Roadmap de CFDI y notificaciones](docs/ROADMAP.md)
- [Experiencia y rutas vigentes](docs/Frontend.md)
- [Verificación y puesta en marcha](docs/TREASURY-DELIVERY.md)
- [Variables de entorno de la API](apps/api/.env.example)

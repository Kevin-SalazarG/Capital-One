# Colchón — Convenciones de GitHub

> Estado: guía obligatoria para ramas, commits y Pull Requests
>
> Última actualización: 2026-09-12

El código y la documentación pueden estar en español cuando ayude al equipo. Los nombres de ramas, commits y títulos de PR deben ser siempre cortos, precisos y estar en inglés.

## 1. Ramas

### 1.1 Formato obligatorio

```text
type/description
```

Reglas:

- `type` en minúsculas.
- `description` en inglés, minúsculas y `kebab-case`.
- Empezar la descripción con un verbo o una acción concreta.
- Sin espacios, underscores, acentos ni frases largas.
- Una rama representa una sola intención.
- Crear ramas desde `main` salvo que el PR dependa explícitamente de otra rama.
- Eliminar la rama después del merge.

Tipos permitidos:

| Tipo       | Uso                                                    |
| ---------- | ------------------------------------------------------ |
| `feature`  | Nueva capacidad de producto.                           |
| `fix`      | Corrección de bug.                                     |
| `hotfix`   | Corrección urgente para producción.                    |
| `refactor` | Cambio interno sin cambiar el comportamiento esperado. |
| `test`     | Agregar o mejorar pruebas.                             |
| `docs`     | Documentación.                                         |
| `perf`     | Mejora de rendimiento.                                 |
| `chore`    | Mantenimiento, dependencias o tareas internas.         |
| `build`    | Build, paquetes o configuración de compilación.        |
| `ci`       | Pipeline y automatización de CI.                       |

Ejemplos válidos:

```text
feature/add-forecast-engine
feature/import-synthetic-cfdi
fix/block-cross-tenant-read
refactor/extract-money-value-object
test/cover-first-liquidity-gap
docs/add-backend-architecture
perf/batch-bank-import
chore/update-nessie-sdk
ci/run-rls-tests
hotfix/rotate-exposed-api-key
```

Ejemplos inválidos:

```text
Kevin-work
fix
feature/add_everything
feature/Agregar-el-motor
my-branch
feature/this-branch-contains-a-full-paragraph-about-the-implementation
```

### 1.2 Reglas de colaboración

- No trabajar directamente en `main`.
- No subir secretos, `.env`, tokens, dumps ni datos reales.
- No hacer force-push sobre ramas compartidas.
- Mantener la rama actualizada antes de pedir review.
- Resolver conflictos localmente y volver a ejecutar el pipeline.
- No mezclar cambios no relacionados en la misma rama.

## 2. Commits

### 2.1 Formato obligatorio

Usar Conventional Commits, con texto corto en inglés:

```text
type(scope): imperative summary
```

Reglas:

- Inglés, verbo en imperativo o presente de acción.
- Primera línea de máximo 72 caracteres.
- Sin punto final.
- Un commit debe representar un cambio lógico y compilable.
- El `scope` debe ser corto y concreto: `forecast`, `nessie`, `auth`, `cfdi`, `db`, `api`, `docs`.
- No usar `WIP`, `misc`, `updates`, `stuff`, `fixes` o mensajes genéricos.
- No incluir secretos ni datos de prueba sensibles.

Tipos permitidos:

| Tipo       | Uso                                        |
| ---------- | ------------------------------------------ |
| `feat`     | Nueva funcionalidad.                       |
| `fix`      | Corrección de comportamiento.              |
| `refactor` | Refactor sin cambio funcional intencional. |
| `test`     | Pruebas.                                   |
| `docs`     | Documentación.                             |
| `perf`     | Rendimiento.                               |
| `chore`    | Mantenimiento.                             |
| `build`    | Build/dependencias.                        |
| `ci`       | CI/CD.                                     |
| `revert`   | Revertir un commit anterior.               |

Ejemplos válidos:

```text
feat(forecast): add 30-day projection
feat(cfdi): import synthetic invoices
fix(auth): block cross-tenant reads
fix(nessie): map purchase transaction dates
refactor(bank): isolate provider adapter
test(forecast): cover first liquidity gap
docs(backend): define module boundaries
perf(ingestion): batch transaction upserts
chore(deps): pin Supabase client
ci(api): run strict typecheck
```

Ejemplos inválidos:

```text
fixed stuff
Update files
WIP
final final version
feat: add many things and fix unrelated bugs
fix(auth): fixed the auth bug.
```

### 2.2 Cuerpo del commit

El cuerpo es opcional. Usarlo solo cuando el contexto no cabe en el subject:

```text
fix(auth): reject suspended members

Check membership status before resolving organization access so suspended users
cannot read financial data through the API.
```

Para cambios incompatibles, agregar un footer claro:

```text
feat(api): version organization routes

BREAKING CHANGE: organization routes now require the /api/v1 prefix.
```

## 3. Pull Requests

### 3.1 Título

El título del PR usa exactamente el mismo formato que un commit:

```text
type(scope): imperative summary
```

Ejemplos:

```text
feat(forecast): add 30-day liquidity projection
fix(auth): enforce organization membership
docs(backend): document Supabase architecture
refactor(nessie): use the local Node SDK
```

El título debe ser entendible sin abrir el PR. No usar títulos como `Changes`, `Backend`, `Update`, `Fixes` o `New feature`.

### 3.2 Tamaño y alcance

- Un PR debe resolver una intención.
- Mantenerlo pequeño y revisable.
- No mezclar refactor masivo, formato global y lógica nueva.
- Si una migración es necesaria, incluirla con el código que la consume.
- Si el cambio afecta API, Auth, RLS, datos financieros o secretos, declararlo en el body.
- Si el cambio es demasiado grande, dividirlo en PRs encadenados con dependencias explícitas.

### 3.3 Descripción obligatoria

Usar una descripción breve en inglés:

```md
## Summary

- Add the deterministic 30-day forecast use case
- Persist completed forecast points and liquidity gaps

## Why

The dashboard needs one stable application flow for the first liquidity gap.

## Testing

- `pnpm check:encoding`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:integration`
- `supabase test db`
- `pnpm test:e2e`

## Security and data impact

- Applies organization membership checks
- Does not expose provider credentials
- Adds/updates RLS coverage: yes

## Checklist

- [ ] No `any` or unsafe compiler suppressions
- [ ] No barrel files or export-only `index.ts`
- [ ] Backend permissions and cross-tenant access are covered
- [ ] Tests cover the changed behavior
- [ ] Migrations are reproducible
- [ ] Logs do not contain secrets or raw financial payloads
```

### 3.4 Requisitos antes del merge

- CI verde.
- Al menos una revisión aprobada.
- Todos los comentarios resueltos o respondidos.
- Tests nuevos o explicación de por qué no aplican.
- No secretos ni archivos generados innecesarios.
- Migraciones revisadas y ordenadas.
- RLS probado si toca datos de organización.
- Contratos de API/documentación actualizados si cambió el comportamiento.
- Rama actualizada con `main`.

La estrategia recomendada es **squash merge** para mantener un historial lineal de commits funcionales y títulos consistentes.

## 4. GitHub Actions y branch protection

### 4.1 Objetivo

GitHub Actions debe ser la fuente objetiva para saber si el backend está listo. Una revisión no se puede aprobar basándose solo en que “funciona localmente”.

Toda PR que toque `apps/api`, `packages`, `supabase`, `scripts`, dependencias o el workflow debe ejecutar estos checks:

| Check requerido               | Debe validar                                                              |
| ----------------------------- | ------------------------------------------------------------------------- |
| `Backend quality`             | UTF-8/LF, Prettier, Biome lint, typecheck y build.                        |
| `Backend tests / unit`        | Value objects, utilities, use cases y `ForecastEngine`.                   |
| `Backend tests / integration` | Repositories, ingesta, idempotencia y persistencia contra Supabase local. |
| `Backend tests / rls`         | Policies, grants, aislamiento cross-tenant y Storage con pgTAP.           |
| `Backend tests / e2e`         | Auth, permisos, flujo de sincronización, forecast y dashboard vía HTTP.   |
| `Backend security`            | Auditoría de dependencias y validaciones de secretos/configuración.       |

Ningún check importante debe usar `continue-on-error: true`. Un test flaky se corrige o se aísla con una razón documentada; no se convierte en un falso verde.

### 4.2 Workflow esperado

El workflow implementado vive en `.github/workflows/backend-ci.yml` y se activa cuando cambian la API, el SDK local, Supabase, scripts, dependencias o el propio workflow.

Plantilla de referencia:

```yaml
name: Backend CI

on:
  pull_request:
    paths:
      - "apps/api/**"
      - "packages/**"
      - "supabase/**"
      - "scripts/**"
      - ".github/workflows/backend-ci.yml"
      - "package.json"
      - "pnpm-lock.yaml"
  push:
    branches:
      - main
    paths:
      - "apps/api/**"
      - "packages/**"
      - "supabase/**"
      - "scripts/**"
      - ".github/workflows/backend-ci.yml"
      - "package.json"
      - "pnpm-lock.yaml"

permissions:
  contents: read

concurrency:
  group: backend-ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "22"
  PNPM_VERSION: "11.1.3"

jobs:
  backend-quality:
    name: Backend quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm check:encoding
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build

  backend-tests:
    name: Backend tests / ${{ matrix.suite }}
    needs: backend-quality
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - suite: unit
            command: pnpm test:unit
          - suite: integration
            command: pnpm test:integration
          - suite: rls
            command: supabase test db
          - suite: e2e
            command: pnpm test:e2e
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - uses: supabase/setup-cli@v1
        if: matrix.suite == 'integration' || matrix.suite == 'rls' || matrix.suite == 'e2e'
        with:
          version: latest
      - run: supabase start
        if: matrix.suite == 'integration' || matrix.suite == 'rls' || matrix.suite == 'e2e'
      - run: ${{ matrix.command }}

  backend-security:
    name: Backend security
    needs: backend-quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --prod --audit-level=high
```

Las versiones de Actions y Supabase CLI deben mantenerse fijadas o actualizadas de forma explícita. El job no debe llamar a Nessie real: las pruebas del adapter usan el `fetch` inyectable del SDK local y fixtures controlados.

### 4.3 Branch protection

Configurar `main` para requerir:

- Pull Request aprobado;
- `Backend quality`;
- `Backend tests / unit`;
- `Backend tests / integration`;
- `Backend tests / rls`;
- `Backend tests / e2e`;
- `Backend security`;
- rama actualizada antes del merge;
- conversaciones resueltas;
- prohibición de push directo.

Los nombres de job deben mantenerse estables; cambiar un nombre requiere actualizar branch protection y la documentación en el mismo PR.

## 5. Relación entre rama, commits y PR

```text
feature/add-forecast-engine
        │
        ├── feat(forecast): add forecast input model
        ├── feat(forecast): calculate first liquidity gap
        └── test(forecast): cover threshold edge cases
        │
        └── PR: feat(forecast): add 30-day liquidity projection
```

La rama describe el objetivo amplio; cada commit describe un paso lógico; el PR resume el resultado entregable. Los tres deben referirse a la misma intención.

## 6. Cambios de base de datos y Supabase

Cuando un PR toque Supabase:

- incluir la migración versionada;
- incluir policies, grants e índices junto con el cambio;
- incluir tests pgTAP de acceso permitido y denegado;
- regenerar los tipos de TypeScript;
- no commitear secretos ni dumps de producción;
- ejecutar `supabase db reset` y `supabase test db` localmente;
- revisar que una secret/service key no se haya expuesto en código o frontend.

Commit recomendado:

```text
feat(db): add forecast persistence tables
```

No usar:

```text
chore(db): update stuff
```

## 7. Revisión de código

Los reviewers deben priorizar, en este orden:

1. Fugas cross-tenant, RLS y autorización.
2. Secretos, PII y logging sensible.
3. Correctitud del dominio financiero y precisión monetaria.
4. Errores parciales, idempotencia y reintentos.
5. Tests y cobertura del comportamiento nuevo.
6. Dependencias circulares, duplicación y límites de módulos.
7. Legibilidad, nombres y estilo.

El comentario de review debe ser concreto, accionable y, cuando sea posible, señalar el riesgo observable.

## 8. Definition of Done de GitHub

- [ ] La rama cumple `type/description`.
- [ ] El título del PR y los commits están en inglés.
- [ ] Los commits son cortos, precisos y de una sola intención.
- [ ] El PR no mezcla cambios no relacionados.
- [ ] El body explica summary, motivo y pruebas.
- [ ] `Backend quality`, todas las suites de backend y `Backend security` pasan.
- [ ] No hay secretos ni datos reales.
- [ ] Las migraciones y RLS tienen revisión y pruebas.
- [ ] La documentación afectada está actualizada.
- [ ] La rama se puede eliminar después del merge.

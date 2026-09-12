# Entrega: plan para llegar a la nómina

## Rama y alcance

`feature/build-payroll-protection`, creada desde `main`. Sigue el formato
`tipo/acción-en-kebab-case` de `Github.md`. No se publica ni despliega automáticamente.

El producto concentra el reto en una decisión: anticipar el faltante de caja,
comparar acuerdos factibles y acompañar al dueño hasta el seguimiento del plan.
Ver [dirección de producto](PRODUCT-DIRECTION.md) y [rutas vigentes](Frontend.md).

## Prueba rápida

```bash
pnpm install --frozen-lockfile
pnpm --filter @colchon/treasury build
pnpm --filter @colchon/web dev
```

Abrir [demo del plan](http://localhost:3001/demo/dashboard). Seleccionar Hotel
Alameda, comparar la curva y la tabla, guardar el plan, registrar un acuerdo y
probar un retraso. Las fuentes son sintéticas y las fechas son fijas.

El caso de ejemplo empieza con $185,000 MXN. Sin acuerdos, el mínimo es
−$14,000 y la reserva objetivo $40,000. Adelantar el cobro de Hotel Alameda
de $55,700, bajo las fechas y el costo declarados, lleva el mínimo simulado a
$41,700. Esto **no ejecuta el anticipo ni garantiza que el cliente acepte**.

## Revisión de Code.md

| Regla                         | Implementación en este cambio                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Frontend de presentación      | Consume contratos; la demo usa instantáneas verificadas contra el motor. No importa el motor de cálculo.                     |
| Dominio puro y dinero decimal | Motor en `packages/treasury`, calendario determinista, importes serializados como strings y regla de centavos documentada.   |
| Imports concretos             | Exports por archivo; se retiró el barrel del paquete.                                                                        |
| TypeScript estricto           | API, web y paquete verificados; pruebas del motor también se tipan.                                                          |
| HTTP como frontera            | DTOs validados, controladores delgados y casos de uso independientes.                                                        |
| Persistencia desacoplada      | Puerto de tesorería con token explícito y adapter Supabase; selects explícitos en el repositorio nuevo.                      |
| Tenancy y autorización        | Permisos NestJS, filtros por organización y RLS; snapshots no actualizables por el cliente.                                  |
| Reintentos y seguimiento      | Selección idempotente por entrada/plan, reelección conserva pasos, control de revisión y rechazo de fuentes desactualizadas. |
| Auditoría                     | Selección, seguimiento y edición de condiciones de facturas se auditan en transacción.                                       |
| Migraciones y tipos           | Cuatro migraciones aditivas; esquema generado en `supabase.generated.ts`, utilizado para la tabla nueva.                     |
| Pruebas y CI                  | Motor, calendario, contratos, integración HTTP con Supabase local, RLS y navegador; CI incluye el paquete y frontend.        |

Esta revisión cubre el flujo nuevo y los puntos existentes que utiliza; **no es
una certificación de todo el código heredado**. Se conservan APIs antiguas de
forecast para compatibilidad, pero la experiencia nueva y el onboarding usan
`/treasury`. No se refactorizó indiscriminadamente la administración histórica
de miembros, los adapters del SDK ni todos los repositorios anteriores.

## Verificación reproducible

Con Docker/Supabase local en ejecución:

```bash
supabase start
supabase migration up --local
pnpm verify
pnpm verify:web
pnpm --filter @colchon/web test:e2e --workers=2
pnpm db:lint
pnpm test:db
supabase db diff --local --schema public,private
pnpm audit --prod --audit-level=high
```

El diff reconstruye una base temporal desde todas las migraciones y compara
el esquema, sin resetear la base local existente. La prueba HTTP autenticada
rechaza cualquier host que no sea loopback, crea fixtures propios y elimina
solo esos fixtures. La prueba de navegador no toca empresas reales.

## Resultado local de la verificación

Comprobado el 2026-09-12: `pnpm verify` y `pnpm verify:web` completos; 12
pruebas del motor, 11 unitarias de API, 9 de integración, 2 HTTP básicas,
86 del SDK, 41 del frontend, 20 recorridos de navegador y 29 aserciones RLS.
El empaquetado aislado del SDK, `db lint`, la reconstrucción del esquema y
`pnpm audit --prod --audit-level=high` también pasaron. No se ejecutó un pipeline
remoto ni se desplegó la rama.

## Estado del entorno remoto

Las migraciones se aplicaron y probaron en Supabase local. El proyecto remoto
configurado en la API no pudo vincularse: la cuenta actual de la CLI no tiene
los privilegios necesarios. **No se migró ni borró la base remota**.

Para usar la empresa real se necesita que una cuenta autorizada vincule ese
proyecto, revise `supabase db push --dry-run` y aplique las migraciones.
Hasta entonces la demo funciona, pero los endpoints nuevos pueden fallar
contra el esquema remoto anterior. El bloqueo no se evita usando la secret
key para saltarse permisos de administración.

## Recorte y límites

Se retiraron Equipo, Ayuda separada, formularios de ajustes de la demo y su
onboarding. Los pagos pasan a Compromisos. La explicación del modelo vive en
el propio plan. Todo el código retirado se conserva en el historial de `main`.

Los compromisos se crean/consultan pero todavía no se editan/eliminan. La
conciliación de facturas es manual. No hay ML, crédito, SAT ni movimientos
bancarios reales. Solo se proponen fechas explícitamente declaradas; no se
desplazan nómina/impuestos ni se ocultan pagos después del horizonte.

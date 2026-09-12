# Supabase remoto

Despliegue verificado el 12 de septiembre de 2026 en el proyecto
`zypzevcgnkshrgirxirb`.

- [Tablas del proyecto](https://supabase.com/dashboard/project/zypzevcgnkshrgirxirb/editor)
- [Storage del proyecto](https://supabase.com/dashboard/project/zypzevcgnkshrgirxirb/storage/buckets)

## Migraciones aplicadas

El MCP asignó las versiones remotas. El contenido SQL corresponde a los archivos
locales indicados; las migraciones anteriores `mirror_schema` y `mirror_rpc` se
conservaron.

| Migración                    | Versión local    | Versión remota   |
| ---------------------------- | ---------------- | ---------------- |
| `create_colchon_core`        | `20260912170236` | `20260912182027` |
| `create_storage_policies`    | `20260912173304` | `20260912182032` |
| `index_backend_foreign_keys` | `20260912182206` | `20260912182243` |

Para posteriores despliegues por MCP, comparar nombre y contenido con el historial
remoto antes de aplicar una migración. Antes de cambiar a `supabase db push`, hay
que incorporar el historial preexistente de `mirror` y conciliar estas versiones;
los timestamps locales y remotos no son idénticos.

## Estado verificado

- 14 tablas de la aplicación en `public`, todas con RLS habilitado.
- 41 políticas de tablas y 4 políticas de Storage.
- 29 claves foráneas, 48 índices y 29 triggers de aplicación.
- Bucket privado `cfdi-documents`, con acceso por organización y rol.
- Sin acceso anónimo a las tablas del backend; permisos explícitos para
  `authenticated` y `service_role`.
- Lecturas REST con las credenciales del backend: HTTP 200 en `organizations`,
  `bank_accounts` y `forecast_runs`.
- Prueba remota de creación como owner, aislamiento de un usuario externo,
  restricciones del viewer y privacidad del bucket: aprobada. La transacción de
  prueba terminó con rollback, sin conservar usuarios ni datos de prueba.
- Pruebas locales RLS: 17 assertions aprobadas. Lint del esquema: sin errores.
- Advisor de seguridad: sin avisos. Los índices de las claves foráneas quedaron
  cubiertos; solo permanece el aviso informativo de índices aún sin uso.

## Alcance

Este despliegue publica el esquema, funciones, triggers, índices, permisos y bucket
del backend. Los datos de negocio se crean mediante la API autenticada. El servidor
NestJS se ejecuta por separado; no se convierte en una Edge Function al aplicar
estas migraciones. Las credenciales siguen en el entorno del backend.

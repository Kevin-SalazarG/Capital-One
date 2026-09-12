# Colchón — Experiencia vigente

Última actualización: 2026-09-12. Este documento sustituye el plan de pantallas
anterior. La decisión central es **cómo llegar a la próxima nómina**, no construir
un ERP. Ver [enfoque del producto](PRODUCT-DIRECTION.md).

## Navegación

| Ruta                                         | Función                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/app/[organizationId]/dashboard`            | Plan de caja: horizonte de 30 días, riesgo, comparador, estrés y seguimiento.      |
| `/app/[organizationId]/commitments`          | Capturar y consultar nómina, impuestos y compromisos recurrentes.                  |
| `/app/[organizationId]/invoices`             | Buscar, filtrar e importar cuentas por cobrar/pagar.                               |
| `/app/[organizationId]/invoices/[invoiceId]` | Comprobante y edición de fechas, flexibilidad, costo, categoría y saldo pendiente. |
| `/app/[organizationId]/bank`                 | Cuentas y movimientos bancarios.                                                   |
| `/app/[organizationId]/settings/company`     | Empresa, moneda, zona horaria, reserva y gasto diario no calendarizado.            |
| `/app/[organizationId]/settings/connections` | Configurar y sincronizar Nessie/CFDI.                                              |
| `/app/[organizationId]/onboarding`           | Preparar las fuentes para el primer plan.                                          |
| `/app/new`                                   | Crear empresa.                                                                     |
| `/auth/sign-in`, `/auth/sign-up`             | Autenticación.                                                                     |

La demo conserva únicamente dashboard, compromisos, facturas/detalle y banco
bajo `/demo`. No solicita credenciales ni llama a la API externa.

Se retiraron Equipo, Ayuda como página separada y los ajustes/onboarding de
la demo que solo mostraban formularios deshabilitados. Compromisos sale de
Configuración y pasa a la navegación principal. La explicación vive junto al
pronóstico en `dashboard#assumptions`. Estas eliminaciones son recuperables
desde `main`; no eliminan miembros, conexiones ni registros de la base.

## Una decisión completa

1. Revisar saldo disponible, mínimo previsto, reserva y fechas protegidas.
2. Entender el primer cruce y la necesidad de liquidez del peor día.
3. Comparar hasta tres escenarios condicionados a acuerdos reales.
4. Seleccionar uno para ver ambas curvas, fechas desplazadas y costos.
5. Guardarlo y registrar contacto/acuerdo; esto no realiza pagos ni aumenta caja.
6. Actualizar las fuentes cuando se materialice el movimiento y recalcular.

La prueba “¿Y si un cliente paga tarde?” retrasa siete días un cobro, recalcula
en el backend y no permite guardar esa simulación como si fuera el escenario
original. Se muestran estados de carga y error. Si cambian las fuentes, el
plan guardado conserva su seguimiento pero se marca como desactualizado.

## Frontera de arquitectura

El frontend presenta contratos tipados de NestJS, formatea importes/fechas,
valida la forma de los campos y mantiene filtros/estado visual. No calcula
pronósticos, selecciona acuerdos con reglas financieras ni consulta Supabase
o Nessie directamente.

La demo presenta JSON estático producido por `@colchon/treasury`; sus pruebas
reproducen las instantáneas con el motor real. Ningún componente importa
`treasury-engine`. Solo el contrato compartido llega al navegador.

TanStack Query separa los recursos por organización; los comandos invalidan
los datos afectados. Cookies HTTP-only mantienen la sesión y el cliente usa
`credentials: include`. Solo la URL del backend es pública. La UI oculta
acciones por permiso y NestJS/RLS vuelven a autorizarlas.

## Diseño y accesibilidad

- Lienzo mineral, acción petróleo, riesgo terracota y texto de alto contraste.
- Tipografía del sistema, cifras tabulares y una curva central con hito de nómina.
- La curva es lineal: no suaviza cifras ni inventa puntos intermedios.
- Tabla equivalente para consultar cada cierre, leyendas y resumen accesible.
- Navegación móvil, foco visible, teclado, controles etiquetados y errores explícitos.
- Movimiento de selección breve, sin rebote, y respeto de movimiento reducido.
- Fuentes de datos opacas; translucidez reservada a navegación.
- Datos, supuestos y límites visibles sin saturar la decisión principal.

`ui-ux-pro-max` orientó jerarquía, formularios, accesibilidad y adaptación móvil.
`apple-design` orientó tipografía, profundidad contenida y feedback físico
interrumpible; no se copió una interfaz de Apple.

## Verificación

```bash
pnpm verify:web
pnpm --filter @colchon/web exec playwright install chromium
pnpm --filter @colchon/web test:e2e --workers=2
```

La suite del navegador cubre escritorio/móvil, navegación vigente, rutas
retiradas, búsqueda/filtros, edición de empresa con errores del servidor,
permisos, comparación de planes, conservación de acuerdos, estrés,
teclado y texto ampliado. Usa fixtures/API interceptada; la integración
autenticada con Supabase local se verifica en la suite de la API.

## Límites explícitos

- Nessie es sandbox, requiere un cliente con cuentas y no es banca real.
- XML/JSON normalizado, sin conexión al SAT ni almacenamiento del XML crudo.
- No hay conversión de monedas, préstamos ni transferencias automáticas.
- Las facturas se concilian manualmente; confirmar un acuerdo no registra un cobro.
- Los compromisos recurrentes permiten crear/consultar, no editar/eliminar.
- La demo usa fechas fijas de septiembre de 2026; no se presenta como información actual.
- El motor busca individuales/pares entre doce candidatos; no garantiza óptimo global.
- Las fechas y costos son supuestos del usuario, no probabilidades aprendidas.

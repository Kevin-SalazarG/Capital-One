# Colchón — Plan del frontend

> Estado: pantallas y flujos MVP implementados; verificación y límites actuales al final del documento
>
> Última actualización: 2026-09-12

Este documento define la experiencia web de **Colchón**, el copiloto de
liquidez para PyMEs mexicanas. El frontend consume exclusivamente la API
NestJS; no consulta Supabase, Nessie ni Storage directamente y no replica
reglas del motor de pronóstico.

## 1. Objetivo del producto

La pantalla principal debe responder en menos de un minuto:

1. ¿Cuánto efectivo tengo hoy?
2. ¿Cómo se verá mi caja durante los próximos 30 días?
3. ¿Hay un hueco de liquidez y en qué fecha ocurre?
4. ¿Qué acción concreta puedo tomar antes de esa fecha?

El usuario objetivo es el dueño o administrador de una PyME formal mexicana
que hoy revisa su flujo de caja en una hoja de cálculo o “a ojo”. La interfaz
debe ser clara para alguien que no es tesorero, pero suficientemente precisa
para justificar cada alerta.

## 2. Frontera frontend/backend

El frontend sí hace:

- Presentar datos y estados de carga.
- Formatear fechas, monedas y porcentajes para lectura.
- Mantener estado visual local: filtros, modal abierto, pestaña activa.
- Interpretar un CFDI XML elegido por el usuario y convertirlo al payload
  normalizado del API, sin conservar el archivo crudo.
- Enviar comandos explícitos al backend y refrescar los datos.
- Ocultar acciones que el rol actual no puede ejecutar.

El frontend no hace:

- Consultar Supabase, Nessie o Storage.
- Guardar access tokens o refresh tokens en `localStorage`.
- Calcular saldos, umbrales, déficits, probabilidades o recomendaciones.
- Decidir permisos únicamente desde la UI.
- Tratar una gráfica vacía como si fuera un pronóstico válido.

Si la interfaz necesita un valor derivado del negocio, ese valor debe agregarse
al contrato del backend.

## 3. Stack del frontend

El stack queda definido para `apps/web` de la siguiente manera:

| Capa          | Elección                                 | Motivo                                                                                     |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Framework     | Next.js App Router + TypeScript estricto | Routing claro, layouts compartidos y buena base para evolucionar el producto.              |
| Estilos       | Tailwind CSS                             | Tokens, responsive y estados visuales consistentes desde una sola capa.                    |
| Componentes   | shadcn/ui sobre Radix UI                 | Primitivas accesibles y editables dentro del repositorio, sin depender de una caja negra.  |
| Iconos        | Lucide React                             | Iconografía sobria y consistente con los componentes de shadcn/ui.                         |
| Formularios   | React Hook Form + validación de campos   | Reduce estados manuales en login, empresa, conexiones y equipo.                            |
| Validación    | Zod                                      | Contratos y mensajes de formulario claros en el cliente.                                   |
| Datos remotos | TanStack Query                           | Cache por organización, refetch después de sincronizar y estados de mutación consistentes. |
| Gráfica       | Recharts en el MVP                       | Suficiente para curva, umbral, tooltip y marcador del hueco.                               |
| Motion        | Motion para React, solo cuando aporte    | Transiciones interruptibles y naturales en sheets, dialogs y cambios de estado.            |
| Pruebas       | Vitest/Testing Library + Playwright      | Cubre componentes y el journey crítico de demo.                                            |
| API           | `fetch` encapsulado en un cliente único  | Cookies HTTP-only, envelope `{ data, meta }` y errores uniformes.                          |

La API se consume con `credentials: "include"`. La única variable pública del
frontend será la URL del backend, por ejemplo `NEXT_PUBLIC_API_BASE_URL`; no se
expondrán secretos ni claves de Supabase.

`shadcn/ui` será la base de interacción, no la identidad visual final. Los
componentes se instalarán y modificarán dentro de `apps/web`, usando sus
primitivas para `Button`, `Badge`, `Card`, `Alert`, `Tabs`, `Table`, `Dialog`,
`Sheet`, `DropdownMenu`, `Skeleton`, `Tooltip`, `Toast` y `Form`. El tema,
espaciado, radios, estados y composición serán propios de Colchón.

## 4. Dirección visual

### 4.1 Concepto

**“La libreta de caja que mira hacia adelante.”** La interfaz combina la
precisión de una herramienta financiera con una presencia cálida y confiable
para una PyME real. El resultado debe ser super clean y profesional, con un
toque de minimalismo en la disciplina visual, pero con suficiente estructura,
datos y contexto para no sentirse vacío.

La curva de 30 días es el elemento protagonista: no debe parecer un panel de
analítica genérico lleno de tarjetas, sino una lectura guiada de la salud de
la caja. El diseño debe ayudar a tomar una decisión, no presumir la cantidad
de componentes utilizados.

### 4.2 Tokens iniciales

| Token           | Valor     | Uso                                                           |
| --------------- | --------- | ------------------------------------------------------------- |
| Tinta petróleo  | `#153B3F` | Texto principal, navegación y elementos de confianza.         |
| Fondo papel     | `#F7F4EC` | Fondo general, con contraste suave para lectura prolongada.   |
| Verde estable   | `#2C7770` | Caja saludable, sincronización correcta y acciones positivas. |
| Amarillo umbral | `#E1B84C` | Línea del umbral de seguridad y advertencias informativas.    |
| Rojo hueco      | `#C95D4F` | Déficit, error accionable y fecha crítica.                    |
| Superficie fría | `#D8E6E1` | Paneles secundarios, filtros y estados seleccionados.         |

El rojo se reserva para un riesgo real; no se usará como decoración. Cada
estado debe tener también texto e icono, nunca depender solo del color.

### 4.3 Tipografía y composición

- `Manrope` para navegación, controles, tablas y cifras: legible en densidad
  alta y con numerales claros.
- `Newsreader` únicamente para el mensaje principal del dashboard y textos de
  orientación: aporta una voz editorial sin afectar la lectura operativa.
- Alineación predominantemente izquierda. Los montos se alinean a la derecha
  en tablas, pero las tarjetas de decisión mantienen el texto a la izquierda.
- Radio moderado de 12 px solo en superficies interactivas; no todas las
  secciones serán tarjetas redondeadas.
- Sin gradientes ornamentales, sin labels en mayúsculas y sin sombras pesadas.

### 4.4 Reglas de UI clean y profesional

- Fondo claro y estable; las superficies se distinguen por tono, borde y
  espacio, no por una colección de tarjetas idénticas.
- Una sola prioridad visual por viewport: alerta si hay riesgo; curva si no lo
  hay; recomendación como siguiente acción.
- Grid de 12 columnas en desktop, contenido máximo de aproximadamente 1,200 px
  y separación generosa de 24–32 px entre bloques.
- Radios consistentes de 10–12 px. Los paneles principales pueden tener una
  elevación sutil; tablas, divisores y bloques informativos deben permanecer
  planos.
- Jerarquía por tipografía, alineación y espacio antes que por colores fuertes.
- La navegación, botones, tablas y formularios deben sentirse sólidos y
  predecibles; cada acción debe decir claramente qué va a pasar.
- Estados hover, focus, disabled, loading y error se diseñan junto con el
  estado normal, usando el mismo lenguaje de shadcn/ui personalizado.
- No usar el tema gris/púrpura por defecto de shadcn/ui, gradientes de adorno,
  glassmorphism ni una sombra repetida debajo de cada componente.

### 4.5 UX sin saturación ni “teatro de IA”

- Colchón se presenta como una herramienta de claridad financiera, no como un
  chatbot. No habrá burbujas de conversación, badges de “IA”, varitas mágicas,
  “insights” artificiales ni texto que simule una personalidad.
- La interfaz no debe decir “la IA recomienda”. Debe decir qué ocurre: “Se
  proyecta un hueco el 25 de septiembre” y “Cobra esta factura antes de esa
  fecha”.
- El primer viewport tendrá una sola decisión principal: resolver una alerta o
  entender la curva. Como máximo mostrará tres métricas, una gráfica y una
  tarjeta de acción.
- La recomendación mostrará título, monto, fecha y evidencia breve. El detalle
  del cálculo vivirá en una sección expandible como “Ver por qué”, no en un
  párrafo permanente.
- La redacción será breve, en español claro y con verbos concretos. No repetir
  en el texto lo que ya comunica una etiqueta, color o gráfico.
- Los detalles operativos viven en Facturas y Banco; el dashboard resume y
  dirige. No convertir cada dato en una tarjeta.
- Cada pantalla tendrá una sola acción primaria. Acciones secundarias estarán
  subordinadas o dentro de un menú de desbordamiento.
- Un estado vacío siempre explica qué falta y ofrece el siguiente paso; nunca
  se llenará con texto promocional para “hacerlo ver completo”.
- La calma es parte del producto: una alerta debe ser clara y urgente solo en
  proporción al riesgo, sin alarmismo ni animaciones constantes.

### 4.6 Interacción y movimiento

- La respuesta visual empieza al presionar, no después de soltar: botones,
  filas y controles muestran feedback inmediato sin mover el layout.
- Microinteracciones de 150–300 ms; transiciones complejas no deben superar
  aproximadamente 400 ms. No habrá animaciones decorativas ni fondos en loop.
- Sheets, dialogs y menús aparecen desde su elemento disparador y salen por el
  mismo camino. Las transiciones serán interruptibles; nunca bloquearán la
  entrada del usuario.
- Usar springs críticos y sin rebote para cambios de estado normales. Reservar
  un rebote leve solo para una interacción que realmente tenga arrastre o
  momentum.
- Animar principalmente `transform` y `opacity`; evitar animar `width`,
  `height`, `top` o `left` si eso provoca reflow o saltos de contenido.
- Ninguna acción importante dependerá de swipe, hover o drag. Siempre habrá un
  control visible equivalente.
- En `prefers-reduced-motion`, sustituir desplazamientos y springs por
  cross-fades cortos o cambios estáticos. En `prefers-reduced-transparency`,
  convertir superficies translúcidas en sólidas.

#### Sistema de animación clean

La regla será **“se siente vivo, no animado”**. La animación solo aparece para
explicar una causa y un resultado, confirmar una acción o mantener continuidad
espacial.

| Situación                 | Tratamiento                                                                            | Ritmo                                |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| Press de botón o fila     | Escala sutil `0.98`, cambio de superficie o elevación; sin mover elementos vecinos.    | Respuesta inmediata; 80–150 ms.      |
| Hover y focus             | Cambio de color, borde o fondo; nunca un salto de tamaño.                              | 150–200 ms.                          |
| Aparición de contenido    | Opacidad + desplazamiento vertical de 4–8 px.                                          | 180–240 ms, una vez.                 |
| Cambio de datos           | Cross-fade dentro del mismo espacio reservado.                                         | 180–240 ms.                          |
| Sheet o dialog            | Entra desde su disparador con escala leve y fade; sale por el mismo camino.            | Spring crítico, aprox. 300–400 ms.   |
| Sincronización o forecast | Skeleton estable y progreso visible; no spinner infinito ni bloqueo silencioso.        | Feedback desde el inicio.            |
| Gráfica                   | Revelado único y corto para orientar la lectura; datos legibles desde el primer frame. | Máximo 300–400 ms.                   |
| Toast                     | Aparece con fade + escala leve y desaparece más rápido.                                | 180 ms de entrada, 120 ms de salida. |

Reglas adicionales:

- Máximo una o dos cosas importantes animándose por viewport.
- No animar contadores de dinero como espectáculo; si el valor cambia, hacer
  el cambio legible con una transición corta.
- No usar parallax, confetti, rebotes permanentes, pulsos de alerta ni reveals
  escalonados para llenar la pantalla.
- La animación de entrada no debe retrasar la acción ni la lectura del dato.
- Si una interacción puede interrumpirse, debe partir del estado visible actual
  y conservar la velocidad del gesto; nunca reiniciarse desde el estado inicial.
- Las animaciones de gesto serán 1:1 con el pointer y tendrán controles visibles
  equivalentes para teclado y personas que no usan touch.

### 4.7 Accesibilidad y calidad perceptual

- Objetivos táctiles mínimos de 44 × 44 px y separación mínima de 8 px.
- Contraste WCAG AA: 4.5:1 para texto normal y 3:1 para texto grande o
  elementos gráficos relevantes. El color nunca será el único indicador.
- Foco visible, navegación completa con teclado, labels reales en formularios,
  errores junto al campo y `aria-live` para errores o confirmaciones.
- La gráfica tendrá leyenda, tooltip accesible, resumen textual y alternativa
  tabular. Las líneas no dependerán únicamente de rojo contra verde.
- Diseño mobile-first con validación en 375, 768, 1024 y 1440 px; sin scroll
  horizontal y con espacio para barras fijas y safe areas.
- Tipografía base de 16 px, escalable con el tamaño de texto del sistema; no
  truncar información importante por ahorrar espacio.
- Skeletons reservan el espacio del contenido; botones async muestran progreso y
  no permiten doble envío.

### 4.8 Wireframe del dashboard

```text
┌────────────────────────────────────────────────────────────────────┐
│ Colchón   [Mi empresa ▾]                         [Actualizar]  Ana ▾ │
├───────────────┬────────────────────────────────────────────────────┤
│ Dashboard     │ Buenos días, Ana                                    │
│ Facturas      │ Tu caja proyectada hasta el 12 de octubre           │
│ Banco         │                                                      │
│               │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ Conexiones    │ │ Saldo actual │ │ Umbral       │ │ Datos        │ │
│               │ │ $185,000     │ │ $75,000      │ │ Actualizados │ │
│ Configuración │ └──────────────┘ └──────────────┘ └──────────────┘ │
│               │                                                      │
│               │ ┌──────────────────────────────┐ ┌───────────────┐ │
│               │ │ Curva de caja · 30 días      │ │ Alerta         │ │
│               │ │ saldo ───── umbral - - -     │ │ Hueco 25 sep   │ │
│               │ │              ● hueco          │ │ Déficit $30,000│ │
│               │ └──────────────────────────────┘ └───────────────┘ │
│               │                                                      │
│               │ ┌────────────────────────────────────────────────┐ │
│               │ │ Recomendación                                  │ │
│               │ │ Cobra la factura de Cliente X antes del 25 sep │ │
│               │ │ Evidencia · monto · [Aceptar] [Descartar]      │ │
│               │ └────────────────────────────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────┘
```

En móvil, la navegación lateral pasa a una barra inferior de cuatro accesos;
la alerta y la recomendación aparecen antes de la gráfica para que la acción
no quede escondida debajo del scroll.

## 5. Arquitectura de navegación

La organización activa vive en la URL para que el cambio de empresa sea
explícito y no se mezclen datos entre tenants.

| Ruta                                         | Propósito                                                  | Prioridad |
| -------------------------------------------- | ---------------------------------------------------------- | --------- |
| `/auth/sign-in`                              | Inicio de sesión.                                          | P0        |
| `/auth/sign-up`                              | Registro y estado de confirmación de correo.               | P0        |
| `/app/[organizationId]/onboarding`           | Crear empresa, conectar fuentes y generar primera corrida. | P0        |
| `/app/[organizationId]/dashboard`            | Saldo actual, curva, hueco, recomendación y frescura.      | P0        |
| `/app/[organizationId]/invoices`             | CxC/CxP, filtros por dirección y estado.                   | P1        |
| `/app/[organizationId]/invoices/[invoiceId]` | Ficha de una factura con saldo, fechas y datos fiscales.   | P1        |
| `/app/[organizationId]/bank`                 | Cuentas y movimientos bancarios.                           | P1        |
| `/app/[organizationId]/settings/connections` | Estado, actualización, renombrado y revocación.            | P1        |
| `/app/[organizationId]/settings/company`     | Nombre, RFC, moneda, zona horaria y reserva mínima.        | P2        |
| `/app/[organizationId]/settings/team`        | Invitar, cambiar rol y retirar miembros.                   | P2        |

El shell autenticado contiene el selector de organización, navegación, menú de
usuario y un indicador de frescura. La navegación se filtra por capacidad,
pero el backend sigue siendo la autoridad final.

## 6. Flujos principales

### 6.1 Autenticación

1. Login llama `POST /auth/sign-in`.
2. El cliente conserva únicamente el estado visual; las cookies quedan en el
   navegador como HTTP-only.
3. La app confirma la sesión con `GET /auth/session` o `GET /me`.
4. Si el usuario no tiene organizaciones, se muestra creación de empresa.
5. Un `401` intenta una sola renovación con `POST /auth/refresh`; si falla,
   redirige a login.
6. Cerrar sesión llama `POST /auth/sign-out` y limpia el cache local.

El registro debe mostrar claramente `requiresEmailConfirmation` cuando el
backend no devuelve una sesión inmediata.

### 6.2 Onboarding de la demo

El onboarding debe ser una lista de progreso visible, no un formulario técnico
de proveedores:

1. Crear la PyME con nombre y moneda.
2. Registrar la conexión bancaria de demostración (`nessie`).
3. Ejecutar la sincronización bancaria y mostrar cuentas, movimientos y
   contadores devueltos.
4. Registrar la conexión CFDI sintética y ejecutar `POST /cfdi/demo-seed`.
5. Ejecutar `POST /forecasts/runs` con `horizonDays: 30`.
6. Llevar al dashboard y refrescar `GET /dashboard`.

Cada paso debe mostrar `pending`, `running`, `completed` o `failed`, con un
botón de reintento que no duplique importaciones ni conexiones.

### 6.3 Dashboard diario

Orden de lectura:

1. Encabezado: organización, fecha de corte y última actualización.
2. Si existe `gap`: alerta de fecha y déficit.
3. Recomendación explicable: título, monto, evidencia y estado.
4. Gráfica diaria de 30 días: saldo proyectado, umbral y punto crítico.
5. Resumen de fuentes de datos y enlaces a Facturas/Banco.

La gráfica debe incluir tooltip, leyenda textual y una vista tabular accesible
para teclado o lectores de pantalla. Si no existe hueco, se comunica como un
estado positivo (“No se proyecta un hueco en los próximos 30 días”), no como un
espacio vacío.

### 6.4 Acción sobre una recomendación

La primera versión no envía correos, cobra facturas ni mueve dinero. Solo
registra la decisión del usuario:

- `accepted`: el usuario decide tomar la recomendación.
- `dismissed`: el usuario la descarta.
- `completed`: el usuario confirma que realizó la acción.
- `open`: vuelve al estado pendiente.

Después de cada `PATCH`, se invalida la consulta del dashboard y se muestra un
toast con el mismo verbo usado por el botón. Las acciones sensibles deben tener
confirmación y ser repetibles sin crear efectos duplicados.

## 7. Mapa de consumo de API

| Feature        | Endpoints principales                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesión         | `POST /auth/sign-in`, `POST /auth/sign-up`, `POST /auth/refresh`, `POST /auth/sign-out`, `GET /auth/session`, `GET /me`                                                                                                                                        |
| Organizaciones | `GET /organizations`, `POST /organizations`, `GET/PATCH /organizations/:organizationId`                                                                                                                                                                        |
| Dashboard      | `GET /organizations/:organizationId/dashboard`                                                                                                                                                                                                                 |
| Onboarding     | `POST /organizations/:organizationId/connections`, `POST /organizations/:organizationId/syncs`, `GET /organizations/:organizationId/syncs/:syncId`, `POST /organizations/:organizationId/cfdi/demo-seed`, `POST /organizations/:organizationId/forecasts/runs` |
| Banco          | `GET /organizations/:organizationId/bank/accounts`, `GET /organizations/:organizationId/bank/transactions`                                                                                                                                                     |
| CFDI           | `GET /organizations/:organizationId/invoices`                                                                                                                                                                                                                  |
| Pronóstico     | `GET /organizations/:organizationId/forecasts/latest`, `GET /organizations/:organizationId/forecasts/:forecastId/points`, `GET /organizations/:organizationId/liquidity-gaps`, `GET /organizations/:organizationId/recommendations`                            |
| Acciones       | `PATCH /organizations/:organizationId/recommendations/:recommendationId`, `PATCH /organizations/:organizationId/liquidity-gaps/:gapId`                                                                                                                         |
| Administración | conexiones y miembros según los endpoints de `connections` y `members`                                                                                                                                                                                         |

El cliente HTTP debe:

- Desempaquetar `data` y conservar `meta.requestId` para soporte.
- Traducir `error.code` a mensajes accionables sin esconder el request ID.
- Reintentar solo la renovación de sesión; no reintentar mutaciones a ciegas.
- Cancelar requests obsoletos cuando cambia la organización o el filtro.
- Tratar montos como strings hasta el momento de formatearlos.

## 8. Estados que deben diseñarse desde el inicio

| Estado                         | Comportamiento                                                       |
| ------------------------------ | -------------------------------------------------------------------- |
| Cargando                       | Skeleton con la misma geometría del contenido final.                 |
| Sin organización               | CTA para crear la PyME; no mostrar dashboard vacío.                  |
| Inputs incompletos (`422`)     | Onboarding guiado con el paso faltante.                              |
| Sin hueco                      | Estado de caja estable, sin alerta roja.                             |
| Hueco abierto                  | Fecha, déficit, severidad, explicación y recomendación.              |
| Recomendación atendida         | Estado visible y posibilidad de reabrir cuando aplique.              |
| Conexión con error             | Fuente afectada, error legible, última sincronización y reintento.   |
| Sesión expirada (`401`)        | Renovación única; después login.                                     |
| Sin permisos (`403`)           | Ocultar el comando y ofrecer lectura si el rol la permite.           |
| Error de proveedor (`429/504`) | Mensaje de indisponibilidad temporal, sin perder la pantalla previa. |
| Error inesperado (`500`)       | Mensaje breve, request ID y acción de reintento.                     |

Los estados de datos incompletos, sin CFDI o sin sincronización deben ser
educativos: deben decir qué falta y cuál es el siguiente paso.

## 9. Estructura propuesta de `apps/web`

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   └── app/[organizationId]/
│   │       ├── layout.tsx
│   │       ├── onboarding/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── invoices/page.tsx
│   │       └── invoices/[invoiceId]/page.tsx
│   │       ├── bank/page.tsx
│   │       └── settings/
│   ├── components/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   └── bank/
│   ├── lib/
│   │   ├── api/client.ts
│   │   ├── api/contracts.ts
│   │   ├── api/errors.ts
│   │   ├── auth/session.ts
│   │   ├── formatters/money.ts
│   │   └── permissions.ts
│   └── styles/tokens.css
├── e2e/
└── package.json
```

Los componentes de `features` conocen el contrato de su módulo. Los
componentes base no conocen endpoints ni reglas financieras.

## 10. Plan de ejecución

### Fase 0 — Contrato y arranque

- Crear `apps/web` y configurar el workspace.
- Confirmar URL del API, CORS, cookies y navegación entre puertos.
- Crear cliente HTTP, envelope, errores y contratos TypeScript.
- Añadir fixtures de dashboard con y sin `gap` para trabajar sin bloquearse
  por Nessie.

### Fase 1 — Shell y autenticación

- Crear tokens visuales, tipografía, layout y navegación responsive.
- Implementar login, registro, confirmación de correo, logout y sesión expirada.
- Implementar selector de organización y creación inicial.

### Fase 2 — Onboarding funcional

- Construir el progreso de banco, CFDI y pronóstico.
- Conectar acciones con los endpoints existentes.
- Manejar estados de sincronización, errores y reintentos.
- Llegar a un dashboard válido sin pasos manuales de base de datos.

### Fase 3 — Dashboard P0

- Implementar resumen de saldo, umbral y frescura.
- Implementar gráfica de 30 días con umbral y marcador del hueco.
- Implementar alerta, recomendación, evidencia y estados sin hueco.
- Implementar aceptar, descartar y completar recomendación.

### Fase 4 — Datos operativos P1

- Crear tabla de CxC/CxP con filtros y estados.
- Crear banco con cuentas, movimientos, última sincronización y reintento.
- Agregar conexiones con estados activo/error/revocado.

### Fase 5 — Administración y calidad

- Agregar empresa, equipo y permisos por rol.
- Probar mobile, keyboard navigation, focus visible, contraste y reduced motion.
- Ejecutar E2E del journey completo con dataset sintético.
- Ensayar la demo con una respuesta de Nessie exitosa y un fallback documentado.

Para una demo, el orden de recorte es: dashboard, onboarding, autenticación,
acción de recomendación, banco/CFDI y finalmente configuración de equipo.

## 11. Pendientes de contrato antes de cerrar la UI

El backend documentado y la implementación actual no son idénticos en algunos
campos del dashboard. Para el primer corte se puede usar el contrato real,
pero hay que decidir lo siguiente antes de diseñar una vista más detallada:

| Tema          | Contrato documentado                 | Respuesta actual                                                 | Decisión propuesta                                                                        |
| ------------- | ------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Hueco         | Incluye `minimumReserve`.            | Devuelve `date`, `deficit`, `severity` y `explanation`.          | Usar los campos actuales en P0; agregar `minimumReserve` solo si el producto lo necesita. |
| Recomendación | Muestra `actionBy` y `confidence`.   | Devuelve `id`, `type`, `title`, `amount`, `status` y `evidence`. | No inventar esos valores en UI; agregarlos al backend o dejar la tarjeta sin ellos.       |
| Frescura CFDI | Muestra `cfdiLastImportedAt`.        | Devuelve frescura bancaria y de corrida, no la fecha CFDI.       | Mostrar solo las fechas reales hasta ampliar el payload.                                  |
| Estados       | Un flujo anterior menciona `viewed`. | El DTO acepta `open`, `accepted`, `dismissed`, `completed`.      | Diseñar la UI con los cuatro estados implementados.                                       |
| Facturas      | Se documenta `/invoices`.            | También existe `/cfdi/invoices`.                                 | Estandarizar el frontend en `/invoices`.                                                  |

## 12. Criterios de aceptación del MVP frontend

- Un usuario puede registrarse, iniciar sesión y crear una organización.
- Un usuario puede completar el flujo de datos sintéticos y llegar a un
  dashboard con una corrida completada.
- El dashboard muestra correctamente saldo, umbral, curva de 30 días, fecha y
  monto del hueco cuando existe.
- La recomendación se presenta con evidencia y sus cambios de estado persisten
  mediante la API.
- Un dashboard sin datos suficientes lleva al onboarding y no muestra una
  gráfica engañosa.
- Los montos se muestran en MXN y las fechas respetan la zona horaria de la
  organización.
- Los errores `401`, `403`, `422`, `429`, `504` y `500` tienen una salida clara.
- Un `viewer` no ve botones de sincronizar, importar, configurar o administrar.
- La experiencia funciona en desktop y móvil, tiene foco visible, alternativa
  tabular para la gráfica y respeta `prefers-reduced-motion`.
- El flujo completo se puede ejecutar con `pnpm` y un solo comando de desarrollo
  para API y frontend documentado en el README.

## 13. Fuera de alcance del primer frontend

- Conexión directa con SAT, almacenamiento del XML crudo o sincronización
  automática de CFDI.
- Transferencias, cobranza automática o solicitud real de crédito.
- Machine learning, edición manual de la curva o escenarios avanzados.
- Notificaciones multicanal.
- Dashboard multi-moneda.

## 14. Implementación actual

- Sesión, registro, selector de empresa y creación inicial en `/app/new`.
- Primeros pasos con conexión Nessie, sincronización, CFDI sintético e
  importación de XML/JSON y generación de proyección. Los estados se
  reconstruyen desde la API.
- Dashboard con curva, tabla accesible y seguimiento de recomendaciones.
- Facturas con búsqueda siempre visible y un botón de filtros que agrupa tipo,
  estado y orden. La búsqueda y los filtros persisten en URL; limpiar el menú
  conserva la búsqueda. Cada fila navega a una ficha de factura con saldo,
  resumen financiero y datos del comprobante. La API devuelve hasta 500
  facturas por consulta.
- Banco con cuentas y movimientos filtrables; la actualización de fuentes vive
  en Conexiones mediante una acción compacta por conexión.
- Configuración de empresa, conexiones, equipo y pagos recurrentes.
- Ayuda breve y navegación equivalente en modo de ejemplo sin llamadas a la API.
- Formularios con validación, estados pendientes, errores y confirmación de
  descarte en diálogos. Comandos restringidos por permisos de la sesión; NestJS
  sigue siendo la autoridad.
- Pruebas de contratos, filtros, validación, cliente HTTP y permisos, además de
  una suite E2E de escritorio/móvil con API interceptada.

### Límites del contrato que la interfaz hace explícitos

- Nessie requiere un cliente creado previamente; el frontend no crea clientes
  en el proveedor ni recibe sus claves. No hay conexión bancaria real.
- Importación CFDI por XML local y JSON normalizado. El XML se interpreta en el
  navegador y se envían al backend únicamente los datos normalizados; no hay
  conexión directa con SAT ni almacenamiento del XML crudo. No hay conversión
  de monedas. Se muestra la moneda real de la organización y de cada registro.
- Miembros: la API actual devuelve IDs, no perfiles completos. Se usa el correo
  de la sesión para la propia cuenta y el ID para los demás cuando falta el correo.
  Solo se ofrecen los roles que aceptan los DTOs: admin, analyst y viewer.
- Pagos recurrentes: el backend permite crear/consultar, no editar/eliminar.
- El RFC guardado se puede reemplazar, pero la API no acepta borrarlo.
- Las pruebas E2E interceptadas no sustituyen un ensayo de invitaciones por correo
  ni una conexión real al proveedor. No se ejecutan acciones destructivas sobre
  la cuenta de demostración durante la revisión visual.

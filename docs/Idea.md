# Mirror para PyMEs

Gemelo financiero para decidir bajo qué condiciones aceptar un nuevo trabajo

**Versión:** 2.0  
**Actualización:** 12 de septiembre de 2026.  
**Contexto:** Capital One Challenge, HackMTY 2026.  
**Enfoque exclusivo:** problemática 2, SMB Cash-Flow & Working Capital Intelligence (B2B).  
**Producto acordado:** aplicación móvil y backend propio.  
**Alcance actual:** definición de un prototipo funcional con datos sintéticos; todavía no se inicia la implementación.  
**Nessie:** el usuario confirmó que ya cuenta con una API key. Su valor no debe incluirse en documentos, código público, capturas ni registros.

Este documento reemplaza la definición anterior de la idea y reúne la dirección de producto, el alcance técnico funcional, la estrategia de demostración y la evidencia que deberemos preparar para el jurado. Las decisiones de stack y diseño visual se tomarán después. Las hipótesis de mercado, precio y adopción se distinguen de los hechos investigados.

## 1. La idea en una frase

**Mirror representa los compromisos financieros de una pequeña empresa y calcula qué anticipo, calendario de pagos o ajuste de gasto necesita para aceptar un nuevo trabajo manteniendo cubiertas sus obligaciones en los escenarios evaluados.**

La pregunta central es:

> Quiero aceptar este trabajo. ¿Qué condiciones necesito para hacerlo sin comprometer los pagos de los próximos 30 días?

El resultado esperado es un plan explicable con importes, fechas, condiciones pendientes y vigencia. Si los datos no alcanzan o ninguna alternativa satisface las restricciones, el sistema deberá decirlo.

El concepto protagonista será la **planificación inversa**: partir de la decisión que el dueño quiere tomar y calcular las condiciones financieras necesarias para sostenerla. El gemelo se actualizará cuando cambien los movimientos, los compromisos o las condiciones del plan.

## 2. El problema y los límites del reto

Una empresa puede recibir un trabajo con margen positivo y necesitar dinero para realizarlo antes de cobrar. Ese desfase puede afectar la nómina, la renta o los proveedores de la operación que ya tiene.

El saldo bancario, el margen de un contrato y la liquidez disponible para comprometer son conceptos distintos. Nuestra oportunidad consiste en relacionarlos mediante un calendario financiero verificable.

Las necesidades que investigaremos son:

- Conocer conjuntamente dinero recibido, gastos realizados y compromisos futuros.
- Detectar faltantes diarios, incluso cuando el saldo final del mes sea positivo.
- Identificar qué obligaciones quedarían afectadas por una nueva decisión.
- Comparar ajustes que el negocio realmente puede realizar.
- Mantener una reserva cuyo importe y propósito sean comprensibles.
- Evitar que varias decisiones utilicen la misma capacidad de gasto.
- Revisar una decisión cuando cambian los datos que la sustentaban.

Son hipótesis de necesidad para nuestro segmento; no afirmamos haber realizado entrevistas o pilotos.

### 2.1 Los cuatro objetivos obligatorios de nuestra propuesta

| Objetivo de la problemática 2 | Función de Mirror | Evidencia en la demo |
| --- | --- | --- |
| Integrar ingresos y gastos operativos | Normalizar movimientos de Nessie y relacionarlos con cobros, gastos y obligaciones. | Separación visible entre realizado y pendiente, con conciliación de un anticipo. |
| Pronosticar liquidez de los próximos 30 días | Proyección por día a partir del saldo de corte, compromisos y estimaciones explícitas. | Saldo mínimo, fecha del faltante y comparación base/escenario. |
| Ayudar a controlar gastos generales | Presupuesto sencillo por categoría; separación entre pagado, comprometido y ajustable. | Efecto de un gasto adicional y de un ajuste permitido sobre el presupuesto y la caja. |
| Recomendar reservas oportunas de capital de trabajo | Calcular la liquidez a conservar, considerando vencimientos, cobros y un colchón definido. | Importe objetivo, brecha de cobertura, obligaciones relacionadas y fecha necesaria. |

El caso de un nuevo contrato sirve para demostrar estos cuatro objetivos; no reemplaza ninguno de ellos.

### 2.2 Lo que pide el documento del reto

El PDF establece un prototipo funcional, un repositorio público de código y una demo en vivo. Acepta aplicaciones móviles, aplicaciones web, motores API o tableros interactivos. El hackathon descrito dura **36 horas**.

Nessie está fuertemente recomendado, pero el PDF no lo declara obligatorio. Para nuestro proyecto sí lo elegimos como fuente bancaria simulada.

No se exige ejecutar dinero real ni entrenar un modelo de machine learning. La inteligencia de Mirror se demostrará con lógica de proyección, búsqueda de condiciones, restricciones y reevaluación.

El PDF no resuelve todas las reglas sobre código previo, herramientas de IA, propiedad intelectual, licencias o formato de presentación. Esos detalles deberán confirmarse con la organización o los mentores antes de la entrega.

## 3. Usuario específico y recorrido principal

### 3.1 Persona de la demo

**Persona ficticia:** Ana, dueña y administradora de una pequeña empresa de limpieza de oficinas.

- Coordina un equipo pequeño y varios contratos B2B.
- Paga personal, insumos y gastos recurrentes.
- Sus clientes pueden pagar después de que empiece el servicio.
- Revisa movimientos y toma decisiones desde el celular.
- Necesita entender importes y fechas sin interpretar un reporte financiero complejo.
- Quiere aceptar más trabajo, pero necesita conservar capacidad para cumplir lo ya comprometido.

El segmento de limpieza es nuestra hipótesis inicial de entrada. No representa una exclusividad del producto ni un mercado validado.

### 3.2 Recorrido del usuario

| Momento | Qué hace Ana | Qué responde Mirror |
| --- | --- | --- |
| Preparación | Abre el negocio ficticio y confirma sus próximos pagos y cobros. | Muestra fuentes, fecha de corte y datos que requieren revisión. |
| Visibilidad | Revisa los próximos 30 días. | Presenta el mínimo diario, gastos comprometidos y reserva objetivo. |
| Nueva oportunidad | Captura el importe, costos y calendario de un trabajo. | Proyecta su efecto sobre la operación existente. |
| Diagnóstico | Consulta por qué aparece una restricción. | Identifica obligación, fecha, importe y eventos relacionados. |
| Comparación | Indica qué anticipos o acuerdos de proveedor son posibles. | Calcula alternativas permitidas y sus condiciones pendientes. |
| Registro | Elige registrar un plan. | Guarda una ficha, incorpora compromisos internos y recalcula la capacidad restante. |
| Seguimiento | Se recibe un movimiento o cambia una fecha. | Concilia, actualiza la ficha y solicita revisión si el resultado deja de sostenerse. |

Registrar un plan en Mirror no equivale a firmar un contrato, autorizar un pago bancario o confirmar la aceptación de otra persona.

## 4. Qué existe y dónde buscaremos diferenciarnos

La investigación pública, revisada el 12 de septiembre de 2026, confirma que Capital One ya ofrece tesorería, pagos y soluciones de cobro y conciliación. Brex forma parte del grupo desde la adquisición completada el 7 de abril de 2026.

Brex documenta presupuestos de gasto compartidos, políticas, seguimiento y redistribución mediante Live Budgets, además de límites de crédito que pueden variar con información financiera. Float también presenta escenarios para decisiones empresariales. Las capacidades dependen del producto y de sus condiciones; no hemos probado una cuenta empresarial de estos proveedores.

| Capacidad existente | Consecuencia para nuestra propuesta |
| --- | --- |
| Pagos, cobros y conciliación en Capital One | No describiremos al banco como una herramienta que solamente muestra saldos o presta después de una crisis. |
| Presupuestos, políticas y límites en Brex | Controlar gastos antes de realizarlos o compartir presupuesto no bastan como argumento de originalidad. |
| Escenarios financieros en Float | Agregar un simulador o una gráfica de flujo de efectivo tampoco demuestra diferenciación por sí solo. |

Fuentes: [tesorería de Capital One](https://www.capitalone.com/small-business/bank/services/treasury-management/), [soluciones de cobro](https://www.capitalone.com/commercial/solutions/treasury-management/accounts-receivable/), [adquisición de Brex](https://www.capitalone.com/about/newsroom/capital-one-completes-acquisition-of-brex/), [Live Budgets](https://www.brex.com/journal/live-budgets), [límites de Brex](https://www.brex.com/support/company-credit-limit) y [escenarios en Float](https://floatapp.com/blog/cash-flow-scenarios-big-decisions).

### 4.1 Hipótesis de diferenciación

La combinación que queremos defender es:

1. **Planificación inversa:** calcular condiciones de entrada de un nuevo trabajo, dentro de un conjunto acotado de alternativas.
2. **Protección de obligaciones identificables:** explicar qué pago y qué colchón justifican cada restricción.
3. **Condiciones verificables:** distinguir dinero esperado, acuerdos pendientes y movimientos recibidos.
4. **Decisiones relacionadas y con vigencia:** incorporar compromisos registrados y revisar resultados cuando cambie su contexto.

La originalidad competitiva de esta combinación sigue por validar. No afirmaremos que nadie la ofrece, que Capital One carece de herramientas internas equivalentes, ni que el nombre Mirror o la tecnología de gemelos digitales son una invención exclusiva.

### 4.2 Cómo sustentaremos la comparación

Usaremos el mismo caso financiero para comprobar si cada alternativa permite:

- Encontrar un anticipo mínimo y una fecha útil.
- Explicar la obligación y reserva que determinan ese importe.
- Mantener una negociación como pendiente.
- Evaluar una segunda decisión con el primer compromiso incorporado.
- Revisar el resultado cuando cambian los datos.

La comparación distinguirá función documentada, función probada y función no verificada. La ausencia de una descripción pública no se presentará como prueba de inexistencia.

## 5. El gemelo financiero y la calidad de la información

El gemelo representa cuentas, movimientos, cobros, obligaciones, gastos, presupuestos y decisiones relacionadas. Su alcance inicial es financiero; no pretende reproducir toda la operación de una empresa.

### 5.1 Tres capas separadas

- **Hechos observados:** saldos y movimientos del sandbox, con identificador de origen y momento de actualización.
- **Compromisos y estimaciones:** obligaciones, cobros pendientes y fechas previstas. Una factura por cobrar no es dinero disponible.
- **Escenarios:** decisiones propuestas, retrasos, sobrecostos y negociaciones aún no concretadas.

Una simulación no modificará los hechos originales. Cada resultado conservará la versión de los datos y las condiciones que utilizó.

### 5.2 Datos mínimos

| Información | Origen inicial | Cuidado principal |
| --- | --- | --- |
| Cuenta y saldo de corte | Nessie | No volver a sumar movimientos que ya forman parte del saldo. |
| Depósitos y retiros | Nessie | Distinguir estados y evitar duplicados. |
| Pagos recurrentes o puntuales | Nessie y calendario propio | No duplicar un pago importado con una obligación capturada. |
| Cobros y contratos futuros | Datos sintéticos propios y captura guiada | Separar monto total, recibido y pendiente. |
| Costos del nuevo trabajo | Captura guiada sobre una plantilla ficticia | Registrar importe, fecha y posibilidad real de ajuste. |
| Gastos generales y presupuestos | Clasificación y configuración | Separar lo pagado de lo comprometido. |
| Colchón y restricciones | Configuración explícita | No presentarlos como valores óptimos aprendidos sin evidencia. |
| Acuerdos y condiciones | Registro del usuario y conciliación cuando corresponda | Un abono confirma recepción de dinero, no todos los términos de un contrato. |

### 5.3 Respuesta ante información incompleta

Antes de evaluar se revisarán los campos necesarios para el caso y la confirmación de compromisos como nómina, renta, proveedores e impuestos.

Se pedirá la información faltante que pueda cambiar el resultado. Una lista de confirmación no prueba que conocemos todas las obligaciones del negocio.

Si falta un dato crítico, Mirror mostrará **información insuficiente para evaluar**. Si utiliza una estimación, deberá identificarla. No inventará porcentajes de confianza ni afirmará que una empresa está completamente representada.

## 6. Motor de proyección y planificación inversa

### 6.1 Proyección diaria

Partiremos de una fecha de corte y evaluaremos los 30 días siguientes, incluyendo el saldo inicial en las comprobaciones.

Para cada escenario:

> Saldo de un día = saldo de corte + entradas posteriores al corte acumuladas hasta ese día - salidas posteriores al corte acumuladas hasta ese día.

El calendario incluirá compromisos conocidos y estimaciones identificadas. Las recurrencias del historial pueden sugerirse para revisión; no se inferirá estacionalidad anual de un historial corto.

En el MVP no será necesario entrenar un modelo predictivo. La proyección deberá funcionar con reglas y datos auditables.

### 6.2 Métricas que debe calcular

- **Saldo mínimo:** menor saldo dentro del horizonte.
- **Faltante operativo:** importe necesario para evitar un saldo negativo en el punto problemático.
- **Brecha de protección:** importe necesario para mantener el colchón configurado.
- **Reserva operativa objetivo:** liquidez a conservar en una fecha para cubrir el mayor desfase acumulado entre pagos y cobros considerados, más el colchón, dentro del horizonte.
- **Capacidad para un gasto adicional:** importe adicional en una fecha que permite mantener el piso en los escenarios seleccionados.
- **Fecha crítica:** primer día que incumple el piso o presenta un faltante operativo.

El colchón es una decisión de política del negocio; la reserva operativa se calcula a partir del calendario. Si la reserva objetivo supera el dinero existente, se mostrará la brecha. Apartar dinero dentro de Mirror no crea efectivo ni constituye una reserva bancaria real.

### 6.3 Búsqueda de condiciones

El usuario establece qué puede cambiar y los límites de cada opción. El motor:

1. Calcula la situación base y el efecto del nuevo trabajo.
2. Identifica fechas problemáticas y obligaciones relacionadas.
3. Evalúa las alternativas permitidas, respetando límites e importes.
4. Busca el menor ajuste suficiente dentro de cada alternativa.
5. Comprueba todos los días del horizonte y los escenarios seleccionados.
6. Compara resultados, condiciones y costos conocidos.

No prometeremos una solución óptima para todas las decisiones posibles. La optimalidad, cuando se afirme, estará limitada al conjunto de alternativas y restricciones evaluadas.

### 6.4 Dos alternativas del MVP

**A. Anticipo del cliente.** Calcular cuánto debe cobrarse antes de una fecha crítica, limitado por el importe pendiente y por el anticipo máximo que el usuario indica que podría negociar. El cobro final se reduce en el mismo importe.

**B. Pago escalonado al proveedor.** Calcular qué parte de un desembolso negociable debe moverse a otra fecha permitida, conservando el importe total e incluyendo comisiones conocidas. La entrega necesaria para realizar el trabajo debe mantenerse según las condiciones capturadas.

El segundo caso no autoriza a retrasar nómina, impuestos ni obligaciones que el negocio declaró no negociables. Un pago diferido requiere acuerdo; no se considerará confirmado solamente porque mejora la gráfica.

Los ajustes de gastos generales se mostrarán mediante un control básico de presupuesto y un gasto flexible editable. Un optimizador general de categorías queda fuera del MVP.

### 6.5 Escenarios y estados del resultado

El MVP tendrá el escenario base y un escenario de retraso de cobro. El sobrecosto será una ampliación si el recorrido principal ya funciona.

Los estados descriptivos incluirán:

- Cubre obligaciones y colchón en los escenarios evaluados.
- Cubre las obligaciones, pero no conserva todo el colchón.
- Presenta un faltante operativo.
- Cumpliría el piso si se concretan condiciones pendientes.
- No hay información suficiente para evaluar.
- Requiere revisión por cambios en los datos.

Una decisión puede tener condiciones pendientes y, a la vez, un resultado financiero insuficiente. La app deberá mostrar ambas dimensiones.

La cobertura de escenarios no equivale a una probabilidad calibrada. Si un contrato o devolución continúa después del día 30, se advertirá que su viabilidad integral no fue evaluada. Mover un problema al día 31 no se presentará como una solución completa.

## 7. Ficha de decisión y seguimiento

Cada plan conservará:

- Decisión que se evaluó e importes asociados.
- Fecha de corte, versión de datos y momento del cálculo.
- Obligaciones y colchón considerados.
- Escenarios y restricciones.
- Resultado diario y condición que determina la brecha.
- Alternativa elegida, costo conocido y condiciones pendientes.
- Persona que registró o confirmó un cambio dentro de la demo.

El registro de un plan incorporará sus compromisos al estado de planeación. Un segundo plan se evaluará contra ese estado actualizado.

Antes de registrar una decisión, el backend verificará que la versión de datos sigue vigente. Si dos solicitudes compiten por la misma capacidad, la segunda deberá recalcularse después del primer registro.

Las condiciones pendientes no aumentarán el efectivo observado ni liberarán capacidad incondicional. Cuando llegue un movimiento, se conciliará con el cobro correspondiente; si la relación es ambigua, se solicitará revisión.

Cuando cambien datos relevantes, la ficha se marcará para revisión hasta completar el recálculo. No se seguirá mostrando como vigente una conclusión sustentada en información anterior.

## 8. Ejemplo financiero verificable

Caso totalmente sintético, expresado en MXN como unidad ilustrativa. No implica cobertura bancaria real en México ni validación laboral o fiscal. Los costos se simplifican para aislar el desfase de caja.

### 8.1 Situación inicial

- Saldo de corte: **$50,000**.
- Nómina existente: **$30,000 el día 18**.
- Colchón configurado: **$10,000**.
- Sin otros movimientos dentro de este ejemplo mínimo.

El nuevo trabajo cobra **$60,000 el día 28** y requiere un pago de **$40,000 a un proveedor el día 10**. El margen de contribución simplificado es $20,000; no es utilidad neta y no incluye impuestos u otros costos.

Sin aceptar el trabajo, el saldo después de la nómina sería $20,000. La reserva objetivo inicial para esa operación es $40,000: nómina más colchón, al no haber otros cobros considerados. La capacidad para un gasto adicional inmediato sería $10,000.

### 8.2 Condiciones originales

| Momento | Movimiento | Saldo |
| --- | --- | --- |
| Inicio | Saldo de corte | $50,000 |
| Día 10 | Proveedor: -$40,000 | $10,000 |
| Día 18 | Nómina: -$30,000 | -$20,000 |
| Día 28 | Cobro del trabajo: +$60,000 | $40,000 |

El faltante operativo es $20,000 y la brecha para conservar el colchón es $30,000. El saldo final positivo no elimina el problema del día 18.

### 8.3 Plan A: anticipo

Recibir **$30,000 el día 17**, antes de la nómina, y cobrar los **$30,000 restantes el día 28**.

Los saldos de los días 10, 17, 18 y 28 serían $10,000, $40,000, $10,000 y $40,000. El plan conserva el colchón bajo los supuestos del ejemplo.

La fecha de disponibilidad debe ser anterior al pago afectado. No asumiremos que un cobro del mismo día se procesa antes que la nómina.

### 8.4 Plan B: acuerdo de proveedor

Si el proveedor acepta entregar el día 10 y recibir **$10,000 ese día y $30,000 el día 29**, sin cargo adicional en este caso sintético:

- Día 10: saldo de $40,000.
- Día 18: saldo de $10,000.
- Día 28: saldo de $70,000.
- Día 29: saldo de $40,000.

También conserva el colchón, pero depende de un acuerdo comercial distinto. No declararemos que es mejor que el anticipo sin conocer costos, esfuerzo y restricciones reales.

### 8.5 Caso donde las condiciones no alcanzan

Si el anticipo máximo permitido es $20,000 y el proveedor no acepta modificar su pago, el saldo mínimo sería $0. Se cubren las salidas, pero faltan $10,000 para conservar el colchón.

Mirror deberá indicar que **ninguna alternativa permitida mantiene el piso configurado**. No inventará una tercera opción ni reducirá el colchón sin decisión del usuario.

Todos los planes conservan el mismo ingreso total del trabajo. La comparación mide cambios de calendario; no genera ingresos nuevos por duplicar anticipos.

## 9. App móvil y backend

### 9.1 App móvil

La app tendrá tres espacios funcionales principales. No fijamos todavía el diseño visual:

1. **Mi liquidez:** saldo observado, fecha de actualización, calendario de 30 días, gastos por categoría y reserva objetivo.
2. **Evaluar trabajo:** captura guiada, confirmación de datos necesarios y comparación de las dos alternativas.
3. **Mis decisiones:** fichas registradas, condiciones pendientes y cambios que requieren revisión.

El flujo debe permitir entender cuatro cosas sin conocimientos financieros avanzados: qué pago está afectado, cuándo, por cuánto y qué condición cambiaría el resultado.

La interfaz mostrará texto junto a los colores de estado, importes legibles y una distinción persistente entre datos del sandbox, compromisos y escenarios. No dependerá de un chat para completar la tarea.

La plataforma móvil inicial y la forma de presentar la app al jurado están pendientes de elección. El PDF no obliga a publicar en App Store o Google Play; prepararemos una demo funcional accesible en el dispositivo elegido.

### 9.2 Backend

El backend será la autoridad de datos y cálculo. Tendrá responsabilidades separadas:

- Acceso a la demo y aislamiento de los datos de cada sesión o negocio.
- Adaptador de Nessie y protección de credenciales.
- Normalización, control de duplicados y conciliación.
- Calendario de compromisos, presupuestos y decisiones.
- Motor de proyección y búsqueda de condiciones.
- Versionado, registro de decisiones y comprobación de vigencia.
- Explicaciones estructuradas y actualización de resultados para la app.

La separación funcional será **app móvil ↔ backend de Mirror ↔ Nessie**, con almacenamiento propio para compromisos y escenarios.

El backend no autorizará contratos ni ejecutará pagos reales. Aceptar un plan modificará exclusivamente el estado interno de planeación.

No se ha elegido framework móvil, lenguaje de backend, base de datos, autenticación ni alojamiento. Esas decisiones deberán favorecer el recorrido principal y el tiempo disponible, sin añadir infraestructura innecesaria.

## 10. Integración de Nessie

### 10.1 Acceso y operaciones seleccionadas

La key ya está disponible según lo confirmado por el usuario. No hay que solicitar una nueva ni guardar su valor en este documento. Configurarla y verificar respuestas será parte de la implementación.

La documentación pública describe Nessie como una API de simulación bancaria. El explorador consultado muestra `https://prod-api.nessieisreal.com` como servidor y autenticación mediante parámetro `key`.

| Uso inicial | Operación documentada |
| --- | --- |
| Encontrar la cuenta del cliente ficticio | `GET /customers/{id}/accounts` |
| Leer la cuenta y saldo | `GET /accounts/{id}` |
| Leer depósitos | `GET /accounts/{id}/deposits` |
| Leer retiros | `GET /accounts/{id}/withdrawals` |
| Leer pagos puntuales y recurrentes | `GET /accounts/{id}/bills` |
| Incorporar un depósito de prueba al sandbox | `POST /accounts/{id}/deposits` |

Estas operaciones fueron verificadas en la documentación, no mediante una prueba autenticada del proyecto. [Documentación de Nessie](https://nessieisreal.com/docs).

### 10.2 Contrato de integración del MVP

- Usar un cliente ficticio y una cuenta de tipo Checking como base inicial.
- Mantener una única moneda de trabajo definida por Mirror; la etiqueta MXN del ejemplo no implica soporte monetario nativo confirmado de la API.
- Verificar estados, unidades monetarias, decimales, fechas, errores y relación entre movimientos y saldo antes de fijar el adaptador.
- Consultar solamente los recursos del negocio de demo; no depender de recursos Enterprise.
- No asumir endpoints de compras o transferencias a partir de ejemplos de versiones anteriores.
- Mantener referencias de origen para sincronizar nuevamente sin duplicar datos.
- Diferenciar una prueba documentada, una operación autenticada y una reproducción local.

La guía de inicio y el explorador han mostrado referencias de servidor diferentes. Confirmaremos cuál corresponde al entorno del evento durante la primera prueba; disponer de una key no demuestra por sí solo que una integración concreta ya funciona.

### 10.3 Actualización y respaldo

El MVP se actualizará mediante refresco explícito o consultas periódicas, según se verifique. No se ha confirmado un mecanismo de webhooks y no se prometerá transmisión instantánea de eventos.

Las simulaciones vivirán en Mirror. Solo el paso explícito de incorporar un movimiento del sandbox alterará datos bancarios ficticios; no se creará un depósito cada vez que el usuario explore un escenario.

Si la API no responde durante la presentación, la app podrá usar una reproducción local identificada. Eso no reemplaza el requisito de una demo funcional y nunca se presentará como conexión en vivo a Nessie.

Las claves se mantendrán del lado del servidor y se ocultarán también en registros de URLs, porque la autenticación documentada utiliza un parámetro de consulta.

## 11. Datos sintéticos y papel de la IA

### 11.1 Conjunto de datos para la demo

Prepararemos un conjunto reproducible con:

- Un negocio ficticio, su cuenta y una fecha de corte explícita.
- Historial sintético corto, por ejemplo 60 días, que incluya ingresos y gastos generales.
- Calendario futuro de 30 días con compromisos identificados.
- Un trabajo nuevo y las restricciones de sus dos alternativas.
- Variantes de prueba: atraso, anticipo parcial, gasto adicional, duplicado y dato faltante.

El historial se usará como contexto y para sugerir recurrencias revisables. Los eventos de prueba futuros no se filtrarán al motor como si fueran información conocida al momento del pronóstico.

Los saldos iniciales, movimientos, compromisos y resultados esperados deben ser coherentes entre sí. El ejemplo de la sección 8 será una prueba de referencia; la demo ampliada podrá incluir otros movimientos sin reutilizar sus resultados fijos.

No afirmaremos precisión predictiva real a partir de datos inventados. Los datos sintéticos permiten probar comportamiento y cálculos, no demostrar adopción o desempeño en empresas reales.

### 11.2 Función acotada de la IA

La IA podrá ayudar a estructurar una descripción, sugerir categorías y explicar resultados del motor. Toda interpretación que cambie importes, fechas o restricciones requerirá revisión.

El cálculo de saldos, reservas, anticipos y fechas no dependerá de texto generado. Las explicaciones deberán coincidir con el resultado estructurado.

Si la IA no está disponible, formularios y explicaciones basadas en reglas permitirán terminar el recorrido. Una arquitectura de múltiples agentes no es necesaria para el MVP.

## 12. Alcance del MVP y orden de construcción

### 12.1 Lo que sí construiremos

- App móvil conectada a un backend propio.
- Un negocio ficticio, una cuenta y una moneda de trabajo.
- Integración de lectura con Nessie y un movimiento de actualización controlado en su sandbox.
- Calendario diario de 30 días, gastos generales básicos y reserva objetivo.
- Captura guiada de un nuevo trabajo.
- Cálculo de anticipo y pago escalonado dentro de límites explícitos.
- Registro de fichas, condiciones pendientes y vigencia.
- Reevaluación por retraso de cobro y por una segunda decisión.
- Explicación trazable, datos insuficientes y alternativa no factible.
- Pruebas y demo reproducible.

### 12.2 Lo que queda fuera

Pagos reales, custodia, créditos nuevos, factoring, scoring crediticio, integración con bancos reales, negociación automática, ERP, nómina completa, inventario, múltiples monedas, carga de documentos reales, roles empresariales complejos y notificaciones push.

La simulación de financiación existente, la importación contable, los sobrecostos avanzados y la predicción por cliente se tratarán como evolución. No deberán desplazar los cuatro objetivos principales.

### 12.3 Orden de construcción propuesto

1. Validar Nessie y la coherencia del conjunto de datos.
2. Construir el motor y comprobar los ejemplos financieros.
3. Exponer el recorrido en el backend y conectarlo con la app.
4. Implementar conciliación, registro de decisiones y reevaluación.
5. Probar errores y preparar evidencia, presentación y entrega pública.

Este orden no inicia trabajo automáticamente. La distribución de las 36 horas se ajustará al equipo y a las reglas del evento. La explicación con IA y el acabado visual adicional se priorizarán después del recorrido funcional.

## 13. Demo y criterios de aceptación

### 13.1 Secuencia de presentación

1. Presentar a Ana y el calendario de su negocio ficticio.
2. Mostrar saldo, próximos pagos, gastos generales y reserva.
3. Incorporar el nuevo trabajo y revelar el faltante antes del cobro.
4. Calcular y comparar anticipo y pago escalonado.
5. Registrar un plan sin ocultar sus condiciones.
6. Recibir y conciliar un depósito del sandbox.
7. Evaluar una segunda decisión con el primer compromiso ya incluido.
8. Cambiar una fecha y mostrar que la ficha anterior necesita revisión.

Para mostrar que el cálculo es dinámico, cambiaremos al menos un importe o fecha durante la demo. Las respuestas no serán textos fijos asociados a un guion.

### 13.2 Pruebas necesarias

| Caso | Comportamiento esperado |
| --- | --- |
| Ejemplo sin anticipo | Saldo mínimo -$20,000 y brecha de protección $30,000. |
| Anticipo de $30,000 | Saldo mínimo $10,000; ingreso total del trabajo sin cambios. |
| Anticipo máximo de $20,000 sin negociación de proveedor | Saldo mínimo $0; colchón insuficiente. |
| Pago escalonado de $10,000 y $30,000 | Conserva el colchón si se cumplen las condiciones del ejemplo. |
| Depósito parcial o repetido | Reduce el pendiente una sola vez; no duplica el ingreso. |
| Movimiento ya incluido en el saldo de corte | No se vuelve a sumar al pronóstico. |
| Cobro retrasado o pendiente | No se trata como dinero confirmado. |
| Pago cancelado o recurrente | Se interpreta su estado y se expande el calendario sin duplicaciones. |
| Dos decisiones sobre una misma versión | La segunda se recalcula contra los compromisos registrados. |
| Restricción no negociable | No se mueve para hacer que el plan aparente funcionar. |
| Dato crítico faltante | El resultado indica que no puede evaluarse. |
| Efecto relevante después del día 30 | Se advierte el límite; no se afirma viabilidad integral. |
| API no disponible o información antigua | Se muestra error, antigüedad y origen del respaldo si se utiliza. |
| IA no disponible | El recorrido principal sigue funcionando. |
| Acceso a otra sesión o negocio | El backend rechaza el acceso no permitido. |

La conciliación de una transferencia entre cuentas propias, si aparece en datos de prueba o versiones posteriores, no deberá crear ingreso operativo. Los préstamos tampoco se clasificarán como ventas.

El prototipo estará listo para presentar cuando el recorrido móvil funcione con cálculos del backend, las pruebas críticas estén verificadas y el origen de los datos sea visible.

## 14. Modelo de negocio, mercado y adopción

Esta sección contiene una propuesta comercial para investigar. No declara clientes, acuerdos, ingresos ni disposición de pago que todavía no existen.

### 14.1 Comprador y propuesta comercial

El usuario y comprador inicial propuesto es el dueño o responsable administrativo del negocio. Un despacho contable puede recomendar la herramienta y acompañar la preparación de datos.

El modelo propuesto es **suscripción por negocio**, para consultar liquidez, evaluar trabajos y seguir compromisos. El precio sigue pendiente de validación y no se vinculará al monto de un préstamo ni al número de alertas generadas.

El valor que deberemos comprobar es que el usuario toma una decisión con menos tiempo de preparación, entiende sus condiciones y evita compromisos incompatibles dentro de la información disponible. No prometeremos ahorros o crisis evitadas sin medirlos.

Los costos a estimar son infraestructura, almacenamiento, consultas a servicios externos, uso opcional de IA, soporte e incorporación de usuarios. La viabilidad económica exige que el ingreso por negocio cubra estos costos; todavía no contamos con mediciones de producción.

Como evolución podría evaluarse una licencia o integración con un proveedor bancario. No asumimos que Capital One será cliente, socio o distribuidor.

### 14.2 Evidencia y dimensionamiento

La encuesta estadounidense Small Business Credit Survey, publicada en su informe de 2026, identifica gastos operativos y expansión entre los motivos de buscar financiación. Es contexto sobre la necesidad, no validación de nuestro nicho mexicano ni evidencia de compra de Mirror. [Informe de los Federal Reserve Banks](https://www.fedsmallbusiness.org/reports/survey/2026/2026-report-on-employer-firms).

Para una posible entrada por limpieza en México, Data México mostraba, en la consulta del 12 de septiembre de 2026, **2,362 unidades económicas en la rama 5617 y 179 en Nuevo León**, con referencia a DENUE mayo de 2026. La rama incluye más actividades que limpieza de oficinas y las unidades no equivalen necesariamente a empresas compradoras independientes. Estos conteos son un punto de partida, no nuestro TAM o SAM definitivo. [Fuente sectorial](https://www.economia.gob.mx/datamexico/es/profile/industry/cleaning-services).

| Nivel | Cómo lo delimitaremos | Evidencia pendiente |
| --- | --- | --- |
| TAM: mercado total elegible | Negocios del segmento definido y país elegido con el problema de cobros posteriores a pagos; multiplicados por un precio anual validado si se expresa en dinero. | Conteo depurado, definición de elegibilidad y disposición de pago. |
| SAM: mercado que podemos atender | Subconjunto compatible con la región, moneda, datos y funciones que soportemos inicialmente. | Filtrado por actividad, tamaño y capacidad de mantener los datos necesarios. |
| SOM: mercado obtenible | Clientes alcanzables a través de canales concretos, limitado por conversión, retención y capacidad de incorporación y soporte. | Prueba del canal, métricas y horizonte temporal explícito. |

No se multiplicarán todas las PyMEs de un país por un precio arbitrario ni se mezclarán establecimientos con empresas. Si presentamos estimaciones antes de validarlas, sus supuestos y limitaciones deberán aparecer junto a las cifras.

El país de una futura operación comercial sigue abierto. La demo en español y sus importes ilustrativos no implican disponibilidad de productos de Capital One para empresas mexicanas.

### 14.3 Estrategia de adopción propuesta

1. Preparar la demo sintética y comprobar comprensión del recorrido.
2. Después del hackathon, entrevistar dueños y contadores sobre decisiones recientes sin solicitar datos identificables innecesarios.
3. Validar un piloto acotado, por ejemplo de tres a cinco negocios, únicamente después de resolver permisos y condiciones de uso real.
4. Medir preparación de datos, tiempo para decidir, comprensión de las condiciones, uso repetido y disposición de pago.
5. Ampliar dentro de servicios B2B si el mismo problema y el valor del producto se repiten.

Los números del piloto son objetivos propuestos, no compromisos ni usuarios confirmados. Una prueba con datos sintéticos no demostrará retención comercial.

## 15. Viabilidad legal, seguridad y límites de uso

### 15.1 Alcance del hackathon

El prototipo utilizará datos generados para la demo, sin reutilizar expedientes reales ni presentar datos personales ajenos como ficticios.

No recibirá dinero del público, custodiará fondos, emitirá medios de pago, aprobará créditos, contratará financiación ni ejecutará movimientos bancarios reales. Las operaciones de Nessie serán exclusivamente del sandbox.

La app indicará que sus resultados son simulaciones condicionadas a datos y escenarios. Una ficha de decisión no será un certificado de solvencia, una garantía de pago ni asesoría fiscal.

Estos límites reducen riesgos, pero no constituyen un dictamen legal ni una exención automática de toda obligación.

### 15.2 Credenciales, repositorio y propiedad intelectual

- Guardar la key en configuración segura del backend, nunca dentro de la app.
- Excluir secretos, datos personales y URLs con credenciales del repositorio, historial y registros públicos.
- Separar los permisos de lectura de la demo de las operaciones de preparación o reinicio de datos.
- Evitar endpoints públicos sin control que permitan alterar indiscriminadamente el sandbox.
- Identificar licencias de dependencias y de cualquier material reutilizado.
- Utilizar nombre e identidad propios; Mirror es un nombre de trabajo, sin verificación de marca realizada.
- No presentar patrocinio, aprobación, integración de producción ni certificación de Capital One que no existan.

Los términos de Capital One no conceden automáticamente derechos sobre sus marcas y materiales. El enlace de términos de Nessie remite a condiciones de Capital One; no asumiremos que una referencia a MIT en documentación autoriza cualquier uso de la marca, la API o materiales externos. [Términos consultados](https://www.capitalone.com/digital/terms-conditions/).

El requisito de código público no implica que debamos publicar la key, el PDF del reto o adjuntos del organizador. Antes de subir esos materiales se confirmarán sus permisos; el repositorio deberá contener nuestro código y materiales que podamos compartir.

### 15.3 Antes de usar información real

Se requerirá revisar con asesoría competente el país de operación, los servicios ofrecidos, contratos con proveedores, protección de datos y posibles requisitos financieros.

En México, la LFPDPPP vigente regula el tratamiento de datos personales e incluye condiciones para datos financieros o patrimoniales. La introducción de información real exigiría evaluar las bases del tratamiento, aviso de privacidad, consentimiento cuando corresponda, seguridad, derechos y relaciones con proveedores. [Texto vigente](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf).

La CNBV identifica actividades reguladas como financiamiento colectivo y servicios de fondos de pago electrónico. Una evolución hacia funciones financieras reales requeriría revisar el perímetro aplicable; no asumiremos que basta con llamarlo software o poner un aviso. [Información de la CNBV](https://www.gob.mx/cnbv/acciones-y-programas/instituciones-de-tecnologia-financiera).

La seguridad básica y el aislamiento se demostrarán desde el prototipo. No afirmaremos cumplimiento normativo integral a partir de una demo.

## 16. Rúbrica y evidencia para el jurado

Los siguientes pesos corresponden a la tabla de la tercera página del PDF del reto. La columna de evidencia describe lo que debemos preparar, no entregables ya completados.

| Dimensión | Subcriterio | Peso | Evidencia propuesta |
| --- | --- | --- | --- |
| Originalidad | Diferenciación competitiva sustentada | 10% | Comparación del mismo caso con capacidades documentadas o probadas de otros productos. |
| Originalidad | Identificación de oportunidad de mercado | 10% | Persona específica y necesidad de decidir sobre trabajos cuyos pagos preceden a cobros. |
| Originalidad | Solución no trivial | 10% | Planificación inversa, restricciones, condiciones y decisiones relacionadas. |
| Profundidad técnica | Fundamento de datos | 6% | Datos sintéticos coherentes, origen visible, normalización y conciliación. |
| Profundidad técnica | Lógica algorítmica / inteligencia | 9% | Cálculo de importes y fechas, comprobación diaria y alternativa no factible. |
| Profundidad técnica | Diseño del sistema | 5% | Separación app/backend/Nessie, protección de claves y versionado de resultados. |
| Profundidad técnica | Calidad y demo funcional | 5% | Pruebas, recorrido móvil y manejo visible de errores o respaldo. |
| Impacto y viabilidad | Modelo de negocio sustentado | 10% | Comprador, propuesta de valor, costos, precio por validar y plan de evidencia. |
| Impacto y viabilidad | Tamaño de mercado: TAM/SAM/SOM | 5% | Mercado delimitado, fuentes, depuración y supuestos explícitos. |
| Impacto y viabilidad | Viabilidad regulatoria y operativa | 5% | Alcance sintético, límites de servicio, licencias y ruta de validación para operación real. |
| Impacto y viabilidad | Estrategia de adopción | 5% | Canal inicial mediante contadores, piloto propuesto y métricas. |
| Diseño y experiencia | Persona específica | 7% | Ana, sus responsabilidades y la decisión que necesita resolver. |
| Diseño y experiencia | Recorrido del usuario estructurado | 7% | Preparación, diagnóstico, comparación, registro y reevaluación. |
| Diseño y experiencia | Pitch | 6% | Problema comprensible, resultado verificable, diferenciación y alcance honesto. |

Totales: **originalidad 30%, profundidad técnica 25%, impacto y viabilidad 25%, diseño y experiencia 20%**.

La rúbrica requiere sustento. Una hipótesis escrita no equivale a validación comercial y una función descrita no equivale a una demo funcional. Mercado, precio y comparación competitiva seguirán siendo tareas de evidencia aunque el código funcione.

## 17. Riesgos y decisiones de contención

| Riesgo | Cómo lo abordaremos |
| --- | --- |
| Información incompleta o desactualizada | Confirmación de datos relevantes, fecha visible y resultado no evaluable cuando corresponda. |
| Confundir caja, margen y utilidad | Métricas separadas y explicación del alcance de cada una. |
| Recomendar un acuerdo imposible | Límites capturados, condiciones pendientes y opción de no encontrar plan. |
| Duplicar cobros o comprometer dos veces el dinero | Referencias de origen, conciliación y revisión de versión antes de registrar. |
| Interpretar una reserva virtual como dinero bloqueado | Etiquetado como planeación; ninguna promesa de custodia. |
| Ocultar un problema después del día 30 | Advertencia de horizonte y revisión complementaria antes de una conclusión integral. |
| Depender de una API o IA disponible permanentemente | Errores visibles, respaldo identificado y recorrido sin IA. |
| Sobrecargar el MVP | Un negocio, una cuenta, dos alternativas y un recorrido principal. |
| Exagerar originalidad, mercado o legalidad | Fuentes, distinción entre hechos e hipótesis y validaciones pendientes explícitas. |

## 18. Evolución, pendientes y mensaje del producto

### 18.1 Evolución posterior

Cuando el flujo principal esté validado, podremos incorporar importaciones contables, estimaciones de cobro por cliente, comparación pronóstico/resultado, sobrecostos, alertas móviles y más alternativas.

La evaluación de financiación ya disponible sería una extensión: deberá incorporar disponibilidad, intereses, comisiones y devolución. Si el repago queda fuera de los 30 días, hará falta ampliar la evaluación antes de afirmar que el plan resuelve el problema completo.

No se ampliará hacia crédito, fraude, inversiones o una réplica integral de la empresa por el solo hecho de que sean temas relacionados con finanzas.

### 18.2 Decisiones pendientes

- Elegir stack y plataforma móvil inicial.
- Configurar la key existente y validar el contrato técnico de Nessie.
- Definir precisión monetaria, fecha de corte y estados admitidos.
- Preparar el conjunto sintético y las pruebas de referencia.
- Confirmar con mentores reglas de entrega, materiales, código previo y uso de IA.
- Completar evidencia de diferenciación, mercado y modelo de negocio.
- Definir criterios de una eventual operación real, sin confundirlos con el alcance del hackathon.

La existencia de estos pendientes no cambia la dirección acordada: **app móvil + backend, datos sintéticos, Nessie y problemática 2**.

### 18.3 Mensaje propuesto para el pitch

> Una pequeña empresa puede aceptar un trabajo con margen y quedarse sin dinero antes de cobrarlo. Mirror conecta sus movimientos simulados con los próximos compromisos, proyecta 30 días y calcula las condiciones necesarias para aceptar ese trabajo: cuánto anticipo requiere, qué pagos podrían escalonarse y qué reserva debe conservar. Cada decisión explica sus supuestos y se revisa cuando cambian los datos. La demo muestra el faltante, compara dos alternativas y actualiza el plan al recibir un movimiento de Nessie.

Este mensaje describe el producto que vamos a construir. Hasta comprobar el recorrido, no se presentará como una función ya implementada.

## Documento rector y fuentes

El [Capital One Challenge HackMTY 2026](</Users/kevinsalazar/Documents/Ideas/Capital One/Capital One Challenge HackMTY 2026.pdf>) es la referencia para el alcance del reto y sus criterios. Las fuentes externas están vinculadas junto a las afirmaciones que sustentan.

Este archivo contiene la definición actual del producto y no depende de las carpetas de investigación retiradas durante la limpieza. Esta revisión se limita a la documentación; no modifica otros archivos ni implementa la aplicación.

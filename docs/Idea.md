# Colchón — Motor de Liquidez Predictiva para PyMEs Mexicanas

**Reto:** Capital One Challenge Track — Autonomous Financial Intelligence & Resilience
**Área de enfoque:** SMB Cash-Flow & Working Capital Intelligence (B2B)
**Equipo:** 4 personas — Hackathon de 36 horas

---

## Resumen ejecutivo

Colchón es un copiloto de tesorería para pequeñas empresas mexicanas que conecta sus facturas electrónicas (CFDI) y su cuenta bancaria para proyectar el saldo de caja día por día durante los próximos 30 días, detectar con anticipación el momento exacto en que la empresa se quedará sin liquidez, y recomendar una acción concreta — cuánto reservar, cuándo, o qué factura cobrar antes — para evitarlo.

El problema que ataca es el asesino silencioso de las PyMEs mexicanas: no la falta de ventas, sino la mala gestión del flujo de efectivo. La mitad de los negocios en México muere antes de cumplir dos años, y la causa dominante es el desfase entre cobros y pagos, no la falta de rentabilidad. Colchón convierte datos que la PyME ya genera (facturas CFDI, movimientos bancarios) en una alerta temprana y una recomendación accionable, algo que hoy nadie ofrece de forma simple y predictiva para la pequeña empresa sin tesorero dedicado.

---

## 1. El problema

### 1.1 Contexto: el peso y la fragilidad de las PyMEs en México

- México tiene 5,468,180 unidades económicas (INEGI, Censos Económicos 2024). De ellas, ~243,936 son pequeñas (204,814) y medianas (39,122) empresas formales de 11 a 250 empleados — el segmento núcleo al que se dirige el producto.
- Las MIPyMEs generan aproximadamente 52% del PIB de México y 70.7% del empleo formal.
- El 64.3% del universo empresarial mexicano es informal (INEGI CE 2024), lo que limita el mercado direccionable a la porción formal y bancarizada.

### 1.2 El dolor específico: liquidez, no ventas

- El 65% de las PyMEs mexicanas reportó problemas de liquidez en el último año (ENAPROCE).
- De cada 100 negocios que nacen en México, casi 52 mueren antes de cumplir 2 años (INEGI, Estudio sobre la Demografía de los Negocios). La esperanza de vida promedio de un negocio mexicano al nacer es de 8.4 años.
- La causa raíz repetida en la literatura no es la falta de ventas, sino la mala gestión del flujo de efectivo: las empresas cobran a 30-90 días mientras deben pagar nómina cada quincena, renta y proveedores de forma más inmediata.
- Más del 60% de los emprendedores no lleva un control financiero adecuado (CONDUSEF).

### 1.3 El dolor secundario: acceso a crédito limitado y caro

- Solo 26.5% de las empresas en México accede a crédito bancario formal (Banxico, 4T2025); entre negocios de hasta 100 empleados, apenas 24.8%.
- El crédito de proveedores es la fuente de financiamiento más usada (62%), casi el triple que el crédito bancario en el estrato PyME — una señal de que las empresas resuelven sus huecos de liquidez de forma informal e ineficiente.
- El 84% del crédito que sí reciben las PyMEs se destina a capital de trabajo, confirmando que la necesidad dominante es de liquidez operativa, no de inversión de largo plazo.
- Cuando se rechaza una solicitud de crédito, las razones más comunes son garantías insuficientes (21.6%) y falta de historial crediticio (18.4%) — problemas que un historial de flujo de caja bien documentado podría mitigar.

**Conclusión del problema:** existe una necesidad clara, medible y no resuelta: la pequeña empresa mexicana no tiene visibilidad hacia adelante de su propio flujo de caja, y cuando el problema aparece, ya es demasiado tarde para actuar.

---

## 2. La solución

### 2.1 Concepto central

Colchón ingiere tres fuentes de datos de una PyME:

1. **Saldo actual y movimientos bancarios** (vía la Nessie API en el prototipo del hackathon, sustituyendo la conexión bancaria real).
2. **Facturas emitidas (CFDI)** — cuentas por cobrar futuras con fecha de vencimiento conocida.
3. **Facturas recibidas (CFDI)** — cuentas por pagar futuras con fecha de vencimiento conocida.

Con esto, calcula una proyección diaria del saldo de caja para los próximos 30 días, identifica el primer día en que el saldo cruza por debajo de un umbral de seguridad, y genera una recomendación concreta: cuánto es el déficit proyectado, cuándo ocurre, y qué acción tomarlo evitaría (cobrar antes a un cliente específico, negociar un plazo con un proveedor, o reservar un monto determinado).

### 2.2 Por qué CFDI es el diferenciador

La facturación electrónica (CFDI) es obligatoria en México desde 2014. En 2023 se emitieron más de 10,323 millones de facturas electrónicas — un promedio de 327 por segundo — y México ocupa el segundo lugar mundial en generación de comprobantes fiscales digitales. Esto significa que cada PyME formal ya genera, como subproducto de cumplir con el SAT, un registro estructurado y fechado de sus cuentas por cobrar y pagar futuras.

Ningún competidor global (incluyendo productos de EE.UU. o Europa) tiene acceso nativo a esta fuente de datos, porque es una particularidad del sistema fiscal mexicano. Usar CFDI como insumo principal del pronóstico —en lugar de depender solo de datos bancarios históricos, que son ruidosos y no anticipan compromisos futuros— es más preciso, más defendible técnicamente, y es una ventaja de datos que solo existe en este mercado.

### 2.3 Por qué esto y no solo un dashboard de flujo de caja genérico

Herramientas de flujo de caja genéricas ya existen (hojas de cálculo, algunos SaaS internacionales), pero:
- No usan CFDI, por lo que dependen de que el usuario capture manualmente sus cuentas por cobrar/pagar, algo que la pequeña empresa mexicana rara vez hace de forma consistente.
- No traducen el pronóstico en una recomendación accionable — muestran una gráfica, pero no dicen "haz esto".
- Los competidores fintech mexicanos que sí usan IA para flujo de caja (ver sección 9) están enfocados en negocios medianos/grandes con volumen suficiente para justificar un ejecutivo de cuenta, dejando desatendida a la pequeña empresa de 11-50 empleados sin tesorero.

---

## 3. Usuario objetivo (persona)

**Perfil:** dueño o dueña de una pequeña empresa formal mexicana (11-50 empleados), en sectores como comercio, manufactura ligera o servicios profesionales.

- Ya emite y recibe CFDI porque es obligatorio.
- Ya tiene cuenta bancaria de negocio (93-97% de las pequeñas y medianas empresas mexicanas está bancarizada).
- No tiene un CFO ni tesorero dedicado — gestiona el flujo de caja él mismo, usualmente con una hoja de cálculo o "a ojo".
- Ha vivido o teme vivir un apretón de liquidez que pone en riesgo la nómina o el pago a proveedores.
- Usa software contable o un ERP básico (~85% de las PyMEs mexicanas lo hace), pero ese software registra el pasado, no proyecta el futuro.

---

## 4. Journey del usuario

1. **Conexión (una vez):** el usuario conecta su cuenta bancaria (via agregador tipo Belvo/Finerio/Syncfy en producción, via Nessie API en el prototipo) y autoriza el acceso a sus CFDI emitidos y recibidos (via un conector al buzón fiscal del SAT o carga de un lote de XMLs, simulado en el hackathon).
2. **Vista diaria:** el usuario abre el dashboard y ve una gráfica de su saldo de caja proyectado para los próximos 30 días.
3. **Alerta temprana:** si la proyección cruza el umbral de seguridad, aparece una alerta clara: fecha exacta del hueco de liquidez y monto del déficit.
4. **Recomendación accionable:** junto a la alerta, una recomendación concreta — por ejemplo, "tu cliente X debe $45,000 vencidos hace 12 días; cóbralo antes del 20 de octubre para evitar el hueco" o "necesitas una reserva de $30,000 disponible antes del 15 de octubre".
5. **Acción:** el usuario decide si actúa directamente (contacta al cliente, ajusta un pago) o si solicita financiamiento — aquí es donde, en una versión comercial, se conectaría con un socio de crédito (ver modelo de negocio).

---

## 5. Arquitectura técnica

```
┌─────────────────┐        ┌──────────────────┐
│   CFDI (SAT)     │        │    Nessie API     │
│ CxC y CxP futuras│        │Saldo y transacciones│
└────────┬─────────┘        └─────────┬─────────┘
         │                            │
         └───────────┬────────────────┘
                      ▼
          ┌───────────────────────────┐
          │  Ingesta y normalización   │
          │ Categoriza ingresos y gastos│
          └─────────────┬─────────────┘
                         ▼
          ┌───────────────────────────┐
          │    Motor de pronóstico     │
          │ Saldo proyectado a 30 días │
          └─────────────┬─────────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
   ┌───────────────────┐   ┌───────────────────┐
   │ Alerta de liquidez │   │   Recomendación    │
   │Fecha y monto del hueco│ │  Monto de reserva  │
   └──────────┬─────────┘   └─────────┬─────────┘
              └───────────┬───────────┘
                          ▼
               ┌────────────────────┐
               │   Dashboard PyME    │
               │Vista del dueño del negocio│
               └────────────────────┘
```

### 5.1 Fuentes de datos (MVP del hackathon)

- **Nessie API (Capital One):** se crea un customer simulado con historial de transacciones (nómina, renta, ventas, compras) para representar el comportamiento bancario de la PyME.
- **CFDI sintético:** dataset generado por el equipo con 20-30 facturas emitidas (cuentas por cobrar, con fecha de vencimiento y una probabilidad de pago tardío) y 15-20 facturas recibidas (cuentas por pagar). Esto sustituye una integración real con el SAT, inviable en 36 horas.

### 5.2 Motor de pronóstico

Lógica basada en reglas (no requiere machine learning para ser defendible ni preciso):

```
saldo_proyectado(día) = saldo_actual
                       + Σ(CxC con fecha de vencimiento ≤ día)
                       − Σ(CxP con fecha de vencimiento ≤ día)
                       − gastos_fijos_recurrentes(nómina, renta, servicios)
```

Si el tiempo lo permite, se puede añadir un ajuste sobre gastos variables usando un promedio móvil del histórico de transacciones de Nessie, para capturar gasto no fijo (insumos, variables por temporada).

### 5.3 Detección de hueco y generación de recomendación

Sobre la curva de 30 días, se identifica el primer punto donde el saldo proyectado cae por debajo de un umbral de seguridad (por ejemplo, 15% del gasto mensual promedio). A partir de ahí:
- Se calcula el monto exacto del déficit.
- Se identifica la factura por cobrar de mayor impacto que, si se cobrara antes de su vencimiento natural, cerraría o reduciría el hueco.
- Se genera una recomendación de reserva mínima si no existe una acción de cobranza suficiente.

### 5.4 Capa de presentación

Dashboard web simple: gráfica de línea de saldo proyectado a 30 días, marcador visual del día de hueco, tarjeta de alerta, tarjeta de recomendación.

---

## 6. Alcance del MVP — plan de construcción de 36 horas

| Bloque de tiempo | Entregable |
|---|---|
| 0–6h | Setup de Nessie API (customer, cuenta, transacciones simuladas) + generación del dataset sintético de CFDI (facturas emitidas y recibidas con fechas de vencimiento) |
| 6–16h | Motor de pronóstico: cálculo día por día del saldo proyectado con lógica basada en reglas; opcionalmente, ajuste de gasto variable con promedio móvil |
| 16–22h | Lógica de detección de hueco de liquidez (primer día bajo el umbral) y generación de recomendación accionable |
| 16–26h (en paralelo) | Construcción del dashboard: gráfica de 30 días, marcador de hueco, tarjetas de alerta y recomendación |
| 26–32h | Preparación de la narrativa y el pitch: apertura con la estadística de mortalidad de PyMEs por falta de flujo de caja, demo en vivo, cierre con diferenciación (CFDI) y modelo de negocio |
| 32–36h | Ensayo cronometrado del pitch (mínimo 2 veces), verificación de que la Nessie API responda en vivo, y grabación de un video de respaldo por si falla la conexión durante la demo |

**Métrica de éxito del prototipo:** error de pronóstico menor al 10% a 30 días sobre los datos de prueba generados.

---

## 7. Modelo de negocio

### 7.1 Estructura de monetización

- **Freemium:** el dashboard de pronóstico de 30 días es gratuito, para maximizar adopción y generar el hábito de conexión de datos (CFDI + banco).
- **Revenue share:** cuando el sistema recomienda una reserva de capital de trabajo o detecta una necesidad de crédito, se conecta al usuario con un socio de financiamiento (una SOFOM o fintech de crédito PyME ya establecida en México), generando una comisión por originación o revenue share sobre el crédito colocado.
- **Suscripción opcional (upsell):** funciones avanzadas (múltiples escenarios, recomendaciones de negociación con proveedores, export contable) a un ARPU estimado de US$300–1,200 al año.

### 7.2 Go-to-market

Capital One no opera como banco ni ofrece servicios financieros en México — mantiene únicamente un Hub de Tecnología/Innovación en CDMX enfocado en productos para su base de clientes en EE.UU., Canadá y Reino Unido. Esto define el GTM realista:

- **Opción A — Capacidad tecnológica exportable:** desarrollar Colchón como IP del Hub de CDMX, con el CFDI como caso de uso de innovación en datos alternativos, exportable a productos de Capital One para SMB en EE.UU. (adaptando la fuente de datos fiscales al contexto de cada mercado).
- **Opción B — Alianza / white-label:** licenciar el motor de pronóstico a un banco o fintech mexicana ya autorizada (SOFOM, banca tradicional) que sí pueda ofrecer el producto y el crédito asociado directamente al mercado mexicano.

No se propone que Capital One preste dinero directamente en México, ya que no es su modelo de negocio actual — este es un punto que fortalece la credibilidad del pitch frente a lo que sí podría hacerse.

---

## 8. Tamaño de mercado (TAM / SAM / SOM)

- **TAM:** ~243,936 pequeñas y medianas empresas formales en México (INEGI, Censos Económicos 2024).
- **Habilitador:** 93-97% de estas empresas ya está bancarizada (ENAFIN/CNBV), y ~85% usa algún software contable — la infraestructura digital para conectar el producto ya existe en el segmento objetivo.
- **SAM (estimación propia):** ~207,000 empresas (85% del TAM, las que ya usan software contable) — a un ARPU hipotético de US$300–1,200/año, el SAM se estima entre US$60 y 250 millones anuales.
- **SOM:** competidores comparables como Kapital (300,000 clientes multipaís) y Konfío (80,000-100,000 clientes) muestran que capturar 2-5% del SAM en 3 años es un objetivo agresivo pero alcanzable para un entrante con la marca y capacidad de datos de Capital One.

*Nota: estas cifras de SAM/SOM son una construcción propia a partir de datos oficiales de conteo empresarial y bancarización, más supuestos razonables de ARPU — no existe un estudio público que dimensione específicamente este nicho en México.*

---

## 9. Panorama competitivo

| Competidor | Enfoque | Vacío que deja |
|---|---|---|
| **Kapital** | Neobanco con IA que predice flujo de caja e integra crédito, nómina y factoraje; unicornio (US$1,300M valuación, Serie C de US$86M) | Enfocado en empresas con mayor volumen; no está optimizado para la pequeña empresa sin tesorero |
| **Konfío** | Crédito PyME sin garantías basado en scoring alternativo; ~80,000-100,000 clientes; en proceso de solicitar licencia bancaria | Fuerte en originación de crédito, pero no en pronóstico predictivo proactivo de liquidez |
| **Clara** | Gestión de gasto corporativo, tarjetas y bill pay; unicornio (+US$1,000M) | Enfocado en control de gasto, no en pronóstico de flujo de caja hacia adelante |
| **Herramientas nicho (Fygr, Orama, TAVO, etc.)** | Proyección de flujo de caja | Pequeñas, genéricas, no usan CFDI ni están adaptadas al contexto fiscal mexicano |

**El vacío de mercado:** un motor predictivo de liquidez a 30 días, embebido y automático (no una hoja de cálculo que hay que llenar), que use CFDI como fuente primaria y esté diseñado para la pequeña empresa —no la mediana con tesorero— es el espacio que Colchón ocupa.

---

## 10. Consideraciones regulatorias

- La **Ley Fintech de México (2018)** obliga, en su Artículo 76, a establecer APIs estandarizadas para compartir datos abiertos, agregados y transaccionales.
- Solo los **datos abiertos** (ubicación de cajeros, sucursales, productos) están regulados y operativos desde 2021.
- Los **datos transaccionales** — los que permitirían agregar movimientos bancarios de múltiples bancos bajo un estándar regulado de open banking — siguen sin reglas publicadas por la CNBV, años después del plazo legal original.
- **Implicación de diseño:** el producto no debe depender de un estándar de open banking transaccional que aún no existe. La estrategia de datos se apoya en (a) CFDI, que es un dato fiscal ya estructurado y accesible con consentimiento del usuario, (b) agregadores de datos bancarios ya operando bajo consentimiento directo (Belvo, Finerio, Syncfy), y (c) datos de POS/pasarelas de pago. Si la CNBV publica las reglas transaccionales en el futuro, esto se convierte en una oportunidad de expansión, no en un requisito de partida.

---

## 11. Alineación con la rúbrica de evaluación

| Criterio | Peso | Cómo lo cubre Colchón |
|---|---|---|
| **Diferenciación competitiva** | 10% | Ningún competidor combina CFDI + pronóstico de 30 días + recomendación de reserva para la pequeña empresa |
| **Identificación de vacío de mercado** | 10% | CFDI como ventaja de dato único de México; ningún jugador global la usa así |
| **Solución no trivial** | 10% | El uso de CFDI (compromisos ya conocidos) hace el pronóstico más determinístico y defendible que un modelo basado solo en histórico bancario |
| **Data foundation** | 6% | Nessie API + dataset sintético de CFDI, combinación realista y demostrable en 36h |
| **Algorítmica / inteligencia** | 9% | Motor de reglas explicable, con posibilidad de extender a ajuste de series de tiempo |
| **System design** | 5% | Arquitectura de 4 capas clara: ingesta, pronóstico, detección/recomendación, presentación |
| **Calidad y demo funcional** | 5% | Prioridad de las 36h: que el flujo completo corra en vivo, no que el modelo sea sofisticado |
| **Modelo de negocio** | 10% | Freemium + revenue share con socio de crédito; ARPU estimado y ruta de monetización clara |
| **Tamaño de mercado (TAM/SAM/SOM)** | 5% | TAM ~244,000 empresas; SAM ~207,000; SOM realista basado en comparables (Kapital, Konfío) |
| **Viabilidad regulatoria y operativa** | 5% | Estrategia de datos que evita depender de open banking transaccional no regulado |
| **Estrategia de adopción (GTM)** | 5% | GTM realista dado que Capital One no opera como banco en México: exportable o white-label, no préstamo directo |
| **Persona específica** | 7% | Dueño de pequeña empresa formal, bancarizado, sin tesorero, gestiona flujo de caja manualmente |
| **Journey map estructurado** | 7% | 5 pasos: conexión → vista diaria → alerta → recomendación → acción |
| **Pitch** | 6% | Apertura con estadística de mortalidad de PyMEs por falta de flujo de caja; demo en vivo; cierre con diferenciación y modelo de negocio |

---

## 12. Narrativa sugerida para el pitch (3-5 minutos)

1. **Gancho (30 seg):** "La mitad de los negocios mexicanos muere antes de cumplir dos años. No por falta de ventas — por falta de efectivo el día que hay que pagar la nómina."
2. **Problema (45 seg):** desfase entre cobros y pagos, falta de visibilidad hacia adelante, dependencia de crédito informal de proveedores.
3. **Solución (60 seg):** demo en vivo del dashboard — conexión simulada, proyección de 30 días, alerta de hueco, recomendación accionable.
4. **Por qué nosotros / por qué ahora (45 seg):** CFDI como ventaja de dato único de México; ningún competidor lo usa así; Capital One aporta la capacidad de modelado de datos y crédito.
5. **Modelo de negocio y mercado (45 seg):** freemium + revenue share; TAM/SAM/SOM; ruta de GTM realista dado el modelo actual de Capital One en México.
6. **Cierre (15 seg):** llamada a la acción / visión a futuro del producto.

---

## 13. Riesgos y limitaciones

- **Dependencia de acceso a CFDI:** en producción, requiere que el usuario autorice el acceso a su buzón fiscal del SAT o cargue sus XMLs; la fricción de este paso de onboarding no está resuelta en el MVP del hackathon.
- **Datos sintéticos:** el prototipo usa datos simulados (Nessie + CFDI generado), por lo que la precisión real del modelo sobre datos reales de PyMEs mexicanas no está validada.
- **Riesgo regulatorio:** si la CNBV publica reglas de open banking transaccional con requisitos distintos a los agregadores actuales, la arquitectura de datos podría necesitar ajustes.
- **Modelo de negocio dependiente de un socio de crédito:** el revenue share requiere una alianza con una entidad autorizada para prestar en México, ya que Capital One no lo hace directamente — esto añade una dependencia externa al modelo de monetización.
- **Cifras de mercado:** las estimaciones de SAM/SOM son una construcción propia y deben presentarse como tal ante el jurado, no como datos de una fuente única y verificada.

---

## 14. Fuentes principales

- INEGI, Censos Económicos 2024 (resultados definitivos, julio 2025)
- INEGI, Estudio sobre la Demografía de los Negocios (EDN) 2023
- Banxico, "Evolución del Financiamiento a las Empresas" (4T2025, febrero 2026)
- CNBV/INEGI, Encuesta Nacional de Financiamiento de las Empresas (ENAFIN) 2024
- SAT, Comunicado 18-2024 sobre facturación electrónica
- Finnovista, Radar Fintech México 2025/2026
- CONCANACO-SERVYTUR, "Economía formal e informal en cifras: México 2025"
- IFC, MSME Finance Factsheet 2024
- Reportes de prensa: Expansión, El Financiero, El Economista, TechCrunch, LatamFintech

# Colchón: proteger la nómina de tu obra

Usuario: dueño o responsable de caja de una constructora pequeña —o un
contratista/subcontratista— con una o varias obras activas, cobros por
estimaciones y poco tiempo para modelar escenarios.

Problema concreto: los materiales y la nómina de la cuadrilla salen antes de
que el cliente pague la estimación. Un retraso de una o dos semanas puede dejar
la cuenta sin margen justo antes del pago de nómina.

Una decisión: ¿qué debo revisar hoy para que un atraso de una estimación no
ponga en riesgo la nómina de mi obra?

Flujo: detectar el primer riesgo → explicar qué estimación y pagos lo causan →
enviar un aviso al responsable de la pyme → comparar recomendaciones → guardar
un seguimiento → actualizar las fuentes y recalcular. El dueño contacta al
cliente o al proveedor; ninguna acción ejecuta dinero ni modifica
silenciosamente una factura.

## Aviso que recibe la pyme

Cuando la proyección cruza la reserva o cae en negativo, Colchón prepara un
correo para el responsable de caja. Incluye el día del posible faltante, el
monto, la nómina o pago que queda expuesto, el último día razonable para revisar
la situación y una recomendación concreta: confirmar una estimación, conversar
un anticipo parcial o negociar con un proveedor.

El correo no se envía al cliente y no intenta cobrar automáticamente. El dueño
decide qué hacer. Un acuerdo tampoco se cuenta como dinero recibido: solo una
entrada verificada en el banco cambia la caja real. En la demo, el botón abre un
borrador `mailto:` para que la persona lo apruebe; una integración de correo es
un siguiente paso de producción.

NestJS ejecuta el motor. La demo presenta instantáneas calculadas previamente con el mismo motor; una prueba verifica su equivalencia, sin ejecutar reglas de pronóstico en el navegador. Usa aritmética decimal; mueve un evento sin duplicarlo; mantiene nómina, impuestos y pagos protegidos en su fecha; cobra los costos declarados; evalúa cada día del horizonte. Ordena hasta tres alternativas por días críticos insolventes, faltante máximo de reserva, costo y número de acciones. Busca movimientos individuales y pares sobre hasta doce candidatos; no afirma un óptimo global ni probabilidad de éxito.

La unidad operativa es el centavo (MXN/USD). Al registrar cada evento, saldo inicial y gasto diario, se redondea una sola vez a dos decimales con ROUND_HALF_UP; se suman importes con Decimal y se serializan como strings. La reserva también se interpreta en centavos.

La reserva es un objetivo, no dinero nuevo. Un saldo positivo debajo de la reserva no equivale a incumplir nómina. “Acuerdo registrado” no equivale a “cobro recibido”. Las fechas y permisos de negociación los proporciona el usuario, no se inventan a partir del CFDI. No se convierte USD a MXN.

## Diseño

Paleta: lienzo mineral #F3F5F7, tinta #172B3A, superficie #FFFFFF, acción petróleo #145C63, riesgo #A7482F y guía azul #3D6EAC. Tipografía del sistema con números tabulares, títulos de tracking ligeramente negativo y texto operativo sin condensar. Navegación translúcida, superficies de datos opacas.

En lugar de repetir tarjetas de métricas equivalentes, la pieza central es la curva de caja con el hito de nómina; a su lado vive el plan seleccionado. Alineación izquierda, controles cerca de su consecuencia, contexto secundario bajo detalles. Interacciones con feedback inmediato; un spring sin rebote para la selección; movimiento reducido, teclado y tabla alternativa.

No incluye préstamos, transferencias automáticas, predicción entrenada ni conexión real al SAT. Nessie y CFDI sintético son fuentes de demostración. La herramienta apoya decisiones; no garantiza liquidez.

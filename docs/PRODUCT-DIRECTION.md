# Colchón: llegar a la nómina con un plan

Usuario: dueño o responsable de caja de una pyme con ventas a crédito, pagos recurrentes y poco tiempo para modelar escenarios.

Una decisión: ¿cómo cubro mis compromisos críticos durante los próximos 30 días sin descubrir demasiado tarde un faltante?

Flujo: detectar el primer riesgo → explicar qué cobros y pagos lo causan → comparar planes → guardar un plan → registrar contacto/acuerdo → actualizar las fuentes y recalcular. Ninguna acción ejecuta dinero ni modifica silenciosamente una factura.

NestJS ejecuta el motor. La demo presenta instantáneas calculadas previamente con el mismo motor; una prueba verifica su equivalencia, sin ejecutar reglas de pronóstico en el navegador. Usa aritmética decimal; mueve un evento sin duplicarlo; mantiene nómina, impuestos y pagos protegidos en su fecha; cobra los costos declarados; evalúa cada día del horizonte. Ordena hasta tres alternativas por días críticos insolventes, faltante máximo de reserva, costo y número de acciones. Busca movimientos individuales y pares sobre hasta doce candidatos; no afirma un óptimo global ni probabilidad de éxito.

La unidad operativa es el centavo (MXN/USD). Al registrar cada evento, saldo inicial y gasto diario, se redondea una sola vez a dos decimales con ROUND_HALF_UP; se suman importes con Decimal y se serializan como strings. La reserva también se interpreta en centavos.

La reserva es un objetivo, no dinero nuevo. Un saldo positivo debajo de la reserva no equivale a incumplir nómina. “Acuerdo registrado” no equivale a “cobro recibido”. Las fechas y permisos de negociación los proporciona el usuario, no se inventan a partir del CFDI. No se convierte USD a MXN.

## Diseño

Paleta: lienzo mineral #F3F5F7, tinta #172B3A, superficie #FFFFFF, acción petróleo #145C63, riesgo #A7482F y guía azul #3D6EAC. Tipografía del sistema con números tabulares, títulos de tracking ligeramente negativo y texto operativo sin condensar. Navegación translúcida, superficies de datos opacas.

En lugar de repetir tarjetas de métricas equivalentes, la pieza central es la curva de caja con el hito de nómina; a su lado vive el plan seleccionado. Alineación izquierda, controles cerca de su consecuencia, contexto secundario bajo detalles. Interacciones con feedback inmediato; un spring sin rebote para la selección; movimiento reducido, teclado y tabla alternativa.

No incluye préstamos, transferencias automáticas, predicción entrenada ni conexión real al SAT. Nessie y CFDI sintético son fuentes de demostración. La herramienta apoya decisiones; no garantiza liquidez.

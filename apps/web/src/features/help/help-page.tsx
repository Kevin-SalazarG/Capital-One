"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/workspace/workspace";

const QUESTIONS = [
  [
    "¿Qué muestra la proyección?",
    "Una estimación de tu caja durante los próximos 30 días a partir de las cuentas, facturas y compromisos disponibles. No es una garantía de resultados.",
  ],
  [
    "¿Qué significa la reserva de seguridad?",
    "Es la referencia mínima configurada para tu empresa. Si el saldo proyectado queda por debajo, el resumen muestra la fecha y el faltante estimado.",
  ],
  [
    "¿Dar seguimiento mueve dinero?",
    "No. Dar seguimiento, completar o descartar una recomendación solo registra tu decisión. No hace cobros, pagos ni cambios en tus facturas.",
  ],
  [
    "¿Cuándo se actualizan mis datos?",
    "Banco permite sincronizar tus cuentas y movimientos. Después de importar facturas, sincronizar o cambiar tu reserva, usa Actualizar proyección en el resumen.",
  ],
  [
    "¿Puedo conectar mi banco o el SAT?",
    "Esta versión usa Nessie, un entorno bancario de prueba, y permite importar CFDI XML o lotes JSON. No conecta cuentas bancarias reales ni el SAT directamente.",
  ],
  [
    "¿Por qué falta una opción?",
    "Las opciones dependen de tus permisos. Tu administrador puede revisar el acceso desde Configuración → Equipo.",
  ],
  [
    "¿Qué hago si una conexión falla?",
    "Revisa el identificador del cliente en Conexiones y vuelve a sincronizar. Si falla de nuevo, conserva la referencia de soporte que muestra el error.",
  ],
];
export function HelpPage() {
  const { basePath } = useWorkspace();
  return (
    <div className="page-container">
      <PageHeader
        title="Tu caja, con claridad."
        description="Lo esencial para entender tu proyección y mantenerla al día."
      />
      <div className="max-w-3xl">
        <section className="mb-8 flex flex-col gap-5 rounded-xl bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">¿Acabas de empezar?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conecta tus datos paso a paso.
            </p>
          </div>
          <Button asChild>
            <Link href={`${basePath}/onboarding`}>
              Primeros pasos
              <ArrowRight />
            </Link>
          </Button>
        </section>
        <section aria-label="Preguntas frecuentes" className="panel divide-y">
          {QUESTIONS.map(([question, answer]) => (
            <details key={question} className="group px-5 md:px-6">
              <summary className="cursor-pointer py-5 text-sm font-semibold">
                {question}
              </summary>
              <p className="max-w-prose pb-5 text-sm leading-relaxed text-muted-foreground">
                {answer}
              </p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}

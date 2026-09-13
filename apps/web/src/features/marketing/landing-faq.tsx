"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

const questions = [
  {
    question: "¿Colchón mueve mi dinero?",
    answer:
      "No. Colchón consulta el saldo y los movimientos que conectas, prepara una proyección y te ayuda a decidir. No ejecuta transferencias, no cobra automáticamente y no modifica facturas.",
  },
  {
    question: "¿Qué información entra al plan de caja?",
    answer:
      "El sistema cruza tu cuenta de operación, movimientos bancarios, CFDI emitidos y recibidos, estimaciones, materiales, nómina, impuestos y otros pagos que registres como compromisos.",
  },
  {
    question: "¿Un acuerdo con un cliente cuenta como cobro?",
    answer:
      "No. Un acuerdo solo es una recomendación o un seguimiento. La caja cambia cuando el cobro aparece como entrada verificada en el banco.",
  },
  {
    question: "¿Qué hace Colchón cuando encuentra un hueco?",
    answer:
      "Marca el primer día de presión, explica qué evento lo provoca y compara hasta tres alternativas modeladas. También puede preparar un borrador de aviso para que tú lo revises; la conversación siempre la lleva la persona responsable de la obra.",
  },
] as const;

export function LandingFaq() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="landing-faq-section"
      id="preguntas"
      aria-labelledby="faq-title"
    >
      <div className="landing-container landing-faq-grid">
        <motion.div
          className="landing-faq-intro"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.16 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="landing-section-label">Sin letras pequeñas</p>
          <h2 id="faq-title">
            Lo que Colchón hace.
            <br />
            <em>Y lo que no.</em>
          </h2>
          <p>
            La herramienta está para darte tiempo y contexto, no para tomar
            decisiones financieras por ti.
          </p>
        </motion.div>
        <motion.div
          className="landing-faq-list"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.16 }}
          transition={{
            duration: 0.6,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {questions.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

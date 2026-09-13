"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const plans = [
  {
    id: "explora",
    eyebrow: "Freemium",
    name: "Explora",
    price: "$0 MXN",
    priceNote: "para empezar",
    description:
      "Para entender la caja de una obra antes de abrir otra hoja de cálculo.",
    features: [
      "Plan de caja a 30 días",
      "Saldo, reserva y brecha de caja",
      "Escenario de demostración con datos sintéticos",
    ],
    cta: "Abrir la demo",
    href: "/demo/dashboard",
    tone: "light",
    featured: false,
    tag: null,
  },
  {
    id: "obra",
    eyebrow: "Plan operativo",
    name: "Obra",
    price: "$300 MXN",
    priceNote: "por obra / mes",
    description:
      "Para operar una constructora con el contexto que ya vive en tu banco y tus CFDI.",
    features: [
      "Banco y movimientos de la cuenta de operación",
      "CFDI emitidos y recibidos",
      "Compromisos protegidos: nómina, impuestos y renta",
      "Recomendaciones y seguimiento de decisiones",
    ],
    cta: "Crear mi cuenta",
    href: "/auth/sign-up",
    tone: "accent",
    featured: true,
    tag: "Más elegido",
  },
  {
    id: "equipo",
    eyebrow: "Funciones avanzadas",
    name: "Equipo",
    price: "Desde $900 MXN",
    priceNote: "por equipo / mes",
    description:
      "Para llevar más de una obra y convertir el plan de caja en una rutina de equipo.",
    features: [
      "Múltiples escenarios por obra",
      "Recomendaciones avanzadas con proveedores",
      "Exportación para tu operación contable",
      "Alcance comercial en definición",
    ],
    cta: "Conocer el plan",
    href: "#contacto",
    tone: "dark",
    featured: false,
    tag: "En diseño",
  },
] as const;

export function PricingPlans() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="landing-pricing-section"
      id="planes"
      aria-labelledby="pricing-title"
    >
      <div className="landing-container">
        <motion.div
          className="landing-pricing-intro"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.16 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="landing-section-label">Planes de Colchón</p>
            <h2 id="pricing-title">
              Empieza con claridad.
              <br />
              <em>Crece cuando tu obra lo pida.</em>
            </h2>
          </div>
          <p>
            El dashboard de pronóstico de 30 días es nuestro punto de entrada.
            Las funciones avanzadas se activan alrededor de la forma en que
            realmente operas tu caja.
          </p>
        </motion.div>

        <div className="landing-pricing-grid">
          {plans.map((plan, index) => {
            return (
              <motion.article
                key={plan.id}
                className={`landing-pricing-card landing-pricing-card-${plan.tone}`}
                data-featured={plan.featured ? "true" : undefined}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                whileHover={reducedMotion ? undefined : { y: -5 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="landing-pricing-selector">
                  <span className="landing-pricing-card-topline">
                    <span>{plan.eyebrow}</span>
                    {plan.tag ? (
                      <span className="landing-pricing-tag">{plan.tag}</span>
                    ) : plan.featured ? (
                      <Sparkles aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="landing-pricing-name">{plan.name}</span>
                  <span className="landing-pricing-price">{plan.price}</span>
                  <span className="landing-pricing-price-note">
                    {plan.priceNote}
                  </span>
                  <span className="landing-pricing-description">
                    {plan.description}
                  </span>
                  <span className="landing-pricing-features">
                    {plan.features.map((feature) => (
                      <span key={feature}>
                        <Check aria-hidden="true" /> {feature}
                      </span>
                    ))}
                  </span>
                </div>
                <Link href={plan.href} className="landing-pricing-cta">
                  {plan.cta} <ArrowRight aria-hidden="true" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

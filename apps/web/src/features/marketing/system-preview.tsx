"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";

const modules = [
  {
    id: "cash",
    label: "Plan de caja",
    shortLabel: "Caja",
    icon: ChartNoAxesCombined,
    eyebrow: "El resumen que orienta la decisión",
    title: "La curva junta saldo, reserva y fechas críticas.",
    description:
      "Ve el primer día de presión y entiende qué evento lo provoca antes de que llegue.",
    points: [
      "Saldo actual y reserva",
      "Primer cruce de caja",
      "Recomendación modelada",
    ],
    screenshot: "/marketing/colchon-dashboard.png",
    screenshotAlt:
      "Captura real del plan de caja de Colchón con el saldo, la reserva y el primer punto de presión",
    route: "/demo/dashboard",
    routeLabel: "Abrir plan de caja",
  },
  {
    id: "protected",
    label: "Pagos protegidos",
    shortLabel: "Pagos",
    icon: ShieldCheck,
    eyebrow: "Lo que no se mueve",
    title: "La nómina y tus obligaciones conservan su fecha.",
    description:
      "Separa lo que debe pagarse de lo que sí puedes reordenar cuando modelas una alternativa.",
    points: ["Nómina de la obra", "Impuestos y renta", "Fechas protegidas"],
    screenshot: "/marketing/colchon-commitments.png",
    screenshotAlt:
      "Captura real de pagos protegidos de Colchón con nómina, impuestos y renta",
    route: "/demo/commitments",
    routeLabel: "Revisar pagos protegidos",
  },
  {
    id: "cfdi",
    label: "Facturas",
    shortLabel: "CFDI",
    icon: FileText,
    eyebrow: "Avances, materiales y pagos",
    title: "Cada CFDI explica una entrada o una salida futura.",
    description:
      "Cruza facturas emitidas y recibidas con tus estimaciones para darle contexto a la curva.",
    points: ["Por cobrar", "Por pagar", "Vencimientos conocidos"],
    screenshot: "/marketing/colchon-invoices.png",
    screenshotAlt:
      "Captura real de facturas de Colchón con estimaciones por cobrar y materiales por pagar",
    route: "/demo/invoices",
    routeLabel: "Ver facturas",
  },
  {
    id: "bank",
    label: "Banco",
    shortLabel: "Banco",
    icon: Landmark,
    eyebrow: "La cuenta de operación",
    title: "El saldo real es el punto de partida del plan.",
    description:
      "Parte de los movimientos de tu cuenta para que la proyección no empiece en una hoja vacía.",
    points: ["Saldo en MXN", "Entradas y salidas", "Corte actualizado"],
    screenshot: "/marketing/colchon-bank.png",
    screenshotAlt:
      "Captura real del banco de Colchón con la cuenta de operación y sus movimientos",
    route: "/demo/bank",
    routeLabel: "Ver movimientos",
  },
] as const;

type ModuleId = (typeof modules)[number]["id"];

function SectionReveal({
  children,
  className,
  delay = 0,
  reducedMotion,
  hoverY,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  reducedMotion: boolean | null;
  hoverY?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={hoverY && !reducedMotion ? { y: hoverY } : undefined}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function SystemPreview() {
  const reducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<ModuleId>("cash");
  const activeModule =
    modules.find((module) => module.id === activeId) ?? modules[0];
  const ActiveIcon = activeModule.icon;

  return (
    <section
      className="landing-system-section"
      id="producto"
      aria-labelledby="system-preview-title"
    >
      <div className="landing-container">
        <SectionReveal
          reducedMotion={reducedMotion}
          className="landing-system-intro"
        >
          <div>
            <p className="landing-section-label">Así vive en tu sistema</p>
            <h2 id="system-preview-title">
              Tu caja, en una sola vista.
              <br />
              <em>La decisión, a tiempo.</em>
            </h2>
          </div>
          <p>
            Explora las piezas que Colchón conecta para que una constructora
            pueda ver qué está pasando y qué conviene revisar. Selecciona un
            módulo para ver una captura viva de la demo.
          </p>
        </SectionReveal>

        <SectionReveal
          reducedMotion={reducedMotion}
          delay={0.08}
          className="landing-system-showcase"
        >
          <div
            className="landing-system-module-tabs"
            aria-label="Navegar módulos"
            role="tablist"
          >
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = module.id === activeId;
              return (
                <button
                  type="button"
                  key={module.id}
                  className={`landing-system-module-tab ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveId(module.id)}
                  onMouseEnter={() => setActiveId(module.id)}
                  onFocus={() => setActiveId(module.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="system-showcase-panel"
                >
                  <Icon aria-hidden="true" />
                  <span>{module.label}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={activeModule.id}
            id="system-showcase-panel"
            role="tabpanel"
            aria-labelledby="system-showcase-panel-title"
            className="landing-system-showcase-card"
            initial={reducedMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={reducedMotion ? undefined : { y: -3 }}
            transition={{ type: "spring", bounce: 0, duration: 0.46 }}
          >
            <div className="landing-system-showcase-copy">
              <span className="landing-system-module-eyebrow">
                <ActiveIcon aria-hidden="true" /> {activeModule.eyebrow}
              </span>
              <h3 id="system-showcase-panel-title">{activeModule.title}</h3>
              <p>{activeModule.description}</p>
              <ul className="landing-system-showcase-list">
                {activeModule.points.map((point) => (
                  <li key={point}>
                    <Check aria-hidden="true" /> {point}
                  </li>
                ))}
              </ul>
              <Link
                href={activeModule.route}
                className="landing-system-showcase-link"
              >
                {activeModule.routeLabel} <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <figure className="landing-system-capture">
              <div className="landing-system-capture-bar">
                <span
                  className="landing-system-capture-dots"
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
                <span>captura real · colchón / Constructora Encino</span>
                <span>{activeModule.route}</span>
              </div>
              <div className="landing-system-capture-window">
                <Image
                  src={activeModule.screenshot}
                  alt={activeModule.screenshotAlt}
                  width={1440}
                  height={900}
                  sizes="(max-width: 820px) 100vw, 58vw"
                  priority={activeModule.id === "cash"}
                  className="landing-system-capture-image"
                />
              </div>
              <figcaption className="landing-system-capture-caption">
                <span>Vista real del producto</span>
                <span>Datos sintéticos de demo</span>
              </figcaption>
            </figure>
          </motion.div>
        </SectionReveal>

        <motion.p
          className="landing-system-footnote"
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.5,
            delay: 0.16,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ShieldCheck aria-hidden="true" /> El sistema recomienda y prepara el
          seguimiento; no cobra, no transfiere y no altera un CFDI por su
          cuenta.
        </motion.p>
      </div>
    </section>
  );
}

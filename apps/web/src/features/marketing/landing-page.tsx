"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BanknoteArrowDown,
  Check,
  ChevronRight,
  FileCheck2,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Brand } from "@/components/brand";

type ScenarioId = "delay" | "base" | "early";

type Scenario = {
  id: ScenarioId;
  label: string;
  eyebrow: string;
  headline: string;
  tone: "risk" | "safe";
  balance: number;
  riskLabel: string;
  points: number[];
  dates: string[];
  riskIndex: number;
};

const scenarios: readonly [Scenario, Scenario, Scenario] = [
  {
    id: "delay",
    label: "Cobro se retrasa",
    eyebrow: "Hay tiempo para actuar",
    headline: "Revisa antes del 18 de septiembre",
    tone: "risk",
    balance: 47800,
    riskLabel: "Primer día bajo reserva",
    points: [156, 144, 121, 76, 48, 88, 132],
    dates: ["Hoy", "13 sep", "15 sep", "18 sep", "20 sep", "23 sep", "26 sep"],
    riskIndex: 3,
  },
  {
    id: "base",
    label: "Escenario base",
    eyebrow: "Dentro de tu reserva",
    headline: "Tu caja conserva margen",
    tone: "safe",
    balance: 126400,
    riskLabel: "Sin cruce de reserva",
    points: [156, 144, 133, 118, 126, 137, 151],
    dates: ["Hoy", "13 sep", "15 sep", "18 sep", "20 sep", "23 sep", "26 sep"],
    riskIndex: -1,
  },
  {
    id: "early",
    label: "Cobro confirmado",
    eyebrow: "Margen recuperado",
    headline: "Una acción cambia el resultado",
    tone: "safe",
    balance: 192500,
    riskLabel: "Nómina cubierta",
    points: [156, 144, 121, 108, 136, 164, 181],
    dates: ["Hoy", "13 sep", "15 sep", "18 sep", "20 sep", "23 sep", "26 sep"],
    riskIndex: -1,
  },
];

type ProcessStep = {
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  detail: string;
  icon: typeof Landmark | typeof FileCheck2 | typeof Sparkles;
};

const processSteps: readonly [ProcessStep, ProcessStep, ProcessStep] = [
  {
    number: "01",
    title: "Conecta lo que ya tienes",
    shortTitle: "Conecta",
    description:
      "Reúne tu saldo, movimientos bancarios, estimaciones y pagos protegidos. Sin llenar otra hoja de cálculo.",
    detail: "Banco · CFDI · Nómina · Materiales",
    icon: Landmark,
  },
  {
    number: "02",
    title: "Mira el primer día de presión",
    shortTitle: "Anticipa",
    description:
      "Colchón proyecta tu caja día por día durante 30 días y marca cuándo tu reserva empieza a apretarse.",
    detail: "Saldo diario · Reserva · Hitos de obra",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Decide con contexto",
    shortTitle: "Decide",
    description:
      "Recibe una recomendación concreta: qué revisar, cuánto falta y cuál es el último día razonable para actuar.",
    detail: "Plan de acción · Seguimiento · Control tuyo",
    icon: Sparkles,
  },
] as const;

const valueBlocks = [
  {
    label: "Visibilidad",
    title: "30 días de caja por delante.",
    description: "Deja de descubrir el problema cuando ya toca pagar.",
    icon: WalletCards,
  },
  {
    label: "Contexto mexicano",
    title: "Tus CFDI también hablan de futuro.",
    description: "Usamos tus cobros y pagos conocidos para explicar la curva.",
    icon: FileCheck2,
  },
  {
    label: "Autonomía",
    title: "Tú decides qué hacer.",
    description:
      "Colchón recomienda; no cobra, no transfiere y no modifica facturas.",
    icon: LockKeyhole,
  },
] as const;

function formatBalance(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function chartGeometry(values: number[]) {
  const width = 680;
  const height = 250;
  const paddingX = 18;
  const paddingY = 26;
  const min = Math.min(...values, 60) - 12;
  const max = Math.max(...values, 120) + 12;
  const range = max - min;

  const points = values.map((value, index) => ({
    x: paddingX + (index / (values.length - 1)) * (width - paddingX * 2),
    y: height - paddingY - ((value - min) / range) * (height - paddingY * 2),
    value,
  }));

  const line = points
    .map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`)
    .join(" ");
  const area = `${line} L ${points.at(-1)?.x ?? width} ${height} L ${points[0]?.x ?? 0} ${height} Z`;
  const reserveY =
    height - paddingY - ((80 - min) / range) * (height - paddingY * 2);

  return { points, line, area, reserveY };
}

function Reveal({
  children,
  reducedMotion,
  className,
}: {
  children: ReactNode;
  reducedMotion: boolean | null;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function CashPreview({
  scenario,
  onSelectScenario,
  reducedMotion,
}: {
  scenario: Scenario;
  onSelectScenario: (id: ScenarioId) => void;
  reducedMotion: boolean | null;
}) {
  const [activePoint, setActivePoint] = useState(
    scenario.riskIndex > -1 ? scenario.riskIndex : 3,
  );
  const geometry = useMemo(
    () => chartGeometry(scenario.points),
    [scenario.points],
  );
  const firstPoint = geometry.points[0];
  if (!firstPoint) return null;
  const selectedPoint = geometry.points[activePoint] ?? firstPoint;
  const selectedDate =
    scenario.dates[activePoint] ?? scenario.dates[0] ?? "Hoy";

  return (
    <div className="landing-console">
      <div className="landing-console-topbar">
        <div className="landing-console-brand">
          <span className="landing-console-orb" aria-hidden="true">
            <BanknoteArrowDown />
          </span>
          <div>
            <p>Plan de caja</p>
            <span>Obra Santa Lucía · 30 días</span>
          </div>
        </div>
        <span className="landing-live-status">
          <span aria-hidden="true" /> Demo en vivo
        </span>
      </div>

      <div className="landing-console-body">
        <div className="landing-console-heading">
          <div>
            <p className="landing-console-eyebrow">Saldo proyectado</p>
            <strong>{formatBalance(scenario.balance)}</strong>
          </div>
          <div
            className={`landing-scenario-status landing-scenario-status-${scenario.tone}`}
            aria-live="polite"
          >
            <span className="landing-scenario-status-dot" aria-hidden="true" />
            {scenario.eyebrow}
          </div>
        </div>

        <div className="landing-chart-wrap">
          <svg
            className="landing-chart"
            viewBox="0 0 680 250"
            role="img"
            aria-labelledby="chart-title chart-description"
          >
            <title id="chart-title">Proyección de saldo de caja</title>
            <desc id="chart-description">
              La línea muestra cómo cambia el saldo proyectado; la línea
              punteada marca la reserva mínima.
            </desc>
            <defs>
              <linearGradient
                id="landing-area-gradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6f9eff" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#6f9eff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="18"
              x2="662"
              y1={geometry.reserveY}
              y2={geometry.reserveY}
              className="landing-chart-reserve"
            />
            <text
              x="18"
              y={geometry.reserveY - 9}
              className="landing-chart-label"
            >
              Reserva mínima
            </text>
            <motion.path
              key={`area-${scenario.id}`}
              d={geometry.area}
              className="landing-chart-area"
              initial={{ opacity: reducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.32 }}
            />
            <motion.path
              key={`line-${scenario.id}`}
              d={geometry.line}
              className="landing-chart-line"
              initial={{
                pathLength: reducedMotion ? 1 : 0,
                opacity: reducedMotion ? 1 : 0.3,
              }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.7 }}
            />
          </svg>

          <div className="landing-chart-points">
            {geometry.points.map((point, index) => {
              const isSelected = index === activePoint;
              const isRisk = index === scenario.riskIndex;
              const date = scenario.dates[index] ?? "Día";
              return (
                <button
                  key={`${scenario.id}-${date}`}
                  type="button"
                  className={`landing-chart-point ${isSelected ? "is-selected" : ""} ${isRisk ? "is-risk" : ""}`}
                  style={{
                    left: `${(point.x / 680) * 100}%`,
                    top: `${(point.y / 250) * 100}%`,
                  }}
                  onClick={() => setActivePoint(index)}
                  aria-label={`${date}: ${formatBalance(point.value * 1000)}`}
                  aria-pressed={isSelected}
                >
                  <span aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="landing-chart-dates" aria-hidden="true">
            {scenario.dates.map((date) => (
              <span key={date}>{date}</span>
            ))}
          </div>
          <div className="landing-chart-tooltip" aria-live="polite">
            <span>{selectedDate}</span>
            <strong>{formatBalance((selectedPoint?.value ?? 0) * 1000)}</strong>
          </div>
        </div>

        <div className="landing-alert-panel" data-tone={scenario.tone}>
          <div className="landing-alert-icon" aria-hidden="true">
            {scenario.tone === "risk" ? <BanknoteArrowDown /> : <Check />}
          </div>
          <div>
            <strong>{scenario.riskLabel}</strong>
            <p>{scenario.headline}</p>
          </div>
          <ChevronRight aria-hidden="true" />
        </div>

        <div
          className="landing-scenario-switcher"
          role="tablist"
          aria-label="Probar escenarios de caja"
        >
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={scenario.id === item.id}
              className={scenario.id === item.id ? "is-active" : ""}
              onClick={() => {
                setActivePoint(item.riskIndex > -1 ? item.riskIndex : 3);
                onSelectScenario(item.id);
              }}
            >
              <span className="landing-switcher-dot" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="landing-console-footer">
        <ShieldCheck aria-hidden="true" />
        <span>Tu dinero se queda bajo tu control.</span>
        <span className="landing-console-footer-note">
          Explora un escenario
        </span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const reducedMotion = useReducedMotion();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("delay");
  const [activeStep, setActiveStep] = useState(0);
  const scenario =
    scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const currentStep = processSteps[activeStep] ?? processSteps[0];
  const ActiveStepIcon = currentStep.icon;

  return (
    <main className="landing-page">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link
            href="/"
            className="landing-brand-link"
            aria-label="Colchón, inicio"
          >
            <Brand />
          </Link>
          <nav className="landing-nav-links" aria-label="Navegación principal">
            <a href="#solucion">La solución</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#para-quien">Para quién</a>
          </nav>
          <div className="landing-nav-actions">
            <Link href="/auth/sign-in" className="landing-nav-login">
              Iniciar sesión
            </Link>
            <Link href="/demo/dashboard" className="landing-nav-cta">
              Ver demo <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section
        className="landing-hero"
        id="contenido"
        aria-labelledby="landing-hero-title"
      >
        <div className="landing-hero-grid landing-container">
          <Reveal reducedMotion={reducedMotion} className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" aria-hidden="true" />
              Inteligencia de caja para constructoras pequeñas
            </div>
            <h1 id="landing-hero-title">
              Que una obra no te agarre <em>sin caja.</em>
            </h1>
            <p className="landing-hero-description">
              Colchón convierte tus CFDI, movimientos y pagos de obra en una
              vista clara de los próximos 30 días. Anticipa la presión y protege
              la nómina antes de que sea urgente.
            </p>
            <div className="landing-hero-actions">
              <Link
                href="/demo/dashboard"
                className="landing-button landing-button-primary"
              >
                Explorar la demo <ArrowRight aria-hidden="true" />
              </Link>
              <a
                href="#como-funciona"
                className="landing-button landing-button-secondary"
              >
                Entender cómo funciona <ChevronRight aria-hidden="true" />
              </a>
            </div>
            <div className="landing-proof-row">
              <span>
                <Check aria-hidden="true" /> Proyección a 30 días
              </span>
              <span>
                <Check aria-hidden="true" /> Sin movimientos automáticos
              </span>
            </div>
          </Reveal>

          <Reveal reducedMotion={reducedMotion} className="landing-hero-demo">
            <CashPreview
              scenario={scenario}
              onSelectScenario={setScenarioId}
              reducedMotion={reducedMotion}
            />
          </Reveal>
        </div>
        <div
          className="landing-hero-orbit landing-hero-orbit-one"
          aria-hidden="true"
        />
        <div
          className="landing-hero-orbit landing-hero-orbit-two"
          aria-hidden="true"
        />
      </section>

      <section
        className="landing-signal-section"
        id="solucion"
        aria-labelledby="signal-title"
      >
        <div className="landing-container">
          <Reveal
            reducedMotion={reducedMotion}
            className="landing-section-intro landing-section-intro-wide"
          >
            <p className="landing-section-label">La pregunta importante</p>
            <h2 id="signal-title">
              El problema no es vender.
              <br />
              <em>Es llegar a la nómina.</em>
            </h2>
            <p>
              Los materiales salen hoy. El cliente paga después. Colchón te
              ayuda a ver ese desfase con tiempo para decidir.
            </p>
          </Reveal>

          <div className="landing-value-grid">
            {valueBlocks.map((block, index) => {
              const Icon = block.icon;
              return (
                <Reveal
                  key={block.label}
                  reducedMotion={reducedMotion}
                  className={`landing-value-block landing-value-block-${index + 1}`}
                >
                  <div className="landing-value-topline">
                    <span>{block.label}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                  {index === 0 && (
                    <div className="landing-mini-bars" aria-hidden="true">
                      <span style={{ height: "34%" }} />
                      <span style={{ height: "48%" }} />
                      <span style={{ height: "42%" }} />
                      <span style={{ height: "70%" }} />
                      <span style={{ height: "88%" }} />
                      <span style={{ height: "62%" }} />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="landing-cfdi-stack" aria-hidden="true">
                      <span>
                        <FileCheck2 /> Emitidas
                      </span>
                      <span>
                        <FileCheck2 /> Recibidas
                      </span>
                    </div>
                  )}
                  {index === 2 && (
                    <div className="landing-control-line" aria-hidden="true">
                      <span>
                        <LockKeyhole />
                      </span>
                      <i />
                      <b>Tú eliges</b>
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="landing-process-section"
        id="como-funciona"
        aria-labelledby="process-title"
      >
        <div className="landing-container">
          <Reveal
            reducedMotion={reducedMotion}
            className="landing-section-intro"
          >
            <p className="landing-section-label">Del dato a la decisión</p>
            <h2 id="process-title">
              Tu operación, <em>con más margen.</em>
            </h2>
            <p>
              Una lectura sencilla para una decisión concreta. En pocos pasos
              sabes dónde mirar.
            </p>
          </Reveal>

          <div className="landing-process-layout">
            <div
              className="landing-process-tabs"
              role="tablist"
              aria-label="Pasos de Colchón"
            >
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                return (
                  <button
                    key={step.number}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`process-panel-${step.number}`}
                    className={`landing-process-tab ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveStep(index)}
                  >
                    <span className="landing-process-number">
                      {step.number}
                    </span>
                    <span className="landing-process-tab-copy">
                      <small>{step.shortTitle}</small>
                      <strong>{step.title}</strong>
                    </span>
                    <Icon aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <motion.div
              key={currentStep.number}
              id={`process-panel-${currentStep.number}`}
              role="tabpanel"
              className="landing-process-panel"
              initial={reducedMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.42 }}
            >
              <div className="landing-process-panel-icon">
                <ActiveStepIcon aria-hidden="true" />
              </div>
              <p className="landing-section-label">Paso {currentStep.number}</p>
              <h3>{currentStep.title}</h3>
              <p>{currentStep.description}</p>
              <div className="landing-process-detail">
                <Check aria-hidden="true" /> {currentStep.detail}
              </div>
              <Link href="/demo/dashboard" className="landing-text-link">
                Verlo en la demo <ArrowRight aria-hidden="true" />
              </Link>
              <div className="landing-process-watermark" aria-hidden="true">
                {currentStep.number}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        className="landing-audience-section"
        id="para-quien"
        aria-labelledby="audience-title"
      >
        <div className="landing-container landing-audience-grid">
          <Reveal
            reducedMotion={reducedMotion}
            className="landing-audience-card"
          >
            <div className="landing-audience-card-topline">
              <span>Hecho para tu realidad</span>
              <ArrowUpRight aria-hidden="true" />
            </div>
            <h2 id="audience-title">
              Para quien coordina la obra y también cuida la caja.
            </h2>
            <p>
              Si hoy revisas el banco, las estimaciones, los proveedores y la
              nómina desde distintos lugares, Colchón te devuelve una sola
              conversación: qué puede pasar y qué conviene revisar.
            </p>
            <div className="landing-audience-list">
              <span>
                <Check aria-hidden="true" /> Constructoras pequeñas
              </span>
              <span>
                <Check aria-hidden="true" /> Contratistas y subcontratistas
              </span>
              <span>
                <Check aria-hidden="true" /> Dueños sin tesorero dedicado
              </span>
            </div>
          </Reveal>

          <Reveal reducedMotion={reducedMotion} className="landing-quote-card">
            <Sparkles aria-hidden="true" />
            <blockquote>
              “No necesito otra gráfica. Necesito saber qué pago tengo que
              revisar antes del viernes.”
            </blockquote>
            <div className="landing-quote-caption">
              <span className="landing-avatar">M</span>
              <span>La pregunta que guía Colchón</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="landing-final-cta"
        id="contacto"
        aria-labelledby="final-cta-title"
      >
        <div className="landing-container landing-final-cta-inner">
          <Reveal reducedMotion={reducedMotion}>
            <div className="landing-final-cta-mark">
              <ShieldCheck aria-hidden="true" /> Tu caja, a tu manera.
            </div>
            <h2 id="final-cta-title">
              La mejor alerta es la que llega <em>antes.</em>
            </h2>
            <p>
              Explora una obra de ejemplo y descubre cómo Colchón transforma una
              proyección en una decisión.
            </p>
            <div className="landing-final-actions">
              <Link
                href="/demo/dashboard"
                className="landing-button landing-button-light"
              >
                Abrir la demo <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/auth/sign-up"
                className="landing-button landing-button-outline-light"
              >
                Crear mi cuenta <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="landing-final-orbit" aria-hidden="true" />
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <Link
            href="/"
            className="landing-footer-brand"
            aria-label="Colchón, inicio"
          >
            <Brand />
          </Link>
          <p>Anticipa la caja de tu obra.</p>
          <div className="landing-footer-links">
            <a href="#solucion">La solución</a>
            <a href="#como-funciona">Cómo funciona</a>
            <Link href="/demo/dashboard">Demo</Link>
          </div>
          <span className="landing-footer-legal">© 2026 Colchón</span>
        </div>
      </footer>
    </main>
  );
}

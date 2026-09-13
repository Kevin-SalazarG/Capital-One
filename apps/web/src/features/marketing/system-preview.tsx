"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  FileText,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const modules = [
  {
    id: "cash",
    label: "Plan de caja",
    shortLabel: "Caja",
    icon: ChartNoAxesCombined,
    eyebrow: "El resumen que orienta la decisión",
    title: "La curva junta saldo, reserva y fechas críticas.",
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

function CashCurve() {
  return (
    <div className="landing-system-curve">
      <div className="landing-system-curve-head">
        <div>
          <p>Proyección de saldo</p>
          <strong>30 días</strong>
        </div>
        <span>Reserva $40,000</span>
      </div>
      <svg
        viewBox="0 0 400 150"
        role="img"
        aria-label="Curva de saldo de Constructora Encino: el escenario original cruza a negativo el 25 de septiembre"
      >
        <defs>
          <linearGradient id="system-curve-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2867d8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2867d8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1="12"
          x2="388"
          y1="94"
          y2="94"
          className="landing-system-curve-reserve"
        />
        <text x="12" y="88" className="landing-system-curve-label">
          reserva
        </text>
        <path
          d="M12 34 L74 40 L136 18 L198 57 L260 73 L322 82 L388 121 L388 138 L12 138 Z"
          className="landing-system-curve-area"
        />
        <path
          d="M12 34 L74 40 L136 18 L198 57 L260 73 L322 82 L388 121"
          className="landing-system-curve-line"
        />
        <circle cx="388" cy="121" r="5" className="landing-system-curve-risk" />
      </svg>
      <div className="landing-system-curve-dates" aria-hidden="true">
        <span>12 sep</span>
        <span>18 sep</span>
        <span>25 sep</span>
      </div>
    </div>
  );
}

function SystemStat({
  label,
  value,
  note,
  risk = false,
}: {
  label: string;
  value: string;
  note: string;
  risk?: boolean;
}) {
  return (
    <div className={`landing-system-stat ${risk ? "is-risk" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function CashModule() {
  return (
    <div className="landing-system-module-body landing-system-cash-body">
      <div className="landing-system-stats">
        <SystemStat
          label="Saldo actual"
          value="$185,000"
          note="Cuenta de operación"
        />
        <SystemStat label="Reserva" value="$40,000" note="Objetivo de caja" />
        <SystemStat
          label="Saldo mínimo"
          value="-$14,000"
          note="29 sep · escenario original"
          risk
        />
      </div>
      <div className="landing-system-cash-grid">
        <CashCurve />
        <div className="landing-system-insight">
          <div className="landing-system-insight-icon">
            <WalletCards aria-hidden="true" />
          </div>
          <div>
            <span>Primer punto de presión</span>
            <strong>25 sep · Nómina</strong>
            <p>
              $118,000 para cuadrilla y oficina · 12 personas. Colchón te dice
              qué revisar antes de que sea urgente.
            </p>
          </div>
        </div>
      </div>
      <div className="landing-system-recommendation">
        <div>
          <span>Recomendación modelada</span>
          <strong>Revisar un anticipo con Grupo Alameda</strong>
        </div>
        <span>$55,700 · antes del 24 sep</span>
      </div>
    </div>
  );
}

const protectedPayments = [
  {
    date: "25 sep",
    label: "Nómina · cuadrilla y oficina · 12 personas",
    amount: "$118,000",
  },
  { date: "20 sep", label: "Impuestos", amount: "$28,000" },
  { date: "22 sep", label: "Renta de bodega y patio", amount: "$18,000" },
] as const;

function ProtectedModule() {
  return (
    <div className="landing-system-module-body">
      <div className="landing-system-module-note">
        <LockKeyhole aria-hidden="true" />
        <span>
          Estos pagos se mantienen en su fecha al comparar recomendaciones.
        </span>
      </div>
      <ul
        className="landing-system-rows"
        aria-label="Pagos protegidos de la demo"
      >
        {protectedPayments.map((payment) => (
          <li className="landing-system-row" key={payment.label}>
            <div className="landing-system-date-badge">
              <span>sep</span>
              <strong>{payment.date.slice(0, 2)}</strong>
            </div>
            <div className="landing-system-row-copy">
              <strong>{payment.label}</strong>
              <span>
                <ShieldCheck aria-hidden="true" /> Fecha protegida
              </span>
            </div>
            <strong className="landing-system-row-amount">
              {payment.amount}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

const invoiceRows = [
  {
    label: "Obra Senda · Estimación 01",
    kind: "Por cobrar",
    date: "16 sep",
    amount: "$32,600",
    tone: "in",
  },
  {
    label: "Casa Roble · Estimación 02",
    kind: "Por cobrar",
    date: "30 sep",
    amount: "$65,000",
    tone: "in",
  },
  {
    label: "Maderas del Norte · Materiales",
    kind: "Por pagar",
    date: "18 sep",
    amount: "$46,000",
    tone: "out",
  },
] as const;

function InvoicesModule() {
  return (
    <div className="landing-system-module-body">
      <div className="landing-system-stats landing-system-stats-two">
        <SystemStat
          label="Por cobrar"
          value="$153,300"
          note="3 estimaciones pendientes"
        />
        <SystemStat
          label="Por pagar"
          value="$58,000"
          note="2 CFDI de materiales"
        />
      </div>
      <table className="landing-system-table" aria-label="CFDI de la demo">
        <thead className="landing-system-table-head">
          <tr>
            <th scope="col">Cliente / proveedor</th>
            <th scope="col">Vencimiento</th>
            <th scope="col">Pendiente</th>
          </tr>
        </thead>
        <tbody>
          {invoiceRows.map((invoice) => (
            <tr className="landing-system-table-row" key={invoice.label}>
              <td>
                <strong>{invoice.label}</strong>
                <span className={`landing-system-direction is-${invoice.tone}`}>
                  {invoice.kind}
                </span>
              </td>
              <td>{invoice.date}</td>
              <td>{invoice.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const bankRows = [
  {
    label: "Cobro de Casa Roble · estimación 02",
    date: "12 sep · 15:30",
    amount: "+$24,500",
    tone: "in",
  },
  {
    label: "Maderas del Norte · materiales",
    date: "11 sep · 17:15",
    amount: "-$12,800",
    tone: "out",
  },
  {
    label: "Cobro de Obra Senda · estimación 01",
    date: "10 sep · 16:00",
    amount: "+$18,000",
    tone: "in",
  },
] as const;

function BankModule() {
  return (
    <div className="landing-system-module-body">
      <div className="landing-bank-account">
        <div className="landing-bank-account-icon">
          <Landmark aria-hidden="true" />
        </div>
        <div>
          <span>Cuenta de operación · MXN</span>
          <strong>$185,000</strong>
        </div>
        <span className="landing-bank-sync">
          <span aria-hidden="true" /> Actualizada
        </span>
      </div>
      <table
        className="landing-system-table landing-bank-table"
        aria-label="Movimientos bancarios de la demo"
      >
        <thead className="landing-system-table-head">
          <tr>
            <th scope="col">Movimiento</th>
            <th scope="col">Fecha</th>
            <th scope="col">Monto</th>
          </tr>
        </thead>
        <tbody>
          {bankRows.map((movement) => (
            <tr className="landing-system-table-row" key={movement.label}>
              <td className="landing-bank-movement">
                {movement.tone === "in" ? (
                  <ArrowDownLeft
                    aria-hidden="true"
                    className="landing-bank-movement-icon-in"
                  />
                ) : (
                  <ArrowUpRight
                    aria-hidden="true"
                    className="landing-bank-movement-icon-out"
                  />
                )}
                <strong>{movement.label}</strong>
              </td>
              <td>{movement.date}</td>
              <td className={`landing-bank-amount is-${movement.tone}`}>
                {movement.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModuleBody({ id }: { id: ModuleId }) {
  if (id === "protected") return <ProtectedModule />;
  if (id === "cfdi") return <InvoicesModule />;
  if (id === "bank") return <BankModule />;
  return <CashModule />;
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
              No es otra gráfica.
              <br />
              <em>Es tu operación conectada.</em>
            </h2>
          </div>
          <p>
            Empieza en la cuenta de operación, cruza tus CFDI con los pagos que
            no pueden moverse y termina con una recomendación que tú puedes
            revisar. Selecciona un módulo para verlo.
          </p>
        </SectionReveal>

        <SectionReveal
          reducedMotion={reducedMotion}
          delay={0.08}
          hoverY={-4}
          className="landing-system-browser"
        >
          <aside
            className="landing-system-rail"
            aria-label="Módulos de la demo"
          >
            <div className="landing-system-rail-brand">
              <span aria-hidden="true">C</span>
              <div>
                <strong>Colchón</strong>
                <small>Constructora Encino</small>
              </div>
            </div>
            <div
              className="landing-system-rail-nav"
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
                    className={`landing-system-rail-link ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveId(module.id)}
                    onMouseEnter={() => setActiveId(module.id)}
                    onFocus={() => setActiveId(module.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="system-preview-panel"
                  >
                    <Icon aria-hidden="true" />
                    <span className="landing-system-rail-link-label">
                      {module.label}
                    </span>
                    <span className="landing-system-rail-link-short">
                      {module.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="landing-system-rail-footer">
              <ShieldCheck aria-hidden="true" />
              <span>Sin movimientos automáticos</span>
            </div>
          </aside>

          <div className="landing-system-workspace">
            <div className="landing-system-topbar">
              <div>
                <span>Espacio de trabajo</span>
                <strong>Constructora Encino</strong>
              </div>
              <span className="landing-system-date">12 sep 2026 · Demo</span>
            </div>
            <div className="landing-system-module-header">
              <div>
                <span className="landing-system-module-eyebrow">
                  <ActiveIcon aria-hidden="true" /> {activeModule.eyebrow}
                </span>
                <h3>{activeModule.title}</h3>
              </div>
              <Link
                href={activeModule.route}
                className="landing-system-open-link"
              >
                {activeModule.routeLabel} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <motion.div
              key={activeModule.id}
              id="system-preview-panel"
              role="tabpanel"
              className="landing-system-panel"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.38 }}
            >
              <ModuleBody id={activeModule.id} />
            </motion.div>
            <div className="landing-system-panel-footer">
              <span>
                <Check aria-hidden="true" /> Datos sintéticos de demo, no datos
                fiscales reales.
              </span>
              <Link href="/demo/dashboard">
                Explorar toda la demo <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
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

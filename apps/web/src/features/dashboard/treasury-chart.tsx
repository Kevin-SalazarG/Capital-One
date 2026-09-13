"use client";

import { useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Treasury, Projection } from "@colchon/treasury/treasury-contract";
import { Table2 } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/formatters";

export function TreasuryChart({
  cashOffset = 0,
  data,
  projected,
}: {
  cashOffset?: number;
  data: Treasury;
  projected: Projection | null;
}) {
  const [table, setTable] = useState(false);
  const reducedMotion = useReducedMotion();
  const currency = data.input.currency;
  const baselineLabel = cashOffset > 0 ? "Pago registrado" : "Sin acciones";
  const rows = data.baseline.points.map((point, index) => ({
    date: point.date,
    baseline: Number(point.closing) + cashOffset,
    plan: projected ? Number(projected.points[index]?.closing) : undefined,
  }));
  const payroll =
    data.criticalEvents.find((event) => event.category === "payroll") ??
    data.criticalEvents[0];
  return (
    <div className="dashboard-chart-content">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span
              className="w-5 border-t-[3px] border-primary"
              aria-hidden="true"
            />
            {baselineLabel}
          </span>
          {projected && (
            <span className="flex items-center gap-2">
              <span
                className="w-5 border-t-[3px] border-success"
                aria-hidden="true"
              />
              Con el plan
            </span>
          )}
          <span className="flex items-center gap-2">
            <span
              className="w-5 border-t border-dotted border-warning"
              aria-hidden="true"
            />
            Reserva
          </span>
        </div>
        <Button
          variant="ghost"
          aria-expanded={table}
          onClick={() => setTable(!table)}
        >
          <Table2 />
          {table ? "Ver gráfica" : "Ver tabla"}
        </Button>
      </div>
      {table ? (
        <div className="overflow-auto rounded-2xl border bg-muted/40">
          <table className="w-full text-left text-sm numeric">
            <caption className="sr-only">
              Saldos al cierre diario en {currency}. {baselineLabel}. Reserva:{" "}
              {formatMoney(data.input.reserve, currency)}.
            </caption>
            <thead className="sticky top-0 bg-card">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">{baselineLabel}</th>
                {projected && <th className="p-3">Con plan</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className="border-t">
                  <th className="p-3 font-normal">{formatDate(row.date)}</th>
                  <td className="p-3">
                    {formatMoney(String(row.baseline), currency)}
                  </td>
                  {projected && (
                    <td className="p-3">
                      {formatMoney(String(row.plan), currency)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="h-[320px] min-w-0 w-full sm:h-[350px]"
          role="img"
          aria-label={`Proyección a 30 días. ${baselineLabel}: ${formatMoney(String(Number(data.baseline.summary.minimumBalance) + cashOffset), currency)}. ${projected ? `Con plan: ${formatMoney(projected.summary.minimumBalance, currency)}.` : ""} Usa Ver tabla para consultar todos los valores.`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={rows}
              margin={{ top: 30, right: 12, left: -12, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => formatDate(value)}
                minTickGap={32}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                dy={8}
              />
              <YAxis
                width={65}
                tickFormatter={(value: number) =>
                  `${value < 0 ? "−" : ""}$${Math.abs(value / 1000)}k`
                }
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value, name) => [
                  formatMoney(String(value), currency),
                  name === "baseline" ? baselineLabel : "Con el plan",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "var(--border)",
                  fontSize: "13px",
                  boxShadow: "0 8px 30px #172b3a15",
                }}
              />
              <ReferenceLine
                y={0}
                stroke="var(--destructive)"
                strokeOpacity={0.45}
              />
              <ReferenceLine
                y={Number(data.input.reserve)}
                stroke="var(--warning)"
                strokeDasharray="2 5"
              />
              {payroll && (
                <ReferenceLine
                  x={payroll.date}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 5"
                  label={{
                    value:
                      payroll.category === "payroll"
                        ? "Nómina"
                        : "Pago crítico",
                    position: "top",
                    fontSize: 12,
                    fill: "var(--foreground)",
                  }}
                />
              )}
              {projected && (
                <Line
                  type="linear"
                  dataKey="plan"
                  stroke="var(--success)"
                  strokeWidth={2.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={reducedMotion ? 0 : 450}
                  activeDot={false}
                />
              )}
              <Line
                type="linear"
                dataKey="baseline"
                stroke="var(--primary)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                isAnimationActive={!reducedMotion}
                animationDuration={reducedMotion ? 0 : 450}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

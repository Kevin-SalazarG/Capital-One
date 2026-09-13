"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnnualHistory } from "@colchon/treasury/treasury-contract";
import { Table2 } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/formatters";

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  timeZone: "UTC",
});

function formatMonth(value: string): string {
  return monthFormatter
    .format(new Date(`${value}-01T12:00:00Z`))
    .replace(".", "");
}

export function AnnualCashChart({ data }: { data: AnnualHistory }) {
  const [table, setTable] = useState(false);
  const reducedMotion = useReducedMotion();
  const rows = data.points.map((point) => ({
    month: point.month,
    label: formatMonth(point.month),
    current: Number(point.currentBalance),
    previous:
      point.previousBalance === null ? null : Number(point.previousBalance),
  }));

  return (
    <div className="dashboard-annual-chart-content">
      <div className="dashboard-annual-chart-toolbar">
        <div className="dashboard-annual-legend">
          <span className="flex items-center gap-2">
            <span
              className="w-5 border-t-[3px] border-primary"
              aria-hidden="true"
            />
            {data.currentYear}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-5 border-t-2 border-dashed border-muted-foreground"
              aria-hidden="true"
            />
            {data.previousYear}
          </span>
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
          <table className="w-full min-w-[34rem] text-left text-sm numeric">
            <caption className="sr-only">
              Saldo mensual en {data.currency}: {data.currentYear} frente a{" "}
              {data.previousYear}. Corte al {formatDate(data.asOf)}. Reserva:{" "}
              {formatMoney(data.reserve, data.currency)}.
            </caption>
            <thead className="sticky top-0 bg-card">
              <tr>
                <th scope="col" className="p-3">
                  Mes
                </th>
                <th scope="col" className="p-3">
                  {data.currentYear}
                </th>
                <th scope="col" className="p-3">
                  {data.previousYear}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((point) => (
                <tr key={point.month} className="border-t">
                  <th scope="row" className="p-3 font-normal">
                    {formatMonth(point.month)}
                  </th>
                  <td className="p-3">
                    {formatMoney(point.currentBalance, data.currency)}
                  </td>
                  <td className="p-3">
                    {point.previousBalance === null
                      ? "Sin datos"
                      : formatMoney(point.previousBalance, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="dashboard-annual-chart"
          role="img"
          aria-label={`Saldo mensual de ${data.currentYear} frente a ${data.previousYear}, hasta el ${formatDate(data.asOf)}. La diferencia al corte es ${formatMoney(data.summary.difference, data.currency)}. Usa Ver tabla para consultar todos los valores.`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={rows}
              margin={{ top: 22, right: 12, left: -12, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="label"
                minTickGap={24}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                dy={8}
              />
              <YAxis
                width={68}
                tickFormatter={(value: number) =>
                  formatMoney(String(value), data.currency, true)
                }
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(value, name) => [
                  formatMoney(String(value), data.currency),
                  name === "current"
                    ? String(data.currentYear)
                    : String(data.previousYear),
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "var(--border)",
                  fontSize: "13px",
                  boxShadow: "0 8px 30px #172b3a15",
                }}
              />
              <ReferenceLine
                y={Number(data.reserve)}
                stroke="var(--warning)"
                strokeDasharray="2 5"
                label={{
                  value: "Reserva",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "var(--warning)",
                }}
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--muted-foreground)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                isAnimationActive={!reducedMotion}
                animationDuration={reducedMotion ? 0 : 450}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={!reducedMotion}
                animationDuration={reducedMotion ? 0 : 450}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Saldo al cierre de cada mes.{" "}
        {formatDate(data.asOf, { day: "numeric", month: "long" })} es un corte
        parcial; no se muestran meses futuros.
      </p>
    </div>
  );
}

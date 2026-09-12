"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Table2, X } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { Dashboard } from "@/lib/api/contracts";
import { formatDate, formatMoney } from "@/lib/formatters";

export function CashChart({ data }: { data: Dashboard }) {
  const [showTable, setShowTable] = useState(false);
  const currency = data.organization.currency;
  const points = data.forecast.map((point) => ({
    ...point,
    value: Number(point.projectedBalance),
  }));
  const gapPoint = points.find((point) => point.date === data.gap?.date);
  const rangeEnd = points.at(-1)?.date;

  return (
    <section className="panel" aria-labelledby="forecast-title">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-6 md:px-7">
        <div>
          <h2 id="forecast-title" className="text-base font-semibold">
            Tu caja, día a día
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatDate(data.asOf)}
            {rangeEnd
              ? ` – ${formatDate(rangeEnd, { day: "numeric", month: "short", year: "numeric" })}`
              : ""}
          </p>
        </div>
        <span className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium">
          {points.length} días
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-5 px-5 pb-2 pt-3 text-xs text-muted-foreground md:px-7">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded-full bg-chart-1"
          />
          Saldo proyectado
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="w-4 border-t-2 border-dashed border-warning"
          />
          Reserva de seguridad
        </span>
      </div>
      <section
        className="h-[285px] w-full pr-3 pt-5 sm:h-[315px] md:pr-5"
        aria-label={`Proyección diaria en ${currency}. ${data.gap ? `Primer faltante el ${formatDate(data.gap.date)}.` : "Sin faltantes proyectados."}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={points}
            accessibilityLayer
            margin={{ top: 20, bottom: 6, right: 8, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
              strokeDasharray="3 5"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(date: string) => formatDate(date)}
              minTickGap={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={67}
              tickCount={5}
              tickFormatter={(value: number) =>
                formatMoney(String(value), currency, true)
              }
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ReferenceLine
              y={Number(data.safetyThreshold)}
              stroke="var(--warning)"
              strokeDasharray="5 5"
            />
            {gapPoint && (
              <ReferenceLine
                x={gapPoint.date}
                stroke="var(--destructive)"
                strokeDasharray="3 5"
                strokeOpacity={0.4}
              />
            )}
            <Tooltip
              cursor={{
                stroke: "var(--chart-1)",
                strokeDasharray: "3 3",
                strokeOpacity: 0.4,
              }}
              content={({ active, label }) => {
                const point = points.find((item) => item.date === label);
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(point.date, {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="numeric mt-1 text-lg font-semibold">
                      {formatMoney(point.projectedBalance, currency)}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowDownLeft className="size-3" />
                      Entradas {formatMoney(point.inflows, currency)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowUpRight className="size-3" />
                      Salidas {formatMoney(point.outflows, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: "white", strokeWidth: 3 }}
              isAnimationActive={false}
            />
            {gapPoint && (
              <ReferenceDot
                x={gapPoint.date}
                y={gapPoint.value}
                r={5}
                fill="var(--destructive)"
                stroke="white"
                strokeWidth={3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 md:px-7">
        <p className="text-xs text-muted-foreground">
          Proyección con la información disponible.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 text-xs"
          aria-expanded={showTable}
          aria-controls="forecast-table"
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? <X /> : <Table2 />}
          {showTable ? "Cerrar tabla" : "Ver los datos"}
        </Button>
      </div>
      {showTable && (
        <div id="forecast-table" className="max-h-96 overflow-auto border-t">
          <table className="w-full">
            <caption className="sr-only">
              Proyección diaria en {currency}
            </caption>
            <thead className="table-head sticky top-0 bg-card">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Día
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Saldo
                </th>
                <th
                  scope="col"
                  className="hidden px-5 py-3 text-right sm:table-cell"
                >
                  Entradas
                </th>
                <th
                  scope="col"
                  className="hidden px-5 py-3 text-right sm:table-cell"
                >
                  Salidas
                </th>
                <th scope="col" className="px-5 py-3">
                  Reserva
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {points.map((point) => (
                <tr key={point.date}>
                  <td className="table-cell whitespace-nowrap">
                    {formatDate(point.date)}
                  </td>
                  <td className="table-cell numeric text-right">
                    {formatMoney(point.projectedBalance, currency)}
                  </td>
                  <td className="table-cell numeric hidden text-right sm:table-cell">
                    {formatMoney(point.inflows, currency)}
                  </td>
                  <td className="table-cell numeric hidden text-right sm:table-cell">
                    {formatMoney(point.outflows, currency)}
                  </td>
                  <td className="table-cell">
                    <span
                      className={
                        point.isBelowThreshold
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {point.isBelowThreshold ? "Por debajo" : "Cubierta"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

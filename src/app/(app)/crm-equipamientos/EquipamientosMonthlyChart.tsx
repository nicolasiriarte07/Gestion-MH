"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { SaleItem } from "@/lib/types";

type Metric = "facturacion" | "ventas";

const CHART_HEIGHT = 180;
const BAR_WIDTH = 64;
const BAR_GAP = 28;
const LEFT_PADDING = 60;
const GRID_STEPS = 4;

const METRIC_LABELS: Record<Metric, string> = {
  facturacion: "Facturación ($)",
  ventas: "Ventas (cantidad)",
};

const METRIC_COLOR: Record<Metric, string> = {
  facturacion: "#7c3aed",
  ventas: "#00429c",
};

function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatScaled(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const rounded = Math.round(scaled * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}${suffix}`;
}

function formatAxisValue(value: number, metric: Metric): string {
  if (metric === "ventas") return String(Math.round(value));
  if (value >= 1_000_000) return `$${formatScaled(value, 1_000_000, "M")}`;
  if (value >= 1_000) return `$${formatScaled(value, 1_000, "k")}`;
  return `$${Math.round(value)}`;
}

export default function EquipamientosMonthlyChart({ rows }: { rows: SaleItem[] }) {
  const [metric, setMetric] = useState<Metric>("facturacion");

  const currentYear = new Date().getUTCFullYear();

  const monthly = useMemo(() => {
    const map = new Map<string, { facturacion: number; ventas: number }>();
    for (const r of rows) {
      const key = monthKeyOf(r.sale_date);
      if (!key.startsWith(String(currentYear))) continue;
      const agg = map.get(key) ?? { facturacion: 0, ventas: 0 };
      agg.facturacion += r.subtotal_with_iva;
      agg.ventas += 1;
      map.set(key, agg);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        key,
        label: monthLabel(key),
        value: metric === "facturacion" ? v.facturacion : v.ventas,
      }));
  }, [rows, metric, currentYear]);

  const max = Math.max(...monthly.map((m) => m.value), 1);
  const plotWidth = Math.max(monthly.length * (BAR_WIDTH + BAR_GAP), 300);
  const width = plotWidth + LEFT_PADDING;
  const svgHeight = CHART_HEIGHT + 10;
  // Para "ventas" (cantidad entera) con un máximo chico, 4 escalones
  // pueden repetir el mismo número redondeado (ej. 0,1,1,2,2) — se
  // achica la cantidad de escalones a como mucho el propio máximo.
  const gridSteps = metric === "ventas" ? Math.max(1, Math.min(GRID_STEPS, max)) : GRID_STEPS;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (max / gridSteps) * i);
  const color = METRIC_COLOR[metric];

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="flex items-center justify-between border-b border-mh-border px-6 py-4">
        <p className="text-sm font-bold text-mh-ink">Análisis Mensual</p>
        <div className="relative">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="appearance-none rounded-xl border border-mh-border bg-mh-bg py-2 pr-9 pl-3 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
          >
            {(Object.entries(METRIC_LABELS) as [Metric, string][]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-mh-ink-muted"
          />
        </div>
      </div>

      <div className="overflow-x-auto p-6">
        {monthly.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">Sin ventas en {currentYear} todavía.</p>
        ) : (
          <svg width={width} height={svgHeight + 20} viewBox={`0 0 ${width} ${svgHeight + 20}`}>
            {gridValues.map((g) => {
              const y = svgHeight - (g / max) * CHART_HEIGHT;
              return (
                <g key={g}>
                  <line
                    x1={LEFT_PADDING}
                    x2={width}
                    y1={y}
                    y2={y}
                    stroke="#eef0f4"
                    strokeDasharray="4 4"
                  />
                  <text x={LEFT_PADDING - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#9aa1ae">
                    {formatAxisValue(g, metric)}
                  </text>
                </g>
              );
            })}

            {monthly.map((m, i) => {
              const barHeight = (m.value / max) * CHART_HEIGHT;
              const x = LEFT_PADDING + i * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
              const y = svgHeight - barHeight;
              return (
                <g key={m.key}>
                  <rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={Math.max(barHeight, 2)}
                    rx={4}
                    fill={color}
                  >
                    <title>
                      {`${m.label}: ${
                        metric === "facturacion" ? formatCurrency(m.value) : m.value
                      }`}
                    </title>
                  </rect>
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={svgHeight + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#9aa1ae"
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </Card>
  );
}

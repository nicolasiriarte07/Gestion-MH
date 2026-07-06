"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";

const COMISION_TIENDANUBE_PCT = 1;
const IIBB_PCT = 3;

const FINANCIAL_COST_OPTIONS = [
  { key: "mp_debito", label: "MP tarjeta de débito", pct: 4.3 },
  { key: "mp_credito_contado", label: "MP tarjeta de crédito contado", pct: 4.3 },
  { key: "mp_credito_2_si", label: "MP tarjeta de crédito 2 cuotas S/I", pct: 15.78 },
  { key: "mp_credito_3_si", label: "MP tarjeta de crédito 3 cuotas S/I", pct: 18.7 },
  { key: "go_cuotas", label: "GO Cuotas", pct: 9.9 },
  { key: "transferencia", label: "Transferencia", pct: 10 },
] as const;

type FinancialCostKey = (typeof FINANCIAL_COST_OPTIONS)[number]["key"];

function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export default function SimuladorWeb({
  defaultCogsPct,
}: {
  defaultCogsPct: number;
}) {
  const [price, setPrice] = useState(200000);
  const [cogsPct, setCogsPct] = useState(Number(defaultCogsPct.toFixed(1)));
  const [financialKey, setFinancialKey] = useState<FinancialCostKey>(
    FINANCIAL_COST_OPTIONS[0].key
  );

  const financialOption = FINANCIAL_COST_OPTIONS.find(
    (o) => o.key === financialKey
  )!;

  const rows = useMemo(
    () => [
      { label: "COGS — Costo del producto", pct: cogsPct },
      { label: "Comisión Tiendanube", pct: COMISION_TIENDANUBE_PCT },
      { label: "IIBB — Ingresos Brutos", pct: IIBB_PCT },
      {
        label: `Costo financiero — ${financialOption.label}`,
        pct: financialOption.pct,
      },
    ],
    [cogsPct, financialOption]
  );

  const totalVariablePct = rows.reduce((sum, r) => sum + r.pct, 0);
  const netProfitPct = 100 - totalVariablePct;
  const totalVariableAmount = (price * totalVariablePct) / 100;
  const netProfitAmount = price - totalVariableAmount;

  function handlePriceBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = parseFlexibleNumber(e.target.value);
    setPrice(value);
    e.target.value = formatCurrency(value);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Precio de venta
          </span>
          <input
            type="text"
            inputMode="numeric"
            defaultValue={formatCurrency(price)}
            onFocus={(e) => e.target.select()}
            onBlur={handlePriceBlur}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            COGS (%)
          </span>
          <input
            type="number"
            step="0.1"
            value={cogsPct}
            onChange={(e) => setCogsPct(Number(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Costo financiero
          </span>
          <select
            value={financialKey}
            onChange={(e) => setFinancialKey(e.target.value as FinancialCostKey)}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          >
            {FINANCIAL_COST_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label} ({formatPct(o.pct)})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-2 font-medium">Concepto</th>
              <th className="px-4 py-2 text-right font-medium">
                % s/ precio de venta
              </th>
              <th className="px-4 py-2 text-right font-medium">Monto ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <td className="px-4 py-2 font-semibold text-slate-900">
                Precio de venta
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                100,0%
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatCurrency(price)}
              </td>
            </tr>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-100">
                <td className="px-4 py-2 text-slate-700">{r.label}</td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatPct(r.pct)}
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatCurrency((price * r.pct) / 100)}
                </td>
              </tr>
            ))}
            <tr className="border-b border-slate-100 bg-slate-50">
              <td className="px-4 py-2 font-semibold text-slate-900">
                Total costos variables
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatPct(totalVariablePct)}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatCurrency(totalVariableAmount)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold text-slate-900">
                Ganancia neta
              </td>
              <td
                className={`px-4 py-2 text-right font-semibold ${
                  netProfitPct >= 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatPct(netProfitPct)}
              </td>
              <td
                className={`px-4 py-2 text-right font-semibold ${
                  netProfitAmount >= 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatCurrency(netProfitAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

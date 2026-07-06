"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { BreakdownRow } from "../ventas/BreakdownCard";
import { BreakdownCard } from "../ventas/BreakdownCard";
import { PieChart } from "../ventas/PieChart";
import { BUSINESS_UNIT_COLORS } from "@/lib/businessUnitColors";
import type { Metric, Currency } from "../ventas/MetricControls";

const ROW_GAP_PX = 8; // coincide con space-y-2 de BreakdownCard
const DEFAULT_MAX_ROWS = 8;
const DESKTOP_BREAKPOINT = "(min-width: 1024px)"; // coincide con el prefijo `lg` de Tailwind

export default function StockCharts({
  stockByBusinessUnit,
  stockByCategory,
  stockByBrand,
  metric,
  currency,
}: {
  stockByBusinessUnit: BreakdownRow[];
  stockByCategory: BreakdownRow[];
  stockByBrand: BreakdownRow[];
  metric: Metric;
  currency: Currency;
}) {
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const categoryCardRef = useRef<HTMLDivElement>(null);
  const [categoryMaxRows, setCategoryMaxRows] = useState(DEFAULT_MAX_ROWS);

  useLayoutEffect(() => {
    const leftColumn = leftColumnRef.current;
    const card = categoryCardRef.current;
    if (!leftColumn || !card) return;

    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    // "Stock por categoría" debe ocupar el mismo alto que el gráfico de
    // torta + la tarjeta de Stock por marca juntos (columna izquierda), y
    // mostrar tantas categorías como entren ahí — ni todas, ni un tope
    // fijo. El alto objetivo se mide de una columna aparte (no de esta
    // misma tarjeta) para que agregar filas nunca infle el alto que se
    // usa para decidir cuántas filas entran.
    function recalc() {
      if (!leftColumn || !card) return;

      if (!mediaQuery.matches) {
        setCategoryMaxRows(DEFAULT_MAX_ROWS);
        return;
      }

      const rowsWrapper = card.querySelector<HTMLElement>(
        "[data-rows-wrapper]"
      );
      const firstRow = card.querySelector<HTMLElement>("[data-row]");
      if (!rowsWrapper || !firstRow) return;

      const targetHeight = leftColumn.getBoundingClientRect().height;
      const cardTop = card.getBoundingClientRect().top;
      const rowsWrapperTop = rowsWrapper.getBoundingClientRect().top;
      const rowHeight = firstRow.getBoundingClientRect().height;
      const paddingBottom = parseFloat(
        getComputedStyle(card).paddingBottom || "0"
      );

      if (rowHeight <= 0) return;

      // Alto ocupado por el título de la tarjeta (padding superior +
      // título + su margen), medido en vivo en vez de asumir valores fijos.
      const headerHeight = rowsWrapperTop - cardTop;
      const availableForRows = targetHeight - headerHeight - paddingBottom;
      if (availableForRows <= 0) return;

      const rowsFit = Math.max(
        1,
        Math.floor((availableForRows + ROW_GAP_PX) / (rowHeight + ROW_GAP_PX))
      );

      const total = stockByCategory.length;
      const next = total <= rowsFit ? total : Math.max(1, rowsFit - 1);
      setCategoryMaxRows((prev) => (prev === next ? prev : next));
    }

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(leftColumn);
    mediaQuery.addEventListener("change", recalc);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", recalc);
    };
  }, [stockByCategory.length]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div ref={leftColumnRef} className="flex flex-col gap-4">
        <PieChart
          title="Stock por unidad de negocio"
          rows={stockByBusinessUnit}
          metric={metric}
          currency={currency}
          colorMap={BUSINESS_UNIT_COLORS}
        />
        <BreakdownCard
          title="Stock por marca"
          rows={stockByBrand}
          colorMode="sequential"
          metric={metric}
          currency={currency}
        />
      </div>
      <BreakdownCard
        containerRef={categoryCardRef}
        title="Stock por categoría"
        rows={stockByCategory}
        colorMode="sequential"
        metric={metric}
        currency={currency}
        maxRows={categoryMaxRows}
      />
    </div>
  );
}

import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import Card from "./Card";
import IconTile, { type IconTone } from "./IconTile";

export type KpiDelta = {
  pct: number;
  label: string;
};

export default function KpiCard({
  icon,
  tone,
  label,
  value,
  delta,
  sublabel,
}: {
  icon: LucideIcon;
  tone: IconTone;
  label: string;
  value: string;
  // Comparación numérica contra el período anterior (con flecha y color).
  // Excluyente con `sublabel`: una tarjeta muestra una cosa u otra, no
  // ambas (ver KPIs "stock bajo"/"inversión", que son fotos del momento
  // sin período de comparación real).
  delta?: KpiDelta;
  sublabel?: string;
}) {
  const isUp = (delta?.pct ?? 0) >= 0;

  return (
    <Card className="font-inter">
      <div className="flex items-center gap-4">
        <IconTile icon={icon} tone={tone} />
        <p className="text-sm font-medium text-mh-ink-muted">{label}</p>
      </div>
      <p className="mt-4 text-[2rem] leading-none font-extrabold tracking-tight text-mh-ink">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-sm">
        {delta && (
          <>
            <span
              className={`flex items-center gap-0.5 font-semibold ${
                isUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {Math.abs(delta.pct).toFixed(0)}%
            </span>
            <span className="text-mh-ink-muted">{delta.label}</span>
          </>
        )}
        {sublabel && <span className="text-mh-ink-muted">{sublabel}</span>}
      </div>
    </Card>
  );
}

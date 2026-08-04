import type { ReactNode } from "react";

// Paleta de estado restringida a lo que pidió el sistema de diseño:
// rosa/azul MH + verde/amarillo/rojo (solo para semáforos de estado,
// igual que las flechas ↑/↓ de las KpiCard) + grises.
export type BadgeTone = "pink" | "blue" | "green" | "amber" | "red" | "gray";

const TONE_CLASSES: Record<BadgeTone, string> = {
  pink: "bg-mh-pink-light text-mh-pink",
  blue: "bg-mh-blue-light text-mh-blue",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-slate-100 text-slate-600",
};

export default function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

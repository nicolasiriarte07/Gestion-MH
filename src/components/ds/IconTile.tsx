import type { LucideIcon } from "lucide-react";

// Cuadrado redondeado con ícono, usado en las KpiCard y en los botones
// grandes de Acciones rápidas. `tone` restringe la paleta a lo permitido
// por el sistema de diseño (rosa/azul MH y grises), sin colores fuertes
// adicionales.
export type IconTone = "pink" | "blue" | "blue-light" | "gray";

const TONE_CLASSES: Record<IconTone, string> = {
  pink: "bg-mh-pink text-white",
  blue: "bg-mh-blue text-white",
  "blue-light": "bg-mh-blue-light text-mh-blue",
  gray: "bg-slate-100 text-slate-600",
};

export default function IconTile({
  icon: Icon,
  tone,
  size = 44,
}: {
  icon: LucideIcon;
  tone: IconTone;
  size?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl ${TONE_CLASSES[tone]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}

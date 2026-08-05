import type { ReactNode } from "react";

const PADDING_CLASSES = {
  none: "",
  // 24px: usado por módulos con grillas más densas (ej. Ventas, muchos
  // gráficos chicos por pantalla).
  sm: "p-6",
  // 32px: default del brief de Inicio/Inventario.
  md: "p-8",
} as const;

// Card base del sistema de diseño nuevo: blanco, borde #ECECEC, radio 16px
// (rounded-2xl de Tailwind), sombra muy sutil.
export default function Card({
  children,
  className = "",
  padding = "md",
  title,
}: {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PADDING_CLASSES;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`min-w-0 rounded-2xl border border-mh-border bg-mh-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

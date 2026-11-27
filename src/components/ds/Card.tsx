import type { ReactNode } from "react";

const PADDING_CLASSES = {
  none: "",
  // 24px: usado por módulos con grillas más densas (ej. Ventas, muchos
  // gráficos chicos por pantalla).
  sm: "p-6",
  // 32px: default del brief de Inicio/Inventario.
  md: "p-8",
} as const;

// Card base del sistema de diseño: blanco, borde mh-border, radio 12px
// (token rounded-mh-card), sombra única (token shadow-mh-card).
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
      className={`min-w-0 rounded-mh-card border border-mh-border bg-mh-surface shadow-mh-card ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

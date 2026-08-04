import type { ReactNode } from "react";

// Card base del sistema de diseño nuevo: blanco, borde #ECECEC, radio 16px
// (rounded-2xl de Tailwind), sombra muy sutil. `padded` controla el
// padding de 32px del brief; se puede desactivar cuando el contenido
// interno (ej. una tabla) necesita manejar su propio padding.
export default function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-mh-border bg-mh-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        padded ? "p-8" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

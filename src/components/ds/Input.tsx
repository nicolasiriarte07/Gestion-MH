import type { InputHTMLAttributes, ReactNode } from "react";

// Input base del sistema nuevo: radio 8px (control), borde mh-border,
// foco rosa. `icon` (ej. lupa) se posiciona a la izquierda sin que el
// consumidor tenga que armar el `relative`/`absolute` cada vez.
export default function Input({
  icon,
  className = "",
  error,
  ...rest
}: {
  icon?: ReactNode;
  className?: string;
  error?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  const input = (
    <input
      className={`font-inter w-full rounded-mh-control border bg-mh-surface px-3 py-2.5 text-sm text-mh-ink placeholder:text-mh-ink-muted focus:outline-none ${
        error
          ? "border-mh-danger focus:border-mh-danger"
          : "border-mh-border focus:border-mh-pink"
      } ${icon ? "pl-9" : ""} ${className}`}
      {...rest}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted">
        {icon}
      </span>
      {input}
    </div>
  );
}

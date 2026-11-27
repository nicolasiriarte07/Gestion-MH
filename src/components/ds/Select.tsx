import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

// <select> nativo (accesible y funciona con teclado de entrada) pero
// vestido para que no se note: radio 8px, misma altura que Input,
// chevron propio en vez del nativo del navegador.
export default function Select({
  className = "",
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`font-inter w-full appearance-none rounded-mh-control border border-mh-border bg-mh-surface py-2.5 pr-9 pl-3 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-mh-ink-muted"
      />
    </div>
  );
}

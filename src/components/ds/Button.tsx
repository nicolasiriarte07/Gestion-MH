import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-mh-pink text-white hover:bg-mh-pink-dark",
  secondary: "border border-mh-border bg-mh-surface text-mh-ink shadow-mh-card hover:bg-mh-bg",
  ghost: "text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink",
  danger: "bg-mh-danger text-white hover:bg-red-700",
};

// 36px/40px de alto: cumple el mínimo de 40px de área táctil en md,
// con el padding vertical ya puesto para eso.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
};

// Para un <Link> que debe verse como botón (navegación, no una acción):
// mismas clases que <Button>, sin el elemento <button> en sí.
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = ""
): string {
  return `font-inter inline-flex items-center justify-center rounded-mh-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mh-pink disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

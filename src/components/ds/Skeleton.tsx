// Placeholder de carga: un bloque gris con pulso. `className` define
// ancho/alto/forma (ej. "h-4 w-32 rounded-md", "h-10 w-10 rounded-full").
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-mh-border/70 ${className}`} />;
}

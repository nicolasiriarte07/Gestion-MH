export type SegmentedTabOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

// Tabs segmentadas (pill group): la misma forma visual que ya usaban a
// mano Leads/Clientes, Mundo Hogar/Equipamientos MH, etc., ahora como
// un componente único para no repetir las clases en cada módulo.
export default function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedTabOption<T>[];
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";

  return (
    <div className="font-inter inline-flex items-center gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-xl font-semibold transition-colors ${padding} ${
              active
                ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                : "text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={active ? "ml-1.5 opacity-80" : "ml-1.5"}>({opt.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

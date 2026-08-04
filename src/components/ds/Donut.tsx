// Paleta fija para gráficos del sistema de diseño nuevo: solo rosa/azul
// MH y grises (sin colores fuertes adicionales). El segmento más grande
// va en rosa, el segundo en azul, el resto en grises crecientemente más
// claros.
const SLICE_COLORS = [
  "#f3437e",
  "#00429c",
  "#94a3b8",
  "#cbd5e1",
  "#e2e8f0",
];

const SIZE = 120;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type DonutRow = {
  label: string;
  value: number;
};

export default function Donut({
  rows,
  formatValue,
}: {
  rows: DonutRow[];
  formatValue: (v: number) => string;
}) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  if (total <= 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-mh-ink-muted">
        Sin datos todavía.
      </div>
    );
  }

  // Fracción acumulada de cada fila antes de sí misma (para saber dónde
  // empieza su arco), calculada de forma inmutable con un reduce que
  // arranca en 0 y va sumando la fracción anterior.
  const cumulativeBefore = rows.reduce<number[]>((acc) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    const previousRow = rows[acc.length - 1];
    acc.push(previous + (previousRow ? previousRow.value / total : 0));
    return acc;
  }, []);

  const arcs = rows.map((r, i) => {
    const fraction = r.value / total;
    return {
      ...r,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      dashArray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -cumulativeBefore[i] * CIRCUMFERENCE,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0 -rotate-90">
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={a.color}
            strokeWidth={STROKE}
            strokeDasharray={a.dashArray}
            strokeDashoffset={a.dashOffset}
          />
        ))}
      </svg>
      <div className="min-w-0 flex-1 space-y-3">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-start gap-2 text-sm">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-mh-ink">{a.label}</p>
              <p className="truncate text-xs text-mh-ink-muted">
                {((a.value / total) * 100).toFixed(0)}% · {formatValue(a.value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { itemTitle, itemStatus, statusTone, todayISO, type MarketingItem } from "./normalize";

const TONE_CLASSES = {
  pink: "bg-mh-pink-light text-mh-pink hover:bg-mh-pink/20",
  blue: "bg-mh-blue-light text-mh-blue hover:bg-mh-blue/20",
} as const;

const DOT_CLASSES = {
  blue: "bg-mh-blue",
  green: "bg-emerald-500",
  gray: "bg-slate-400",
  pink: "bg-mh-pink",
  amber: "bg-amber-500",
  red: "bg-red-500",
} as const;

// El color del chip distingue Orgánico (rosa) de Pauta (azul) — no hay
// campo de "canal" real para colorear por plataforma. El puntito
// muestra el estado derivado (ver normalize.ts).
export default function MarketingChip({
  item,
  onClick,
  dense = false,
}: {
  item: MarketingItem;
  onClick: () => void;
  dense?: boolean;
}) {
  const status = itemStatus(item, todayISO());
  return (
    <button
      onClick={onClick}
      title={itemTitle(item)}
      className={`flex w-full items-center gap-1.5 truncate rounded-lg px-2 py-1 text-left text-xs font-semibold ${TONE_CLASSES[item.kind === "post" ? "pink" : "blue"]} ${dense ? "" : "py-1.5"}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[statusTone(status)]}`} />
      <span className="truncate">{itemTitle(item)}</span>
    </button>
  );
}

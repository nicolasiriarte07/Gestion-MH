import { Clock } from "lucide-react";
import Card from "@/components/ds/Card";
import { CONTACT_STAGES, type ContactStage } from "@/lib/types";
import { STAGE_LABELS, STAGE_TONE_CLASSES } from "./contactStages";

export default function ContactsStageBoard({
  stageCounts,
  dueTodayCount,
}: {
  stageCounts: Record<ContactStage, number>;
  dueTodayCount: number;
}) {
  return (
    <Card padding="sm" className="font-inter">
      <div className="flex flex-wrap items-center gap-2">
        {CONTACT_STAGES.map((stage) => (
          <div
            key={stage}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${STAGE_TONE_CLASSES[stage]}`}
          >
            <span>{STAGE_LABELS[stage]}</span>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-extrabold">
              {stageCounts[stage]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700">
          <Clock size={14} />
          <span>Toca seguir hoy</span>
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-extrabold">
            {dueTodayCount}
          </span>
        </div>
      </div>
    </Card>
  );
}

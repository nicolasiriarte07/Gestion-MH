import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="font-inter flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mh-bg text-mh-ink-muted">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-mh-ink">{title}</p>
        {description && <p className="max-w-xs text-sm text-mh-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

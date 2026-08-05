import Link from "next/link";
import { Plus } from "lucide-react";
import NotificationsBell from "@/components/ds/NotificationsBell";

export default function ClientesHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          Clientes
        </h1>
        <p className="mt-1 text-sm font-medium text-mh-ink-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell />
        <Link
          href="/ventas/import"
          title="Un cliente nuevo se da de alta importando su primera venta"
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Nuevo cliente
        </Link>
      </div>
    </div>
  );
}

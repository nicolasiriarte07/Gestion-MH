import Link from "next/link";
import { Plus } from "lucide-react";
import DateRangePicker from "@/components/ds/DateRangePicker";
import NotificationsBell from "@/components/ds/NotificationsBell";
import { buttonClasses } from "@/components/ds/Button";

// El nombre está fijo (no viene de un perfil de usuario real: la app es
// de un solo usuario autenticado, ver README). Si en algún momento hay
// más de un usuario o un nombre configurable, esto pasa a ser un prop.
export default function InicioHeader({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-inter text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          ¡Hola, Nicolás! 👋
        </h1>
        <p className="font-inter mt-1 text-sm font-medium text-mh-ink-muted">
          Bienvenido al panel de gestión de Mundo Hogar
        </p>
      </div>

      <div className="font-inter flex items-center gap-3">
        <DateRangePicker from={from} to={to} />
        <NotificationsBell />
        <Link href="/ventas/import" className={buttonClasses("primary", "md", "shadow-mh-card")}>
          <Plus size={16} />
          Nueva venta
        </Link>
      </div>
    </div>
  );
}

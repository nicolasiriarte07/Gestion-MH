"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import type { EquipamientoContact } from "@/lib/types";
import Button, { buttonClasses } from "@/components/ds/Button";
import SaleFormModal from "./SaleFormModal";

export default function SalesHeader({
  categoryOptions,
  contacts,
  unlinkedCount,
}: {
  categoryOptions: string[];
  contacts: EquipamientoContact[];
  unlinkedCount: number;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-inter text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          Ventas MH Equipamientos
        </h1>
        <p className="font-inter mt-1 text-sm font-medium text-mh-ink-muted">
          Gestión de ventas de EQUIPAMIENTOS MH
        </p>
      </div>

      <div className="flex items-center gap-2">
        {unlinkedCount > 0 && (
          <Link
            href="/ventas-equipamientos/vincular"
            className={buttonClasses("secondary")}
          >
            <Link2 size={16} />
            Vincular contactos ({unlinkedCount})
          </Link>
        )}
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
          Nueva venta
        </Button>
      </div>

      {creating && (
        <SaleFormModal
          sale={null}
          categoryOptions={categoryOptions}
          contacts={contacts}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

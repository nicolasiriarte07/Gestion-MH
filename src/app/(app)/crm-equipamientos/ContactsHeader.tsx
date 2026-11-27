"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/ds/Button";
import ContactFormModal from "./ContactFormModal";

export default function ContactsHeader() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-inter text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          CRM Equipamientos
        </h1>
        <p className="font-inter mt-1 text-sm font-medium text-mh-ink-muted">
          Contactos comerciales de EQUIPAMIENTOS MH
        </p>
      </div>

      <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
        Nuevo contacto
      </Button>

      {creating && (
        <ContactFormModal
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

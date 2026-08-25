"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

      <button
        onClick={() => setCreating(true)}
        className="font-inter flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
      >
        <Plus size={16} />
        Nuevo contacto
      </button>

      {creating && (
        <ContactFormModal
          contact={null}
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

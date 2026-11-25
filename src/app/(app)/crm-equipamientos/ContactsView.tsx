"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactCategory, EquipamientoSale } from "@/lib/types";
import ContactsHeader from "./ContactsHeader";
import ContactFilterBar from "./ContactFilterBar";
import FollowUpBanner from "./FollowUpBanner";
import LeadsKanbanView from "./LeadsKanbanView";
import ClientsTable from "./ClientsTable";
import ContactDrawer from "./ContactDrawer";
import type { ContactRow } from "./contactRow";

type SubTab = "leads" | "clientes";

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function ContactsView({
  rows,
  cities,
  salesByContactId,
}: {
  rows: ContactRow[];
  cities: string[];
  salesByContactId: Record<string, EquipamientoSale[]>;
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("leads");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ContactCategory | "">("");
  const [city, setCity] = useState("");
  const [viewingContactId, setViewingContactId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const needleDigits = normalizePhoneDigits(search);
      result = result.filter((c) => {
        if (c.name.toLowerCase().includes(needle)) return true;
        if (c.phone?.toLowerCase().includes(needle)) return true;
        if (needleDigits && c.phone && normalizePhoneDigits(c.phone).includes(needleDigits)) {
          return true;
        }
        return false;
      });
    }
    if (category) result = result.filter((c) => c.category === category);
    if (city) result = result.filter((c) => c.city === city);
    return result;
  }, [rows, search, category, city]);

  const leadRows = useMemo(
    () =>
      filteredRows.filter(
        (c) => c.etapa === "lead" || c.etapa === "contactado" || c.etapa === "cotizado"
      ),
    [filteredRows]
  );
  const lostRows = useMemo(() => filteredRows.filter((c) => c.etapa === "perdido"), [filteredRows]);
  const clientRows = useMemo(() => filteredRows.filter((c) => c.etapa === "cliente"), [filteredRows]);

  const viewingContact = rows.find((r) => r.id === viewingContactId) ?? null;

  return (
    <div className="font-inter space-y-6">
      <ContactsHeader />

      <FollowUpBanner rows={rows} onSelect={setViewingContactId} />

      <ContactFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        city={city}
        onCityChange={setCity}
        cities={cities}
        onClear={() => {
          setSearch("");
          setCategory("");
          setCity("");
        }}
      />

      <div className="inline-flex gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <button
          onClick={() => setSubTab("leads")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            subTab === "leads"
              ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
          }`}
        >
          Leads ({leadRows.length})
        </button>
        <button
          onClick={() => setSubTab("clientes")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            subTab === "clientes"
              ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
          }`}
        >
          Clientes ({clientRows.length})
        </button>
      </div>

      {subTab === "leads" ? (
        <LeadsKanbanView rows={leadRows} lostRows={lostRows} onOpenContact={setViewingContactId} />
      ) : (
        <ClientsTable rows={clientRows} onOpenContact={setViewingContactId} />
      )}

      <ContactDrawer
        key={viewingContact?.id ?? "none"}
        contact={viewingContact}
        sales={viewingContact ? (salesByContactId[viewingContact.id] ?? []) : []}
        onClose={() => setViewingContactId(null)}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}

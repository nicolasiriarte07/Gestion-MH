"use client";

import { useMemo, useState } from "react";
import { Users, CalendarCheck, CalendarClock } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import type { ContactCategory, ContactStage, EquipamientoSale } from "@/lib/types";
import ContactsHeader from "./ContactsHeader";
import ContactFilterBar from "./ContactFilterBar";
import ContactsStageBoard from "./ContactsStageBoard";
import ContactsTable, { type ContactRow } from "./ContactsTable";
import { needsFollowUpToday, todayISO } from "./followUp";

export default function ContactsView({
  rows,
  totalCount,
  contactedThisWeek,
  staleCount,
  stageCounts,
  dueTodayCount,
  salesByContactId,
}: {
  rows: ContactRow[];
  totalCount: number;
  contactedThisWeek: number;
  staleCount: number;
  stageCounts: Record<ContactStage, number>;
  dueTodayCount: number;
  salesByContactId: Record<string, EquipamientoSale[]>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ContactCategory | "">("");
  const [stage, setStage] = useState<ContactStage | "">("");
  const [dueToday, setDueToday] = useState(false);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          (c.business_name ?? "").toLowerCase().includes(needle) ||
          (c.city ?? "").toLowerCase().includes(needle)
      );
    }
    if (category) {
      result = result.filter((c) => c.category === category);
    }
    if (stage) {
      result = result.filter((c) => c.etapa === stage);
    }
    if (dueToday) {
      const today = todayISO();
      result = result.filter((c) => needsFollowUpToday(c, today));
    }
    return result;
  }, [rows, search, category, stage, dueToday]);

  return (
    <div className="font-inter space-y-8">
      <ContactsHeader />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard icon={Users} tone="pink" label="Contactos totales" value={String(totalCount)} />
        <KpiCard
          icon={CalendarCheck}
          tone="blue"
          label="Contactados esta semana"
          value={String(contactedThisWeek)}
        />
        <KpiCard
          icon={CalendarClock}
          tone="amber"
          label="Sin contacto reciente"
          value={String(staleCount)}
          sublabel="hace más de 30 días o nunca"
        />
      </div>

      <ContactsStageBoard stageCounts={stageCounts} dueTodayCount={dueTodayCount} />

      <ContactFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        stage={stage}
        onStageChange={setStage}
        dueToday={dueToday}
        onDueTodayChange={setDueToday}
        onClear={() => {
          setSearch("");
          setCategory("");
          setStage("");
          setDueToday(false);
        }}
      />

      <ContactsTable rows={filteredRows} salesByContactId={salesByContactId} />
    </div>
  );
}

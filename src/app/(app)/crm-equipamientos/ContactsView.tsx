"use client";

import { useMemo, useState } from "react";
import { Users, CalendarCheck, CalendarClock } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import type { ContactCategory } from "@/lib/types";
import ContactsHeader from "./ContactsHeader";
import ContactFilterBar from "./ContactFilterBar";
import ContactsTable, { type ContactRow } from "./ContactsTable";

export default function ContactsView({
  rows,
  totalCount,
  contactedThisWeek,
  staleCount,
}: {
  rows: ContactRow[];
  totalCount: number;
  contactedThisWeek: number;
  staleCount: number;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ContactCategory | "">("");

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
    return result;
  }, [rows, search, category]);

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

      <ContactFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        onClear={() => {
          setSearch("");
          setCategory("");
        }}
      />

      <ContactsTable rows={filteredRows} />
    </div>
  );
}

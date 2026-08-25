import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { EquipamientoContact } from "@/lib/types";
import ContactsView from "./ContactsView";

const RECENT_CONTACT_DAYS = 7;
const STALE_CONTACT_DAYS = 30;

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function CrmEquipamientosPage() {
  const supabase = await createClient();

  const { data: contacts } = await fetchAllRows<EquipamientoContact>((from, to) =>
    supabase
      .from("equipamientos_contacts")
      .select("*")
      .order("name", { ascending: true })
      .range(from, to)
  );

  const rows = contacts ?? [];

  const recentThreshold = daysAgoISO(RECENT_CONTACT_DAYS);
  const staleThreshold = daysAgoISO(STALE_CONTACT_DAYS);

  const totalCount = rows.length;
  const contactedThisWeek = rows.filter(
    (c) => c.last_contact_date && c.last_contact_date >= recentThreshold
  ).length;
  const staleCount = rows.filter(
    (c) => !c.last_contact_date || c.last_contact_date < staleThreshold
  ).length;

  return (
    <ContactsView
      rows={rows}
      totalCount={totalCount}
      contactedThisWeek={contactedThisWeek}
      staleCount={staleCount}
    />
  );
}

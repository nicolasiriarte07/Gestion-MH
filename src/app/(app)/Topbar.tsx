"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, ShoppingCart, Contact, PackagePlus, Package } from "lucide-react";
import Avatar from "@/components/ds/Avatar";
import DropdownMenu from "@/components/ds/DropdownMenu";
import { useCommandPalette } from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";

const MODULE_LABELS: Record<string, string> = {
  "": "Inicio",
  ventas: "Ventas",
  inventario: "Inventario",
  clientes: "Clientes",
  proveedores: "Proveedores",
  compras: "Compras",
  marketing: "Marketing",
  "crm-equipamientos": "CRM Equipamientos",
  "ventas-equipamientos": "Ventas Equipamientos",
  "simulador-web": "Simulador Web",
  descuentos: "Descuentos",
};

function humanize(segment: string): string {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function breadcrumbFor(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [MODULE_LABELS[""]];
  const [first, ...rest] = segments;
  const crumbs = [MODULE_LABELS[first] ?? humanize(first)];
  for (const seg of rest) crumbs.push(humanize(seg));
  return crumbs;
}

export default function Topbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const openPalette = useCommandPalette();
  const crumbs = breadcrumbFor(pathname);

  return (
    <header className="font-inter sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-mh-border bg-mh-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-1 text-sm font-semibold text-mh-ink">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1 truncate">
            {i > 0 && <span className="text-mh-ink-muted">/</span>}
            <span className={i === crumbs.length - 1 ? "text-mh-ink" : "text-mh-ink-muted"}>
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={openPalette}
          className="flex items-center gap-2 rounded-mh-control border border-mh-border bg-mh-bg px-3 py-2 text-xs font-medium text-mh-ink-muted hover:bg-mh-border/40"
        >
          <Search size={15} />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden rounded-md border border-mh-border bg-mh-surface px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
            ⌘K
          </kbd>
        </button>

        <DropdownMenu
          align="right"
          trigger={
            <span className="flex items-center gap-1.5 rounded-mh-control bg-mh-pink px-3.5 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark">
              <Plus size={15} />
              <span className="hidden sm:inline">Nuevo</span>
            </span>
          }
          items={[
            {
              label: "Venta (Equipamientos)",
              icon: <ShoppingCart size={15} />,
              onClick: () => {
                window.location.href = "/ventas-equipamientos";
              },
            },
            {
              label: "Contacto (CRM)",
              icon: <Contact size={15} />,
              onClick: () => {
                window.location.href = "/crm-equipamientos";
              },
            },
            {
              label: "Pedido (Compras)",
              icon: <PackagePlus size={15} />,
              onClick: () => {
                window.location.href = "/compras";
              },
            },
            {
              label: "Producto (Inventario)",
              icon: <Package size={15} />,
              onClick: () => {
                window.location.href = "/inventario";
              },
            },
          ]}
        />

        <ThemeToggle />

        <Link
          href="/"
          className="hidden sm:block"
          title={userEmail}
        >
          <Avatar name={userEmail || "Usuario"} size={32} />
        </Link>
      </div>
    </header>
  );
}

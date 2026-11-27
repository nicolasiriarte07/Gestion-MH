"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  Megaphone,
  ShoppingCart,
  Users,
  Calculator,
  Percent,
  Contact,
  Receipt,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/ds/Select";
import { useBusinessUnit } from "./BusinessUnitContext";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/compras", label: "Compras", icon: PackagePlus },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/crm-equipamientos", label: "CRM Equipamientos", icon: Contact },
  { href: "/ventas-equipamientos", label: "Ventas Equipamientos", icon: Receipt },
  { href: "/simulador-web", label: "Simulador Web", icon: Calculator },
  { href: "/descuentos", label: "Descuentos", icon: Percent },
];

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = userEmail.charAt(0).toUpperCase();
  const [collapsed, setCollapsed] = useState(false);
  const { businessUnits, activeId, setActiveId } = useBusinessUnit();

  useEffect(() => {
    // Se lee después del montaje (no en el render inicial) para que el
    // primer render coincida con el del servidor y evitar un mismatch de
    // hidratación; la preferencia guardada se aplica apenas monta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Debajo de md (tablet chico/celular) el sidebar se oculta del todo:
  // la navegación ahí la da la barra inferior (MobileBottomNav).
  const widthClass = collapsed ? "md:w-[76px]" : "md:w-64";
  const showLabels = !collapsed;

  return (
    <aside
      className={`font-inter sticky top-0 hidden h-screen shrink-0 flex-col border-r border-mh-border bg-mh-surface transition-[width] duration-200 md:flex ${widthClass}`}
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mh-pink text-sm font-extrabold text-white">
          MH
        </span>
        {showLabels && (
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-extrabold tracking-tight text-mh-ink">
              MUNDO HOGAR
            </p>
            <p className="truncate text-[11px] leading-tight font-medium tracking-wide text-mh-ink-muted uppercase">
              Viví tu hogar
            </p>
          </div>
        )}
      </div>

      {businessUnits.length > 0 && (
        <div className="px-3 pb-3">
          {showLabels ? (
            <Select
              value={activeId ?? ""}
              onChange={(e) => setActiveId(e.target.value || null)}
              className="text-xs"
            >
              <option value="">Todas las unidades</option>
              {businessUnits.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.name}
                </option>
              ))}
            </Select>
          ) : (
            <div
              title="Unidad de negocio"
              className="flex h-9 items-center justify-center rounded-mh-control bg-mh-bg text-[11px] font-bold text-mh-ink-muted"
            >
              UN
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-mh-pink-light text-mh-pink"
                  : "text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink"
              }`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {showLabels && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir menú" : "Retraer menú"}
        className={`mx-3 mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-mh-ink-muted transition-colors hover:bg-mh-bg hover:text-mh-ink ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && "Retraer menú"}
      </button>

      <div className="mx-3 mb-3 space-y-3 border-t border-mh-border pt-3">
        <div
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-mh-ink-muted ${
            collapsed ? "justify-center" : ""
          }`}
          title="Centro de ayuda"
        >
          <CircleHelp size={18} className="shrink-0" />
          {showLabels && <span>Centro de ayuda</span>}
        </div>

        <div
          className={`flex items-center gap-2.5 rounded-xl bg-mh-bg p-2.5 ${
            collapsed ? "flex-col" : ""
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mh-pink text-xs font-extrabold text-white">
            {initial}
          </span>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-mh-ink">Nicolás Iriarte</p>
              <p className="truncate text-[11px] text-mh-ink-muted">Administrador</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Salir"
            className="shrink-0 rounded-lg p-1.5 text-mh-ink-muted hover:bg-mh-border/60 hover:text-mh-ink"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

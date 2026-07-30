"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Megaphone,
  ShoppingCart,
  Users,
  Calculator,
  Percent,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/simulador-web", label: "Simulador Web", icon: Calculator },
  { href: "/descuentos", label: "Descuentos", icon: Percent },
];

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const initial = userEmail.charAt(0).toUpperCase();
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand font-heading text-sm font-bold text-white">
          MH
        </span>
        {!collapsed && (
          <span className="truncate font-heading text-sm font-bold tracking-tight text-slate-900">
            MUNDO HOGAR
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-heading text-xs font-semibold tracking-wide uppercase transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir menú" : "Retraer menú"}
        className={`mx-3 mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && "Retraer menú"}
      </button>

      <div
        className={`m-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 ${
          collapsed ? "flex-col" : ""
        }`}
      >
        <span
          title={collapsed ? userEmail : undefined}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light font-heading text-xs font-bold text-brand-dark"
        >
          {initial}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
            {userEmail}
          </span>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}

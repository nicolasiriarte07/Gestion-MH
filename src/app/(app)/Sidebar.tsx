"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CircleHelp,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/simulador-web", label: "Simulador Web", icon: Calculator },
  { href: "/descuentos", label: "Descuentos", icon: Percent },
];

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Debajo de md (tablet chico/celular) el sidebar es siempre solo-íconos
  // (76px), sin importar la preferencia de escritorio guardada: a 256px
  // de ancho no entraba ni el contenido de Inicio en un celular. El
  // toggle "retraer/expandir" solo tiene efecto visual en md hacia
  // arriba, así que se oculta en mobile para no mostrar un control que
  // ahí no hace nada.
  const widthClass = collapsed ? "w-[76px]" : "w-[76px] md:w-64";
  const showLabels = !collapsed;

  return (
    <aside
      className={`font-inter sticky top-0 flex h-screen shrink-0 flex-col bg-mh-pink transition-[width] duration-200 ${widthClass}`}
    >
      <div className="flex items-center gap-3 px-5 py-7">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-mh-pink">
          MH
        </span>
        {showLabels && (
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm leading-tight font-extrabold tracking-tight text-white">
              MUNDO HOGAR
            </p>
            <p className="truncate text-[11px] leading-tight font-medium tracking-wide text-white/70 uppercase">
              Viví tu hogar
            </p>
          </div>
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                collapsed ? "justify-center" : "justify-center md:justify-start"
              } ${
                active
                  ? "bg-white text-mh-pink shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {showLabels && <span className="hidden md:inline">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir menú" : "Retraer menú"}
        className={`mx-3 mb-1 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white md:flex ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && "Retraer menú"}
      </button>

      <div className="mx-3 mb-3 space-y-3 border-t border-white/15 pt-3">
        <div
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-white/85 ${
            collapsed ? "justify-center" : "justify-center md:justify-start"
          }`}
          title="Centro de ayuda"
        >
          <CircleHelp size={18} className="shrink-0" />
          {showLabels && <span className="hidden md:inline">Centro de ayuda</span>}
        </div>

        <div
          className={`flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5 ${
            collapsed ? "flex-col" : "flex-col md:flex-row"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-mh-pink">
            {initial}
          </span>
          {showLabels && (
            <div className="hidden min-w-0 flex-1 md:block">
              <p className="truncate text-xs font-semibold text-white">
                Nicolás Iriarte
              </p>
              <p className="truncate text-[11px] text-white/70">
                Administrador
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Salir"
            className="shrink-0 rounded-lg p-1.5 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

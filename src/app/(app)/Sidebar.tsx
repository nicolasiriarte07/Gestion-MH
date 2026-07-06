"use client";

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
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const initial = userEmail.charAt(0).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand font-heading text-sm font-bold text-white">
          MH
        </span>
        <span className="font-heading text-sm font-bold tracking-tight text-slate-900">
          MUNDO HOGAR
        </span>
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-heading text-xs font-semibold tracking-wide uppercase transition-colors ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light font-heading text-xs font-bold text-brand-dark">
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
          {userEmail}
        </span>
        <LogoutButton />
      </div>
    </aside>
  );
}

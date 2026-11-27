"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Contact,
  PackagePlus,
  type LucideIcon,
} from "lucide-react";

// Los 5 módulos de uso diario, para no saturar una barra angosta.
// El resto queda accesible desde el buscador (Cmd/Ctrl+K) o navegando
// a /, que sí tiene el sidebar completo en escritorio.
const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/inventario", label: "Stock", icon: Package },
  { href: "/crm-equipamientos", label: "CRM", icon: Contact },
  { href: "/compras", label: "Compras", icon: PackagePlus },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="font-inter fixed right-0 bottom-0 left-0 z-40 flex items-stretch border-t border-mh-border bg-mh-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              active ? "text-mh-pink" : "text-mh-ink-muted"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

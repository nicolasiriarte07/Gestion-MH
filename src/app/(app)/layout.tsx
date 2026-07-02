import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/inventario", label: "Inventario" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/marketing", label: "Marketing" },
  { href: "/ventas", label: "Ventas" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand shadow-sm">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <span className="font-heading text-base font-bold tracking-tight text-white">
              MUNDO HOGAR
            </span>
            <nav className="flex gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/80">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

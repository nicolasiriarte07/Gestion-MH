import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit } from "@/lib/types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";
import { BusinessUnitProvider } from "./BusinessUnitContext";
import { CommandPaletteProvider } from "./CommandPalette";
import { ToastProvider } from "@/components/ds/Toast";

// Tipografía del sistema de diseño nuevo. Se carga acá (no en el layout
// raíz) para no afectar /login, y se expone solo como variable CSS: los
// módulos viejos siguen con Sora (font-sora/heredada del body) salvo que
// pidan explícitamente `font-inter` (lo hacen el Sidebar y Inicio).
const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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

  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name")
    .order("name");

  return (
    <div className={`flex min-h-screen ${inter.variable}`}>
      <BusinessUnitProvider businessUnits={(businessUnits ?? []) as BusinessUnit[]}>
        <ToastProvider>
          <CommandPaletteProvider>
            <Sidebar userEmail={user.email ?? ""} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar userEmail={user.email ?? ""} />
              <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">
                <div className="mx-auto w-full max-w-[1800px] px-6 py-6 sm:px-8">
                  {children}
                </div>
              </main>
            </div>
            <MobileBottomNav />
          </CommandPaletteProvider>
        </ToastProvider>
      </BusinessUnitProvider>
    </div>
  );
}

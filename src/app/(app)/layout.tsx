import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";

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

  return (
    <div className={`flex min-h-screen ${inter.variable}`}>
      <Sidebar userEmail={user.email ?? ""} />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1800px] px-6 py-6 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

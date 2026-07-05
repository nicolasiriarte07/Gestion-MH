"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export default function CustomerSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      router.push(pathname);
      return;
    }
    router.push(`${pathname}?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <Search size={18} className="shrink-0 text-slate-400" />
      <input
        type="text"
        placeholder="Buscar cliente por nombre..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Buscar
      </button>
    </form>
  );
}

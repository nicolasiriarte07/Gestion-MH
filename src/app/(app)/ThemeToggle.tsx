"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "mh-theme";

function resolveIsDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Botón sol/luna: alterna un data-theme explícito en <html> (persistido),
// que pisa la preferencia del sistema en cualquier sentido (ver
// globals.css). Sin estado "system" aparte para no complicar la UI con
// un tercer estado que casi nadie usa.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(resolveIsDark());
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mh-control text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

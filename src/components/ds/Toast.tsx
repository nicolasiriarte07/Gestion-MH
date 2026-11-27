"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

type ToastInput = {
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: string };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_ICON_CLASSES: Record<ToastTone, string> = {
  success: "text-mh-success",
  error: "text-mh-danger",
  info: "text-mh-info",
};

// Toasts apilados abajo a la derecha (abajo centro en mobile), con
// salida automática y una acción opcional ("Deshacer").
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.durationMs ?? 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="font-inter fixed right-4 bottom-4 left-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = TONE_ICONS[t.tone ?? "success"];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-mh-border bg-mh-surface px-4 py-3 text-sm font-medium text-mh-ink shadow-xl"
              >
                <Icon size={17} className={`shrink-0 ${TONE_ICON_CLASSES[t.tone ?? "success"]}`} />
                <span className="min-w-0 flex-1">{t.message}</span>
                {t.actionLabel && (
                  <button
                    onClick={() => {
                      t.onAction?.();
                      dismiss(t.id);
                    }}
                    className="shrink-0 font-bold text-mh-pink hover:text-mh-pink-dark"
                  >
                    {t.actionLabel}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (toast: ToastInput) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { BusinessUnit } from "@/lib/types";

const STORAGE_KEY = "mh-active-business-unit";

type BusinessUnitContextValue = {
  businessUnits: BusinessUnit[];
  activeId: string | null;
  activeUnit: BusinessUnit | null;
  setActiveId: (id: string | null) => void;
};

const BusinessUnitContext = createContext<BusinessUnitContextValue | null>(null);

// Selector global de unidad de negocio (Sidebar): guarda la elección en
// localStorage para que se recuerde entre visitas. Por ahora es solo el
// estado + la UI del selector — cada módulo empieza a leerlo (vía
// useBusinessUnit) y a filtrar sus propios datos en su propia etapa de
// rediseño, no todos de una vez.
export function BusinessUnitProvider({
  businessUnits,
  children,
}: {
  businessUnits: BusinessUnit[];
  children: ReactNode;
}) {
  const [activeId, setActiveIdState] = useState<string | null>(null);

  useEffect(() => {
    // Se lee después del montaje para no desalinear el render del
    // servidor (mismo motivo que el colapso del Sidebar).
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && businessUnits.some((bu) => bu.id === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIdState(stored);
    }
  }, [businessUnits]);

  function setActiveId(id: string | null) {
    setActiveIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  const activeUnit = businessUnits.find((bu) => bu.id === activeId) ?? null;

  return (
    <BusinessUnitContext.Provider value={{ businessUnits, activeId, activeUnit, setActiveId }}>
      {children}
    </BusinessUnitContext.Provider>
  );
}

export function useBusinessUnit(): BusinessUnitContextValue {
  const ctx = useContext(BusinessUnitContext);
  if (!ctx) throw new Error("useBusinessUnit debe usarse dentro de <BusinessUnitProvider>");
  return ctx;
}

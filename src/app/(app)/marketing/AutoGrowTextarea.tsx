"use client";

import { useEffect, useRef } from "react";

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// <input> corta el texto que no entra en el ancho fijo de la columna
// (ver bug reportado en Concepto). Este textarea envuelve el texto y
// crece verticalmente para mostrarlo completo, sin agrandar el ancho
// de la columna.
export default function AutoGrowTextarea({
  className,
  defaultValue,
  onBlur,
}: {
  className?: string;
  defaultValue: string;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [defaultValue]);

  return (
    <textarea
      ref={ref}
      rows={1}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      defaultValue={defaultValue}
      onInput={(e) => resize(e.currentTarget)}
      onBlur={onBlur}
    />
  );
}

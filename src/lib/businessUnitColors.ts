// Colores fijos de marca para las dos unidades de negocio, reutilizados en
// cualquier gráfico que las distinga por identidad (ver skill de dataviz
// para el resto de la paleta categórica/secuencial). Restringidos a la
// paleta del sistema de diseño nuevo (rosa/azul MH + grises/verde/rojo/
// amarillo) — el violeta que tenía "EQUIPAMIENTOS MH" antes no es parte
// de esa paleta.
export const BUSINESS_UNIT_COLORS: Record<string, string> = {
  "MUNDO HOGAR": "#f3437e",
  "EQUIPAMIENTOS MH": "#2a78d6",
};

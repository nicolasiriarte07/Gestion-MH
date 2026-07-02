import ImportForm from "./ImportForm";

// Importar 12 mil+ filas de ventas puede tardar más que el límite por
// defecto de la plataforma; el máximo real depende de tu plan de Vercel
// (Hobby permite hasta 60s).
export const maxDuration = 60;

export default function VentasImportPage() {
  return <ImportForm />;
}

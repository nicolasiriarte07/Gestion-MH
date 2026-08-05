// Círculo con iniciales para entidades sin foto/logo real (ej. proveedores:
// no hay campo de logo en la base). El tono rota entre rosa/azul/gris según
// el nombre para que una lista larga sea más fácil de escanear, sin salirse
// de la paleta permitida.
const TONES = [
  "bg-mh-pink-light text-mh-pink",
  "bg-mh-blue-light text-mh-blue",
  "bg-slate-100 text-slate-600",
] as const;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % TONES.length;
  return TONES[hash];
}

export default function Avatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${toneFor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

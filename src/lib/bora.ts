export const SLOGAN = "Conectou, combinou, trabalhou!";

export const CATEGORIAS = [
  { id: "faxina", nome: "Faxina", icon: "🧽" },
  { id: "diarista", nome: "Diarista", icon: "🏠" },
  { id: "eletricista", nome: "Eletricista", icon: "💡" },
  { id: "frete", nome: "Fretes", icon: "🚚" },
  { id: "trancista", nome: "Trancista", icon: "💇🏾‍♀️" },
  { id: "manicure", nome: "Manicure", icon: "💅" },
  { id: "cilios", nome: "Cílios", icon: "👁️" },
  { id: "ajudante", nome: "Ajudante", icon: "🤝" },
  { id: "auxiliar", nome: "Auxiliar geral", icon: "🛠️" },
] as const;

export const cat = (id: string) => CATEGORIAS.find((c) => c.id === id) ?? { id, nome: id, icon: "✨" };

export function tocarSlogan() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(SLOGAN);
  u.lang = "pt-BR";
  u.rate = 1.05;
  u.pitch = 1.2;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export const soDigitos = (s: string) => s.replace(/\D/g, "");

export function tempo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

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

function batida(ctx: AudioContext, t: number) {
  // bumbo (kick)
  const kick = ctx.createOscillator();
  const kg = ctx.createGain();
  kick.frequency.setValueAtTime(150, t);
  kick.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  kg.gain.setValueAtTime(0.9, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  kick.connect(kg).connect(ctx.destination);
  kick.start(t);
  kick.stop(t + 0.2);
  // palma (clap)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const clap = ctx.createBufferSource();
  clap.buffer = buf;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.5, t + 0.22);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  clap.connect(cg).connect(ctx.destination);
  clap.start(t + 0.22);
  // chimbal
  const hh = ctx.createBufferSource();
  hh.buffer = buf;
  const hg = ctx.createGain();
  hg.gain.setValueAtTime(0.18, t + 0.11);
  hg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  hh.connect(hg).connect(ctx.destination);
  hh.start(t + 0.11);
}

function falarTrecho(texto: string, atrasoMs: number) {
  window.setTimeout(() => {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    u.rate = 1.0;
    u.pitch = 1.3;
    window.speechSynthesis.speak(u);
  }, atrasoMs);
}

export function tocarSlogan() {
  if (typeof window === "undefined") return;
  const TEMPO = 640; // ms por tempo do ritmo
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      const ctx = new AC();
      const t0 = ctx.currentTime + 0.05;
      for (let i = 0; i < 4; i++) batida(ctx, t0 + (i * TEMPO) / 1000);
      window.setTimeout(() => ctx.close(), 4 * TEMPO + 600);
    }
  } catch {
    /* sem áudio, só a voz */
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    falarTrecho("Conectou!", 120);
    falarTrecho("combinou!", TEMPO + 120);
    falarTrecho("trabalhou!", 2 * TEMPO + 120);
  }
}

export const soDigitos = (s: string) => s.replace(/\D/g, "");

export function tempo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

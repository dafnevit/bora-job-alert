export const SLOGAN = "Conectou, combinou, trabalhou!";

export const CATEGORIAS = [
  { id: "faxina", nome: "Faxina", icon: "🧽" },
  { id: "diarista", nome: "Diarista", icon: "🏠" },
  { id: "eletricista", nome: "Eletricista", icon: "💡" },
  { id: "hidraulica", nome: "Hidráulica", icon: "🚰" },
] as const;

export const cat = (id: string) => CATEGORIAS.find((c) => c.id === id) ?? { id, nome: id, icon: "✨" };

import jingle from "@/assets/jingle-slogan.mp3.asset.json";

function ruido(ctx: AudioContext) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  return buf;
}

function kick(ctx: AudioContext, dest: AudioNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
  g.gain.setValueAtTime(1.0, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.25);
}

function caixa(ctx: AudioContext, dest: AudioNode, buf: AudioBuffer, t: number) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  s.connect(f).connect(g).connect(dest);
  s.start(t);
}

function chimbal(ctx: AudioContext, dest: AudioNode, buf: AudioBuffer, t: number, aberto = false) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + (aberto ? 0.3 : 0.05));
  s.connect(f).connect(g).connect(dest);
  s.start(t);
}

function baixo(ctx: AudioContext, dest: AudioNode, t: number, nota: number) {
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.value = nota;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  o.connect(f).connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.26);
}

// Batida pop ~118 BPM: bumbo nos 4 tempos, caixa no contratempo, chimbal em colcheias e linha de baixo
function batidaPop(ctx: AudioContext, dest: AudioNode, t0: number, compassos: number) {
  const buf = ruido(ctx);
  const SEM = 60 / 118 / 2; // colcheia
  const linhaBaixo = [55, 55, 65.4, 49]; // Lá, Lá, Dó, Sol
  for (let c = 0; c < compassos; c++) {
    const base = t0 + c * 8 * SEM;
    for (let i = 0; i < 8; i++) {
      const t = base + i * SEM;
      if (i % 2 === 0) kick(ctx, dest, t); // bumbo nos tempos
      if (i === 2 || i === 6) caixa(ctx, dest, buf, t); // caixa no 2 e 4
      chimbal(ctx, dest, buf, t, i === 7);
      baixo(ctx, dest, t, linhaBaixo[c % linhaBaixo.length]!);
    }
  }
}

function vozReserva() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(SLOGAN);
  u.lang = "pt-BR";
  u.rate = 1.0;
  u.pitch = 0.8; // mais grave, masculina
  const vozes = window.speechSynthesis.getVoices();
  const masc = vozes.find((v) => v.lang.startsWith("pt") && /male|mascul|daniel|felipe|ricardo/i.test(v.name));
  if (masc) u.voice = masc;
  window.speechSynthesis.speak(u);
}

export function tocarSlogan() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return vozReserva();
    const ctx = new AC();
    const t0 = ctx.currentTime + 0.06;
    const COMPASSOS = 6;
    const DUR = COMPASSOS * 8 * (60 / 118 / 2) + 0.8;

    // batida pop com leve compressor pra não estourar
    const comp = ctx.createDynamicsCompressor();
    const volBatida = ctx.createGain();
    volBatida.gain.value = 0.9;
    comp.connect(volBatida).connect(ctx.destination);
    batidaPop(ctx, comp, t0, COMPASSOS);

    // voz do jingle (arquivo gerado, voz masculina animada) entra no 2º compasso
    fetch(jingle.url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .then((audio) => {
        const src = ctx.createBufferSource();
        src.buffer = audio;
        const volVoz = ctx.createGain();
        volVoz.gain.value = 1.2;
        src.connect(volVoz).connect(ctx.destination);
        src.start(t0 + 8 * (60 / 118 / 2));
      })
      .catch(vozReserva);

    window.setTimeout(() => ctx.close(), DUR * 1000);
  } catch {
    vozReserva();
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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bora Trabalhar — Conectou, combinou, trabalhou!" },
      { name: "description", content: "App comunitário que liga quem precisa de um serviço a quem quer fazer um bico." },
      { property: "og:title", content: "Bora Trabalhar" },
      { property: "og:description", content: "Conectou, combinou, trabalhou! Bicos e serviços temporários na sua comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIAS = [
  { id: "faxina", nome: "Faxineira", icon: "🧽" },
  { id: "diarista", nome: "Diarista", icon: "🏠" },
  { id: "eletricista", nome: "Eletricista", icon: "💡" },
  { id: "frete", nome: "Fretes", icon: "🚚" },
  { id: "trancista", nome: "Trancista", icon: "💇🏾‍♀️" },
  { id: "manicure", nome: "Manicure", icon: "💅" },
  { id: "cilios", nome: "Extensão de cílios", icon: "👁️" },
  { id: "ajudante", nome: "Ajudante", icon: "🤝" },
  { id: "auxiliar", nome: "Auxiliar diversos", icon: "🛠️" },
];

type Vaga = { id: string; cat: string; titulo: string; bairro: string; valor: string; contato: string; criada: number };

const SEED: Vaga[] = [
  { id: "1", cat: "faxina", titulo: "Faxina em apartamento 2 quartos", bairro: "Centro", valor: "R$ 150", contato: "11999990000", criada: Date.now() - 3600e3 },
  { id: "2", cat: "frete", titulo: "Levar geladeira e sofá", bairro: "Vila Nova", valor: "R$ 120", contato: "11988880000", criada: Date.now() - 7200e3 },
  { id: "3", cat: "trancista", titulo: "Box braids para festa sábado", bairro: "Jardim América", valor: "R$ 250", contato: "11977770000", criada: Date.now() - 9000e3 },
];

const SLOGAN = "Conectou, combinou, trabalhou!";

function tocarSlogan() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(SLOGAN);
  u.lang = "pt-BR";
  u.rate = 1.05;
  u.pitch = 1.2;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const s = localStorage.getItem(key);
    if (s) setV(JSON.parse(s));
    setOk(true);
  }, [key]);
  useEffect(() => {
    if (ok) localStorage.setItem(key, JSON.stringify(v));
  }, [key, v, ok]);
  return [v, setV] as const;
}

function Index() {
  const [aba, setAba] = useState<"bicos" | "publicar">("bicos");
  const [vagas, setVagas] = useLocal<Vaga[]>("bt-vagas", SEED);
  const [interesses, setInteresses] = useLocal<string[]>("bt-interesses", []);
  const vistos = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!vistos.current) {
      vistos.current = new Set(vagas.map((v) => v.id));
      return;
    }
    for (const v of vagas) {
      if (!vistos.current.has(v.id)) {
        vistos.current.add(v.id);
        if (interesses.includes(v.cat)) {
          tocarSlogan();
          toast.success("Vaga compatível pra você!", { description: `${v.titulo} · ${v.bairro} · ${v.valor}` });
        }
      }
    }
  }, [vagas, interesses]);

  const filtradas = interesses.length ? vagas.filter((v) => interesses.includes(v.cat)) : vagas;
  const cat = (id: string) => CATEGORIAS.find((c) => c.id === id)!;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="rounded-b-[2rem] bg-secondary px-6 pb-8 pt-10 text-secondary-foreground">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Bora <span className="text-accent">Trabalhar</span>
        </h1>
        <p className="mt-2 font-semibold text-primary">{SLOGAN}</p>
        <p className="mt-3 text-sm opacity-80">Bicos e serviços na sua comunidade. Quem precisa encontra quem faz.</p>
        <button onClick={tocarSlogan} className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          🔊 Ouvir o aviso de vaga
        </button>
      </header>

      {aba === "bicos" ? (
        <main className="px-5 pt-6">
          <h2 className="text-lg font-bold">O que você sabe fazer?</h2>
          <p className="text-sm text-muted-foreground">Escolha e te avisamos quando surgir vaga compatível.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => {
              const on = interesses.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setInteresses(on ? interesses.filter((i) => i !== c.id) : [...interesses, c.id])}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
                >
                  {c.icon} {c.nome}
                </button>
              );
            })}
          </div>

          <h2 className="mt-8 text-lg font-bold">Vagas {interesses.length ? "pra você" : "abertas"} ({filtradas.length})</h2>
          <div className="mt-3 space-y-3">
            {filtradas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma vaga ainda. Fica de olho, já já aparece!</p>}
            {[...filtradas].sort((a, b) => b.criada - a.criada).map((v) => (
              <article key={v.id} className="animate-pop rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{cat(v.cat).icon} {cat(v.cat).nome}</span>
                    <h3 className="mt-1 font-bold">{v.titulo}</h3>
                    <p className="text-sm text-muted-foreground">📍 {v.bairro}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">{v.valor}</span>
                </div>
                <a
                  href={`https://wa.me/55${v.contato.replace(/\D/g, "")}?text=${encodeURIComponent(`Oi! Vi sua vaga "${v.titulo}" no Bora Trabalhar.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-xl bg-primary py-2.5 text-center font-semibold text-primary-foreground"
                >
                  Combinar no WhatsApp
                </a>
              </article>
            ))}
          </div>
        </main>
      ) : (
        <Publicar
          onPublicar={(v) => {
            setVagas([v, ...vagas]);
            setAba("bicos");
            toast("Vaga publicada! Agora é só aguardar.");
          }}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-2 border-t border-border bg-card p-3">
        {(["bicos", "publicar"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 rounded-xl py-3 font-bold ${aba === a ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
          >
            {a === "bicos" ? "🔎 Quero trabalhar" : "📣 Preciso de alguém"}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Publicar({ onPublicar }: { onPublicar: (v: Vaga) => void }) {
  const [f, setF] = useState({ cat: "faxina", titulo: "", bairro: "", valor: "", contato: "" });
  const campo = "w-full rounded-xl border border-border bg-card px-4 py-3";
  return (
    <form
      className="space-y-3 px-5 pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.titulo || !f.bairro || !f.contato) return toast.error("Preencha título, bairro e WhatsApp");
        onPublicar({ ...f, valor: f.valor || "A combinar", id: crypto.randomUUID(), criada: Date.now() });
      }}
    >
      <h2 className="text-lg font-bold">Publicar uma vaga</h2>
      <select className={campo} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
        {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nome}</option>)}
      </select>
      <input className={campo} placeholder="O que precisa? Ex: faxina pós-obra" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
      <input className={campo} placeholder="Bairro" value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} />
      <input className={campo} placeholder="Valor (ex: R$ 100)" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
      <input className={campo} placeholder="WhatsApp com DDD" inputMode="tel" value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} />
      <button className="w-full rounded-xl bg-primary py-3.5 text-lg font-bold text-primary-foreground">Publicar vaga</button>
    </form>
  );
}

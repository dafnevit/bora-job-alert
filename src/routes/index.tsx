import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORIAS, SLOGAN, cat, soDigitos, tempo, tocarSlogan } from "@/lib/bora";

type Perfil = Database["public"]["Tables"]["profiles"]["Row"];
type Vaga = Database["public"]["Tables"]["vagas"]["Row"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bora Trabalhar — Conectou, combinou, trabalhou!" },
      { name: "description", content: "App da quebrada que liga quem precisa de um serviço a quem quer fazer um bico." },
      { property: "og:title", content: "Bora Trabalhar" },
      { property: "og:description", content: "Conectou, combinou, trabalhou! Bicos e serviços temporários na sua comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => data.subscription.unsubscribe();
  }, []);

  const carregarPerfil = useCallback(async () => {
    if (!session) return setPerfil(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    setPerfil(data);
  }, [session]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  if (session === undefined || (session && !perfil)) return <Splash />;
  if (!session) return <Entrada />;
  if (!perfil!.completo) return <Cadastro perfil={perfil!} onSalvo={carregarPerfil} />;
  return <App perfil={perfil!} onPerfil={carregarPerfil} />;
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Logo />
    </div>
  );
}

function Logo({ big = false }: { big?: boolean }) {
  return (
    <h1 className={`font-extrabold leading-none tracking-tighter ${big ? "text-6xl" : "text-3xl"}`}>
      bora<span className="text-primary">.</span>
      <br className={big ? "" : "hidden"} />
      <span className={big ? "" : "ml-1"}>trabalhar</span>
      <span className="text-accent">!</span>
    </h1>
  );
}

/* ---------------- Entrada / Login ---------------- */

function Entrada() {
  const [modo, setModo] = useState<"entrar" | "criar">("criar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [load, setLoad] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoad(true);
    const r =
      modo === "criar"
        ? await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email, password: senha });
    setLoad(false);
    if (r.error) return void toast.error(traduzErro(r.error.message));
    if (modo === "criar" && !r.data.session) setEnviado(true);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não rolou entrar com Google. Tenta de novo.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <div className="flex-1">
        <span className="inline-block animate-wiggle rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
          bico na quebrada 🔥
        </span>
        <div className="mt-6">
          <Logo big />
        </div>
        <p className="mt-5 text-2xl font-bold text-primary">{SLOGAN}</p>
        <p className="mt-3 text-muted-foreground">
          Quem precisa de um serviço encontra quem faz. Quem quer fazer um bico recebe aviso na hora.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <span key={c.id} className="rounded-full border border-border px-3 py-1 text-sm">
              {c.icon} {c.nome}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-5">
        {enviado ? (
          <div className="text-center">
            <p className="text-4xl">📬</p>
            <p className="mt-2 font-bold">Confere teu e-mail!</p>
            <p className="text-sm text-muted-foreground">Mandamos um link pra confirmar a conta.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
              {(["criar", "entrar"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModo(m)}
                  className={`rounded-xl py-2 text-sm font-bold ${modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {m === "criar" ? "Criar conta" : "Já tenho conta"}
                </button>
              ))}
            </div>
            <form onSubmit={enviar} className="space-y-3">
              <input className="field" type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="field" type="password" required minLength={6} placeholder="Senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} />
              <button disabled={load} className="w-full rounded-2xl bg-hype py-3.5 text-lg font-extrabold text-primary-foreground disabled:opacity-60">
                {load ? "..." : modo === "criar" ? "Bora! 🚀" : "Entrar"}
              </button>
            </form>
            <button onClick={google} className="mt-3 w-full rounded-2xl border border-border py-3 font-semibold">
              Continuar com Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function traduzErro(m: string) {
  if (/invalid login/i.test(m)) return "E-mail ou senha errados.";
  if (/already registered/i.test(m)) return "Esse e-mail já tem conta. Entra por 'Já tenho conta'.";
  if (/not confirmed/i.test(m)) return "Confirma teu e-mail antes de entrar.";
  return m;
}

/* ---------------- Cadastro (perfil) ---------------- */

function Cadastro({ perfil, onSalvo, onCancel }: { perfil: Perfil; onSalvo: () => void; onCancel?: () => void }) {
  const [f, setF] = useState({
    nome: perfil.nome,
    whatsapp: perfil.whatsapp,
    bairro: perfil.bairro,
    tipo: perfil.tipo,
    habilidades: perfil.habilidades,
  });
  const [load, setLoad] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (f.nome.trim().length < 2) return void toast.error("Coloca teu nome");
    if (soDigitos(f.whatsapp).length < 10) return void toast.error("WhatsApp com DDD, tipo 11 99999-9999");
    if (f.bairro.trim().length < 2) return void toast.error("Qual teu bairro?");
    if (f.tipo === "trabalhador" && f.habilidades.length === 0) return void toast.error("Escolhe pelo menos um serviço que você faz");
    setLoad(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...f, nome: f.nome.trim(), bairro: f.bairro.trim(), completo: true })
      .eq("id", perfil.id);
    setLoad(false);
    if (error) return void toast.error("Erro ao salvar, tenta de novo");
    toast.success("Perfil salvo! 🙌");
    onSalvo();
  }

  return (
    <form onSubmit={salvar} className="mx-auto max-w-md space-y-5 px-6 py-8 pb-28">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-accent">{onCancel ? "Editar perfil" : "Último passo"}</p>
        <h2 className="mt-1 text-3xl font-extrabold">Bora te conhecer 👋</h2>
      </div>

      <div>
        <p className="mb-2 font-bold">Você quer...</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["trabalhador", "💪", "Fazer bicos"],
            ["contratante", "📣", "Contratar alguém"],
          ] as const).map(([v, ic, t]) => (
            <button
              type="button"
              key={v}
              onClick={() => setF({ ...f, tipo: v })}
              className={`rounded-3xl border-2 p-4 text-left transition ${f.tipo === v ? "border-primary bg-primary/10" : "border-border bg-card"}`}
            >
              <span className="text-3xl">{ic}</span>
              <p className="mt-2 font-extrabold">{t}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Relaxa: dá pra fazer os dois depois.</p>
      </div>

      <input className="field" placeholder="Seu nome" maxLength={60} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
      <input className="field" placeholder="WhatsApp com DDD" inputMode="tel" maxLength={20} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
      <input className="field" placeholder="Bairro / comunidade" maxLength={60} value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} />

      <div>
        <p className="mb-2 font-bold">{f.tipo === "trabalhador" ? "O que você manda bem?" : "Também faz algum bico? (opcional)"}</p>
        <Chips valor={f.habilidades} onChange={(h) => setF({ ...f, habilidades: h })} />
        <p className="mt-2 text-xs text-muted-foreground">Quando surgir vaga disso, teu celular grita: "{SLOGAN}"</p>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl border border-border py-3.5 font-bold">
            Voltar
          </button>
        )}
        <button disabled={load} className="flex-[2] rounded-2xl bg-hype py-3.5 text-lg font-extrabold text-primary-foreground disabled:opacity-60">
          {load ? "Salvando..." : "Salvar e bora!"}
        </button>
      </div>
    </form>
  );
}

function Chips({ valor, onChange }: { valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIAS.map((c) => {
        const on = valor.includes(c.id);
        return (
          <button
            type="button"
            key={c.id}
            onClick={() => onChange(on ? valor.filter((i) => i !== c.id) : [...valor, c.id])}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {c.icon} {c.nome}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- App logado ---------------- */

type Aba = "bicos" | "publicar" | "minhas" | "perfil" | "admin";

function App({ perfil, onPerfil }: { perfil: Perfil; onPerfil: () => void }) {
  const [aba, setAba] = useState<Aba>(perfil.tipo === "contratante" ? "publicar" : "bicos");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [editando, setEditando] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", perfil.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setAdmin(!!data));
  }, [perfil.id]);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("vagas").select("*").eq("aberta", true).order("created_at", { ascending: false }).limit(200);
    setVagas(data ?? []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const ch = supabase
      .channel("vagas-novas")
      .on("postgres_changes", { event: "*", schema: "public", table: "vagas" }, (p) => {
        if (p.eventType === "INSERT") {
          const v = p.new as Vaga;
          setVagas((old) => (old.some((o) => o.id === v.id) ? old : [v, ...old]));
          if (v.user_id !== perfil.id && perfil.habilidades.includes(v.categoria)) {
            tocarSlogan();
            toast.success(`${cat(v.categoria).icon} Vaga pra você!`, { description: `${v.titulo} · ${v.bairro} · ${v.valor}` });
          }
        } else carregar();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [perfil.id, perfil.habilidades, carregar]);

  if (editando)
    return (
      <Cadastro
        perfil={perfil}
        onCancel={() => setEditando(false)}
        onSalvo={() => {
          setEditando(false);
          onPerfil();
        }}
      />
    );

  const pra_mim = vagas.filter((v) => v.user_id !== perfil.id && perfil.habilidades.includes(v.categoria));
  const outras = vagas.filter((v) => v.user_id !== perfil.id && !perfil.habilidades.includes(v.categoria));
  const minhas = vagas.filter((v) => v.user_id === perfil.id);

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <Logo />
        <button onClick={tocarSlogan} aria-label="Ouvir o aviso" className="rounded-full bg-secondary px-3 py-2 text-sm font-bold">
          🔊
        </button>
      </header>

      {aba === "bicos" && (
        <main className="px-5">
          <div className="rounded-3xl bg-hype p-5 text-primary-foreground">
            <p className="text-sm font-bold opacity-80">E aí, {perfil.nome.split(" ")[0]}!</p>
            <p className="text-2xl font-extrabold leading-tight">
              {pra_mim.length} {pra_mim.length === 1 ? "vaga combina" : "vagas combinam"} com você
            </p>
            <p className="mt-1 text-sm font-semibold">Deixa o app aberto que a gente avisa na hora 🔔</p>
          </div>
          {perfil.habilidades.length === 0 && (
            <button onClick={() => setEditando(true)} className="mt-4 w-full rounded-2xl border border-dashed border-primary p-4 text-left text-sm">
              Você ainda não escolheu o que faz. <b className="text-primary">Escolher agora →</b>
            </button>
          )}
          <Lista titulo="Pra você 🎯" vagas={pra_mim} vazio="Nenhuma vaga do seu corre ainda. Fica ligado!" />
          {outras.length > 0 && <Lista titulo="Outros bicos" vagas={outras} />}
        </main>
      )}

      {aba === "publicar" && (
        <Publicar
          perfil={perfil}
          onOk={() => {
            carregar();
            setAba("minhas");
          }}
        />
      )}

      {aba === "minhas" && (
        <main className="px-5">
          <Lista titulo="Minhas vagas" vagas={minhas} vazio="Você ainda não publicou vaga." dono onMudou={carregar} />
        </main>
      )}

      {aba === "perfil" && (
        <main className="space-y-4 px-5">
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-2xl font-extrabold">{perfil.nome}</p>
            <p className="text-muted-foreground">📍 {perfil.bairro} · 📱 {perfil.whatsapp}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfil.habilidades.map((h) => (
                <span key={h} className="rounded-full bg-secondary px-3 py-1 text-sm">
                  {cat(h).icon} {cat(h).nome}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setEditando(true)} className="w-full rounded-2xl bg-primary py-3.5 font-extrabold text-primary-foreground">
            Editar perfil
          </button>
          <button onClick={() => supabase.auth.signOut()} className="w-full rounded-2xl border border-border py-3.5 font-bold text-muted-foreground">
            Sair
          </button>
        </main>
      )}

      {aba === "admin" && admin && <Admin perfil={perfil} />}

      <nav className="fixed inset-x-0 bottom-3 mx-auto flex max-w-[22rem] justify-between rounded-full border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur">
        {([
          ["bicos", "🔎", "Bicos"],
          ["publicar", "➕", "Publicar"],
          ["minhas", "📋", "Minhas"],
          ["perfil", "😎", "Perfil"],
          ...(admin ? ([["admin", "👑", "Criadora"]] as const) : []),
        ] as const).map(([a, ic, t]) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex flex-1 flex-col items-center rounded-full py-2 text-xs font-bold ${aba === a ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <span className="text-lg leading-none">{ic}</span>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Lista({ titulo, vagas, vazio, dono, onMudou }: { titulo: string; vagas: Vaga[]; vazio?: string; dono?: boolean; onMudou?: () => void }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-extrabold">{titulo}</h2>
      {vagas.length === 0 && vazio && <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">{vazio}</p>}
      <div className="space-y-3">
        {vagas.map((v) => (
          <CardVaga key={v.id} v={v} dono={dono} onMudou={onMudou} />
        ))}
      </div>
    </section>
  );
}

function CardVaga({ v, dono, onMudou }: { v: Vaga; dono?: boolean | undefined; onMudou?: (() => void) | undefined }) {
  const c = cat(v.categoria);
  const zap = `https://wa.me/55${soDigitos(v.whatsapp)}?text=${encodeURIComponent(`Oi! Vi tua vaga "${v.titulo}" no Bora Trabalhar. Bora combinar?`)}`;
  async function fechar() {
    const { error } = await supabase.from("vagas").update({ aberta: false }).eq("id", v.id);
    if (error) return void toast.error("Não deu pra encerrar");
    toast("Vaga encerrada ✅");
    onMudou?.();
  }
  return (
    <article className="animate-pop rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold">
          {c.icon} {c.nome}
        </span>
        <span className="text-xs text-muted-foreground">{tempo(v.created_at)}</span>
      </div>
      <h3 className="mt-2 text-lg font-extrabold leading-snug">{v.titulo}</h3>
      {v.descricao && <p className="mt-1 text-sm text-muted-foreground">{v.descricao}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm">📍 {v.bairro}</span>
        <span className="rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-accent-foreground">{v.valor}</span>
      </div>
      {dono ? (
        <button onClick={fechar} className="mt-3 w-full rounded-2xl border border-border py-2.5 font-bold">
          Já combinei — encerrar vaga
        </button>
      ) : (
        <a href={zap} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl bg-primary py-2.5 text-center font-extrabold text-primary-foreground">
          Chamar no Zap 💬
        </a>
      )}
    </article>
  );
}

function Publicar({ perfil, onOk }: { perfil: Perfil; onOk: () => void }) {
  const [f, setF] = useState({ categoria: "faxina", titulo: "", descricao: "", bairro: perfil.bairro, valor: "", whatsapp: perfil.whatsapp });
  const [load, setLoad] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (f.titulo.trim().length < 3) return void toast.error("Conta o que você precisa");
    if (f.bairro.trim().length < 2) return void toast.error("Qual o bairro?");
    if (soDigitos(f.whatsapp).length < 10) return void toast.error("WhatsApp com DDD");
    setLoad(true);
    const { error } = await supabase.from("vagas").insert({
      ...f,
      titulo: f.titulo.trim(),
      descricao: f.descricao.trim(),
      bairro: f.bairro.trim(),
      valor: f.valor.trim() || "A combinar",
      user_id: perfil.id,
    });
    setLoad(false);
    if (error) return void toast.error("Erro ao publicar, tenta de novo");
    toast.success("Vaga no ar! 🚀 A galera já foi avisada.");
    onOk();
  }

  return (
    <form onSubmit={enviar} className="space-y-3 px-5">
      <h2 className="text-3xl font-extrabold">Precisa de alguém? 📣</h2>
      <p className="text-sm text-muted-foreground">Quem faz esse serviço recebe o aviso na hora.</p>
      <div className="grid grid-cols-3 gap-2 pt-2">
        {CATEGORIAS.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setF({ ...f, categoria: c.id })}
            className={`rounded-2xl border p-3 text-center text-xs font-bold ${f.categoria === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            <span className="block text-2xl">{c.icon}</span>
            {c.nome}
          </button>
        ))}
      </div>
      <input className="field" maxLength={120} placeholder="Ex: faxina pós-obra no sábado" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
      <textarea className="field min-h-24" maxLength={600} placeholder="Detalhes (opcional)" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input className="field" maxLength={80} placeholder="Bairro" value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} />
        <input className="field" maxLength={30} placeholder="Valor (R$)" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
      </div>
      <input className="field" inputMode="tel" maxLength={20} placeholder="WhatsApp pra contato" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
      <button disabled={load} className="w-full rounded-2xl bg-hype py-4 text-lg font-extrabold text-primary-foreground disabled:opacity-60">
        {load ? "Publicando..." : "Publicar vaga 🚀"}
      </button>
    </form>
  );
}

/* ---------------- Painel da Criadora ---------------- */

function Admin({ perfil }: { perfil: Perfil }) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [todasVagas, setTodasVagas] = useState<Vaga[]>([]);

  const carregar = useCallback(async () => {
    const [p, v] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("vagas").select("*").order("created_at", { ascending: false }),
    ]);
    setPerfis(p.data ?? []);
    setTodasVagas(v.data ?? []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);


  const ativas = todasVagas.filter((v) => v.aberta);
  const trabalhadores = perfis.filter((p) => p.tipo === "trabalhador").length;
  const contratantes = perfis.filter((p) => p.tipo === "contratante").length;
  const bairros = new Set(perfis.map((p) => p.bairro.trim().toLowerCase()).filter(Boolean)).size;

  return (
    <main className="space-y-6 px-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-accent">Área exclusiva</p>
        <h2 className="mt-1 text-3xl font-extrabold">Painel da Criadora 👑</h2>
        <p className="text-sm text-muted-foreground">Oi, {perfil.nome.split(" ")[0]}! Aqui você acompanha e cuida da comunidade.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          [perfis.length, "pessoas cadastradas", "💜"],
          [trabalhadores, "fazem bicos", "💪"],
          [contratantes, "querem contratar", "📣"],
          [ativas.length, "vagas ativas", "🔥"],
          [todasVagas.length, "vagas no total", "📋"],
          [bairros, "bairros alcançados", "📍"],
        ].map(([n, t, ic]) => (
          <div key={String(t)} className="rounded-3xl border border-border bg-card p-4">
            <span className="text-xl">{ic}</span>
            <p className="mt-1 text-2xl font-extrabold text-primary">{n}</p>
            <p className="text-xs text-muted-foreground">{t}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-3 text-lg font-extrabold">Vagas publicadas 🛡️</h3>
        {todasVagas.length === 0 && <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">Nenhuma vaga publicada ainda.</p>}
        <div className="space-y-3">
          {todasVagas.map((v) => (
            <AdminVaga key={v.id} v={v} onMudou={carregar} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-extrabold">Quem tá no app 💜</h3>
        <div className="space-y-3">
          {perfis.map((p) => (
            <div key={p.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="font-extrabold">
                {p.nome || "Sem nome"} {p.id === perfil.id && "👑"}
              </p>
              <p className="text-sm text-muted-foreground">
                {p.tipo === "trabalhador" ? "💪 Faz bicos" : "📣 Contrata"} · 📍 {p.bairro || "—"} · 📱 {p.whatsapp || "—"}
              </p>
              {p.habilidades.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.habilidades.map((h) => (
                    <span key={h} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                      {cat(h).icon} {cat(h).nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ---------------- Cartão de vaga no painel da criadora ---------------- */

function AdminVaga({ v, onMudou }: { v: Vaga; onMudou: () => void }) {
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState({ titulo: v.titulo, descricao: v.descricao ?? "", bairro: v.bairro, valor: v.valor });
  const [load, setLoad] = useState(false);

  async function salvar() {
    if (f.titulo.trim().length < 3) return void toast.error("Título muito curto");
    if (f.bairro.trim().length < 2) return void toast.error("Qual o bairro?");
    setLoad(true);
    const { error } = await supabase
      .from("vagas")
      .update({
        titulo: f.titulo.trim(),
        descricao: f.descricao.trim(),
        bairro: f.bairro.trim(),
        valor: f.valor.trim() || "A combinar",
      })
      .eq("id", v.id);
    setLoad(false);
    if (error) return void toast.error("Não deu pra salvar");
    toast.success("Vaga atualizada ✏️");
    setEditando(false);
    onMudou();
  }

  async function virar() {
    const { error } = await supabase.from("vagas").update({ aberta: !v.aberta }).eq("id", v.id);
    if (error) return void toast.error("Não deu pra mudar");
    toast(v.aberta ? "Vaga encerrada ✅" : "Vaga reaberta 🔥");
    onMudou();
  }

  async function remover() {
    const { error } = await supabase.from("vagas").delete().eq("id", v.id);
    if (error) return void toast.error("Não deu pra remover");
    toast.success("Vaga removida ✅");
    onMudou();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold">
          {cat(v.categoria).icon} {cat(v.categoria).nome}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${v.aberta ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {v.aberta ? "ativa" : "encerrada"}
        </span>
      </div>

      {editando ? (
        <div className="mt-3 space-y-2">
          <input className="field" maxLength={120} placeholder="Título" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          <textarea className="field min-h-20" maxLength={600} placeholder="Detalhes" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" maxLength={80} placeholder="Bairro" value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} />
            <input className="field" maxLength={30} placeholder="Valor" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          </div>
          <button onClick={salvar} disabled={load} className="w-full rounded-2xl bg-primary py-2.5 font-extrabold text-primary-foreground disabled:opacity-60">
            {load ? "Salvando..." : "Salvar mudanças ✅"}
          </button>
          <button onClick={() => setEditando(false)} className="w-full rounded-2xl border border-border py-2 font-bold">
            Deixar como tá
          </button>
        </div>
      ) : (
        <>
          <h4 className="mt-2 font-extrabold leading-snug">{v.titulo}</h4>
          {v.descricao && <p className="mt-1 text-sm text-muted-foreground">{v.descricao}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            📍 {v.bairro} · {v.valor} · {tempo(v.created_at)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setEditando(true)} className="rounded-2xl border border-border py-2.5 font-bold">
              Editar ✏️
            </button>
            <button onClick={virar} className="rounded-2xl border border-border py-2.5 font-bold">
              {v.aberta ? "Encerrar ⏸️" : "Reabrir 🔥"}
            </button>
          </div>
          <button onClick={remover} className="mt-2 w-full rounded-2xl border border-accent py-2.5 font-bold text-accent">
            Remover vaga 🗑️
          </button>
        </>
      )}
    </article>
  );
}

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'trabalhador' CHECK (tipo IN ('trabalhador','contratante')),
  habilidades text[] NOT NULL DEFAULT '{}',
  completo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfis visiveis a logados" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "edita o proprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "cria o proprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria text NOT NULL,
  titulo text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 120),
  descricao text NOT NULL DEFAULT '' CHECK (char_length(descricao) <= 600),
  bairro text NOT NULL CHECK (char_length(bairro) BETWEEN 2 AND 80),
  valor text NOT NULL DEFAULT 'A combinar',
  whatsapp text NOT NULL,
  aberta boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT ALL ON public.vagas TO service_role;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vagas visiveis a logados" ON public.vagas FOR SELECT TO authenticated USING (true);
CREATE POLICY "publica a propria vaga" ON public.vagas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "edita a propria vaga" ON public.vagas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "apaga a propria vaga" ON public.vagas FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.vagas;
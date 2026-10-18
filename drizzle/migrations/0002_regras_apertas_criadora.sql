-- Só a própria pessoa (e a criadora) enxerga um cadastro completo
DROP POLICY IF EXISTS "perfis visiveis a logados" ON public.profiles;
CREATE POLICY "perfis: dono ou criadora" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Vagas abertas seguem visíveis pra todo mundo logado; as encerradas só pro dono e pra criadora
DROP POLICY IF EXISTS "vagas visiveis a logados" ON public.vagas;
CREATE POLICY "vagas: abertas, dono e criadora" ON public.vagas
  FOR SELECT TO authenticated
  USING (aberta = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- A criadora pode editar qualquer vaga (título, descrição, valor, bairro, encerrar/reabrir)
CREATE POLICY "admin edita qualquer vaga" ON public.vagas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
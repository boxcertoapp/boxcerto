-- ============================================================
-- BoxCerto — Verificação e correção de segurança (RLS afiliados)
-- Cole no SQL Editor do Supabase. Rode a PARTE 1 primeiro (só leitura).
-- Se a PARTE 1 mostrar problema, rode a PARTE 2 (correção).
-- ============================================================


-- ============================================================
-- PARTE 1 — VERIFICAÇÃO (somente leitura, seguro rodar)
-- ============================================================

-- 1.1 Políticas na tabela de parceiros.
--     ESPERADO: apenas "affiliate_partners_admin_all".
--     PROBLEMA: qualquer política de SELECT com "status = 'active'"
--               ou liberada para o papel anon/public.
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'affiliate_partners';

-- 1.2 Grants diretos para o papel anon nas tabelas sensíveis.
--     ESPERADO: VAZIO (nenhuma linha).
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name IN (
    'affiliate_partners', 'affiliate_events',
    'affiliate_commissions', 'affiliate_payment_batches'
  )
ORDER BY table_name, privilege_type;

-- 1.3 A coluna password_hash existe? (usada pelo login de parceiro)
--     Se vier VAZIO, o login por senha está quebrado em produção.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'affiliate_partners'
  AND column_name IN ('password_hash', 'access_token', 'magic_token');

-- 1.4 Leitura pública das tabelas de leads/eventos para anon.
--     ESPERADO: anon só com INSERT (nunca SELECT).
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name IN ('diagnostico_leads', 'cadastro_events', 'page_views')
ORDER BY table_name, privilege_type;


-- ============================================================
-- PARTE 2 — CORREÇÃO (idempotente). Rode SOMENTE se a Parte 1
-- mostrou política pública / grant para anon na affiliate_partners.
-- Tudo aqui pode ser rodado mais de uma vez sem efeito colateral.
-- ============================================================

BEGIN;

-- 2.1 Garante a coluna password_hash (faltava nas migrations do repo)
ALTER TABLE public.affiliate_partners
  ADD COLUMN IF NOT EXISTS password_hash text;

-- 2.2 Remove QUALQUER política de leitura pública conhecida/legada
DROP POLICY IF EXISTS "public_read_active_partners" ON public.affiliate_partners;
DROP POLICY IF EXISTS "admin_all_partners"          ON public.affiliate_partners;

-- 2.3 Garante RLS ligado e remove acesso do anon
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.affiliate_partners        FROM anon;
REVOKE ALL ON public.affiliate_events          FROM anon;
REVOKE ALL ON public.affiliate_commissions     FROM anon;
REVOKE ALL ON public.affiliate_payment_batches FROM anon;

-- 2.4 Recria a política de admin (única forma de acesso direto à tabela)
DROP POLICY IF EXISTS "affiliate_partners_admin_all" ON public.affiliate_partners;
CREATE POLICY "affiliate_partners_admin_all"
  ON public.affiliate_partners FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- 2.5 Garante a função pública que expõe SÓ colunas seguras
--     (é o que a página /parceiro/:slug deve usar — via supabase.rpc)
CREATE OR REPLACE FUNCTION public.get_public_affiliate_partner(p_slug text)
RETURNS TABLE (
  id uuid, nome text, slug text, coupon_code text,
  tipo text, empresa text, materials jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ap.id, ap.nome, ap.slug, ap.coupon_code, ap.tipo,
         ap.empresa, coalesce(ap.materials, '[]'::jsonb)
  FROM public.affiliate_partners ap
  WHERE ap.slug = p_slug AND ap.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_affiliate_partner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_affiliate_partner(text) TO anon, authenticated;

COMMIT;


-- ============================================================
-- PARTE 3 — Pós-correção: INVALIDAR tokens que possam ter vazado.
-- Rode isto SOMENTE se a Parte 1 confirmou que a tabela esteve exposta.
-- Efeito: todos os parceiros precisarão pedir um novo magic link.
-- (Não apaga senha; apenas zera os tokens de sessão.)
-- Descomente para executar:
-- ============================================================

-- UPDATE public.affiliate_partners
-- SET access_token = NULL, access_token_exp = NULL,
--     magic_token  = NULL, magic_token_exp  = NULL;


-- ============================================================
-- PARTE 4 — Reverificação (rode a Parte 1 de novo e confira:)
--   1.1  → só "affiliate_partners_admin_all"
--   1.2  → vazio
--   1.3  → password_hash / access_token / magic_token presentes
--   1.4  → anon só com INSERT
-- ============================================================

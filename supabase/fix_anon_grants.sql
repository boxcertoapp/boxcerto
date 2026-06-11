-- ============================================================
-- BoxCerto — Corrige excesso de permissão do papel `anon`
-- nas tabelas públicas de eventos/leads.
--
-- ACHADO (query 1.4): anon tem DELETE/UPDATE/TRUNCATE/REFERENCES/TRIGGER
-- em cadastro_events, diagnostico_leads e page_views. O esperado é só INSERT.
-- (Mitigado hoje pelo RLS — sem política de DELETE/UPDATE a API bloqueia —
--  mas é excesso de privilégio: removemos por defesa em profundidade.)
--
-- Este script deixa o anon APENAS com INSERT (e USAGE na sequence de
-- page_views, necessária para o bigserial). As políticas de INSERT já
-- existem em security_hardening_rls.sql e não são tocadas aqui.
--
-- Rode no SQL Editor do Supabase. Idempotente. Não quebra tracking:
-- o app só faz INSERT nessas tabelas como anon (o SELECT é admin-only).
-- ============================================================

BEGIN;

-- cadastro_events
REVOKE ALL ON public.cadastro_events FROM anon;
GRANT INSERT ON public.cadastro_events TO anon;

-- diagnostico_leads
REVOKE ALL ON public.diagnostico_leads FROM anon;
GRANT INSERT ON public.diagnostico_leads TO anon;

-- page_views (precisa da sequence para o id bigserial)
REVOKE ALL ON public.page_views FROM anon;
GRANT INSERT ON public.page_views TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO anon;

COMMIT;


-- ============================================================
-- VERIFICAÇÃO (rode depois — deve mostrar só INSERT para anon):
-- ============================================================
-- SELECT table_name, grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee = 'anon'
--   AND table_name IN ('diagnostico_leads', 'cadastro_events', 'page_views')
-- ORDER BY table_name, privilege_type;

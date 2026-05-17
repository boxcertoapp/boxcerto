-- ============================================================
-- FIX: diagnostico_leads + cadastro_events
-- Execute no Supabase SQL Editor → New query → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. diagnostico_leads
--    INSERT: anon (página pública /diagnostico)
--    SELECT: authenticated (painel admin)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.diagnostico_leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome       TEXT,
  email      TEXT NOT NULL,
  respostas  JSONB,
  origem     TEXT DEFAULT 'lpdiagnostico'
);

CREATE INDEX IF NOT EXISTS diagnostico_leads_email_idx   ON public.diagnostico_leads (email);
CREATE INDEX IF NOT EXISTS diagnostico_leads_created_idx ON public.diagnostico_leads (created_at DESC);

ALTER TABLE public.diagnostico_leads ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para recriar limpas
DROP POLICY IF EXISTS "anon_insert_leads"   ON public.diagnostico_leads;
DROP POLICY IF EXISTS "service_role_all"    ON public.diagnostico_leads;
DROP POLICY IF EXISTS "authenticated_read"  ON public.diagnostico_leads;

-- anon insere (página pública)
CREATE POLICY "diagnostico_leads_insert_anon"
  ON public.diagnostico_leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- autenticado lê (admin panel usa JWT do usuário logado)
CREATE POLICY "diagnostico_leads_select_auth"
  ON public.diagnostico_leads FOR SELECT
  TO authenticated
  USING (true);

-- service role faz tudo (funções server-side)
CREATE POLICY "diagnostico_leads_all_service"
  ON public.diagnostico_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- 2. cadastro_events
--    INSERT: anon (página pública /cadastro)
--    SELECT: authenticated (painel admin)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cadastro_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   TEXT NOT NULL,
  origem       TEXT,
  utm_source   TEXT,
  utm_campaign TEXT,
  utm_content  TEXT,
  device       TEXT,
  error_type   TEXT,
  error_field  TEXT,
  fields_count INT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadastro_events_created_at ON public.cadastro_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cadastro_events_name       ON public.cadastro_events (event_name);

ALTER TABLE public.cadastro_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cadastro_events_insert_public" ON public.cadastro_events;
DROP POLICY IF EXISTS "cadastro_events_select_auth"   ON public.cadastro_events;

-- anon insere (página pública /cadastro)
CREATE POLICY "cadastro_events_insert_anon"
  ON public.cadastro_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- autenticado lê (admin panel)
CREATE POLICY "cadastro_events_select_auth"
  ON public.cadastro_events FOR SELECT
  TO authenticated
  USING (true);

-- service role faz tudo
CREATE POLICY "cadastro_events_all_service"
  ON public.cadastro_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

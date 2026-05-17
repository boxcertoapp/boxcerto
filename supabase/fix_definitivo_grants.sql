-- ============================================================
-- FIX DEFINITIVO — diagnostico_leads + cadastro_events
-- Causa raiz do 403: policies de INSERT restritas a TO anon,
-- mas testes feitos com usuário logado usam role authenticated.
-- Solução: INSERT sem restrição de role (qualquer um insere),
-- SELECT restrito a authenticated (só o admin lê).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. diagnostico_leads
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

-- Grants para todos os roles relevantes
GRANT INSERT ON TABLE public.diagnostico_leads TO anon;
GRANT INSERT ON TABLE public.diagnostico_leads TO authenticated;
GRANT SELECT ON TABLE public.diagnostico_leads TO authenticated;
GRANT ALL    ON TABLE public.diagnostico_leads TO service_role;

-- RLS habilitado
ALTER TABLE public.diagnostico_leads ENABLE ROW LEVEL SECURITY;

-- Remove todas as policies anteriores (clean slate)
DROP POLICY IF EXISTS "diagnostico_leads_insert_anon"   ON public.diagnostico_leads;
DROP POLICY IF EXISTS "diagnostico_leads_select_auth"   ON public.diagnostico_leads;
DROP POLICY IF EXISTS "diagnostico_leads_all_service"   ON public.diagnostico_leads;
DROP POLICY IF EXISTS "anon_insert_leads"               ON public.diagnostico_leads;
DROP POLICY IF EXISTS "service_role_all"                ON public.diagnostico_leads;
DROP POLICY IF EXISTS "authenticated_read"              ON public.diagnostico_leads;
DROP POLICY IF EXISTS "allow_insert"                    ON public.diagnostico_leads;

-- INSERT: qualquer role (anon E authenticated) — sem restrição TO
CREATE POLICY "diagnostico_leads_insert"
  ON public.diagnostico_leads FOR INSERT
  WITH CHECK (true);

-- SELECT: só autenticado (admin panel)
CREATE POLICY "diagnostico_leads_select"
  ON public.diagnostico_leads FOR SELECT
  TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────────
-- 2. cadastro_events
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

-- Grants
GRANT INSERT ON TABLE public.cadastro_events TO anon;
GRANT INSERT ON TABLE public.cadastro_events TO authenticated;
GRANT SELECT ON TABLE public.cadastro_events TO authenticated;
GRANT ALL    ON TABLE public.cadastro_events TO service_role;

-- RLS
ALTER TABLE public.cadastro_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cadastro_events_insert_anon"   ON public.cadastro_events;
DROP POLICY IF EXISTS "cadastro_events_select_auth"   ON public.cadastro_events;
DROP POLICY IF EXISTS "cadastro_events_all_service"   ON public.cadastro_events;
DROP POLICY IF EXISTS "cadastro_events_insert_public" ON public.cadastro_events;
DROP POLICY IF EXISTS "allow_insert"                  ON public.cadastro_events;

-- INSERT: qualquer role — sem restrição TO
CREATE POLICY "cadastro_events_insert"
  ON public.cadastro_events FOR INSERT
  WITH CHECK (true);

-- SELECT: só autenticado (admin panel)
CREATE POLICY "cadastro_events_select"
  ON public.cadastro_events FOR SELECT
  TO authenticated
  USING (true);

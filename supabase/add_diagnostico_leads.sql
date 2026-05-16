-- Tabela de leads capturados no diagnóstico (/lpdiagnostico)
-- Execute no Supabase: SQL Editor → New query → Cole e rode

CREATE TABLE IF NOT EXISTS public.diagnostico_leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome       TEXT,
  email      TEXT NOT NULL,
  respostas  JSONB,
  origem     TEXT DEFAULT 'lpdiagnostico'
);

-- Índices
CREATE INDEX IF NOT EXISTS diagnostico_leads_email_idx ON public.diagnostico_leads (email);
CREATE INDEX IF NOT EXISTS diagnostico_leads_created_idx ON public.diagnostico_leads (created_at DESC);

-- RLS — só o service role (admin) lê; anon pode inserir
ALTER TABLE public.diagnostico_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_leads"
  ON public.diagnostico_leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_all"
  ON public.diagnostico_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Leads organicos do blog, paginas comerciais e materiais gratuitos
-- Usa a mesma tabela da aba Admin > Leads para manter tudo em um painel.

CREATE TABLE IF NOT EXISTS public.diagnostico_leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome       TEXT,
  email      TEXT NOT NULL,
  respostas  JSONB,
  origem     TEXT DEFAULT 'lpdiagnostico'
);

CREATE INDEX IF NOT EXISTS diagnostico_leads_email_idx
  ON public.diagnostico_leads (email);

CREATE INDEX IF NOT EXISTS diagnostico_leads_created_idx
  ON public.diagnostico_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS diagnostico_leads_origem_idx
  ON public.diagnostico_leads (origem);

ALTER TABLE public.diagnostico_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diagnostico_leads_insert_anon" ON public.diagnostico_leads;
DROP POLICY IF EXISTS "diagnostico_leads_select_auth" ON public.diagnostico_leads;

CREATE POLICY "diagnostico_leads_insert_anon"
  ON public.diagnostico_leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "diagnostico_leads_select_auth"
  ON public.diagnostico_leads FOR SELECT
  TO authenticated
  USING (true);

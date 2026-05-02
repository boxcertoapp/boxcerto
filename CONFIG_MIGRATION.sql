-- ============================================================
-- CONFIG_MIGRATION.sql
-- Rode este arquivo no SQL Editor do Supabase
-- Cria a tabela de configurações centrais do BoxCerto
-- ============================================================

-- ── 1. Tabela de configuração global ─────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. RLS ───────────────────────────────────────────────────
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler (preços aparecem nas landing pages públicas)
DROP POLICY IF EXISTS "config_public_read" ON app_config;
CREATE POLICY "config_public_read"
  ON app_config FOR SELECT
  USING (true);

-- Apenas admins podem escrever
DROP POLICY IF EXISTS "config_admin_write" ON app_config;
CREATE POLICY "config_admin_write"
  ON app_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (is_admin = true OR email = 'rogerioknfilho@gmail.com')
    )
  );

-- ── 3. Dados iniciais ─────────────────────────────────────────
INSERT INTO app_config (key, value) VALUES
  ('price_monthly',         '97.00'),
  ('price_annual',          '958.80'),
  ('price_annual_monthly',  '79.90'),
  ('trial_days',            '7'),
  ('trial_message',         'Experimente grátis por 7 dias, sem cartão necessário.')
ON CONFLICT (key) DO NOTHING;

-- ── 4. Garante que mrr_snapshots existe ──────────────────────
CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data          DATE NOT NULL UNIQUE,
  mrr           NUMERIC(10,2) NOT NULL DEFAULT 0,
  arr           NUMERIC(10,2) NOT NULL DEFAULT 0,
  active_count  INT NOT NULL DEFAULT 0,
  trial_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snapshots_admin_read" ON mrr_snapshots;
CREATE POLICY "snapshots_admin_read"
  ON mrr_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR email = 'rogerioknfilho@gmail.com')
    )
  );

DROP POLICY IF EXISTS "snapshots_service_insert" ON mrr_snapshots;
CREATE POLICY "snapshots_service_insert"
  ON mrr_snapshots FOR INSERT
  WITH CHECK (true); -- cron usa service role, bypassa RLS de qualquer forma

-- ── 5. Garante colunas extras em email_logs ──────────────────
-- (caso a tabela exista com schema antigo sem user_id/canal/assunto)
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS assunto text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS canal text DEFAULT 'email';
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS destinatario_nome text;

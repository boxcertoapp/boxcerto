-- Migration: tabela de log de emails enviados pelo cron
-- Execute no Supabase SQL Editor

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS email_logs (
  id               BIGSERIAL PRIMARY KEY,
  destinatario_email TEXT NOT NULL,
  template         TEXT NOT NULL,
  enviado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice para as queries de deduplicação do cron
CREATE INDEX IF NOT EXISTS idx_email_logs_email_template
  ON email_logs (destinatario_email, template);

-- 3. RLS: somente service role pode ler/escrever (o cron usa service role)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Permite que o service role (cron) faça tudo
CREATE POLICY "service role full access"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Tabela de snapshots de MRR (também usada pelo cron)
CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  data         DATE NOT NULL UNIQUE,
  mrr          NUMERIC(10,2) DEFAULT 0,
  ativos       INT DEFAULT 0,
  trial        INT DEFAULT 0,
  inadimplentes INT DEFAULT 0,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrr_snapshots_data ON mrr_snapshots (data DESC);

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access"
  ON mrr_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

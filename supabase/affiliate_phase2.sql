-- ============================================================
-- BoxCerto — Afiliados Fase 2: colunas de sessão
-- Rodar no SQL Editor do Supabase
-- ============================================================

ALTER TABLE affiliate_partners
  ADD COLUMN IF NOT EXISTS magic_token      text,
  ADD COLUMN IF NOT EXISTS magic_token_exp  timestamptz,
  ADD COLUMN IF NOT EXISTS access_token     text,
  ADD COLUMN IF NOT EXISTS access_token_exp timestamptz;

-- Índice para lookup rápido por token de sessão
CREATE INDEX IF NOT EXISTS idx_affiliate_access_token ON affiliate_partners(access_token);

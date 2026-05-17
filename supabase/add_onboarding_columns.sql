-- ============================================================
-- ONBOARDING CHECKLIST — colunas na tabela profiles
-- Execute no Supabase SQL Editor → New query → Run
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_oficina_done   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_os_done        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_orcamento_done BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed      BOOLEAN DEFAULT FALSE;

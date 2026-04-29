-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Técnico responsável por OS
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Campo tecnico na OS (nome do técnico responsável)
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS tecnico text;

-- 2. Lista de técnicos cadastrados na oficina (nome + e-mail)
--    Formato: [{ "nome": "João Silva", "email": "joao@email.com" }, ...]
ALTER TABLE office_data
  ADD COLUMN IF NOT EXISTS tecnicos jsonb NOT NULL DEFAULT '[]'::jsonb;

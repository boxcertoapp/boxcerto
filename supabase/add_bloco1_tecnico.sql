-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Bloco 1 Técnico — Checklist, Notas Internas, Urgência
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS notas_internas jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS checklist      jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS urgente        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS problema_flag  boolean NOT NULL DEFAULT false;

-- notas_internas: [{ autor, texto, at, tipo: 'tecnico'|'gerente' }]
-- checklist:      [{ id, texto, feito }]
-- urgente:        gerente marca como urgente → técnico vê destaque vermelho
-- problema_flag:  técnico sinaliza problema → gerente vê alerta na OS

-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Permitir técnicos lerem o estoque do seu master
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Habilitar RLS na tabela inventory (caso ainda não esteja)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policy: técnico pode SELECT no estoque do seu master
CREATE POLICY IF NOT EXISTS "tecnico_read_inventory"
ON public.inventory
FOR SELECT
USING (
  -- owner normal
  auth.uid() = user_id
  OR
  -- técnico vinculado ao master
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.tipo = 'tecnico'
      AND u.master_id = inventory.user_id
  )
);

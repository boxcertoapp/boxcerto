-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Permitir técnicos lerem o estoque do seu master
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Habilitar RLS na tabela inventory (caso ainda não esteja)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Remove a policy antiga se existir (evita conflito)
DROP POLICY IF EXISTS "tecnico_read_inventory" ON public.inventory;

-- Policy: técnico pode SELECT no estoque do seu master
-- Usa public.profiles (não auth.users — que é restrito dentro de policies)
CREATE POLICY "tecnico_read_inventory"
ON public.inventory
FOR SELECT
USING (
  -- owner normal (master vendo seu próprio estoque)
  auth.uid() = user_id
  OR
  -- técnico vinculado ao master via public.profiles
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.tipo = 'tecnico'
      AND p.master_id = inventory.user_id
  )
);

-- ══════════════════════════════════════════════════════════════
-- FIX: RLS da tabela support_tickets
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Garante que a tabela existe (seguro rodar mesmo se já existir)
CREATE TABLE IF NOT EXISTS support_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  oficina       text,
  email         text,
  categoria     text DEFAULT 'duvida'
                CHECK (categoria IN ('duvida','erro','sugestao','financeiro','outro')),
  titulo        text NOT NULL,
  mensagem      text NOT NULL,
  status        text DEFAULT 'aberto'
                CHECK (status IN ('aberto','em_atendimento','resolvido')),
  resposta      text,
  respondido_em timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Habilita RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (limpeza)
DROP POLICY IF EXISTS "users_manage_own_tickets"   ON support_tickets;
DROP POLICY IF EXISTS "admins_manage_all_tickets"  ON support_tickets;
DROP POLICY IF EXISTS "users_insert_own_tickets"   ON support_tickets;
DROP POLICY IF EXISTS "users_select_own_tickets"   ON support_tickets;
DROP POLICY IF EXISTS "users_update_own_tickets"   ON support_tickets;
DROP POLICY IF EXISTS "admins_all_tickets"         ON support_tickets;

-- ── Políticas de usuário (separadas por operação — mais seguro) ──

-- INSERT: usuário só pode inserir ticket com seu próprio user_id
CREATE POLICY "users_insert_own_tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT: usuário só vê seus próprios tickets
CREATE POLICY "users_select_own_tickets" ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- UPDATE: usuário pode atualizar apenas seus tickets (ex.: editar antes de enviar)
CREATE POLICY "users_update_own_tickets" ON support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Política de admin (vê e responde todos os tickets) ──────────
CREATE POLICY "admins_all_tickets" ON support_tickets
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rogerioknfilho@gmail.com'
  );

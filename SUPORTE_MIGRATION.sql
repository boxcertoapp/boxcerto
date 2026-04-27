-- ══════════════════════════════════════════════════════════════
-- SUPORTE — Tabela de chamados / tickets
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

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

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Usuários veem e criam apenas seus próprios tickets
DROP POLICY IF EXISTS "users_manage_own_tickets" ON support_tickets;
CREATE POLICY "users_manage_own_tickets" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

-- Admins veem e atualizam todos os tickets
DROP POLICY IF EXISTS "admins_manage_all_tickets" ON support_tickets;
CREATE POLICY "admins_manage_all_tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'rogerioknfilho@gmail.com'
  );

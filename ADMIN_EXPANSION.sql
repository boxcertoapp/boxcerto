-- ============================================================
-- BoxCerto — Admin Expansion Migration
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de anúncios/popups in-app
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text DEFAULT 'info',         -- info | warning | success | promo
  target_status text DEFAULT 'all', -- all | trial | active | inadimplente
  ativo boolean DEFAULT true,
  expira_em timestamptz,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de anúncios ativos"
  ON announcements FOR SELECT
  USING (ativo = true AND (expira_em IS NULL OR expira_em > now()));

CREATE POLICY "Admin gerencia anúncios"
  ON announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- 2. Log de comunicações enviadas
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  destinatario_email text NOT NULL,
  destinatario_nome text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template text NOT NULL,
  assunto text,
  canal text DEFAULT 'email', -- email | whatsapp
  enviado_em timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin lê logs"
  ON email_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin insere logs"
  ON email_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- 3. Coluna last_seen_at em profiles (rastreia último acesso)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 4. Coluna os_count em profiles (cache de contagem de OS)
-- Atualizado via trigger ou periodicamente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS os_count integer DEFAULT 0;

-- ============================================================
-- PRONTO! Cole e execute tudo acima de uma vez.
-- ============================================================

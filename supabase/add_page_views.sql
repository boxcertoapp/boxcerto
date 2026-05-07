-- ══════════════════════════════════════════════════════════
-- add_page_views.sql — rodar 1x no Supabase SQL Editor
-- Rastreamento de visitas às páginas do site
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS page_views (
  id         BIGSERIAL    PRIMARY KEY,
  page       TEXT         NOT NULL,          -- ex: '/landing', '/cadastro'
  session_id TEXT,                           -- ID anônimo de sessão
  referrer   TEXT         DEFAULT 'direto',  -- domínio de origem
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Index para queries de analytics
CREATE INDEX IF NOT EXISTS idx_page_views_page       ON page_views (page);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session    ON page_views (session_id);

-- RLS: qualquer um pode inserir (visitantes anônimos), só admin lê
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pv_public_insert" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "pv_admin_select" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

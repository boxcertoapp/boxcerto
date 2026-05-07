-- Migration: adiciona colunas de analytics a page_views e profiles
-- Execute no Supabase SQL Editor

-- 1. Colunas device e browser na tabela page_views
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS device  TEXT DEFAULT 'desktop',
  ADD COLUMN IF NOT EXISTS browser TEXT DEFAULT 'Chrome';

-- 2. Coluna last_device na tabela profiles (dispositivo do último login)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_device TEXT;

-- 3. Índices para queries de analytics (opcional, melhora performance)
CREATE INDEX IF NOT EXISTS idx_page_views_device   ON page_views (device);
CREATE INDEX IF NOT EXISTS idx_page_views_browser  ON page_views (browser);
CREATE INDEX IF NOT EXISTS idx_page_views_created  ON page_views (created_at);

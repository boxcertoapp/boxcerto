-- ============================================================
-- BoxCerto — Sistema de Afiliados/Parceiros
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. TABELA DE PARCEIROS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  text NOT NULL,
  email                 text NOT NULL UNIQUE,
  whatsapp              text,
  empresa               text,
  tipo                  text DEFAULT 'parceiro',   -- influencer | empresa | parceiro | vendedor
  slug                  text NOT NULL UNIQUE,      -- ex: joao-mecanico
  coupon_code           text UNIQUE,               -- ex: JOAO10
  stripe_coupon_id      text,                      -- ID do coupon base (compartilhado, 10% off)
  stripe_promo_code_id  text,                      -- ID do promotion code único deste parceiro
  pix_key               text,
  pix_type              text CHECK (pix_type IN ('cpf','cnpj','email','telefone','aleatoria')),
  commission_type       text NOT NULL DEFAULT 'tiered', -- tiered | custom
  commission_custom_pct numeric(5,2),              -- só quando type = custom
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('pending','active','paused')),
  notes                 text,                      -- observações internas (admin)
  materials             jsonb DEFAULT '[]'::jsonb, -- array de { type, url, title }
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- 2. TABELA DE EVENTOS DE RASTREAMENTO
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  event_type  text NOT NULL
              CHECK (event_type IN ('click','lead','signup','trial','converted','churned')),
  user_email  text,
  user_id     uuid,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

-- 3. TABELA DE COMISSÕES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          uuid NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  customer_user_id    uuid,
  customer_email      text,
  type                text NOT NULL CHECK (type IN ('entry','monthly')),
  reference_month     text,         -- formato YYYY-MM (só para comissões mensais)
  amount              numeric(10,2) NOT NULL,
  tier_applied        integer,      -- 20, 25 ou 30 (percentual aplicado)
  plan_value          numeric(10,2),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','paid','canceled')),
  approved_at         timestamptz,
  paid_at             timestamptz,
  payment_batch_id    uuid,
  created_at          timestamptz DEFAULT now()
);

-- 4. TABELA DE LOTES DE PAGAMENTO (todo dia 5)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_payment_batches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month  text NOT NULL,   -- YYYY-MM
  total_amount     numeric(10,2) NOT NULL DEFAULT 0,
  affiliates_count integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','processing','paid')),
  paid_at          timestamptz,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- FK comissões → lotes
ALTER TABLE affiliate_commissions
  ADD CONSTRAINT IF NOT EXISTS affiliate_commissions_batch_fk
  FOREIGN KEY (payment_batch_id) REFERENCES affiliate_payment_batches(id);

-- 5. CAMPOS DE AFILIADO NA TABELA PROFILES
-- ──────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS affiliate_ref        text,   -- slug do parceiro que indicou
  ADD COLUMN IF NOT EXISTS affiliate_coupon     text,   -- cupom usado no cadastro
  ADD COLUMN IF NOT EXISTS affiliate_partner_id uuid REFERENCES affiliate_partners(id);

-- 6. ÍNDICES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_affiliate_events_partner    ON affiliate_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_type       ON affiliate_events(event_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_created    ON affiliate_events(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_partner      ON affiliate_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_status       ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_month        ON affiliate_commissions(reference_month);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_customer     ON affiliate_commissions(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_ref      ON profiles(affiliate_ref);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_partner  ON profiles(affiliate_partner_id);

-- 7. RLS (Row Level Security)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE affiliate_partners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payment_batches  ENABLE ROW LEVEL SECURITY;

-- Admin (is_admin = true no perfil) tem acesso total
CREATE POLICY IF NOT EXISTS "admin_all_partners" ON affiliate_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY IF NOT EXISTS "admin_all_events" ON affiliate_events FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY IF NOT EXISTS "admin_all_commissions" ON affiliate_commissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY IF NOT EXISTS "admin_all_batches" ON affiliate_payment_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Leitura pública de parceiros ativos (para páginas /parceiro/[slug])
CREATE POLICY IF NOT EXISTS "public_read_active_partners" ON affiliate_partners FOR SELECT
  USING (status = 'active');

-- ============================================================
-- ATENÇÃO: Após rodar este SQL, adicione no Vercel:
--   STRIPE_AFFILIATE_COUPON_ID=coupon_xxxxxx
-- (ID do coupon 10% off que você criar manualmente no Stripe)
-- ============================================================

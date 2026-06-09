-- ============================================================
-- BoxCerto - Security hardening for public keys, RLS and RPCs
-- Run after the existing schema/admin/affiliate migrations.
-- ============================================================

-- ---------- Shared helpers ----------

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'master',
  ADD COLUMN IF NOT EXISTS master_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS nome text DEFAULT '',
  ADD COLUMN IF NOT EXISTS setup_done boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        coalesce(p.is_admin, false) = true
        OR lower(coalesce(p.email, '')) = 'rogerioknfilho@gmail.com'
        OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'rogerioknfilho@gmail.com'
      )
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles',
        'clients',
        'vehicles',
        'service_orders',
        'service_items',
        'expenses',
        'inventory',
        'office_data',
        'vendas',
        'diagnostico_leads',
        'cadastro_events',
        'page_views',
        'app_config',
        'announcements',
        'email_logs',
        'email_templates',
        'mrr_snapshots',
        'admin_audit_log',
        'support_tickets',
        'push_subscriptions',
        'affiliate_partners',
        'affiliate_events',
        'affiliate_commissions',
        'affiliate_payment_batches'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ---------- Core tenant tables ----------

ALTER TABLE public.office_data
  ADD COLUMN IF NOT EXISTS tecnicos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pode_assumir_os boolean NOT NULL DEFAULT false;

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS tecnico text,
  ADD COLUMN IF NOT EXISTS notas_internas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS urgente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS problema_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aprovacao_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS aprovacao_status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_data ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_data TO authenticated;

CREATE POLICY "profiles_select_scoped"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR private.is_admin()
    OR master_id = auth.uid()
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR private.is_admin());

CREATE POLICY "profiles_update_scoped"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR private.is_admin() OR master_id = auth.uid())
  WITH CHECK (auth.uid() = id OR private.is_admin() OR master_id = auth.uid());

CREATE POLICY "clients_master_all"
  ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "clients_tecnico_select"
  ON public.clients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = clients.user_id
    )
  );

CREATE POLICY "vehicles_master_all"
  ON public.vehicles FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (
    (auth.uid() = user_id OR private.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = vehicles.client_id
        AND c.user_id = vehicles.user_id
    )
  );

CREATE POLICY "vehicles_tecnico_select"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = vehicles.user_id
    )
  );

CREATE POLICY "service_orders_master_all"
  ON public.service_orders FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (
    (auth.uid() = user_id OR private.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = service_orders.vehicle_id
        AND v.user_id = service_orders.user_id
    )
  );

CREATE POLICY "service_orders_tecnico_select"
  ON public.service_orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_orders.user_id
    )
  );

CREATE POLICY "service_orders_tecnico_update"
  ON public.service_orders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_orders.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_orders.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = service_orders.vehicle_id
        AND v.user_id = service_orders.user_id
    )
  );

CREATE POLICY "service_items_master_all"
  ON public.service_items FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (
    (auth.uid() = user_id OR private.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_items.os_id
        AND so.user_id = service_items.user_id
    )
    AND (
      service_items.inventory_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.inventory i
        WHERE i.id = service_items.inventory_id
          AND i.user_id = service_items.user_id
      )
    )
  );

CREATE POLICY "service_items_tecnico_select"
  ON public.service_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

CREATE POLICY "service_items_tecnico_insert"
  ON public.service_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_items.os_id
        AND so.user_id = service_items.user_id
    )
    AND (
      service_items.inventory_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.inventory i
        WHERE i.id = service_items.inventory_id
          AND i.user_id = service_items.user_id
      )
    )
  );

CREATE POLICY "service_items_tecnico_update"
  ON public.service_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_items.os_id
        AND so.user_id = service_items.user_id
    )
    AND (
      service_items.inventory_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.inventory i
        WHERE i.id = service_items.inventory_id
          AND i.user_id = service_items.user_id
      )
    )
  );

CREATE POLICY "service_items_tecnico_delete"
  ON public.service_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

CREATE POLICY "expenses_master_all"
  ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "inventory_master_all"
  ON public.inventory FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "inventory_tecnico_select"
  ON public.inventory FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = inventory.user_id
    )
  );

CREATE POLICY "office_data_master_all"
  ON public.office_data FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "office_data_tecnico_select"
  ON public.office_data FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = office_data.user_id
    )
  );

-- ---------- Vendas avulsas ----------

CREATE TABLE IF NOT EXISTS public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  cliente text NOT NULL DEFAULT '',
  pagamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  desconto jsonb NOT NULL DEFAULT '{"tipo":"valor","valor":0}'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS vendas_client_id_idx ON public.vendas(client_id);
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO authenticated;

CREATE POLICY "vendas_master_all"
  ON public.vendas FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (
    (auth.uid() = user_id OR private.is_admin())
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = vendas.client_id
          AND c.user_id = vendas.user_id
      )
    )
  );

-- ---------- Public marketing/event tables ----------

CREATE TABLE IF NOT EXISTS public.diagnostico_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text NOT NULL,
  respostas jsonb,
  origem text DEFAULT 'landing',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.diagnostico_leads
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS respostas jsonb,
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'landing';

CREATE INDEX IF NOT EXISTS diagnostico_leads_email_idx ON public.diagnostico_leads(email);
CREATE INDEX IF NOT EXISTS diagnostico_leads_created_idx ON public.diagnostico_leads(created_at DESC);

ALTER TABLE public.diagnostico_leads ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.diagnostico_leads FROM anon;
GRANT INSERT ON public.diagnostico_leads TO anon, authenticated;
GRANT SELECT ON public.diagnostico_leads TO authenticated;

CREATE POLICY "diagnostico_leads_public_insert"
  ON public.diagnostico_leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "diagnostico_leads_admin_select"
  ON public.diagnostico_leads FOR SELECT TO authenticated
  USING (private.is_admin());

CREATE TABLE IF NOT EXISTS public.cadastro_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  origem text,
  utm_source text,
  utm_campaign text,
  utm_content text,
  device text,
  error_type text,
  error_field text,
  fields_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadastro_events_created_at ON public.cadastro_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cadastro_events_name ON public.cadastro_events(event_name);

ALTER TABLE public.cadastro_events ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.cadastro_events FROM anon;
GRANT INSERT ON public.cadastro_events TO anon, authenticated;
GRANT SELECT ON public.cadastro_events TO authenticated;

CREATE POLICY "cadastro_events_public_insert"
  ON public.cadastro_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "cadastro_events_admin_select"
  ON public.cadastro_events FOR SELECT TO authenticated
  USING (private.is_admin());

CREATE TABLE IF NOT EXISTS public.page_views (
  id bigserial PRIMARY KEY,
  page text NOT NULL,
  session_id text,
  referrer text DEFAULT 'direto',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_page ON public.page_views(page);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.page_views FROM anon;
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO anon, authenticated;

CREATE POLICY "page_views_public_insert"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "page_views_admin_select"
  ON public.page_views FOR SELECT TO authenticated
  USING (private.is_admin());

-- ---------- Public config and announcements ----------

CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_config TO authenticated;

CREATE POLICY "app_config_public_read"
  ON public.app_config FOR SELECT
  USING (true);

CREATE POLICY "app_config_admin_write"
  ON public.app_config FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text DEFAULT 'info',
  target_status text DEFAULT 'all',
  ativo boolean DEFAULT true,
  expira_em timestamptz,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

CREATE POLICY "announcements_public_read_active"
  ON public.announcements FOR SELECT
  USING (ativo = true AND (expira_em IS NULL OR expira_em > now()));

CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ---------- Admin-only operational tables ----------

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  destinatario_email text NOT NULL,
  destinatario_nome text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template text NOT NULL,
  assunto text,
  canal text DEFAULT 'email',
  enviado_em timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;

CREATE POLICY "email_logs_admin_select"
  ON public.email_logs FOR SELECT TO authenticated
  USING (private.is_admin());

CREATE POLICY "email_logs_admin_insert"
  ON public.email_logs FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  assunto text NOT NULL,
  corpo_html text NOT NULL,
  variaveis text[] DEFAULT '{}',
  ativo boolean DEFAULT true,
  atualizado_em timestamptz DEFAULT now(),
  atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;

CREATE POLICY "email_templates_admin_all"
  ON public.email_templates FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE TABLE IF NOT EXISTS public.mrr_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  mrr numeric(10,2) NOT NULL DEFAULT 0,
  arr numeric(10,2) NOT NULL DEFAULT 0,
  active_count integer NOT NULL DEFAULT 0,
  trial_count integer NOT NULL DEFAULT 0,
  new_count integer NOT NULL DEFAULT 0,
  churned_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mrr_snapshots ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.mrr_snapshots TO authenticated;

CREATE POLICY "mrr_snapshots_admin_all"
  ON public.mrr_snapshots FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

CREATE POLICY "admin_audit_log_admin_select"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (private.is_admin());

CREATE POLICY "admin_audit_log_admin_insert"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());

-- ---------- Support tickets and push subscriptions ----------

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  oficina text,
  email text,
  categoria text DEFAULT 'duvida' CHECK (categoria IN ('duvida','erro','sugestao','financeiro','outro')),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  status text DEFAULT 'aberto' CHECK (status IN ('aberto','em_atendimento','resolvido')),
  resposta text,
  respondido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_tickets FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;

CREATE POLICY "support_tickets_user_insert"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "support_tickets_user_select"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.is_admin());

CREATE POLICY "support_tickets_user_update"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

CREATE POLICY "push_subscriptions_user_all"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

-- ---------- Affiliate tables: admin direct access, public RPC only ----------

CREATE TABLE IF NOT EXISTS public.affiliate_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  whatsapp text,
  empresa text,
  tipo text DEFAULT 'parceiro',
  slug text NOT NULL UNIQUE,
  coupon_code text UNIQUE,
  stripe_coupon_id text,
  stripe_promo_code_id text,
  pix_key text,
  pix_type text CHECK (pix_type IN ('cpf','cnpj','email','telefone','aleatoria')),
  commission_type text NOT NULL DEFAULT 'tiered',
  commission_custom_pct numeric(5,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','paused')),
  notes text,
  materials jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payment_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month text NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  affiliates_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','processing','paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('click','lead','signup','trial','converted','churned')),
  user_email text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  customer_user_id uuid,
  customer_email text,
  type text NOT NULL CHECK (type IN ('entry','monthly')),
  reference_month text,
  amount numeric(10,2) NOT NULL,
  tier_applied integer,
  plan_value numeric(10,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','canceled')),
  approved_at timestamptz,
  paid_at timestamptz,
  payment_batch_id uuid REFERENCES public.affiliate_payment_batches(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_events_partner ON public.affiliate_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_type ON public.affiliate_events(event_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_created ON public.affiliate_events(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_partner ON public.affiliate_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_month ON public.affiliate_commissions(reference_month);
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_customer ON public.affiliate_commissions(customer_user_id);

ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payment_batches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.affiliate_partners FROM anon;
REVOKE ALL ON public.affiliate_events FROM anon;
REVOKE ALL ON public.affiliate_commissions FROM anon;
REVOKE ALL ON public.affiliate_payment_batches FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_commissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payment_batches TO authenticated;

CREATE POLICY "affiliate_partners_admin_all"
  ON public.affiliate_partners FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "affiliate_events_admin_all"
  ON public.affiliate_events FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "affiliate_commissions_admin_all"
  ON public.affiliate_commissions FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "affiliate_batches_admin_all"
  ON public.affiliate_payment_batches FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE OR REPLACE FUNCTION public.get_public_affiliate_partner(p_slug text)
RETURNS TABLE (
  id uuid,
  nome text,
  slug text,
  coupon_code text,
  tipo text,
  empresa text,
  materials jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ap.id, ap.nome, ap.slug, ap.coupon_code, ap.tipo, ap.empresa, coalesce(ap.materials, '[]'::jsonb)
  FROM public.affiliate_partners ap
  WHERE ap.slug = p_slug
    AND ap.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_affiliate_partner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_affiliate_partner(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_affiliate_click(
  p_partner_id uuid DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
BEGIN
  SELECT ap.id
  INTO v_partner_id
  FROM public.affiliate_partners ap
  WHERE ap.status = 'active'
    AND (
      (p_partner_id IS NOT NULL AND ap.id = p_partner_id)
      OR (p_slug IS NOT NULL AND ap.slug = p_slug)
    )
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_events (partner_id, event_type, metadata)
  VALUES (v_partner_id, 'click', coalesce(p_metadata, '{}'::jsonb));

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.track_affiliate_click(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(uuid, text, jsonb) TO anon, authenticated;

-- ---------- Public quote approval RPCs ----------

CREATE OR REPLACE FUNCTION public.get_os_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', so.id,
    'status', so.status,
    'aprovacao_status', so.aprovacao_status,
    'aprovado_em', so.aprovado_em,
    'km', so.km,
    'observacoes', so.observacoes,
    'agendado_para', so.agendado_para,
    'desconto', so.desconto,
    'created_at', so.created_at,
    'vehicle', json_build_object(
      'placa', v.placa,
      'modelo', v.modelo
    ),
    'client', json_build_object(
      'nome', c.nome,
      'whatsapp', c.whatsapp
    ),
    'items', COALESCE((
      SELECT json_agg(
        json_build_object(
          'descricao', si.descricao,
          'venda', si.venda,
          'garantia', COALESCE(si.garantia, '')
        ) ORDER BY si.created_at
      )
      FROM public.service_items si
      WHERE si.os_id = so.id
    ), '[]'::json),
    'office', COALESCE((
      SELECT json_build_object(
        'nome', od.nome,
        'telefone', COALESCE(od.telefone, ''),
        'endereco', COALESCE(od.endereco, ''),
        'logo', COALESCE(od.logo, '')
      )
      FROM public.office_data od
      WHERE od.user_id = so.user_id
      LIMIT 1
    ), '{}'::json)
  )
  INTO result
  FROM public.service_orders so
  JOIN public.vehicles v ON v.id = so.vehicle_id
  JOIN public.clients c ON c.id = v.client_id
  WHERE so.aprovacao_token = p_token;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_os_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE public.service_orders
  SET
    aprovacao_status = 'aprovado',
    aprovado_em = now(),
    updated_at = now()
  WHERE aprovacao_token = p_token
    AND aprovacao_status = 'pendente'
    AND status NOT IN ('entregue');

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.get_os_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_os_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_os_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_os_by_token(text) TO anon, authenticated;

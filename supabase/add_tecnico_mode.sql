-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Modo Técnico — BoxCerto
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── 1. Campos em profiles ─────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo       text NOT NULL DEFAULT 'master',
  ADD COLUMN IF NOT EXISTS master_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS nome       text DEFAULT '',
  ADD COLUMN IF NOT EXISTS setup_done boolean NOT NULL DEFAULT true;

-- técnicos convidados começam com setup_done = false
-- (definido no trigger abaixo)

-- ── 2. Configuração "pode assumir OS" em office_data ──────────
ALTER TABLE public.office_data
  ADD COLUMN IF NOT EXISTS pode_assumir_os boolean NOT NULL DEFAULT false;

-- ── 3. Atualizar trigger handle_new_user ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tipo      text;
  v_master_id uuid;
  v_nome      text;
BEGIN
  v_tipo      := coalesce(new.raw_user_meta_data->>'tipo', 'master');
  v_nome      := coalesce(new.raw_user_meta_data->>'nome', '');
  v_master_id := CASE
                   WHEN new.raw_user_meta_data->>'master_id' IS NOT NULL
                   THEN (new.raw_user_meta_data->>'master_id')::uuid
                   ELSE NULL
                 END;

  INSERT INTO public.profiles (
    id, oficina, responsavel, whatsapp,
    status, trial_end,
    tipo, master_id, nome, setup_done
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'oficina', ''),
    coalesce(new.raw_user_meta_data->>'responsavel', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    CASE WHEN v_tipo = 'tecnico' THEN 'active' ELSE 'trial' END,
    CASE WHEN v_tipo = 'tecnico' THEN now() + interval '100 years'
         ELSE now() + interval '7 days' END,
    v_tipo,
    v_master_id,
    v_nome,
    CASE WHEN v_tipo = 'tecnico' THEN false ELSE true END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. RLS — profiles: técnico pode ver seu próprio perfil ────
-- (política existente já cobre auth.uid() = id — sem alteração)

-- ── 5. RLS — service_orders: técnico vê OS do seu master ─────
-- Remover política ALL existente e criar políticas separadas por operação
DROP POLICY IF EXISTS "CRUD service_orders próprias" ON public.service_orders;

CREATE POLICY "Master CRUD service_orders"
  ON public.service_orders FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Técnico SELECT service_orders"
  ON public.service_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_orders.user_id
    )
  );

CREATE POLICY "Técnico UPDATE service_orders"
  ON public.service_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_orders.user_id
    )
  );

-- ── 6. RLS — service_items: técnico vê/cria/edita itens ──────
DROP POLICY IF EXISTS "CRUD service_items próprios" ON public.service_items;

CREATE POLICY "Master CRUD service_items"
  ON public.service_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Técnico SELECT service_items"
  ON public.service_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

CREATE POLICY "Técnico INSERT service_items"
  ON public.service_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

CREATE POLICY "Técnico UPDATE service_items"
  ON public.service_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

CREATE POLICY "Técnico DELETE service_items"
  ON public.service_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = service_items.user_id
    )
  );

-- ── 7. RLS — clients: técnico pode consultar ─────────────────
DROP POLICY IF EXISTS "CRUD clients próprios" ON public.clients;

CREATE POLICY "Master CRUD clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Técnico SELECT clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = clients.user_id
    )
  );

-- ── 8. RLS — vehicles: técnico pode consultar ────────────────
DROP POLICY IF EXISTS "CRUD vehicles próprios" ON public.vehicles;

CREATE POLICY "Master CRUD vehicles"
  ON public.vehicles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Técnico SELECT vehicles"
  ON public.vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = vehicles.user_id
    )
  );

-- ── 9. RLS — office_data: técnico pode ler dados da oficina ──
-- Adicionar política SELECT para técnico (a policy existente para master deve permanecer)
CREATE POLICY "Técnico SELECT office_data"
  ON public.office_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'tecnico'
        AND p.master_id = office_data.user_id
    )
  );

-- ── 10. RPC: técnico marca setup como feito ───────────────────
CREATE OR REPLACE FUNCTION public.tecnico_complete_setup()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET setup_done = true
  WHERE id = auth.uid() AND tipo = 'tecnico';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 11. RPC: técnico assume OS (se setting permitir) ──────────
CREATE OR REPLACE FUNCTION public.tecnico_assumir_os(p_os_id uuid, p_nome text)
RETURNS void AS $$
DECLARE
  v_master_id uuid;
  v_pode      boolean;
BEGIN
  SELECT master_id INTO v_master_id
  FROM public.profiles
  WHERE id = auth.uid() AND tipo = 'tecnico';

  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  SELECT pode_assumir_os INTO v_pode
  FROM public.office_data
  WHERE user_id = v_master_id;

  IF NOT coalesce(v_pode, false) THEN
    RAISE EXCEPTION 'Configuração não permite assumir OS de outros técnicos';
  END IF;

  UPDATE public.service_orders
  SET tecnico = p_nome, updated_at = now()
  WHERE id = p_os_id AND user_id = v_master_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

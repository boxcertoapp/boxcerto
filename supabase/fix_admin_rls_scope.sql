-- ============================================================
-- BoxCerto — Remove o "god-mode" do admin nas tabelas por oficina
--
-- Problema: as policies tinham `auth.uid() = user_id OR private.is_admin()`.
-- Logado como admin, isso fazia o admin ver/mexer nos dados de TODAS as
-- oficinas no app normal — e quebrava "adicionar veículo"/editar fotos,
-- porque o WITH CHECK exige cliente/veículo do MESMO user_id.
--
-- O painel admin NÃO lê essas tabelas cross-tenant (usa profiles +
-- impersonação), então o bypass é desnecessário. Removemos ele e mantemos
-- a isolação por user_id + as policies de técnico (intactas).
--
-- Idempotente. Rode no SQL Editor do Supabase.
-- ============================================================

-- clients
DROP POLICY IF EXISTS "clients_master_all" ON public.clients;
CREATE POLICY "clients_master_all" ON public.clients FOR ALL TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- vehicles
DROP POLICY IF EXISTS "vehicles_master_all" ON public.vehicles;
CREATE POLICY "vehicles_master_all" ON public.vehicles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = vehicles.client_id AND c.user_id = vehicles.user_id)
  );

-- service_orders
DROP POLICY IF EXISTS "service_orders_master_all" ON public.service_orders;
CREATE POLICY "service_orders_master_all" ON public.service_orders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = service_orders.vehicle_id AND v.user_id = service_orders.user_id)
  );

-- service_items
DROP POLICY IF EXISTS "service_items_master_all" ON public.service_items;
CREATE POLICY "service_items_master_all" ON public.service_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.service_orders so WHERE so.id = service_items.os_id AND so.user_id = service_items.user_id)
    AND (
      service_items.inventory_id IS NULL
      OR EXISTS (SELECT 1 FROM public.inventory i WHERE i.id = service_items.inventory_id AND i.user_id = service_items.user_id)
    )
  );

-- expenses
DROP POLICY IF EXISTS "expenses_master_all" ON public.expenses;
CREATE POLICY "expenses_master_all" ON public.expenses FOR ALL TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- inventory
DROP POLICY IF EXISTS "inventory_master_all" ON public.inventory;
CREATE POLICY "inventory_master_all" ON public.inventory FOR ALL TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- office_data
DROP POLICY IF EXISTS "office_data_master_all" ON public.office_data;
CREATE POLICY "office_data_master_all" ON public.office_data FOR ALL TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- vendas
DROP POLICY IF EXISTS "vendas_master_all" ON public.vendas;
CREATE POLICY "vendas_master_all" ON public.vendas FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      client_id IS NULL
      OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = vendas.client_id AND c.user_id = vendas.user_id)
    )
  );

-- ============================================================
-- Observação: as policies de TÉCNICO (service_orders_tecnico_*, etc.)
-- e as policies do painel admin (profiles, affiliate_*, app_config…)
-- NÃO são tocadas — admin continua gerenciando pelo painel + impersonação.
-- ============================================================

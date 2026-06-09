-- ============================================================
-- BoxCerto — Fix: atribuicao de afiliado no cadastro
--
-- Problema: o trigger handle_new_user criava o perfil SEM gravar
-- affiliate_ref / affiliate_coupon (nem email) que vem no metadata
-- do signup. Por isso usuarios que entraram por /parceiro/:slug
-- nao apareciam no funil do parceiro ("Em trial") nem geravam
-- comissao no pagamento (o webhook casa por profiles.email e le
-- profiles.affiliate_ref).
--
-- Este script:
--   1. Recria handle_new_user preservando a logica de tecnico e
--      passando a gravar email, affiliate_ref e affiliate_coupon.
--   2. Garante o trigger (CREATE OR REPLACE TRIGGER — sem janela).
--   3. Backfill: preenche os perfis ja criados a partir do metadata
--      do auth.users (corrige contas de teste ja existentes).
--
-- Rodar no Supabase -> SQL Editor. Idempotente.
-- ============================================================

-- 1. Trigger atualizado ----------------------------------------------------
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
    id, oficina, responsavel, whatsapp, email,
    status, trial_end,
    tipo, master_id, nome, setup_done,
    affiliate_ref, affiliate_coupon
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'oficina', ''),
    coalesce(new.raw_user_meta_data->>'responsavel', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.email, ''),
    CASE WHEN v_tipo = 'tecnico' THEN 'active' ELSE 'trial' END,
    CASE WHEN v_tipo = 'tecnico' THEN now() + interval '100 years'
         ELSE now() + interval '7 days' END,
    v_tipo,
    v_master_id,
    v_nome,
    CASE WHEN v_tipo = 'tecnico' THEN false ELSE true END,
    nullif(new.raw_user_meta_data->>'affiliate_ref', ''),
    nullif(new.raw_user_meta_data->>'affiliate_coupon', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garante o trigger (PG14+ : substitui sem janela de gap) ---------------
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill dos perfis ja existentes -------------------------------------
--    Copia do metadata do signup o que ficou faltando (sem sobrescrever
--    valores ja preenchidos).
UPDATE public.profiles p
SET
  affiliate_ref    = coalesce(p.affiliate_ref,    nullif(u.raw_user_meta_data->>'affiliate_ref', '')),
  affiliate_coupon = coalesce(p.affiliate_coupon, nullif(u.raw_user_meta_data->>'affiliate_coupon', '')),
  email            = CASE WHEN p.email IS NULL OR p.email = '' THEN u.email ELSE p.email END
FROM auth.users u
WHERE p.id = u.id
  AND (
        (p.affiliate_ref IS NULL AND nullif(u.raw_user_meta_data->>'affiliate_ref', '') IS NOT NULL)
     OR (p.affiliate_coupon IS NULL AND nullif(u.raw_user_meta_data->>'affiliate_coupon', '') IS NOT NULL)
     OR (p.email IS NULL OR p.email = '')
  );

-- 4. Conferencia (opcional) ------------------------------------------------
-- select email, affiliate_ref, affiliate_coupon, status
-- from public.profiles
-- where affiliate_ref is not null
-- order by created_at desc;

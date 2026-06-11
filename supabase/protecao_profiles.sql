-- ============================================================
-- BoxCerto — Proteção de campos sensíveis da tabela `profiles`
-- (Corrige escalonamento de privilégio: RLS protege LINHA, não COLUNA)
--
-- CONTEXTO: a policy profiles_update_scoped permite o usuário editar
-- a PRÓPRIA linha (auth.uid() = id). Como RLS não restringe COLUNA,
-- qualquer usuário logado consegue, do console do navegador:
--   update({ is_admin: true })                        → vira admin
--   update({ email: 'rogerioknfilho@gmail.com' })     → vira admin
--   update({ tipo: 'tecnico', master_id: VÍTIMA })    → lê dados de outra oficina
--
-- Este trigger BEFORE UPDATE bloqueia a alteração desses campos por
-- usuário comum, liberando service_role (webhook) e admin real.
--
-- VERIFICADO contra o código: nenhum fluxo do app escreve campo
-- protegido em contexto de usuário (todos são setados no INSERT via
-- handle_new_user, ou por admin/webhook). Seguro aplicar.
--
-- Pré-requisito: schema `private` + função private.is_admin()
-- (criados em security_hardening_rls.sql). Confira com:
--   SELECT to_regprocedure('private.is_admin()');   -- não pode ser NULL
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, private
AS $$
DECLARE
  protected_cols text[] := ARRAY[
    -- Privilégio / multi-tenant (OS MAIS CRÍTICOS)
    'is_admin',
    'email',                 -- private.is_admin() também casa por email
    'tipo',                  -- 'tecnico' ativa as policies de técnico
    'master_id',             -- aponta para a vítima no modo técnico
    -- Direito de uso / cobrança
    'status',
    'plan',
    'trial_end',
    'activated_at',
    'next_billing_at',
    'canceled_at',
    -- Stripe
    'stripe_customer_id',
    'stripe_subscription_id',
    -- Afiliados (fraude de comissão)
    'affiliate_partner_id',
    'affiliate_ref',
    'affiliate_coupon',
    -- Campo interno do admin
    'notas_admin'
  ];
  col      text;
  old_doc  jsonb := to_jsonb(OLD);
  new_doc  jsonb := to_jsonb(NEW);
BEGIN
  -- Bypass para: backend (service_role), admin real, e contexto sem JWT
  -- (SQL Editor / superuser — necessário para promover o 1º admin).
  IF auth.uid() IS NULL
     OR auth.role() = 'service_role'
     OR private.is_admin() THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY protected_cols LOOP
    -- O 'new_doc ? col' evita erro caso a coluna não exista no schema
    IF (new_doc ? col)
       AND ((new_doc -> col) IS DISTINCT FROM (old_doc -> col)) THEN
      RAISE EXCEPTION 'Campo protegido em profiles não pode ser alterado pelo usuário: %', col
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields ON public.profiles;

CREATE TRIGGER trg_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.protect_profile_sensitive_fields();

COMMIT;


-- ============================================================
-- TESTES — confirmar que o ataque agora falha
-- ============================================================
--
-- (A) NO CONSOLE DO NAVEGADOR, logado como usuário COMUM (não-admin).
--     Estas devem retornar ERRO (campo protegido):
--
--   const u = (await supabase.auth.getUser()).data.user.id
--   await supabase.from('profiles').update({ is_admin: true }).eq('id', u)
--   await supabase.from('profiles').update({ status: 'active' }).eq('id', u)
--   await supabase.from('profiles').update({ tipo: 'tecnico' }).eq('id', u)
--   await supabase.from('profiles').update({ email: 'rogerioknfilho@gmail.com' }).eq('id', u)
--
--     E estas devem CONTINUAR funcionando (campos liberados):
--
--   await supabase.from('profiles').update({ whatsapp: '51999999999' }).eq('id', u)
--   await supabase.from('profiles').update({ onboarding_dismissed: true }).eq('id', u)
--
-- (B) Conferir que o gatilho está ativo:
--   SELECT tgname, tgenabled FROM pg_trigger
--   WHERE tgrelid = 'public.profiles'::regclass
--     AND tgname = 'trg_protect_profile_sensitive_fields';
--
-- (C) Backend (webhook Stripe, service_role) e admin real continuam
--     conseguindo alterar status/plan/etc. — o bypass cobre isso.
-- ============================================================

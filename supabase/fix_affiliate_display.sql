-- ============================================================
-- BoxCerto — Nome publico do parceiro (display_name)
--
-- Problema: o "nome publico" do parceiro era gravado dentro do
-- JSONB materials (que tambem guarda a lista de materiais como
-- array), causando conflito de formato. A pagina /parceiro/:slug
-- acabava caindo no fallback partner.nome (que pode ser um email).
--
-- Solucao: coluna dedicada display_name + RPC publica atualizada.
-- Rodar no Supabase -> SQL Editor. Idempotente.
-- ============================================================

-- 1. Coluna dedicada -------------------------------------------------------
ALTER TABLE public.affiliate_partners
  ADD COLUMN IF NOT EXISTS display_name text;

-- 2. Backfill: tira o displayName de dentro de materials (quando objeto) ----
UPDATE public.affiliate_partners
SET display_name = nullif(materials->>'displayName', '')
WHERE display_name IS NULL
  AND jsonb_typeof(materials) = 'object'
  AND nullif(materials->>'displayName', '') IS NOT NULL;

-- 3. Normaliza materials para ARRAY (resolve o conflito de formato) ---------
--    Nenhuma UI grava config (color/offerShort/...) em materials hoje, entao
--    objetos remanescentes podem virar lista vazia com seguranca.
UPDATE public.affiliate_partners
SET materials = '[]'::jsonb
WHERE jsonb_typeof(materials) = 'object';

-- 4. RPC publica passa a retornar display_name -----------------------------
--    (precisa DROP porque muda a assinatura de retorno da TABLE)
DROP FUNCTION IF EXISTS public.get_public_affiliate_partner(text);

CREATE FUNCTION public.get_public_affiliate_partner(p_slug text)
RETURNS TABLE (
  id uuid,
  nome text,
  display_name text,
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
  SELECT ap.id, ap.nome, ap.display_name, ap.slug, ap.coupon_code,
         ap.tipo, ap.empresa, coalesce(ap.materials, '[]'::jsonb)
  FROM public.affiliate_partners ap
  WHERE ap.slug = p_slug
    AND ap.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_affiliate_partner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_affiliate_partner(text) TO anon, authenticated;

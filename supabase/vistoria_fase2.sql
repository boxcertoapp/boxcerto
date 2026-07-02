-- ============================================================
-- BoxCerto — Vistoria de entrada (Fase 2: ciente do cliente)
--
-- RPCs NOVOS e separados (não tocam o get_os_by_token da aprovação):
--   get_vistoria_by_token   → devolve a vistoria do cliente (só selada + visível)
--   vistoria_dar_ciente     → grava o aceite com data/hora
--
-- Idempotente. Rode no SQL Editor do Supabase.
-- ============================================================

-- Vistoria visível pro cliente (via token da OS) — só selada e liberada
CREATE OR REPLACE FUNCTION public.get_vistoria_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v jsonb;
BEGIN
  SELECT vistoria INTO _v FROM service_orders WHERE aprovacao_token = p_token LIMIT 1;
  IF _v IS NULL
     OR _v->>'status' <> 'selada'
     OR COALESCE((_v->>'visivel_cliente')::boolean, false) = false THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'combustivel',   _v->'laudo'->>'combustivel',
    'itens',         _v->'laudo'->'itens',
    'observacoes',   _v->'laudo'->>'observacoes',
    'avarias_count', jsonb_array_length(COALESCE(_v->'laudo'->'avarias', '[]'::jsonb)),
    'selada_em',     _v->'laudo'->>'selada_em',
    'ciente',        _v->'ciente'
  );
END;
$$;

-- Cliente confirma o estado de entrada — grava data/hora (uma vez só)
CREATE OR REPLACE FUNCTION public.vistoria_dar_ciente(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _v jsonb; _ciente jsonb;
BEGIN
  SELECT id, vistoria INTO _id, _v FROM service_orders WHERE aprovacao_token = p_token LIMIT 1;
  IF _id IS NULL OR _v IS NULL
     OR _v->>'status' <> 'selada'
     OR COALESCE((_v->>'visivel_cliente')::boolean, false) = false THEN
    RETURN NULL;
  END IF;
  -- Já deu ciente antes? devolve o registro existente (imutável)
  IF _v->'ciente' IS NOT NULL AND _v->'ciente'->>'em' IS NOT NULL THEN
    RETURN _v->'ciente';
  END IF;
  _ciente := jsonb_build_object('em', now());
  UPDATE service_orders SET vistoria = jsonb_set(vistoria, '{ciente}', _ciente) WHERE id = _id;
  RETURN _ciente;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vistoria_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vistoria_dar_ciente(text)   TO anon, authenticated;

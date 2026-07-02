-- ============================================================
-- BoxCerto — Vistoria: fotos visíveis pro cliente
--
-- Atualiza get_vistoria_by_token pra devolver também as fotos públicas
-- (vistoria.pub — caminhos no bucket os-fotos-pub, populados quando o
-- mecânico liga "pedir ciente"). CREATE OR REPLACE, seguro re-rodar.
-- ============================================================

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
    'fotos',         COALESCE(_v->'pub', '[]'::jsonb),
    'selada_em',     _v->'laudo'->>'selada_em',
    'ciente',        _v->'ciente'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vistoria_by_token(text) TO anon, authenticated;

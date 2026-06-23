-- ============================================================
-- BoxCerto — Contato no link de aprovação cai de volta no WhatsApp do cadastro
--
-- PROBLEMA: o link público de aprovação (get_os_by_token) só expunha
-- office_data.telefone (campo do Menu que muitas oficinas não preenchem).
-- Quando vazio, o botão "Falar com a oficina" não tinha número e não abria
-- o WhatsApp — mesmo que a oficina tenha informado o WhatsApp no cadastro
-- (profiles.whatsapp).
--
-- FIX: o objeto `office` passa a ser montado a partir de profiles
-- (sempre existe) com LEFT JOIN em office_data, e o telefone cai de volta
-- no profiles.whatsapp quando office_data.telefone está vazio. O nome
-- também cai de volta no profiles.oficina.
--
-- Idempotente (CREATE OR REPLACE). Rodar no SQL Editor do Supabase.
-- ============================================================

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
    -- Monta a partir de profiles (sempre existe) + office_data (opcional).
    -- telefone: office_data.telefone OU, se vazio, o whatsapp do cadastro.
    'office', COALESCE((
      SELECT json_build_object(
        'nome',     COALESCE(NULLIF(od.nome, ''), p.oficina, 'Oficina'),
        'telefone', COALESCE(NULLIF(od.telefone, ''), NULLIF(p.whatsapp, ''), ''),
        'endereco', COALESCE(od.endereco, ''),
        'logo',     COALESCE(od.logo, '')
      )
      FROM public.profiles p
      LEFT JOIN public.office_data od ON od.user_id = p.id
      WHERE p.id = so.user_id
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

REVOKE ALL ON FUNCTION public.get_os_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_os_by_token(text) TO anon, authenticated;

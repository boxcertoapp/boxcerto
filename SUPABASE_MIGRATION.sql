-- ============================================================
-- BoxCerto — Migração Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar campos de aprovação nas ordens de serviço
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS aprovacao_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS aprovacao_status text DEFAULT 'pendente';

-- 2. Adicionar campos Stripe nos perfis
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS next_billing_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- 3. Função pública para buscar OS pelo token (sem autenticação)
-- SECURITY DEFINER contorna o RLS para leitura pública segura por token
CREATE OR REPLACE FUNCTION get_os_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', so.id,
    'status', so.status,
    'aprovacao_status', so.aprovacao_status,
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
          'garantia', COALESCE(si.garantia, ''),
          'custo', si.custo
        ) ORDER BY si.created_at
      )
      FROM service_items si
      WHERE si.os_id = so.id
    ), '[]'::json),
    'office', COALESCE((
      SELECT json_build_object(
        'nome', od.nome,
        'telefone', COALESCE(od.telefone, ''),
        'endereco', COALESCE(od.endereco, ''),
        'logo', COALESCE(od.logo, '')
      )
      FROM office_data od
      WHERE od.user_id = so.user_id
      LIMIT 1
    ), '{}'::json)
  )
  INTO result
  FROM service_orders so
  JOIN vehicles v ON v.id = so.vehicle_id
  JOIN clients c ON c.id = v.client_id
  WHERE so.aprovacao_token = p_token;

  RETURN result;
END;
$$;

-- 4. Função pública para aprovar OS pelo token
CREATE OR REPLACE FUNCTION approve_os_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE service_orders
  SET
    aprovacao_status = 'aprovado',
    updated_at = now()
  WHERE aprovacao_token = p_token
    AND aprovacao_status = 'pendente'
    AND status NOT IN ('entregue');

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- 5. Grant execute on functions to anon role
GRANT EXECUTE ON FUNCTION get_os_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION get_os_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_os_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION approve_os_by_token(text) TO authenticated;

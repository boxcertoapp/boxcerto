-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Reabrir aprovação quando orçamento for alterado
-- Execute no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Atualizar get_os_by_token para retornar aprovado_em
--    (necessário para o frontend distinguir "pendente pela primeira vez"
--     de "pendente após alteração de itens")
CREATE OR REPLACE FUNCTION get_os_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id',               so.id,
    'status',           so.status,
    'aprovacao_status', so.aprovacao_status,
    'aprovado_em',      so.aprovado_em,
    'km',               so.km,
    'observacoes',      so.observacoes,
    'agendado_para',    so.agendado_para,
    'desconto',         so.desconto,
    'created_at',       so.created_at,
    'vehicle', json_build_object(
      'placa',  v.placa,
      'modelo', v.modelo
    ),
    'client', json_build_object(
      'nome',     c.nome,
      'whatsapp', c.whatsapp
    ),
    'items', COALESCE((
      SELECT json_agg(
        json_build_object(
          'descricao', si.descricao,
          'venda',     si.venda,
          'garantia',  COALESCE(si.garantia, ''),
          'custo',     si.custo
        ) ORDER BY si.created_at
      )
      FROM service_items si
      WHERE si.os_id = so.id
    ), '[]'::json),
    'office', COALESCE((
      SELECT json_build_object(
        'nome',     od.nome,
        'telefone', COALESCE(od.telefone, ''),
        'endereco', COALESCE(od.endereco, ''),
        'logo',     COALESCE(od.logo, '')
      )
      FROM office_data od
      WHERE od.user_id = so.user_id
      LIMIT 1
    ), '{}'::json)
  )
  INTO result
  FROM service_orders so
  JOIN vehicles  v ON v.id = so.vehicle_id
  JOIN clients   c ON c.id = v.client_id
  WHERE so.aprovacao_token = p_token;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_os_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION get_os_by_token(text) TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 2. Trigger: quando itens da OS são alterados depois de aprovada,
--    volta aprovacao_status para 'pendente' automaticamente.
--    aprovado_em é mantido (histórico da última aprovação).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_reset_aprovacao_on_item_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  os_id_ref uuid;
BEGIN
  os_id_ref := COALESCE(NEW.os_id, OLD.os_id);

  UPDATE service_orders
  SET
    aprovacao_status = 'pendente',
    updated_at       = now()
  WHERE id = os_id_ref
    AND aprovacao_status = 'aprovado';

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_aprovacao ON service_items;

CREATE TRIGGER trg_reset_aprovacao
AFTER INSERT OR UPDATE OR DELETE ON service_items
FOR EACH ROW
EXECUTE FUNCTION fn_reset_aprovacao_on_item_change();

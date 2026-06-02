-- ============================================================
-- Número único de OS por usuário/mês
-- Rodar no Supabase SQL Editor (uma vez)
-- ============================================================

-- 1. Tabela de sequência por usuário × mês
CREATE TABLE IF NOT EXISTS os_sequencia (
  user_id       uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano       text,                        -- ex: '0626' (MMYY)
  ultimo_numero int     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, mes_ano)
);

-- 2. Função atômica — sem race condition
CREATE OR REPLACE FUNCTION gerar_numero_os(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mes_ano text;
  v_num     int;
BEGIN
  v_mes_ano := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'MMYY');
  INSERT INTO os_sequencia (user_id, mes_ano, ultimo_numero)
  VALUES (p_user_id, v_mes_ano, 1)
  ON CONFLICT (user_id, mes_ano)
  DO UPDATE SET ultimo_numero = os_sequencia.ultimo_numero + 1
  RETURNING ultimo_numero INTO v_num;
  RETURN lpad(v_num::text, 3, '0') || v_mes_ano;
END;
$$;

-- 3. Coluna numero_os na tabela de OS
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS numero_os text;
CREATE INDEX IF NOT EXISTS idx_so_numero_os ON service_orders(numero_os);

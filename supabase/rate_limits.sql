-- ============================================================
-- BoxCerto — Rate limiting no Postgres (sem serviço externo)
--
-- Usado pelo helper api/_ratelimit.js (camada 2 de aplicação).
-- A camada 1 (flood por IP em todo /api) fica no Vercel Firewall.
--
-- Janela fixa: cada (endpoint+IP[+email]) tem um contador que reseta
-- quando a janela expira. Atômico via INSERT ... ON CONFLICT.
--
-- Rodar no SQL Editor do Supabase. Idempotente.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

-- Tabela de contadores (fica no schema privado, fora da API pública)
CREATE TABLE IF NOT EXISTS private.rate_limits (
  key        text PRIMARY KEY,
  count      integer     NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expires_idx ON private.rate_limits(expires_at);

-- Função chamada pelo backend (service_role) a cada request limitado.
-- Retorna TRUE = permitido, FALSE = bloqueou (estourou o limite na janela).
CREATE OR REPLACE FUNCTION public.rate_limit_hit(
  p_key        text,
  p_max        integer,
  p_window_sec integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO private.rate_limits AS rl (key, count, expires_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_sec))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN rl.expires_at < now() THEN 1 ELSE rl.count + 1 END,
        expires_at = CASE WHEN rl.expires_at < now()
                          THEN now() + make_interval(secs => p_window_sec)
                          ELSE rl.expires_at END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Só o backend (service_role) pode chamar — nunca anon/authenticated.
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;


-- ============================================================
-- LIMPEZA (opcional) — remove contadores velhos que não são mais usados.
-- A tabela é pequena (1 linha por IP/email ativo), mas rode de vez em
-- quando ou agende no cron se quiser manter enxuta:
-- ============================================================
-- DELETE FROM private.rate_limits WHERE expires_at < now() - interval '1 day';

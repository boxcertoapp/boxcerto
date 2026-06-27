-- ============================================================
-- BoxCerto — Fotos na OS (infra)
--
-- Arquitetura: navegador comprime + sobe direto pro Supabase Storage.
-- Bucket privado (internas) + bucket público (só as marcadas visíveis
-- pro cliente). Zero processamento no Vercel.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

-- ── 1. Coluna de fotos na OS + cota no perfil ────────────────
-- fotos: array jsonb de
--   { id, path, thumb, pub, visivel_cliente, etiqueta, w, h, size_bytes, criado_por, criado_em }
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS fotos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Cota de armazenamento por usuário (bytes). Limite v1 = 500 MB.
-- Cache; o cron recalcula o valor real diariamente (self-heal).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fotos_bytes bigint NOT NULL DEFAULT 0;


-- ── 2. Buckets de Storage ────────────────────────────────────
-- os-fotos      → privado (fotos internas; exibidas via signed URL no browser)
-- os-fotos-pub  → público (cópia só das fotos liberadas pro cliente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('os-fotos', 'os-fotos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('os-fotos-pub', 'os-fotos-pub', true)
ON CONFLICT (id) DO NOTHING;


-- ── 3. RLS no Storage ────────────────────────────────────────
-- Caminho privado:  {user_id}/{os_id}/{arquivo}
-- Caminho público:  {user_id}/{arquivo}
-- (storage.foldername(name))[1] = user_id em ambos.

-- Bucket PRIVADO: dono faz tudo na própria pasta
DROP POLICY IF EXISTS "os_fotos_owner_all" ON storage.objects;
CREATE POLICY "os_fotos_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'os-fotos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'os-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket PRIVADO: técnico faz tudo na pasta do master dele
DROP POLICY IF EXISTS "os_fotos_tecnico_all" ON storage.objects;
CREATE POLICY "os_fotos_tecnico_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'os-fotos' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'os-fotos' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  );

-- Bucket PÚBLICO: leitura é pública (bucket public=true). Escrita só do dono/técnico.
DROP POLICY IF EXISTS "os_fotos_pub_owner_write" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "os_fotos_pub_owner_delete" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "os_fotos_pub_tecnico_write" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "os_fotos_pub_tecnico_delete" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  );


-- ── 4. Uso real de fotos (recalcula a cota) ──────────────────
-- Soma os size_bytes de todas as fotos do usuário. Usado pelo cron
-- pra corrigir o cache profiles.fotos_bytes (e disponível pro app).
CREATE OR REPLACE FUNCTION public.fotos_recalc_usage(p_user uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT COALESCE(SUM((f->>'size_bytes')::bigint), 0)
  INTO v_total
  FROM public.service_orders so,
       LATERAL jsonb_array_elements(COALESCE(so.fotos, '[]'::jsonb)) f
  WHERE so.user_id = p_user;

  UPDATE public.profiles SET fotos_bytes = v_total WHERE id = p_user;
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.fotos_recalc_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fotos_recalc_usage(uuid) TO authenticated, service_role;


-- ── 5. Feature flag ──────────────────────────────────────────
-- Liga/desliga a seção de fotos no app (admin sempre vê, p/ testar).
INSERT INTO public.app_config (key, value)
VALUES ('feature_os_fotos', 'off')
ON CONFLICT (key) DO NOTHING;


-- ── 6. get_os_by_token: inclui as fotos liberadas pro cliente ─
-- Recria a função (versão com fallback de telefone) + campo `fotos`
-- contendo só as visíveis (com o caminho público e a etiqueta).
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
    'vehicle', json_build_object('placa', v.placa, 'modelo', v.modelo),
    'client', json_build_object('nome', c.nome, 'whatsapp', c.whatsapp),
    'items', COALESCE((
      SELECT json_agg(json_build_object(
        'descricao', si.descricao, 'venda', si.venda,
        'garantia', COALESCE(si.garantia, '')
      ) ORDER BY si.created_at)
      FROM public.service_items si WHERE si.os_id = so.id
    ), '[]'::json),
    -- Só as fotos marcadas visíveis pro cliente (caminho público + etiqueta)
    'fotos', COALESCE((
      SELECT json_agg(json_build_object(
        'pub', f->>'pub', 'etiqueta', f->>'etiqueta'
      ) ORDER BY (f->>'criado_em'))
      FROM jsonb_array_elements(COALESCE(so.fotos, '[]'::jsonb)) f
      WHERE (f->>'visivel_cliente')::boolean = true
        AND COALESCE(f->>'pub', '') <> ''
    ), '[]'::json),
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

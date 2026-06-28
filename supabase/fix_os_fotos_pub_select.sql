-- ============================================================
-- BoxCerto — Falta a policy de SELECT no bucket público (os-fotos-pub)
--
-- O dono/técnico tinham INSERT/UPDATE/DELETE, mas NÃO SELECT. O storage
-- faz um SELECT interno antes do remove() pra localizar o objeto; sem
-- SELECT, o remove "não enxerga" o arquivo e não apaga nada (sem erro).
-- Efeitos: (1) "despublicar" não removia de fato (a URL pública continuava
-- viva — risco de privacidade); (2) republicar dava 409 "already exists".
--
-- Aqui adicionamos SELECT (escopo: pasta do dono / master do técnico).
-- Idempotente. Rode no SQL Editor do Supabase.
-- ============================================================

-- ── Dono: SELECT ─────────────────────────────────────────────
DROP POLICY IF EXISTS "os_fotos_pub_owner_read" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Técnico: SELECT (pasta do master) ────────────────────────
DROP POLICY IF EXISTS "os_fotos_pub_tecnico_read" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  );

-- Verificação (deve listar os_fotos_pub_owner_read e os_fotos_pub_tecnico_read):
-- select policyname, cmd from pg_policies
-- where schemaname='storage' and tablename='objects' and policyname like 'os_fotos_pub%read%';

-- ============================================================
-- BoxCerto — Corrige "mostrar pro cliente" (bucket público)
--
-- O upload com upsert:true exige policy de UPDATE no storage.objects
-- (o servidor faz INSERT ... ON CONFLICT UPDATE). Faltava a de UPDATE,
-- então o upsert batia em RLS. Aqui garantimos INSERT + UPDATE + DELETE
-- pro dono e pro técnico no bucket os-fotos-pub. Idempotente.
-- ============================================================

-- ── Dono ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "os_fotos_pub_owner_write" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "os_fotos_pub_owner_update" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING      (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "os_fotos_pub_owner_delete" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'os-fotos-pub' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Técnico (pasta do master) ────────────────────────────────
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

DROP POLICY IF EXISTS "os_fotos_pub_tecnico_update" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND p.master_id::text = (storage.foldername(name))[1]
    )
  )
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

-- Verificação (deve listar 6 policies os_fotos_pub_*):
-- select policyname, cmd from pg_policies
-- where schemaname='storage' and tablename='objects' and policyname like 'os_fotos_pub%';

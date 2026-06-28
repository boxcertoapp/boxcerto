-- ============================================================
-- BoxCerto — Refaz as policies de ESCRITA do bucket público usando
-- `name LIKE uid/%` em vez de storage.foldername() (mesma segurança,
-- evita um possível quirk da foldername no caminho de 1 nível).
-- ============================================================

-- ── Dono: INSERT + UPDATE ────────────────────────────────────
DROP POLICY IF EXISTS "os_fotos_pub_owner_write" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'os-fotos-pub' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "os_fotos_pub_owner_update" ON storage.objects;
CREATE POLICY "os_fotos_pub_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING      (bucket_id = 'os-fotos-pub' AND name LIKE auth.uid()::text || '/%')
  WITH CHECK (bucket_id = 'os-fotos-pub' AND name LIKE auth.uid()::text || '/%');

-- ── Técnico: INSERT + UPDATE (pasta do master) ───────────────
DROP POLICY IF EXISTS "os_fotos_pub_tecnico_write" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND name LIKE p.master_id::text || '/%'
    )
  );

DROP POLICY IF EXISTS "os_fotos_pub_tecnico_update" ON storage.objects;
CREATE POLICY "os_fotos_pub_tecnico_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND name LIKE p.master_id::text || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'os-fotos-pub' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tipo = 'tecnico'
        AND name LIKE p.master_id::text || '/%'
    )
  );

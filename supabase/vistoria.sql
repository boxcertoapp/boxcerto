-- ============================================================
-- BoxCerto — Vistoria de entrada (Fase 1: interno, atrás de flag)
--
-- Uma coluna jsonb na OS guarda a vistoria. O "laudo" (fotos guiadas,
-- avarias, combustível, itens, observações) vira IMUTÁVEL quando selada —
-- correção posterior é adendo, nunca edição. Fotos reusam os buckets
-- os-fotos (mesma cota de 500 MB, subpasta /vistoria).
--
-- Estrutura de service_orders.vistoria:
--   { status:'rascunho'|'selada', visivel_cliente:bool,
--     laudo:{ km, combustivel, itens{}, observacoes, guiadas{}, avarias[],
--             selada_em, selada_por },
--     ciente:{em,ip}|null, adendos:[] }
--
-- Idempotente. Rode no SQL Editor do Supabase.
-- ============================================================

-- Coluna da vistoria
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS vistoria jsonb;

-- ── Imutabilidade: laudo selado não muda (só adendos/ciente) ──
CREATE OR REPLACE FUNCTION public.vistoria_lock() RETURNS trigger AS $$
BEGIN
  IF OLD.vistoria IS NOT NULL
     AND OLD.vistoria->>'status' = 'selada'
     AND (NEW.vistoria->'laudo') IS DISTINCT FROM (OLD.vistoria->'laudo') THEN
    RAISE EXCEPTION 'Vistoria selada é imutável — use adendo em vez de editar o laudo.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vistoria_lock ON public.service_orders;
CREATE TRIGGER trg_vistoria_lock
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.vistoria_lock();

-- ── Feature flag (off por padrão; só admin vê até liberar) ──
INSERT INTO public.app_config (key, value)
  VALUES ('feature_vistoria', 'off')
  ON CONFLICT (key) DO NOTHING;

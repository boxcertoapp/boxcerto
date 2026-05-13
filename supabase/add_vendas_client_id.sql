-- Vincula vendas avulsas a um cliente cadastrado (opcional)
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS vendas_client_id_idx ON public.vendas(client_id);

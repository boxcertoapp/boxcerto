-- ============================================================
-- BoxCerto — Ciclo de pagamento das comissões de afiliado
--
-- Comissão só vira "a receber" (approved) após o cliente PAGAR de verdade
-- e passar a janela de 7 dias de reembolso, sem cancelar. Aí é agendada pro
-- próximo dia 5 (com folga de 1 dia: elegível dia 4/5 vai pro mês seguinte).
--
-- Fluxo: pending (em validação) → approved (elegível + agendada) → paid.
--        cancelado/reembolso dentro do hold → canceled.
--
-- Idempotente. Rode no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE affiliate_commissions
  ADD COLUMN IF NOT EXISTS eligible_at timestamptz,  -- quando fica safe de contar (pagto + 7d na entrada; geração na mensal)
  ADD COLUMN IF NOT EXISTS payout_date date;          -- dia 5 agendado pro pagamento

-- Promoção pending→approved varre por (status, eligible_at)
CREATE INDEX IF NOT EXISTS idx_affiliate_comm_eligible
  ON affiliate_commissions(status, eligible_at);

-- Backfill: comissões pending antigas (sem eligible_at) ficam elegíveis pela
-- data de criação, pra não travarem (o cron promove na próxima passada).
UPDATE affiliate_commissions
  SET eligible_at = created_at
  WHERE eligible_at IS NULL AND status = 'pending';

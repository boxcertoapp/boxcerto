// ============================================================
// api/affiliate-session.js
// POST { magic_token, partner_id }
//   → verifica magic token, emite access_token (30d), retorna dados
// POST { access_token, partner_id }
//   → verifica sessão, retorna dados frescos
// ============================================================
const crypto           = require('crypto')
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SRV) return res.status(500).json({ error: 'Configuração incompleta.' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV)
  const { magic_token, access_token, partner_id } = req.body || {}

  if (!partner_id) return res.status(400).json({ error: 'partner_id obrigatório.' })

  // ── Busca o parceiro ─────────────────────────────────────
  const { data: partner, error: pErr } = await supabase
    .from('affiliate_partners')
    .select('*')
    .eq('id', partner_id)
    .maybeSingle()

  if (pErr || !partner) return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.status === 'paused') return res.status(403).json({ error: 'Conta pausada.' })

  const now = new Date()

  // ── Fluxo 1: verificar magic_token (primeiro acesso via link) ──
  if (magic_token) {
    if (!partner.magic_token || partner.magic_token !== magic_token) {
      return res.status(401).json({ error: 'Link inválido.' })
    }
    if (!partner.magic_token_exp || new Date(partner.magic_token_exp) < now) {
      return res.status(401).json({ error: 'Link expirado. Solicite um novo acesso.' })
    }

    // Gera access_token de sessão (válido 30 dias)
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExp   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('affiliate_partners').update({
      magic_token:      null,
      magic_token_exp:  null,
      access_token:     sessionToken,
      access_token_exp: sessionExp,
    }).eq('id', partner_id)

    return res.status(200).json({
      ok:           true,
      access_token: sessionToken,
      session_exp:  sessionExp,
      partner:      sanitize(partner),
      ...(await loadData(supabase, partner_id)),
    })
  }

  // ── Fluxo 2: access_token de sessão (carregamento subsequente) ──
  if (access_token) {
    if (!partner.access_token || partner.access_token !== access_token) {
      return res.status(401).json({ error: 'Sessão inválida.' })
    }
    if (!partner.access_token_exp || new Date(partner.access_token_exp) < now) {
      return res.status(401).json({ error: 'Sessão expirada. Solicite um novo link de acesso.' })
    }

    return res.status(200).json({
      ok:      true,
      partner: sanitize(partner),
      ...(await loadData(supabase, partner_id)),
    })
  }

  return res.status(400).json({ error: 'magic_token ou access_token obrigatório.' })
}

// ── Remove campos sensíveis antes de enviar ao frontend ──────
function sanitize(p) {
  const { magic_token, magic_token_exp, access_token, access_token_exp, stripe_promo_code_id, ...rest } = p
  return rest
}

// ── Carrega dados do dashboard ────────────────────────────────
async function loadData(supabase, partnerId) {
  const [{ data: commissions }, { count: activeRefs }] = await Promise.all([
    supabase
      .from('affiliate_commissions')
      .select('id, type, reference_month, amount, tier_applied, plan_value, status, customer_email, approved_at, paid_at, created_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_partner_id', partnerId)
      .eq('status', 'active'),
  ])

  const comms = commissions || []
  const refs  = activeRefs  || 0

  // Tier pelo número de referências ativas
  const tier = refs >= 21 ? 30 : refs >= 11 ? 25 : 20

  // Agrega totais
  const totals = {
    paid:     comms.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0),
    approved: comms.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0),
    pending:  comms.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0),
  }

  return { commissions: comms, activeRefs: refs, tier, totals }
}

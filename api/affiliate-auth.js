// ============================================================
// api/affiliate-auth.js  — Autenticação de parceiros
// POST { action, ...params }
//
// action = 'login'           → email+senha (sessão direta) OU só email (magic link)
// action = 'session'         → verifica magic_token ou access_token
// action = 'set-password'    → define/altera senha (requer access_token)
// action = 'update-pix'      → atualiza chave PIX (requer access_token)
// action = 'update-identity' → personaliza slug e cupom (requer access_token)
// ============================================================
const crypto           = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const PIX_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

// ── Helpers de senha (PBKDF2 + timing-safe compare) ──────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'))
  } catch { return false }
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_KEY   = process.env.RESEND_API_KEY

  if (!SUPABASE_URL || !SUPABASE_SRV) {
    return res.status(500).json({ error: 'Configuração incompleta.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV)
  const body     = req.body || {}
  const { action } = body

  try {
    if (action === 'login')            return await handleLogin(req, res, supabase, body, RESEND_KEY)
    if (action === 'session')          return await handleSession(req, res, supabase, body)
    if (action === 'set-password')     return await handleSetPassword(req, res, supabase, body)
    if (action === 'update-pix')       return await handleUpdatePix(req, res, supabase, body)
    if (action === 'update-identity')  return await handleUpdateIdentity(req, res, supabase, body)
    return res.status(400).json({ error: 'action inválida. Use: login | session | set-password | update-pix | update-identity' })
  } catch (err) {
    console.error('[AffiliateAuth] Erro inesperado:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Erro interno.' })
  }
}

// ── LOGIN: email+senha (sessão direta) ou só email (magic link)
async function handleLogin(req, res, supabase, body, resendKey) {
  const { email, password } = body
  if (!email?.trim()) return res.status(400).json({ error: 'Email é obrigatório.' })

  // ── Fluxo A: login com senha ─────────────────────────────
  if (password) {
    const { data: partner } = await supabase
      .from('affiliate_partners')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    // Mensagem genérica — não revela se email existe
    if (!partner || !partner.password_hash) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' })
    }
    if (partner.status === 'paused') {
      return res.status(403).json({ error: 'Conta pausada. Entre em contato com o suporte.' })
    }
    if (!verifyPassword(password, partner.password_hash)) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' })
    }

    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExp   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('affiliate_partners').update({
      access_token:     sessionToken,
      access_token_exp: sessionExp,
    }).eq('id', partner.id)

    console.log('[AffiliateAuth] Login com senha:', partner.email)
    return res.status(200).json({
      ok:           true,
      access_token: sessionToken,
      session_exp:  sessionExp,
      partner:      sanitize(partner),
      ...(await loadData(supabase, partner.id)),
    })
  }

  // ── Fluxo B: magic link ───────────────────────────────────
  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('id, nome, email, status')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  // Retorna OK mesmo se não existir (segurança: não revelar emails)
  if (!partner) return res.status(200).json({ ok: true })
  if (partner.status === 'paused') {
    return res.status(403).json({ error: 'Conta pausada. Entre em contato com o suporte.' })
  }

  const token    = crypto.randomBytes(32).toString('hex')
  const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('affiliate_partners').update({
    magic_token:     token,
    magic_token_exp: tokenExp,
  }).eq('id', partner.id)

  const APP_URL   = 'https://boxcerto.com'
  const magicLink = `${APP_URL}/parceiro/dashboard?t=${token}&pid=${partner.id}`

  // Envia magic link via Resend — awaited antes da resposta,
  // pois Vercel encerra a função assim que res.json() é chamado.
  // try/catch garante que falha de email não vira 500 (token já foi salvo).
  try {
    if (resendKey) {
      await Promise.race([
        fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    'BoxCerto <noreply@boxcerto.com>',
            to:      [partner.email],
            subject: 'Seu link de acesso ao painel de parceiro BoxCerto',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Programa de Parceiros</p>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px">
    <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${partner.nome}! Aqui está seu link 🔑</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
      Clique no botão abaixo para acessar seu painel. O link expira em <strong>24 horas</strong>.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${magicLink}" style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Acessar meu painel →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">
      Ou cole no navegador: <span style="word-break:break-all">${magicLink}</span>
    </p>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center">Se não solicitou, ignore este email.</p>
</div>`,
          }),
        }).catch(e => console.warn('[AffiliateAuth/login] Email erro:', e.message)),
        new Promise(resolve => setTimeout(resolve, 6000)),
      ])
    }
  } catch (emailErr) {
    console.error('[AffiliateAuth/login] Erro ao enviar magic link:', emailErr.message)
    // Não propaga — token já foi salvo, parceiro pode usar o link manualmente
  }

  console.log('[AffiliateAuth] Magic link gerado para:', partner.email)
  return res.status(200).json({ ok: true })
}

// ── SESSION: verifica token e retorna dados ──────────────────
async function handleSession(req, res, supabase, body) {
  const { magic_token, access_token, partner_id } = body
  if (!partner_id) return res.status(400).json({ error: 'partner_id obrigatório.' })

  const { data: partner, error } = await supabase
    .from('affiliate_partners')
    .select('*')
    .eq('id', partner_id)
    .maybeSingle()

  if (error || !partner) return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.status === 'paused') return res.status(403).json({ error: 'Conta pausada.' })

  const now = new Date()

  // Fluxo 1: magic_token (primeiro acesso via link)
  if (magic_token) {
    if (!partner.magic_token || partner.magic_token !== magic_token) {
      return res.status(401).json({ error: 'Link inválido.' })
    }
    if (!partner.magic_token_exp || new Date(partner.magic_token_exp) < now) {
      return res.status(401).json({ error: 'Link expirado. Solicite um novo acesso.' })
    }

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

  // Fluxo 2: access_token (sessão existente)
  if (access_token) {
    if (!partner.access_token || partner.access_token !== access_token) {
      return res.status(401).json({ error: 'Sessão inválida.' })
    }
    if (!partner.access_token_exp || new Date(partner.access_token_exp) < now) {
      return res.status(401).json({ error: 'Sessão expirada. Solicite um novo link.' })
    }

    return res.status(200).json({
      ok:      true,
      partner: sanitize(partner),
      ...(await loadData(supabase, partner_id)),
    })
  }

  return res.status(400).json({ error: 'magic_token ou access_token obrigatório.' })
}

// ── SET-PASSWORD: define ou altera senha do parceiro ─────────
async function handleSetPassword(req, res, supabase, body) {
  const { partner_id, access_token, password } = body

  if (!partner_id || !access_token) {
    return res.status(400).json({ error: 'partner_id e access_token obrigatórios.' })
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' })
  }

  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('access_token, access_token_exp')
    .eq('id', partner_id)
    .maybeSingle()

  if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.access_token !== access_token) return res.status(401).json({ error: 'Sessão inválida.' })
  if (new Date(partner.access_token_exp) < new Date()) return res.status(401).json({ error: 'Sessão expirada.' })

  const hash = hashPassword(password)

  const { error } = await supabase
    .from('affiliate_partners')
    .update({ password_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', partner_id)

  if (error) return res.status(500).json({ error: error.message })

  console.log('[AffiliateAuth] Senha definida:', partner_id)
  return res.status(200).json({ ok: true })
}

// ── UPDATE-PIX: atualiza chave PIX do parceiro ───────────────
async function handleUpdatePix(req, res, supabase, body) {
  const { partner_id, access_token, pix_key, pix_type } = body

  if (!partner_id || !access_token) {
    return res.status(400).json({ error: 'partner_id e access_token obrigatórios.' })
  }
  if (!pix_key?.trim())             return res.status(400).json({ error: 'Chave PIX obrigatória.' })
  if (!PIX_TYPES.includes(pix_type)) return res.status(400).json({ error: 'Tipo de PIX inválido.' })

  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('access_token, access_token_exp')
    .eq('id', partner_id)
    .maybeSingle()

  if (!partner)                            return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.access_token !== access_token) return res.status(401).json({ error: 'Sessão inválida.' })
  if (new Date(partner.access_token_exp) < new Date()) return res.status(401).json({ error: 'Sessão expirada.' })

  const { error } = await supabase
    .from('affiliate_partners')
    .update({ pix_key: pix_key.trim(), pix_type, updated_at: new Date().toISOString() })
    .eq('id', partner_id)

  if (error) return res.status(500).json({ error: error.message })

  console.log('[AffiliateAuth] PIX atualizado:', partner_id)
  return res.status(200).json({ ok: true })
}

// ── UPDATE-IDENTITY: personaliza slug e cupom do parceiro ────
async function handleUpdateIdentity(req, res, supabase, body) {
  const { partner_id, access_token, new_slug, new_coupon } = body

  if (!partner_id || !access_token) {
    return res.status(400).json({ error: 'partner_id e access_token obrigatórios.' })
  }
  if (!new_slug && !new_coupon) {
    return res.status(400).json({ error: 'Informe ao menos slug ou cupom para atualizar.' })
  }

  // Validação de formato
  if (new_slug) {
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(new_slug) || new_slug.length < 3 || new_slug.length > 30) {
      return res.status(400).json({ error: 'Slug inválido. Use letras minúsculas, números e hífens (3–30 caracteres, sem hífen no início ou fim).' })
    }
  }
  if (new_coupon) {
    if (!/^[A-Z0-9]{4,12}$/.test(new_coupon)) {
      return res.status(400).json({ error: 'Cupom inválido. Use letras maiúsculas e números (4–12 caracteres).' })
    }
  }

  // Verifica sessão
  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('access_token, access_token_exp, slug, coupon_code')
    .eq('id', partner_id)
    .maybeSingle()

  if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.access_token !== access_token) return res.status(401).json({ error: 'Sessão inválida.' })
  if (new Date(partner.access_token_exp) < new Date()) return res.status(401).json({ error: 'Sessão expirada.' })

  // Verifica unicidade do slug (excluindo o próprio parceiro)
  if (new_slug && new_slug !== partner.slug) {
    const { data: taken } = await supabase
      .from('affiliate_partners')
      .select('id')
      .eq('slug', new_slug)
      .neq('id', partner_id)
      .maybeSingle()
    if (taken) return res.status(409).json({ error: 'Este slug já está em uso. Escolha outro.' })
  }

  // Verifica unicidade do cupom (excluindo o próprio parceiro)
  if (new_coupon && new_coupon !== partner.coupon_code) {
    const { data: taken } = await supabase
      .from('affiliate_partners')
      .select('id')
      .eq('coupon_code', new_coupon)
      .neq('id', partner_id)
      .maybeSingle()
    if (taken) return res.status(409).json({ error: 'Este cupom já está em uso. Escolha outro.' })
  }

  const updates = { updated_at: new Date().toISOString() }
  if (new_slug)   updates.slug        = new_slug
  if (new_coupon) updates.coupon_code = new_coupon

  const { error } = await supabase
    .from('affiliate_partners')
    .update(updates)
    .eq('id', partner_id)

  if (error) return res.status(500).json({ error: error.message })

  console.log('[AffiliateAuth] Identidade atualizada:', partner_id, Object.keys(updates).join(', '))
  return res.status(200).json({
    ok:          true,
    slug:        updates.slug        || partner.slug,
    coupon_code: updates.coupon_code || partner.coupon_code,
  })
}

// ── Helpers ──────────────────────────────────────────────────
function sanitize(p) {
  // Remove campos sensíveis; expõe has_password (bool) em vez do hash
  const { magic_token, magic_token_exp, access_token, access_token_exp,
          stripe_promo_code_id, password_hash, ...rest } = p
  return { ...rest, has_password: !!password_hash }
}

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
  const tier  = refs >= 26 ? 30 : refs >= 11 ? 25 : 20

  return {
    commissions: comms,
    activeRefs:  refs,
    tier,
    totals: {
      paid:     comms.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0),
      approved: comms.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0),
      pending:  comms.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0),
    },
  }
}

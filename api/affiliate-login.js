// ============================================================
// api/affiliate-login.js
// POST { email }  →  gera magic token e envia link por email
// ============================================================
const crypto           = require('crypto')
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email?.trim()) return res.status(400).json({ error: 'Email é obrigatório.' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SRV) return res.status(500).json({ error: 'Configuração incompleta.' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV)

  // Busca o parceiro pelo e-mail
  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('id, nome, email, status')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (!partner) {
    // Retorna OK mesmo assim para não revelar se o email existe
    return res.status(200).json({ ok: true })
  }

  if (partner.status === 'paused') {
    return res.status(403).json({ error: 'Conta pausada. Entre em contato com o suporte.' })
  }

  // Gera magic token (válido 24h)
  const token    = crypto.randomBytes(32).toString('hex')
  const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('affiliate_partners').update({
    magic_token:     token,
    magic_token_exp: tokenExp,
  }).eq('id', partner.id)

  // Monta o link de acesso
  const APP_URL  = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://boxcerto.com'
  const magicLink = `${APP_URL}/parceiro/dashboard?t=${token}&pid=${partner.id}`

  // Envia email com o link
  try {
    await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:  'affiliate_magic_link',
        to:    partner.email,
        nome:  partner.nome,
        link:  magicLink,
      }),
    })
  } catch (e) {
    console.error('[AffiliateLogin] Erro ao enviar email:', e.message)
  }

  console.log('[AffiliateLogin] Magic link gerado para:', partner.email)
  return res.status(200).json({ ok: true })
}

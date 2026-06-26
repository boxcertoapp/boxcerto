// ============================================================
// api/affiliate-apply.js
// POST /api/affiliate-apply
// Recebe o formulário de cadastro de novo parceiro em /parceiro,
// gera slug + cupom únicos, cria o Stripe Promotion Code
// e insere o parceiro no Supabase com status 'active'.
// ============================================================
const Stripe           = require('stripe')
const { createClient } = require('@supabase/supabase-js')
const { clientIp, guard } = require('./_ratelimit')

// ── helpers ───────────────────────────────────────────────────
function slugify(str) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
}

function couponify(name) {
  const first = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().trim().split(/\s+/)[0]
    .replace(/[^A-Z]/g, '').slice(0, 6)
  return first + String(Math.floor(10 + Math.random() * 90))
}

// ── wrapper com try/catch global ─────────────────────────────
module.exports = async function handler(req, res) {
  // CORS restrito à origem do próprio site (evita abuso cross-site do endpoint)
  const allowedOrigins = new Set(['https://boxcerto.com', 'https://www.boxcerto.com'])
  const reqOrigin = req.headers.origin || ''
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.has(reqOrigin) ? reqOrigin : 'https://boxcerto.com')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit: cadastro de parceiro cria cupom Stripe + dispara email
  const ip = clientIp(req)
  if (await guard(req, res, [{ id: `aff-apply:${ip}`, max: 5, windowSec: 3600 }])) return

  try {
    await _apply(req, res)
  } catch (err) {
    console.error('[Affiliate] Erro inesperado:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno. Tente novamente.' })
    }
  }
}

async function _apply(req, res) {
  const STRIPE_KEY       = process.env.STRIPE_SECRET_KEY
  const AFFILIATE_COUPON = process.env.STRIPE_AFFILIATE_COUPON_ID
  const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_KEY       = process.env.RESEND_API_KEY

  if (!SUPABASE_URL || !SUPABASE_SRV_KEY) {
    return res.status(500).json({ error: 'Configuração incompleta no servidor.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV_KEY)
  const { nome, email, whatsapp, empresa, tipo, pix_key } = req.body || {}

  // ── Validações ───────────────────────────────────────────
  if (!nome?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: 'Nome, e-mail e WhatsApp são obrigatórios.' })
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'E-mail inválido.' })
  }

  // ── Verifica duplicidade ─────────────────────────────────
  const { data: existing } = await supabase
    .from('affiliate_partners')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado como parceiro.' })
  }

  // ── Slug único ───────────────────────────────────────────
  let baseSlug = slugify(nome.trim()) || 'parceiro'
  let slug = baseSlug
  let slugTry = 1
  while (true) {
    const { data: taken } = await supabase
      .from('affiliate_partners').select('id').eq('slug', slug).maybeSingle()
    if (!taken) break
    slug = `${baseSlug}-${++slugTry}`
  }

  // ── Cupom único ──────────────────────────────────────────
  let coupon = couponify(nome.trim())
  for (let i = 0; i < 10; i++) {
    const { data: taken } = await supabase
      .from('affiliate_partners').select('id').eq('coupon_code', coupon).maybeSingle()
    if (!taken) break
    coupon = couponify(nome.trim())
  }

  // ── Stripe Promotion Code ────────────────────────────────
  let stripePromoCodeId = null
  const stripeCouponId  = AFFILIATE_COUPON || null

  if (STRIPE_KEY && AFFILIATE_COUPON) {
    try {
      const stripe    = new Stripe(STRIPE_KEY)
      const promoCode = await stripe.promotionCodes.create({
        coupon:       AFFILIATE_COUPON,
        code:         coupon,
        restrictions: { first_time_transaction: true },
        metadata:     { affiliate_slug: slug, affiliate_email: email.trim() },
      })
      stripePromoCodeId = promoCode.id
      console.log('[Affiliate] Stripe promo code criado:', coupon, '->', promoCode.id)
    } catch (e) {
      console.warn('[Affiliate] Stripe promo code não criado:', e.message)
    }
  }

  // ── Insere no Supabase ───────────────────────────────────
  const { data: partner, error: dbErr } = await supabase
    .from('affiliate_partners')
    .insert({
      nome:                 nome.trim(),
      email:                email.trim().toLowerCase(),
      whatsapp:             whatsapp.trim(),
      empresa:              empresa?.trim() || null,
      tipo:                 tipo || 'parceiro',
      slug,
      coupon_code:          coupon,
      stripe_coupon_id:     stripeCouponId,
      stripe_promo_code_id: stripePromoCodeId,
      pix_key:              pix_key?.trim() || null,
      status:               'active',
    })
    .select()
    .single()

  if (dbErr) {
    console.error('[Affiliate] Erro Supabase insert:', dbErr.message)
    return res.status(500).json({ error: 'Erro ao cadastrar. Tente novamente.' })
  }

  console.log('[Affiliate] Parceiro cadastrado:', slug, coupon)

  // ── Pós-insert: evento + email ────────────────────────────
  // REGRA CRÍTICA: parceiro já está salvo no banco — qualquer
  // erro aqui NÃO pode retornar 500 (causaria "já cadastrado" no retry).
  // O try/catch garante que sempre retornamos 200.
  try {
    // Evento (fire-and-forget, opcional)
    if (partner?.id) {
      supabase.from('affiliate_events').insert({
        partner_id: partner.id,
        event_type: 'lead',
        user_email: email.trim().toLowerCase(),
        metadata:   { tipo, empresa: empresa?.trim() || null },
      }).catch(() => {})
    }

    // E-mail de boas-vindas via template central (send-email.js) — garante
    // FROM equipe@, Reply-To, List-Unsubscribe e texto plano (entregabilidade).
    // Awaited com timeout de 6s pois o Vercel encerra a função após res.json().
    {
      await Promise.race([
        fetch('https://boxcerto.com/api/send-email', {
          method:  'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-internal-secret': process.env.EMAIL_SECRET || '',
          },
          body: JSON.stringify({
            type:        'affiliate_welcome',
            to:          email.trim().toLowerCase(),
            nome:        nome.trim(),
            slug,
            coupon_code: coupon,
            link:        `https://boxcerto.com/parceiro/${slug}`,
          }),
        }).catch(e => console.warn('[Affiliate] Email erro:', e.message)),
        new Promise(resolve => setTimeout(resolve, 6000)),
      ])
    }
  } catch (postErr) {
    // Loga mas NÃO propaga — parceiro já salvo, deve retornar 200
    console.error('[Affiliate] Erro pós-insert (evento/email):', postErr.message)
  }

  // ── Resposta final ────────────────────────────────────────
  return res.status(200).json({
    ok:          true,
    slug,
    coupon_code: coupon,
    link:        `https://boxcerto.com/parceiro/${slug}`,
    nome:        nome.trim(),
  })
}

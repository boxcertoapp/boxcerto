// ============================================================
// api/affiliate-apply.js
//
// Recebe o formulário de cadastro de novo parceiro em /parceiro,
// gera slug + cupom únicos, cria o Stripe Promotion Code
// e insere o parceiro no Supabase com status 'active' (auto-aprovação).
// ============================================================
const Stripe              = require('stripe')
const { createClient }    = require('@supabase/supabase-js')

// Remove acentos e caracteres especiais para gerar slug e cupom
function slugify(str) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
}

function couponify(name) {
  const first = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().trim().split(/\s+/)[0]
    .replace(/[^A-Z]/g, '').slice(0, 6)
  const suffix = String(Math.floor(10 + Math.random() * 90))
  return first + suffix
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const STRIPE_KEY        = process.env.STRIPE_SECRET_KEY
  const AFFILIATE_COUPON  = process.env.STRIPE_AFFILIATE_COUPON_ID  // coupon base 10% off
  const SUPABASE_URL      = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SRV_KEY) {
    return res.status(500).json({ error: 'Configuração incompleta no servidor.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV_KEY)
  const { nome, email, whatsapp, empresa, tipo } = req.body || {}

  // Validações básicas
  if (!nome?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: 'Nome, e-mail e WhatsApp são obrigatórios.' })
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'E-mail inválido.' })
  }

  // Verifica se e-mail já existe
  const { data: existing } = await supabase
    .from('affiliate_partners').select('id').eq('email', email.trim()).maybeSingle()
  if (existing) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado como parceiro.' })
  }

  // Gera slug único
  let baseSlug = slugify(nome.trim())
  if (!baseSlug) baseSlug = 'parceiro'
  let slug = baseSlug
  let slugAttempt = 1
  while (true) {
    const { data: taken } = await supabase
      .from('affiliate_partners').select('id').eq('slug', slug).maybeSingle()
    if (!taken) break
    slug = `${baseSlug}-${++slugAttempt}`
  }

  // Gera cupom único
  let coupon = couponify(nome.trim())
  let couponAttempt = 0
  while (couponAttempt < 10) {
    const { data: takenCoupon } = await supabase
      .from('affiliate_partners').select('id').eq('coupon_code', coupon).maybeSingle()
    if (!takenCoupon) break
    coupon = couponify(nome.trim())
    couponAttempt++
  }

  // Cria Stripe Promotion Code (vinculado ao coupon base 10% off)
  let stripePromoCodeId = null
  let stripeCouponId    = AFFILIATE_COUPON || null
  if (STRIPE_KEY && AFFILIATE_COUPON) {
    try {
      const stripe    = new Stripe(STRIPE_KEY)
      const promoCode = await stripe.promotionCodes.create({
        coupon:       AFFILIATE_COUPON,
        code:         coupon,
        max_redemptions: null,    // sem limite de uso por código (um por cliente via Stripe)
        restrictions: { first_time_transaction: true }, // só no primeiro pagamento
        metadata:     { affiliate_slug: slug, affiliate_email: email.trim() },
      })
      stripePromoCodeId = promoCode.id
      console.log('[Affiliate] Stripe promo code criado:', coupon, '->', promoCode.id)
    } catch (stripeErr) {
      // Stripe não configurado → continua sem o código Stripe (rastreamento só por ref)
      console.warn('[Affiliate] Stripe promo code não criado:', stripeErr.message)
    }
  }

  // Insere no Supabase
  const { data: partner, error: dbError } = await supabase
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
      status:               'active',
    })
    .select()
    .single()

  if (dbError) {
    console.error('[Affiliate] Erro Supabase:', dbError.message)
    return res.status(500).json({ error: 'Erro ao cadastrar. Tente novamente.' })
  }

  // Registra evento de cadastro
  await supabase.from('affiliate_events').insert({
    partner_id: partner.id,
    event_type: 'lead',
    user_email: email.trim().toLowerCase(),
    metadata:   { tipo, empresa: empresa?.trim() || null },
  }).catch(() => {})

  // Email de boas-vindas ao parceiro
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : 'https://boxcerto.com.br'
    await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:        'affiliate_welcome',
        to:          email.trim().toLowerCase(),
        nome:        nome.trim(),
        slug,
        coupon_code: coupon,
        link:        `https://boxcerto.com.br/lp?ref=${slug}`,
      }),
    })
  } catch {}

  console.log('[Affiliate] Novo parceiro cadastrado:', slug, coupon)

  return res.status(200).json({
    ok:          true,
    slug,
    coupon_code: coupon,
    link:        `https://boxcerto.com.br/lp?ref=${slug}`,
    nome:        nome.trim(),
  })
}

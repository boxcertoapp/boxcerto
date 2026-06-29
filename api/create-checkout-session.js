const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')
const { clientIp, guard } = require('./_ratelimit')

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Defaults batem com os do app (Assinar.jsx) caso o app_config não tenha a chave.
const DEFAULT_MONTHLY = 97
const DEFAULT_ANNUAL  = 958.80

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit: cria sessões/customers no Stripe
  const ip = clientIp(req)
  if (await guard(req, res, [{ id: `checkout:${ip}`, max: 15, windowSec: 3600 }])) return

  const {
    email, officeName, plan,
    affiliateCoupon, affiliateRef, clientReferenceId,
    cardRequired, withTrial, successPath,
  } = req.body || {}

  if (!email)  return res.status(400).json({ error: 'email é obrigatório' })
  if (!stripe) return res.status(500).json({ error: 'STRIPE_SECRET_KEY não configurada' })

  const normalizedPlan = plan === 'annual' ? 'annual' : 'monthly'

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = (SUPABASE_URL && SUPABASE_SRV) ? createClient(SUPABASE_URL, SUPABASE_SRV) : null

  // ── Preço: lê do app_config (mesma fonte que o app exibe) ──────────
  // Evita depender de Price IDs do Stripe no env (que podem divergir).
  let priceMonthly = DEFAULT_MONTHLY, priceAnnual = DEFAULT_ANNUAL
  if (supabase) {
    try {
      const { data: cfg } = await supabase
        .from('app_config').select('key, value')
        .in('key', ['price_monthly', 'price_annual'])
      for (const row of (cfg || [])) {
        const v = parseFloat(row.value)
        if (row.key === 'price_monthly' && v) priceMonthly = v
        if (row.key === 'price_annual'  && v) priceAnnual  = v
      }
    } catch (e) { console.warn('[Checkout] app_config:', e.message) }
  }

  const valor = normalizedPlan === 'annual' ? priceAnnual : priceMonthly
  const priceData = {
    currency:     'brl',
    product_data: { name: normalizedPlan === 'annual' ? 'BoxCerto — Plano Anual' : 'BoxCerto — Plano Mensal' },
    unit_amount:  Math.round(valor * 100),
    ...(normalizedPlan === 'annual' ? {} : { recurring: { interval: 'month' } }),
  }

  // ── Cupom do parceiro: por coupon_code OU por slug (ref) ───────────
  let stripePromoCodeId = null
  if (supabase && (affiliateCoupon || affiliateRef)) {
    const match = affiliateCoupon
      ? { field: 'coupon_code', value: String(affiliateCoupon).trim().toUpperCase() }
      : { field: 'slug',        value: String(affiliateRef).trim().toLowerCase() }
    try {
      const { data: partner } = await supabase
        .from('affiliate_partners')
        .select('stripe_promo_code_id, status')
        .eq(match.field, match.value)
        .maybeSingle()
      if (partner?.status === 'active' && partner?.stripe_promo_code_id) {
        stripePromoCodeId = partner.stripe_promo_code_id
      }
    } catch (e) { console.warn('[Checkout] cupom de afiliado:', e.message) }
  }

  try {
    const requestOrigin  = req.headers.origin || ''
    const allowedOrigins = new Set(['https://boxcerto.com', 'https://www.boxcerto.com'])
    const origin = allowedOrigins.has(requestOrigin) ? requestOrigin : 'https://boxcerto.com'
    const safeSuccessPath = (typeof successPath === 'string' && successPath.startsWith('/') && !successPath.startsWith('//'))
      ? successPath
      : '/sucesso'

    const isSub = normalizedPlan !== 'annual'

    const session = await stripe.checkout.sessions.create({
      mode: isSub ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      ...(clientReferenceId ? { client_reference_id: clientReferenceId } : {}),
      line_items: [{ price_data: priceData, quantity: 1 }],
      // Cupom do parceiro aplicado direto; sem cupom, deixa o cliente digitar um.
      ...(stripePromoCodeId
        ? { discounts: [{ promotion_code: stripePromoCodeId }] }
        : { allow_promotion_codes: true }),
      ...(isSub
        ? {
            subscription_data: {
              ...(withTrial ? { trial_period_days: 7 } : {}),
              metadata: { officeName: officeName || '', plan: normalizedPlan },
            },
            ...(cardRequired ? { payment_method_collection: 'always' } : {}),
          }
        : {
            payment_intent_data: { metadata: { officeName: officeName || '', plan: normalizedPlan } },
          }),
      metadata: {
        officeName: officeName || '', plan: normalizedPlan, email,
        affiliate_coupon: affiliateCoupon || '', affiliate_ref: affiliateRef || '',
      },
      success_url: `${origin}${safeSuccessPath}`,
      cancel_url:  `${origin}/assinar?payment=cancelled`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}

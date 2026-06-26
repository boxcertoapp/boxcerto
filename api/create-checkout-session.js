const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')
const { clientIp, guard } = require('./_ratelimit')

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit: cria sessões/customers no Stripe
  const ip = clientIp(req)
  if (await guard(req, res, [{ id: `checkout:${ip}`, max: 15, windowSec: 3600 }])) return

  const { email, officeName, plan, affiliateCoupon, cardRequired, successPath } = req.body || {}
  const priceIds = {
    monthly: process.env.STRIPE_PRICE_MONTHLY || process.env.VITE_STRIPE_PRICE_MONTHLY || 'price_1TS4lGRzYtXgEJJxve7kSSAs',
    annual:  process.env.STRIPE_PRICE_ANNUAL  || process.env.VITE_STRIPE_PRICE_ANNUAL,
  }
  const normalizedPlan = plan === 'annual' ? 'annual' : 'monthly'
  const priceId = priceIds[normalizedPlan]

  if (!email) {
    return res.status(400).json({ error: 'email é obrigatório' })
  }
  if (!stripe) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY não configurada' })
  }
  if (!priceId) {
    return res.status(500).json({ error: 'Preço Stripe não configurado' })
  }

  // Busca o stripe_promo_code_id do parceiro se cupom fornecido
  let stripePromoCodeId = null
  if (affiliateCoupon) {
    try {
      const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
      const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (SUPABASE_URL && SUPABASE_SRV) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SRV)
        const { data: partner } = await supabase
          .from('affiliate_partners')
          .select('stripe_promo_code_id, status')
          .eq('coupon_code', affiliateCoupon.trim().toUpperCase())
          .maybeSingle()
        if (partner?.status === 'active' && partner?.stripe_promo_code_id) {
          stripePromoCodeId = partner.stripe_promo_code_id
        }
      }
    } catch (e) { console.warn('[Checkout] Erro ao buscar cupom de afiliado:', e.message) }
  }

  try {
    const requestOrigin = req.headers.origin || ''
    const allowedOrigins = new Set(['https://boxcerto.com', 'https://www.boxcerto.com'])
    const origin = allowedOrigins.has(requestOrigin) ? requestOrigin : 'https://boxcerto.com'
    const safeSuccessPath = typeof successPath === 'string' &&
      successPath.startsWith('/') &&
      !successPath.startsWith('//')
      ? successPath
      : '/app/oficina?payment=success'

    const session = await stripe.checkout.sessions.create({
      mode: normalizedPlan === 'annual' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      // cardRequired: exige cartão mesmo durante o trial (tráfego pago)
      ...(cardRequired ? { payment_method_collection: 'always' } : {}),
      // Aplica desconto do parceiro se cupom válido encontrado
      ...(stripePromoCodeId ? { discounts: [{ promotion_code: stripePromoCodeId }] } : {}),
      subscription_data: normalizedPlan !== 'annual' ? {
        trial_period_days: 7,
        metadata: { officeName, plan: normalizedPlan },
      } : undefined,
      payment_intent_data: normalizedPlan === 'annual' ? {
        metadata: { officeName, plan: normalizedPlan },
      } : undefined,
      metadata: { officeName, plan: normalizedPlan, email, affiliate_coupon: affiliateCoupon || '' },
      success_url: `${origin}${safeSuccessPath}`,
      cancel_url: `${origin}/cadastro?payment=cancelled`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}

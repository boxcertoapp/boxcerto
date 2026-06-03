const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, officeName, plan, affiliateCoupon, cardRequired, successPath } = req.body || {}
  // priceId: aceita do body ou usa fallback do servidor (VITE_ é exposto em serverless)
  const priceId = req.body?.priceId
    || process.env.STRIPE_PRICE_MONTHLY
    || process.env.VITE_STRIPE_PRICE_MONTHLY
    || 'price_1TS4lGRzYtXgEJJxve7kSSAs'

  if (!email) {
    return res.status(400).json({ error: 'email é obrigatório' })
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
    const origin = req.headers.origin || 'https://boxcerto.com'

    const session = await stripe.checkout.sessions.create({
      mode: plan === 'annual' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      // cardRequired: exige cartão mesmo durante o trial (tráfego pago)
      ...(cardRequired ? { payment_method_collection: 'always' } : {}),
      // Aplica desconto do parceiro se cupom válido encontrado
      ...(stripePromoCodeId ? { discounts: [{ promotion_code: stripePromoCodeId }] } : {}),
      subscription_data: plan !== 'annual' ? {
        trial_period_days: 7,
        metadata: { officeName, plan },
      } : undefined,
      payment_intent_data: plan === 'annual' ? {
        metadata: { officeName, plan },
      } : undefined,
      metadata: { officeName, plan, email, affiliate_coupon: affiliateCoupon || '' },
      success_url: successPath
        ? `${origin}${successPath}`
        : `${origin}/app/oficina?payment=success`,
      cancel_url: `${origin}/cadastro?payment=cancelled`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}

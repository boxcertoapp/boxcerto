// ============================================================
// create-trial-checkout.js
// POST /api/create-trial-checkout
// Cria sessão Stripe Checkout para trial com cartão obrigatório.
// Usado quando o usuário vem da LP /comecar (tráfego pago).
// Para subscription mode, Stripe SEMPRE exige cartão — mesmo no trial.
// ============================================================
const Stripe = require('stripe')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, nome } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email obrigatório' })

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  // Price ID do plano mensal — env var com fallback hardcoded (price IDs são públicos)
  const PRICE_MONTHLY =
    process.env.STRIPE_PRICE_MONTHLY ||
    process.env.VITE_STRIPE_PRICE_MONTHLY ||
    'price_1TS4lGRzYtXgEJJxve7kSSAs'

  if (!STRIPE_SECRET_KEY) {
    console.error('[create-trial-checkout] STRIPE_SECRET_KEY não configurada')
    return res.status(500).json({ error: 'Stripe não configurado' })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)

  try {
    const origin      = req.headers.origin || 'https://boxcerto.com'
    const nomeParam   = nome ? `?nome=${encodeURIComponent(nome.split(' ')[0])}` : ''
    const successUrl  = `${origin}/bem-vindo${nomeParam}`
    const cancelUrl   = `${origin}/cadastro?trial=card`

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items:           [{ price: PRICE_MONTHLY, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { email, nome: nome || '', origem: 'trafego_pago' },
      },
      metadata: { email, nome: nome || '', origem: 'trafego_pago' },
      success_url: successUrl,
      cancel_url:  cancelUrl,
    })

    console.log('[create-trial-checkout] Sessão criada:', session.id, 'para', email)
    return res.status(200).json({ url: session.url })

  } catch (err) {
    console.error('[create-trial-checkout] Stripe error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

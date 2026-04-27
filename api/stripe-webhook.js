const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

// Lê o body como Buffer bruto (necessário para verificação de assinatura Stripe)
const getRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
  const SUPABASE_URL          = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars in stripe-webhook')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const stripe   = new Stripe(STRIPE_SECRET_KEY)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // ── Helpers ──────────────────────────────────────────────
  const updateByEmail = async (email, fields) => {
    if (!email) return
    const { error } = await supabase.from('profiles').update(fields).eq('email', email)
    if (error) console.error('Supabase updateByEmail error:', error.message)
  }

  const updateByCustomerId = async (customerId, fields) => {
    if (!customerId) return
    const { error } = await supabase.from('profiles').update(fields).eq('stripe_customer_id', customerId)
    if (error) console.error('Supabase updateByCustomerId error:', error.message)
  }

  // ── Verificação de assinatura ─────────────────────────────
  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // ── Handlers de eventos ───────────────────────────────────
  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session        = event.data.object
        const email          = session.metadata?.email || session.customer_email
        const plan           = session.metadata?.plan  || 'monthly'
        const customerId     = session.customer
        const subscriptionId = session.subscription

        let nextBilling = null
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            nextBilling = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
          } catch (e) { console.error('Error fetching subscription:', e.message) }
        }

        await updateByEmail(email, {
          status:                'active',
          plan,
          stripe_customer_id:    customerId,
          stripe_subscription_id: subscriptionId,
          activated_at:          new Date().toISOString(),
          next_billing_at:       nextBilling,
          canceled_at:           null,
        })
        console.log('✅ Pagamento confirmado:', email, plan)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice        = event.data.object
        const customerId     = invoice.customer
        const subscriptionId = invoice.subscription

        let nextBilling = null
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            nextBilling = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
          } catch (e) { console.error('Error fetching subscription:', e.message) }
        }

        await updateByCustomerId(customerId, {
          status:          'active',
          next_billing_at: nextBilling,
          canceled_at:     null,
        })
        console.log('✅ Pagamento recorrente OK:', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object
        const customerId = invoice.customer
        await updateByCustomerId(customerId, { status: 'inadimplente' })
        console.log('❌ Pagamento falhou:', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId   = subscription.customer
        await updateByCustomerId(customerId, {
          status:                 'cancelado',
          canceled_at:            new Date().toISOString(),
          stripe_subscription_id: null,
          next_billing_at:        null,
        })
        console.log('🚫 Assinatura cancelada:', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId   = subscription.customer
        const nextBilling  = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        await updateByCustomerId(customerId, {
          next_billing_at: nextBilling,
          ...(subscription.status === 'active' ? { status: 'active', canceled_at: null } : {}),
        })
        console.log('🔄 Assinatura atualizada:', customerId)
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message)
    // Retorna 200 mesmo em erro para evitar reenvio pelo Stripe
  }

  return res.status(200).json({ received: true })
}

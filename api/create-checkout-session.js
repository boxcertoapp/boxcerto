import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { priceId, email, officeName, plan } = req.body

  if (!priceId || !email) {
    return res.status(400).json({ error: 'priceId e email são obrigatórios' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'annual' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: plan === 'monthly' ? {
        trial_period_days: 7,
        metadata: { officeName, plan },
      } : undefined,
      payment_intent_data: plan === 'annual' ? {
        metadata: { officeName, plan },
      } : undefined,
      metadata: { officeName, plan, email },
      success_url: `${req.headers.origin}/app/oficina?payment=success`,
      cancel_url: `${req.headers.origin}/cadastro?payment=cancelled`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}

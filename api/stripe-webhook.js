import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Admin client uses service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const updateProfileByEmail = async (email, fields) => {
  if (!email) return
  const { error } = await supabase.from('profiles').update(fields).eq('email', email)
  if (error) console.error('Supabase update error:', error.message)
}

const updateProfileByCustomerId = async (customerId, fields) => {
  if (!customerId) return
  const { error } = await supabase.from('profiles').update(fields).eq('stripe_customer_id', customerId)
  if (error) console.error('Supabase update error:', error.message)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const email = session.metadata?.email || session.customer_email
        const plan = session.metadata?.plan || 'monthly'
        const customerId = session.customer
        const subscriptionId = session.subscription

        // Get next billing date from subscription if available
        let nextBilling = null
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            nextBilling = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
          } catch (e) { console.error('Error fetching subscription:', e.message) }
        }

        await updateProfileByEmail(email, {
          status: 'active',
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          activated_at: new Date().toISOString(),
          next_billing_at: nextBilling,
          canceled_at: null,
        })
        console.log('✅ Pagamento confirmado:', email, plan)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId = invoice.customer
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

        await updateProfileByCustomerId(customerId, {
          status: 'active',
          next_billing_at: nextBilling,
          canceled_at: null,
        })
        console.log('✅ Pagamento recorrente OK:', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer
        await updateProfileByCustomerId(customerId, { status: 'inadimplente' })
        console.log('❌ Pagamento falhou:', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer
        await updateProfileByCustomerId(customerId, {
          status: 'cancelado',
          canceled_at: new Date().toISOString(),
          stripe_subscription_id: null,
          next_billing_at: null,
        })
        console.log('🚫 Assinatura cancelada:', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer
        const nextBilling = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        // Determine plan from price
        const priceId = subscription.items?.data?.[0]?.price?.id
        // We can't know the plan name from priceId alone without mapping,
        // so just update billing date and keep current plan
        await updateProfileByCustomerId(customerId, {
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
    // Still return 200 to avoid Stripe retrying
  }

  res.status(200).json({ received: true })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

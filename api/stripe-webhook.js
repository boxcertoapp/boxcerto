import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

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

  // Processar eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log('✅ Pagamento confirmado:', session.metadata)
      // TODO: Quando Supabase estiver configurado, atualizar status do usuário aqui
      // await supabase.from('profiles').update({ status: 'active' }).eq('email', session.metadata.email)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.log('❌ Pagamento falhou:', invoice.customer_email)
      // TODO: Quando Supabase estiver configurado, marcar como inativo
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log('🚫 Assinatura cancelada:', subscription.id)
      // TODO: Quando Supabase estiver configurado, desativar usuário
      break
    }

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  res.status(200).json({ received: true })
}

export const config = {
  api: {
    bodyParser: false, // Necessário para validação de assinatura Stripe
  },
}

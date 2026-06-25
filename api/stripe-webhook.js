const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

// ── Envia email transacional via API interna ──────────────
const sendEmail = async (type, to, data) => {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://boxcerto.com'
    const res = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-internal-secret': process.env.EMAIL_SECRET || '',
      },
      body: JSON.stringify({ type, to, ...data }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`Email [${type}] falhou:`, err.error)
    } else {
      console.log(`📧 Email [${type}] enviado para ${to}`)
    }
  } catch (err) {
    console.error(`Email [${type}] erro:`, err.message)
  }
}

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
        const userId         = session.client_reference_id || null  // id Supabase (param do Payment Link)
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

        // Casa o perfil de forma robusta: por id (infalível) e, se não houver,
        // por email exato e depois minúsculo. Evita falha de ativação quando o
        // profiles.email está vazio (contas antigas) ou com case diferente.
        let profile = null
        if (userId) {
          const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          profile = data || null
        }
        if (!profile && email) {
          let { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
          if (!data && email !== email.toLowerCase()) {
            ({ data } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle())
          }
          profile = data || null
        }

        if (!profile) {
          // Pagamento que não casou com nenhum usuário — loga ALTO para ativação manual.
          console.error('🚨 Pagamento SEM perfil correspondente — ativar manualmente. session:', session.id, '| email:', email, '| client_reference_id:', userId)
          break
        }

        await supabase.from('profiles').update({
          status:                 'active',
          plan,
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
          activated_at:           new Date().toISOString(),
          next_billing_at:        nextBilling,
          canceled_at:            null,
        }).eq('id', profile.id)
        console.log('✅ Pagamento confirmado:', profile.email || email, plan)

        const destEmail = profile.email || email

        // ── Comissão de afiliado (entrada R$ 50) ───────────────
        try {
          // Atribuição: cupom > ref (já salvo no perfil via user_metadata)
          const affRef    = profile.affiliate_coupon || profile.affiliate_ref
          const affField  = profile.affiliate_coupon ? 'coupon_code' : 'slug'

          if (affRef && !profile.affiliate_partner_id) {
            const { data: partner } = await supabase
              .from('affiliate_partners')
              .select('id, status')
              .eq(affField, affRef).maybeSingle()

            if (partner?.status === 'active') {
              // Valor do plano para cálculo de comissão mensal
              const planValue = session.amount_total ? session.amount_total / 100 : null

              // Comissão de entrada R$ 50 (aprovada automaticamente no checkout)
              await supabase.from('affiliate_commissions').insert({
                partner_id:       partner.id,
                customer_user_id: profile.id,
                customer_email:   destEmail,
                type:             'entry',
                amount:           50.00,
                plan_value:       planValue,
                status:           'approved',
                approved_at:      new Date().toISOString(),
              })

              // Vincula parceiro ao perfil para comissões mensais futuras
              await supabase.from('profiles')
                .update({ affiliate_partner_id: partner.id })
                .eq('id', profile.id)

              // Evento de conversão
              await supabase.from('affiliate_events').insert({
                partner_id: partner.id,
                event_type: 'converted',
                user_email: destEmail,
                user_id:    profile.id,
                metadata:   { plan, session_id: session.id, plan_value: planValue },
              })

              console.log('💰 Comissão de entrada criada — parceiro:', affRef)
            }
          }
        } catch (e) { console.error('Erro ao criar comissão de afiliado:', e.message) }

        // Email de confirmação de pagamento
        if (destEmail) {
          try {
            const proximaCobranca = nextBilling
              ? new Date(nextBilling).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
              : null
            await sendEmail('payment_success', destEmail, {
              nome:            profile.responsavel || destEmail.split('@')[0],
              oficina:         profile.oficina     || 'sua oficina',
              plano:           plan,
              proximaCobranca,
            })
          } catch (e) { console.error('Erro ao enviar email de confirmação:', e.message) }
        }
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

        // Envia email de falha de pagamento
        try {
          const { data: profile } = await supabase
            .from('profiles').select('email, responsavel, oficina').eq('stripe_customer_id', customerId).single()
          if (profile?.email) {
            await sendEmail('payment_failed', profile.email, {
              nome:    profile.responsavel || profile.email.split('@')[0],
              oficina: profile.oficina     || 'sua oficina',
            })
          }
        } catch (e) { console.error('Erro ao enviar email de falha:', e.message) }
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

        // Email imediato de confirmação de cancelamento + link de reativação
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, responsavel, oficina')
            .eq('stripe_customer_id', customerId)
            .single()
          if (profile?.email) {
            await sendEmail('cancelation_confirmed', profile.email, {
              nome:    profile.responsavel || profile.email.split('@')[0],
              oficina: profile.oficina     || 'sua oficina',
            })
          }
        } catch (e) { console.error('Erro ao enviar email de cancelamento:', e.message) }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId   = subscription.customer
        const nextBilling  = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        // Mapa de status Stripe → status interno
        // past_due = safety net: invoice.payment_failed já deveria ter marcado,
        // mas em caso de race condition ou falha de webhook este garante o bloqueio
        const statusMap = {
          active:   { status: 'active',       canceled_at: null },
          past_due: { status: 'inadimplente' },
          unpaid:   { status: 'inadimplente' },
          paused:   { status: 'inadimplente' },
        }
        const statusUpdate = statusMap[subscription.status] || {}

        await updateByCustomerId(customerId, {
          next_billing_at: nextBilling,
          ...statusUpdate,
        })
        console.log(`🔄 Assinatura atualizada (${subscription.status}):`, customerId)
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

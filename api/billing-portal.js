const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY
  const SUPABASE_URL         = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  // Autentica o usuário pelo Bearer token enviado pelo frontend
  const authHeader = req.headers.authorization || ''
  const userToken  = authHeader.replace('Bearer ', '')
  if (!userToken) {
    return res.status(401).json({ error: 'Token ausente' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Busca o usuário pelo token
  const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
  if (authError || !user) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  // Busca o stripe_customer_id do perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.stripe_customer_id) {
    return res.status(400).json({ error: 'Nenhuma assinatura Stripe encontrada para este usuário' })
  }

  try {
    const stripe  = new Stripe(STRIPE_SECRET_KEY)
    const origin  = req.headers.origin || 'https://www.boxcerto.com'
    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${origin}/app/menu`,
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Billing portal error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

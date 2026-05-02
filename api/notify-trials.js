// ============================================================
// notify-trials.js — Notifica usuários com trial expirando
// POST /api/notify-trials (apenas admin)
// Uso manual pelo painel admin para envio pontual + links WhatsApp
// ============================================================
const { createClient } = require('@supabase/supabase-js')

const APP_URL = 'https://boxcerto.com'
const WPP     = '5553997065725'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar se quem chama é admin (via JWT)
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return res.status(403).json({ error: 'Apenas admin' })

  // Busca usuários em trial expirando nos próximos 3 dias
  const now    = new Date()
  const in3d   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, oficina, responsavel, whatsapp, trial_end')
    .eq('status', 'trial')
    .lte('trial_end', in3d.toISOString())
    .gte('trial_end', now.toISOString())
    .order('trial_end', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  if (!users || users.length === 0) {
    return res.status(200).json({ notified: 0, message: 'Nenhum trial expirando nos próximos 3 dias' })
  }

  const results = []

  for (const u of users) {
    const trialEnd       = new Date(u.trial_end)
    const diasRestantes  = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
    const nome           = u.responsavel || u.oficina || u.email.split('@')[0]

    // Envio de email via Resend (API interna)
    let emailSent = false
    if (u.email && process.env.RESEND_API_KEY) {
      try {
        const emailRes = await fetch(`${APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'trial_ending',
            to: u.email,
            nome,
            oficina: u.oficina || '',
            diasRestantes,
          }),
        })
        if (emailRes.ok) {
          emailSent = true
          // Registra no log para evitar duplicata pelo cron
          await supabaseAdmin.from('email_logs').insert({
            destinatario_email: u.email,
            template: `trial_ending_${diasRestantes}d`,
            enviado_em: new Date().toISOString(),
          }).catch(() => {})
        }
      } catch (e) {
        console.error('Erro ao enviar email:', e.message)
      }
    }

    // Link WhatsApp para ação manual do admin
    const msg = encodeURIComponent(
      `Olá ${nome}! 👋 Seu trial do *BoxCerto* expira em *${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}*.\n\n` +
      `Para continuar usando sem perder nenhum dado, escolha seu plano:\n${APP_URL}/assinar`
    )
    const whatsappCliente = u.whatsapp
      ? `https://wa.me/55${u.whatsapp.replace(/\D/g, '')}?text=${msg}`
      : null

    results.push({
      email: u.email,
      oficina: u.oficina,
      diasRestantes,
      emailSent,
      whatsappCliente,
    })
  }

  return res.status(200).json({ notified: results.length, results })
}

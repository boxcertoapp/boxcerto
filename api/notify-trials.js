// ============================================================
// notify-trials.js — Notifica usuários com trial expirando
// Chame via POST /api/notify-trials (apenas admin)
// Variável opcional: RESEND_API_KEY para envio de e-mail
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar se quem chama é admin (via JWT)
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return res.status(403).json({ error: 'Apenas admin' })

  // Buscar usuários em trial com vencimento nos próximos 3 dias
  const now = new Date()
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, oficina, responsavel, whatsapp, trial_end')
    .eq('status', 'trial')
    .lte('trial_end', in3days.toISOString())
    .gte('trial_end', now.toISOString())
    .order('trial_end', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  if (!users || users.length === 0) {
    return res.status(200).json({ notified: 0, message: 'Nenhum trial expirando nos próximos 3 dias' })
  }

  const results = []

  for (const u of users) {
    const trialEnd = new Date(u.trial_end)
    const diffMs = trialEnd - now
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    // ── Envio de e-mail via Resend (se RESEND_API_KEY estiver configurado)
    let emailSent = false
    if (process.env.RESEND_API_KEY && u.email) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'BoxCerto <noreply@boxcerto.com>',
            to: [u.email],
            subject: diasRestantes <= 1
              ? '⚠️ Seu trial BoxCerto expira hoje!'
              : `⏳ Seu trial BoxCerto expira em ${diasRestantes} dias`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <div style="background:#4f46e5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
                </div>
                <h2 style="color:#1e293b">Olá, ${u.responsavel || u.oficina || 'cliente'}!</h2>
                <p style="color:#475569">
                  ${diasRestantes <= 1
                    ? 'Seu período de trial <strong>expira hoje</strong>!'
                    : `Seu período de trial expira em <strong>${diasRestantes} dias</strong>.`
                  }
                </p>
                <p style="color:#475569">
                  Para continuar usando o BoxCerto sem interrupção, escolha um plano:
                </p>
                <a href="https://appboxcerto.vercel.app/assinar"
                   style="display:block;background:#4f46e5;color:white;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:bold;margin:20px 0">
                  Ver planos →
                </a>
                <p style="color:#94a3b8;font-size:12px;text-align:center">
                  BoxCerto · Suporte via WhatsApp
                </p>
              </div>
            `,
          }),
        })
        emailSent = emailRes.ok
      } catch (e) {
        emailSent = false
      }
    }

    // ── Link WhatsApp para notificação manual (gerado para cada usuário)
    const wppMsg = encodeURIComponent(
      `Olá ${u.responsavel || u.oficina}! 👋 Seu trial do *BoxCerto* expira em *${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}*.\n\nPara continuar usando sem interrupção, escolha seu plano:\nhttps://appboxcerto.vercel.app/assinar`
    )
    const whatsappLink = u.whatsapp
      ? `https://wa.me/55${u.whatsapp.replace(/\D/g, '')}?text=${wppMsg}`
      : null

    results.push({
      email: u.email,
      oficina: u.oficina,
      diasRestantes,
      emailSent,
      whatsappLink,
    })
  }

  return res.status(200).json({
    notified: results.length,
    results,
  })
}

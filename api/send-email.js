// ============================================================
// send-email.js — Envio de emails transacionais via Resend
// POST /api/send-email
// Body: { type: 'welcome' | 'trial_ending' | 'custom', to, nome, oficina, ...extras }
// ============================================================
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'BoxCerto <noreply@boxcerto.com>'

const sendViaResend = async ({ to, subject, html }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Resend error')
  }
  return res.json()
}

// ── Templates ─────────────────────────────────────────────
const templates = {

  welcome: ({ nome, oficina, trialDias = 7 }) => ({
    subject: `Bem-vindo ao BoxCerto, ${nome}! 🎉`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px">BoxCerto</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Sistema para Oficinas Mecânicas</p>
  </div>

  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px">
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px">Olá, ${nome}! 👋</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
      Sua oficina <strong>${oficina}</strong> está cadastrada e pronta para usar o BoxCerto.<br>
      Você tem <strong>${trialDias} dias grátis</strong> para explorar tudo sem limitações.
    </p>

    <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 10px">O que você pode fazer agora:</p>
      <p style="color:#475569;font-size:13px;margin:4px 0">✅ Criar ordens de serviço</p>
      <p style="color:#475569;font-size:13px;margin:4px 0">✅ Gerenciar clientes e veículos</p>
      <p style="color:#475569;font-size:13px;margin:4px 0">✅ Controlar estoque e despesas</p>
      <p style="color:#475569;font-size:13px;margin:4px 0">✅ Gerar PDFs de orçamentos e recibos</p>
      <p style="color:#475569;font-size:13px;margin:4px 0">✅ Enviar orçamentos para aprovação do cliente via WhatsApp</p>
    </div>

    <div style="text-align:center">
      <a href="https://appboxcerto.vercel.app/app/oficina"
         style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Acessar minha oficina →
      </a>
    </div>
  </div>

  <div style="background:#fefce8;border-radius:12px;padding:16px;border:1px solid #fde68a;margin-bottom:16px">
    <p style="color:#92400e;font-size:13px;margin:0">
      ⏳ <strong>Seu trial expira em ${trialDias} dias.</strong> Para continuar sem interrupção,
      escolha um plano antes do vencimento.
      <a href="https://appboxcerto.vercel.app/assinar" style="color:#92400e;font-weight:bold">Ver planos →</a>
    </p>
  </div>

  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
    BoxCerto · <a href="https://boxcerto.com" style="color:#94a3b8">boxcerto.com</a><br>
    Dúvidas? Responda este e-mail ou fale pelo WhatsApp.
  </p>
</div>`,
  }),

  trial_ending: ({ nome, oficina, diasRestantes }) => ({
    subject: diasRestantes <= 1
      ? `⚠️ Seu trial BoxCerto expira hoje, ${nome}!`
      : `⏳ Seu trial BoxCerto expira em ${diasRestantes} dias`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${nome}!</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      ${diasRestantes <= 1
        ? `Seu trial da oficina <strong>${oficina}</strong> <strong>expira hoje</strong>!`
        : `Seu trial da oficina <strong>${oficina}</strong> expira em <strong>${diasRestantes} dias</strong>.`
      }
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Para continuar usando o BoxCerto sem perder nenhum dado, assine um plano agora:
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://appboxcerto.vercel.app/assinar"
         style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Ver planos e assinar →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">
      A partir de R$34,90/mês · Cancele quando quiser
    </p>
  </div>
</div>`,
  }),

}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, to, ...data } = req.body
  if (!type || !to) return res.status(400).json({ error: 'type e to são obrigatórios' })

  const template = templates[type]
  if (!template) return res.status(400).json({ error: `Template "${type}" não encontrado` })

  const { subject, html } = template(data)

  try {
    await sendViaResend({ to, subject, html })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Email error:', err)
    return res.status(500).json({ error: err.message })
  }
}

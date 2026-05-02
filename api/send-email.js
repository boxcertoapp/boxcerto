// ============================================================
// send-email.js — Envio de emails transacionais via Resend
// POST /api/send-email
// Body: { type, to, nome, oficina, ...extras }
// ============================================================
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM          = 'BoxCerto <noreply@boxcerto.com>'
const APP_URL       = 'https://boxcerto.com'

const sendViaResend = async ({ to, subject, html }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Resend error')
  }
  return res.json()
}

// ── Estilos base reutilizáveis ──────────────────────────────
const base = (content) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px">BoxCerto</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Sistema para Oficinas Mecânicas</p>
  </div>
  ${content}
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0">
    BoxCerto · <a href="${APP_URL}" style="color:#94a3b8">boxcerto.com</a><br>
    Dúvidas? Responda este e-mail ou fale pelo <a href="https://wa.me/5553997065725" style="color:#94a3b8">WhatsApp</a>.
  </p>
</div>`

const card = (content) =>
  `<div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px">${content}</div>`

const btn = (href, label) =>
  `<div style="text-align:center;margin:24px 0">
    <a href="${href}" style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">${label}</a>
  </div>`

const notice = (color, bg, border, content) =>
  `<div style="background:${bg};border-radius:12px;padding:16px;border:1px solid ${border};margin-bottom:16px">
    <p style="color:${color};font-size:13px;margin:0">${content}</p>
  </div>`

// ── Templates ──────────────────────────────────────────────
const templates = {

  // ── Boas-vindas (dia 0) ─────────────────────────────────
  welcome: ({ nome, oficina, trialDias = 7 }) => ({
    subject: `Bem-vindo ao BoxCerto, ${nome}! 🎉`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px">Olá, ${nome}! 👋</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Sua oficina <strong>${oficina}</strong> está cadastrada e pronta para usar.<br>
          Você tem <strong>${trialDias} dias grátis</strong> para explorar tudo sem limitações e sem cartão.
        </p>
        <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 10px">Comece agora — 3 passos simples:</p>
          <p style="color:#475569;font-size:13px;margin:6px 0">1️⃣ Cadastre um cliente e seu veículo</p>
          <p style="color:#475569;font-size:13px;margin:6px 0">2️⃣ Abra sua primeira OS</p>
          <p style="color:#475569;font-size:13px;margin:6px 0">3️⃣ Envie um orçamento por link para o cliente aprovar</p>
        </div>
        ${btn(`${APP_URL}/app/oficina`, 'Acessar minha oficina →')}
      `)}
      ${notice('#92400e','#fefce8','#fde68a',
        `⏳ <strong>Trial por ${trialDias} dias.</strong> Para continuar sem interrupção, escolha um plano antes do vencimento.
        <a href="${APP_URL}/assinar" style="color:#92400e;font-weight:bold">Ver planos →</a>`)}
    `),
  }),

  // ── Nudge de ativação (dia 2) ────────────────────────────
  activation_nudge: ({ nome, oficina }) => ({
    subject: `${nome}, você já abriu sua primeira OS? 🔧`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Sua oficina está esperando, ${nome}!</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Passamos pela <strong>${oficina}</strong> e vimos que você ainda não abriu nenhuma OS.
          Leva menos de 2 minutos para criar a primeira — prometemos.
        </p>
        <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 8px">Sua primeira OS em 3 cliques:</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">→ Acesse o app e clique em <strong>"Nova OS"</strong></p>
          <p style="color:#475569;font-size:13px;margin:4px 0">→ Digite a placa do carro</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">→ Adicione os serviços e envie o orçamento</p>
        </div>
        ${btn(`${APP_URL}/app/oficina`, 'Abrir minha primeira OS →')}
        <p style="color:#64748b;font-size:13px;text-align:center;margin:8px 0 0">
          Precisa de ajuda? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale com a gente no WhatsApp</a>
        </p>
      `)}
    `),
  }),

  // ── Dica: aprovação por link (dia 4) ─────────────────────
  tip_aprovacao: ({ nome, oficina }) => ({
    subject: `Dica BoxCerto: seu cliente pode aprovar o orçamento com 1 clique 📲`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">O recurso que vai mudar sua oficina, ${nome}</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Chega de ligar pro cliente pra saber se aprovou. Com o BoxCerto, você envia o orçamento por link
          e o cliente aprova direto no celular — com data e hora registradas.
        </p>
        <div style="background:#eef2ff;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #c7d2fe">
          <p style="color:#3730a3;font-size:13px;font-weight:600;margin:0 0 8px">Como usar:</p>
          <p style="color:#4338ca;font-size:13px;margin:4px 0">1. Abra uma OS e vá em <strong>Orçamento</strong></p>
          <p style="color:#4338ca;font-size:13px;margin:4px 0">2. Adicione os itens e clique em <strong>"Gerar link de aprovação"</strong></p>
          <p style="color:#4338ca;font-size:13px;margin:4px 0">3. Cole o link no WhatsApp do cliente</p>
          <p style="color:#4338ca;font-size:13px;margin:4px 0">4. Veja o status mudar para <strong>"Aprovado"</strong> em tempo real ✅</p>
        </div>
        ${btn(`${APP_URL}/app/oficina`, 'Testar agora →')}
      `)}
      ${notice('#065f46','#ecfdf5','#6ee7b7',
        '💡 <strong>Dica bônus:</strong> No mesmo link, o cliente consegue acompanhar o status do carro — sem precisar ligar pra oficina.')}
    `),
  }),

  // ── Trial expirando em 3 dias (dia 4–5) ─────────────────
  trial_ending: ({ nome, oficina, diasRestantes }) => ({
    subject: diasRestantes <= 1
      ? `⚠️ Seu trial BoxCerto expira hoje, ${nome}!`
      : `⏳ Seu trial BoxCerto expira em ${diasRestantes} dias — ${nome}`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">
          ${diasRestantes <= 1 ? '⚠️ Último dia do seu trial!' : `⏳ ${diasRestantes} dias restantes`}
        </h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          ${diasRestantes <= 1
            ? `Olá, ${nome}! O trial da oficina <strong>${oficina}</strong> <strong>expira hoje</strong>.`
            : `Olá, ${nome}! O trial da <strong>${oficina}</strong> expira em <strong>${diasRestantes} dias</strong>.`
          }
          Para continuar usando sem perder nenhum dado, assine um plano agora.
        </p>
        <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 8px">Tudo que fica com você ao assinar:</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">✅ Todos os clientes e veículos cadastrados</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">✅ Histórico completo de ordens de serviço</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">✅ Estoque, financeiro e relatórios</p>
          <p style="color:#475569;font-size:13px;margin:4px 0">✅ Aprovação por link e rastreio de status</p>
        </div>
        ${btn(`${APP_URL}/assinar`, 'Escolher meu plano →')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
          A partir de R$97/mês · Anual por R$79,90/mês · Cancele quando quiser
        </p>
      `)}
    `),
  }),

  // ── Trial expirado (dia 8+) ──────────────────────────────
  trial_expired: ({ nome, oficina }) => ({
    subject: `Seu trial BoxCerto encerrou — seus dados estão seguros, ${nome}`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Seus dados estão aguardando você, ${nome}</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          O trial da <strong>${oficina}</strong> encerrou, mas não se preocupe:
          <strong>todos os seus dados estão salvos e seguros</strong>.
          Assim que você assinar, o acesso é liberado imediatamente.
        </p>
        ${btn(`${APP_URL}/assinar`, 'Reativar minha conta →')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:8px 0 0">
          R$97/mês ou R$79,90/mês no plano anual · Sem contrato de fidelidade
        </p>
      `)}
      ${notice('#7c3aed','#f5f3ff','#ddd6fe',
        '🔒 <strong>Seus dados ficam guardados por 30 dias</strong> após o encerramento do trial. Depois disso, podem ser removidos do sistema.')}
    `),
  }),

  // ── Assinatura ativada (pós-pagamento) ───────────────────
  payment_success: ({ nome, oficina, plano, proximaCobranca }) => ({
    subject: `Assinatura ativada! Bem-vindo ao BoxCerto Pro, ${nome} 🎉`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Tudo certo! Sua assinatura está ativa 🎉</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Olá, ${nome}! O pagamento da <strong>${oficina}</strong> foi confirmado.
          Sua conta está ativa e você tem acesso completo a todos os recursos.
        </p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 8px">Detalhes da assinatura:</p>
          <p style="color:#15803d;font-size:13px;margin:4px 0">📋 Plano: <strong>${plano === 'annual' ? 'Anual — R$79,90/mês' : 'Mensal — R$97/mês'}</strong></p>
          ${proximaCobranca ? `<p style="color:#15803d;font-size:13px;margin:4px 0">📅 Próxima cobrança: <strong>${proximaCobranca}</strong></p>` : ''}
          <p style="color:#15803d;font-size:13px;margin:4px 0">✅ Cancele quando quiser, sem multa</p>
        </div>
        ${btn(`${APP_URL}/app/oficina`, 'Acessar minha oficina →')}
      `)}
      ${notice('#92400e','#fefce8','#fde68a',
        '💡 <strong>Dica:</strong> Para gerenciar sua assinatura, cancelar ou trocar de plano, acesse <strong>Menu → Pagamento</strong> dentro do app.')}
    `),
  }),

  // ── Pagamento falhou ─────────────────────────────────────
  payment_failed: ({ nome, oficina }) => ({
    subject: `⚠️ Problema com o pagamento da sua assinatura BoxCerto`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Não conseguimos processar seu pagamento</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Olá, ${nome}. Houve um problema ao cobrar a assinatura da oficina <strong>${oficina}</strong>.
          Isso pode acontecer por cartão expirado, saldo insuficiente ou bloqueio do banco.
        </p>
        <div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #fecaca">
          <p style="color:#991b1b;font-size:13px;font-weight:600;margin:0 0 8px">O que fazer agora:</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">1. Verifique se o cartão está válido e com limite</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">2. Acesse o portal de pagamento para atualizar os dados</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">3. O Stripe tentará cobrar novamente em alguns dias</p>
        </div>
        ${btn(`${APP_URL}/app/menu`, 'Atualizar forma de pagamento →')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:8px 0 0">
          Precisa de ajuda? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale conosco no WhatsApp</a>
        </p>
      `)}
    `),
  }),

  // ── Resposta de chamado de suporte ──────────────────────
  ticket_reply: ({ nome, titulo, resposta, status }) => ({
    subject: `BoxCerto respondeu seu chamado: ${titulo}`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${nome}! Seu chamado foi respondido ✅</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Respondemos ao seu chamado <strong>"${titulo}"</strong>. Confira abaixo:
        </p>
        <div style="background:#eef2ff;border-radius:12px;padding:18px;border-left:4px solid #4f46e5;margin-bottom:20px">
          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px;letter-spacing:.05em">Resposta da nossa equipe</p>
          <p style="color:#1e293b;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${resposta}</p>
        </div>
        ${status === 'resolvido'
          ? notice('#065f46','#ecfdf5','#6ee7b7', '✅ <strong>Chamado resolvido.</strong> Se o problema persistir, abra um novo chamado no app.')
          : notice('#1e40af','#eff6ff','#bfdbfe', '🔵 <strong>Em atendimento.</strong> Podemos entrar em contato novamente se necessário.')
        }
        ${btn(`${APP_URL}/app/suporte`, 'Ver meu chamado →')}
      `)}
    `),
  }),

  // ── Convite de técnico ───────────────────────────────────
  tecnico_invite: ({ nomeOficina, conviteLink }) => ({
    subject: `Você foi convidado para ${nomeOficina} no BoxCerto 🔧`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px">Olá, técnico! 👋</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          Você foi convidado para acessar o sistema da oficina
          <strong>${nomeOficina}</strong> como técnico no BoxCerto.
        </p>
        ${btn(conviteLink, 'Criar minha conta →')}
        <p style="color:#64748b;font-size:13px;margin:0;text-align:center">
          Ou copie e cole este link no navegador:<br>
          <a href="${conviteLink}" style="color:#4f46e5;word-break:break-all">${conviteLink}</a>
        </p>
      `)}
      ${notice('#6b7280','#f9fafb','#e5e7eb',
        'Se você não esperava este convite, pode ignorar este e-mail com segurança.')}
    `),
  }),

}

// ── Handler ────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, to, ...data } = req.body || {}
  if (!type || !to) return res.status(400).json({ error: 'type e to são obrigatórios' })

  const template = templates[type]
  if (!template) return res.status(400).json({ error: `Template "${type}" não encontrado. Disponíveis: ${Object.keys(templates).join(', ')}` })

  if (!RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY não configurada' })

  const { subject, html } = template(data)

  try {
    const result = await sendViaResend({ to, subject, html })
    console.log(`✅ Email [${type}] enviado para ${to}`)
    return res.status(200).json({ ok: true, id: result.id })
  } catch (err) {
    console.error(`❌ Email [${type}] falhou para ${to}:`, err.message)
    return res.status(500).json({ error: err.message })
  }
}

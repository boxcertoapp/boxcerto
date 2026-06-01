// ============================================================
// send-email.js — Envio de emails transacionais via Resend
// POST /api/send-email
// Body: { type, to, nome, oficina, ...extras }
// ============================================================
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM          = 'BoxCerto <equipe@boxcerto.com>'
const REPLY_TO      = 'suporte@boxcerto.com'
const APP_URL       = 'https://boxcerto.com'

// Emails transacionais não levam List-Unsubscribe (sinaliza marketing pro Gmail)
const TRANSACTIONAL_TYPES = new Set([
  'payment_success', 'payment_failed', 'cancelation_confirmed',
  'reativacao_inadimplente', 'ticket_reply', 'tecnico_invite',
  'affiliate_magic_link',
])

const sendViaResend = async ({ to, subject, html, text, transactional = false }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:     FROM,
      to:       [to],
      subject,
      html,
      ...(text ? { text } : {}),
      reply_to: REPLY_TO,
      ...(!transactional ? {
        headers: {
          'List-Unsubscribe':      `<mailto:${REPLY_TO}?subject=descadastrar>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Resend error')
  }
  return res.json()
}

// ── Estilos base reutilizáveis ──────────────────────────────
const base = (content) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background:#f8fafc">
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
</div>
</body>
</html>`

// ── Converte HTML em texto simples (fallback multipart) ─────
const toPlainText = (html) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

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
  welcome: ({ nome, oficina, trialDias = 7, tipoOficina }) => {
    // Linha personalizada por tipo de oficina
    const tipoLinhas = {
      mecanica:  '🔧 Mecânica geral, revisões e reparos — tudo registrado e rastreável.',
      moto:      '🏍️ OS de motos com controle de peças e histórico por veículo.',
      pesados:   '🚛 Caminhões, ônibus e frotas — histórico completo por veículo.',
      funilaria: '🎨 Orçamentos de funilaria e pintura aprovados antes de começar.',
      eletrica:  '⚡ Diagnósticos elétricos com orçamento aprovado pelo cliente no celular.',
      estetica:  '✨ Polimento, higienização e estética — cliente aprova o pacote por link.',
      geral:     '🚗 Todos os tipos de serviço num só sistema, sem planilha.',
    }
    const tipoLinha = tipoLinhas[tipoOficina] || ''
    return {
      subject: `Bem-vindo ao BoxCerto, ${nome}! 🎉`,
      html: base(`
        ${card(`
          <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px">Olá, ${nome}! 👋</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
            ${tipoLinha ? `${tipoLinha}<br><br>` : ''}Sua oficina <strong>${oficina}</strong> está cadastrada e pronta para usar.<br>
            Você tem <strong>${trialDias} dias grátis</strong> para explorar tudo sem limitações e sem cartão.
          </p>
          <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 10px">Comece agora — 3 passos simples:</p>
            <p style="color:#475569;font-size:13px;margin:6px 0">1️⃣ Cadastre um cliente e seu veículo</p>
            <p style="color:#475569;font-size:13px;margin:6px 0">2️⃣ Crie seu primeiro orçamento</p>
            <p style="color:#475569;font-size:13px;margin:6px 0">3️⃣ Envie por link para o cliente aprovar pelo celular</p>
          </div>
          ${btn(`${APP_URL}/app/oficina`, 'Criar meu primeiro orçamento →')}
        `)}
        ${notice('#92400e','#fefce8','#fde68a',
          `⏳ <strong>Trial por ${trialDias} dias.</strong> Para continuar sem interrupção, escolha um plano antes do vencimento.
          <a href="${APP_URL}/assinar" style="color:#92400e;font-weight:bold">Ver planos →</a>`)}
      `),
    }
  },

  // ── Nudge de ativação (dia 2) ────────────────────────────
  activation_nudge: ({ nome, oficina, tipoOficina, isPesquisando }) => {
    // Versão suave para quem declarou que ainda está pesquisando
    if (isPesquisando) {
      return {
        subject: `${nome}, como está sendo sua experiência com o BoxCerto?`,
        html: base(`
          ${card(`
            <h2 style="color:#1e293b;margin:0 0 12px">Explorando sem pressa? Faz sentido, ${nome} 👋</h2>
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
              Sabemos que avaliar um sistema novo leva tempo — e a decisão precisa fazer sentido
              para a <strong>${oficina}</strong>.
            </p>
            <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 8px">O que você pode fazer agora:</p>
              <p style="color:#475569;font-size:13px;margin:4px 0">→ <strong>Crie um orçamento de teste</strong> com dados fictícios</p>
              <p style="color:#475569;font-size:13px;margin:4px 0">→ Veja como o cliente recebe o link e aprova</p>
              <p style="color:#475569;font-size:13px;margin:4px 0">→ Se fizer sentido, leva menos de 5 min para começar de verdade</p>
            </div>
            ${btn(`${APP_URL}/app/oficina`, 'Experimentar sem compromisso →')}
            <p style="color:#64748b;font-size:13px;text-align:center;margin:8px 0 0">
              Tem dúvidas? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale com a gente — respondemos rápido</a>
            </p>
          `)}
        `),
      }
    }

    // Exemplo específico por tipo de oficina
    const tipoExemplos = {
      mecanica:  'Troca de óleo, freios, revisão — tudo em menos de 2 minutos.',
      moto:      'OS de moto, troca de pneu, revisão — tudo em menos de 2 minutos.',
      pesados:   'Revisão de caminhão, manutenção de frota — orçamento pronto rápido.',
      funilaria: 'Funilaria, amassado, pintura — cliente aprova o valor antes de você começar.',
      eletrica:  'Diagnóstico elétrico, sensor, bateria — orçamento enviado em segundos.',
      estetica:  'Polimento, cristalização, higienização — cliente escolhe o pacote pelo link.',
      geral:     'Qualquer serviço — orçamento pronto em menos de 2 minutos.',
    }
    const exemplo = tipoExemplos[tipoOficina] || 'Qualquer serviço — orçamento pronto em menos de 2 minutos.'

    return {
      subject: `${nome}, crie seu primeiro orçamento em 2 minutos 🔧`,
      html: base(`
        ${card(`
          <h2 style="color:#1e293b;margin:0 0 12px">Sua oficina está esperando, ${nome}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
            A <strong>${oficina}</strong> ainda não criou nenhum orçamento.
            ${exemplo}
          </p>
          <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="color:#334155;font-size:13px;font-weight:600;margin:0 0 8px">Primeiro orçamento em 3 cliques:</p>
            <p style="color:#475569;font-size:13px;margin:4px 0">→ Acesse o app e clique em <strong>"Nova OS"</strong></p>
            <p style="color:#475569;font-size:13px;margin:4px 0">→ Digite a placa e adicione os serviços</p>
            <p style="color:#475569;font-size:13px;margin:4px 0">→ Gere o link e mande no WhatsApp do cliente</p>
          </div>
          ${btn(`${APP_URL}/app/oficina`, 'Criar meu primeiro orçamento →')}
          <p style="color:#64748b;font-size:13px;text-align:center;margin:8px 0 0">
            Precisa de ajuda? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale com a gente no WhatsApp</a>
          </p>
        `)}
      `),
    }
  },

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
    subject: `Ação necessária: pagamento da assinatura BoxCerto`,
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

  // ── Parabéns primeira OS criada ─────────────────────────
  primeira_os: ({ nome, oficina, tipoOficina }) => {
    const tipoDica = {
      mecanica:  'Mecânicas que usam o link de aprovação reduzem ligações do cliente pela metade.',
      moto:      'Donos de moto adoram acompanhar o status no celular — sem precisar ligar.',
      pesados:   'Frota e transportadoras aprovam os serviços por link sem precisar ir à oficina.',
      funilaria: 'Para funilaria, o cliente já aprova o orçamento antes de você começar — zero surpresa.',
      eletrica:  'Com diagnóstico elétrico registrado, o cliente vê o que foi feito e aprova com segurança.',
      estetica:  'Clientes de estética adoram receber o orçamento de pacotes pelo link — e voltam mais.',
      geral:     'Clientes que recebem orçamento por link aprovam muito mais rápido.',
    }
    const dica = tipoDica[tipoOficina] || tipoDica.geral
    return {
      subject: `${nome}, você criou seu primeiro orçamento no BoxCerto! 🎉`,
      html: base(`
        ${card(`
          <h2 style="color:#1e293b;margin:0 0 12px">Primeiro orçamento criado — parabéns, ${nome}! 🎉</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
            A <strong>${oficina}</strong> acabou de dar o primeiro passo para organizar tudo digitalmente.
            Agora vem a parte que os seus clientes vão adorar:
            <strong>receber o orçamento por link e aprovar pelo celular.</strong>
          </p>
          <div style="background:#eef2ff;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #c7d2fe">
            <p style="color:#3730a3;font-size:13px;font-weight:600;margin:0 0 10px">Próximo passo — envie pro cliente agora:</p>
            <p style="color:#4338ca;font-size:13px;margin:4px 0">1. Abra a OS que você criou</p>
            <p style="color:#4338ca;font-size:13px;margin:4px 0">2. Clique em <strong>"Gerar link de aprovação"</strong></p>
            <p style="color:#4338ca;font-size:13px;margin:4px 0">3. Mande o link no WhatsApp do cliente</p>
            <p style="color:#4338ca;font-size:13px;margin:4px 0">4. Veja a aprovação chegar em tempo real ✅</p>
          </div>
          ${btn(`${APP_URL}/app/oficina`, 'Enviar orçamento agora →')}
        `)}
        ${notice('#065f46','#ecfdf5','#6ee7b7',
          `💡 <strong>Dica:</strong> ${dica} E você tem tudo registrado com data e hora.`)}
      `),
    }
  },

  // ── Descoberta de funcionalidade (dia 3) ─────────────────
  feature_discovery: ({ nome, oficina }) => ({
    subject: `${nome}, você conhece o controle financeiro da ${oficina}? 📊`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Tem um recurso que a maioria descobre tarde demais, ${nome}</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Além das ordens de serviço, o BoxCerto tem um <strong>controle financeiro completo</strong>
          integrado à sua oficina — sem precisar de planilha nenhuma.
        </p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #bbf7d0">
          <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 10px">O que você consegue ver:</p>
          <p style="color:#15803d;font-size:13px;margin:5px 0">💰 Receita do mês em tempo real</p>
          <p style="color:#15803d;font-size:13px;margin:5px 0">📋 Cada OS quitada vira uma entrada automática</p>
          <p style="color:#15803d;font-size:13px;margin:5px 0">🔧 Controle de estoque com alerta de peças baixas</p>
          <p style="color:#15803d;font-size:13px;margin:5px 0">📅 Histórico completo de clientes e veículos</p>
        </div>
        ${btn(`${APP_URL}/app/financeiro`, 'Explorar o financeiro →')}
        <p style="color:#64748b;font-size:13px;text-align:center;margin:8px 0 0">
          Precisa de ajuda para configurar? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale conosco</a>
        </p>
      `)}
    `),
  }),

  // ── Cancelamento confirmado (disparo imediato pelo webhook) ─
  cancelation_confirmed: ({ nome, oficina }) => ({
    subject: `Assinatura do BoxCerto encerrada — ${oficina}`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Assinatura encerrada, ${nome} 👋</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Confirmamos o encerramento da assinatura da <strong>${oficina}</strong>.
          Lamentamos ver você partir — se houver algo que poderíamos ter feito melhor,
          adoraríamos ouvir (é só responder este e-mail).
        </p>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          Todos os seus dados <strong>ficam salvos por 30 dias</strong>. Se mudar de ideia,
          você retoma exatamente de onde parou — sem perder clientes, OS ou histórico.
        </p>
        ${btn(`${APP_URL}/assinar`, 'Reativar minha conta →')}
      `)}
      ${notice('#6b7280','#f8fafc','#e2e8f0',
        '🔒 <strong>Dados preservados por 30 dias.</strong> Clientes, veículos, OS e financeiro ficam guardados enquanto aguardamos sua volta.'
      )}
    `),
  }),

  // ── Win-back: reengajamento pós-trial ────────────────────
  win_back: ({ nome, oficina, diasPassados }) => ({
    subject: diasPassados >= 28
      ? `${nome}, última chance — seus dados da ${oficina} ainda estão aqui`
      : `${nome}, sentimos sua falta — volte para a ${oficina} com oferta especial`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">
          ${diasPassados >= 28 ? `⏰ Última chance, ${nome}` : `Sentimos sua falta, ${nome} 👋`}
        </h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          ${diasPassados >= 28
            ? `Os dados da <strong>${oficina}</strong> ainda estão salvos no BoxCerto, mas em breve serão removidos.
               Assine agora e retome de onde parou — sem perder nada.`
            : `O trial da <strong>${oficina}</strong> encerrou há pouco.
               Sabemos que avaliar um novo sistema leva tempo — por isso queremos facilitar sua decisão.`
          }
        </p>
        ${diasPassados < 28 ? `
        <div style="background:#fefce8;border-radius:12px;padding:20px;border:2px solid #fde68a;margin-bottom:20px;text-align:center">
          <p style="color:#92400e;font-size:13px;font-weight:600;margin:0 0 6px">Uma condição especial só para você</p>
          <p style="color:#78350f;font-size:22px;font-weight:800;margin:0">desconto de 30%</p>
          <p style="color:#92400e;font-size:13px;margin:6px 0 0">no primeiro mês — use o cupom <strong>VOLTEI30</strong> no checkout</p>
        </div>` : ''}
        ${btn(`${APP_URL}/assinar`, diasPassados >= 28 ? 'Recuperar minha conta →' : 'Reativar com desconto →')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:8px 0 0">
          Plano mensal a partir de R$97 · Anual por R$79,90/mês
        </p>
      `)}
      ${notice('#7c3aed','#f5f3ff','#ddd6fe',
        diasPassados >= 28
          ? '⚠️ <strong>Atenção:</strong> dados armazenados por até 30 dias após encerramento. Após isso, são removidos permanentemente.'
          : '🔒 <strong>Seus dados estão salvos.</strong> Clientes, veículos e histórico de OS preservados. Assine e retome em segundos.'
      )}
    `),
  }),

  // ── Reativação de inadimplente ───────────────────────────
  reativacao_inadimplente: ({ nome, oficina }) => ({
    subject: `Acesso suspenso — como regularizar agora, ${nome}`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Sua conta está temporariamente suspensa</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">
          Olá, ${nome}. Identificamos uma falha no pagamento da assinatura da <strong>${oficina}</strong>.
          O acesso foi suspenso, mas <strong>todos os seus dados estão preservados</strong>.
        </p>
        <div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #fecaca">
          <p style="color:#991b1b;font-size:13px;font-weight:600;margin:0 0 8px">Para reativar agora:</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">1. Clique no botão abaixo para acessar o portal de pagamento</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">2. Atualize ou troque o cartão de crédito</p>
          <p style="color:#b91c1c;font-size:13px;margin:4px 0">3. O acesso é liberado automaticamente em instantes</p>
        </div>
        ${btn(`${APP_URL}/app/menu`, 'Atualizar pagamento e reativar →')}
        <p style="color:#64748b;font-size:13px;text-align:center;margin:8px 0 0">
          Prefere ajuda? <a href="https://wa.me/5553997065725" style="color:#4f46e5">Fale conosco no WhatsApp</a>
        </p>
      `)}
      ${notice('#92400e','#fefce8','#fde68a',
        '⏳ <strong>Importante:</strong> o acesso permanece suspenso até a regularização do pagamento. Seus dados ficam seguros durante esse período.')}
    `),
  }),

  // ── Boas-vindas ao parceiro/afiliado ────────────────────
  affiliate_welcome: ({ nome, slug, coupon_code, link }) => ({
    subject: `Bem-vindo ao programa de parceiros BoxCerto, ${nome}! 🤝`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px">Olá, ${nome}! 🎉</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          Você agora faz parte do programa de parceiros BoxCerto.
          Veja abaixo tudo que você precisa para começar a indicar e ganhar.
        </p>
        <div style="background:#eef2ff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #c7d2fe">
          <p style="color:#3730a3;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px">Seus dados de parceiro</p>
          <p style="color:#1e293b;font-size:14px;margin:6px 0">
            🔗 <strong>Seu link:</strong><br>
            <a href="${link}" style="color:#4f46e5;word-break:break-all">${link}</a>
          </p>
          <p style="color:#1e293b;font-size:14px;margin:12px 0 0">
            🎟️ <strong>Seu cupom:</strong>
            <span style="background:#4f46e5;color:white;padding:3px 10px;border-radius:6px;font-weight:700;font-size:16px;margin-left:8px">${coupon_code}</span>
          </p>
          <p style="color:#6b7280;font-size:12px;margin:8px 0 0">Cupom dá 10% de desconto na 1ª mensalidade do seu indicado.</p>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 10px">Como funciona sua comissão:</p>
          <p style="color:#15803d;font-size:13px;margin:4px 0">💰 R$50 fixo por cada nova assinatura</p>
          <p style="color:#15803d;font-size:13px;margin:4px 0">📈 + 20% a 30% da mensalidade por 12 meses</p>
          <p style="color:#15803d;font-size:13px;margin:4px 0">💳 Pagamento via PIX todo dia 5 do mês</p>
        </div>
        ${btn(`${APP_URL}/parceiro/dashboard`, 'Acessar meu dashboard →')}
      `)}
      ${notice('#92400e','#fefce8','#fde68a',
        '💡 <strong>Dica:</strong> Cadastre sua chave PIX no dashboard para garantir o recebimento das comissões no dia 5.')}
    `),
  }),

  // ── Magic link para acesso ao dashboard ─────────────────
  affiliate_magic_link: ({ nome, link }) => ({
    subject: `Seu link de acesso ao painel de parceiro BoxCerto`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px;font-size:18px">Olá, ${nome}! Aqui está seu link de acesso 🔑</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          Clique no botão abaixo para acessar seu painel de parceiro. O link é válido por <strong>24 horas</strong>.
        </p>
        ${btn(link, 'Acessar meu painel →')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:8px 0 0">
          Ou copie e cole no navegador:<br>
          <span style="word-break:break-all">${link}</span>
        </p>
      `)}
      ${notice('#6b7280','#f9fafb','#e5e7eb',
        'Se você não solicitou este acesso, ignore este e-mail com segurança.')}
    `),
  }),

  // ── Comissões mensais geradas ────────────────────────────
  affiliate_commission_generated: ({ nome, month_label, count, total, tier }) => ({
    subject: `Suas comissões de ${month_label} foram geradas — BoxCerto`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Novas comissões geradas, ${nome}! 💰</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          As comissões de <strong>${month_label}</strong> foram calculadas e já estão disponíveis no seu painel.
        </p>
        <div style="background:#eef2ff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #c7d2fe">
          <p style="color:#3730a3;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px">Resumo do mês</p>
          <p style="color:#1e293b;font-size:14px;margin:6px 0">
            📋 <strong>${count}</strong> assinatura${count !== 1 ? 's' : ''} ativa${count !== 1 ? 's' : ''}
          </p>
          <p style="color:#1e293b;font-size:14px;margin:6px 0">
            💰 Total pendente: <strong style="color:#4f46e5;font-size:20px">${total}</strong>
          </p>
          <p style="color:#6b7280;font-size:12px;margin:10px 0 0">
            Taxa aplicada: ${tier}% —
            ${tier >= 30 ? 'Ouro (26+ indicados ativos)' : tier >= 25 ? 'Prata (11–25 indicados ativos)' : 'Bronze (até 10 indicados ativos)'}
          </p>
        </div>
        ${btn(`${APP_URL}/parceiro/dashboard`, 'Ver detalhes no painel →')}
      `)}
      ${notice('#065f46','#ecfdf5','#6ee7b7',
        '⏳ Comissões ficam <strong>pendentes de aprovação</strong> até o dia 5. Aprovadas, o pagamento cai direto no seu PIX.')}
    `),
  }),

  // ── Pagamento enviado ao parceiro ─────────────────────────
  affiliate_payment_sent: ({ nome, amount, pix_key }) => ({
    subject: `✅ Pagamento enviado para seu PIX — BoxCerto`,
    html: base(`
      ${card(`
        <h2 style="color:#1e293b;margin:0 0 12px">Pagamento enviado! ✅</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
          Olá, ${nome}! As suas comissões aprovadas foram pagas.
        </p>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #bbf7d0">
          <p style="color:#166534;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px">Detalhes do pagamento</p>
          <p style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;color:#16a34a">${amount}</p>
          ${pix_key ? `<p style="color:#15803d;font-size:13px;margin:4px 0">🔑 Chave PIX: <strong>${pix_key}</strong></p>` : ''}
          <p style="color:#6b7280;font-size:12px;margin:8px 0 0">O crédito pode levar alguns minutos para aparecer na sua conta.</p>
        </div>
        ${btn(`${APP_URL}/parceiro/dashboard`, 'Ver extrato no painel →')}
      `)}
      ${notice('#1e40af','#eff6ff','#bfdbfe',
        '🤝 Obrigado por fazer parte do programa de parceiros BoxCerto! Continue indicando e suba de nível para ganhar mais.')}
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

  // ── Autenticação interna ────────────────────────────────
  const EMAIL_SECRET = process.env.EMAIL_SECRET
  if (EMAIL_SECRET && req.headers['x-internal-secret'] !== EMAIL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { type, to, ...data } = req.body || {}
  if (!type || !to) return res.status(400).json({ error: 'type e to são obrigatórios' })

  const template = templates[type]
  if (!template) return res.status(400).json({ error: `Template "${type}" não encontrado. Disponíveis: ${Object.keys(templates).join(', ')}` })

  if (!RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY não configurada' })

  const { subject, html } = template(data)
  const text = toPlainText(html)
  const transactional = TRANSACTIONAL_TYPES.has(type)

  try {
    const result = await sendViaResend({ to, subject, html, text, transactional })
    console.log(`✅ Email [${type}] enviado para ${to}`)
    return res.status(200).json({ ok: true, id: result.id })
  } catch (err) {
    console.error(`❌ Email [${type}] falhou para ${to}:`, err.message)
    return res.status(500).json({ error: err.message })
  }
}

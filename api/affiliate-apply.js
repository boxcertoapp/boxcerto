// ============================================================
// api/affiliate-apply.js
//
// Recebe o formulário de cadastro de novo parceiro em /parceiro,
// gera slug + cupom únicos, cria o Stripe Promotion Code
// e insere o parceiro no Supabase com status 'active' (auto-aprovação).
// ============================================================
const Stripe              = require('stripe')
const { createClient }    = require('@supabase/supabase-js')

// Remove acentos e caracteres especiais para gerar slug e cupom
function slugify(str) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
}

function couponify(name) {
  const first = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().trim().split(/\s+/)[0]
    .replace(/[^A-Z]/g, '').slice(0, 6)
  const suffix = String(Math.floor(10 + Math.random() * 90))
  return first + suffix
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const STRIPE_KEY        = process.env.STRIPE_SECRET_KEY
  const AFFILIATE_COUPON  = process.env.STRIPE_AFFILIATE_COUPON_ID  // coupon base 10% off
  const SUPABASE_URL      = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SRV_KEY) {
    return res.status(500).json({ error: 'Configuração incompleta no servidor.' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV_KEY)
  const { nome, email, whatsapp, empresa, tipo } = req.body || {}

  // Validações básicas
  if (!nome?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: 'Nome, e-mail e WhatsApp são obrigatórios.' })
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'E-mail inválido.' })
  }

  // Verifica se e-mail já existe
  const { data: existing } = await supabase
    .from('affiliate_partners').select('id').eq('email', email.trim()).maybeSingle()
  if (existing) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado como parceiro.' })
  }

  // Gera slug único
  let baseSlug = slugify(nome.trim())
  if (!baseSlug) baseSlug = 'parceiro'
  let slug = baseSlug
  let slugAttempt = 1
  while (true) {
    const { data: taken } = await supabase
      .from('affiliate_partners').select('id').eq('slug', slug).maybeSingle()
    if (!taken) break
    slug = `${baseSlug}-${++slugAttempt}`
  }

  // Gera cupom único
  let coupon = couponify(nome.trim())
  let couponAttempt = 0
  while (couponAttempt < 10) {
    const { data: takenCoupon } = await supabase
      .from('affiliate_partners').select('id').eq('coupon_code', coupon).maybeSingle()
    if (!takenCoupon) break
    coupon = couponify(nome.trim())
    couponAttempt++
  }

  // Cria Stripe Promotion Code (vinculado ao coupon base 10% off)
  let stripePromoCodeId = null
  let stripeCouponId    = AFFILIATE_COUPON || null
  if (STRIPE_KEY && AFFILIATE_COUPON) {
    try {
      const stripe    = new Stripe(STRIPE_KEY)
      const promoCode = await stripe.promotionCodes.create({
        coupon:       AFFILIATE_COUPON,
        code:         coupon,
        max_redemptions: null,    // sem limite de uso por código (um por cliente via Stripe)
        restrictions: { first_time_transaction: true }, // só no primeiro pagamento
        metadata:     { affiliate_slug: slug, affiliate_email: email.trim() },
      })
      stripePromoCodeId = promoCode.id
      console.log('[Affiliate] Stripe promo code criado:', coupon, '->', promoCode.id)
    } catch (stripeErr) {
      // Stripe não configurado → continua sem o código Stripe (rastreamento só por ref)
      console.warn('[Affiliate] Stripe promo code não criado:', stripeErr.message)
    }
  }

  // Insere no Supabase
  const { data: partner, error: dbError } = await supabase
    .from('affiliate_partners')
    .insert({
      nome:                 nome.trim(),
      email:                email.trim().toLowerCase(),
      whatsapp:             whatsapp.trim(),
      empresa:              empresa?.trim() || null,
      tipo:                 tipo || 'parceiro',
      slug,
      coupon_code:          coupon,
      stripe_coupon_id:     stripeCouponId,
      stripe_promo_code_id: stripePromoCodeId,
      status:               'active',
    })
    .select()
    .single()

  if (dbError) {
    console.error('[Affiliate] Erro Supabase:', dbError.message)
    return res.status(500).json({ error: 'Erro ao cadastrar. Tente novamente.' })
  }

  console.log('[Affiliate] Novo parceiro cadastrado:', slug, coupon)

  // ── Retorna 200 imediatamente — eventos e email são fire-and-forget ──
  // Não usar await: self-calls HTTP em serverless bloqueiam e causam timeout/500
  res.status(200).json({
    ok:          true,
    slug,
    coupon_code: coupon,
    link:        `https://boxcerto.com/lp?ref=${slug}`,
    nome:        nome.trim(),
  })

  // Registra evento de cadastro (após resposta)
  supabase.from('affiliate_events').insert({
    partner_id: partner.id,
    event_type: 'lead',
    user_email: email.trim().toLowerCase(),
    metadata:   { tipo, empresa: empresa?.trim() || null },
  }).catch(() => {})

  // Email de boas-vindas via Resend (direto, sem self-call HTTP)
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    const APP_URL = 'https://boxcerto.com'
    const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Programa de Parceiros</p>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px">
    <h2 style="color:#1e293b;margin:0 0 8px">Olá, ${nome.trim()}! 🎉</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
      Você agora faz parte do programa de parceiros BoxCerto. Veja seus dados abaixo:
    </p>
    <div style="background:#eef2ff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #c7d2fe">
      <p style="color:#3730a3;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px">Seus dados de parceiro</p>
      <p style="color:#1e293b;font-size:14px;margin:6px 0">🔗 <strong>Seu link:</strong><br>
        <a href="${APP_URL}/lp?ref=${slug}" style="color:#4f46e5">${APP_URL}/lp?ref=${slug}</a></p>
      <p style="color:#1e293b;font-size:14px;margin:12px 0 0">🎟️ <strong>Seu cupom:</strong>
        <span style="background:#4f46e5;color:white;padding:3px 10px;border-radius:6px;font-weight:700;font-size:16px;margin-left:8px">${coupon}</span></p>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0">Cupom dá 10% de desconto na 1ª mensalidade do seu indicado.</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${APP_URL}/parceiro/dashboard" style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Acessar meu painel →
      </a>
    </div>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0">
    BoxCerto · <a href="${APP_URL}" style="color:#94a3b8">boxcerto.com</a>
  </p>
</div>`

    fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        from:    'BoxCerto <noreply@boxcerto.com>',
        to:      [email.trim().toLowerCase()],
        subject: `Bem-vindo ao programa de parceiros BoxCerto, ${nome.trim()}! 🤝`,
        html,
      }),
    }).catch(e => console.warn('[Affiliate] Email não enviado:', e.message))
  }
}

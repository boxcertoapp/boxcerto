// ============================================================
// cron-emails.js — Sequência automática de emails de onboarding
// GET /api/cron-emails  (chamado pelo Vercel Cron: 0 10 * * *)
//
// Sequência:
//   Dia 0  → welcome         (enviado no cadastro, não aqui)
//   Dia 2  → activation_nudge (se não criou nenhuma OS ainda)
//   Dia 4  → tip_aprovacao   (dica do link de aprovação)
//   Dia 5  → trial_ending    (2 dias restantes)
//   Dia 6  → trial_ending    (1 dia restante — urgente)
//   Dia 8+ → trial_expired   (trial expirou, dados aguardando)
// ============================================================
const { createClient } = require('@supabase/supabase-js')

const APP_URL = 'https://boxcerto.com'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Verifica se email já foi enviado para esse usuário ─────
async function jaEnviou(email, template) {
  const { data } = await supabase
    .from('email_logs')
    .select('id')
    .eq('destinatario_email', email)
    .eq('template', template)
    .limit(1)
  return (data || []).length > 0
}

// ── Registra email enviado no log ─────────────────────────
async function registrarLog(email, template) {
  await supabase.from('email_logs').insert({
    destinatario_email: email,
    template,
    enviado_em: new Date().toISOString(),
  })
}

// ── Envia email via API interna ───────────────────────────
async function enviarEmail(type, to, data) {
  try {
    const res = await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-internal-secret': process.env.EMAIL_SECRET || '',
      },
      body: JSON.stringify({ type, to, ...data }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error(`[cron] Email [${type}] falhou para ${to}:`, err.error)
      return false
    }
    await registrarLog(to, type)
    console.log(`[cron] ✅ Email [${type}] → ${to}`)
    return true
  } catch (e) {
    console.error(`[cron] Erro ao enviar [${type}] para ${to}:`, e.message)
    return false
  }
}

// ── Verifica se usuário tem ao menos 1 OS criada ──────────
async function temOS(userId) {
  const { count } = await supabase
    .from('service_orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count || 0) > 0
}

// ── Geração de comissões mensais recorrentes ──────────────
async function gerarComissoesMensais(agora) {
  const PLAN_VALUE = 97

  // Mês de referência = mês anterior
  const refDate   = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  const refMonth  = refDate.toISOString().slice(0, 7) // 'YYYY-MM'
  const monthLabel = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  console.log(`[cron/afiliados] Gerando comissões mensais para ${refMonth}`)

  // Parceiros ativos
  const { data: partners } = await supabase
    .from('affiliate_partners')
    .select('id, nome, email, pix_key, commission_type, commission_custom_pct')
    .eq('status', 'active')

  if (!partners || partners.length === 0) {
    console.log('[cron/afiliados] Nenhum parceiro ativo.')
    return
  }

  // Todos os indicados ativos agrupados por parceiro
  const { data: referrals } = await supabase
    .from('profiles')
    .select('id, email, affiliate_partner_id')
    .not('affiliate_partner_id', 'is', null)
    .eq('status', 'active')

  const byPartner = {}
  for (const r of (referrals || [])) {
    if (!byPartner[r.affiliate_partner_id]) byPartner[r.affiliate_partner_id] = []
    byPartner[r.affiliate_partner_id].push(r)
  }

  // Comissões mensais já criadas para este refMonth (dedup)
  const { data: existing } = await supabase
    .from('affiliate_commissions')
    .select('partner_id, customer_email')
    .eq('type', 'monthly')
    .eq('reference_month', refMonth)

  const existingSet = new Set(
    (existing || []).map(c => `${c.partner_id}::${c.customer_email}`)
  )

  for (const partner of partners) {
    const myRefs = byPartner[partner.id] || []
    if (myRefs.length === 0) continue

    // Tier: custom se configurado, senão escalonado
    const tierPct = (partner.commission_type === 'custom' && partner.commission_custom_pct)
      ? Number(partner.commission_custom_pct)
      : myRefs.length >= 26 ? 30 : myRefs.length >= 11 ? 25 : 20

    const amount = Math.round(PLAN_VALUE * tierPct / 100 * 100) / 100

    // Indicados sem comissão neste mês
    const novos = myRefs.filter(r => !existingSet.has(`${partner.id}::${r.email}`))
    if (novos.length === 0) continue

    const rows = novos.map(r => ({
      partner_id:      partner.id,
      type:            'monthly',
      reference_month: refMonth,
      amount,
      tier_applied:    tierPct,
      plan_value:      PLAN_VALUE,
      customer_email:  r.email,
      status:          'pending',
    }))

    const { error } = await supabase.from('affiliate_commissions').insert(rows)
    if (error) {
      console.error(`[cron/afiliados] Erro ao inserir comissões para ${partner.email}:`, error.message)
      continue
    }

    const totalFmt = Number(amount * novos.length).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
    })

    // Notifica o parceiro
    await enviarEmail('affiliate_commission_generated', partner.email, {
      nome:        partner.nome,
      month_label: monthLabel,
      count:       novos.length,
      total:       totalFmt,
      tier:        tierPct,
    })

    console.log(`[cron/afiliados] ✅ ${partner.nome}: ${novos.length} comissões → ${totalFmt} (${tierPct}%)`)
  }
}

// ── Handler principal ─────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // Segurança: aceita secret via header Authorization ou query param ?secret=
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET não configurado' })
  }

  const authHeader = (req.headers.authorization || '').replace('Bearer ', '')
  const authQuery  = (req.query && req.query.secret) || ''
  if (authHeader !== cronSecret && authQuery !== cronSecret) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const agora      = new Date()
  const resultados = { enviados: 0, pulados: 0, erros: 0 }

  // ── Busca todos os usuários em trial ──────────────────────
  const { data: usuarios, error } = await supabase
    .from('profiles')
    .select('id, email, responsavel, oficina, trial_end, created_at, tipo_oficina, cargo')
    .eq('status', 'trial')
    .not('email', 'is', null)

  if (error) {
    console.error('[cron] Erro ao buscar usuários:', error.message)
    return res.status(500).json({ error: error.message })
  }

  if (!usuarios || usuarios.length === 0) {
    return res.status(200).json({ message: 'Nenhum usuário em trial', ...resultados })
  }

  for (const u of usuarios) {
    if (!u.email) continue

    const nome        = u.responsavel || u.oficina || 'dono da oficina'
    const oficina     = u.oficina || 'sua oficina'
    const tipoOficina = u.tipo_oficina || null
    const isPesquisando = u.cargo === 'pesquisando'

    const criadoEm  = new Date(u.created_at)
    const trialEnd  = new Date(u.trial_end)
    const diasSince = Math.floor((agora - criadoEm) / (1000 * 60 * 60 * 24))
    const diasLeft  = Math.ceil((trialEnd - agora) / (1000 * 60 * 60 * 24))

    // ── Sequência baseada em "pelo menos N dias + ainda não enviou"
    // Deduplicação garantida pelo email_logs — não depende de janela exata de 24h

    // 1. Parabéns pela 1ª OS (qualquer dia do trial, assim que criar)
    if (diasSince >= 1 && diasLeft > 0 && !(await jaEnviou(u.email, 'primeira_os'))) {
      if (await temOS(u.id)) {
        const ok = await enviarEmail('primeira_os', u.email, { nome, oficina, tipoOficina })
        ok ? resultados.enviados++ : resultados.erros++
        continue
      }
    }

    // 2. Nudge de ativação — dia 2+ sem OS
    // Pesquisando: recebe versão suave (isPesquisando=true), usuários reais: versão direta
    if (diasSince >= 2 && diasLeft > 0 && !(await jaEnviou(u.email, 'activation_nudge'))) {
      if (!(await temOS(u.id))) {
        const ok = await enviarEmail('activation_nudge', u.email, { nome, oficina, tipoOficina, isPesquisando })
        ok ? resultados.enviados++ : resultados.erros++
      } else {
        await registrarLog(u.email, 'activation_nudge') // marca como "pulado" para não checar novamente
        resultados.pulados++
      }
      continue
    }

    // 3. Descoberta de funcionalidade — dia 3+
    if (diasSince >= 3 && diasLeft > 0 && !(await jaEnviou(u.email, 'feature_discovery'))) {
      const ok = await enviarEmail('feature_discovery', u.email, { nome, oficina })
      ok ? resultados.enviados++ : resultados.erros++
      continue
    }

    // 4. Dica de aprovação por link — dia 4+
    if (diasSince >= 4 && diasLeft > 0 && !(await jaEnviou(u.email, 'tip_aprovacao'))) {
      const ok = await enviarEmail('tip_aprovacao', u.email, { nome, oficina })
      ok ? resultados.enviados++ : resultados.erros++
      continue
    }

    // 5. Aviso 2 dias restantes
    if (diasLeft <= 2 && diasLeft > 1 && !(await jaEnviou(u.email, 'trial_ending_2d'))) {
      const ok = await enviarEmail('trial_ending', u.email, { nome, oficina, diasRestantes: 2 })
      if (ok) { await registrarLog(u.email, 'trial_ending_2d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }

    // 6. Aviso último dia
    if (diasLeft <= 1 && diasLeft >= 0 && !(await jaEnviou(u.email, 'trial_ending_1d'))) {
      const ok = await enviarEmail('trial_ending', u.email, { nome, oficina, diasRestantes: diasLeft < 1 ? 0 : 1 })
      if (ok) { await registrarLog(u.email, 'trial_ending_1d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }

    // 7. Trial expirado (até 30 dias após)
    if (diasLeft < 0 && diasLeft >= -30 && !(await jaEnviou(u.email, 'trial_expired'))) {
      const ok = await enviarEmail('trial_expired', u.email, { nome, oficina })
      ok ? resultados.enviados++ : resultados.erros++
      continue
    }

    // 8. Win-back: 15 dias após expiração
    if (diasLeft <= -14 && !(await jaEnviou(u.email, 'win_back_15d'))) {
      const ok = await enviarEmail('win_back', u.email, { nome, oficina, diasPassados: 15 })
      if (ok) { await registrarLog(u.email, 'win_back_15d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }

    // 9. Win-back: 30 dias após expiração
    if (diasLeft <= -29 && !(await jaEnviou(u.email, 'win_back_30d'))) {
      const ok = await enviarEmail('win_back', u.email, { nome, oficina, diasPassados: 30 })
      if (ok) { await registrarLog(u.email, 'win_back_30d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }

  }

  // ── Inadimplentes: cobrança de reativação ─────────────────
  const { data: inadimplentes } = await supabase
    .from('profiles')
    .select('id, email, responsavel, oficina')
    .eq('status', 'inadimplente')
    .not('email', 'is', null)

  for (const u of (inadimplentes || [])) {
    if (!u.email) continue
    const nome    = u.responsavel || u.oficina || 'dono da oficina'
    const oficina = u.oficina || 'sua oficina'

    // 1º aviso: dispara uma vez por inadimplência (deduplicado por email_logs)
    if (!(await jaEnviou(u.email, 'reativacao_inadimplente_1'))) {
      const ok = await enviarEmail('reativacao_inadimplente', u.email, { nome, oficina })
      if (ok) {
        await registrarLog(u.email, 'reativacao_inadimplente_1')
        resultados.enviados++
      } else {
        resultados.erros++
      }
      continue
    }

    // 2º aviso: 7 dias depois, se ainda inadimplente
    const { data: log1 } = await supabase
      .from('email_logs')
      .select('enviado_em')
      .eq('destinatario_email', u.email)
      .eq('template', 'reativacao_inadimplente_1')
      .limit(1)
      .maybeSingle()

    if (log1?.enviado_em) {
      const diasSince1 = Math.floor((agora - new Date(log1.enviado_em)) / (1000 * 60 * 60 * 24))
      if (diasSince1 >= 7 && !(await jaEnviou(u.email, 'reativacao_inadimplente_2'))) {
        const ok = await enviarEmail('reativacao_inadimplente', u.email, { nome, oficina })
        if (ok) {
          await registrarLog(u.email, 'reativacao_inadimplente_2')
          resultados.enviados++
        } else {
          resultados.erros++
        }
      }
    }
  }

  // ── Cancelados: sequência de win-back (7d e 30d pós-cancel) ─
  // O email imediato já é enviado pelo stripe-webhook ao cancelar.
  // Aqui completamos a sequência de reengajamento via cron.
  const { data: cancelados } = await supabase
    .from('profiles')
    .select('id, email, responsavel, oficina, canceled_at')
    .eq('status', 'cancelado')
    .not('email', 'is', null)
    .not('canceled_at', 'is', null)

  for (const u of (cancelados || [])) {
    if (!u.email || !u.canceled_at) continue

    const nome    = u.responsavel || u.oficina || 'dono da oficina'
    const oficina = u.oficina || 'sua oficina'
    const diasSinceCancel = Math.floor((agora - new Date(u.canceled_at)) / (1000 * 60 * 60 * 24))

    // Win-back 7 dias: "sentimos sua falta" com 30% OFF
    if (diasSinceCancel >= 7 && !(await jaEnviou(u.email, 'cancelado_win_back_7d'))) {
      const ok = await enviarEmail('win_back', u.email, { nome, oficina, diasPassados: 7 })
      if (ok) { await registrarLog(u.email, 'cancelado_win_back_7d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }

    // Win-back 30 dias: "última chance — dados serão removidos"
    if (diasSinceCancel >= 30 && !(await jaEnviou(u.email, 'cancelado_win_back_30d'))) {
      const ok = await enviarEmail('win_back', u.email, { nome, oficina, diasPassados: 30 })
      if (ok) { await registrarLog(u.email, 'cancelado_win_back_30d'); resultados.enviados++ }
      else resultados.erros++
      continue
    }
  }

  console.log('[cron] Concluído:', resultados)

  // ── Comissões mensais (só no dia 1 de cada mês) ──────────
  if (agora.getDate() === 1) {
    try {
      await gerarComissoesMensais(agora)
    } catch (e) {
      console.error('[cron] Erro ao gerar comissões mensais:', e.message)
    }
  }

  // ── Snapshot de MRR (uma vez por dia) ────────────────────
  try {
    const hoje = agora.toISOString().split('T')[0] // 'YYYY-MM-DD'

    // Verifica se já existe snapshot de hoje
    const { data: snapExist } = await supabase
      .from('mrr_snapshots')
      .select('id')
      .eq('data', hoje)
      .limit(1)

    if (!snapExist || snapExist.length === 0) {
      // Busca preços do app_config
      const { data: cfgRows } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['price_monthly', 'price_annual_monthly'])

      const cfg = Object.fromEntries((cfgRows || []).map(r => [r.key, parseFloat(r.value)]))
      const pMensal = cfg.price_monthly        || 97
      const pAnualM = cfg.price_annual_monthly || 79.90

      // Busca contagens de usuários por status
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('status, plan')
        .in('status', ['active', 'trial', 'inadimplente'])

      const ativos       = (allUsers || []).filter(u => u.status === 'active')
      const ativos_m     = ativos.filter(u => u.plan !== 'annual').length
      const ativos_a     = ativos.filter(u => u.plan === 'annual').length
      const trial_count  = (allUsers || []).filter(u => u.status === 'trial').length
      const inadimp      = (allUsers || []).filter(u => u.status === 'inadimplente').length
      const mrr          = Math.round((ativos_m * pMensal + ativos_a * pAnualM) * 100) / 100

      await supabase.from('mrr_snapshots').insert({
        data:          hoje,
        mrr,
        ativos:        ativos.length,
        trial:         trial_count,
        inadimplentes: inadimp,
      })

      console.log(`[cron] 📊 MRR snapshot: R$${mrr} | ativos: ${ativos.length} | trial: ${trial_count}`)
    }
  } catch (e) {
    console.error('[cron] Erro ao salvar MRR snapshot:', e.message)
  }

  return res.status(200).json({
    ok: true,
    processados: usuarios.length,
    ...resultados,
  })
}

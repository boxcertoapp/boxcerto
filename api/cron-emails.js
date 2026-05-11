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
      headers: { 'Content-Type': 'application/json' },
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

// ── Handler principal ─────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  // Segurança: Vercel envia Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = (req.headers.authorization || '').replace('Bearer ', '')
    if (auth !== cronSecret) {
      return res.status(401).json({ error: 'Não autorizado' })
    }
  }

  const agora      = new Date()
  const resultados = { enviados: 0, pulados: 0, erros: 0 }

  // ── Busca todos os usuários em trial ──────────────────────
  const { data: usuarios, error } = await supabase
    .from('profiles')
    .select('id, email, responsavel, oficina, trial_end, created_at')
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

    const nome    = u.responsavel || u.oficina || 'dono da oficina'
    const oficina = u.oficina || 'sua oficina'

    const criadoEm  = new Date(u.created_at)
    const trialEnd  = new Date(u.trial_end)
    const diasSince = Math.floor((agora - criadoEm) / (1000 * 60 * 60 * 24))
    const diasLeft  = Math.ceil((trialEnd - agora) / (1000 * 60 * 60 * 24))

    // ── Sequência baseada em "pelo menos N dias + ainda não enviou"
    // Deduplicação garantida pelo email_logs — não depende de janela exata de 24h

    // 1. Parabéns pela 1ª OS (qualquer dia do trial, assim que criar)
    if (diasSince >= 1 && diasLeft > 0 && !(await jaEnviou(u.email, 'primeira_os'))) {
      if (await temOS(u.id)) {
        const ok = await enviarEmail('primeira_os', u.email, { nome, oficina })
        ok ? resultados.enviados++ : resultados.erros++
        continue
      }
    }

    // 2. Nudge de ativação — dia 2+ sem OS
    if (diasSince >= 2 && diasLeft > 0 && !(await jaEnviou(u.email, 'activation_nudge'))) {
      if (!(await temOS(u.id))) {
        const ok = await enviarEmail('activation_nudge', u.email, { nome, oficina })
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

  console.log('[cron] Concluído:', resultados)

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

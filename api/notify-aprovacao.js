// ============================================================
// notify-aprovacao.js — POST /api/notify-aprovacao
//
// Chamado pelo OrcamentoPublico.jsx após o cliente aprovar.
// Busca a push subscription do mecânico e envia Web Push.
// Fire-and-forget pelo cliente — retorno não bloqueia o UI.
// ============================================================
const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  'mailto:contato@boxcerto.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'token required' })

  try {
    // Busca OS pelo token — serviço usa service_role, ignora RLS
    const { data: os, error: osError } = await supabase
      .from('service_orders')
      .select(`
        id,
        user_id,
        aprovacao_status,
        vehicles ( modelo, placa, clients ( nome ) ),
        service_items ( venda )
      `)
      .eq('aprovacao_token', token)
      .single()

    if (osError || !os) {
      console.warn('[notify-aprovacao] OS não encontrada para token', token)
      return res.status(404).json({ error: 'OS not found' })
    }

    // Valida que a OS foi realmente aprovada antes de notificar
    if (os.aprovacao_status !== 'aprovado') {
      return res.status(400).json({ error: 'OS not approved yet' })
    }

    const clientName  = os.vehicles?.clients?.nome || 'Cliente'
    const vehicleInfo = os.vehicles?.modelo || os.vehicles?.placa || 'Veículo'
    const total       = (os.service_items || []).reduce((s, i) => s + Number(i.venda || 0), 0)

    // Busca subscriptions do mecânico (pode ter múltiplos dispositivos)
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', os.user_id)

    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: 'no subscriptions' })
    }

    const payload = JSON.stringify({
      title: `✅ ${clientName} aprovou!`,
      body: `${vehicleInfo} · ${fmt(total)}`,
      osId: os.id,
      url: `/app/oficina?os=${os.id}`,
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        )
      )
    )

    // Remove subscriptions expiradas (browser desinstalado, token revogado)
    const expiredEndpoints = results
      .map((r, i) => (r.status === 'rejected' && r.reason?.statusCode === 410 ? subs[i].endpoint : null))
      .filter(Boolean)

    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    console.log(`[notify-aprovacao] OS ${os.id} → ${sent}/${subs.length} pushes enviados`)
    return res.status(200).json({ sent })
  } catch (err) {
    console.error('[notify-aprovacao]', err)
    return res.status(500).json({ error: err.message })
  }
}

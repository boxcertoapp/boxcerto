/**
 * POST /api/impersonate
 * Gera um magic link para o admin visualizar o app como um usuário.
 * Usa fetch nativo (Node 18+) — sem dependência de @supabase/supabase-js no runtime.
 */

const ADMIN_EMAIL = 'rogerioknfilho@gmail.com'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Env vars ─────────────────────────────────────────────
  const SUPABASE_URL = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  ).trim().replace(/\/$/, '')

  const SERVICE_KEY = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY || ''
  ).trim()

  if (!SUPABASE_URL) {
    return res.status(500).json({
      error: 'VITE_SUPABASE_URL não configurada no Vercel. Acesse Vercel → Settings → Environment Variables e adicione VITE_SUPABASE_URL.'
    })
  }
  if (!SERVICE_KEY) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel. Acesse Vercel → Settings → Environment Variables e adicione a service_role key do Supabase.'
    })
  }

  const { adminToken, userId } = req.body || {}
  if (!adminToken || !userId) {
    return res.status(400).json({ error: 'adminToken e userId são obrigatórios.' })
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
  }

  try {
    // 1. Valida token e pega dados do chamador
    const meResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ...headers, 'Authorization': `Bearer ${adminToken}` },
    })
    if (!meResp.ok) {
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' })
    }
    const caller = await meResp.json()

    // 2. Verifica se é admin (por email OU por flag no banco)
    const isAdminByEmail = caller.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    if (!isAdminByEmail) {
      // Verifica flag is_admin no banco
      const profileResp = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${caller.id}&select=is_admin`,
        { headers }
      )
      const profiles = await profileResp.json()
      if (!profiles?.[0]?.is_admin) {
        return res.status(403).json({ error: 'Acesso negado: você não é administrador.' })
      }
    }

    // 3. Busca email do usuário alvo
    const targetResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { headers })
    if (!targetResp.ok) {
      return res.status(404).json({ error: `Usuário não encontrado (id: ${userId}).` })
    }
    const targetUser = await targetResp.json()
    const targetEmail = targetUser.email
    if (!targetEmail) {
      return res.status(404).json({ error: 'Usuário encontrado mas sem email.' })
    }

    // 4. Gera magic link
    const redirectTo = SUPABASE_URL.includes('localhost')
      ? 'http://localhost:5173/app/oficina'
      : 'https://www.boxcerto.com/app/oficina'

    const linkResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'magiclink',
        email: targetEmail,
        options: { redirect_to: redirectTo },
      }),
    })

    const linkData = await linkResp.json()

    if (!linkResp.ok || !linkData?.action_link) {
      return res.status(500).json({
        error: `Falha ao gerar link: ${linkData?.message || linkData?.error_description || JSON.stringify(linkData)}`
      })
    }

    // 5. Audit log (ignora erros)
    fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        admin_id: caller.id,
        action: 'impersonate',
        target_user_id: userId,
        target_email: targetEmail,
      }),
    }).catch(() => {})

    return res.status(200).json({ link: linkData.action_link, email: targetEmail })

  } catch (err) {
    console.error('[impersonate]', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}

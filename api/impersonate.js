/**
 * POST /api/impersonate
 * Gera um magic link para o admin visualizar o app como um usuário.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Lê variáveis de ambiente ────────────────────────────
  const SUPABASE_URL = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  ).trim()

  const SERVICE_ROLE_KEY = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY || ''
  ).trim()

  const ANON_KEY = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  ).trim()

  // ── Diagnóstico de env vars ─────────────────────────────
  if (!SUPABASE_URL) {
    return res.status(500).json({ error: 'Variável VITE_SUPABASE_URL não encontrada no servidor. Configure em Vercel → Settings → Environment Variables.' })
  }
  if (!SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Variável SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor. Configure em Vercel → Settings → Environment Variables.' })
  }

  const { adminToken, userId } = req.body || {}
  if (!adminToken || !userId) {
    return res.status(400).json({ error: 'adminToken e userId são obrigatórios.' })
  }

  try {
    const { createClient } = require('@supabase/supabase-js')

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Valida o token do chamador
    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(adminToken)
    if (authErr || !caller) {
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' })
    }

    // 2. Verifica se é admin
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .single()

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Acesso negado: você não é administrador.' })
    }

    // 3. Busca o email do usuário alvo
    const { data: targetData, error: targetErr } = await admin.auth.admin.getUserById(userId)
    if (targetErr || !targetData?.user?.email) {
      return res.status(404).json({ error: `Usuário não encontrado. ${targetErr?.message || ''}` })
    }

    // 4. Gera o magic link
    const redirectTo = SUPABASE_URL.includes('localhost')
      ? 'http://localhost:5173/app/oficina'
      : 'https://www.boxcerto.com/app/oficina'

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetData.user.email,
      options: { redirectTo },
    })

    if (linkErr || !linkData?.properties?.action_link) {
      return res.status(500).json({
        error: `Falha ao gerar link: ${linkErr?.message || 'resposta vazia do Supabase'}`
      })
    }

    // 5. Audit log (não falha se tabela não existir)
    try {
      await admin.from('admin_audit_log').insert({
        admin_id: caller.id,
        action: 'impersonate',
        target_user_id: userId,
        target_email: targetData.user.email,
      })
    } catch {}

    return res.status(200).json({
      link: linkData.properties.action_link,
      email: targetData.user.email,
    })

  } catch (err) {
    console.error('[impersonate] erro inesperado:', err)
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}

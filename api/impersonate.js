/**
 * POST /api/impersonate
 * Gera um magic link para o admin visualizar o app como um usuário específico.
 * O link deve ser aberto em aba anônima para não conflitar com a sessão do admin.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const { adminToken, userId } = req.body || {}
  if (!adminToken || !userId) {
    return res.status(400).json({ error: 'adminToken e userId são obrigatórios.' })
  }
  if (!SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SERVICE_ROLE_KEY não configurada no servidor.' })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // 1. Valida o token do admin usando o service role (pode verificar qualquer JWT)
    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(adminToken)
    if (authErr || !caller) {
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' })
    }

    // 2. Confirma que o chamador é admin
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
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    // 4. Gera o magic link para o usuário alvo
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetData.user.email,
      options: {
        redirectTo: (SUPABASE_URL.includes('localhost') ? 'http://localhost:5173' : 'https://www.boxcerto.com') + '/app/oficina',
      },
    })

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[impersonate] generateLink error:', linkErr)
      return res.status(500).json({ error: linkErr?.message || 'Falha ao gerar link de acesso.' })
    }

    // Log da ação (audit trail)
    await admin.from('admin_audit_log').insert({
      admin_id: caller.id,
      action: 'impersonate',
      target_user_id: userId,
      target_email: targetData.user.email,
    }).catch(() => {}) // não falha se tabela não existir ainda

    return res.status(200).json({
      link: linkData.properties.action_link,
      email: targetData.user.email,
    })

  } catch (err) {
    console.error('[impersonate] unexpected error:', err)
    return res.status(500).json({ error: err.message || 'Erro interno do servidor.' })
  }
}

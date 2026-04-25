/**
 * POST /api/impersonate
 * Gera um magic link para o admin fazer login como um usuário específico.
 * Requer: adminToken (JWT do admin), userId (UUID do usuário alvo)
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  const { adminToken, userId } = req.body || {}
  if (!adminToken || !userId) {
    return res.status(400).json({ error: 'adminToken e userId são obrigatórios.' })
  }

  try {
    // 1. Valida se quem chamou é realmente admin
    const userClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser(adminToken)
    if (authErr || !caller) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' })
    }

    // 2. Verifica is_admin no profile do chamador
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .single()

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Acesso negado: não é administrador.' })
    }

    // 3. Gera magic link para o usuário alvo
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: await getUserEmail(admin, userId),
    })

    if (linkErr || !linkData?.properties?.action_link) {
      return res.status(500).json({ error: linkErr?.message || 'Falha ao gerar link.' })
    }

    return res.status(200).json({
      link: linkData.properties.action_link,
    })

  } catch (err) {
    console.error('[impersonate]', err)
    return res.status(500).json({ error: err.message || 'Erro interno.' })
  }
}

async function getUserEmail(adminClient, userId) {
  const { data } = await adminClient.auth.admin.getUserById(userId)
  if (!data?.user?.email) throw new Error('Usuário não encontrado.')
  return data.user.email
}

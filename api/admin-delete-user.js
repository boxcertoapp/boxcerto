import { createClient } from '@supabase/supabase-js'

// Admin client com service role key — bypass completo de RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, adminToken } = req.body

  if (!userId || !adminToken) {
    return res.status(400).json({ error: 'userId e adminToken são obrigatórios' })
  }

  // Verifica se quem está pedindo é realmente admin
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(adminToken)
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return res.status(403).json({ error: 'Acesso negado — não é admin' })
  }

  // Impede auto-exclusão
  if (user.id === userId) {
    return res.status(400).json({ error: 'Não é possível excluir sua própria conta' })
  }

  try {
    // Deleta o usuário do auth.users — Supabase cascateia para profiles e todos os dados
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Erro ao deletar usuário:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

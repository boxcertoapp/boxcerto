import { createClient } from '@supabase/supabase-js'

// Admin client com service role key — bypass completo de RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Tabelas que precisam ser limpas antes de deletar o usuário
// (evita erros de FK constraint caso as tabelas não tenham ON DELETE CASCADE)
const USER_TABLES = [
  'service_items',     // itens de OS (referencia service_orders)
  'service_orders',    // ordens de serviço
  'vehicles',          // veículos
  'clients',           // clientes
  'inventory',         // estoque
  'expenses',          // despesas
  'vendas',            // vendas
  'office_data',       // dados da oficina
  'cadastro_events',   // eventos de analytics
  'profiles',          // perfil (por último, antes do auth.users)
]

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
    // 1. Apaga dados do usuário em todas as tabelas (evita FK constraint errors)
    for (const table of USER_TABLES) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId)
      // Ignora erros individuais (tabela pode não ter user_id ou já estar vazia)
      if (error) {
        console.warn(`Aviso ao limpar ${table}:`, error.message)
      }
    }

    // 2. Deleta o usuário do auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Erro ao deletar usuário:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

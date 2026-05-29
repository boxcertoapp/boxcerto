// ============================================================
// api/affiliate-update-pix.js
// POST { partner_id, access_token, pix_key, pix_type }
//   → atualiza chave PIX do parceiro (requer sessão válida)
// ============================================================
const { createClient } = require('@supabase/supabase-js')

const PIX_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SRV) return res.status(500).json({ error: 'Configuração incompleta.' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRV)
  const { partner_id, access_token, pix_key, pix_type } = req.body || {}

  if (!partner_id || !access_token) return res.status(400).json({ error: 'partner_id e access_token obrigatórios.' })
  if (!pix_key?.trim())             return res.status(400).json({ error: 'Chave PIX obrigatória.' })
  if (!PIX_TYPES.includes(pix_type)) return res.status(400).json({ error: 'Tipo de PIX inválido.' })

  // Verifica sessão
  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('access_token, access_token_exp, status')
    .eq('id', partner_id)
    .maybeSingle()

  if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado.' })
  if (partner.access_token !== access_token) return res.status(401).json({ error: 'Sessão inválida.' })
  if (new Date(partner.access_token_exp) < new Date()) return res.status(401).json({ error: 'Sessão expirada.' })

  // Atualiza PIX
  const { error } = await supabase
    .from('affiliate_partners')
    .update({ pix_key: pix_key.trim(), pix_type, updated_at: new Date().toISOString() })
    .eq('id', partner_id)

  if (error) return res.status(500).json({ error: error.message })

  console.log('[UpdatePix] PIX atualizado para parceiro:', partner_id)
  return res.status(200).json({ ok: true })
}

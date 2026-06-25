// ============================================================
// support-phone.js — retorna o telefone de suporte atual (público)
// GET /api/support-phone  →  { phone: '55...' }
// Usado pelas páginas estáticas (HTML de SEO) para reescrever os
// links do WhatsApp sem precisar rebuildar.
// ============================================================
const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=300') // 5 min de cache na borda

  let phone = '5553997065725' // fallback
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (url && key) {
      const supabase = createClient(url, key)
      const { data } = await supabase.from('app_config').select('value').eq('key', 'support_phone').maybeSingle()
      if (data?.value) {
        const d = String(data.value).replace(/\D/g, '')
        if (d.length >= 10) phone = d.startsWith('55') ? d : '55' + d
      }
    }
  } catch {}

  res.status(200).json({ phone })
}

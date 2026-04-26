/**
 * GET /api/debug-impersonate
 * Diagnóstico das configurações necessárias para o impersonate funcionar.
 * REMOVER após resolver o problema.
 */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const SUPABASE_URL = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  ).trim().replace(/\/$/, '')

  const SERVICE_KEY = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY || ''
  ).trim()

  const diag = {
    node_version: process.version,
    supabase_url: SUPABASE_URL ? `✅ ${SUPABASE_URL}` : '❌ NÃO CONFIGURADA',
    service_key: SERVICE_KEY
      ? `✅ configurada (${SERVICE_KEY.length} chars, começa com: ${SERVICE_KEY.substring(0, 20)}...)`
      : '❌ NÃO CONFIGURADA — adicione SUPABASE_SERVICE_ROLE_KEY no Vercel',
    all_env_keys: Object.keys(process.env).filter(k =>
      k.includes('SUPABASE') || k.includes('SERVICE') || k.includes('VITE')
    ),
  }

  // Se tiver tudo, testa conexão com Supabase
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
      })
      diag.supabase_connection = resp.ok
        ? `✅ Supabase respondeu OK (${resp.status})`
        : `⚠️ Supabase retornou ${resp.status}`
    } catch (e) {
      diag.supabase_connection = `❌ Erro de rede: ${e.message}`
    }
  }

  return res.status(200).json(diag)
}

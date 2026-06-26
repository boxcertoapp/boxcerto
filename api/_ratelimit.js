// ============================================================
// _ratelimit.js — rate limiting fail-open via Supabase (Postgres)
//
// O prefixo "_" faz a Vercel NÃO transformar em rota pública.
// Sem dependência externa: usa o Supabase que já temos. Chama a função
// public.rate_limit_hit (SECURITY DEFINER) com a service_role key.
//
// FAIL-OPEN: se a função ainda não existir, der erro ou faltar env var,
// NÃO bloqueia ninguém. Seguro deployar antes de rodar o SQL —
// ativa sozinho quando supabase/rate_limits.sql for aplicado.
//
// Usar só em endpoints de BAIXO volume (login, cadastro, checkout).
// Alto volume (tracking) fica com o Vercel Firewall (camada de borda).
// ============================================================
const { createClient } = require('@supabase/supabase-js')

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let _client = null
function db() {
  if (!URL || !KEY) return null
  if (!_client) _client = createClient(URL, KEY)
  return _client
}

// IP real do cliente atrás da Vercel
function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown'
}

// Verifica uma regra. Retorna { ok: true } ou { ok: false, retryAfter }.
// Qualquer erro/ausência de config → { ok: true } (fail-open).
async function rateLimit(id, { max, windowSec }) {
  const supabase = db()
  if (!supabase) return { ok: true }
  try {
    const { data, error } = await supabase.rpc('rate_limit_hit', {
      p_key: id, p_max: max, p_window_sec: windowSec,
    })
    if (error) return { ok: true }          // função ainda não criada → fail-open
    if (data === false) return { ok: false, retryAfter: windowSec }
    return { ok: true }
  } catch {
    return { ok: true }
  }
}

// Responde 429 padrão com Retry-After.
function tooMany(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter || 60))
  return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.' })
}

// Aplica uma lista de regras. Se alguma estourar, responde 429 e retorna
// true (o handler deve dar `return` em seguida). Senão retorna false.
//   rules: [{ id, max, windowSec }, ...]
async function guard(req, res, rules) {
  for (const r of rules) {
    const out = await rateLimit(r.id, { max: r.max, windowSec: r.windowSec })
    if (!out.ok) { tooMany(res, out.retryAfter); return true }
  }
  return false
}

module.exports = { clientIp, rateLimit, tooMany, guard }

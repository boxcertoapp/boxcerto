// ============================================================
// _ratelimit.js — rate limiting fail-open via Upstash Redis (REST)
//
// O prefixo "_" faz a Vercel NÃO transformar em rota pública.
// FAIL-OPEN: se UPSTASH_REDIS_REST_URL/TOKEN não existirem (ou o Redis
// falhar), NÃO bloqueia ninguém. Seguro pra deployar antes das chaves —
// só passa a limitar quando as env vars entrarem na Vercel.
//
// Estratégia: janela fixa (INCR + EXPIRE) — simples e robusta para
// prevenção de abuso/brute force.
// ============================================================
const URL   = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// IP real do cliente atrás da Vercel
function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown'
}

// Verifica uma regra. Retorna { ok: true } ou { ok: false, retryAfter }.
// Qualquer erro/ausência de config → { ok: true } (fail-open).
async function rateLimit(id, { max, windowSec }) {
  if (!URL || !TOKEN) return { ok: true }
  try {
    const now    = Math.floor(Date.now() / 1000)
    const bucket = Math.floor(now / windowSec)
    const key    = `rl:${id}:${bucket}`
    const res = await fetch(`${URL}/pipeline`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify([['INCR', key], ['EXPIRE', key, String(windowSec)]]),
    })
    if (!res.ok) return { ok: true }
    const data  = await res.json()
    const count = Number((data && data[0] && data[0].result) || 0)
    if (count > max) return { ok: false, retryAfter: windowSec - (now % windowSec) }
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

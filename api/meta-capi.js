// ============================================================
// meta-capi.js — Meta Conversions API (CAPI) server-side
// POST /api/meta-capi
// Body: { eventName, userData: { email, whatsapp, firstName }, customData }
//
// Gera o event_id, hasheia os dados do usuário (SHA-256),
// envia para a Meta e retorna o event_id ao frontend para
// ser incluído no dataLayer.push (deduplicação correta).
//
// Variáveis de ambiente necessárias (NUNCA no código):
//   META_PIXEL_ID   — ID do Pixel da Meta
//   META_CAPI_TOKEN — Token de acesso da Conversions API
// ============================================================
const crypto = require('crypto')

const PIXEL_ID     = process.env.META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN

// ── Normalização + hash SHA-256 ──────────────────────────────
function hashStr(val) {
  if (!val) return undefined
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex')
}

function hashPhone(phone) {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  // Meta exige DDI: +55 para Brasil
  const full = digits.startsWith('55') ? digits : `55${digits}`
  return crypto.createHash('sha256').update(full).digest('hex')
}

// ── Handler principal ─────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS restrito à origem do site (o Pixel não deve aceitar eventos de qualquer site)
  const allowedOrigins = new Set(['https://boxcerto.com', 'https://www.boxcerto.com'])
  const reqOrigin = req.headers.origin || ''
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.has(reqOrigin) ? reqOrigin : 'https://boxcerto.com')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // Gera o event_id antes de qualquer coisa para poder retorná-lo
  // mesmo que o envio à Meta falhe (o dataLayer.push ainda vai funcionar)
  const eventId = crypto.randomUUID()

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('[CAPI] META_PIXEL_ID ou META_CAPI_TOKEN não configurados')
    return res.status(200).json({ success: false, eventId, error: 'not_configured' })
  }

  const { eventName, userData = {}, customData = {} } = req.body || {}

  if (!eventName) {
    return res.status(400).json({ error: 'eventName é obrigatório' })
  }

  const payload = {
    data: [{
      event_name:    eventName,
      event_time:    Math.floor(Date.now() / 1000),
      event_id:      eventId,
      action_source: 'website',
      user_data: {
        ...(userData.email     ? { em: hashStr(userData.email)       } : {}),
        ...(userData.whatsapp  ? { ph: hashPhone(userData.whatsapp)  } : {}),
        ...(userData.firstName ? { fn: hashStr(userData.firstName)   } : {}),
      },
      ...(Object.keys(customData).length ? { custom_data: customData } : {}),
    }],
    access_token: ACCESS_TOKEN,
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }
    )
    const json = await response.json()

    if (!response.ok) {
      console.error('[CAPI] Erro da Meta:', JSON.stringify(json))
      return res.status(200).json({ success: false, eventId, error: json.error?.message })
    }

    console.log('[CAPI]', eventName, '| eventId:', eventId, '| events_received:', json.events_received)
    return res.status(200).json({ success: true, eventId })

  } catch (err) {
    console.error('[CAPI] Erro de rede:', err.message)
    return res.status(200).json({ success: false, eventId, error: err.message })
  }
}

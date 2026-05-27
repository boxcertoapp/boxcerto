// ============================================================
// metaCapi.js — helper client-side para chamar /api/meta-capi
//
// Uso:
//   import { sendCapi } from '../lib/metaCapi'
//   const eventId = await sendCapi('StartTrial', { email, whatsapp, firstName })
//   window.dataLayer.push({ event: 'iniciou_teste_gratis', event_id: eventId, ... })
//
// Nunca lança exceção: se o servidor falhar, retorna um ID local
// para que o dataLayer.push continue funcionando normalmente.
// ============================================================

function localId() {
  try { return crypto.randomUUID() } catch {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * Envia um evento para a Meta Conversions API via /api/meta-capi.
 *
 * @param {string} eventName   — nome do evento Meta (ex: 'StartTrial')
 * @param {object} userData    — { email, whatsapp, firstName }
 * @param {object} customData  — dados extras opcionais
 * @returns {Promise<string>}  — event_id gerado no servidor (usar no dataLayer.push)
 */
export async function sendCapi(eventName, userData = {}, customData = {}) {
  try {
    const res = await fetch('/api/meta-capi', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ eventName, userData, customData }),
    })
    if (!res.ok) return localId()
    const data = await res.json()
    return data.eventId || localId()
  } catch {
    return localId()
  }
}

// ============================================================
// support.js — telefone de suporte (fonte: app_config.support_phone)
// ============================================================
import { CONFIG_DEFAULTS } from '../hooks/useConfig'

// Fallback usado enquanto a config não carregou (ou se faltar).
export const SUPPORT_PHONE_DEFAULT = CONFIG_DEFAULTS.support_phone

// Normaliza para o formato do wa.me (55 + DDD + número).
export function normalizeSupportPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').replace(/^0+/, '')
  if (!d) return SUPPORT_PHONE_DEFAULT
  if (d.length >= 12 && d.startsWith('55')) return d   // já tem o 55
  if (d.length >= 10) return '55' + d                   // DDD + número
  return d
}

// Monta o link do WhatsApp de suporte, com mensagem opcional já codificada.
export function supportWaHref(phone, text) {
  const num = normalizeSupportPhone(phone || SUPPORT_PHONE_DEFAULT)
  return text
    ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}`
}

// Formata para exibição amigável: "(DD) XXXXX-XXXX".
export function formatSupportPhone(phone) {
  let d = (phone || SUPPORT_PHONE_DEFAULT).replace(/\D/g, '')
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2) // remove código do país
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone || ''
}

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

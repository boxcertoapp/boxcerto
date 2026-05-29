// ============================================================
// affiliateTracking.js
//
// Rastreia referência de parceiro via ?ref= na URL e cupom manual.
// Prioridade de atribuição: cupom > ref > UTM
// Cookie/localStorage: 90 dias
// ============================================================

const REF_KEY        = 'boxcerto_aff_ref'
const REF_EXPIRY_KEY = 'boxcerto_aff_ref_exp'
const COUPON_KEY     = 'boxcerto_aff_coupon'
const DAYS_90        = 90 * 24 * 60 * 60 * 1000

/**
 * Lê ?ref= da URL e salva no localStorage por 90 dias.
 * Chamar no mount de todas as LPs e páginas públicas.
 * É idempotente: safe para chamar várias vezes.
 */
export function captureAffiliateRef() {
  try {
    const sp  = new URLSearchParams(window.location.search)
    const ref = sp.get('ref')
    if (!ref) return
    localStorage.setItem(REF_KEY,        ref)
    localStorage.setItem(REF_EXPIRY_KEY, String(Date.now() + DAYS_90))
  } catch {}
}

/**
 * Retorna o slug do parceiro salvo (dentro dos 90 dias).
 * @returns {string|null}
 */
export function getAffiliateRef() {
  try {
    const expiry = localStorage.getItem(REF_EXPIRY_KEY)
    if (expiry && Date.now() > Number(expiry)) {
      localStorage.removeItem(REF_KEY)
      localStorage.removeItem(REF_EXPIRY_KEY)
      return null
    }
    return localStorage.getItem(REF_KEY) || null
  } catch { return null }
}

/**
 * Salva o cupom digitado pelo usuário no localStorage.
 * Cupom tem prioridade sobre ref na atribuição de comissão.
 */
export function saveAffiliateCoupon(code) {
  try {
    if (code) localStorage.setItem(COUPON_KEY, code.trim().toUpperCase())
    else       localStorage.removeItem(COUPON_KEY)
  } catch {}
}

/**
 * Retorna o cupom salvo (digitado pelo usuário).
 * @returns {string|null}
 */
export function getAffiliateCoupon() {
  try { return localStorage.getItem(COUPON_KEY) || null } catch { return null }
}

/**
 * Limpa todos os dados de afiliado (usar após atribuição confirmada).
 */
export function clearAffiliateData() {
  try {
    localStorage.removeItem(REF_KEY)
    localStorage.removeItem(REF_EXPIRY_KEY)
    localStorage.removeItem(COUPON_KEY)
  } catch {}
}

/**
 * Retorna o objeto com ref e coupon para enviar ao backend.
 * Prioridade: coupon > ref
 */
export function getAffiliateAttribution() {
  const coupon = getAffiliateCoupon()
  const ref    = getAffiliateRef()
  return { affiliate_ref: ref, affiliate_coupon: coupon }
}

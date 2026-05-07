import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** Detecta tipo de dispositivo e browser pelo user agent */
function detectDevice() {
  const ua = navigator.userAgent
  const w  = window.innerWidth

  // Device
  const isTablet  = /iPad|Android/i.test(ua) && w >= 768
  const isMobile  = /iPhone|iPod|Android/i.test(ua) && w < 768 || w < 768
  const device    = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

  // Browser simplificado
  const browser = /Edg/i.test(ua)     ? 'Edge'
    : /OPR|Opera/i.test(ua)           ? 'Opera'
    : /Chrome/i.test(ua)              ? 'Chrome'
    : /Safari/i.test(ua)              ? 'Safari'
    : /Firefox/i.test(ua)             ? 'Firefox'
    : 'Outro'

  return { device, browser }
}

/**
 * Registra uma visita de página no Supabase.
 * Captura: device, browser, referrer, session_id anônimo.
 * Deduplicação: uma visita por sessão por página.
 */
export function usePageView(page) {
  useEffect(() => {
    // Session ID anônimo (persiste enquanto aba estiver aberta)
    let sid = sessionStorage.getItem('bc_sid')
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      sessionStorage.setItem('bc_sid', sid)
    }

    // Deduplicação por sessão
    const key = `bc_pv_${page}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    // Referrer
    let referrer = 'direto'
    try {
      if (document.referrer) {
        const hostname = new URL(document.referrer).hostname
        if (!hostname.includes('boxcerto.com')) referrer = hostname || 'direto'
      }
    } catch { /* ignora */ }

    const { device, browser } = detectDevice()

    supabase.from('page_views').insert({
      page, session_id: sid, referrer, device, browser,
    }).then(() => {})
  }, [page])
}

/**
 * usePageView — registra visita de página no Supabase.
 *
 * Supabase carregado via dynamic import APÓS o primeiro paint (requestIdleCallback).
 * Isso garante que o vendor-supabase não bloqueie o LCP em landing pages.
 */
import { useEffect } from 'react'

/** Detecta tipo de dispositivo e browser pelo user agent */
function detectDevice() {
  const ua = navigator.userAgent
  const w  = window.innerWidth
  const isTablet = /iPad|Android/i.test(ua) && w >= 768
  const isMobile = (/iPhone|iPod|Android/i.test(ua) && w < 768) || w < 768
  const device  = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
  const browser = /Edg/i.test(ua)     ? 'Edge'
    : /OPR|Opera/i.test(ua)           ? 'Opera'
    : /Chrome/i.test(ua)              ? 'Chrome'
    : /Safari/i.test(ua)              ? 'Safari'
    : /Firefox/i.test(ua)             ? 'Firefox'
    : 'Outro'
  return { device, browser }
}

export function usePageView(page) {
  useEffect(() => {
    const register = () => {
      // Session ID anônimo
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

      // Carrega Supabase de forma lazy — não impacta o render
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('page_views').insert({
          page, session_id: sid, referrer, device, browser,
        }).then(() => {})
      })
    }

    // Aguarda o browser estar idle antes de executar
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(register, { timeout: 4000 })
      return () => cancelIdleCallback(id)
    } else {
      const id = setTimeout(register, 2000)
      return () => clearTimeout(id)
    }
  }, [page])
}

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Registra uma visita de página no Supabase.
 * Usa um session_id anônimo via sessionStorage (não rastreia usuário).
 * Deduplicação: uma visita por sessão por página.
 *
 * @param {string} page - ex: '/landing', '/cadastro', '/assinar'
 */
export function usePageView(page) {
  useEffect(() => {
    // Gera ou recupera session ID anônimo
    let sid = sessionStorage.getItem('bc_sid')
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      sessionStorage.setItem('bc_sid', sid)
    }

    // Deduplicação: não registra a mesma página na mesma sessão
    const key = `bc_pv_${page}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    // Determina referrer (domínio de origem ou 'direto')
    let referrer = 'direto'
    try {
      if (document.referrer) {
        const hostname = new URL(document.referrer).hostname
        // Ignora self-referrer
        if (!hostname.includes('boxcerto.com')) {
          referrer = hostname || 'direto'
        }
      }
    } catch { /* ignora erros de URL */ }

    // Registra assincronamente (silencioso — não bloqueia a UI)
    supabase.from('page_views').insert({ page, session_id: sid, referrer }).then(() => {})
  }, [page])
}

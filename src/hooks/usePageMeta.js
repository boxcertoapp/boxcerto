import { useEffect } from 'react'

/**
 * Hook que atualiza title, meta description e canonical dinamicamente.
 * Restaura os valores originais do index.html ao desmontar.
 */
export function usePageMeta({ title, description, canonical }) {
  useEffect(() => {
    const prevTitle       = document.title
    const descEl          = document.querySelector('meta[name="description"]')
    const canonicalEl     = document.querySelector('link[rel="canonical"]')
    const ogTitleEl       = document.querySelector('meta[property="og:title"]')
    const ogDescEl        = document.querySelector('meta[property="og:description"]')
    const ogUrlEl         = document.querySelector('meta[property="og:url"]')
    const twitterTitleEl  = document.querySelector('meta[name="twitter:title"]')
    const twitterDescEl   = document.querySelector('meta[name="twitter:description"]')

    const prevDesc      = descEl?.content
    const prevCanonical = canonicalEl?.href
    const prevOgTitle   = ogTitleEl?.content
    const prevOgDesc    = ogDescEl?.content
    const prevOgUrl     = ogUrlEl?.content
    const prevTwTitle   = twitterTitleEl?.content
    const prevTwDesc    = twitterDescEl?.content

    // Aplica
    document.title = title
    if (descEl && description)        descEl.setAttribute('content', description)
    if (canonicalEl && canonical)     canonicalEl.setAttribute('href', canonical)
    if (ogTitleEl && title)           ogTitleEl.setAttribute('content', title)
    if (ogDescEl && description)      ogDescEl.setAttribute('content', description)
    if (ogUrlEl && canonical)         ogUrlEl.setAttribute('content', canonical)
    if (twitterTitleEl && title)      twitterTitleEl.setAttribute('content', title)
    if (twitterDescEl && description) twitterDescEl.setAttribute('content', description)

    // Restaura ao sair da rota
    return () => {
      document.title = prevTitle
      if (descEl && prevDesc)           descEl.setAttribute('content', prevDesc)
      if (canonicalEl && prevCanonical) canonicalEl.setAttribute('href', prevCanonical)
      if (ogTitleEl && prevOgTitle)     ogTitleEl.setAttribute('content', prevOgTitle)
      if (ogDescEl && prevOgDesc)       ogDescEl.setAttribute('content', prevOgDesc)
      if (ogUrlEl && prevOgUrl)         ogUrlEl.setAttribute('content', prevOgUrl)
      if (twitterTitleEl && prevTwTitle) twitterTitleEl.setAttribute('content', prevTwTitle)
      if (twitterDescEl && prevTwDesc)  twitterDescEl.setAttribute('content', prevTwDesc)
    }
  }, [title, description, canonical])
}

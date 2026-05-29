// Fase 2: página personalizada por parceiro (/parceiro/:slug)
// Por enquanto redireciona para a LP principal com o ref já preenchido
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { captureAffiliateRef } from '../lib/affiliateTracking'

export default function ParceiroPerfil() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  useEffect(() => {
    // Salva o ref do slug e redireciona para a LP principal
    if (slug) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('ref', slug)
        window.history.replaceState({}, '', url.toString())
        captureAffiliateRef()
      } catch {}
    }
    navigate('/lp', { replace: true })
  }, [slug])

  return null
}

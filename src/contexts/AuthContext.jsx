/**
 * AuthContext.jsx
 *
 * Supabase carregado via dynamic import para NÃO bloquear o render
 * de landing pages públicas (/lp, /lp2, etc.).
 * Em páginas autenticadas o carregamento já acontece antes do useEffect
 * de auth terminar, então não há regressão de UX.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { sendCapi } from '../lib/metaCapi'

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

// ── Getter lazy do cliente Supabase ─────────────────────────────────────────
// Garante uma única instância; não aparece no módulo graph estático,
// portanto vendor-supabase NÃO é preloaded em páginas sem auth.
let _sb = null
async function getSupa() {
  if (!_sb) {
    const { supabase } = await import('../lib/supabase')
    _sb = supabase
  }
  return _sb
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

const buildUser = (authUser, profile) => {
  if (!authUser) return null
  const defaultTrialEnd = authUser.created_at
    ? new Date(new Date(authUser.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const tipo = profile?.tipo || 'master'
  return {
    id:            authUser.id,
    email:         authUser.email,
    oficina:       profile?.oficina       || '',
    responsavel:   profile?.responsavel   || '',
    whatsapp:      profile?.whatsapp      || '',
    status:        profile?.status        || 'trial',
    plan:          profile?.plan          || null,
    trialEnd:      profile?.trial_end     || defaultTrialEnd,
    isAdmin:       authUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || profile?.is_admin === true,
    tipo,
    isTecnico:     tipo === 'tecnico',
    masterId:      profile?.master_id     || null,
    nome:          profile?.nome          || profile?.responsavel || '',
    setupDone:     profile?.setup_done !== false,
    signupMethod:  profile?.signup_method || 'email',
    onboardingOficinaD:       profile?.onboarding_oficina_done    || false,
    onboardingOsDone:         profile?.onboarding_os_done         || false,
    onboardingOrcamentoDone:  profile?.onboarding_orcamento_done  || false,
    onboardingDismissed:      profile?.onboarding_dismissed       || false,
    tipoOficina:   profile?.tipo_oficina  || null,
    cargo:         profile?.cargo         || null,
    activated:     profile?.activated     || false,
    firstActionAt: profile?.first_action_at || null,
    utmSource:     profile?.utm_source    || null,
    utmCampaign:   profile?.utm_campaign  || null,
  }
}

export const isTrialValid = (user) => {
  if (!user?.trialEnd) return false
  return new Date(user.trialEnd) > new Date()
}

export const hasAccess = (user) => {
  if (!user) return false
  if (user.isAdmin)  return true
  if (user.isTecnico) return true
  if (user.status === 'active') return true
  if (user.status === 'trial' && isTrialValid(user)) return true
  return false
}

export const trialDaysLeft = (user) => {
  if (!user?.trialEnd) return 0
  const diff = new Date(user.trialEnd) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (authUser) => {
    if (!authUser) { setUser(null); setLoading(false); return }
    setLoading(true)
    const supabase = await getSupa()
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
    setUser(buildUser(authUser, profile))
    setLoading(false)
  }

  useEffect(() => {
    if (import.meta.env.DEV && window.__BOXCERTO_E2E_USER__) {
      setUser(window.__BOXCERTO_E2E_USER__)
      setLoading(false)
      return
    }

    let active       = true
    let initialized  = false
    let nullTimer    = null
    let unsubscribe  = null

    // Carrega Supabase dinamicamente — não bloqueia o render inicial
    getSupa().then(supabase => {
      if (!active) return

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!active) return
        if (session?.user) {
          loadProfile(session.user)
        } else {
          nullTimer = setTimeout(() => { if (active) loadProfile(null) }, 300)
        }
        initialized = true
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (nullTimer) { clearTimeout(nullTimer); nullTimer = null }
        if (!initialized || !active) return
        loadProfile(session?.user ?? null)
        if (session?.user) {
          ;(async () => {
            try { await supabase.rpc('touch_last_seen') } catch {}
            try {
              const ua = navigator.userAgent
              const w  = window.innerWidth
              const isTablet = /iPad|Android/i.test(ua) && w >= 768
              const isMobile = /iPhone|iPod|Android/i.test(ua) && w < 768 || w < 768
              const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
              await supabase.from('profiles').update({ last_device: device }).eq('id', session.user.id)
            } catch {}

            if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
              try {
                const createdAt = new Date(session.user.created_at).getTime()
                const ageSec    = (Date.now() - createdAt) / 1000
                const isNewSignup = ageSec < 120

                const sp   = new URLSearchParams(window.location.search)
                const base = {
                  method:       'google',
                  origem:       sp.get('origem')       || 'direto',
                  utm_source:   sp.get('utm_source')   || '',
                  utm_campaign: sp.get('utm_campaign') || '',
                  device:       window.innerWidth < 768 ? 'mobile' : 'desktop',
                }

                if (isNewSignup) {
                  await supabase.from('profiles')
                    .update({ signup_method: 'google' })
                    .eq('id', session.user.id).catch(() => {})

                  if (typeof gtag === 'function') {
                    gtag('event', 'sign_up',    { method: 'google' })
                    gtag('event', 'conversion', { send_to: 'G-HQNZQ5PHFB' })
                  }

                  // ── CAPI server-side para cadastro via Google OAuth
                  const fullName = session.user.user_metadata?.full_name || ''
                  const capiEventId = await sendCapi('StartTrial', {
                    email:     session.user.email,
                    firstName: fullName.split(' ')[0],
                    // WhatsApp ainda não disponível no cadastro Google — coletado em /bem-vindo
                  })

                  window.dataLayer = window.dataLayer || []
                  window.dataLayer.push({ event: 'iniciou_teste_gratis', event_id: capiEventId, ...base })

                  await supabase.from('cadastro_events').insert({
                    event_name:   'cadastro_signup_success',
                    origem:       base.origem       || null,
                    utm_source:   base.utm_source   || null,
                    utm_campaign: base.utm_campaign || null,
                    device:       base.device,
                    error_type:   null,
                    error_field:  null,
                    fields_count: null,
                  }).catch(() => {})
                } else {
                  if (typeof gtag === 'function') gtag('event', 'login', { method: 'google' })
                  window.dataLayer = window.dataLayer || []
                  window.dataLayer.push({ event: 'login_google', ...base })
                }
              } catch {}
            }
          })()
        }
      })

      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      active = false
      unsubscribe?.()
      if (nullTimer) clearTimeout(nullTimer)
    }
  }, [])

  // ── Funções de auth ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const supabase = await getSupa()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: 'E-mail ou senha incorretos.' }
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).maybeSingle()
    return { ok: true, user: buildUser(data.user, profile) }
  }

  const register = async ({ oficina, responsavel, whatsapp, email, password, affiliateRef, affiliateCoupon }) => {
    const supabase = await getSupa()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: {
        oficina, responsavel, whatsapp,
        affiliate_ref:    affiliateRef    || null,
        affiliate_coupon: affiliateCoupon || null,
      }},
    })
    if (error) {
      if (error.message.includes('already registered'))
        return { ok: false, error: 'Este e-mail já está cadastrado.' }
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  const logout = async () => {
    const supabase = await getSupa()
    await supabase.auth.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    const supabase = await getSupa()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) await loadProfile(authUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

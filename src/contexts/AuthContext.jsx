import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

const AuthContext = createContext(null)

const buildUser = (authUser, profile) => {
  if (!authUser) return null
  // Fallback: calcula 7 dias a partir da criação da conta se o perfil ainda não existe
  const defaultTrialEnd = authUser.created_at
    ? new Date(new Date(authUser.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const tipo = profile?.tipo || 'master'
  return {
    id: authUser.id,
    email: authUser.email,
    oficina: profile?.oficina || '',
    responsavel: profile?.responsavel || '',
    whatsapp: profile?.whatsapp || '',
    status: profile?.status || 'trial',
    plan: profile?.plan || null,
    trialEnd: profile?.trial_end || defaultTrialEnd,
    isAdmin: authUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || profile?.is_admin === true,
    // Modo Técnico
    tipo,
    isTecnico: tipo === 'tecnico',
    masterId: profile?.master_id || null,
    nome: profile?.nome || profile?.responsavel || '',
    setupDone: profile?.setup_done !== false, // true por padrão para masters
    // Método de cadastro
    signupMethod: profile?.signup_method || 'email',
    // Modal de boas-vindas
    welcomeSeen: profile?.welcome_seen || false,
    // Onboarding checklist
    onboardingOficinaD:    profile?.onboarding_oficina_done   || false,
    onboardingOsDone:      profile?.onboarding_os_done        || false,
    onboardingOrcamentoDone: profile?.onboarding_orcamento_done || false,
    onboardingDismissed:   profile?.onboarding_dismissed      || false,
  }
}

export const isTrialValid = (user) => {
  if (!user?.trialEnd) return false
  return new Date(user.trialEnd) > new Date()
}

export const hasAccess = (user) => {
  if (!user) return false
  if (user.isAdmin) return true
  if (user.isTecnico) return true // técnicos têm status 'active' mas checamos separado
  if (user.status === 'active') return true
  if (user.status === 'trial' && isTrialValid(user)) return true
  return false
}

export const trialDaysLeft = (user) => {
  if (!user?.trialEnd) return 0
  const diff = new Date(user.trialEnd) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }
    // Garante loading=true enquanto busca o perfil.
    // Sem isso, AppLayout vê loading=false + user=null e redireciona
    // para /login antes do perfil chegar — causando tela em branco.
    setLoading(true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    setUser(buildUser(authUser, profile))
    setLoading(false)
  }

  useEffect(() => {
    // Flag que garante que onAuthStateChange não sobrescreve a sessão
    // antes do getSession() terminar — evita logout falso no reload do iPhone/PWA
    let initialized = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null)
      initialized = true
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized) return // aguarda getSession() completar primeiro
      loadProfile(session?.user ?? null)
      if (session?.user) {
        ;(async () => {
          try { await supabase.rpc('touch_last_seen') } catch {}
          // Registra device do usuário logado
          try {
            const ua = navigator.userAgent
            const w  = window.innerWidth
            const isTablet = /iPad|Android/i.test(ua) && w >= 768
            const isMobile = /iPhone|iPod|Android/i.test(ua) && w < 768 || w < 768
            const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
            await supabase.from('profiles').update({ last_device: device }).eq('id', session.user.id)
          } catch {}

          // ── Rastreamento Google OAuth ──────────────────────────────────
          // Só dispara quando o evento é SIGNED_IN via provider Google
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
            try {
              const createdAt = new Date(session.user.created_at).getTime()
              const ageSec = (Date.now() - createdAt) / 1000
              const isNewSignup = ageSec < 120 // criado há menos de 2 minutos = novo cadastro

              const sp = new URLSearchParams(window.location.search)
              const base = {
                method:       'google',
                origem:       sp.get('origem')       || 'direto',
                utm_source:   sp.get('utm_source')   || '',
                utm_campaign: sp.get('utm_campaign') || '',
                device:       window.innerWidth < 768 ? 'mobile' : 'desktop',
              }

              if (isNewSignup) {
                // Novo cadastro via Google — grava método no perfil
                await supabase.from('profiles')
                  .update({ signup_method: 'google' })
                  .eq('id', session.user.id)
                  .catch(() => {})

                if (typeof gtag === 'function') {
                  gtag('event', 'sign_up',    { method: 'google' })
                  gtag('event', 'conversion', { send_to: 'G-HQNZQ5PHFB' })
                }
                window.dataLayer = window.dataLayer || []
                window.dataLayer.push({ event: 'iniciou_teste_gratis', ...base })

                // Grava no Supabase para o painel de análise de cadastro
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
                // Login de usuário já existente via Google
                if (typeof gtag === 'function') {
                  gtag('event', 'login', { method: 'google' })
                }
                window.dataLayer = window.dataLayer || []
                window.dataLayer.push({ event: 'login_google', ...base })
              }
            } catch {}
          }
          // ──────────────────────────────────────────────────────────────
        })()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: 'E-mail ou senha incorretos.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    const builtUser = buildUser(data.user, profile)
    return { ok: true, user: builtUser }
  }

  const register = async ({ oficina, responsavel, whatsapp, email, password }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { oficina, responsavel, whatsapp } },
    })
    if (error) {
      if (error.message.includes('already registered'))
        return { ok: false, error: 'Este e-mail já está cadastrado.' }
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
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

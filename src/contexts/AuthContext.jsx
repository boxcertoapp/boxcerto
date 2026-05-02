import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const ADMIN_EMAIL = 'rogerioknfilho@gmail.com'

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    setUser(buildUser(authUser, profile))
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null)
      // Atualiza last_seen_at no login (RPC é "thenable", não Promise nativo — usar async IIFE)
      if (session?.user) {
        ;(async () => { try { await supabase.rpc('touch_last_seen') } catch {} })()
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

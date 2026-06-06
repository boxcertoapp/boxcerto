import { useRef, useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Wrench, Clock, TrendingUp, Menu, Package, Zap, Bell, X } from 'lucide-react'
import { useAuth, hasAccess, trialDaysLeft } from '../../contexts/AuthContext'
import AnnouncementBanner from '../../components/AnnouncementBanner'
import Logo from '../../components/Logo'
import OnboardingWizard from '../../components/OnboardingWizard'
import SaveCheck from '../../components/SaveCheck'
import { usePushNotifications } from '../../hooks/usePushNotifications'

const tabs = [
  { to: '/app/oficina',    icon: Wrench,     label: 'Oficina' },
  { to: '/app/historico',  icon: Clock,      label: 'Histórico' },
  { to: '/app/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/app/estoque',    icon: Package,    label: 'Estoque' },
  { to: '/app/menu',       icon: Menu,       label: 'Menu' },
]

export default function AppLayout() {
  const { user, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Refs dos containers de scroll — mobile e desktop
  const mainMobileRef  = useRef(null)
  const mainDesktopRef = useRef(null)

  // Volta ao topo sempre que a rota mudar
  useEffect(() => {
    mainMobileRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    mainDesktopRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  // Sino de notificações push
  const { isSupported: pushSupported, permission: pushPermission, isSubscribed, isLoading: pushLoading, subscribe: subscribePush } = usePushNotifications()
  const [showNotifyPopup, setShowNotifyPopup] = useState(false)
  const bellRef = useRef(null)
  // Mostra o sino quando não tem subscription ativa e não está bloqueado
  // (cobre 'default' e 'granted' sem subscription — ex: VAPID falhou na primeira tentativa)
  const showBell = pushSupported && !isSubscribed && pushPermission !== 'denied'

  // Fecha popup ao clicar fora
  useEffect(() => {
    if (!showNotifyPopup) return
    const onOutside = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifyPopup(false) }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showNotifyPopup])

  const handleBellActivate = async () => {
    await subscribePush()
    setShowNotifyPopup(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (user.isTecnico) return <Navigate to="/tecnico" replace />
  if (!hasAccess(user)) return <Navigate to="/renovar" replace />

  const diasRestantes = user.status === 'trial' ? trialDaysLeft(user) : null

  // Largura do container desktop conforme o tipo de conteúdo da página:
  // - Listas/dashboard (Oficina, Estoque, Histórico, Financeiro) → ampla (grid multi-coluna)
  // - Menu (formulários/config) → média (leitura confortável, menos espaço vazio)
  // - Demais → contida
  const path = location.pathname
  const pageMaxW =
    ['/app/oficina', '/app/estoque', '/app/historico', '/app/financeiro'].some(p => path.startsWith(p))
      ? 'max-w-6xl'
      : path.startsWith('/app/menu')
        ? 'max-w-4xl'
        : 'max-w-3xl'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AnnouncementBanner />

      {/* ── DESKTOP: sidebar + content ─────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-40">
          {/* Logo */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" priority />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 truncate">{user.oficina}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Trial banner (sidebar bottom) */}
          {user.status === 'trial' && diasRestantes !== null && (
            <div
              className="mx-3 mb-4 bg-indigo-600 text-white text-xs font-medium px-3 py-2.5 rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors"
              onClick={() => navigate('/assinar')}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {diasRestantes > 0
                    ? `${diasRestantes} ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`
                    : 'Período encerrado'}
                </span>
              </div>
              <span className="underline font-semibold">Assinar agora →</span>
            </div>
          )}
        </aside>

        {/* Main content — offset for sidebar */}
        <div className="ml-56 flex-1 flex flex-col min-h-screen">
          <main ref={mainDesktopRef} className="flex-1 overflow-y-auto">
            {/* Largura adaptada ao tipo de página (ver pageMaxW acima) */}
            <div className={`${pageMaxW} mx-auto px-4 xl:px-8`}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE: top header + bottom tab bar ────────────── */}
      <div className="lg:hidden w-full max-w-lg mx-auto flex flex-col min-h-screen relative">

        {/* Banner trial */}
        {user.status === 'trial' && diasRestantes !== null && (
          <div
            className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors shrink-0"
            onClick={() => navigate('/assinar')}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {diasRestantes > 0
                ? `Período gratuito: ${diasRestantes} ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`
                : 'Seu período gratuito encerrou'}
            </div>
            <span className="underline font-semibold">Assinar agora →</span>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2">
            <Logo size="sm" priority />
            {/* Sino de notificações push — aparece só quando permissão ainda não foi decidida */}
            {showBell && (
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => setShowNotifyPopup(v => !v)}
                  aria-label="Ativar notificações"
                  className="relative flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {/* Dot indicador */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
                </button>

                {/* Popup */}
                {showNotifyPopup && (
                  <div className="absolute left-0 top-10 w-72 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                    <button onClick={() => setShowNotifyPopup(false)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Notificações de aprovação</p>
                        <p className="text-xs text-slate-400 leading-snug">Saiba na hora quando o cliente aprovar</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBellActivate}
                      disabled={pushLoading}
                      className="w-full bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {pushLoading ? 'Ativando...' : 'Ativar notificações'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[150px]">{user.oficina}</span>
        </header>

        {/* Content */}
        <main ref={mainMobileRef} className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        {/* Tab Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 z-50">
          <div className="flex">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </nav>
      </div>

      {/* Onboarding wizard fullscreen — 3 fases (criar OS, enviar WhatsApp, configurar oficina) */}
      <OnboardingWizard />

      {/* Animação de check ao salvar (global) */}
      <SaveCheck />

      {/* Fundo decorativo desktop */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-indigo-50 hidden lg:block" />
    </div>
  )
}

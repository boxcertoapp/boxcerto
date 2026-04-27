import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wrench, Users, LogOut, Shield, Eye, EyeOff, Loader2,
  LayoutDashboard, DollarSign, BarChart2, MessageSquare, Bell, Settings,
  ChevronRight, X, LifeBuoy
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Seções do admin
import Dashboard    from './sections/Dashboard'
import Clientes     from './sections/Clientes'
import Receita      from './sections/Receita'
import Analytics    from './tabs/Analytics'
import Comunicacoes from './tabs/Comunicacoes'
import Anuncios     from './tabs/Anuncios'
import Configuracoes from './sections/Configuracoes'
import SuporteAdmin  from './sections/Suporte'

// ── Carrega todos os usuários (shared entre seções) ──────────
export const loadUsers = async () => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return (profiles || []).map(p => ({
    id: p.id,
    oficina: p.oficina || '',
    responsavel: p.responsavel || '',
    whatsapp: p.whatsapp || '',
    email: p.email || '',
    status: p.status || 'trial',
    plan: p.plan || null,
    isAdmin: p.is_admin || false,
    trialEnd: p.trial_end || null,
    createdAt: p.created_at,
    activatedAt: p.activated_at || null,
    stripeCustomerId: p.stripe_customer_id || null,
    nextBillingAt: p.next_billing_at || null,
    canceledAt: p.canceled_at || null,
    lastSeenAt: p.last_seen_at || null,
    osCount: p.os_count || 0,
    notasAdmin: p.notas_admin || '',
  }))
}

// ── Modal de confirmação com senha ───────────────────────────
export function SenhaModal({ title, message, onConfirm, onClose }) {
  const { user } = useAuth()
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const confirmar = async () => {
    if (!senha) { setErro('Digite sua senha.'); return }
    setLoading(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: senha })
    if (error) { setErro('Senha incorreta.'); setLoading(false); return }
    setLoading(false)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="relative mb-3">
          <input type={showSenha ? 'text' : 'password'} value={senha}
            onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmar()}
            placeholder="Sua senha de admin" autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-indigo-400" />
          <button type="button" onClick={() => setShowSenha(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {erro && <p className="text-red-500 text-xs mb-3">{erro}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onClick={confirmar} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de impersonação ────────────────────────────────────
function ImpersonateModal({ email, link, onClose }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Login como usuário</h3>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Importante</p>
          <p className="text-xs text-amber-700">Abra o link em uma <strong>aba anônima (Ctrl+Shift+N)</strong> para não encerrar sua sessão de admin.</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 font-mono text-xs text-slate-500 break-all">
          {link.substring(0, 100)}...
        </div>
        <div className="flex gap-2">
          <button onClick={copy}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
            {copied ? '✓ Copiado!' : 'Copiar link'}
          </button>
          <button onClick={() => window.open(link, '_blank')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
            Abrir (nova aba)
          </button>
          <button onClick={onClose} className="px-3 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Navegação ────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, group: 'principal' },
  { key: 'clientes',     label: 'Clientes',        icon: Users,           group: 'principal' },
  { key: 'receita',      label: 'Receita',         icon: DollarSign,      group: 'principal' },
  { key: 'analytics',   label: 'Analytics',       icon: BarChart2,       group: 'dados' },
  { key: 'comunicacoes', label: 'Comunicações',    icon: MessageSquare,   group: 'dados' },
  { key: 'anuncios',    label: 'Anúncios',        icon: Bell,            group: 'dados' },
  { key: 'suporte',      label: 'Suporte',          icon: LifeBuoy,        group: 'sistema' },
  { key: 'configuracoes',label: 'Configurações',   icon: Settings,        group: 'sistema' },
]

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [senhaModal, setSenhaModal] = useState(null)
  const [impersonateModal, setImpersonateModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/login')
    setLoadingUsers(true)
    loadUsers().then(u => { setUsers(u); setLoadingUsers(false) })
  }, [refresh])

  const reload = () => setRefresh(r => r + 1)

  const confirmarComSenha = (title, message, callback) => {
    setSenhaModal({ title, message, onConfirm: () => { setSenhaModal(null); callback() } })
  }

  const [impersonateLoading, setImpersonateLoading] = useState(null)
  const impersonate = async (u) => {
    setImpersonateLoading(u.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch('/api/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: session.access_token, userId: u.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao gerar link.')
      setImpersonateModal({ email: json.email || u.email, link: json.link })
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setImpersonateLoading(null)
    }
  }

  // Conta alertas urgentes para badge
  const now = new Date()
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const trialsExpirando = users.filter(u => u.status === 'trial' && u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)
  const inadimplentes   = users.filter(u => u.status === 'inadimplente')
  const alertCount = trialsExpirando.length + inadimplentes.length

  const groups = { principal: 'Principal', dados: 'Dados', sistema: 'Sistema' }

  const sharedProps = {
    users, loadingUsers, reload, confirmarComSenha, impersonate, impersonateLoading,
    setSenhaModal, navigate,
  }

  const renderSection = () => {
    switch (section) {
      case 'dashboard':    return <Dashboard    {...sharedProps} onNavigate={setSection} />
      case 'clientes':     return <Clientes     {...sharedProps} />
      case 'receita':      return <Receita      {...sharedProps} />
      case 'analytics':   return <Analytics    users={users} />
      case 'comunicacoes': return <Comunicacoes users={users} />
      case 'anuncios':    return <Anuncios     />
      case 'suporte':      return <SuporteAdmin />
      case 'configuracoes':return <Configuracoes users={users} reload={reload} />
      default:             return <Dashboard    {...sharedProps} onNavigate={setSection} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Modais */}
      {impersonateModal && <ImpersonateModal {...impersonateModal} onClose={() => setImpersonateModal(null)} />}
      {senhaModal && <SenhaModal {...senhaModal} onClose={() => setSenhaModal(null)} />}

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-screen w-56 bg-slate-900 flex flex-col z-40 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">BoxCerto</p>
              <p className="text-indigo-400 text-[10px] font-semibold">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {Object.entries(groups).map(([gKey, gLabel]) => {
            const items = NAV.filter(n => n.group === gKey)
            return (
              <div key={gKey} className="mb-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">{gLabel}</p>
                {items.map(({ key, label, icon: Icon }) => {
                  const isActive = section === key
                  const badge = key === 'dashboard' && alertCount > 0 ? alertCount : null
                  return (
                    <button key={key} onClick={() => { setSection(key); setSidebarOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium mb-0.5 transition-all text-left
                        ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                      {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.email}</p>
              <p className="text-slate-500 text-[10px]">Super Admin</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="lg:ml-56 flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20 h-14 flex items-center px-4 gap-3">
          {/* Mobile menu */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-800">
              {NAV.find(n => n.key === section)?.label || 'Dashboard'}
            </span>
          </div>

          {/* Contadores rápidos */}
          <div className="ml-auto flex items-center gap-3">
            {alertCount > 0 && (
              <button onClick={() => setSection('dashboard')}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {alertCount} alerta{alertCount !== 1 ? 's' : ''}
              </button>
            )}
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-700">{users.filter(u => u.status === 'active').length}</span> ativos
              <span className="mx-1.5 text-slate-200">|</span>
              <span className="font-semibold text-indigo-600">{users.filter(u => u.status === 'trial').length}</span> trial
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 max-w-6xl mx-auto w-full">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wrench, Users, CheckCircle, XCircle, Clock,
  LogOut, Phone, Mail, Building2, TrendingUp,
  Search, RefreshCw, Shield, Calendar,
  ChevronDown, ChevronUp, Trash2, Loader2, Eye, EyeOff, AlertCircle, CreditCard
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/storage'

const STATUS_CONFIG = {
  pending:      { label: 'Pendente',     color: 'bg-amber-100 text-amber-700',    icon: Clock },
  trial:        { label: 'Trial',        color: 'bg-indigo-100 text-indigo-700',  icon: Clock },
  active:       { label: 'Ativo',        color: 'bg-green-100 text-green-700',    icon: CheckCircle },
  inactive:     { label: 'Inativo',      color: 'bg-gray-100 text-gray-600',      icon: XCircle },
  rejected:     { label: 'Rejeitado',    color: 'bg-red-100 text-red-600',        icon: XCircle },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',        icon: XCircle },
  inadimplente: { label: 'Inadimplente', color: 'bg-orange-100 text-orange-700',  icon: AlertCircle },
}

const loadUsers = async () => {
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
  }))
}

const updateProfile = async (id, fields) => {
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  if (error) throw error
}

// Modal de confirmação com senha
function SenhaModal({ title, message, onConfirm, onClose }) {
  const { user } = useAuth()
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const confirmar = async () => {
    if (!senha) { setErro('Digite sua senha.'); return }
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha,
    })
    if (error) {
      setErro('Senha incorreta.')
      setLoading(false)
      return
    }
    setLoading(false)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>

        <div className="relative mb-3">
          <input
            type={showSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
            placeholder="Sua senha de admin"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => setShowSenha(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {erro && <p className="text-red-500 text-xs mb-3">{erro}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [editingTrialId, setEditingTrialId] = useState(null)
  const [trialDate, setTrialDate] = useState('')

  // Modal de senha
  const [senhaModal, setSenhaModal] = useState(null)
  // { title, message, onConfirm }

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/login')
    loadUsers().then(setUsers)
  }, [refresh])

  const reload = () => setRefresh(r => r + 1)

  // Abre modal de confirmação por senha e executa callback após verificar
  const confirmarComSenha = (title, message, callback) => {
    setSenhaModal({ title, message, onConfirm: () => { setSenhaModal(null); callback() } })
  }

  // ── Ações de status ──────────────────────────────────────
  const approve = async (id, plan = 'monthly') => {
    await updateProfile(id, { status: 'active', plan, activated_at: new Date().toISOString() })
    reload()
  }

  const reject = async (id) => {
    await updateProfile(id, { status: 'rejected' })
    reload()
  }

  const deactivate = async (id) => {
    await updateProfile(id, { status: 'inactive' })
    reload()
  }

  // ── Deletar usuário ──────────────────────────────────────
  const deleteUser = (u) => {
    confirmarComSenha(
      'Excluir usuário',
      `Tem certeza que deseja excluir "${u.oficina || u.email}"? Todos os dados serão apagados. Esta ação é irreversível.`,
      async () => {
        try {
          // Deleta o perfil — cascateia todos os dados (clients, vehicles, OS, etc.)
          await supabase.from('profiles').delete().eq('id', u.id)
          reload()
        } catch (err) {
          alert('Erro ao excluir usuário: ' + err.message)
        }
      }
    )
  }

  // ── Grant / Revoke Admin ─────────────────────────────────
  const toggleAdmin = (u) => {
    const acao = u.isAdmin ? 'Remover admin' : 'Tornar admin'
    const msg = u.isAdmin
      ? `Remover permissão de administrador de "${u.oficina || u.email}"?`
      : `Dar permissão de administrador a "${u.oficina || u.email}"? Ele terá acesso total ao painel.`

    confirmarComSenha(acao, msg, async () => {
      await updateProfile(u.id, { is_admin: !u.isAdmin })
      reload()
    })
  }

  // ── Editar trial_end ─────────────────────────────────────
  const startEditTrial = (u) => {
    setEditingTrialId(u.id)
    setTrialDate(u.trialEnd ? u.trialEnd.split('T')[0] : '')
  }

  const saveTrial = async (id) => {
    if (!trialDate) return
    await updateProfile(id, {
      trial_end: new Date(trialDate + 'T23:59:59').toISOString(),
      status: 'trial',
    })
    setEditingTrialId(null)
    reload()
  }

  // ── Filtros ──────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.status === filter
    const matchQuery = !query ||
      u.oficina?.toLowerCase().includes(query.toLowerCase()) ||
      u.responsavel?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  const counts = {
    total:        users.length,
    active:       users.filter(u => u.status === 'active').length,
    trial:        users.filter(u => u.status === 'trial').length,
    inadimplente: users.filter(u => u.status === 'inadimplente').length,
    cancelado:    users.filter(u => u.status === 'cancelado').length,
  }

  const mrr = users
    .filter(u => u.status === 'active')
    .reduce((s, u) => s + (u.plan === 'annual' ? 418.80 / 12 : 47.90), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {senhaModal && (
        <SenhaModal
          title={senhaModal.title}
          message={senhaModal.message}
          onConfirm={senhaModal.onConfirm}
          onClose={() => setSenhaModal(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900">BoxCerto</span>
              <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Clientes', value: counts.total,        icon: Users,        color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Ativos',         value: counts.active,        icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Em Trial',       value: counts.trial,         icon: Clock,        color: 'text-indigo-600', bg: 'bg-indigo-100' },
            { label: 'Inadimplentes',  value: counts.inadimplente,  icon: AlertCircle,  color: 'text-orange-600', bg: 'bg-orange-100' },
            { label: 'MRR Estimado',   value: `R$${mrr.toFixed(0)}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por oficina, nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',          label: 'Todos' },
              { key: 'trial',        label: 'Trial' },
              { key: 'pending',      label: 'Pendentes' },
              { key: 'active',       label: 'Ativos' },
              { key: 'inadimplente', label: 'Inadimplentes' },
              { key: 'cancelado',    label: 'Cancelados' },
              { key: 'inactive',     label: 'Inativos' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button onClick={reload} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Lista de usuários */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cadastro encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(u => {
              const sc = STATUS_CONFIG[u.status] || STATUS_CONFIG.trial
              const isExpanded = expandedId === u.id
              const isSelf = u.id === user.id

              return (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Info */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{u.oficina || '(sem nome)'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                          {u.plan && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                              {u.plan === 'annual' ? 'Anual' : 'Mensal'}
                            </span>
                          )}
                          {u.isAdmin && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          {u.responsavel && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />{u.responsavel}
                            </span>
                          )}
                          {u.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 shrink-0" />{u.email}
                            </span>
                          )}
                          {u.whatsapp && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <a
                                href={`https://wa.me/55${u.whatsapp.replace(/\D/g, '')}`}
                                target="_blank" rel="noreferrer"
                                className="text-green-600 hover:underline"
                              >
                                {u.whatsapp}
                              </a>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Cadastrado em {formatDate(u.createdAt)}
                          {u.activatedAt && ` · Ativado em ${formatDate(u.activatedAt)}`}
                          {u.trialEnd && u.status === 'trial' && ` · Trial até ${formatDate(u.trialEnd)}`}
                          {u.nextBillingAt && u.status === 'active' && ` · Próx. cobrança: ${formatDate(u.nextBillingAt)}`}
                          {u.canceledAt && u.status === 'cancelado' && ` · Cancelado em ${formatDate(u.canceledAt)}`}
                        </p>
                      </div>

                      {/* Ações rápidas */}
                      <div className="flex flex-wrap gap-2 shrink-0 items-center">
                        {(u.status === 'pending' || u.status === 'trial') && (
                          <>
                            <button
                              onClick={() => approve(u.id)}
                              className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => reject(u.id)}
                              className="flex items-center gap-1.5 bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-100 border border-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Rejeitar
                            </button>
                          </>
                        )}
                        {u.status === 'active' && (
                          <button
                            onClick={() => deactivate(u.id)}
                            className="bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            Desativar
                          </button>
                        )}
                        {(u.status === 'inactive' || u.status === 'rejected') && (
                          <button
                            onClick={() => approve(u.id)}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Reativar
                          </button>
                        )}
                        {(u.status === 'cancelado' || u.status === 'inadimplente') && (
                          <button
                            onClick={() => approve(u.id)}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Reativar
                          </button>
                        )}
                        {(u.status === 'pending' || u.status === 'trial') && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => approve(u.id, 'monthly')}
                              className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors"
                            >+ Mensal</button>
                            <button
                              onClick={() => approve(u.id, 'annual')}
                              className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors"
                            >+ Anual</button>
                          </div>
                        )}

                        {/* Expandir */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-slate-500"
                          title="Mais opções"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Painel expandido */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-5">

                      {/* Estender trial */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Período trial
                        </p>
                        {editingTrialId === u.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="date"
                              value={trialDate}
                              onChange={e => setTrialDate(e.target.value)}
                              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                            />
                            <button
                              onClick={() => saveTrial(u.id)}
                              className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors"
                            >Salvar</button>
                            <button
                              onClick={() => setEditingTrialId(null)}
                              className="text-slate-500 text-sm px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors"
                            >Cancelar</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditTrial(u)}
                            className="text-sm text-indigo-600 font-medium hover:underline"
                          >
                            {u.trialEnd
                              ? `Vence em ${formatDate(u.trialEnd)} — Alterar data`
                              : 'Definir data de trial'}
                          </button>
                        )}
                      </div>

                      {/* Stripe */}
                      {(u.stripeCustomerId || u.status === 'active' || u.status === 'inadimplente') && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Stripe
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            {u.stripeCustomerId && (
                              <span className="text-xs text-slate-400 font-mono bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                {u.stripeCustomerId}
                              </span>
                            )}
                            {u.stripeCustomerId && (
                              <a
                                href={`https://dashboard.stripe.com/customers/${u.stripeCustomerId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                              >
                                Ver no Stripe →
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin + Excluir */}
                      <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-gray-200">
                        {/* Tornar / remover admin */}
                        {!isSelf && (
                          <button
                            onClick={() => toggleAdmin(u)}
                            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
                              u.isAdmin
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                            {u.isAdmin ? 'Remover admin' : 'Tornar admin'}
                          </button>
                        )}
                        {isSelf && (
                          <span className="text-xs text-slate-400 italic">Você não pode alterar sua própria conta.</span>
                        )}

                        {/* Excluir usuário */}
                        {!isSelf && (
                          <button
                            onClick={() => deleteUser(u)}
                            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir usuário
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

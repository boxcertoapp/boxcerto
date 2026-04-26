import { useState } from 'react'
import {
  Search, RefreshCw, Filter, Download, ChevronDown, ChevronUp,
  Trash2, Loader2, Eye, EyeOff, Shield, Calendar, CreditCard,
  Phone, Mail, Building2, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, MessageSquare, ChevronRight, X, Star, StickyNote, Users
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/storage'
import { SenhaModal } from '../AdminPanel'

const STATUS_CONFIG = {
  pending:      { label: 'Pendente',     color: 'bg-amber-100 text-amber-700',  icon: Clock },
  trial:        { label: 'Trial',        color: 'bg-indigo-100 text-indigo-700', icon: Clock },
  active:       { label: 'Ativo',        color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  inactive:     { label: 'Inativo',      color: 'bg-gray-100 text-gray-600',    icon: XCircle },
  rejected:     { label: 'Rejeitado',    color: 'bg-red-100 text-red-600',      icon: XCircle },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',      icon: XCircle },
  inadimplente: { label: 'Inadimplente', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

// ── Health Score ─────────────────────────────────────────────
function calcHealthScore(u) {
  let score = 0
  const now = new Date()

  // 1. Status (30 pts)
  const statusPts = { active: 30, trial: 20, pending: 10, inadimplente: 5, cancelado: 0, inactive: 0, rejected: 0 }
  score += statusPts[u.status] || 0

  // 2. Último acesso (40 pts)
  if (u.lastSeenAt) {
    const diffDays = (now - new Date(u.lastSeenAt)) / (1000 * 60 * 60 * 24)
    if      (diffDays <= 1)  score += 40
    else if (diffDays <= 3)  score += 30
    else if (diffDays <= 7)  score += 20
    else if (diffDays <= 14) score += 10
    else                     score += 0
  }

  // 3. OS criadas (30 pts)
  const os = u.osCount || 0
  if      (os >= 20) score += 30
  else if (os >= 10) score += 22
  else if (os >= 5)  score += 15
  else if (os >= 2)  score += 8
  else if (os >= 1)  score += 3

  return Math.min(score, 100)
}

function HealthBadge({ score }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  const bg    = score >= 70 ? 'bg-green-50'    : score >= 40 ? 'bg-amber-50'    : 'bg-red-50'
  const bar   = score >= 70 ? 'bg-green-500'   : score >= 40 ? 'bg-amber-400'   : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${color}`}>{score}</span>
    </div>
  )
}

// ── Perfil individual do cliente ─────────────────────────────
function ClientePerfil({ u, onClose, onReload }) {
  const [saving, setSaving] = useState(false)
  const [nota, setNota] = useState(u.notasAdmin || '')
  const [notaSaved, setNotaSaved] = useState(false)

  const saveNota = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ notas_admin: nota }).eq('id', u.id)
    setSaving(false)
    setNotaSaved(true)
    setTimeout(() => setNotaSaved(false), 2000)
  }

  const sc = STATUS_CONFIG[u.status] || STATUS_CONFIG.trial
  const health = calcHealthScore(u)
  const now = new Date()

  const timeline = [
    u.createdAt    && { at: new Date(u.createdAt),    icon: '📝', text: 'Cadastro realizado', color: 'bg-indigo-100' },
    u.activatedAt  && { at: new Date(u.activatedAt),  icon: '✅', text: 'Assinatura ativada', color: 'bg-green-100' },
    u.canceledAt   && { at: new Date(u.canceledAt),   icon: '❌', text: 'Assinatura cancelada', color: 'bg-red-100' },
    u.lastSeenAt   && { at: new Date(u.lastSeenAt),   icon: '👁️', text: 'Último acesso', color: 'bg-blue-100' },
  ].filter(Boolean).sort((a, b) => b.at - a.at)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${sc.color}`}>
            {(u.oficina || u.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base">{u.oficina || '(sem nome)'}</p>
            <p className="text-sm text-slate-500">{u.responsavel}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
              {u.plan && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{u.plan === 'annual' ? 'Anual' : 'Mensal'}</span>}
              {u.isAdmin && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>}
            </div>
          </div>
          <HealthBadge score={health} />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Contatos */}
          <div className="grid sm:grid-cols-3 gap-3">
            {u.email && (
              <a href={`mailto:${u.email}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{u.email}</span>
              </a>
            )}
            {u.whatsapp && (
              <a href={`https://wa.me/55${u.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{u.whatsapp}</span>
              </a>
            )}
            {u.stripeCustomerId && (
              <a href={`https://dashboard.stripe.com/customers/${u.stripeCustomerId}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-indigo-600 font-medium">Ver no Stripe →</span>
              </a>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{u.osCount || 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">OS criadas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-900">{u.lastSeenAt ? formatDate(u.lastSeenAt) : '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Último acesso</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-900">{u.createdAt ? formatDate(u.createdAt) : '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Cadastro</p>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Timeline</p>
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                {timeline.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <span className={`w-5 h-5 ${e.color} rounded-full flex items-center justify-center text-xs flex-shrink-0 -ml-2 z-10`}>{e.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{e.text}</p>
                      <p className="text-xs text-slate-400">{formatDate(e.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas internas */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> Notas internas (visível apenas para admins)
            </p>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3}
              placeholder="Adicione observações sobre este cliente..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
            <button onClick={saveNota} disabled={saving}
              className={`mt-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${notaSaved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-60`}>
              {saving ? 'Salvando...' : notaSaved ? '✓ Salvo' : 'Salvar nota'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Exportar CSV ─────────────────────────────────────────────
function exportCSV(users) {
  const headers = ['Oficina','Responsável','Email','WhatsApp','Status','Plano','Cadastro','Último acesso','OS criadas','Health Score']
  const rows = users.map(u => [
    u.oficina, u.responsavel, u.email, u.whatsapp,
    u.status, u.plan || '', u.createdAt ? formatDate(u.createdAt) : '',
    u.lastSeenAt ? formatDate(u.lastSeenAt) : '',
    u.osCount || 0, calcHealthScore(u)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'clientes_boxcerto.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Componente principal ─────────────────────────────────────
export default function Clientes({ users, loadingUsers, reload, confirmarComSenha, impersonate, impersonateLoading }) {
  const [filter, setFilter]   = useState('all')
  const [query, setQuery]     = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [perfilId, setPerfilId]   = useState(null)
  const [editTrialId, setEditTrialId] = useState(null)
  const [trialDate, setTrialDate] = useState('')
  const [senhaModal, setSenhaModal] = useState(null)
  const [sortBy, setSortBy] = useState('date') // date | health | name | status

  const updateProfile = async (id, fields) => {
    await supabase.from('profiles').update(fields).eq('id', id)
    reload()
  }

  const approve   = (id, plan = 'monthly') => updateProfile(id, { status: 'active', plan, activated_at: new Date().toISOString() })
  const reject    = (id) => updateProfile(id, { status: 'rejected' })
  const deactivate = (id) => updateProfile(id, { status: 'inactive' })
  const saveTrial = async (id) => {
    if (!trialDate) return
    await updateProfile(id, { trial_end: new Date(trialDate + 'T23:59:59').toISOString(), status: 'trial' })
    setEditTrialId(null)
  }
  const toggleAdmin = (u) => {
    confirmarComSenha(
      u.isAdmin ? 'Remover admin' : 'Tornar admin',
      u.isAdmin ? `Remover permissão de admin de "${u.oficina || u.email}"?` : `Dar acesso admin a "${u.oficina || u.email}"?`,
      async () => { await updateProfile(u.id, { is_admin: !u.isAdmin }) }
    )
  }
  const deleteUser = (u) => {
    confirmarComSenha(
      'Excluir usuário',
      `Excluir permanentemente "${u.oficina || u.email}"? Todos os dados serão apagados.`,
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/admin-delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id, adminToken: session.access_token }),
        })
        const json = await res.json()
        if (!res.ok) { alert('Erro: ' + json.error); return }
        reload()
      }
    )
  }

  // Filtros e ordenação
  const filtered = users
    .filter(u => filter === 'all' || u.status === filter ||
      (filter === 'risk' && (calcHealthScore(u) < 40 || u.status === 'inadimplente')))
    .filter(u => !query ||
      u.oficina?.toLowerCase().includes(query.toLowerCase()) ||
      u.responsavel?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'health') return calcHealthScore(b) - calcHealthScore(a)
      if (sortBy === 'name')   return (a.oficina || '').localeCompare(b.oficina || '')
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.createdAt) - new Date(a.createdAt) // date
    })

  const counts = {
    all: users.length,
    active: users.filter(u => u.status === 'active').length,
    trial: users.filter(u => u.status === 'trial').length,
    inadimplente: users.filter(u => u.status === 'inadimplente').length,
    cancelado: users.filter(u => u.status === 'cancelado').length,
    risk: users.filter(u => calcHealthScore(u) < 40).length,
  }

  const perfilUser = perfilId ? users.find(u => u.id === perfilId) : null

  return (
    <div className="space-y-4">
      {senhaModal && <SenhaModal {...senhaModal} onClose={() => setSenhaModal(null)} />}
      {perfilUser && <ClientePerfil u={perfilUser} onClose={() => setPerfilId(null)} onReload={reload} />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por oficina, nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white text-slate-600">
            <option value="date">Mais recentes</option>
            <option value="health">Health score</option>
            <option value="name">Nome</option>
            <option value="status">Status</option>
          </select>
          <button onClick={reload} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-slate-600 font-medium">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: 'all',          label: `Todos (${counts.all})` },
          { key: 'active',       label: `Ativos (${counts.active})` },
          { key: 'trial',        label: `Trial (${counts.trial})` },
          { key: 'inadimplente', label: `Inadimp. (${counts.inadimplente})` },
          { key: 'cancelado',    label: `Cancelados (${counts.cancelado})` },
          { key: 'risk',         label: `Em risco (${counts.risk})`, alert: true },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.key
                ? f.alert ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                : f.alert ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-slate-600 border border-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loadingUsers ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const sc = STATUS_CONFIG[u.status] || STATUS_CONFIG.trial
            const StatusIcon = sc.icon
            const isExpanded = expandedId === u.id
            const health = calcHealthScore(u)
            const now = new Date()
            const diasTrial = u.trialEnd ? Math.ceil((new Date(u.trialEnd) - now) / (1000*60*60*24)) : null

            return (
              <div key={u.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                health < 30 ? 'border-red-100' : isExpanded ? 'border-indigo-200' : 'border-gray-100'
              }`}>
                {/* Row principal */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${sc.color}`}>
                    {(u.oficina || u.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800 truncate">{u.oficina || '(sem nome)'}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sc.color}`}>{sc.label}</span>
                      {u.plan && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{u.plan === 'annual' ? 'Anual' : 'Mensal'}</span>}
                      {u.isAdmin && <Shield className="w-3 h-3 text-amber-500" />}
                      {u.notasAdmin && <StickyNote className="w-3 h-3 text-amber-400" title="Tem notas" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</p>
                  </div>

                  {/* Health */}
                  <div className="hidden sm:block min-w-[70px]">
                    <HealthBadge score={health} />
                  </div>

                  {/* Trial info */}
                  {u.status === 'trial' && diasTrial !== null && (
                    <span className={`hidden sm:block text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      diasTrial <= 0 ? 'bg-red-100 text-red-700' : diasTrial <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {diasTrial <= 0 ? 'Expirou' : `${diasTrial}d`}
                    </span>
                  )}

                  {/* Ações rápidas */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(u.status === 'pending' || u.status === 'trial') && (
                      <button onClick={() => approve(u.id)}
                        className="text-xs bg-green-600 text-white font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                        Aprovar
                      </button>
                    )}
                    {(u.status === 'inactive' || u.status === 'rejected' || u.status === 'cancelado' || u.status === 'inadimplente') && (
                      <button onClick={() => approve(u.id)}
                        className="text-xs bg-indigo-600 text-white font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                        Reativar
                      </button>
                    )}
                    {/* Perfil */}
                    <button onClick={() => setPerfilId(u.id)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                    {/* Expandir */}
                    <button onClick={() => setExpandedId(isExpanded ? null : u.id)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-slate-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Painel expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">

                    {/* Contatos */}
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                      {u.responsavel && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{u.responsavel}</span>}
                      {u.whatsapp && (
                        <a href={`https://wa.me/55${u.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-green-600 hover:underline">
                          <Phone className="w-3.5 h-3.5" />{u.whatsapp}
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      Cadastrado em {formatDate(u.createdAt)}
                      {u.activatedAt && ` · Ativado em ${formatDate(u.activatedAt)}`}
                      {u.trialEnd && u.status === 'trial' && ` · Trial até ${formatDate(u.trialEnd)}`}
                      {u.lastSeenAt && ` · Visto em ${formatDate(u.lastSeenAt)}`}
                      {u.nextBillingAt && ` · Próx. cobrança: ${formatDate(u.nextBillingAt)}`}
                    </p>

                    {/* Trial editor */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Trial</p>
                      {editTrialId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input type="date" value={trialDate} onChange={e => setTrialDate(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none bg-white" />
                          <button onClick={() => saveTrial(u.id)} className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-indigo-700">Salvar</button>
                          <button onClick={() => setEditTrialId(null)} className="text-sm text-slate-500 px-2 py-1.5 rounded-xl hover:bg-gray-100">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditTrialId(u.id); setTrialDate(u.trialEnd?.split('T')[0] || '') }}
                          className="text-sm text-indigo-600 font-medium hover:underline">
                          {u.trialEnd ? `Vence em ${formatDate(u.trialEnd)} — Alterar` : 'Definir data de trial'}
                        </button>
                      )}
                    </div>

                    {/* Stripe */}
                    {u.stripeCustomerId && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Stripe</p>
                        <a href={`https://dashboard.stripe.com/customers/${u.stripeCustomerId}`} target="_blank" rel="noreferrer"
                          className="text-xs text-indigo-600 font-medium hover:underline">
                          {u.stripeCustomerId} →
                        </a>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      {u.status === 'active' && (
                        <button onClick={() => deactivate(u.id)} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-200">Desativar</button>
                      )}
                      {(u.status === 'pending' || u.status === 'trial') && (
                        <>
                          <button onClick={() => approve(u.id, 'monthly')} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100">+ Mensal</button>
                          <button onClick={() => approve(u.id, 'annual')}  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100">+ Anual</button>
                          <button onClick={() => reject(u.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100 hover:bg-red-100">Rejeitar</button>
                        </>
                      )}
                      <button onClick={() => toggleAdmin(u)}
                        className={`text-xs px-3 py-1.5 rounded-xl border ${u.isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        <Shield className="w-3 h-3 inline mr-1" />{u.isAdmin ? 'Remover admin' : 'Tornar admin'}
                      </button>
                      <button onClick={() => impersonate(u)} disabled={impersonateLoading === u.id}
                        className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 disabled:opacity-60">
                        {impersonateLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                        Login como usuário
                      </button>
                      <button onClick={() => deleteUser(u)}
                        className="ml-auto text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100 hover:bg-red-100 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">{filtered.length} de {users.length} clientes</p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Search, RefreshCw, Filter, Download, ChevronDown, ChevronUp,
  Trash2, Loader2, Eye, EyeOff, Shield, Calendar, CreditCard,
  Phone, Mail, Building2, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, MessageSquare, ChevronRight, X, Star, StickyNote, Users,
  CheckSquare, Square
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/storage'
import { SenhaModal } from '../AdminPanel'

// ── Qualificação — labels e cores ────────────────────────────
const TIPO_CONFIG = {
  mecanica:  { emoji: '🔧', label: 'Mecânica Geral' },
  moto:      { emoji: '🏍️', label: 'Moto oficina' },
  pesados:   { emoji: '🚛', label: 'Pesados' },
  funilaria: { emoji: '🎨', label: 'Funilaria & Pintura' },
  eletrica:  { emoji: '⚡', label: 'Elétrica Automotiva' },
  estetica:  { emoji: '✨', label: 'Estética Automotiva' },
  geral:     { emoji: '🚗', label: 'Vários serviços' },
}
const CARGO_CONFIG = {
  dono:        { emoji: '👑', label: 'Dono / Sócio',     color: 'bg-amber-50 text-amber-700' },
  gerente:     { emoji: '📋', label: 'Func. / Gerente',  color: 'bg-blue-50 text-blue-600' },
  pesquisando: { emoji: '🔍', label: 'Pesquisando',      color: 'bg-gray-100 text-gray-500' },
}

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
// Fórmula: OS é o principal indicador de engajamento real.
// Usuários que nunca criaram OS têm "último acesso" limitado a 8 pts
// para não inflarem o score apenas por ter se cadastrado hoje.
function calcHealthScore(u) {
  let score = 0
  const now = new Date()
  const os  = u.osCount || 0

  // 1. OS criadas (0–50 pts) — engajamento real
  if      (os >= 20) score += 50
  else if (os >= 10) score += 42
  else if (os >= 5)  score += 33
  else if (os >= 2)  score += 22
  else if (os >= 1)  score += 12
  // 0 OS = 0 pts

  // 2. Último acesso (0–30 pts)
  // Sem OS: cap 8 pts (não infla score de quem só se cadastrou)
  if (u.lastSeenAt) {
    const diffDays = (now - new Date(u.lastSeenAt)) / (1000 * 60 * 60 * 24)
    let pts = 0
    if      (diffDays <= 1)  pts = 30
    else if (diffDays <= 3)  pts = 22
    else if (diffDays <= 7)  pts = 14
    else if (diffDays <= 14) pts = 7
    score += os === 0 ? Math.min(pts, 8) : pts
  }

  // 3. Status (0–20 pts)
  const statusPts = { active: 20, trial: 15, pending: 5, inadimplente: 2, cancelado: 0, inactive: 0, rejected: 0 }
  score += statusPts[u.status] || 0

  // Cap pesquisando em 30 — baixa intenção não deve aparecer como saudável
  if (u.cargo === 'pesquisando') return Math.min(score, 30)
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
              {u.signupMethod === 'google'
                ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/></svg>
                    Cadastro Google
                  </span>
                : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Cadastro por Formulário</span>
              }
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

          {/* Qualificação */}
          {(u.tipoOficina || u.cargo) && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Qualificação</p>
              <div className="flex flex-wrap gap-2">
                {u.tipoOficina && TIPO_CONFIG[u.tipoOficina] && (
                  <span className="flex items-center gap-1.5 text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-medium">
                    {TIPO_CONFIG[u.tipoOficina].emoji} {TIPO_CONFIG[u.tipoOficina].label}
                  </span>
                )}
                {u.cargo && CARGO_CONFIG[u.cargo] && (
                  <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-medium ${CARGO_CONFIG[u.cargo].color}`}>
                    {CARGO_CONFIG[u.cargo].emoji} {CARGO_CONFIG[u.cargo].label}
                  </span>
                )}
                {u.activated && (
                  <span className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-medium">
                    ✅ Ativado {u.firstActionAt ? `em ${formatDate(u.firstActionAt)}` : ''}
                  </span>
                )}
              </div>
            </div>
          )}

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
  const headers = ['Oficina','Responsável','Email','WhatsApp','Status','Plano','Cadastro via','Tipo de oficina','Cargo','Ativado','Cadastrado em','Último acesso','OS criadas','Health Score']
  const rows = users.map(u => [
    u.oficina, u.responsavel, u.email, u.whatsapp,
    u.status, u.plan || '',
    u.signupMethod === 'google' ? 'Google' : 'Formulário',
    u.tipoOficina ? (TIPO_CONFIG[u.tipoOficina]?.label || u.tipoOficina) : '',
    u.cargo ? (CARGO_CONFIG[u.cargo]?.label || u.cargo) : '',
    u.activated ? 'Sim' : 'Não',
    u.createdAt ? formatDate(u.createdAt) : '',
    u.lastSeenAt ? formatDate(u.lastSeenAt) : '',
    u.osCount || 0, calcHealthScore(u)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'clientes_boxcerto.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Barra de ações em lote ───────────────────────────────────
function BulkBar({ count, onActivateMonthly, onActivateAnnual, onDeactivate, onDelete, onExportCSV, onClear, progress }) {
  if (count === 0) return null
  return (
    <div className="sticky bottom-4 z-20 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-indigo-300 mr-1 flex-shrink-0">
          {count} selecionado{count !== 1 ? 's' : ''}
        </span>
        {progress ? (
          <div className="flex items-center gap-2 flex-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300 flex-shrink-0" />
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Excluindo {progress.done}/{progress.total}…</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden min-w-[50px]">
              <div className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <button onClick={onActivateMonthly}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              Ativar Mensal
            </button>
            <button onClick={onActivateAnnual}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              Ativar Anual
            </button>
            <button onClick={onDeactivate}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              Desativar
            </button>
            <button onClick={onExportCSV}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1">
              <Download className="w-3 h-3" /> CSV
            </button>
            <button onClick={onDelete}
              className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Excluir
            </button>
          </div>
        )}
        <button onClick={onClear}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
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
  const [selected, setSelected]         = useState(new Set())
  const [bulkProgress, setBulkProgress] = useState(null) // null | { done, total }

  // Limpa seleção ao mudar filtro ou busca
  useEffect(() => { setSelected(new Set()) }, [filter, query])

  // ── Origem de afiliado: carrega parceiros e resolve o nome ──
  const [partnerMaps, setPartnerMaps] = useState({ byId: {}, bySlug: {}, byCoupon: {} })
  useEffect(() => {
    supabase.from('affiliate_partners').select('*').then(({ data }) => {
      const byId = {}, bySlug = {}, byCoupon = {}
      ;(data || []).forEach(pt => {
        const name = pt.display_name || pt.nome || pt.slug
        byId[pt.id] = name
        if (pt.slug)        bySlug[pt.slug.toLowerCase()]      = name
        if (pt.coupon_code) byCoupon[pt.coupon_code.toUpperCase()] = name
      })
      setPartnerMaps({ byId, bySlug, byCoupon })
    })
  }, [])

  const hasAffiliate = (u) => !!(u.affiliatePartnerId || u.affiliateRef || u.affiliateCoupon)
  const partnerOf = (u) => {
    if (u.affiliatePartnerId && partnerMaps.byId[u.affiliatePartnerId]) return partnerMaps.byId[u.affiliatePartnerId]
    if (u.affiliateRef && partnerMaps.bySlug[u.affiliateRef.toLowerCase()]) return partnerMaps.bySlug[u.affiliateRef.toLowerCase()]
    if (u.affiliateCoupon && partnerMaps.byCoupon[u.affiliateCoupon.toUpperCase()]) return partnerMaps.byCoupon[u.affiliateCoupon.toUpperCase()]
    return u.affiliateRef || u.affiliateCoupon || null // mostra o ref/cupom mesmo sem parceiro resolvido
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const updateProfile = async (id, fields) => {
    await supabase.from('profiles').update(fields).eq('id', id)
    reload()
  }

  const activate   = (id, plan = 'monthly') => updateProfile(id, { status: 'active', plan, activated_at: new Date().toISOString() })
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

  // ── Ações em lote ───────────────────────────────────────────
  const bulkDelete = () => {
    const ids = [...selected]
    confirmarComSenha(
      `Excluir ${ids.length} cliente${ids.length > 1 ? 's' : ''}`,
      `Excluir permanentemente ${ids.length} cliente${ids.length > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`,
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        setBulkProgress({ done: 0, total: ids.length })
        for (let i = 0; i < ids.length; i++) {
          await fetch('/api/admin-delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: ids[i], adminToken: session.access_token }),
          })
          setBulkProgress({ done: i + 1, total: ids.length })
        }
        setBulkProgress(null)
        setSelected(new Set())
        reload()
      }
    )
  }

  const bulkActivate = (plan) => {
    const ids = [...selected]
    confirmarComSenha(
      `Ativar ${ids.length} cliente${ids.length > 1 ? 's' : ''}`,
      `Ativar ${ids.length} cliente${ids.length > 1 ? 's' : ''} como ${plan === 'annual' ? 'Anual' : 'Mensal'}?`,
      async () => {
        await supabase.from('profiles')
          .update({ status: 'active', plan, activated_at: new Date().toISOString() })
          .in('id', ids)
        setSelected(new Set())
        reload()
      }
    )
  }

  const bulkDeactivate = () => {
    const ids = [...selected]
    confirmarComSenha(
      `Desativar ${ids.length} cliente${ids.length > 1 ? 's' : ''}`,
      `Desativar ${ids.length} cliente${ids.length > 1 ? 's' : ''}?`,
      async () => {
        await supabase.from('profiles').update({ status: 'inactive' }).in('id', ids)
        setSelected(new Set())
        reload()
      }
    )
  }

  // Filtros e ordenação
  const filtered = users
    .filter(u => {
      if (filter === 'all')          return true
      if (filter === 'risk')         return calcHealthScore(u) < 40 || u.status === 'inadimplente'
      if (filter === 'nunca_usou')   return (u.osCount || 0) === 0
      if (filter === 'google')       return u.signupMethod === 'google'
      if (filter === 'sem_wpp')      return !u.whatsapp
      if (filter === 'pesquisando')  return u.cargo === 'pesquisando'
      if (filter === 'qualificado')  return u.tipoOficina && u.whatsapp && u.cargo && u.cargo !== 'pesquisando'
      if (filter === 'sem_qualif')   return !u.tipoOficina || !u.cargo
      if (filter === 'parceiro')     return hasAffiliate(u)
      return u.status === filter
    })
    .filter(u => !query ||
      u.oficina?.toLowerCase().includes(query.toLowerCase()) ||
      u.responsavel?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'health')      return calcHealthScore(b) - calcHealthScore(a)
      if (sortBy === 'name')        return (a.oficina || '').localeCompare(b.oficina || '')
      if (sortBy === 'status')      return a.status.localeCompare(b.status)
      if (sortBy === 'os_desc')     return (b.osCount || 0) - (a.osCount || 0)
      if (sortBy === 'os_asc')      return (a.osCount || 0) - (b.osCount || 0)
      if (sortBy === 'last_seen')   return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0)
      if (sortBy === 'trial_end')   return new Date(a.trialEnd || 0) - new Date(b.trialEnd || 0)
      return new Date(b.createdAt) - new Date(a.createdAt) // date
    })

  const allSelected      = filtered.length > 0 && filtered.every(u => selected.has(u.id))
  const someSelected     = !allSelected && filtered.some(u => selected.has(u.id))
  const toggleSelectAll  = () => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(u => u.id)))

  const counts = {
    all:         users.length,
    active:      users.filter(u => u.status === 'active').length,
    trial:       users.filter(u => u.status === 'trial').length,
    inadimplente:users.filter(u => u.status === 'inadimplente').length,
    cancelado:   users.filter(u => u.status === 'cancelado').length,
    risk:        users.filter(u => calcHealthScore(u) < 40).length,
    nunca_usou:  users.filter(u => (u.osCount || 0) === 0).length,
    google:      users.filter(u => u.signupMethod === 'google').length,
    sem_wpp:     users.filter(u => !u.whatsapp).length,
    pesquisando: users.filter(u => u.cargo === 'pesquisando').length,
    qualificado: users.filter(u => u.tipoOficina && u.whatsapp && u.cargo && u.cargo !== 'pesquisando').length,
    sem_qualif:  users.filter(u => !u.tipoOficina || !u.cargo).length,
    parceiro:    users.filter(hasAffiliate).length,
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
            <option value="last_seen">Último acesso</option>
            <option value="os_desc">Mais OS</option>
            <option value="os_asc">Menos OS</option>
            <option value="health">Health score</option>
            <option value="trial_end">Trial expirando</option>
            <option value="name">Nome A-Z</option>
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

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: 'all',          label: `Todos (${counts.all})`,              style: 'normal' },
          { key: 'active',       label: `Ativos (${counts.active})`,          style: 'normal' },
          { key: 'trial',        label: `Trial (${counts.trial})`,            style: 'normal' },
          { key: 'inadimplente', label: `Inadimp. (${counts.inadimplente})`,  style: 'normal' },
          { key: 'cancelado',    label: `Cancelados (${counts.cancelado})`,   style: 'normal' },
          { key: 'risk',         label: `Em risco (${counts.risk})`,          style: 'alert'  },
          { key: 'nunca_usou',   label: `Nunca usou (${counts.nunca_usou})`,  style: 'warn'   },
          { key: 'google',       label: `Google (${counts.google})`,            style: 'normal' },
          { key: 'sem_wpp',      label: `Sem WhatsApp (${counts.sem_wpp})`,   style: 'warn'   },
          { key: 'qualificado',  label: `✅ Qualificados (${counts.qualificado})`, style: 'normal' },
          { key: 'parceiro',     label: `↗ De parceiro (${counts.parceiro})`,   style: 'normal' },
          { key: 'pesquisando',  label: `🔍 Pesquisando (${counts.pesquisando})`, style: 'warn' },
          { key: 'sem_qualif',   label: `Sem qualificação (${counts.sem_qualif})`, style: 'warn' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.key
                ? f.style === 'alert' ? 'bg-red-600 text-white'
                : f.style === 'warn'  ? 'bg-amber-500 text-white'
                : 'bg-indigo-600 text-white'
                : f.style === 'alert' ? 'bg-red-50 text-red-600 border border-red-100'
                : f.style === 'warn'  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-white text-slate-600 border border-gray-200'
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
        <>
          {/* Select-all header */}
          <div className="flex items-center justify-between px-2">
            <button onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors py-1">
              {allSelected
                ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                : someSelected
                ? <CheckSquare className="w-3.5 h-3.5 text-indigo-300" />
                : <Square className="w-3.5 h-3.5" />}
              {allSelected
                ? 'Desmarcar todos'
                : `Selecionar todos (${filtered.length})`}
            </button>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Limpar seleção
              </button>
            )}
          </div>

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
                selected.has(u.id) ? 'border-indigo-300 ring-1 ring-indigo-200'
                : health < 30 ? 'border-red-100' : isExpanded ? 'border-indigo-200' : 'border-gray-100'
              }`}>
                {/* Row principal */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleSelect(u.id) }}
                    className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                      selected.has(u.id) ? 'text-indigo-600' : 'text-slate-200 hover:text-slate-400'
                    }`}
                    aria-label={selected.has(u.id) ? 'Desmarcar cliente' : 'Selecionar cliente'}
                  >
                    {selected.has(u.id)
                      ? <CheckSquare className="w-4 h-4" />
                      : <Square className="w-4 h-4" />}
                  </button>

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
                      {u.signupMethod === 'google'
                        ? <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/></svg>
                            Google
                          </span>
                        : <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">Formulário</span>
                      }
                      {u.tipoOficina && TIPO_CONFIG[u.tipoOficina] && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
                          {TIPO_CONFIG[u.tipoOficina].emoji} {TIPO_CONFIG[u.tipoOficina].label}
                        </span>
                      )}
                      {u.cargo && CARGO_CONFIG[u.cargo] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${CARGO_CONFIG[u.cargo].color}`}>
                          {CARGO_CONFIG[u.cargo].emoji} {CARGO_CONFIG[u.cargo].label}
                        </span>
                      )}
                      {partnerOf(u) && (
                        <span className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold"
                          title={`Veio do parceiro: ${partnerOf(u)}`}>
                          ↗ {partnerOf(u)}
                        </span>
                      )}
                      {u.isAdmin && <Shield className="w-3 h-3 text-amber-500" />}
                      {u.notasAdmin && <StickyNote className="w-3 h-3 text-amber-400" title="Tem notas" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</p>
                  </div>

                  {/* OS count */}
                  <div className="hidden sm:flex flex-col items-center shrink-0">
                    <span className={`text-base font-extrabold leading-none ${
                      (u.osCount || 0) === 0 ? 'text-red-400' :
                      (u.osCount || 0) < 3   ? 'text-amber-500' : 'text-emerald-600'
                    }`}>{u.osCount || 0}</span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">OS</span>
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
                    {(u.status === 'inactive' || u.status === 'rejected' || u.status === 'cancelado' || u.status === 'inadimplente') && (
                      <button onClick={() => activate(u.id)}
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

                    {/* Origem de parceiro */}
                    {partnerOf(u) && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Origem:</span>
                        <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                          ↗ Parceiro {partnerOf(u)}
                        </span>
                        {u.affiliateCoupon && <span className="text-slate-400">cupom {u.affiliateCoupon}</span>}
                      </div>
                    )}

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
                      {u.status === 'trial' && (
                        <>
                          <button onClick={() => activate(u.id, 'monthly')} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100">Ativar Mensal</button>
                          <button onClick={() => activate(u.id, 'annual')}  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100">Ativar Anual</button>
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
        </>
      )}

      <p className="text-xs text-slate-400 text-center">{filtered.length} de {users.length} clientes</p>

      <BulkBar
        count={selected.size}
        progress={bulkProgress}
        onActivateMonthly={() => bulkActivate('monthly')}
        onActivateAnnual={() => bulkActivate('annual')}
        onDeactivate={bulkDeactivate}
        onDelete={bulkDelete}
        onExportCSV={() => exportCSV(users.filter(u => selected.has(u.id)))}
        onClear={() => setSelected(new Set())}
      />
    </div>
  )
}

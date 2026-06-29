import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Search, Users, DollarSign, Check, Clock, X,
  Edit2, ExternalLink, Copy, UserCheck, CreditCard,
  FileText, TrendingUp, AlertCircle, Trash2, Archive, Layers
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────
const STATUS_BADGE = {
  active:  { label: 'Ativo',    cls: 'bg-emerald-100 text-emerald-700' },
  paused:  { label: 'Pausado',  cls: 'bg-amber-100 text-amber-700' },
  pending: { label: 'Pendente', cls: 'bg-slate-100 text-slate-600' },
}

const COMM_BADGE = {
  pending:  { label: 'Pendente',  cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprovada',  cls: 'bg-blue-100 text-blue-700' },
  paid:     { label: 'Paga',      cls: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
}

const EVENT_BADGE = {
  click:     { label: 'Clique',     cls: 'bg-slate-100 text-slate-600' },
  lead:      { label: 'Lead',       cls: 'bg-blue-100 text-blue-700' },
  signup:    { label: 'Cadastro',   cls: 'bg-indigo-100 text-indigo-700' },
  trial:     { label: 'Trial',      cls: 'bg-purple-100 text-purple-700' },
  converted: { label: 'Convertido', cls: 'bg-emerald-100 text-emerald-700' },
  churned:   { label: 'Cancelou',   cls: 'bg-red-100 text-red-700' },
}

const TIPO_LABEL = {
  influencer: 'Influencer',
  empresa:    'Empresa',
  parceiro:   'Parceiro',
  vendedor:   'Vendedor',
}

const PIX_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

function fmt(n) {
  return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const palette = {
    indigo:  'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-700',
    slate:   'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

// ── Edit partner modal ────────────────────────────────────────
function EditPartnerModal({ partner, onClose, onSaved }) {
  const [form, setForm] = useState({
    status:               partner.status,
    pix_key:              partner.pix_key || '',
    pix_type:             partner.pix_type || '',
    commission_type:      partner.commission_type || 'tiered',
    commission_custom_pct: partner.commission_custom_pct ?? '',
    notes:                partner.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setLoading(true); setErro('')
    const { error } = await supabase
      .from('affiliate_partners')
      .update({
        status:               form.status,
        pix_key:              form.pix_key  || null,
        pix_type:             form.pix_type || null,
        commission_type:      form.commission_type,
        commission_custom_pct:
          form.commission_type === 'custom'
            ? Number(form.commission_custom_pct) || null
            : null,
        notes:      form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id)
    setLoading(false)
    if (error) { setErro(error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Editar parceiro</h3>
            <p className="text-xs text-slate-500">{partner.nome} · @{partner.slug}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="pending">Pendente</option>
            </select>
          </div>

          {/* PIX */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de PIX</label>
              <select value={form.pix_type} onChange={e => set('pix_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Selecione</option>
                {PIX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chave PIX</label>
              <input value={form.pix_key} onChange={e => set('pix_key', e.target.value)}
                placeholder="Chave PIX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Comissão */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de comissão</label>
            <select value={form.commission_type} onChange={e => set('commission_type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="tiered">Escalonada (20 / 25 / 30%)</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>

          {form.commission_type === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Percentual personalizado (%)</label>
              <input type="number" min="1" max="50"
                value={form.commission_custom_pct}
                onChange={e => set('commission_custom_pct', e.target.value)}
                placeholder="Ex: 15"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          )}

          {/* Notas internas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notas internas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder="Observações sobre este parceiro…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Partner detail modal (comissões + eventos) ────────────────
function PartnerDetailModal({ partner, onClose, onReload }) {
  const [tab, setTab]             = useState('commissions')
  const [events, setEvents]       = useState([])
  const [commissions, setCommissions] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [approving, setApproving] = useState(null) // id | 'all'

  useEffect(() => {
    // Clientes atribuídos: por partner_id (convertidos) ou por ref/cupom (trials)
    const orParts = [`affiliate_partner_id.eq.${partner.id}`]
    if (partner.slug)        orParts.push(`affiliate_ref.eq.${partner.slug}`)
    if (partner.coupon_code) orParts.push(`affiliate_coupon.eq.${partner.coupon_code}`)

    Promise.all([
      supabase
        .from('affiliate_events')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, oficina, responsavel, email, status, created_at, affiliate_partner_id')
        .or(orParts.join(','))
        .order('created_at', { ascending: false }),
    ]).then(([ev, cm, cu]) => {
      setEvents(ev.data || [])
      setCommissions(cm.data || [])
      setCustomers(cu.data || [])
      setLoading(false)
    })
  }, [partner.id])

  const approveOne = async (id) => {
    setApproving(id)
    await supabase.from('affiliate_commissions').update({
      status:      'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', id)
    setCommissions(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'approved', approved_at: new Date().toISOString() } : c
    ))
    setApproving(null)
    onReload()
  }

  const approveAll = async () => {
    const pending = commissions.filter(c => c.status === 'pending')
    if (!pending.length) return
    setApproving('all')
    const ids = pending.map(c => c.id)
    const now  = new Date().toISOString()
    await supabase.from('affiliate_commissions')
      .update({ status: 'approved', approved_at: now })
      .in('id', ids)
    setCommissions(prev => prev.map(c =>
      ids.includes(c.id) ? { ...c, status: 'approved', approved_at: now } : c
    ))
    setApproving(null)
    onReload()
  }

  const pendingComms   = commissions.filter(c => c.status === 'pending')
  const pendingTotal   = pendingComms.reduce((s, c) => s + Number(c.amount), 0)
  const approvedTotal  = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0)
  const paidTotal      = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{partner.nome}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-xs text-indigo-600">boxcerto.com/box/{partner.slug}</span>
              {partner.coupon_code && (
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {partner.coupon_code}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[partner.status]?.cls || ''}`}>
                {STATUS_BADGE[partner.status]?.label || partner.status}
              </span>
            </div>
            {partner.pix_key && (
              <p className="text-xs text-slate-400 mt-1">PIX ({partner.pix_type}): {partner.pix_key}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 shrink-0 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mini totais */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="py-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pendente</p>
            <p className="text-sm font-bold text-amber-600">{fmt(pendingTotal)}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Aprovado</p>
            <p className="text-sm font-bold text-blue-600">{fmt(approvedTotal)}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pago</p>
            <p className="text-sm font-bold text-emerald-600">{fmt(paidTotal)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[['commissions', 'Comissões'], ['clientes', 'Clientes'], ['events', 'Eventos']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {l}
              {k === 'commissions' && pendingComms.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingComms.length}
                </span>
              )}
              {k === 'clientes' && customers.length > 0 && (
                <span className="ml-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {customers.length}
                </span>
              )}
            </button>
          ))}

          {/* Aprovar todas — só aparece na aba comissões com pendentes */}
          {tab === 'commissions' && pendingComms.length > 1 && (
            <button onClick={approveAll} disabled={approving === 'all'}
              className="ml-auto mr-4 my-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
              {approving === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Aprovar todas ({pendingComms.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : tab === 'commissions' ? (
            commissions.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">Nenhuma comissão ainda.</p>
            ) : (
              <div className="space-y-2">
                {commissions.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">
                          {c.type === 'entry' ? 'Entrada' : `Mensal ${c.reference_month || ''}`}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${COMM_BADGE[c.status]?.cls || ''}`}>
                          {COMM_BADGE[c.status]?.label || c.status}
                        </span>
                        {c.tier_applied && (
                          <span className="text-[10px] text-slate-400">{c.tier_applied}%</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {c.customer_email || '—'} · {fmtDate(c.created_at)}
                        {c.approved_at && ` · aprov. ${fmtDate(c.approved_at)}`}
                        {c.paid_at && ` · pago ${fmtDate(c.paid_at)}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 shrink-0">{fmt(c.amount)}</p>
                    {c.status === 'pending' && (
                      <button
                        onClick={() => approveOne(c.id)}
                        disabled={!!approving}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                        {approving === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Aprovar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : tab === 'clientes' ? (
            customers.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">Nenhum cliente atribuído a este parceiro ainda.</p>
            ) : (
              <div className="space-y-2">
                {customers.map(cu => (
                  <div key={cu.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{cu.oficina || cu.responsavel || cu.email || '—'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{cu.email || '—'} · {fmtDate(cu.created_at)}</p>
                    </div>
                    {cu.affiliate_partner_id
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">pagante</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">trial</span>}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{cu.status}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            events.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">Nenhum evento registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => {
                  const badge = EVENT_BADGE[ev.event_type] || { label: ev.event_type, cls: 'bg-slate-100 text-slate-600' }
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <p className="text-xs text-slate-600 flex-1 truncate">
                        {ev.user_email || '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 shrink-0">
                        {fmtDate(ev.created_at)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Afiliados() {
  const [partners, setPartners]       = useState([])
  const [commissions, setCommissions] = useState([])
  const [batches, setBatches]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [mainTab, setMainTab]         = useState('parceiros') // 'parceiros' | 'pagamentos'
  const [busca, setBusca]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editModal, setEditModal]     = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [copied, setCopied]           = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchMsg, setBatchMsg]       = useState(null) // { ok, text }
  const [confirmDelete, setConfirmDelete] = useState(null) // partner object
  const [deleting, setDeleting]           = useState(false)
  const [markingPaid, setMarkingPaid]     = useState(null) // batch id

  const load = useCallback(async () => {
    const [{ data: pData }, { data: cData }, { data: bData }] = await Promise.all([
      supabase
        .from('affiliate_partners')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_commissions')
        .select('partner_id, amount, status, type'),
      supabase
        .from('affiliate_payment_batches')
        .select('*')
        .order('created_at', { ascending: false }),
    ])
    setPartners(pData || [])
    setCommissions(cData || [])
    setBatches(bData || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Aggregation helper ────────────────────────────────────
  const statsFor = (partnerId) => {
    const c = commissions.filter(c => c.partner_id === partnerId)
    return {
      conversions:   c.filter(x => x.type === 'entry').length,
      pendingTotal:  c.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.amount), 0),
      approvedTotal: c.filter(x => x.status === 'approved').reduce((s, x) => s + Number(x.amount), 0),
      paidTotal:     c.filter(x => x.status === 'paid').reduce((s, x) => s + Number(x.amount), 0),
    }
  }

  const totalPending  = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0)
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0)
  const totalPaid     = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0)

  // ── Filter ────────────────────────────────────────────────
  const filtered = partners.filter(p => {
    const term = busca.toLowerCase()
    const ok   = !busca ||
      p.nome?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.slug?.toLowerCase().includes(term) ||
      (p.coupon_code || '').toLowerCase().includes(term)
    return ok && (statusFilter === 'all' || p.status === statusFilter)
  })

  // ── Copy helper ───────────────────────────────────────────
  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  // ── Excluir parceiro ──────────────────────────────────────
  const deletePartner = async (partner) => {
    setDeleting(true)
    const { error } = await supabase
      .from('affiliate_partners')
      .delete()
      .eq('id', partner.id)
    setDeleting(false)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setConfirmDelete(null)
    load()
  }

  // ── Gerar lote de pagamento ───────────────────────────────
  const gerarLote = async () => {
    setBatchLoading(true)
    setBatchMsg(null)
    try {
      const { data: approved } = await supabase
        .from('affiliate_commissions')
        .select('id, partner_id, amount')
        .eq('status', 'approved')

      if (!approved || approved.length === 0) {
        setBatchMsg({ ok: false, text: 'Nenhuma comissão aprovada para pagamento.' })
        setBatchLoading(false)
        return
      }

      const total      = approved.reduce((s, c) => s + Number(c.amount), 0)
      const partnerIds = [...new Set(approved.map(c => c.partner_id))]
      const refMonth   = new Date().toISOString().slice(0, 7)

      const { data: batch, error: bErr } = await supabase
        .from('affiliate_payment_batches')
        .insert({
          reference_month:  refMonth,
          total_amount:     total,
          affiliates_count: partnerIds.length,
          status:           'open',
        })
        .select()
        .single()

      if (bErr) throw new Error(bErr.message)

      await supabase
        .from('affiliate_commissions')
        .update({
          payment_batch_id: batch.id,
          status:           'paid',
          paid_at:          new Date().toISOString(),
        })
        .in('id', approved.map(c => c.id))

      setBatchMsg({
        ok:   true,
        text: `✅ Lote gerado! ${fmt(total)} para ${partnerIds.length} parceiro(s). Lote ID: ${batch.id.slice(0, 8)}…`,
      })

      // Notifica cada parceiro sobre o pagamento (fire-and-forget)
      const amtByPartner = {}
      for (const c of approved) {
        amtByPartner[c.partner_id] = (amtByPartner[c.partner_id] || 0) + Number(c.amount)
      }
      const { data: { session } } = await supabase.auth.getSession()
      for (const [pid, amt] of Object.entries(amtByPartner)) {
        const p = partners.find(x => x.id === pid)
        if (!p?.email) continue
        fetch('/api/send-email', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type:    'affiliate_payment_sent',
            to:      p.email,
            nome:    p.nome,
            amount:  amt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            pix_key: p.pix_key || null,
          }),
        }).catch(e => console.warn('[Afiliados] Email pagamento erro:', e.message))
      }

      load()
    } catch (e) {
      setBatchMsg({ ok: false, text: `❌ Erro: ${e.message}` })
    }
    setBatchLoading(false)
  }

  // ── Marcar lote como pago ─────────────────────────────────
  const markBatchPaid = async (batch) => {
    if (!window.confirm(`Marcar lote ${batch.reference_month} (${fmt(batch.total_amount)}) como PAGO? Esta ação confirma que os PIX foram realizados.`)) return
    setMarkingPaid(batch.id)
    const { error } = await supabase
      .from('affiliate_payment_batches')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', batch.id)
    setMarkingPaid(null)
    if (error) { alert(`Erro: ${error.message}`); return }
    load()
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">

      {/* Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">Afiliados &amp; Parceiros</h2>
          <p className="text-sm text-slate-500">Gerencie parceiros, comissões e pagamentos via PIX</p>
        </div>
        <button
          onClick={gerarLote}
          disabled={batchLoading || totalApproved === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0">
          {batchLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CreditCard className="w-4 h-4" />}
          Gerar lote de pagamento
          {totalApproved > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{fmt(totalApproved)}</span>
          )}
        </button>
      </div>

      {/* Batch message ──────────────────────────────────── */}
      {batchMsg && (
        <div className={`mb-5 flex items-start gap-2 p-4 rounded-xl border text-sm
          ${batchMsg.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="flex-1">{batchMsg.text}</span>
          <button onClick={() => setBatchMsg(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}      label="Total parceiros"  value={partners.length}                               color="indigo"  />
        <StatCard icon={UserCheck}  label="Ativos"           value={partners.filter(p => p.status === 'active').length} color="emerald" />
        <StatCard icon={Clock}      label="Pend. aprovação"  value={fmt(totalPending)}                             color="amber"   />
        <StatCard icon={DollarSign} label="Aprovado p/ pagar" value={fmt(totalApproved)}                          color="slate"   />
      </div>

      {/* Tabs ───────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-5">
        {[
          { key: 'parceiros',  label: 'Parceiros',  Icon: Users   },
          { key: 'pagamentos', label: 'Histórico de pagamentos', Icon: Archive },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMainTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
              ${mainTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />
            {label}
            {key === 'pagamentos' && batches.filter(b => b.status === 'open').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {batches.filter(b => b.status === 'open').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── PAGAMENTOS tab ─────────────────────────────── */}
      {mainTab === 'pagamentos' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum lote de pagamento gerado ainda.</p>
              <p className="text-xs mt-1">Clique em "Gerar lote de pagamento" quando houver comissões aprovadas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Lote / ID', 'Mês ref.', 'Parceiros', 'Total', 'Status', 'Criado em', 'Ações'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batches.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-500">{b.id.slice(0, 8)}…</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-slate-800">{b.reference_month || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {b.affiliates_count ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-900">{fmt(b.total_amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'paid' ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              ✓ Pago
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                              Aguardando PIX
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {fmtDate(b.created_at)}
                          {b.paid_at && (
                            <span className="block text-emerald-600">pago {fmtDate(b.paid_at)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'open' && (
                            <button
                              onClick={() => markBatchPaid(b)}
                              disabled={markingPaid === b.id}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                              {markingPaid === b.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />}
                              Confirmar pagamento
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-slate-400">
                  {batches.length} lote{batches.length !== 1 ? 's' : ''} ·
                  total histórico pago:{' '}
                  <span className="font-semibold text-slate-600">
                    {fmt(batches.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0))}
                  </span>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PARCEIROS tab ──────────────────────────────── */}
      {mainTab === 'parceiros' && (<>

      {/* Filters ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, email, slug ou cupom…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="paused">Pausados</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      {/* Table ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {busca || statusFilter !== 'all'
              ? 'Nenhum parceiro encontrado com esses filtros.'
              : 'Nenhum parceiro cadastrado ainda.'}
          </p>
          {!busca && statusFilter === 'all' && (
            <p className="text-xs mt-1">
              Parceiros se cadastram em{' '}
              <a href="/parceiro" target="_blank" className="text-indigo-500 hover:underline font-mono">
                /parceiro
              </a>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Parceiro', 'Tipo', 'Cupom / Link', 'PIX', 'Comissões', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const st   = statsFor(p.id)
                  const link = `${window.location.origin}/box/${p.slug}`
                  const sb   = STATUS_BADGE[p.status]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">

                      {/* Parceiro */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{p.nome}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.email}</p>
                        {p.whatsapp && <p className="text-xs text-green-600 mt-0.5">{p.whatsapp}</p>}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {TIPO_LABEL[p.tipo] || p.tipo}
                        </span>
                      </td>

                      {/* Cupom / Link */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {p.coupon_code && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs font-bold text-indigo-600">{p.coupon_code}</span>
                              <button
                                onClick={() => copyText(p.coupon_code, `cpn-${p.id}`)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600">
                                {copied === `cpn-${p.id}`
                                  ? <Check className="w-3 h-3 text-emerald-600" />
                                  : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-slate-400">/{p.slug}</span>
                            <button
                              onClick={() => copyText(link, `lnk-${p.id}`)}
                              className="p-0.5 text-slate-400 hover:text-indigo-600">
                              {copied === `lnk-${p.id}`
                                ? <Check className="w-3 h-3 text-emerald-600" />
                                : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* PIX */}
                      <td className="px-4 py-3">
                        {p.pix_key ? (
                          <div>
                            <p className="text-xs font-mono text-slate-700 truncate max-w-[130px]">{p.pix_key}</p>
                            <p className="text-[10px] text-slate-400">{p.pix_type}</p>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                            <AlertCircle className="w-3 h-3" /> Sem PIX
                          </span>
                        )}
                      </td>

                      {/* Comissões */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 min-w-[90px]">
                          {st.conversions > 0 && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold">{st.conversions}</span> conversão{st.conversions !== 1 ? 'ões' : ''}
                            </p>
                          )}
                          {st.pendingTotal > 0 && (
                            <p className="text-xs font-semibold text-amber-600">{fmt(st.pendingTotal)} pend.</p>
                          )}
                          {st.approvedTotal > 0 && (
                            <p className="text-xs text-blue-600">{fmt(st.approvedTotal)} aprov.</p>
                          )}
                          {st.paidTotal > 0 && (
                            <p className="text-xs text-emerald-600">{fmt(st.paidTotal)} pago</p>
                          )}
                          {st.conversions === 0 && st.pendingTotal === 0 && st.approvedTotal === 0 && st.paidTotal === 0 && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sb?.cls || 'bg-slate-100 text-slate-600'}`}>
                          {sb?.label || p.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailModal(p)}
                            title="Ver comissões e eventos"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditModal(p)}
                            title="Editar parceiro"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`/box/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir página do parceiro"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setConfirmDelete(p)}
                            title="Excluir parceiro"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-slate-400">
              {filtered.length} parceiro{filtered.length !== 1 ? 's' : ''} · total pago até hoje:{' '}
              <span className="font-semibold text-slate-600">{fmt(totalPaid)}</span>
            </p>
          </div>
        </div>
      )}

      </>)} {/* end parceiros tab */}

      {/* Modals */}
      {editModal && (
        <EditPartnerModal
          partner={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); load() }}
        />
      )}
      {detailModal && (
        <PartnerDetailModal
          partner={detailModal}
          onClose={() => setDetailModal(null)}
          onReload={load}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (() => {
        const hasComms = commissions.some(c => c.partner_id === confirmDelete.id)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir parceiro?</h3>
                  <p className="text-xs text-slate-500">{confirmDelete.nome}</p>
                </div>
              </div>

              {hasComms ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-red-700 font-semibold mb-1">⚠️ Atenção: este parceiro tem comissões registradas.</p>
                  <p className="text-xs text-red-600">Excluir apagará permanentemente o parceiro e todas as suas comissões e eventos. Isso não pode ser desfeito.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 mb-4">
                  Esta ação é permanente e não pode ser desfeita. Todos os dados deste parceiro serão removidos.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
                  Cancelar
                </button>
                <button
                  onClick={() => deletePartner(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

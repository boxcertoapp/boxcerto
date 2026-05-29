// ============================================================
// ParceiroDashboard — Área privada do parceiro/afiliado
// Rota: /parceiro/dashboard
// Auth: magic link via email → access_token em localStorage
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Loader2, Copy, Check, LogOut, DollarSign, Users,
  TrendingUp, Clock, Edit2, X, Save, Wrench, ChevronRight,
  ExternalLink, AlertCircle, Mail
} from 'lucide-react'

// ── Constantes ───────────────────────────────────────────────
const SESSION_KEY = 'boxcerto_aff_session' // localStorage key
const PIX_TYPES   = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!s || !s.exp || Date.now() > s.exp) return null
    return s
  } catch { return null }
}

function saveSession(data, accessToken, exp) {
  const payload = { ...data, accessToken, exp: new Date(exp).getTime() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  return payload
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function tierLabel(tier) {
  if (tier >= 30) return { label: 'Ouro', emoji: '🥇', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
  if (tier >= 25) return { label: 'Prata', emoji: '🥈', color: 'text-slate-600 bg-slate-100 border-slate-200' }
  return            { label: 'Bronze', emoji: '🥉', color: 'text-amber-700 bg-amber-50 border-amber-200' }
}

function nextTier(activeRefs) {
  if (activeRefs >= 21) return null
  if (activeRefs >= 11) return { need: 21 - activeRefs, pct: 30 }
  return                        { need: 11 - activeRefs, pct: 25 }
}

const COMM_BADGE = {
  pending:  { label: 'Pendente',  cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprovada',  cls: 'bg-blue-100 text-blue-700' },
  paid:     { label: 'Paga',      cls: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
}

// ── Sub-componentes ──────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const palette = {
    indigo:  'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-700',
    slate:   'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${palette[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
        <p className={`text-sm text-slate-800 truncate ${mono ? 'font-mono' : 'font-semibold'}`}>{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
        {copied
          ? <Check className="w-4 h-4 text-emerald-600" />
          : <Copy className="w-4 h-4 text-slate-400" />}
      </button>
    </div>
  )
}

// ── PIX edit modal ───────────────────────────────────────────
function PixModal({ current, onSave, onClose }) {
  const [pixKey,  setPixKey]  = useState(current?.pix_key  || '')
  const [pixType, setPixType] = useState(current?.pix_type || '')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

  const save = async () => {
    if (!pixKey.trim())          { setErro('Informe a chave PIX.'); return }
    if (!PIX_TYPES.includes(pixType)) { setErro('Selecione o tipo de PIX.'); return }
    setLoading(true); setErro('')
    try {
      const res  = await fetch('/api/affiliate-update-pix', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          partner_id:   current.id,
          access_token: current.accessToken,
          pix_key:      pixKey.trim(),
          pix_type:     pixType,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar.')
      onSave(pixKey.trim(), pixType)
      onClose()
    } catch (e) { setErro(e.message) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900">Chave PIX para recebimento</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de chave</label>
            <select value={pixType} onChange={e => setPixType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">Selecione o tipo</option>
              {PIX_TYPES.map(t => (
                <option key={t} value={t}>
                  {t === 'cpf' ? 'CPF' : t === 'cnpj' ? 'CNPJ' : t === 'email' ? 'E-mail' : t === 'telefone' ? 'Telefone' : 'Chave aleatória'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Chave PIX</label>
            <input value={pixKey} onChange={e => setPixKey(e.target.value)}
              placeholder="Ex: 123.456.789-00"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>
        {erro && <p className="text-red-500 text-xs mt-3">{erro}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-600 font-medium hover:bg-gray-50">Cancelar</button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar PIX
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Login screen ──────────────────────────────────────────────
function LoginScreen({ onEmailSent }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [erro,    setErro]    = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setErro('Digite seu e-mail.'); return }
    setLoading(true); setErro('')
    try {
      const res  = await fetch('/api/affiliate-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar.')
      setSent(true)
      if (onEmailSent) onEmailSent(email.trim())
    } catch (e) { setErro(e.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Área do Parceiro</h1>
          <p className="text-slate-500 text-sm mt-1">BoxCerto · Programa de parceiros</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Verifique seu e-mail</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Enviamos um link de acesso para<br />
                <strong className="text-slate-700">{email}</strong>
              </p>
              <p className="text-xs text-slate-400 mb-6">O link expira em 24 horas.</p>
              <button
                onClick={() => setSent(false)}
                className="text-indigo-600 text-sm hover:underline">
                Tentar outro e-mail
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Acesse seu painel</h2>
              <p className="text-slate-500 text-sm mb-6">
                Digite seu e-mail de parceiro e enviaremos um link de acesso.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail de parceiro</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoFocus
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {erro && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-3">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {erro}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Enviar link de acesso
                </button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-6">
                Não é parceiro ainda?{' '}
                <a href="/parceiro" className="text-indigo-600 hover:underline">Cadastre-se aqui</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard view ────────────────────────────────────────────
function Dashboard({ session, onLogout, onRefresh }) {
  const { partner, commissions = [], activeRefs = 0, tier = 20, totals = {} } = session

  const [pixModal,  setPixModal]  = useState(false)
  const [pixKey,    setPixKey]    = useState(partner.pix_key  || '')
  const [pixType,   setPixType]   = useState(partner.pix_type || '')
  const [copied,    setCopied]    = useState(null)

  const appUrl = window.location.origin
  const link   = `${appUrl}/parceiro/${partner.slug}`
  const coupon = partner.coupon_code

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const tInfo   = tierLabel(tier)
  const ntInfo  = nextTier(activeRefs)

  const handlePixSaved = (key, type) => {
    setPixKey(key)
    setPixType(type)
    // Atualiza localStorage
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')
    stored.partner = { ...stored.partner, pix_key: key, pix_type: type }
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {pixModal && (
        <PixModal
          current={{ id: partner.id, accessToken: session.accessToken, pix_key: pixKey, pix_type: pixType }}
          onSave={handlePixSaved}
          onClose={() => setPixModal(false)}
        />
      )}

      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">BoxCerto</span>
            <span className="text-slate-300 text-sm">·</span>
            <span className="text-slate-500 text-sm">Parceiros</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-sm font-medium text-slate-700">{partner.nome}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tInfo.color}`}>
              {tInfo.emoji} {tInfo.label} · {tier}%
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Boas vindas */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {partner.nome.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">
            Aqui você acompanha suas indicações, comissões e recebimentos.
          </p>
        </div>

        {/* Tier progress */}
        {ntInfo && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tInfo.color}`}>
                  {tInfo.emoji} {tInfo.label} — {tier}% de comissão
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Faltam <strong className="text-slate-700">{ntInfo.need} referências ativas</strong> para subir para {ntInfo.pct}% (nível{' '}
                {ntInfo.pct === 30 ? 'Ouro 🥇' : 'Prata 🥈'})
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-indigo-600">{activeRefs}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">refs ativas</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={DollarSign}  label="Total recebido"    value={fmt(totals.paid)}     color="emerald" />
          <StatCard icon={Clock}       label="A receber (dia 5)" value={fmt(totals.approved)} color="indigo"  />
          <StatCard icon={TrendingUp}  label="Pendente aprovação" value={fmt(totals.pending)} color="amber"   />
          <StatCard icon={Users}       label="Refs ativas"        value={activeRefs}           sub={`Tier: ${tier}%`} color="slate" />
        </div>

        {/* Link e cupom */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">🔗 Seu link e cupom de indicação</h2>
          <div className="space-y-3">
            <CopyField label="Link de indicação" value={link} mono />
            {coupon && <CopyField label="Cupom (10% de desconto para o indicado)" value={coupon} mono={false} />}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Compartilhe seu link ou o cupom. Quando alguém se cadastrar, você recebe a comissão automaticamente.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href={`https://api.whatsapp.com/send?text=Olá!%20Use%20meu%20link%20para%20conhecer%20o%20BoxCerto%20e%20ter%2010%25%20de%20desconto%3A%20${encodeURIComponent(link)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Compartilhar no WhatsApp
            </a>
            <a
              href={link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver página de indicação
            </a>
          </div>
        </div>

        {/* Comissões */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">💰 Minhas comissões</h2>
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma comissão ainda.</p>
              <p className="text-xs mt-1">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Tipo', 'Indicado', 'Valor', 'Status', 'Data'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commissions.map(c => {
                    const badge = COMM_BADGE[c.status] || { label: c.status, cls: 'bg-slate-100 text-slate-600' }
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-xs font-medium text-slate-700">
                          {c.type === 'entry' ? 'Entrada' : `Mensal ${c.reference_month || ''}`}
                          {c.tier_applied ? <span className="ml-1 text-slate-400">({c.tier_applied}%)</span> : null}
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500 max-w-[160px] truncate">
                          {c.customer_email || '—'}
                        </td>
                        <td className="py-3 pr-4 text-sm font-bold text-slate-800">{fmt(c.amount)}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-400">{fmtDate(c.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PIX */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">💳 Chave PIX para recebimento</h2>
            <button
              onClick={() => setPixModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
              {pixKey ? 'Alterar' : 'Cadastrar PIX'}
            </button>
          </div>
          {pixKey ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-semibold mb-0.5 uppercase tracking-wide">{pixType}</p>
              <p className="text-sm font-mono font-bold text-emerald-800">{pixKey}</p>
              <p className="text-xs text-emerald-600 mt-1">Pagamentos são realizados todo dia 5 do mês.</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Chave PIX não cadastrada</p>
                <p className="text-xs text-amber-700 mt-0.5">Cadastre sua chave PIX para receber as comissões todo dia 5.</p>
              </div>
            </div>
          )}
        </div>

        {/* Materiais */}
        {partner.materials && partner.materials.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">📦 Materiais de divulgação</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {partner.materials.map((m, i) => (
                <a
                  key={i} href={m.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 group-hover:border-indigo-300">
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{m.title || 'Material'}</p>
                    <p className="text-[10px] text-slate-400">{m.type || 'arquivo'}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          BoxCerto · Programa de Parceiros ·{' '}
          <a href="/parceiro" className="hover:underline">Página pública</a>{' '}·{' '}
          <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="hover:underline">Suporte</a>
        </p>
      </main>
    </div>
  )
}

// ── Tela de verificação do magic link ────────────────────────
function VerifyingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Verificando seu acesso…</p>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function ParceiroDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [state,   setState]   = useState('loading') // loading | login | verifying | dashboard | error
  const [session, setSession] = useState(null)
  const [errMsg,  setErrMsg]  = useState('')

  const applySessionData = useCallback((data, accessToken) => {
    const full = {
      partner:     data.partner,
      commissions: data.commissions || [],
      activeRefs:  data.activeRefs  || 0,
      tier:        data.tier        || 20,
      totals:      data.totals      || {},
      accessToken,
      exp:         data.session_exp ? new Date(data.session_exp).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
    }
    saveSession(full, accessToken, new Date(full.exp))
    setSession(full)
    setState('dashboard')
    // Limpa tokens da URL
    window.history.replaceState({}, '', '/parceiro/dashboard')
  }, [])

  useEffect(() => {
    const magicToken = searchParams.get('t')
    const partnerId  = searchParams.get('pid')

    // 1. Magic link na URL → verifica
    if (magicToken && partnerId) {
      setState('verifying')
      fetch('/api/affiliate-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ magic_token: magicToken, partner_id: partnerId }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.error || 'Link inválido.')
          applySessionData(data, data.access_token)
        })
        .catch(e => {
          setErrMsg(e.message)
          setState('error')
        })
      return
    }

    // 2. Sessão salva em localStorage → carrega dados frescos
    const saved = getSession()
    if (saved?.partner?.id && saved?.accessToken) {
      setState('verifying')
      fetch('/api/affiliate-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ access_token: saved.accessToken, partner_id: saved.partner.id }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) {
            clearSession()
            setState('login')
            return
          }
          applySessionData(data, saved.accessToken)
        })
        .catch(() => {
          // Em caso de erro de rede, usa dados em cache
          setSession(saved)
          setState('dashboard')
        })
      return
    }

    // 3. Sem sessão → tela de login
    setState('login')
  }, [])

  const handleLogout = () => {
    clearSession()
    setState('login')
    setSession(null)
  }

  if (state === 'loading' || state === 'verifying') return <VerifyingScreen />

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Link inválido ou expirado</h2>
          <p className="text-slate-500 text-sm mb-6">{errMsg || 'Solicite um novo link de acesso.'}</p>
          <button
            onClick={() => setState('login')}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
            Solicitar novo acesso
          </button>
        </div>
      </div>
    )
  }

  if (state === 'login') return <LoginScreen />

  if (state === 'dashboard' && session) {
    return <Dashboard session={session} onLogout={handleLogout} />
  }

  return null
}

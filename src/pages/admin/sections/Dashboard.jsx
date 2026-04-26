import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Users, DollarSign, Clock,
  AlertCircle, CheckCircle, Zap, RefreshCw, ArrowRight,
  BellRing, MessageSquare, Bell, Settings
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/storage'

// ── Gráfico SVG de barras simples ────────────────────────────
function BarChart({ data, height = 80 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all hover:opacity-80 cursor-default"
              style={{ height: `${Math.max(pct, 4)}%`, background: d.color || '#6366f1' }}
              title={`${d.label}: R$${d.value}`} />
            <span className="text-[9px] text-slate-400">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Métrica rápida ───────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg, delta, deltaLabel, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white border border-gray-100 rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:border-indigo-200 transition-colors' : ''}`}>
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {deltaLabel || `${Math.abs(delta)}% vs mês anterior`}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ users, loadingUsers, reload, onNavigate }) {
  const [activity, setActivity] = useState([])
  const [mrrHistory, setMrrHistory] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  const now = new Date()
  const in3d  = new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000)
  const in1d  = new Date(now.getTime() + 1  * 24 * 60 * 60 * 1000)
  const ago7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const ativos       = users.filter(u => u.status === 'active')
  const trials       = users.filter(u => u.status === 'trial')
  const inadimpl     = users.filter(u => u.status === 'inadimplente')
  const cancelados   = users.filter(u => ['cancelado', 'inactive'].includes(u.status))
  const novos7d      = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago7)
  const novos30d     = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago30)
  const trialsExp3d  = trials.filter(u => u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)
  const trialsExp1d  = trials.filter(u => u.trialEnd && new Date(u.trialEnd) <= in1d && new Date(u.trialEnd) >= now)

  const mrrMensal = ativos.filter(u => u.plan !== 'annual').length * 47.90
  const mrrAnual  = ativos.filter(u => u.plan === 'annual').length * (418.80 / 12)
  const mrr       = mrrMensal + mrrAnual

  const alertas = [
    ...trialsExp1d.map(u => ({ type: 'critical', msg: `Trial expira HOJE — ${u.oficina || u.email}`, action: 'clientes' })),
    ...inadimpl.map(u => ({ type: 'warning', msg: `Pagamento falhou — ${u.oficina || u.email}`, action: 'clientes' })),
    ...trialsExp3d.filter(u => !trialsExp1d.find(x => x.id === u.id)).map(u => {
      const dias = Math.ceil((new Date(u.trialEnd) - now) / (1000*60*60*24))
      return { type: 'info', msg: `Trial expira em ${dias} dias — ${u.oficina || u.email}`, action: 'clientes' }
    }),
  ]

  useEffect(() => {
    // Carrega histórico de MRR dos snapshots
    const loadMrr = async () => {
      const { data } = await supabase
        .from('mrr_snapshots')
        .select('data, mrr')
        .order('data', { ascending: true })
        .limit(6)
      if (data?.length) {
        // Se temos snapshots reais, usa
        const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        setMrrHistory(data.map(d => ({
          label: labels[new Date(d.data).getMonth()],
          value: parseFloat(d.mrr) || 0,
        })))
      } else {
        // Estimativa baseada em usuários atuais (retroativo fictício)
        setMrrHistory(generateEstimatedHistory(ativos.length, mrr))
      }
    }

    // Carrega atividade recente (últimos cadastros + status changes)
    const loadActivity = async () => {
      setLoadingActivity(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, oficina, email, status, created_at, activated_at, canceled_at')
        .order('created_at', { ascending: false })
        .limit(20)

      const events = []
      ;(data || []).forEach(p => {
        if (p.created_at) events.push({ id: p.id + 'c', type: 'signup',   label: p.oficina || p.email, at: new Date(p.created_at) })
        if (p.activated_at) events.push({ id: p.id + 'a', type: 'active',   label: p.oficina || p.email, at: new Date(p.activated_at) })
        if (p.canceled_at)  events.push({ id: p.id + 'x', type: 'canceled', label: p.oficina || p.email, at: new Date(p.canceled_at) })
      })
      events.sort((a, b) => b.at - a.at)
      setActivity(events.slice(0, 12))
      setLoadingActivity(false)
    }

    loadMrr()
    loadActivity()
  }, [users])

  const timeAgo = (date) => {
    const diff = (now - date) / 1000
    if (diff < 60)    return 'agora'
    if (diff < 3600)  return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800)return `${Math.floor(diff / 86400)}d`
    return formatDate(date)
  }

  const activityConfig = {
    signup:   { dot: 'bg-indigo-500', text: (l) => <><strong>{l}</strong> se cadastrou</> },
    active:   { dot: 'bg-green-500',  text: (l) => <><strong>{l}</strong> assinou ✓</> },
    canceled: { dot: 'bg-red-400',    text: (l) => <><strong>{l}</strong> cancelou</> },
  }

  // Quick actions
  const quickActions = [
    { label: 'Ver clientes em risco', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', action: 'clientes' },
    { label: 'Enviar comunicação', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', action: 'comunicacoes' },
    { label: 'Criar anúncio', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', action: 'anuncios' },
    { label: 'Ver Analytics', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', action: 'analytics' },
  ]

  return (
    <div className="space-y-5">

      {/* Alertas urgentes */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-900">{alertas.length} item{alertas.length !== 1 ? 'ns' : ''} precisando atenção</p>
          </div>
          {alertas.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.type === 'critical' ? 'bg-red-600' : a.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <p className="text-sm text-red-800 flex-1">{a.msg}</p>
              <button onClick={() => onNavigate(a.action)}
                className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-0.5">
                Ver <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard label="MRR" value={`R$${mrr.toFixed(0)}`} sub={`ARR R$${(mrr*12).toFixed(0)}`}
          icon={DollarSign} color="text-indigo-600" bg="bg-indigo-100"
          onClick={() => onNavigate('receita')} />
        <KpiCard label="Assinantes ativos" value={ativos.length}
          sub={`+${novos30d.filter(u=>u.status==='active').length} este mês`}
          icon={CheckCircle} color="text-green-600" bg="bg-green-100" />
        <KpiCard label="Em trial" value={trials.length}
          sub={trialsExp3d.length > 0 ? `${trialsExp3d.length} expira em 3d` : 'Nenhum expirando'}
          icon={Clock} color="text-amber-600" bg="bg-amber-100"
          onClick={() => onNavigate('clientes')} />
        <KpiCard label="Inadimplentes" value={inadimpl.length}
          sub={inadimpl.length > 0 ? `R$${(inadimpl.length * 47.90).toFixed(0)} em risco` : 'Nenhum'}
          icon={AlertCircle} color="text-orange-600" bg="bg-orange-100"
          onClick={() => onNavigate('clientes')} />
        <KpiCard label="Novos (7 dias)" value={novos7d.length}
          icon={Users} color="text-blue-600" bg="bg-blue-100" />
      </div>

      {/* Gráfico + Atividade */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Gráfico MRR */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-800">MRR — últimos meses</p>
            <button onClick={() => onNavigate('receita')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              Detalhes <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">Receita recorrente mensal</p>
          {mrrHistory.length > 0
            ? <BarChart data={mrrHistory} height={90} />
            : <div className="h-20 flex items-center justify-center text-slate-300 text-sm">Sem dados históricos ainda</div>
          }
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <div>
              <p className="text-xs text-slate-400">Mensal</p>
              <p className="text-sm font-bold text-slate-800">R${mrrMensal.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Anual (equiv.)</p>
              <p className="text-sm font-bold text-slate-800">R${mrrAnual.toFixed(0)}</p>
            </div>
            <div className="ml-auto">
              <p className="text-xs text-slate-400">ARR</p>
              <p className="text-sm font-bold text-indigo-600">R${(mrr*12).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Feed de atividade */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Atividade recente</p>
            <button onClick={reload} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          {loadingActivity ? (
            <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma atividade recente.</p>
          ) : (
            <div className="space-y-0">
              {activity.slice(0, 8).map(e => {
                const cfg = activityConfig[e.type] || activityConfig.signup
                return (
                  <div key={e.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <p className="text-xs text-slate-600 flex-1">{cfg.text(e.label)}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(e.at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Distribuição + Ações rápidas */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Distribuição */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Distribuição de usuários</p>
          {[
            { label: 'Ativos',       count: ativos.length,     color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50' },
            { label: 'Trial',        count: trials.length,     color: 'bg-indigo-400', text: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Inadimplente', count: inadimpl.length,   color: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
            { label: 'Cancelados',   count: cancelados.length, color: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50' },
          ].map(s => {
            const pct = users.length > 0 ? Math.round((s.count / users.length) * 100) : 0
            return (
              <div key={s.label} className="mb-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Ações rápidas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Ações rápidas</p>
          <div className="space-y-2">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.action)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <div className={`w-8 h-8 ${a.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
            ))}
          </div>

          {/* Resumo rápido */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-extrabold text-slate-900">{users.length}</p>
              <p className="text-[10px] text-slate-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-green-600">{ativos.length}</p>
              <p className="text-[10px] text-slate-400">Pagantes</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-indigo-600">{trials.length}</p>
              <p className="text-[10px] text-slate-400">Trial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Gera histórico estimado se não houver snapshots ──────────
function generateEstimatedHistory(currentActive, currentMrr) {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun']
  const now = new Date()
  return months.map((label, i) => {
    const factor = 0.6 + (i / months.length) * 0.4
    return { label, value: Math.round(currentMrr * factor), color: i === months.length - 1 ? '#4f46e5' : '#a5b4fc' }
  })
}

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, Clock, AlertCircle, CheckCircle, Brain, Globe, MousePointerClick, ExternalLink } from 'lucide-react'
import { useConfig } from '../../../hooks/useConfig'
import { supabase } from '../../../lib/supabase'

// ── Funil de conversão ───────────────────────────────────────
function FunnelChart({ steps }) {
  const max = steps[0]?.count || 1
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const pct = Math.round((s.count / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 text-xs text-slate-600 text-right shrink-0 font-medium">{s.label}</div>
            <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-3 transition-all duration-700"
                style={{ width: `${Math.max(pct, 4)}%`, background: s.color || '#6366f1' }}>
                <span className="text-white text-xs font-bold">{s.count}</span>
              </div>
            </div>
            <div className="w-10 text-xs font-bold text-right shrink-0" style={{ color: s.color || '#6366f1' }}>{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tabela de cohort por mês ─────────────────────────────────
function CohortTable({ users }) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const cohort = users.filter(u => {
      if (!u.createdAt) return false
      const cd = new Date(u.createdAt)
      return cd >= d && cd <= end
    })
    const ativos = cohort.filter(u => u.status === 'active')
    const trials = cohort.filter(u => u.status === 'trial')
    months.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      total: cohort.length, ativos: ativos.length, trials: trials.length,
      retencao: cohort.length > 0 ? Math.round(((ativos.length + trials.length) / cohort.length) * 100) : 0,
    })
  }
  const getColor = pct => pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {['Mês','Cadastros','Ativos','Trial','Retenção'].map(h => (
              <th key={h} className="py-2 px-2 text-slate-400 font-semibold text-center first:text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              <td className="py-2 px-2 font-semibold text-slate-700">{m.label}</td>
              <td className="py-2 px-2 text-center text-slate-600">{m.total}</td>
              <td className="py-2 px-2 text-center text-green-600 font-semibold">{m.ativos}</td>
              <td className="py-2 px-2 text-center text-indigo-500">{m.trials}</td>
              <td className="py-2 px-2 text-center">
                <span className={`px-2 py-0.5 rounded-full font-bold ${getColor(m.retencao)}`}>{m.retencao}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Auto-insights automáticos ────────────────────────────────
function AIInsights({ users }) {
  const now   = new Date()
  const ago7  = new Date(now.getTime() - 7  * 24 * 3600 * 1000)
  const in3d  = new Date(now.getTime() + 3  * 24 * 3600 * 1000)
  const insights = []

  const semAcesso = users.filter(u => u.status === 'active' && u.lastSeenAt && new Date(u.lastSeenAt) < ago7)
  if (semAcesso.length > 0)
    insights.push({ icon: '⚠️', c: 'bg-amber-50 border-amber-200 text-amber-800',
      text: `${semAcesso.length} assinante${semAcesso.length > 1 ? 's' : ''} ativo${semAcesso.length > 1 ? 's' : ''} sem acesso há 7+ dias — risco de churn.` })

  const trialsExp = users.filter(u => u.status === 'trial' && u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)
  if (trialsExp.length > 0)
    insights.push({ icon: '⏰', c: 'bg-red-50 border-red-200 text-red-800',
      text: `${trialsExp.length} trial${trialsExp.length > 1 ? 's' : ''} expira${trialsExp.length > 1 ? 'm' : ''} em 3 dias — melhor momento para converter.` })

  const novos7d = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago7)
  if (novos7d.length >= 3)
    insights.push({ icon: '🚀', c: 'bg-green-50 border-green-200 text-green-800',
      text: `${novos7d.length} novos cadastros esta semana — ótima tração!` })

  const inadimpl = users.filter(u => u.status === 'inadimplente')
  if (inadimpl.length > 0)
    insights.push({ icon: '💳', c: 'bg-orange-50 border-orange-200 text-orange-800',
      text: `${inadimpl.length} pagamento${inadimpl.length > 1 ? 's' : ''} falhou — R$${(inadimpl.length * pMensal).toFixed(0)} em risco. Entre em contato via WhatsApp.` })

  const ativos  = users.filter(u => u.status === 'active')
  const anuais  = ativos.filter(u => u.plan === 'annual')
  if (ativos.length > 0 && (anuais.length / ativos.length) < 0.3)
    insights.push({ icon: '📈', c: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      text: `Apenas ${Math.round((anuais.length/ativos.length)*100)}% no plano anual. Ofereça desconto para migração e aumente o ARR.` })

  if (insights.length === 0)
    insights.push({ icon: '✅', c: 'bg-green-50 border-green-200 text-green-800', text: 'Tudo sob controle! Nenhum alerta crítico no momento.' })

  return (
    <div className="space-y-2">
      {insights.map((ins, i) => (
        <div key={i} className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${ins.c}`}>
          <span className="text-base flex-shrink-0">{ins.icon}</span>
          <p className="text-sm">{ins.text}</p>
        </div>
      ))}
      <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
        <Brain className="w-3.5 h-3.5" />
        Análise automática baseada nos seus dados. Em breve: insights com IA Anthropic.
      </p>
    </div>
  )
}

// ── Tráfego do site ──────────────────────────────────────
const PAGE_LABELS = {
  '/landing':                      'Landing principal',
  '/sistema-para-oficina-pequena': 'Oficina Pequena',
  '/boxcerto-vs-planilha':         'BoxCerto vs Planilha',
  '/diagnostico':                  'Diagnóstico',
  '/assinar':                      'Página de planos',
  '/cadastro':                     'Cadastro',
}

const DEVICE_ICON  = { mobile: '📱', desktop: '🖥️', tablet: '📟' }
const DEVICE_COLOR = { mobile: 'bg-blue-400', desktop: 'bg-indigo-500', tablet: 'bg-purple-400' }
const BROWSER_COLOR = { Chrome: 'bg-green-400', Safari: 'bg-blue-400', Firefox: 'bg-orange-400', Edge: 'bg-indigo-400', Opera: 'bg-red-400', Outro: 'bg-gray-400' }

function BarraSimples({ label, count, total, color = 'bg-indigo-400', prefix = '' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span className="font-medium truncate">{prefix}{label}</span>
        <span className="shrink-0 ml-2 tabular-nums">{count} <span className="text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TrafegoSite({ users }) {
  const [views, setViews]     = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(7)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const since = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('page_views')
        .select('page, session_id, referrer, device, browser, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      setViews(data || [])
      setLoading(false)
    }
    load()
  }, [periodo])

  const totalVisitas  = views.length
  const sessoesUnicas = new Set(views.map(v => v.session_id)).size

  // Helpers
  const groupBy = (arr, key) => arr.reduce((acc, v) => {
    const k = v[key] || 'Outro'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const toSorted = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])

  const porPagina   = toSorted(groupBy(views, 'page'))
  const porReferrer = toSorted(groupBy(views, 'referrer')).slice(0, 6)
  const porDevice   = toSorted(groupBy(views, 'device'))
  const porBrowser  = toSorted(groupBy(views, 'browser')).slice(0, 4)

  // Taxa de bounce: sessões com apenas 1 visita
  const sessionCounts = views.reduce((acc, v) => { acc[v.session_id] = (acc[v.session_id]||0)+1; return acc }, {})
  const bounces = Object.values(sessionCounts).filter(c => c === 1).length
  const taxaBounce = sessoesUnicas > 0 ? Math.round((bounces / sessoesUnicas) * 100) : 0

  // Pico de horário (hora local do visitante não temos, mas usamos hora do servidor)
  const porHora = Array(24).fill(0)
  views.forEach(v => { porHora[new Date(v.created_at).getHours()]++ })
  const picaHora = porHora.indexOf(Math.max(...porHora))

  // Visitas por dia
  const porDia = []
  for (let i = periodo - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const count = views.filter(v => new Date(v.created_at).toDateString() === d.toDateString()).length
    porDia.push({ label, count })
  }
  const maxDia = Math.max(...porDia.map(d => d.count), 1)

  // Device dos usuários ativos do app
  const ativos = users.filter(u => u.status === 'active' || u.status === 'trial')
  const appDevices = { mobile: 0, desktop: 0, tablet: 0, '—': 0 }
  ativos.forEach(u => {
    const d = u.lastDevice || '—'
    appDevices[d] = (appDevices[d] || 0) + 1
  })
  const appDeviceTotal = ativos.length

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  const SemDados = () => (
    <div className="bg-slate-50 rounded-xl p-8 text-center">
      <Globe className="w-8 h-8 text-slate-200 mx-auto mb-2" />
      <p className="text-sm text-slate-400">Nenhuma visita registrada neste período.</p>
      <p className="text-xs text-slate-300 mt-1">Os dados aparecem aqui assim que visitantes acessarem o site.</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Seletor de período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setPeriodo(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                periodo === d ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-indigo-300'
              }`}>
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {totalVisitas === 0 ? <SemDados /> : <>

        {/* KPIs principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Visitas',          value: totalVisitas,          sub: `${periodo} dias`,               color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Visitantes únicos',value: sessoesUnicas,         sub: 'sessões distintas',             color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Taxa de bounce',   value: `${taxaBounce}%`,      sub: `${bounces} saíram sem navegar`, color: taxaBounce > 70 ? 'text-red-600' : 'text-green-600', bg: taxaBounce > 70 ? 'bg-red-50' : 'bg-green-50' },
            { label: 'Pico de acessos',  value: `${picaHora}h`,        sub: `${porHora[picaHora]} visitas`,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className={`text-2xl font-extrabold ${k.color}`}>{k.value}</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{k.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Gráfico por dia */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Visitas por dia</p>
          <div className="flex items-end gap-1 h-20">
            {porDia.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.count} visitas
                </div>
                <div className="w-full bg-indigo-500 rounded-t-sm"
                  style={{ height: `${Math.max((d.count / maxDia) * 72, d.count > 0 ? 3 : 0)}px` }} />
                {periodo <= 14 && <span className="text-[9px] text-slate-400">{d.label}</span>}
              </div>
            ))}
          </div>
          {periodo > 14 && (
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>{porDia[0].label}</span><span>{porDia[porDia.length-1].label}</span>
            </div>
          )}
        </div>

        {/* Dispositivos + Browser (visitantes do site) */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-slate-800 mb-3">📱 Dispositivo — visitantes do site</p>
            <div className="space-y-2.5">
              {porDevice.map(([dev, count]) => (
                <BarraSimples key={dev} label={dev} count={count} total={totalVisitas}
                  color={DEVICE_COLOR[dev] || 'bg-gray-400'}
                  prefix={DEVICE_ICON[dev] ? DEVICE_ICON[dev] + ' ' : ''} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-slate-800 mb-3">🌐 Browser — visitantes do site</p>
            <div className="space-y-2.5">
              {porBrowser.map(([browser, count]) => (
                <BarraSimples key={browser} label={browser} count={count} total={totalVisitas}
                  color={BROWSER_COLOR[browser] || 'bg-gray-400'} />
              ))}
            </div>
          </div>
        </div>

        {/* Dispositivo dos usuários do APP */}
        {appDeviceTotal > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-slate-800 mb-1">📊 Dispositivo — usuários do app (ativos + trial)</p>
            <p className="text-xs text-slate-400 mb-3">Último device detectado no login de cada usuário</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(appDevices).filter(([k]) => k !== '—').map(([dev, count]) => {
                const pct = appDeviceTotal > 0 ? Math.round((count / appDeviceTotal) * 100) : 0
                return (
                  <div key={dev} className={`rounded-xl p-3 text-center ${dev === 'mobile' ? 'bg-blue-50' : dev === 'desktop' ? 'bg-indigo-50' : 'bg-purple-50'}`}>
                    <p className="text-2xl">{DEVICE_ICON[dev]}</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">{pct}%</p>
                    <p className="text-xs text-slate-500 capitalize">{dev}</p>
                    <p className="text-[10px] text-slate-400">{count} usuários</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Páginas + Referrers */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-indigo-500" /> Páginas mais visitadas
            </p>
            <div className="space-y-2.5">
              {porPagina.map(([page, count]) => (
                <BarraSimples key={page} label={PAGE_LABELS[page] || page} count={count} total={totalVisitas} color="bg-indigo-400" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-green-500" /> Origem dos visitantes
            </p>
            <div className="space-y-2.5">
              {porReferrer.map(([ref, count]) => {
                const color = ref === 'direto' ? 'bg-slate-400' : ref.includes('google') ? 'bg-green-400' : ref.includes('instagram') || ref.includes('facebook') ? 'bg-pink-400' : 'bg-blue-400'
                return <BarraSimples key={ref} label={ref} count={count} total={totalVisitas} color={color} />
              })}
            </div>
          </div>
        </div>

      </>}
    </div>
  )
}

export default function Analytics({ users }) {
  const cfg   = useConfig()
  const now   = new Date()
  const in3d  = new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000)
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ago7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const ativos     = users.filter(u => u.status === 'active')
  const trials     = users.filter(u => u.status === 'trial')
  const cancelados = users.filter(u => ['cancelado', 'inactive'].includes(u.status))
  const inadimpl   = users.filter(u => u.status === 'inadimplente')
  const novos7d    = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago7)
  const novos30d   = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago30)
  const trialsEnd3d = trials.filter(u => u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)

  const pMensal   = parseFloat(cfg.price_monthly) || 97
  const pAnual    = parseFloat(cfg.price_annual)  || 958.80
  const mrrMensal = ativos.filter(u => u.plan !== 'annual').length * pMensal
  const mrrAnual  = ativos.filter(u => u.plan === 'annual').length * (pAnual / 12)
  const mrr = mrrMensal + mrrAnual
  const arr = mrr * 12

  const taxaConversao = users.length > 0 ? ((ativos.length / users.length) * 100).toFixed(1) : '0.0'
  const taxaChurn     = (ativos.length + cancelados.length) > 0
    ? ((cancelados.length / (ativos.length + cancelados.length)) * 100).toFixed(1) : '0.0'
  const taxaInadimpl  = (ativos.length + inadimpl.length) > 0
    ? ((inadimpl.length / (ativos.length + inadimpl.length)) * 100).toFixed(1) : '0.0'
  const ticketMedio = ativos.length > 0 ? (mrr / ativos.length).toFixed(2) : '0.00'

  const usersAtivosOuComOS = users.filter(u => u.osCount > 0 || u.status === 'active')
  const funnelSteps = [
    { label: 'Cadastros',    count: users.length, color: '#6366f1' },
    { label: 'Usaram o app',count: usersAtivosOuComOS.length, color: '#818cf8' },
    { label: 'Em trial',     count: users.filter(u => u.status !== 'pending').length, color: '#a5b4fc' },
    { label: 'Pagantes',     count: ativos.length, color: '#10b981' },
    { label: 'Plano anual',  count: ativos.filter(u => u.plan === 'annual').length, color: '#059669' },
  ]

  const Stat = ({ label, value, sub, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Tráfego do site */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold text-slate-800">Tráfego do site</p>
        </div>
        <TrafegoSite users={users} />
      </div>

      {/* Auto-insights */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold text-slate-800">Auto-insights</p>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold ml-1">Em breve: IA</span>
        </div>
        <AIInsights users={users} />
      </div>

      {/* Receita */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Receita</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="MRR" value={`R$${mrr.toFixed(0)}`} sub={`ARR: R$${arr.toFixed(0)}`} icon={DollarSign} color="text-amber-600" bg="bg-amber-100" />
          <Stat label="Ticket médio" value={`R$${ticketMedio}`} sub="por assinante ativo" icon={TrendingUp} color="text-indigo-600" bg="bg-indigo-100" />
          <Stat label="Planos mensais" value={ativos.filter(u => u.plan !== 'annual').length} sub={`R$${mrrMensal.toFixed(0)}/mês`} icon={RefreshCw} color="text-blue-600" bg="bg-blue-100" />
          <Stat label="Planos anuais" value={ativos.filter(u => u.plan === 'annual').length} sub={`R$${mrrAnual.toFixed(0)}/mês`} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
        </div>
      </div>

      {/* Usuários */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Usuários</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total cadastros" value={users.length} sub={`+${novos30d.length} nos últimos 30 dias`} icon={Users} color="text-slate-600" bg="bg-slate-100" />
          <Stat label="Novos (7 dias)" value={novos7d.length} icon={Users} color="text-indigo-600" bg="bg-indigo-100" />
          <Stat label="Ativos pagantes" value={ativos.length} icon={CheckCircle} color="text-green-600" bg="bg-green-100" />
          <Stat label="Em trial" value={trials.length} sub={`${trialsEnd3d.length} expirando em 3 dias`} icon={Clock} color="text-amber-600" bg="bg-amber-100" />
        </div>
      </div>

      {/* Saúde */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saúde do negócio</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Taxa de conversão" value={`${taxaConversao}%`} sub="cadastros → pagantes" icon={TrendingUp} color="text-green-600" bg="bg-green-100" />
          <Stat label="Taxa de churn" value={`${taxaChurn}%`} sub="cancelamentos" icon={TrendingDown} color="text-red-600" bg="bg-red-100" />
          <Stat label="Inadimplência" value={`${taxaInadimpl}%`} sub={`${inadimpl.length} usuários`} icon={AlertCircle} color="text-orange-600" bg="bg-orange-100" />
          <Stat label="Cancelados" value={cancelados.length} icon={Users} color="text-gray-500" bg="bg-gray-100" />
        </div>
      </div>

      {/* Funil + Cohort */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Funil de conversão</p>
          <p className="text-xs text-slate-400 mb-4">Do cadastro ao assinante anual</p>
          <FunnelChart steps={funnelSteps} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Cohort de retenção</p>
          <p className="text-xs text-slate-400 mb-4">% ativos/trial por mês de cadastro</p>
          <CohortTable users={users} />
        </div>
      </div>

      {/* Distribuição */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Distribuição de usuários</p>
        <div className="space-y-3">
          {[
            { label: 'Ativos',       count: ativos.length,     color: 'bg-green-500' },
            { label: 'Trial',        count: trials.length,     color: 'bg-indigo-400' },
            { label: 'Inadimplente', count: inadimpl.length,   color: 'bg-orange-400' },
            { label: 'Cancelados',   count: cancelados.length, color: 'bg-gray-400' },
          ].map(s => {
            const pct = users.length > 0 ? Math.round((s.count / users.length) * 100) : 0
            return (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{s.label}</span><span>{s.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

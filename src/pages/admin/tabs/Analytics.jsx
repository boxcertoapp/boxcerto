import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, Clock, AlertCircle, CheckCircle, Brain } from 'lucide-react'
import { useConfig } from '../../../hooks/useConfig'

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

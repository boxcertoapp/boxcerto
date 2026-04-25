import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function Analytics({ users }) {
  const now = new Date()
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ago7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  // Segmentos
  const ativos       = users.filter(u => u.status === 'active')
  const trials       = users.filter(u => u.status === 'trial')
  const cancelados   = users.filter(u => ['cancelado', 'inactive'].includes(u.status))
  const inadimpl     = users.filter(u => u.status === 'inadimplente')
  const novos7d      = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago7)
  const novos30d     = users.filter(u => u.createdAt && new Date(u.createdAt) >= ago30)
  const trialsEnd3d  = trials.filter(u => u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)

  // MRR
  const mrrMensal = ativos.filter(u => u.plan !== 'annual').length * 47.90
  const mrrAnual  = ativos.filter(u => u.plan === 'annual').length * (418.80 / 12)
  const mrr       = mrrMensal + mrrAnual
  const arr       = mrr * 12

  // Taxas
  const totalComHistorico = users.length
  const taxaConversao = totalComHistorico > 0
    ? ((ativos.length / totalComHistorico) * 100).toFixed(1)
    : '0.0'
  const taxaChurn = (ativos.length + cancelados.length) > 0
    ? ((cancelados.length / (ativos.length + cancelados.length)) * 100).toFixed(1)
    : '0.0'
  const taxaInadimplencia = ativos.length > 0
    ? ((inadimpl.length / (ativos.length + inadimpl.length)) * 100).toFixed(1)
    : '0.0'
  const ticketMedio = ativos.length > 0 ? (mrr / ativos.length).toFixed(2) : '0.00'

  const Stat = ({ label, value, sub, icon: Icon, color, bg, trend }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs mês anterior
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* KPIs principais */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Receita</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="MRR" value={`R$${mrr.toFixed(0)}`} sub={`ARR: R$${arr.toFixed(0)}`} icon={DollarSign} color="text-amber-600" bg="bg-amber-100" />
          <Stat label="Ticket médio" value={`R$${ticketMedio}`} sub="por assinante ativo" icon={TrendingUp} color="text-indigo-600" bg="bg-indigo-100" />
          <Stat label="Planos mensais" value={ativos.filter(u => u.plan !== 'annual').length} sub={`R$${mrrMensal.toFixed(0)}/mês`} icon={RefreshCw} color="text-blue-600" bg="bg-blue-100" />
          <Stat label="Planos anuais" value={ativos.filter(u => u.plan === 'annual').length} sub={`R$${mrrAnual.toFixed(0)}/mês`} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Usuários</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total cadastros" value={users.length} sub={`+${novos30d.length} nos últimos 30 dias`} icon={Users} color="text-slate-600" bg="bg-slate-100" />
          <Stat label="Novos (7 dias)" value={novos7d.length} icon={Users} color="text-indigo-600" bg="bg-indigo-100" />
          <Stat label="Ativos pagantes" value={ativos.length} icon={CheckCircle} color="text-green-600" bg="bg-green-100" />
          <Stat label="Em trial" value={trials.length} sub={`${trialsEnd3d.length} expirando em 3 dias`} icon={Clock} color="text-amber-600" bg="bg-amber-100" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saúde do negócio</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Taxa de conversão" value={`${taxaConversao}%`} sub="trials → pagantes" icon={TrendingUp} color="text-green-600" bg="bg-green-100" />
          <Stat label="Taxa de churn" value={`${taxaChurn}%`} sub="cancelamentos" icon={TrendingDown} color="text-red-600" bg="bg-red-100" />
          <Stat label="Inadimplência" value={`${taxaInadimplencia}%`} sub={`${inadimpl.length} usuários`} icon={AlertCircle} color="text-orange-600" bg="bg-orange-100" />
          <Stat label="Cancelados" value={cancelados.length} icon={Users} color="text-gray-500" bg="bg-gray-100" />
        </div>
      </div>

      {/* Distribuição de status */}
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
                  <span>{s.label}</span>
                  <span>{s.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trials expirando — tabela */}
      {trialsEnd3d.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-slate-700">Trials expirando nos próximos 3 dias</p>
          </div>
          <div className="space-y-2">
            {trialsEnd3d.map(u => {
              const dias = Math.ceil((new Date(u.trialEnd) - now) / (1000*60*60*24))
              return (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{u.oficina || u.email}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${dias <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {dias <= 0 ? 'Hoje!' : `${dias} dia${dias !== 1 ? 's' : ''}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inadimplentes */}
      {inadimpl.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold text-slate-700">Inadimplentes</p>
          </div>
          <div className="space-y-2">
            {inadimpl.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.oficina || u.email}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  Pagamento falhou
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

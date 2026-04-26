import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, ArrowUp, ArrowDown, CreditCard } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/storage'

// ── Gráfico de linha SVG ─────────────────────────────────────
function LineChart({ data, height = 120, color = '#6366f1' }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const min = 0
  const w = 400, h = height
  const pad = { top: 8, bottom: 20, left: 8, right: 8 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + ch - ((d.value - min) / (max - min)) * ch,
    ...d
  }))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const fill = path + ` L${points[points.length-1].x},${pad.top+ch} L${points[0].x},${pad.top+ch} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {/* Area */}
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pontos */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={h - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Gráfico de barras empilhadas ─────────────────────────────
function StackedBar({ novo, churnado, label }) {
  const max = Math.max(novo, 4)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col-reverse items-center gap-0.5 w-8" style={{ height: 60 }}>
        <div className="w-full rounded-sm bg-green-400" style={{ height: `${(novo/max)*50}px` }} title={`+R$${novo}`} />
        <div className="w-full rounded-sm bg-red-300" style={{ height: `${(churnado/max)*50}px` }} title={`-R$${churnado}`} />
      </div>
      <span className="text-[9px] text-slate-400">{label}</span>
    </div>
  )
}

export default function Receita({ users }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('6m') // 3m | 6m | 12m

  const now = new Date()
  const ativos     = users.filter(u => u.status === 'active')
  const inadimpl   = users.filter(u => u.status === 'inadimplente')
  const cancelados = users.filter(u => ['cancelado','inactive'].includes(u.status))

  // MRR atual
  const mrrMensal = ativos.filter(u => u.plan !== 'annual').length * 47.90
  const mrrAnual  = ativos.filter(u => u.plan === 'annual').length * (418.80 / 12)
  const mrr       = mrrMensal + mrrAnual
  const arr       = mrr * 12
  const ticketMedio = ativos.length > 0 ? mrr / ativos.length : 0
  const mrrEmRisco = inadimpl.length * 47.90

  // Previsão (crescimento médio estimado 8%)
  const previsao3m = mrr * 1.08
  const previsao6m = mrr * 1.16

  // Top clientes por LTV estimado
  const topClientes = [...ativos]
    .map(u => ({
      ...u,
      ltv: u.plan === 'annual'
        ? (u.activatedAt ? Math.ceil((now - new Date(u.activatedAt)) / (30*24*3600*1000)) : 1) * (418.80/12)
        : (u.activatedAt ? Math.ceil((now - new Date(u.activatedAt)) / (30*24*3600*1000)) : 1) * 47.90
    }))
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 8)

  // Próximas cobranças (próximos 30 dias)
  const in30d = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
  const proximas = ativos
    .filter(u => u.nextBillingAt && new Date(u.nextBillingAt) <= in30d)
    .sort((a, b) => new Date(a.nextBillingAt) - new Date(b.nextBillingAt))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const months = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12
      const from = new Date(now.getTime() - months * 30 * 24 * 3600 * 1000)
      const { data } = await supabase
        .from('mrr_snapshots')
        .select('data, mrr, active_count')
        .gte('data', from.toISOString().split('T')[0])
        .order('data', { ascending: true })

      if (data?.length) {
        // Agrupa por mês
        const byMonth = {}
        data.forEach(d => {
          const m = d.data.substring(0, 7) // YYYY-MM
          if (!byMonth[m] || d.data > byMonth[m].data) byMonth[m] = d
        })
        setSnapshots(Object.values(byMonth).map(d => ({
          label: new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }),
          value: parseFloat(d.mrr) || 0,
          active: d.active_count || 0,
        })))
      } else {
        // Estimativa retroativa
        setSnapshots(generateEstimated(mrr, months))
      }
      setLoading(false)
    }
    load()
  }, [periodo, users])

  const chartData = snapshots.map(s => ({ ...s }))
  // Adiciona ponto atual se o último é diferente do MRR real
  if (chartData.length > 0) {
    chartData[chartData.length - 1].value = mrr
    chartData[chartData.length - 1].label = 'Hoje'
  }

  const mrrChange = chartData.length >= 2
    ? ((chartData[chartData.length-1].value - chartData[chartData.length-2].value) / Math.max(chartData[chartData.length-2].value, 1) * 100)
    : 0

  return (
    <div className="space-y-5">

      {/* KPIs financeiros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'MRR', value: `R$${mrr.toFixed(0)}`, sub: mrrChange !== 0 ? `${mrrChange >= 0 ? '+' : ''}${mrrChange.toFixed(1)}% vs mês anterior` : 'Mês atual', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100', up: mrrChange >= 0 },
          { label: 'ARR', value: `R$${arr.toFixed(0)}`, sub: 'Receita anualizada', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Ticket médio', value: `R$${ticketMedio.toFixed(2)}`, sub: 'por assinante ativo', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'MRR em risco', value: `R$${mrrEmRisco.toFixed(0)}`, sub: `${inadimpl.length} inadimplente${inadimpl.length !== 1 ? 's' : ''}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            {k.sub && (
              <p className={`text-[11px] mt-1 font-medium flex items-center gap-0.5 ${k.up === false ? 'text-red-500' : k.up === true ? 'text-green-600' : 'text-slate-400'}`}>
                {k.up === true && <ArrowUp className="w-3 h-3" />}
                {k.up === false && <ArrowDown className="w-3 h-3" />}
                {k.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico MRR histórico */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">MRR histórico</p>
            <p className="text-xs text-slate-400">Receita recorrente mensal</p>
          </div>
          <div className="flex gap-1.5">
            {['3m','6m','12m'].map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${periodo === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LineChart data={chartData} height={130} />
        )}

        {/* Previsão */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
          <div>
            <p className="text-xs text-slate-400">Hoje</p>
            <p className="text-sm font-bold text-slate-800">R${mrr.toFixed(0)}</p>
          </div>
          <ArrowUp className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-slate-400">Previsão 3 meses</p>
            <p className="text-sm font-bold text-green-600">R${previsao3m.toFixed(0)}</p>
          </div>
          <ArrowUp className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-slate-400">Previsão 6 meses</p>
            <p className="text-sm font-bold text-green-600">R${previsao6m.toFixed(0)}</p>
          </div>
          <div className="ml-auto text-xs text-slate-400 italic">*Baseado em crescimento estimado de 8%/mês</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Breakdown por plano */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Breakdown por plano</p>
          <div className="space-y-3">
            {[
              {
                label: 'Plano Mensal', count: ativos.filter(u => u.plan !== 'annual').length,
                valor: mrrMensal, preco: 'R$47,90/mês', color: 'bg-indigo-500', pct: mrr > 0 ? (mrrMensal/mrr)*100 : 0
              },
              {
                label: 'Plano Anual', count: ativos.filter(u => u.plan === 'annual').length,
                valor: mrrAnual, preco: 'R$34,90/mês', color: 'bg-green-500', pct: mrr > 0 ? (mrrAnual/mrr)*100 : 0
              },
            ].map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <div>
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-slate-400 ml-2">{p.count} clientes · {p.preco}</span>
                  </div>
                  <span className="font-bold">R${p.valor.toFixed(0)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-400">MRR total</p>
              <p className="text-lg font-extrabold text-indigo-600">R${mrr.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">ARR total</p>
              <p className="text-lg font-extrabold text-green-600">R${arr.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Top clientes por LTV */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Top clientes por LTV estimado</p>
          {topClientes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum assinante ativo ainda.</p>
          ) : (
            <div className="space-y-1">
              {topClientes.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold text-slate-300 w-4">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{u.oficina || u.email}</p>
                    <p className="text-[10px] text-slate-400">{u.plan === 'annual' ? 'Anual' : 'Mensal'}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">R${u.ltv.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Próximas cobranças */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-bold text-slate-800 mb-1">Próximas cobranças (30 dias)</p>
        <p className="text-xs text-slate-400 mb-4">Baseado em next_billing_at do perfil</p>
        {proximas.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma cobrança com data registrada. Datas são preenchidas automaticamente pelo Stripe.</p>
        ) : (
          <div className="space-y-2">
            {proximas.map(u => {
              const diasAte = Math.ceil((new Date(u.nextBillingAt) - now) / (1000*3600*24))
              return (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{u.oficina || u.email}</p>
                    <p className="text-xs text-slate-400">{formatDate(u.nextBillingAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">R${u.plan === 'annual' ? '418,80' : '47,90'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diasAte <= 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {diasAte <= 0 ? 'Hoje' : `em ${diasAte}d`}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="pt-3 flex justify-between text-sm font-semibold">
              <span className="text-slate-600">Total previsto:</span>
              <span className="text-green-600">R${proximas.reduce((s, u) => s + (u.plan === 'annual' ? 418.80 : 47.90), 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

function generateEstimated(currentMrr, months) {
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const factor = 0.55 + ((i + 1) / months) * 0.45
    return {
      label: monthNames[d.getMonth()],
      value: Math.round(currentMrr * factor),
      color: i === months - 1 ? '#4f46e5' : '#a5b4fc',
    }
  })
}

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle,
  DollarSign, Users, Target, Zap, ArrowRight, RefreshCw,
  Lightbulb, Activity, BadgeDollarSign, BarChart3, Flame,
  ShieldAlert, PhoneCall, Clock, Info
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useConfig } from '../../../hooks/useConfig'

const LS_KEY = 'bx_conselho_adspend'

// ── Helpers ──────────────────────────────────────────────────
const fmtBrl = (n) =>
  n == null ? '—'
  : `R$${Math.round(n).toLocaleString('pt-BR')}`

const fmtPct = (n, digits = 0) =>
  n == null ? '—' : `${(n * 100).toFixed(digits)}%`

function startOf(year, month) { return new Date(year, month, 1) }

// Saúde simples de um cliente (para detectar risco)
function isAtRisk(u) {
  const now = new Date()
  const osOk   = (u.osCount || 0) >= 1
  const seenOk = u.lastSeenAt && (now - new Date(u.lastSeenAt)) < 14 * 86400000
  return !osOk || !seenOk
}

// ── Semáforo principal ────────────────────────────────────────
function Semaforo({ churnOk, convOk, growthOk, onNavigate }) {
  const checks = [churnOk, convOk, growthOk]
  const score  = checks.filter(v => v === true).length
  const hasNull = checks.some(v => v === null)

  const cfg =
    score === 3
      ? { emoji:'🟢', label:'ESCALE O TRÁFEGO',
          sub:'Produto retém, funil converte, base cresce. Hora de ligar o combustível.',
          bg:'bg-green-50 border-green-200', badge:'bg-green-600', text:'text-green-900' }
    : score >= 2
      ? { emoji:'🟡', label:'QUASE LÁ — CORRIJA 1 PONTO',
          sub:'Está perto. Resolva o critério vermelho abaixo antes de escalar.',
          bg:'bg-amber-50 border-amber-200', badge:'bg-amber-500', text:'text-amber-900' }
      : { emoji:'🔴', label:'FOQUE NA RETENÇÃO PRIMEIRO',
          sub:'Mais tráfego agora = mais desperdício. Corrija o produto antes de escalar.',
          bg:'bg-red-50 border-red-200', badge:'bg-red-600', text:'text-red-900' }

  return (
    <div className={`rounded-2xl border-2 p-6 ${cfg.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Decisão estratégica agora</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{cfg.emoji}</span>
            <h2 className={`text-xl font-extrabold ${cfg.text} leading-tight`}>{cfg.label}</h2>
          </div>
          <p className="text-sm text-slate-500">{cfg.sub}</p>
          {hasNull && <p className="text-xs text-slate-400 mt-1">⚠️ Alguns critérios precisam de mais dados para calcular com precisão.</p>}
        </div>
        <button onClick={() => onNavigate('clientes')}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors flex-shrink-0">
          Ver clientes <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Card de critério individual ───────────────────────────────
function CriterioCard({ label, meta, valor, ok, icon: Icon, descOk, descFail, detalhe }) {
  const estado =
    ok === null  ? { color:'text-slate-400', bg:'bg-slate-50',  border:'border-slate-200', dot:'bg-slate-300' }
    : ok         ? { color:'text-green-700', bg:'bg-green-50',  border:'border-green-200', dot:'bg-green-500' }
    :              { color:'text-red-700',   bg:'bg-red-50',    border:'border-red-200',   dot:'bg-red-500'   }

  return (
    <div className={`rounded-2xl border p-4 ${estado.bg} ${estado.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok === null ? 'bg-slate-200' : ok ? 'bg-green-100' : 'bg-red-100'}`}>
          <Icon className={`w-4 h-4 ${estado.color}`} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${estado.dot} flex-shrink-0`}>
          {ok === null ? '?' : ok ? '✓ OK' : '✗ Alerta'}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 leading-none mb-0.5">{valor}</p>
      <p className="text-[11px] text-slate-400 mb-2">meta: {meta}</p>
      <p className={`text-xs font-medium leading-snug ${estado.color}`}>
        {ok === null ? 'Dados insuficientes ainda' : ok ? descOk : descFail}
      </p>
      {detalhe && <p className="text-[11px] text-slate-400 mt-1">{detalhe}</p>}
    </div>
  )
}

// ── KPI simples ───────────────────────────────────────────────
function Kpi({ label, value, sub, highlight, icon: Icon, color = 'text-indigo-600', bg = 'bg-indigo-50' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-xl font-extrabold leading-none ${highlight || 'text-slate-900'}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  )
}

// ── Insight card ──────────────────────────────────────────────
function Insight({ type, title, text, action, actionLabel, onNavigate }) {
  const s = {
    critical: { bg:'bg-red-50',    border:'border-red-200',    icon: ShieldAlert,   ic:'text-red-600'    },
    warning:  { bg:'bg-amber-50',  border:'border-amber-200',  icon: AlertCircle,   ic:'text-amber-600'  },
    success:  { bg:'bg-green-50',  border:'border-green-200',  icon: CheckCircle,   ic:'text-green-600'  },
    info:     { bg:'bg-indigo-50', border:'border-indigo-200', icon: Lightbulb,     ic:'text-indigo-600' },
  }[type] || {}
  const IcIcon = s.icon

  return (
    <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <IcIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.ic}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
          {action && (
            <button onClick={() => onNavigate(action)}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              {actionLabel || 'Ver'} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function Conselho({ users, loadingUsers, reload, onNavigate }) {
  const cfg    = useConfig()
  const now    = new Date()
  const startM = startOf(now.getFullYear(), now.getMonth())
  const startP = startOf(now.getFullYear(), now.getMonth() - 1)   // mês passado
  const endP   = new Date(now.getFullYear(), now.getMonth(), 0)    // último dia do mês passado
  const ago60  = new Date(now.getTime() - 60 * 86400000)
  const ago7   = new Date(now.getTime() -  7 * 86400000)

  const [adSpend, setAdSpendState] = useState(
    () => parseFloat(localStorage.getItem(LS_KEY) || '0')
  )
  const [leadsThisMonth, setLeadsThisMonth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('diagnostico_leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startM.toISOString())
      .then(({ count }) => { setLeadsThisMonth(count || 0); setLoading(false) })
  }, [])

  const setAdSpend = (v) => {
    setAdSpendState(v)
    localStorage.setItem(LS_KEY, String(v))
  }

  const pMensal = parseFloat(cfg.price_monthly) || 97
  const pAnual  = parseFloat(cfg.price_annual)  || 958.80

  // ── Segmentos base ───────────────────────────────────────────
  const ativos      = users.filter(u => u.status === 'active')
  const trials      = users.filter(u => u.status === 'trial')
  const inadimpl    = users.filter(u => u.status === 'inadimplente')

  // ── MRR ──────────────────────────────────────────────────────
  const mrrMensal  = ativos.filter(u => u.plan !== 'annual').length * pMensal
  const mrrAnual   = ativos.filter(u => u.plan === 'annual').length * (pAnual / 12)
  const mrr        = mrrMensal + mrrAnual
  const arpuReal   = ativos.length > 0 ? mrr / ativos.length : pMensal

  // ── Novos pagantes este mês ──────────────────────────────────
  const newPagantes = ativos.filter(u => u.activatedAt && new Date(u.activatedAt) >= startM)
  const newMrr      = newPagantes.reduce((s, u) => s + (u.plan === 'annual' ? pAnual / 12 : pMensal), 0)

  // ── Churn este mês ───────────────────────────────────────────
  const canceladosMes = users.filter(u =>
    ['cancelado', 'inactive'].includes(u.status) &&
    u.canceledAt && new Date(u.canceledAt) >= startM
  )
  const churnMrr   = canceladosMes.length * arpuReal
  const netMrr     = newMrr - churnMrr
  const baseRisco  = ativos.length + canceladosMes.length
  const churnRate  = baseRisco > 0 ? canceladosMes.length / baseRisco : 0

  // ── Trial → Pago (últimos 60 dias) ───────────────────────────
  const trialsEncerrados  = users.filter(u =>
    u.trialEnd && new Date(u.trialEnd) <= now && new Date(u.trialEnd) >= ago60
  )
  const trialsConvertidos = trialsEncerrados.filter(u => u.status === 'active' && u.activatedAt)
  const convRate = trialsEncerrados.length >= 3
    ? trialsConvertidos.length / trialsEncerrados.length
    : null   // poucos dados para afirmar

  // ── LTV & CAC ────────────────────────────────────────────────
  const ltv    = churnRate > 0.005 ? arpuReal / churnRate : arpuReal * 24
  const cac    = adSpend > 0 && newPagantes.length > 0 ? adSpend / newPagantes.length : null
  const ltvCac = cac && cac > 0 ? ltv / cac : null
  const payback = cac ? Math.ceil(cac / arpuReal) : null   // meses para recuperar CAC

  // ── Saúde da base ────────────────────────────────────────────
  const ativosZeroOs  = ativos.filter(u => (u.osCount || 0) === 0)
  const ativosRisco   = ativos.filter(u => isAtRisk(u))
  const ativosEngaj   = ativos.filter(u => (u.osCount || 0) >= 3 && u.lastSeenAt && new Date(u.lastSeenAt) >= ago7)
  const trialsExpSem  = trials.filter(u => {
    if (!u.trialEnd) return false
    const d = new Date(u.trialEnd)
    return d <= new Date(now.getTime() + 7 * 86400000) && d >= now
  })
  const trialsExpZero = trialsExpSem.filter(u => (u.osCount || 0) === 0)

  // ── Critérios do semáforo ────────────────────────────────────
  const churnOk  = ativos.length >= 5 ? churnRate < 0.05  : null
  const convOk   = convRate !== null  ? convRate  > 0.25  : null
  const growthOk = ativos.length >= 5 ? netMrr    >= 0    : null

  // ── Insights dinâmicos ───────────────────────────────────────
  const insights = []

  if (trialsExpZero.length > 0) {
    insights.push({
      type: 'critical',
      title: `${trialsExpZero.length} trial${trialsExpZero.length > 1 ? 's' : ''} expira${trialsExpZero.length === 1 ? '' : 'm'} em 7 dias sem ter usado o sistema`,
      text: 'Quem não criou nenhuma OS durante o trial quase nunca paga. Uma ligação ou mensagem personalizada agora pode salvar essa conversão.',
      action: 'clientes', actionLabel: 'Ver trials',
    })
  }

  if (ativosZeroOs.length > 0 && ativos.length > 0) {
    insights.push({
      type: 'warning',
      title: `${ativosZeroOs.length} cliente${ativosZeroOs.length > 1 ? 's' : ''} ativo${ativosZeroOs.length > 1 ? 's' : ''} ainda não criou nenhuma OS`,
      text: 'Está pagando mas não usando. Altíssimo risco de cancelamento no próximo ciclo. Contacte agora.',
      action: 'clientes', actionLabel: 'Ver clientes',
    })
  }

  if (inadimpl.length > 0) {
    insights.push({
      type: 'critical',
      title: `${inadimpl.length} inadimplente${inadimpl.length > 1 ? 's' : ''} — MRR em risco: ${fmtBrl(inadimpl.length * arpuReal)}`,
      text: 'Cobranças falharam. Cada semana sem contato reduz a chance de recuperação. Priorize.',
      action: 'clientes', actionLabel: 'Ver inadimplentes',
    })
  }

  if (ltvCac !== null && ltvCac < 3) {
    insights.push({
      type: 'warning',
      title: `LTV/CAC em ${ltvCac.toFixed(1)}× — abaixo do mínimo saudável (3×)`,
      text: 'Para cada R$1 investido em aquisição você recupera apenas R$' + ltvCac.toFixed(1) + ' em receita. Reduza o CAC ou aumente retenção antes de escalar.',
    })
  }

  if (ltvCac !== null && ltvCac >= 5) {
    insights.push({
      type: 'success',
      title: `LTV/CAC em ${ltvCac.toFixed(1)}× — excelente para escalar`,
      text: `Para cada R$1 investido você recupera R$${ltvCac.toFixed(0)}. Essa equação favorece investimento agressivo em aquisição.`,
    })
  }

  if (churnRate > 0.08 && ativos.length >= 5) {
    insights.push({
      type: 'critical',
      title: `Churn de ${Math.round(churnRate * 100)}%/mês — muito acima do alvo de 5%`,
      text: 'Prioridade máxima. Não escale tráfego até entender por que estão saindo. Entreviste os últimos 3 cancelamentos.',
    })
  }

  if (convRate !== null && convRate < 0.15 && trialsEncerrados.length >= 3) {
    insights.push({
      type: 'warning',
      title: `Conversão trial→pago em ${Math.round(convRate * 100)}% — abaixo do esperado`,
      text: 'Menos de 1 em 5 trials vira pagante. O problema pode ser onboarding fraco, produto difícil ou público errado no topo do funil.',
    })
  }

  if (ativos.length < 20 && ativos.length > 0) {
    insights.push({
      type: 'info',
      title: 'Fase de validação: cada feedback vale ouro agora',
      text: `Com ${ativos.length} pagante${ativos.length !== 1 ? 's' : ''}, foque em entender profundamente quem fica e por quê. Isso vale mais do que escalar tráfego agora.`,
    })
  }

  if (ativosEngaj.length > 0 && ativos.length > 0) {
    const pctEngaj = Math.round((ativosEngaj.length / ativos.length) * 100)
    if (pctEngaj >= 60) {
      insights.push({
        type: 'success',
        title: `${pctEngaj}% dos clientes ativos estão engajados esta semana`,
        text: 'Base saudável. Clientes engajados são sua melhor fonte de indicação — considere ativar um programa de referral.',
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Continue acompanhando os indicadores',
      text: 'Nenhum alerta crítico no momento. Continue monitorando churn, conversão e engajamento semanalmente.',
    })
  }

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Conselho</h2>
          <p className="text-sm text-slate-400 mt-0.5">Indicadores para você tomar as decisões certas na hora certa</p>
        </div>
        <button onClick={reload} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Semáforo */}
      <Semaforo churnOk={churnOk} convOk={convOk} growthOk={growthOk} onNavigate={onNavigate} />

      {/* 3 Critérios */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Os 3 critérios do semáforo</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <CriterioCard
            label="Churn mensal"
            meta="< 5%"
            valor={ativos.length >= 3 ? fmtPct(churnRate) : '—'}
            ok={churnOk}
            icon={TrendingDown}
            descOk="Retenção saudável. Clientes estão ficando."
            descFail="Muita saída. Resolva antes de trazer mais tráfego."
            detalhe={canceladosMes.length > 0 ? `${canceladosMes.length} cancelamento${canceladosMes.length > 1 ? 's' : ''} este mês` : 'Nenhum cancelamento este mês'}
          />
          <CriterioCard
            label="Trial → Pago"
            meta="> 25%"
            valor={convRate !== null ? fmtPct(convRate) : '— (< 3 dados)'}
            ok={convOk}
            icon={Target}
            descOk="Funil convertendo bem. Produto entrega valor no trial."
            descFail="Trial não convence. Onboarding ou oferta precisam melhorar."
            detalhe={trialsEncerrados.length > 0 ? `${trialsConvertidos.length}/${trialsEncerrados.length} trials nos últimos 60 dias` : 'Nenhum trial encerrado ainda'}
          />
          <CriterioCard
            label="MRR líquido"
            meta="> R$0 (crescendo)"
            valor={ativos.length >= 3 ? fmtBrl(netMrr) : '—'}
            ok={growthOk}
            icon={TrendingUp}
            descOk="Base crescendo. Mais entra do que sai."
            descFail="Base encolhendo. Churn supera novas aquisições."
            detalhe={`+${fmtBrl(newMrr)} novo · −${fmtBrl(churnMrr)} churn`}
          />
        </div>
      </div>

      {/* MRR breakdown */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">MRR deste mês</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="MRR atual" value={fmtBrl(mrr)}
            sub={`ARR ${fmtBrl(mrr * 12)}`}
            icon={DollarSign} color="text-indigo-600" bg="bg-indigo-50" />
          <Kpi label="Novo MRR" value={fmtBrl(newMrr)}
            sub={`${newPagantes.length} novo${newPagantes.length !== 1 ? 's' : ''}`}
            icon={TrendingUp} color="text-green-600" bg="bg-green-50"
            highlight={newMrr > 0 ? 'text-green-700' : 'text-slate-900'} />
          <Kpi label="MRR perdido (churn)" value={fmtBrl(churnMrr)}
            sub={`${canceladosMes.length} cancelamento${canceladosMes.length !== 1 ? 's' : ''}`}
            icon={TrendingDown} color="text-red-500" bg="bg-red-50"
            highlight={churnMrr > 0 ? 'text-red-600' : 'text-slate-900'} />
          <Kpi label="MRR líquido" value={fmtBrl(netMrr)}
            sub={netMrr >= 0 ? '↑ crescendo' : '↓ encolhendo'}
            icon={Activity} color={netMrr >= 0 ? 'text-green-600' : 'text-red-500'} bg={netMrr >= 0 ? 'bg-green-50' : 'bg-red-50'}
            highlight={netMrr >= 0 ? 'text-green-700' : 'text-red-600'} />
        </div>
      </div>

      {/* CAC & LTV */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">CAC & Retorno — gasto mensal em tráfego</p>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                💰 Gasto total em tráfego este mês (Meta Ads + Google + outros)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={adSpend || ''}
                  onChange={e => setAdSpend(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 2000"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 max-w-[160px]"
                />
                <span className="text-xs text-slate-400">/ mês</span>
              </div>
              {adSpend === 0 && (
                <p className="text-[11px] text-slate-400 mt-1">Digite o valor para calcular CAC e retorno.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wide mb-1">LTV estimado</p>
              <p className="text-xl font-extrabold text-slate-900">{fmtBrl(ltv)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {churnRate > 0.005
                  ? `ARPU ÷ churn (${fmtPct(churnRate)})`
                  : 'ARPU × 24 meses (churn baixo)'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wide mb-1">CAC</p>
              <p className={`text-xl font-extrabold ${cac ? 'text-slate-900' : 'text-slate-300'}`}>
                {cac ? fmtBrl(cac) : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {cac
                  ? `${fmtBrl(adSpend)} ÷ ${newPagantes.length} pagante${newPagantes.length !== 1 ? 's' : ''}`
                  : adSpend > 0 ? 'Nenhum novo pagante este mês' : 'Informe o gasto acima'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wide mb-1">LTV / CAC</p>
              <p className={`text-xl font-extrabold ${
                ltvCac === null ? 'text-slate-300'
                : ltvCac >= 5   ? 'text-green-600'
                : ltvCac >= 3   ? 'text-amber-600'
                :                 'text-red-600'
              }`}>
                {ltvCac !== null ? `${ltvCac.toFixed(1)}×` : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ltvCac === null ? 'Precisa do gasto'
                  : ltvCac >= 5   ? '✓ Excelente — escale'
                  : ltvCac >= 3   ? '✓ Saudável'
                  :                 '✗ Abaixo de 3× — atenção'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wide mb-1">Payback</p>
              <p className={`text-xl font-extrabold ${payback === null ? 'text-slate-300' : payback <= 6 ? 'text-green-600' : 'text-amber-600'}`}>
                {payback !== null ? `${payback}m` : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {payback !== null
                  ? payback <= 6  ? 'Rápido ✓'
                  : payback <= 12 ? 'Aceitável'
                  :                 'Longo — otimize'
                  : 'meses para recuperar CAC'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funil de captura */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Funil de captura — este mês</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Leads capturados" value={leadsThisMonth ?? '…'}
            sub="/lpdiagnostico + /lpquizdiagnostico"
            icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
          <Kpi label="Em trial agora" value={trials.length}
            sub={`${trials.filter(u => u.trialEnd && new Date(u.trialEnd) <= new Date(now.getTime() + 3*86400000) && new Date(u.trialEnd) >= now).length} expira em 3d`}
            icon={Clock} color="text-amber-600" bg="bg-amber-50" />
          <Kpi label="Novos pagantes" value={newPagantes.length}
            sub="ativados este mês"
            icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
          <Kpi label="Cancelamentos" value={canceladosMes.length}
            sub="este mês"
            icon={XCircle} color="text-red-500" bg="bg-red-50"
            highlight={canceladosMes.length > 0 ? 'text-red-600' : 'text-slate-900'} />
        </div>
      </div>

      {/* Saúde da base */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Saúde da base de clientes</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Engajados (7d)" value={ativosEngaj.length}
            sub={ativos.length > 0 ? `${Math.round(ativosEngaj.length/ativos.length*100)}% dos ativos` : '—'}
            icon={Zap} color="text-green-600" bg="bg-green-50"
            highlight={ativosEngaj.length > 0 ? 'text-green-700' : 'text-slate-400'} />
          <Kpi label="Em risco de churn" value={ativosRisco.length}
            sub={ativos.length > 0 ? `${Math.round(ativosRisco.length/ativos.length*100)}% dos ativos` : '—'}
            icon={AlertCircle} color="text-amber-600" bg="bg-amber-50"
            highlight={ativosRisco.length > 0 ? 'text-amber-700' : 'text-slate-900'} />
          <Kpi label="Ativos sem nenhuma OS" value={ativosZeroOs.length}
            sub="pagando mas não usando"
            icon={ShieldAlert} color="text-red-500" bg="bg-red-50"
            highlight={ativosZeroOs.length > 0 ? 'text-red-600' : 'text-slate-900'} />
          <Kpi label="Trials expirando em 7d" value={trialsExpSem.length}
            sub={`${trialsExpZero.length} sem OS — risco`}
            icon={PhoneCall} color="text-orange-600" bg="bg-orange-50"
            highlight={trialsExpZero.length > 0 ? 'text-orange-600' : 'text-slate-900'} />
        </div>
      </div>

      {/* Insights acionáveis */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Ações recomendadas agora ({insights.filter(i => i.type === 'critical' || i.type === 'warning').length} urgente{insights.filter(i => i.type === 'critical' || i.type === 'warning').length !== 1 ? 's' : ''})
        </p>
        <div className="space-y-2">
          {insights
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, success: 2, info: 3 }
              return order[a.type] - order[b.type]
            })
            .map((ins, i) => (
              <Insight key={i} {...ins} onNavigate={onNavigate} />
            ))}
        </div>
      </div>

    </div>
  )
}

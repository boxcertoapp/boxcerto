import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, Clock, AlertCircle, CheckCircle, Brain, Globe, MousePointerClick, ExternalLink } from 'lucide-react'
import { useConfig } from '../../../hooks/useConfig'
import { supabase } from '../../../lib/supabase'

// ════════════════════════════════════════════════════════════
// ANÁLISE DE CADASTRO
// ════════════════════════════════════════════════════════════

function pct(num, den) { return den > 0 ? Math.round((num / den) * 100) : 0 }

function TaxaBadge({ value, meta_boa, meta_excelente }) {
  const cls = value >= meta_excelente
    ? 'bg-green-100 text-green-700'
    : value >= meta_boa
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{value}%</span>
}

function FunnelStep({ label, count, total, color, dropLabel }) {
  const p = pct(count, total)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900">{count}</span>
          {total > 0 && count < total && (
            <span className="text-[10px] text-red-400 font-medium">−{total - count} {dropLabel}</span>
          )}
        </div>
      </div>
      <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
        <div className="h-full rounded-lg flex items-center pl-3 transition-all duration-700"
          style={{ width: `${Math.max(p, count > 0 ? 4 : 0)}%`, backgroundColor: color }}>
          {p >= 8 && <span className="text-white text-xs font-bold">{p}%</span>}
        </div>
      </div>
    </div>
  )
}

function AnalyseCadastro() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [periodo, setPeriodo]     = useState(7)
  const [modo, setModo]           = useState('dias')
  const [customFrom, setCustomFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })
  const [customTo, setCustomTo]     = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const since = modo === 'custom'
        ? new Date(customFrom + 'T00:00:00').toISOString()
        : new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString()
      let q = supabase
        .from('cadastro_events')
        .select('event_name, origem, device, error_type, error_field, fields_count, created_at')
        .gte('created_at', since)
      if (modo === 'custom') q = q.lte('created_at', new Date(customTo + 'T23:59:59').toISOString())
      const { data } = await q.order('created_at', { ascending: false })
      setEvents(data || [])
      setLoading(false)
    }
    load()
  }, [periodo, modo, customFrom, customTo])

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  if (events.length === 0) return (
    <div className="bg-slate-50 rounded-2xl p-10 text-center">
      <p className="text-slate-400 text-sm font-medium">Nenhum evento registrado neste período.</p>
      <p className="text-slate-300 text-xs mt-1">Os dados aparecem assim que usuários acessarem /cadastro.</p>
      <p className="text-slate-300 text-xs mt-3 font-mono">Execute primeiro: supabase/cadastro_events.sql</p>
    </div>
  )

  const count = (name) => events.filter(e => e.event_name === name).length

  // Funil principal
  const views    = count('cadastro_view')
  const starts   = count('cadastro_form_start')
  const clicks   = count('cadastro_submit_click')
  const success  = count('cadastro_signup_success')
  const errors   = count('cadastro_signup_error')
  const valErros = count('cadastro_validation_error')

  const taxaInicio   = pct(starts,  views)
  const taxaClick    = pct(clicks,  starts)
  const taxaSucesso  = pct(success, clicks)
  const taxaFinal    = pct(success, views)

  // Diagnóstico automático
  const getDiag = () => {
    if (views === 0) return null
    if (taxaInicio < 30) return { icon: '😶', cor: 'bg-amber-50 border-amber-200 text-amber-800', msg: `Só ${taxaInicio}% começou o formulário. A promessa da página ou o layout não está convencendo. Revise o headline e o CTA.` }
    if (taxaClick < 40)  return { icon: '😓', cor: 'bg-amber-50 border-amber-200 text-amber-800', msg: `Só ${taxaClick}% de quem começou clicou no botão. O formulário está cansando ou travando alguém no meio.` }
    if (taxaSucesso < 60) return { icon: '⚠️', cor: 'bg-red-50 border-red-200 text-red-800', msg: `Só ${taxaSucesso}% de sucesso após clique — provavelmente erro técnico, validação ou backend. Veja a tabela de erros abaixo.` }
    if (taxaFinal >= 30) return { icon: '🚀', cor: 'bg-green-50 border-green-200 text-green-800', msg: `Taxa final de ${taxaFinal}% — ótima performance! Meta excelente é 40%+.` }
    return { icon: '📈', cor: 'bg-indigo-50 border-indigo-200 text-indigo-800', msg: `Taxa final de ${taxaFinal}%. Meta mínima é 20%, boa é 30%+. Continue otimizando.` }
  }
  const diag = getDiag()

  // Erros de validação por campo
  const valByField = events
    .filter(e => e.event_name === 'cadastro_validation_error' && e.error_field)
    .reduce((acc, e) => { acc[e.error_field] = (acc[e.error_field] || 0) + 1; return acc }, {})
  const valSorted = Object.entries(valByField).sort((a, b) => b[1] - a[1])

  // Erros de backend
  const errByType = events
    .filter(e => e.event_name === 'cadastro_signup_error' && e.error_type)
    .reduce((acc, e) => { acc[e.error_type] = (acc[e.error_type] || 0) + 1; return acc }, {})
  const errSorted = Object.entries(errByType).sort((a, b) => b[1] - a[1])

  // Por origem
  const origens = {}
  const origemEvents = ['cadastro_view','cadastro_form_start','cadastro_submit_click','cadastro_signup_success']
  events.forEach(e => {
    if (!origemEvents.includes(e.event_name)) return
    const o = e.origem || 'direto'
    if (!origens[o]) origens[o] = { view: 0, start: 0, click: 0, success: 0 }
    if (e.event_name === 'cadastro_view')          origens[o].view++
    if (e.event_name === 'cadastro_form_start')     origens[o].start++
    if (e.event_name === 'cadastro_submit_click')   origens[o].click++
    if (e.event_name === 'cadastro_signup_success') origens[o].success++
  })
  const origensSorted = Object.entries(origens).sort((a, b) => b[1].view - a[1].view)

  // Por dispositivo
  const devices = {}
  events.forEach(e => {
    if (!origemEvents.includes(e.event_name)) return
    const d = e.device || 'desconhecido'
    if (!devices[d]) devices[d] = { view: 0, start: 0, click: 0, success: 0 }
    if (e.event_name === 'cadastro_view')          devices[d].view++
    if (e.event_name === 'cadastro_form_start')     devices[d].start++
    if (e.event_name === 'cadastro_submit_click')   devices[d].click++
    if (e.event_name === 'cadastro_signup_success') devices[d].success++
  })
  const devicesSorted = Object.entries(devices).sort((a, b) => b[1].view - a[1].view)

  return (
    <div className="space-y-5">

      {/* Header + período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">Funil de cadastro</p>
          <p className="text-xs text-slate-400">Eventos registrados na página /cadastro</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1.5 flex-wrap">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => { setModo('dias'); setPeriodo(d) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modo === 'dias' && periodo === d ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-indigo-300'
                }`}>
                {d} dias
              </button>
            ))}
            <button onClick={() => setModo('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                modo === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-indigo-300'
              }`}>
              Personalizado
            </button>
          </div>
          {modo === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">De</span>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                max={customTo}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              <span className="text-xs text-slate-500 font-medium">até</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
            </div>
          )}
        </div>
      </div>

      {/* Diagnóstico automático */}
      {diag && (
        <div className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${diag.cor}`}>
          <span className="text-base flex-shrink-0">{diag.icon}</span>
          <p className="text-sm">{diag.msg}</p>
        </div>
      )}

      {/* KPIs das taxas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Taxa de início',     value: taxaInicio,  sub: 'view → form_start',    meta_boa: 50, meta_excelente: 70 },
          { label: 'Taxa de clique',     value: taxaClick,   sub: 'start → submit_click', meta_boa: 50, meta_excelente: 70 },
          { label: 'Sucesso após clique',value: taxaSucesso, sub: 'click → success',       meta_boa: 70, meta_excelente: 85 },
          { label: 'Conversão final',    value: taxaFinal,   sub: 'view → success',        meta_boa: 20, meta_excelente: 30 },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <TaxaBadge value={k.value} meta_boa={k.meta_boa} meta_excelente={k.meta_excelente} />
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{k.value}%</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Funil visual */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-bold text-slate-800 mb-4">Funil step a step</p>
        <div className="space-y-3">
          <FunnelStep label="Visualizações (/cadastro)" count={views}   total={views}   color="#6366f1" dropLabel="" />
          <FunnelStep label="Começou formulário"         count={starts}  total={views}   color="#818cf8" dropLabel="saíram sem começar" />
          <FunnelStep label="Clicou em cadastrar"        count={clicks}  total={views}   color="#a78bfa" dropLabel="abandonaram no meio" />
          <FunnelStep label="Cadastro concluído ✓"       count={success} total={views}   color="#10b981" dropLabel="tiveram erro ou desistiram" />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Erros de validação</p>
            <p className="text-xl font-extrabold text-amber-600">{valErros}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Erros de backend</p>
            <p className="text-xl font-extrabold text-red-500">{errors}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total de eventos</p>
            <p className="text-xl font-extrabold text-slate-600">{events.length}</p>
          </div>
        </div>
      </div>

      {/* Erros */}
      {(valSorted.length > 0 || errSorted.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">

          {valSorted.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-slate-800 mb-1">Erros de validação por campo</p>
              <p className="text-xs text-slate-400 mb-4">Campo que travou antes de submeter</p>
              <div className="space-y-2">
                {valSorted.map(([field, n]) => (
                  <div key={field} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{field}</span>
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{n}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errSorted.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-slate-800 mb-1">Erros de backend</p>
              <p className="text-xs text-slate-400 mb-4">Retornados pelo servidor após tentar cadastrar</p>
              <div className="space-y-2">
                {errSorted.map(([type, n]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium font-mono text-xs">{type}</span>
                    <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{n}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Por origem */}
      {origensSorted.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
          <p className="text-sm font-bold text-slate-800 mb-4">Por origem</p>
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100 text-slate-400">
                {['Origem','Views','Início','Submit','Sucesso','Conversão'].map(h => (
                  <th key={h} className="py-2 px-2 font-semibold text-left first:text-left text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {origensSorted.map(([o, v]) => (
                <tr key={o} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-2 font-semibold text-slate-700">{o}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.view}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.start}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.click}</td>
                  <td className="py-2 px-2 text-right text-green-600 font-semibold">{v.success}</td>
                  <td className="py-2 px-2 text-right">
                    <TaxaBadge value={pct(v.success, v.view)} meta_boa={20} meta_excelente={30} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Por dispositivo */}
      {devicesSorted.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
          <p className="text-sm font-bold text-slate-800 mb-4">Por dispositivo</p>
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100 text-slate-400">
                {['Dispositivo','Views','Início','Submit','Sucesso','Conversão'].map(h => (
                  <th key={h} className="py-2 px-2 font-semibold text-left first:text-left text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devicesSorted.map(([d, v]) => (
                <tr key={d} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-2 font-semibold text-slate-700">{d === 'mobile' ? '📱 mobile' : d === 'desktop' ? '🖥️ desktop' : d}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.view}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.start}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{v.click}</td>
                  <td className="py-2 px-2 text-right text-green-600 font-semibold">{v.success}</td>
                  <td className="py-2 px-2 text-right">
                    <TaxaBadge value={pct(v.success, v.view)} meta_boa={20} meta_excelente={30} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

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
  const [views, setViews]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [periodo, setPeriodo]     = useState(7)
  const [modo, setModo]           = useState('dias')
  const [customFrom, setCustomFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })
  const [customTo, setCustomTo]     = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const since = modo === 'custom'
        ? new Date(customFrom + 'T00:00:00').toISOString()
        : new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString()
      let q = supabase
        .from('page_views')
        .select('page, session_id, referrer, device, browser, created_at')
        .gte('created_at', since)
      if (modo === 'custom') q = q.lte('created_at', new Date(customTo + 'T23:59:59').toISOString())
      const { data } = await q.order('created_at', { ascending: false })
      setViews(data || [])
      setLoading(false)
    }
    load()
  }, [periodo, modo, customFrom, customTo])

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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div />
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1.5 flex-wrap">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => { setModo('dias'); setPeriodo(d) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modo === 'dias' && periodo === d ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-indigo-300'
                }`}>
                {d} dias
              </button>
            ))}
            <button onClick={() => setModo('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                modo === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-indigo-300'
              }`}>
              Personalizado
            </button>
          </div>
          {modo === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">De</span>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                max={customTo}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              <span className="text-xs text-slate-500 font-medium">até</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
            </div>
          )}
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

      {/* Análise de Cadastro */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Análise de cadastro</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Funil /cadastro — eventos em tempo real</p>
          </div>
        </div>
        <AnalyseCadastro />
      </div>

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

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Plus, Trash2, X, AlertCircle, Printer, RotateCcw, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { showSaveCheck } from '../../components/SaveCheck'
import { showToast } from '../../components/Toast'
import {
  osStorage, expenseStorage, officeDataStorage, vendaStorage,
  formatCurrency, formatDate
} from '../../lib/storage'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

// Anima o número do valor (count-up suave)
function useCountUp(target, dur = 600) {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  const raf  = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const a = from.current, b = target
    cancelAnimationFrame(raf.current)
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(a + (b - a) * e)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else from.current = b
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])
  return val
}

// Micro-gráfico de barras dos últimos meses (lucro de serviços)
function MiniBars({ serie }) {
  if (!serie.length || serie.every(s => s.valor === 0)) return null
  const max = Math.max(1, ...serie.map(s => Math.abs(s.valor)))
  return (
    <div className="flex items-end gap-1.5 h-16 shrink-0" aria-hidden="true">
      {serie.map((s, i) => {
        const h = Math.max(7, Math.round((Math.abs(s.valor) / max) * 50))
        const atual = i === serie.length - 1
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-2.5 rounded-full transition-all duration-500"
              style={{ height: h, background: atual ? '#ffffff' : 'rgba(255,255,255,.32)' }} />
            <span className="text-[8px] font-medium" style={{ color: atual ? '#fff' : 'rgba(255,255,255,.5)' }}>
              {MESES_CURTOS[s.mes]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function printFinanceiro({ mes, ano, totalReceitas, totalLucroOS, totalDespesas, lucroLiquido, deliveredOS, expenses, officeData }) {
  const osRows = deliveredOS.map(os => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.vehicle?.placa || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.vehicle?.modelo || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.client?.nome || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right">${formatCurrency(os.totals.venda)}</td>
    </tr>`).join('')

  const expRows = expenses.map(e => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${e.descricao}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;color:#ef4444">${formatCurrency(e.valor)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório Financeiro</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;padding:32px;color:#1e293b}@media print{body{padding:16px}}</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e2e8f0">
    <div>
      ${officeData.logo ? `<img src="${officeData.logo}" style="max-height:50px;max-width:140px;object-fit:contain;margin-bottom:8px;display:block"/>` : ''}
      <div style="font-size:18px;font-weight:800">${officeData.nome || 'Minha Oficina'}</div>
    </div>
    <div style="text-align:right">
      <div style="background:#4f46e5;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;text-transform:uppercase;letter-spacing:.5px">Relatório Financeiro</div>
      <div style="font-size:13px;color:#64748b;margin-top:6px;font-weight:600">${MESES[mes]} ${ano}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${[
      { label: 'Receitas', value: formatCurrency(totalReceitas), color: '#4f46e5' },
      { label: 'Lucro Bruto', value: formatCurrency(totalLucroOS), color: '#10b981' },
      { label: 'Despesas', value: formatCurrency(totalDespesas), color: '#ef4444' },
      { label: 'Lucro Líquido', value: formatCurrency(lucroLiquido), color: lucroLiquido >= 0 ? '#10b981' : '#ef4444' },
    ].map(c => `
      <div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">${c.label}</div>
        <div style="font-size:16px;font-weight:800;color:${c.color}">${c.value}</div>
      </div>`).join('')}
  </div>

  ${deliveredOS.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">${deliveredOS.length} OS entregues</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Placa</th>
        <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Modelo</th>
        <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Cliente</th>
        <th style="padding:8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Total</th>
      </tr></thead>
      <tbody>${osRows}</tbody>
    </table>
  </div>` : ''}

  ${expenses.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px">${expenses.length} despesas</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Descrição</th>
        <th style="padding:8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Valor</th>
      </tr></thead>
      <tbody>${expRows}</tbody>
    </table>
  </div>` : ''}

  <div style="background:${lucroLiquido >= 0 ? '#4f46e5' : '#ef4444'};color:white;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:8px">
    <span style="font-weight:600;font-size:14px">Lucro Líquido — ${MESES[mes]} ${ano}</span>
    <span style="font-weight:800;font-size:20px">${formatCurrency(lucroLiquido)}</span>
  </div>
  <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px">Gerado por BoxCerto &bull; boxcerto.com</div>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { showToast('Permita pop-ups para gerar o relatório.', 'warning'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export default function Financeiro() {
  const { user } = useAuth()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [ano, setAno] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState([])
  const [deliveredOS, setDeliveredOS] = useState([])
  const [vendas, setVendas] = useState([])
  const [prevLucro, setPrevLucro] = useState(null) // previous month net profit
  const [serie, setSerie] = useState([])           // últimos 6 meses (lucro OS) p/ mini-gráfico
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExp, setNewExp] = useState({ descricao: '', valor: '' })
  const [expError, setExpError] = useState('')
  const [triedExp, setTriedExp] = useState(false)
  const expBorder = (val) => triedExp && !String(val || '').trim()
    ? 'border-red-400 focus:border-red-400'
    : 'border-indigo-200 focus:border-indigo-400'
  const [officeData, setOfficeData] = useState({})
  const [revertingId, setRevertingId] = useState(null)
  const [showRevertConfirm, setShowRevertConfirm] = useState(null) // os object
  const [vendaExpandida, setVendaExpandida] = useState(null)        // vendaId
  const [revertingVendaId, setRevertingVendaId] = useState(null)
  const [showRevertVenda, setShowRevertVenda] = useState(null)      // venda object

  const getPrevMonth = (m, y) => m === 0 ? { mes: 11, ano: y - 1 } : { mes: m - 1, ano: y }

  const reload = async () => {
    const { mes: pm, ano: py } = getPrevMonth(mes, ano)
    const [exp, allOS, prevExp, od, vendasMes, prevVendas] = await Promise.all([
      expenseStorage.getByMonth(user.oficina, mes, ano),
      osStorage.getAll(user.oficina),
      expenseStorage.getByMonth(user.oficina, pm, py),
      officeDataStorage.get(user.oficina),
      vendaStorage.getByMonth(mes, ano),
      vendaStorage.getByMonth(pm, py),
    ])
    setOfficeData(od || {})
    setExpenses(exp)
    setVendas(vendasMes)

    const filterByMonth = (osList, m, y) => osList.filter(os => {
      if (os.status !== 'entregue' || !os.deliveredAt) return false
      const d = new Date(os.deliveredAt)
      return d.getMonth() === m && d.getFullYear() === y
    })

    const delivered = filterByMonth(allOS, mes, ano)
    setDeliveredOS(delivered)

    // Previous month comparison (OS + vendas)
    const prevDelivered = filterByMonth(allOS, pm, py)
    const prevReceitas = prevDelivered.reduce((s, os) => s + os.totals.venda, 0)
    const prevCustos   = prevDelivered.reduce((s, os) => s + os.totals.custo, 0)
    const prevLucroOS  = prevReceitas - prevCustos
    const prevDespesas = prevExp.reduce((s, e) => s + e.valor, 0)
    const prevVendasReceita = prevVendas.reduce((s, v) => s + v.total, 0)
    const prevVendasCusto   = prevVendas.reduce((s, v) => s + v.items.reduce((si, i) => si + (i.custo || 0) * i.quantidade, 0), 0)
    const prevVendasLucro   = prevVendasReceita - prevVendasCusto
    setPrevLucro(prevLucroOS + prevVendasLucro - prevDespesas)

    // Série dos últimos 6 meses (lucro de serviços/OS) para o mini-gráfico
    const s = []
    for (let i = 5; i >= 0; i--) {
      let mm = mes - i, yy = ano
      while (mm < 0) { mm += 12; yy -= 1 }
      const del = filterByMonth(allOS, mm, yy)
      const rec = del.reduce((acc, os) => acc + os.totals.venda, 0)
      const cus = del.reduce((acc, os) => acc + os.totals.custo, 0)
      s.push({ mes: mm, ano: yy, valor: rec - cus })
    }
    setSerie(s)
  }

  useEffect(() => { reload() }, [mes, ano, user.oficina])

  const osReceitas    = deliveredOS.reduce((s, os) => s + os.totals.venda, 0)
  const totalCustos   = deliveredOS.reduce((s, os) => s + os.totals.custo, 0)
  const osLucro       = deliveredOS.reduce((s, os) => s + os.totals.lucro, 0)
  const vendasReceita = vendas.reduce((s, v) => s + v.total, 0)
  const vendasCusto   = vendas.reduce((s, v) => s + v.items.reduce((si, i) => si + (i.custo || 0) * i.quantidade, 0), 0)
  const vendasLucro   = vendasReceita - vendasCusto
  const totalReceitas = osReceitas + vendasReceita
  const totalLucroOS  = osLucro + vendasLucro
  const totalDespesas = expenses.reduce((s, e) => s + e.valor, 0)
  const lucroLiquido  = totalLucroOS - totalDespesas

  // Diferença absoluta vs mês anterior (mais clara que % — evita o "-99%" estranho)
  const delta     = prevLucro !== null ? lucroLiquido - prevLucro : null
  const animLucro = useCountUp(lucroLiquido)

  const addExpense = async () => {
    if (!newExp.descricao || !newExp.valor) { setTriedExp(true); return setExpError('Preencha todos os campos.') }
    setTriedExp(false)
    await expenseStorage.add({ officeName: user.oficina, descricao: newExp.descricao, valor: parseFloat(newExp.valor), mes, ano })
    setNewExp({ descricao: '', valor: '' })
    setExpError('')
    setShowAddExp(false)
    await reload()
    showSaveCheck('Despesa adicionada!')
  }

  const prevMonth = () => {
    if (mes === 0) { setMes(11); setAno(ano - 1) }
    else setMes(mes - 1)
  }

  const nextMonth = () => {
    if (mes === 11) { setMes(0); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  const handleRevert = async (os) => {
    setRevertingId(os.id)
    await osStorage.revertDelivery(os.id)
    setShowRevertConfirm(null)
    setRevertingId(null)
    await reload()
  }

  const handleRevertVenda = async (venda) => {
    setRevertingVendaId(venda.id)
    try {
      await vendaStorage.reverter(venda.id)
    } catch (e) { /* silencia */ }
    setShowRevertVenda(null)
    setRevertingVendaId(null)
    setVendaExpandida(null)
    await reload()
  }

  const handlePrint = () => {
    printFinanceiro({
      mes, ano, totalReceitas, totalLucroOS, totalDespesas, lucroLiquido,
      deliveredOS, expenses, officeData: { nome: user.oficina, ...officeData },
    })
  }

  return (
    <div className="p-4 pb-36 space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">‹</button>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">{MESES[mes]} {ano}</h2>
          <button onClick={handlePrint} title="Imprimir relatório" aria-label="Imprimir relatório"
            className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors">
            <Printer className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">›</button>
      </div>

      {/* Card Lucro Líquido — polido */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-indigo-200/50"
        style={{ background: lucroLiquido >= 0
          ? 'linear-gradient(135deg,#6366f1 0%,#4f46e5 45%,#4338ca 100%)'
          : 'linear-gradient(135deg,#fb7185 0%,#ef4444 50%,#dc2626 100%)' }}>
        {/* glows decorativos */}
        <span className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/[0.06] blur-2xl" />

        <div className="relative flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-medium mb-1">Lucro Líquido do Mês</p>
            <p className="text-4xl font-bold mb-2 tracking-tight">{formatCurrency(animLucro)}</p>
            {delta !== null && delta !== 0 && (
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${delta > 0 ? 'bg-green-400/25 text-green-50' : 'bg-black/20 text-white/90'}`}>
                {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(delta))} vs mês anterior
              </div>
            )}
            {delta === 0 && prevLucro !== null && (
              <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90">
                igual ao mês anterior
              </div>
            )}
          </div>
          <MiniBars serie={serie} />
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-center mt-5">
          <div>
            <p className="text-white/60 text-xs">Receitas</p>
            <p className="font-bold text-sm">{formatCurrency(totalReceitas)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Custos Peças</p>
            <p className="font-bold text-sm">{formatCurrency(totalCustos)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Despesas</p>
            <p className="font-bold text-sm">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
      </div>

      {/* Conteúdo do mês — masonry 2 colunas no desktop */}
      <div className="space-y-4 lg:space-y-0 lg:columns-2 lg:gap-4">

      {/* Cards secundários */}
      <div className="grid grid-cols-2 gap-3 lg:mb-4 lg:break-inside-avoid">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500 font-medium">Lucro Bruto</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalLucroOS)}</p>
          <p className="text-xs text-slate-400 mt-1">{deliveredOS.length} OS · {vendas.length} venda{vendas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-500 font-medium">Total Despesas</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalDespesas)}</p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} lançamentos</p>
        </div>
      </div>

      {/* Despesas Fixas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:mb-4 lg:break-inside-avoid">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-900">Despesas do Mês</p>
          <button
            onClick={() => setShowAddExp(!showAddExp)}
            className="text-indigo-600 text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {showAddExp && (
          <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
            {expError && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />{expError}
              </div>
            )}
            <input
              type="text"
              placeholder="Ex: Aluguel, Luz, Internet..."
              value={newExp.descricao}
              onChange={(e) => setNewExp({ ...newExp, descricao: e.target.value })}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none bg-white transition-colors ${expBorder(newExp.descricao)}`}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Valor (R$)"
                value={newExp.valor}
                onChange={(e) => setNewExp({ ...newExp, valor: e.target.value })}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-sm focus:outline-none bg-white transition-colors ${expBorder(newExp.valor)}`}
              />
              <button
                onClick={addExpense}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Nenhuma despesa registrada</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-slate-700">{exp.descricao}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(exp.valor)}</span>
                  <button
                    onClick={async () => { await expenseStorage.remove(exp.id); await reload() }}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendas Avulsas */}
      {vendas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:mb-4 lg:break-inside-avoid">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-600" />
              <p className="text-sm font-bold text-slate-900">Vendas de Estoque</p>
            </div>
            <span className="text-xs text-slate-400">{vendas.length} venda{vendas.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1">
            {vendas.map(v => {
              const expanded = vendaExpandida === v.id
              const lucroV   = v.total - v.items.reduce((s, i) => s + (i.custo || 0) * i.quantidade, 0)
              const PLABELS  = { pix:'PIX', dinheiro:'Dinheiro', debito:'Débito', credito:'Crédito' }
              return (
                <div key={v.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Linha resumo — clicável */}
                  <button type="button" onClick={() => setVendaExpandida(expanded ? null : v.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {v.cliente || 'Venda anônima'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                        {v.pagamentos?.[0] ? ` · ${PLABELS[v.pagamentos[0].method] || v.pagamentos[0].method}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(v.total)}</p>
                      <p className="text-xs text-green-600">+{formatCurrency(lucroV)}</p>
                    </div>
                    {expanded
                      ? <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />}
                  </button>

                  {/* Detalhe expandido */}
                  {expanded && (
                    <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-2">
                      {/* Itens */}
                      <div className="space-y-1">
                        {v.items.map((i, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 truncate flex-1">{i.produto}</span>
                            <span className="text-slate-400 mx-3">x{i.quantidade}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(i.valorUnitario * i.quantidade)}</span>
                          </div>
                        ))}
                      </div>
                      {/* Desconto se houver */}
                      {v.desconto?.valor > 0 && (
                        <div className="flex justify-between text-xs text-slate-500 border-t border-gray-200 pt-1">
                          <span>Desconto</span>
                          <span className="text-red-500">− {formatCurrency(v.desconto.tipo === 'percent'
                            ? v.items.reduce((s,i)=>s+i.valorUnitario*i.quantidade,0) * v.desconto.valor / 100
                            : v.desconto.valor)}</span>
                        </div>
                      )}
                      {/* Pagamentos */}
                      {v.pagamentos.length > 1 && (
                        <div className="space-y-0.5 border-t border-gray-200 pt-1">
                          {v.pagamentos.map((p, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-500">
                              <span>{PLABELS[p.method] || p.method}</span>
                              <span>{formatCurrency(Number(p.amount))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Estornar */}
                      <button onClick={() => setShowRevertVenda(v)}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors pt-1">
                        <RotateCcw className="w-3 h-3" /> Estornar venda
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
            <p className="text-xs text-slate-500 font-medium">Total vendas</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(vendasReceita)}</p>
          </div>
        </div>
      )}

      {/* OS Entregues */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:mb-4 lg:break-inside-avoid">
        <p className="text-sm font-bold text-slate-900 mb-3">Carros Entregues no Mês</p>
        {deliveredOS.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Nenhum carro entregue ainda</p>
        ) : (
          <div className="space-y-3">
            {deliveredOS.map((os) => (
              <div key={os.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                  <span className="text-white text-xs font-bold plate-mercosul">{os.vehicle?.placa}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{os.vehicle?.modelo}</p>
                  <p className="text-xs text-slate-400 truncate">{os.client?.nome} · {os.deliveredAt ? formatDate(os.deliveredAt) : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(os.totals.venda)}</p>
                  <p className="text-xs text-green-600">+{formatCurrency(os.totals.lucro)}</p>
                </div>
                <button
                  onClick={() => setShowRevertConfirm(os)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Estornar entrega"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* fim masonry */}

      {/* Revert confirm modal */}
      {showRevertConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900">Estornar entrega?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-1">
              <strong>{showRevertConfirm.vehicle?.placa}</strong> · {showRevertConfirm.vehicle?.modelo}
            </p>
            <p className="text-sm text-slate-500 mb-5">Cancela o registro e volta o status para <strong>Pronto</strong>. O valor sairá deste mês.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRevertConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleRevert(showRevertConfirm)} disabled={!!revertingId}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">
                {revertingId ? 'Estornando...' : 'Sim, estornar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estorno de venda */}
      {showRevertVenda && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900">Estornar venda?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-1">
              <strong>{showRevertVenda.cliente || 'Venda anônima'}</strong> · {formatCurrency(showRevertVenda.total)}
            </p>
            <p className="text-sm text-slate-500 mb-5">
              Os produtos voltam ao estoque e o valor sai do financeiro deste mês.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRevertVenda(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleRevertVenda(showRevertVenda)} disabled={!!revertingVendaId}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">
                {revertingVendaId ? 'Estornando...' : 'Sim, estornar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

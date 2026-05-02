import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, Trash2, X, AlertCircle, Printer, RotateCcw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  osStorage, expenseStorage, officeDataStorage,
  formatCurrency, formatDate
} from '../../lib/storage'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

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
  if (!win) { alert('Permita pop-ups'); return }
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
  const [prevLucro, setPrevLucro] = useState(null) // previous month net profit
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExp, setNewExp] = useState({ descricao: '', valor: '' })
  const [expError, setExpError] = useState('')
  const [officeData, setOfficeData] = useState({})
  const [revertingId, setRevertingId] = useState(null)
  const [showRevertConfirm, setShowRevertConfirm] = useState(null) // os object

  const getPrevMonth = (m, y) => m === 0 ? { mes: 11, ano: y - 1 } : { mes: m - 1, ano: y }

  const reload = async () => {
    const { mes: pm, ano: py } = getPrevMonth(mes, ano)
    const [exp, allOS, prevExp, od] = await Promise.all([
      expenseStorage.getByMonth(user.oficina, mes, ano),
      osStorage.getAll(user.oficina),
      expenseStorage.getByMonth(user.oficina, pm, py),
      officeDataStorage.get(user.oficina),
    ])
    setOfficeData(od || {})
    setExpenses(exp)

    const filterByMonth = (osList, m, y) => osList.filter(os => {
      if (os.status !== 'entregue' || !os.deliveredAt) return false
      const d = new Date(os.deliveredAt)
      return d.getMonth() === m && d.getFullYear() === y
    })

    const delivered = filterByMonth(allOS, mes, ano)
    setDeliveredOS(delivered)

    // Previous month comparison
    const prevDelivered = filterByMonth(allOS, pm, py)
    const prevReceitas = prevDelivered.reduce((s, os) => s + os.totals.venda, 0)
    const prevCustos   = prevDelivered.reduce((s, os) => s + os.totals.custo, 0)
    const prevLucroOS  = prevReceitas - prevCustos
    const prevDespesas = prevExp.reduce((s, e) => s + e.valor, 0)
    setPrevLucro(prevLucroOS - prevDespesas)
  }

  useEffect(() => { reload() }, [mes, ano, user.oficina])

  const totalReceitas = deliveredOS.reduce((s, os) => s + os.totals.venda, 0)
  const totalCustos   = deliveredOS.reduce((s, os) => s + os.totals.custo, 0)
  const totalLucroOS  = deliveredOS.reduce((s, os) => s + os.totals.lucro, 0)
  const totalDespesas = expenses.reduce((s, e) => s + e.valor, 0)
  const lucroLiquido  = totalLucroOS - totalDespesas

  const lucroVariacao = prevLucro !== null && prevLucro !== 0
    ? ((lucroLiquido - prevLucro) / Math.abs(prevLucro)) * 100
    : null

  const addExpense = async () => {
    if (!newExp.descricao || !newExp.valor) return setExpError('Preencha todos os campos.')
    await expenseStorage.add({ officeName: user.oficina, descricao: newExp.descricao, valor: parseFloat(newExp.valor), mes, ano })
    setNewExp({ descricao: '', valor: '' })
    setExpError('')
    setShowAddExp(false)
    await reload()
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
          <button onClick={handlePrint} title="Imprimir relatório"
            className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors">
            <Printer className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">›</button>
      </div>

      {/* Card Lucro Líquido */}
      <div className={`rounded-2xl p-6 text-white ${lucroLiquido >= 0 ? 'bg-indigo-600' : 'bg-red-500'}`}>
        <p className="text-indigo-200 text-sm font-medium mb-1">Lucro Líquido do Mês</p>
        <p className="text-4xl font-bold mb-1">{formatCurrency(lucroLiquido)}</p>
        {/* Comparison with previous month */}
        {lucroVariacao !== null && (
          <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${lucroVariacao >= 0 ? 'bg-green-500/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
            {lucroVariacao >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {lucroVariacao >= 0 ? '+' : ''}{lucroVariacao.toFixed(0)}% vs mês anterior
          </div>
        )}
        {lucroVariacao === null && prevLucro !== null && prevLucro === 0 && (
          <p className="text-xs text-indigo-300 mb-3">Mês anterior: R$ 0</p>
        )}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-indigo-200 text-xs">Receitas</p>
            <p className="font-bold text-sm">{formatCurrency(totalReceitas)}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs">Custos Peças</p>
            <p className="font-bold text-sm">{formatCurrency(totalCustos)}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs">Despesas</p>
            <p className="font-bold text-sm">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500 font-medium">Lucro Bruto OS</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalLucroOS)}</p>
          <p className="text-xs text-slate-400 mt-1">{deliveredOS.length} carros entregues</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-500 font-medium">Total Despesas</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalDespesas)}</p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} lançamentos</p>
        </div>
      </div>

      {/* Despesas Fixas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
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
              className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Valor (R$)"
                value={newExp.valor}
                onChange={(e) => setNewExp({ ...newExp, valor: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
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

      {/* OS Entregues */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
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
    </div>
  )
}

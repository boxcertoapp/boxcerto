import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  osStorage, expenseStorage,
  formatCurrency, formatDate
} from '../../lib/storage'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function Financeiro() {
  const { user } = useAuth()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [ano, setAno] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState([])
  const [deliveredOS, setDeliveredOS] = useState([])
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExp, setNewExp] = useState({ descricao: '', valor: '' })
  const [expError, setExpError] = useState('')

  const reload = async () => {
    const [exp, allOS] = await Promise.all([
      expenseStorage.getByMonth(user.oficina, mes, ano),
      osStorage.getAll(user.oficina),
    ])
    setExpenses(exp)
    const delivered = allOS.filter((os) => {
      if (os.status !== 'entregue' || !os.deliveredAt) return false
      const d = new Date(os.deliveredAt)
      return d.getMonth() === mes && d.getFullYear() === ano
    })
    setDeliveredOS(delivered)
  }

  useEffect(() => { reload() }, [mes, ano, user.oficina])

  const totalReceitas = deliveredOS.reduce((s, os) => s + os.totals.venda, 0)
  const totalCustos = deliveredOS.reduce((s, os) => s + os.totals.custo, 0)
  const totalLucroOS = deliveredOS.reduce((s, os) => s + os.totals.lucro, 0)
  const totalDespesas = expenses.reduce((s, e) => s + e.valor, 0)
  const lucroLiquido = totalLucroOS - totalDespesas

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

  return (
    <div className="p-4 pb-36 space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">‹</button>
        <h2 className="text-base font-bold text-slate-900">{MESES[mes]} {ano}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">›</button>
      </div>

      {/* Card Lucro Líquido */}
      <div className={`rounded-2xl p-6 text-white ${lucroLiquido >= 0 ? 'bg-indigo-600' : 'bg-red-500'}`}>
        <p className="text-indigo-200 text-sm font-medium mb-1">Lucro Líquido do Mês</p>
        <p className="text-4xl font-bold mb-4">{formatCurrency(lucroLiquido)}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

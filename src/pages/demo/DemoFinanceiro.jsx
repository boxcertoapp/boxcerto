/**
 * DemoFinanceiro — espelha Financeiro.jsx com dados fictícios
 */
import { useState } from 'react'
import { TrendingUp, TrendingDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDemoModal } from './DemoLayout'
import { DEMO_FINANCEIRO, DEMO_MESES_KEYS, DEMO_MESES_LABELS } from './demoData'

function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}
function fmtDate(s) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export default function DemoFinanceiro() {
  const { open } = useDemoModal()
  const [mesIdx, setMesIdx]  = useState(DEMO_MESES_KEYS.length - 1)  // maio (atual)
  const [aba, setAba]        = useState('receitas')

  const mesKey   = DEMO_MESES_KEYS[mesIdx]
  const mesLabel = DEMO_MESES_LABELS[mesKey]
  const dados    = DEMO_FINANCEIRO[mesKey]

  const lucroLiquido = dados.totalReceitas - dados.totalDespesas
  const positivo     = lucroLiquido >= 0

  const cards = [
    { label: 'Receitas',      valor: dados.totalReceitas, cor: 'text-indigo-600', bg: 'bg-indigo-50',  icon: TrendingUp },
    { label: 'Despesas',      valor: dados.totalDespesas, cor: 'text-red-500',    bg: 'bg-red-50',     icon: TrendingDown },
    { label: 'Lucro Líquido', valor: lucroLiquido, cor: positivo ? 'text-emerald-600' : 'text-red-500',
      bg: positivo ? 'bg-emerald-50' : 'bg-red-50', icon: positivo ? TrendingUp : TrendingDown },
  ]

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[80px] lg:top-[36px] bg-white border-b border-gray-100 z-30 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-extrabold text-slate-900">Financeiro</h1>
          <button onClick={() => open('Adicionar despesa')}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Despesa
          </button>
        </div>

        {/* Seletor de mês */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <button onClick={() => setMesIdx(i => Math.max(0, i - 1))} disabled={mesIdx === 0}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-900">{mesLabel}</span>
          <button onClick={() => setMesIdx(i => Math.min(DEMO_MESES_KEYS.length - 1, i + 1))}
            disabled={mesIdx === DEMO_MESES_KEYS.length - 1}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-2">
          {cards.map(c => {
            const Icon = c.icon
            return (
              <div key={c.label} className={`${c.bg} rounded-2xl p-3 text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${c.cor}`} />
                <p className={`text-sm font-extrabold ${c.cor}`}>{fmtCurrency(c.valor)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.label}</p>
              </div>
            )
          })}
        </div>

        {/* Barra de resultado */}
        <div className={`rounded-2xl px-5 py-4 flex items-center justify-between ${positivo ? 'bg-emerald-600' : 'bg-red-500'}`}>
          <div>
            <p className="text-white/70 text-xs font-semibold">Resultado do mês</p>
            <p className="text-white font-extrabold text-xl">{fmtCurrency(lucroLiquido)}</p>
          </div>
          <div className={`text-4xl font-black ${positivo ? 'text-emerald-300' : 'text-red-300'}`}>
            {positivo ? '↑' : '↓'}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key: 'receitas', label: `Receitas (${dados.receitas.length})` },
            { key: 'despesas', label: `Despesas (${dados.despesas.length})` },
          ].map(a => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                aba === a.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {aba === 'receitas' && (
          <div className="space-y-2">
            {dados.receitas.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.descricao}</p>
                    <p className="text-xs text-slate-400">{fmtDate(r.data)} · {r.placa}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-600 shrink-0 ml-3">{fmtCurrency(r.valor)}</p>
              </div>
            ))}
            {dados.receitas.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhuma receita neste mês ainda.</p>
            )}
          </div>
        )}

        {aba === 'despesas' && (
          <div className="space-y-2">
            {dados.despesas.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{d.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{fmtDate(d.data)}</p>
                      <span className="text-[10px] bg-gray-100 text-slate-500 px-1.5 py-0.5 rounded-full">{d.categoria}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <p className="text-sm font-bold text-red-500">{fmtCurrency(d.valor)}</p>
                  <button onClick={() => open('Excluir despesa')}
                    className="text-slate-300 hover:text-red-400 transition-colors">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {dados.despesas.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhuma despesa neste mês.</p>
            )}

            {/* Botão adicionar despesa */}
            <button onClick={() => open('Adicionar despesa')}
              className="w-full border-2 border-dashed border-gray-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 rounded-2xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar despesa
            </button>
          </div>
        )}

        {/* Imprimir relatório */}
        <button onClick={() => open('Imprimir relatório financeiro do mês')}
          className="w-full border border-gray-200 text-slate-500 text-sm font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
          Imprimir Relatório — {mesLabel}
        </button>
      </div>
    </div>
  )
}

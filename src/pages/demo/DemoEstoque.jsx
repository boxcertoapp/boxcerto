/**
 * DemoEstoque — espelha Estoque.jsx com dados fictícios
 */
import { useState } from 'react'
import { Search, Plus, AlertTriangle, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useDemoModal } from './DemoLayout'
import { DEMO_ESTOQUE } from './demoData'

function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}

const CATEGORIAS = ['Todas', 'Freios', 'Filtros', 'Motor', 'Suspensão', 'Ignição', 'Lubrificante', 'Refrigeração']

function StockBar({ quantidade, minimo }) {
  const pct    = Math.min(100, (quantidade / Math.max(minimo * 2, 1)) * 100)
  const critico = quantidade < minimo
  const baixo   = quantidade <= minimo * 1.2 && !critico
  const cor     = critico ? 'bg-red-500' : baixo ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
      <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function DemoEstoque() {
  const { open }   = useDemoModal()
  const [busca, setBusca]         = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [expandido, setExpandido] = useState(null)

  const criticos = DEMO_ESTOQUE.filter(p => p.quantidade < p.minimo)
  const baixos   = DEMO_ESTOQUE.filter(p => p.quantidade <= p.minimo * 1.2 && p.quantidade >= p.minimo)

  const lista = DEMO_ESTOQUE.filter(p => {
    const matchCat  = categoria === 'Todas' || p.categoria === categoria
    const matchBusca = busca === '' ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.marca.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[80px] lg:top-[36px] bg-white border-b border-gray-100 z-30 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Estoque</h1>
            <p className="text-xs text-slate-400">{DEMO_ESTOQUE.length} produtos cadastrados</p>
          </div>
          <button onClick={() => open('Cadastrar novo produto')}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Produto
          </button>
        </div>

        {/* Alertas */}
        {(criticos.length > 0 || baixos.length > 0) && (
          <div className="flex gap-2 mb-3">
            {criticos.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticos.length} sem estoque
              </div>
            )}
            {baixos.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5" />
                {baixos.length} estoque baixo
              </div>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto, marca ou código…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white"
          />
        </div>

        {/* Categorias */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setCategoria(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                categoria === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pt-3 space-y-2">
        {lista.map(p => {
          const aberto  = expandido === p.id
          const critico = p.quantidade < p.minimo
          const baixo   = p.quantidade <= p.minimo * 1.2 && !critico

          return (
            <div key={p.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                critico ? 'border-red-200' : baixo ? 'border-amber-200' : 'border-gray-100'
              }`}>
              <button onClick={() => setExpandido(aberto ? null : p.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  critico ? 'bg-red-50' : baixo ? 'bg-amber-50' : 'bg-indigo-50'
                }`}>
                  <Package className={`w-4 h-4 ${
                    critico ? 'text-red-500' : baixo ? 'text-amber-500' : 'text-indigo-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.nome}</p>
                    {critico && (
                      <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full shrink-0">CRÍTICO</span>
                    )}
                    {baixo && (
                      <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full shrink-0">BAIXO</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{p.marca} · {p.categoria}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StockBar quantidade={p.quantidade} minimo={p.minimo} />
                    <span className={`text-xs font-bold ${
                      critico ? 'text-red-500' : baixo ? 'text-amber-500' : 'text-emerald-600'
                    }`}>{p.quantidade} un</span>
                    <span className="text-[10px] text-slate-300">/ mín {p.minimo}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{fmtCurrency(p.venda)}</p>
                  <p className="text-[10px] text-slate-400">venda</p>
                </div>
                {aberto
                  ? <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />}
              </button>

              {/* Detalhe */}
              {aberto && (
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">Custo</p>
                      <p className="text-sm font-bold text-slate-700">{fmtCurrency(p.custo)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">Venda</p>
                      <p className="text-sm font-bold text-indigo-600">{fmtCurrency(p.venda)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">Margem</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {Math.round(((p.venda - p.custo) / p.custo) * 100)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Código: <span className="font-mono font-bold text-slate-600">{p.codigo}</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => open('Registrar entrada de estoque')}
                      className="flex-1 bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl hover:bg-emerald-600 transition-colors">
                      + Entrada
                    </button>
                    <button onClick={() => open('Registrar saída de estoque')}
                      className="flex-1 bg-slate-700 text-white text-xs font-bold py-2 rounded-xl hover:bg-slate-800 transition-colors">
                      – Saída
                    </button>
                    <button onClick={() => open('Editar produto')}
                      className="flex-1 border border-gray-200 text-slate-600 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {lista.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}

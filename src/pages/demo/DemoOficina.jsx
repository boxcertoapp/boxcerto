/**
 * DemoOficina — espelha Oficina.jsx com dados fictícios
 */
import { useState } from 'react'
import {
  Plus, Search, ChevronDown, ChevronUp, Car, MessageCircle,
  Wrench, Package, Check, Clock, Flag, X
} from 'lucide-react'
import { useDemoModal } from './DemoLayout'
import { DEMO_OS, STATUS_LABELS, STATUS_COLORS, STATUS_DOT } from './demoData'

const WPP = '53997065725'

function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}

function fmtDate(s) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function iniciais(nome) {
  const parts = (nome || '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const FILTROS = [
  { key: 'todos',      label: 'Todas'      },
  { key: 'orcamento',  label: 'Orçamento'  },
  { key: 'aprovado',   label: 'Aprovado'   },
  { key: 'em_servico', label: 'Em Serviço' },
  { key: 'pronto',     label: 'Pronto'     },
  { key: 'entregue',   label: 'Entregue'   },
]

function OSDetail({ os, onClose }) {
  const { open } = useDemoModal()
  const totalPecas = os.servicos.filter(s => s.tipo === 'pecas').reduce((a, s) => a + s.valor, 0)
  const totalServ  = os.servicos.filter(s => s.tipo === 'servico').reduce((a, s) => a + s.valor, 0)

  return (
    <div className="bg-gray-50 border-t border-b border-gray-100 px-4 py-4 space-y-4">

      {/* Serviços */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Serviços e Peças</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {os.servicos.map((s, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < os.servicos.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {s.tipo === 'pecas'
                  ? <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  : <Wrench  className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                <span className="text-sm text-slate-700 truncate">{s.descricao}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 shrink-0 ml-3">{fmtCurrency(s.valor)}</span>
            </div>
          ))}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Peças</span><span>{fmtCurrency(totalPecas)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Mão de obra</span><span>{fmtCurrency(totalServ)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{fmtCurrency(os.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      {os.obs && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações</p>
          <p className="text-sm text-slate-600">{os.obs}</p>
        </div>
      )}

      {/* Km */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Car className="w-3.5 h-3.5" />
        <span>KM na entrada: <strong className="text-slate-600">{os.km?.toLocaleString('pt-BR')} km</strong></span>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        {os.status !== 'entregue' && (
          <button
            onClick={() => open('Atualizar status da OS')}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Atualizar status
          </button>
        )}
        <button
          onClick={() => open('Enviar mensagem pelo WhatsApp')}
          className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        {os.status === 'orcamento' && (
          <button
            onClick={() => open('Enviar link de aprovação para o cliente')}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" /> Enviar orçamento
          </button>
        )}
        <button
          onClick={() => open('Imprimir OS')}
          className="flex items-center gap-1.5 border border-gray-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Imprimir OS
        </button>
      </div>
    </div>
  )
}

export default function DemoOficina() {
  const { open } = useDemoModal()
  const [filtro, setFiltro]   = useState('todos')
  const [busca, setBusca]     = useState('')
  const [expandido, setExpandido] = useState(null)

  const lista = DEMO_OS.filter(os => {
    const matchFiltro = filtro === 'todos' || os.status === filtro
    const matchBusca  = busca === '' ||
      os.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      os.placa.toLowerCase().includes(busca.toLowerCase()) ||
      os.veiculo.toLowerCase().includes(busca.toLowerCase()) ||
      String(os.numero).includes(busca)
    return matchFiltro && matchBusca
  })

  const contadores = FILTROS.reduce((acc, f) => {
    acc[f.key] = f.key === 'todos' ? DEMO_OS.length : DEMO_OS.filter(o => o.status === f.key).length
    return acc
  }, {})

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[80px] lg:top-[36px] bg-white border-b border-gray-100 z-30 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Oficina</h1>
            <p className="text-xs text-slate-400">{DEMO_OS.length} ordens de serviço</p>
          </div>
          <button
            onClick={() => open('Criar nova OS')}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova OS
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por cliente, placa, veículo ou nº…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FILTROS.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filtro === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
              }`}>
              {f.label}
              {contadores[f.key] > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtro === f.key ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                  {contadores[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pt-3 space-y-2">
        {lista.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma OS encontrada.</p>
          </div>
        )}

        {lista.map(os => {
          const aberto = expandido === os.id
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card cabeçalho */}
              <button
                onClick={() => setExpandido(aberto ? null : os.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {iniciais(os.cliente)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-400">#{os.numero}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[os.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[os.status]}`} />
                      {STATUS_LABELS[os.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{os.cliente}</p>
                  <p className="text-xs text-slate-400 truncate">{os.veiculo} · {os.placa}</p>
                </div>

                {/* Valor + seta */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{fmtCurrency(os.total)}</p>
                  <p className="text-[10px] text-slate-400">{fmtDate(os.data)}</p>
                </div>
                {aberto
                  ? <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />}
              </button>

              {/* Detalhe expandido */}
              {aberto && <OSDetail os={os} onClose={() => setExpandido(null)} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

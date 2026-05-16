/**
 * DemoHistorico — espelha Historico.jsx com dados fictícios
 */
import { useState } from 'react'
import { Search, Plus, Phone, Car, ChevronRight, ChevronDown, Clock } from 'lucide-react'
import { useDemoModal } from './DemoLayout'
import { DEMO_CLIENTES, DEMO_OS, STATUS_LABELS, STATUS_COLORS } from './demoData'

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

const CORES_AVATAR = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
]

export default function DemoHistorico() {
  const { open } = useDemoModal()
  const [busca, setBusca]     = useState('')
  const [selecionado, setSelecionado] = useState(null)

  const clientes = DEMO_CLIENTES.filter(c =>
    busca === '' ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.veiculo.placa.toLowerCase().includes(busca.toLowerCase()) ||
    c.veiculo.modelo.toLowerCase().includes(busca.toLowerCase())
  )

  const osDoCliente = (clienteId) => {
    const cl = DEMO_CLIENTES.find(c => c.id === clienteId)
    if (!cl) return []
    return DEMO_OS.filter(os => os.cliente === cl.nome)
  }

  if (selecionado) {
    const cl   = DEMO_CLIENTES.find(c => c.id === selecionado)
    const hist = osDoCliente(selecionado)
    const totalGasto = hist.filter(os => os.status === 'entregue').reduce((a, os) => a + os.total, 0)
    const corIdx = DEMO_CLIENTES.indexOf(cl) % CORES_AVATAR.length

    return (
      <div className="pb-6">
        {/* Header cliente */}
        <div className="sticky top-[80px] lg:top-[36px] bg-white border-b border-gray-100 z-30 px-4 pt-4 pb-3">
          <button onClick={() => setSelecionado(null)}
            className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-3">
            ← Voltar aos clientes
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${CORES_AVATAR[corIdx]}`}>
              {iniciais(cl.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">{cl.nome}</p>
              <p className="text-xs text-slate-400">{cl.veiculo.modelo} · {cl.veiculo.placa}</p>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-slate-900">{hist.length}</p>
              <p className="text-[10px] text-slate-400">OS total</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-emerald-600">{fmtCurrency(totalGasto)}</p>
              <p className="text-[10px] text-slate-400">Total gasto</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-slate-900">{fmtDate(cl.ultimaVisita)}</p>
              <p className="text-[10px] text-slate-400">Última visita</p>
            </div>
          </div>
        </div>

        {/* Info do veículo */}
        <div className="px-4 pt-4">
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-5 h-5 text-slate-300" />
              <p className="text-white font-bold text-sm">{cl.veiculo.modelo}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-slate-400 text-[10px]">PLACA</p>
                <p className="text-white font-bold text-sm tracking-widest">{cl.veiculo.placa}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">ANO</p>
                <p className="text-white font-bold text-sm">{cl.veiculo.ano}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">COR</p>
                <p className="text-white font-bold text-sm">{cl.veiculo.cor}</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => open('Enviar mensagem pelo WhatsApp')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-emerald-600 transition-colors">
              📱 WhatsApp
            </button>
            <button onClick={() => open('Criar nova OS para este cliente')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Nova OS
            </button>
            <button onClick={() => open('Editar dados do cliente')}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-slate-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              Editar
            </button>
          </div>

          {/* Histórico de OS */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Histórico de OS</p>
          {hist.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhuma OS encontrada.</p>
          ) : (
            <div className="space-y-2">
              {hist.map(os => (
                <div key={os.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-slate-400 font-bold">#{os.numero}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[os.status]}`}>
                        {STATUS_LABELS[os.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate">
                      {os.servicos.map(s => s.descricao).join(', ')}
                    </p>
                    <p className="text-[11px] text-slate-400">{fmtDate(os.data)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{fmtCurrency(os.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[80px] lg:top-[36px] bg-white border-b border-gray-100 z-30 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Histórico</h1>
            <p className="text-xs text-slate-400">{DEMO_CLIENTES.length} clientes cadastrados</p>
          </div>
          <button onClick={() => open('Cadastrar novo cliente')}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Cliente
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, placa ou veículo…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pt-3 space-y-2">
        {clientes.map((cl, idx) => {
          const corIdx = idx % CORES_AVATAR.length
          const nOS = osDoCliente(cl.id).length
          return (
            <button key={cl.id} onClick={() => setSelecionado(cl.id)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors text-left">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${CORES_AVATAR[corIdx]}`}>
                {iniciais(cl.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{cl.nome}</p>
                <p className="text-xs text-slate-400 truncate">{cl.veiculo.modelo} · {cl.veiculo.placa}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-indigo-600">{nOS} OS</p>
                <p className="text-[10px] text-slate-400">{fmtDate(cl.ultimaVisita)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          )
        })}
        {clientes.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}

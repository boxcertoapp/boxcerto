/**
 * TecnicoOficina — Área de trabalho do técnico (Bloco 1 completo)
 *
 * ✅ Checklist de tarefas com barra de progresso
 * ✅ Notas internas estilo chat (separado do cliente)
 * ✅ Filtro inteligente: minhas OS + sem técnico
 * ✅ Sinalizar problema (flag vermelho visível ao gerente)
 * ✅ Prioridade/Urgência (badge + destaque)
 * ✅ Histórico do veículo (modal simples)
 * ✅ Ver serviços/itens da OS
 * ❌ WhatsApp / contato do cliente
 * ❌ Financeiro / estoque / entregar OS
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Wrench, X, Loader2, CheckCircle2, Circle, AlertTriangle,
  MessageSquare, ClipboardList, Package, ChevronRight,
  Send, Plus, Trash2, Clock, History, Flag,
  TriangleAlert, UserCheck, ChevronDown, Check,
  Search, ChevronLeft, ChevronUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { osStorage, itemStorage, formatCurrency, formatDate } from '../../lib/storage'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ── Helpers ────────────────────────────────────────────────────
const iniciais = (nome = '') =>
  nome.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'

const fmtHora = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_INFO = {
  orcamento:  { label: 'Orçamento',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  manutencao: { label: 'Em Serviço',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'  },
  pronto:     { label: 'Pronto',      bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  entregue:   { label: 'Entregue',    bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'border-gray-200'  },
}

// ── Fetch OS com joins ─────────────────────────────────────────
async function fetchOS() {
  const [osRes, vehiclesRes, clientsRes, itemsRes] = await Promise.all([
    supabase.from('service_orders')
      .select('*')
      .neq('status', 'entregue')
      .order('urgente', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase.from('vehicles').select('*'),
    supabase.from('clients').select('id, nome'),
    supabase.from('service_items').select('*'),
  ])

  const vehicles = vehiclesRes.data || []
  const clients  = clientsRes.data  || []
  const items    = itemsRes.data    || []

  return (osRes.data || []).map(os => {
    const vehicle  = vehicles.find(v => v.id === os.vehicle_id) || {}
    const client   = clients.find(c => c.id === vehicle.client_id) || {}
    const osItems  = items.filter(i => i.os_id === os.id)
    const total    = osItems.reduce((s, i) => s + Number(i.venda || 0), 0)
    return {
      id:           os.id,
      vehicleId:    os.vehicle_id,
      status:       os.status,
      km:           os.km || '',
      observacoes:  os.observacoes || '',
      tecnico:      os.tecnico || '',
      userId:       os.user_id,
      createdAt:    os.created_at,
      updatedAt:    os.updated_at,
      placa:        vehicle.placa || '---',
      modelo:       vehicle.modelo || '',
      clienteNome:  client.nome || '',
      // Bloco 1
      checklist:    os.checklist      || [],
      notasInternas:os.notas_internas || [],
      urgente:      os.urgente        || false,
      problemaFlag: os.problema_flag  || false,
      items: osItems.map(i => ({
        id:       i.id,
        descricao:i.descricao,
        custo:    Number(i.custo || 0),
        venda:    Number(i.venda || 0),
        garantia: i.garantia || '',
      })),
      total,
    }
  })
}

// ── Barra de progresso ─────────────────────────────────────────
function ProgressBar({ checklist }) {
  if (!checklist?.length) return null
  const total  = checklist.length
  const feitos = checklist.filter(t => t.feito).length
  const pct    = Math.round((feitos / total) * 100)
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{feitos}/{total} tarefas</span>
        <span className="text-xs font-semibold text-indigo-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Card de OS na lista ────────────────────────────────────────
function OSCard({ os, meNome, podeAssumir, onOpen, onAssumir }) {
  const st = STATUS_INFO[os.status] || STATUS_INFO.orcamento
  const ehMinha   = os.tecnico?.toLowerCase() === meNome?.toLowerCase()
  const semTecnico = !os.tecnico

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-all active:scale-[0.99] ${
        os.urgente ? 'border-red-300' : 'border-gray-100'
      }`}
    >
      {/* Banner urgente */}
      {os.urgente && (
        <div className="bg-red-500 px-4 py-1.5 flex items-center gap-2">
          <TriangleAlert className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="text-xs font-bold text-white tracking-wide">URGENTE</span>
        </div>
      )}

      <button className="w-full text-left p-4" onClick={() => onOpen(os)}>
        {/* Placa + model */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="font-black text-slate-900 text-lg tracking-wider font-mono">{os.placa}</span>
            {os.modelo && <span className="text-slate-500 text-sm ml-2">{os.modelo}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {os.problemaFlag && (
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                <Flag className="w-3 h-3 text-amber-600" />
              </div>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Cliente */}
        {os.clienteNome && (
          <p className="text-xs text-slate-400 mb-2">{os.clienteNome}</p>
        )}

        {/* Progress bar */}
        <ProgressBar checklist={os.checklist} />

        {/* Rodapé: técnico + notas */}
        <div className="flex items-center justify-between mt-2">
          {ehMinha ? (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              ✓ Minha OS
            </span>
          ) : semTecnico ? (
            <span className="text-xs text-slate-400">Sem técnico</span>
          ) : (
            <span className="text-xs text-slate-400">{os.tecnico}</span>
          )}
          {os.notasInternas?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MessageSquare className="w-3 h-3" />
              {os.notasInternas.length}
            </span>
          )}
        </div>
      </button>

      {/* Botão assumir */}
      {semTecnico && podeAssumir && (
        <button
          onClick={() => onAssumir(os)}
          className="w-full py-2.5 border-t border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          + Assumir esta OS
        </button>
      )}
    </div>
  )
}

// ── Modal histórico do veículo ─────────────────────────────────
function HistoricoModal({ os, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!os.vehicleId) { setLoading(false); return }
    osStorage.getVehicleHistory(os.vehicleId, os.id).then(data => {
      setHistory(data)
      setLoading(false)
    })
  }, [os.vehicleId, os.id])

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-bold text-slate-900">Histórico — {os.placa}</p>
            <p className="text-xs text-slate-400 mt-0.5">{os.modelo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Primeiro atendimento deste veículo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(h => (
                <div key={h.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{formatDate(h.createdAt)}</span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(h.total)}
                    </span>
                  </div>
                  {h.km && (
                    <p className="text-xs text-slate-400 mb-2">KM: {h.km}</p>
                  )}
                  {h.items.length > 0 && (
                    <div className="space-y-1">
                      {h.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                          {item.descricao}
                        </div>
                      ))}
                    </div>
                  )}
                  {h.observacoes && (
                    <p className="text-xs text-slate-400 mt-2 italic">{h.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Histórico de Serviços ─────────────────────────────────
function HistoricoTab({ meNome }) {
  const now = new Date()
  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [usaMes, setUsaMes]     = useState(false)
  const [mesFiltro, setMesFiltro] = useState(now.getMonth())
  const [anoFiltro, setAnoFiltro] = useState(now.getFullYear())
  const [busca, setBusca]       = useState('')
  const PAGE = 10

  const prevMes = () => {
    if (mesFiltro === 0) { setMesFiltro(11); setAnoFiltro(a => a - 1) }
    else setMesFiltro(m => m - 1)
  }
  const nextMes = () => {
    if (mesFiltro === 11) { setMesFiltro(0); setAnoFiltro(a => a + 1) }
    else setMesFiltro(m => m + 1)
  }

  useEffect(() => { load() }, [meNome, usaMes, mesFiltro, anoFiltro])

  const load = async () => {
    setLoading(true)
    setPage(1)
    const [osRes, vehiclesRes, clientsRes, itemsRes] = await Promise.all([
      supabase.from('service_orders')
        .select('*')
        .in('status', ['pronto', 'entregue'])
        .ilike('tecnico', meNome)
        .order('updated_at', { ascending: false }),
      supabase.from('vehicles').select('id, placa, modelo, client_id'),
      supabase.from('clients').select('id, nome'),
      supabase.from('service_items').select('os_id, descricao, venda'),
    ])
    const vehicles = vehiclesRes.data || []
    const clients  = clientsRes.data  || []
    const items    = itemsRes.data    || []
    let data = (osRes.data || []).map(os => {
      const v = vehicles.find(x => x.id === os.vehicle_id) || {}
      const c = clients.find(x => x.id === v.client_id)   || {}
      const it = items.filter(x => x.os_id === os.id)
      const total = it.reduce((s, i) => s + Number(i.venda || 0), 0)
      return { id: os.id, status: os.status, placa: v.placa || '---', modelo: v.modelo || '',
        clienteNome: c.nome || '', updatedAt: os.updated_at, deliveredAt: os.delivered_at, total,
        itens: it.map(i => i.descricao) }
    })
    if (usaMes) {
      data = data.filter(os => {
        const d = new Date(os.deliveredAt || os.updatedAt)
        return d.getMonth() === mesFiltro && d.getFullYear() === anoFiltro
      })
    }
    setLista(data)
    setLoading(false)
  }

  const listaBuscada = busca.trim()
    ? lista.filter(os =>
        os.placa.toLowerCase().includes(busca.toLowerCase()) ||
        os.modelo.toLowerCase().includes(busca.toLowerCase()) ||
        os.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
        os.itens.some(it => it.toLowerCase().includes(busca.toLowerCase()))
      )
    : lista
  const visivel  = listaBuscada.slice(0, page * PAGE)
  const totalVal = listaBuscada.reduce((s, os) => s + os.total, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <p className="text-base font-bold text-slate-900 mb-3">Meus Serviços</p>

        {/* Toggle filtro de mês */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setUsaMes(u => !u)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              usaMes ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-gray-200'
            }`}
          >
            Filtrar por mês
          </button>
          {usaMes && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-1">
              <button onClick={prevMes} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full">
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <span className="text-xs font-bold text-slate-800 min-w-[80px] text-center">
                {MESES[mesFiltro]} {anoFiltro}
              </span>
              <button onClick={nextMes} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full">
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          )}
        </div>

        {/* Campo de busca */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mt-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1) }}
            placeholder="Placa, veículo, cliente, serviço..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Resumo */}
        {!loading && listaBuscada.length > 0 && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-indigo-50 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black text-indigo-700">{listaBuscada.length}</p>
              <p className="text-[10px] font-semibold text-indigo-500">Serviços</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
              <p className="text-sm font-black text-green-700">{formatCurrency(totalVal)}</p>
              <p className="text-[10px] font-semibold text-green-500">Total gerado</p>
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : listaBuscada.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">
              {busca ? `Nenhum resultado para "${busca}"` : usaMes ? `Nenhum serviço em ${MESES[mesFiltro]}/${anoFiltro}` : 'Nenhum serviço encontrado'}
            </p>
          </div>
        ) : (
          <>
            {visivel.map(os => (
              <div key={os.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 font-mono tracking-wider">{os.placa}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      os.status === 'entregue' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>{os.status === 'entregue' ? 'Entregue' : 'Pronto'}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(os.total)}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{os.modelo} · {os.clienteNome}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(os.deliveredAt || os.updatedAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })}
                </p>
                {os.itens.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {os.itens.slice(0,3).map((it, i) => (
                      <p key={i} className="text-xs text-slate-400">· {it}</p>
                    ))}
                    {os.itens.length > 3 && (
                      <p className="text-xs text-slate-300">+{os.itens.length - 3} itens</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {visivel.length < listaBuscada.length && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-slate-500 hover:bg-gray-50 transition-colors"
              >
                Carregar mais ({listaBuscada.length - visivel.length} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Tab: Estoque ───────────────────────────────────────────────
const SORT_OPTS = [
  { key: 'az',        label: 'A→Z'       },
  { key: 'za',        label: 'Z→A'       },
  { key: 'val-desc',  label: 'Maior $'   },
  { key: 'val-asc',   label: 'Menor $'   },
  { key: 'qty-desc',  label: 'Mais un.'  },
  { key: 'qty-asc',   label: 'Menos un.' },
]

function sortEstoque(lista, sort) {
  const cmp = {
    'az':       (a, b) => a.produto.localeCompare(b.produto),
    'za':       (a, b) => b.produto.localeCompare(a.produto),
    'val-desc': (a, b) => b.valorVenda  - a.valorVenda,
    'val-asc':  (a, b) => a.valorVenda  - b.valorVenda,
    'qty-desc': (a, b) => b.quantidade  - a.quantidade,
    'qty-asc':  (a, b) => a.quantidade  - b.quantidade,
  }
  return [...lista].sort(cmp[sort] || cmp['az'])
}

function EstoqueTab({ meNome }) {
  const { user } = useAuth()
  const [estoque, setEstoque]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')
  const [sort, setSort]         = useState('az')
  const [addModal, setAddModal] = useState(null)   // item selecionado
  const [osAtivas, setOsAtivas] = useState([])
  const [osId, setOsId]         = useState('')
  const [qty, setQty]           = useState(1)
  const [adding, setAdding]     = useState(false)

  useEffect(() => { loadEstoque() }, [])

  const loadEstoque = async () => {
    // Filtra pelo masterId para garantir acesso mesmo sem RLS dedicada
    const { data, error } = await supabase
      .from('inventory')
      .select('id, produto, quantidade, valor_venda')
      .eq('user_id', user.masterId)
    if (error) console.error('Estoque:', error.message)
    setEstoque((data || []).map(i => ({
      id: i.id,
      produto: i.produto,
      quantidade: Number(i.quantidade),
      valorVenda: Number(i.valor_venda || 0),
    })))
    setLoading(false)
  }

  const abrirAddModal = async (item) => {
    // Carrega OS do técnico em orcamento ou manutencao
    const [osRes, vehiclesRes] = await Promise.all([
      supabase.from('service_orders')
        .select('id, vehicle_id, status')
        .in('status', ['orcamento', 'manutencao'])
        .ilike('tecnico', meNome),
      supabase.from('vehicles').select('id, placa, modelo'),
    ])
    const vehicles = vehiclesRes.data || []
    const lista = (osRes.data || []).map(os => {
      const v = vehicles.find(x => x.id === os.vehicle_id) || {}
      return { id: os.id, label: `${v.placa || '?'} — ${v.modelo || ''}`, status: os.status }
    })
    setOsAtivas(lista)
    setOsId(lista[0]?.id || '')
    setQty(1)
    setAddModal(item)
  }

  const confirmarAdd = async () => {
    if (!osId || !addModal) return
    setAdding(true)
    const qtdInt = Math.max(1, parseInt(qty) || 1)
    await itemStorage.add({
      osId,
      descricao: qtdInt > 1 ? `${addModal.produto} (x${qtdInt})` : addModal.produto,
      custo: '',
      venda: addModal.valorVenda * qtdInt,
      garantia: '',
    })
    setAddModal(null)
    setAdding(false)
  }

  const filtrado = sortEstoque(
    estoque.filter(i => i.produto.toLowerCase().includes(busca.toLowerCase())),
    sort
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <p className="text-base font-bold text-slate-900 mb-3">Consulta de Estoque</p>

        {/* Busca */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Chips de ordenação */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {SORT_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                sort === opt.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : filtrado.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">
              {busca ? 'Produto não encontrado' : 'Nenhum produto no estoque'}
            </p>
          </div>
        ) : (
          filtrado.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.produto}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs font-bold ${item.quantidade <= 0 ? 'text-red-500' : item.quantidade <= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                    {item.quantidade <= 0 ? '⚠ Sem estoque' : `${item.quantidade} un.`}
                  </span>
                  {item.valorVenda > 0 && (
                    <span className="text-xs text-slate-400">{formatCurrency(item.valorVenda)}/un.</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => abrirAddModal(item)}
                disabled={item.quantidade <= 0}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> OS
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal: selecionar OS */}
      {addModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end justify-center" onClick={() => setAddModal(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-900">Adicionar à OS</p>
                <p className="text-xs text-slate-400 mt-0.5">{addModal.produto}</p>
              </div>
              <button onClick={() => setAddModal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Quantidade */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Quantidade</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-gray-50 text-xl font-bold">−</button>
                <span className="text-xl font-black text-slate-900 min-w-[32px] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(addModal.quantidade, q + 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-gray-50 text-xl font-bold">+</button>
                <span className="text-xs text-slate-400 ml-1">
                  {addModal.valorVenda > 0 && `= ${formatCurrency(addModal.valorVenda * qty)}`}
                </span>
              </div>
            </div>

            {/* Selecionar OS */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Selecionar OS</p>
              {osAtivas.length === 0 ? (
                <p className="text-sm text-slate-400 bg-gray-50 rounded-xl px-4 py-3">
                  Nenhuma OS sua em andamento (orçamento ou manutenção)
                </p>
              ) : (
                <div className="space-y-1.5">
                  {osAtivas.map(os => (
                    <button key={os.id} onClick={() => setOsId(os.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        osId === os.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        osId === os.id ? 'border-indigo-600' : 'border-gray-300'
                      }`}>
                        {osId === os.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{os.label}</p>
                        <p className="text-xs text-slate-400">{os.status === 'orcamento' ? 'Orçamento' : 'Em Serviço'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={confirmarAdd}
              disabled={!osId || adding}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {adding ? 'Adicionando...' : 'Adicionar ao orçamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detalhe da OS ──────────────────────────────────────────────
function OSDetalhe({ os: osInicial, meNome, masterId, podeAssumir, onClose, onReload }) {
  const [os, setOs]            = useState(osInicial)
  const [tab, setTab]          = useState('tarefas')
  const [showHistory, setShowHistory] = useState(false)
  const [novaTarefa, setNovaTarefa]   = useState('')
  const [addingTask, setAddingTask]   = useState(false)
  const [notaText, setNotaText]       = useState('')
  const [sendingNota, setSendingNota] = useState(false)
  const [sinalizando, setSinalizando] = useState(false)
  const [assumindo, setAssumindo]     = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const notasEndRef = useRef(null)

  const st = STATUS_INFO[os.status] || STATUS_INFO.orcamento

  // Auto-scroll notas
  useEffect(() => {
    if (tab === 'notas') {
      setTimeout(() => notasEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [tab, os.notasInternas?.length])

  // ── Checklist ────────────────────────────────────────────────
  const toggleTask = async (idx) => {
    const nova = os.checklist.map((t, i) =>
      i === idx ? { ...t, feito: !t.feito } : t
    )
    setOs(p => ({ ...p, checklist: nova }))
    await osStorage.updateChecklist(os.id, nova)
  }

  const adicionarTarefa = async () => {
    if (!novaTarefa.trim()) return
    setAddingTask(true)
    const nova = [...os.checklist, { id: crypto.randomUUID(), texto: novaTarefa.trim(), feito: false }]
    setOs(p => ({ ...p, checklist: nova }))
    setNovaTarefa('')
    await osStorage.updateChecklist(os.id, nova)
    setAddingTask(false)
  }

  const removerTarefa = async (idx) => {
    const nova = os.checklist.filter((_, i) => i !== idx)
    setOs(p => ({ ...p, checklist: nova }))
    await osStorage.updateChecklist(os.id, nova)
  }

  // ── Notas internas ───────────────────────────────────────────
  const enviarNota = async () => {
    if (!notaText.trim()) return
    setSendingNota(true)
    const nota = {
      autor: meNome || 'Técnico',
      texto: notaText.trim(),
      at:    new Date().toISOString(),
      tipo:  'tecnico',
    }
    const novas = [...(os.notasInternas || []), nota]
    setOs(p => ({ ...p, notasInternas: novas }))
    setNotaText('')
    await osStorage.addNotaInterna(os.id, nota)
    setSendingNota(false)
  }

  // ── Sinalizar problema ───────────────────────────────────────
  const sinalizar = async () => {
    if (os.problemaFlag) {
      // Remover flag
      setOs(p => ({ ...p, problemaFlag: false }))
      await osStorage.setProblemaFlag(os.id, false)
    } else {
      setSinalizando(true)
      const nota = {
        autor: meNome || 'Técnico',
        texto: '⚠️ Problema sinalizado pelo técnico.',
        at:    new Date().toISOString(),
        tipo:  'tecnico',
      }
      const novas = [...(os.notasInternas || []), nota]
      setOs(p => ({ ...p, problemaFlag: true, notasInternas: novas }))
      await Promise.all([
        osStorage.setProblemaFlag(os.id, true),
        osStorage.addNotaInterna(os.id, nota),
      ])
      setSinalizando(false)
    }
  }

  // ── Assumir OS ───────────────────────────────────────────────
  // Usa update direto (tech tem RLS UPDATE) — evita RPC que exige pode_assumir_os
  const assumir = async () => {
    setAssumindo(true)
    await supabase.from('service_orders').update({
      tecnico:    meNome,
      updated_at: new Date().toISOString(),
    }).eq('id', os.id)
    setOs(p => ({ ...p, tecnico: meNome }))
    setAssumindo(false)
  }

  // ── Mudar status ─────────────────────────────────────────────
  const mudarStatus = async (novoStatus) => {
    setSavingStatus(true)
    setShowStatusPicker(false)
    await supabase.from('service_orders').update({
      status: novoStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', os.id)
    setOs(p => ({ ...p, status: novoStatus }))
    setSavingStatus(false)
  }

  const semTecnico = !os.tecnico
  const ehMinha   = !semTecnico && os.tecnico?.toLowerCase() === meNome?.toLowerCase()
  const totalFeitas = os.checklist.filter(t => t.feito).length

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center sm:bg-black/40">
    <div className="bg-white flex flex-col w-full h-full sm:h-[92vh] sm:max-w-xl sm:rounded-2xl sm:shadow-2xl sm:overflow-hidden">

      {/* Header */}
      <div className={`shrink-0 ${os.urgente ? 'bg-red-500' : 'bg-slate-900'}`}>
        {os.urgente && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white tracking-widest">URGENTE</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-lg font-mono tracking-wider">{os.placa}</p>
            <p className="text-xs text-white/70 truncate">{os.modelo} · {os.clienteNome}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {os.problemaFlag && (
              <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
                <Flag className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Ver histórico"
            >
              <History className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Status badge + mudar */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <button
            onClick={() => os.status !== 'entregue' && setShowStatusPicker(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}
          >
            {savingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : st.label}
            {os.status !== 'entregue' && <ChevronDown className="w-3 h-3" />}
          </button>
          {semTecnico && (
            <button
              onClick={assumir}
              disabled={assumindo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition-colors disabled:opacity-60"
            >
              {assumindo ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              Assumir
            </button>
          )}
        </div>

        {/* Picker de status inline */}
        {showStatusPicker && (
          <div className="mx-4 mb-3 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
            {['orcamento', 'manutencao', 'pronto'].map(s => {
              const info = STATUS_INFO[s]
              return (
                <button
                  key={s}
                  onClick={() => mudarStatus(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold border-b border-gray-100 last:border-0 ${
                    os.status === s ? `${info.bg} ${info.text}` : 'text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  {os.status === s && <Check className="w-4 h-4 shrink-0" />}
                  {info.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0 bg-white">
        {[
          { id: 'tarefas',  icon: ClipboardList, label: 'Tarefas',  badge: os.checklist?.length ? `${totalFeitas}/${os.checklist.length}` : null },
          { id: 'notas',    icon: MessageSquare, label: 'Notas',     badge: os.notasInternas?.length || null },
          { id: 'servicos', icon: Package,       label: 'Serviços',  badge: os.items?.length || null },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-colors relative ${
              tab === id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge ? (
              <span className={`absolute top-2 right-1/4 text-[9px] font-bold px-1 rounded-full ${
                tab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab: Tarefas ─────────────────────────────────────── */}
      {tab === 'tarefas' && (
        <div className="flex-1 overflow-y-auto">
          {/* Progress summary */}
          {os.checklist.length > 0 && (
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                  {totalFeitas} de {os.checklist.length} concluídas
                </span>
                <span className="text-sm font-bold text-indigo-600">
                  {Math.round((totalFeitas / os.checklist.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((totalFeitas / os.checklist.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Lista de tarefas */}
          <div className="px-4 py-2">
            {os.checklist.length === 0 && (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nenhuma tarefa definida</p>
                <p className="text-xs text-slate-300 mt-1">Adicione tarefas abaixo</p>
              </div>
            )}
            {os.checklist.map((task, i) => (
              <div
                key={task.id || i}
                className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group`}
              >
                <button
                  onClick={() => toggleTask(i)}
                  className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: task.feito ? '#6366f1' : '#cbd5e1',
                    background:  task.feito ? '#6366f1' : 'transparent',
                  }}
                >
                  {task.feito && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${task.feito ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {task.texto}
                </span>
                <button
                  onClick={() => removerTarefa(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Adicionar tarefa */}
          <div className="px-4 pb-4">
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={novaTarefa}
                onChange={e => setNovaTarefa(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarTarefa()}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-gray-50"
              />
              <button
                onClick={adicionarTarefa}
                disabled={!novaTarefa.trim() || addingTask}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Sinalizar problema */}
            <button
              onClick={sinalizar}
              disabled={sinalizando}
              className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                os.problemaFlag
                  ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-gray-50 border border-gray-200 text-slate-600 hover:bg-gray-100'
              }`}
            >
              {sinalizando
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Flag className={`w-4 h-4 ${os.problemaFlag ? 'text-amber-600' : 'text-slate-400'}`} />
              }
              {os.problemaFlag ? 'Problema sinalizado (toque para remover)' : 'Sinalizar problema ao gerente'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Notas internas ───────────────────────────────── */}
      {tab === 'notas' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {/* Observações do cliente (read-only) */}
            {os.observacoes && (
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 mb-3">
                <p className="text-xs font-semibold text-slate-400 mb-1">Obs. do orçamento (cliente vê)</p>
                <p className="text-sm text-slate-500 italic">{os.observacoes}</p>
              </div>
            )}

            {/* Chat interno */}
            {(!os.notasInternas || os.notasInternas.length === 0) && (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nenhuma nota interna ainda</p>
                <p className="text-xs text-slate-300 mt-1">Só você e o gerente podem ver aqui</p>
              </div>
            )}
            {(os.notasInternas || []).map((nota, i) => {
              const sou = nota.tipo === 'tecnico'
              return (
                <div key={i} className={`flex flex-col ${sou ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      sou
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {nota.texto}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {nota.autor} · {fmtHora(nota.at)}
                  </p>
                </div>
              )
            })}
            <div ref={notasEndRef} />
          </div>

          {/* Input de nota */}
          <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={notaText}
                onChange={e => setNotaText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarNota()}
                placeholder="Nota interna..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-gray-50"
              />
              <button
                onClick={enviarNota}
                disabled={!notaText.trim() || sendingNota}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                {sendingNota ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Serviços ─────────────────────────────────────── */}
      {tab === 'servicos' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {os.items.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum item cadastrado</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {os.items.map((item, i) => (
                  <div key={item.id || i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.descricao}</p>
                      {item.garantia && (
                        <p className="text-xs text-slate-400">{item.garantia}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 ml-3 shrink-0">
                      {formatCurrency(item.venda)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center bg-indigo-50 rounded-xl px-3.5 py-3 border border-indigo-100">
                <span className="text-sm font-bold text-indigo-900">Total</span>
                <span className="text-lg font-black text-indigo-700">{formatCurrency(os.total)}</span>
              </div>
            </>
          )}

          {/* KM */}
          {os.km && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 bg-gray-50 rounded-xl px-3.5 py-2.5">
              <span className="font-semibold">KM:</span> {os.km}
            </div>
          )}
        </div>
      )}

      {/* Modal histórico */}
      {showHistory && <HistoricoModal os={os} onClose={() => setShowHistory(false)} />}
    </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────
export default function TecnicoOficina() {
  const { user } = useAuth()
  const [osList, setOsList]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroMinha, setFiltroMinha] = useState(false)
  const [selectedOS, setSelectedOS]   = useState(null)
  const [officeSettings, setOfficeSettings] = useState({ podeAssumir: false, oficinaNome: '' })
  const [activeScreen, setActiveScreen] = useState('oficina') // 'oficina' | 'historico' | 'estoque'

  const reload = useCallback(async () => {
    try {
      const data = await fetchOS()
      setOsList(data)
      // Usa functional updater para não capturar selectedOS na closure
      // Se o modal já foi fechado (null), permanece null
      setSelectedOS(prev => {
        if (!prev) return null
        const updated = data.find(o => o.id === prev.id)
        return updated ?? prev
      })
    } finally {
      setLoading(false)
    }
  }, []) // sem deps — functional updater garante acesso ao state atual

  useEffect(() => {
    reload()
    // Carregar settings da oficina
    const loadSettings = async () => {
      const { data } = await supabase
        .from('office_data')
        .select('pode_assumir_os, nome')
        .eq('user_id', user.masterId)
        .maybeSingle()
      if (data) {
        setOfficeSettings({
          podeAssumir: data.pode_assumir_os || false,
          oficinaNome: data.nome || '',
        })
      }
    }
    loadSettings()
  }, [])

  // ── Filtro ─────────────────────────────────────────────────
  // RLS já garante que só chegam OS do master — mostramos todas
  // Toggle "Minhas OS" filtra apenas as atribuídas ao técnico logado
  const meNome = user.nome || user.email || ''
  const osExibidas = filtroMinha
    ? osList.filter(os => os.tecnico?.toLowerCase() === meNome.toLowerCase())
    : osList

  // Estatísticas
  const minhasCount   = osList.filter(o => o.tecnico?.toLowerCase() === meNome.toLowerCase()).length
  const urgenteCount  = osList.filter(o => o.urgente).length
  const problemaCount = osList.filter(o => o.problemaFlag).length

  const assumir = async (os) => {
    // Update direto — tech tem RLS UPDATE, sem depender do RPC
    await supabase.from('service_orders').update({
      tecnico:    meNome,
      updated_at: new Date().toISOString(),
    }).eq('id', os.id)
    reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // ── Detalhe aberto ──────────────────────────────────────────
  if (selectedOS) {
    return (
      <OSDetalhe
        os={selectedOS}
        meNome={meNome}
        masterId={user.masterId}
        podeAssumir={officeSettings.podeAssumir}
        onClose={() => { setSelectedOS(null); reload() }}
        onReload={reload}
      />
    )
  }

  // ── Layout principal com nav responsiva ───────────────────────
  const NAV = [
    { key: 'oficina',   icon: Wrench,  label: 'Oficina'   },
    { key: 'historico', icon: Clock,   label: 'Histórico' },
    { key: 'estoque',   icon: Package, label: 'Estoque'   },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar desktop (lg+) ── */}
      <aside className="hidden lg:flex flex-col w-48 bg-white border-r border-gray-100 fixed top-[53px] left-0 bottom-0 z-30">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveScreen(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeScreen === key
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Conteúdo principal ── */}
      <div className="flex-1 lg:ml-48">

      {/* ── Tela: Oficina (lista de OS) ── */}
      {activeScreen === 'oficina' && (
        <div className="pb-20">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-0.5">Bem-vindo,</p>
            <p className="text-lg font-bold text-slate-900">{meNome}</p>

            {/* Stats rápidas */}
            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-indigo-50 rounded-xl px-3 py-2 text-center">
                <p className="text-xl font-black text-indigo-700">{minhasCount}</p>
                <p className="text-[10px] font-semibold text-indigo-500">Minhas OS</p>
              </div>
              {urgenteCount > 0 && (
                <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xl font-black text-red-600">{urgenteCount}</p>
                  <p className="text-[10px] font-semibold text-red-400">Urgentes</p>
                </div>
              )}
              {problemaCount > 0 && (
                <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xl font-black text-amber-600">{problemaCount}</p>
                  <p className="text-[10px] font-semibold text-amber-400">Problemas</p>
                </div>
              )}
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-100">
                <p className="text-xl font-black text-slate-600">{osExibidas.length}</p>
                <p className="text-[10px] font-semibold text-slate-400">Visíveis</p>
              </div>
            </div>

            {/* Filtro */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setFiltroMinha(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${!filtroMinha ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
                Todas disponíveis
              </button>
              <button onClick={() => setFiltroMinha(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${filtroMinha ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
                Minhas OS {minhasCount > 0 ? `(${minhasCount})` : ''}
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="px-4 py-4 space-y-3">
            {osExibidas.length === 0 ? (
              <div className="text-center py-16">
                <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">
                  {filtroMinha ? 'Nenhuma OS atribuída a você' : 'Nenhuma OS disponível'}
                </p>
              </div>
            ) : (
              osExibidas.map(os => (
                <OSCard key={os.id} os={os} meNome={meNome}
                  podeAssumir={officeSettings.podeAssumir}
                  onOpen={setSelectedOS} onAssumir={assumir} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tela: Histórico ── */}
      {activeScreen === 'historico' && (
        <HistoricoTab meNome={meNome} />
      )}

      {/* ── Tela: Estoque ── */}
      {activeScreen === 'estoque' && (
        <EstoqueTab meNome={meNome} />
      )}

      {/* ── Bottom nav — só mobile ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100">
        <div className="flex">
          {NAV.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveScreen(key)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                activeScreen === key ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      </div>{/* /conteúdo principal */}
    </div>
  )
}

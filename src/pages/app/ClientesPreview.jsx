// ============================================================
// ClientesPreview — PROTÓTIPO OCULTO (rota /app/clientes-preview)
// Não está no menu. Serve só para validar o redesign da aba
// "Histórico" → "Clientes". Usa dados reais via storage.
// Nada aqui afeta a Histórico atual.
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import {
  Search, X, Users, Car, MessageCircle, ChevronRight, ChevronDown,
  Cake, Clock, TrendingUp, Phone, List, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  clientStorage, vehicleStorage, osStorage, vendaStorage,
  formatCurrency, formatDate, norm,
} from '../../lib/storage'

// ── Helpers ──────────────────────────────────────────────────
const INATIVO_DIAS = 90

function diasDesde(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

function tempoRelativo(dateStr) {
  const dias = diasDesde(dateStr)
  if (dias === null) return 'sem visita registrada'
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

function mesAniversario(dataNascimento) {
  if (!dataNascimento) return null
  const d = new Date(dataNascimento)
  if (isNaN(d)) return null
  // datas vêm em ISO (YYYY-MM-DD) — usar UTC evita erro de fuso
  return d.getUTCMonth()
}

function PlateTag({ placa, sm }) {
  return (
    <div className={`bg-slate-800 rounded-md flex flex-col items-center justify-center shrink-0 ${sm ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
      <span className={`text-white font-bold plate-mercosul tracking-wider ${sm ? 'text-[11px]' : 'text-xs'}`}>{placa}</span>
    </div>
  )
}

function Avatar({ nome, inativo }) {
  const inicial = (nome?.[0] || '?').toUpperCase()
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${
      inativo ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
    }`}>
      {inicial}
    </div>
  )
}

// ── Card de cliente ──────────────────────────────────────────
function ClienteCard({ c, expanded, onToggle, compact = false }) {
  const wppLink = c.whatsapp
    ? `https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all">
      {compact ? (
        // ── Linha enxuta (modo lista) ──
        <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${c.inativo ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {(c.nome?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-900 text-sm truncate">{c.nome}</p>
              {c.aniversariante && <Cake className="w-3 h-3 text-pink-500 shrink-0" />}
              {c.inativo && <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">sumido</span>}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{c.veiculos.length} veíc · {tempoRelativo(c.lastVisit)}</p>
          </div>
          {c.totalGasto > 0 && <span className="text-xs font-bold text-slate-700 shrink-0">{formatCurrency(c.totalGasto)}</span>}
          <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        // ── Card completo (modo cards) ──
        <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
          <Avatar nome={c.nome} inativo={c.inativo} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 text-sm truncate">{c.nome}</p>
              {c.aniversariante && <Cake className="w-3.5 h-3.5 text-pink-500 shrink-0" />}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Car className="w-3 h-3 shrink-0" />
              {c.veiculos.length} {c.veiculos.length === 1 ? 'veículo' : 'veículos'}
              <span className="text-slate-300">·</span>
              {tempoRelativo(c.lastVisit)}
            </p>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-1">
            {c.totalGasto > 0 && (
              <span className="text-sm font-bold text-slate-900">{formatCurrency(c.totalGasto)}</span>
            )}
            {c.inativo
              ? <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">sumido</span>
              : <span className="w-2 h-2 rounded-full bg-green-400" title="ativo" />}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-3">
          {/* Contato + WhatsApp */}
          <div className="flex items-center gap-2 pt-2">
            {c.whatsapp && (
              <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.whatsapp}</span>
            )}
            {wppLink && (
              <a href={wppLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="ml-auto inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Chamar no WhatsApp
              </a>
            )}
          </div>

          {/* Veículos do cliente */}
          {c.veiculos.length > 0 ? (
            <div className="space-y-1.5">
              {c.veiculos.map(v => (
                <div key={v.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-2.5 py-2">
                  <PlateTag placa={v.placa} sm />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{v.modelo}</p>
                    <p className="text-[11px] text-slate-400">{v.osCount} OS · {tempoRelativo(v.lastOs)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-1">Nenhum veículo cadastrado.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Card de veículo (visão Veículos) ─────────────────────────
function VeiculoCard({ v, compact = false }) {
  return (
    <div className={`w-full bg-white rounded-2xl border border-gray-100 flex items-center gap-3 ${compact ? 'px-3 py-2' : 'p-3'}`}>
      <PlateTag placa={v.placa} sm={compact} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-slate-900 truncate ${compact ? 'text-[13px]' : 'text-sm'}`}>{v.modelo}</p>
        <p className={`text-slate-400 truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {v.clientNome}{compact ? ` · ${v.osCount} OS` : ''}
        </p>
      </div>
      {!compact && (
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">{v.osCount} OS</p>
          <p className="text-[10px] text-slate-300">{tempoRelativo(v.lastOs)}</p>
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function ClientesPreview() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clients, setClients]   = useState([])
  const [vehicles, setVehicles] = useState([])

  const [view, setView]     = useState('clientes') // clientes | veiculos
  const [display, setDisplay] = useState('cards')  // cards | list
  const [query, setQuery]   = useState('')
  const [filtro, setFiltro] = useState('todos')    // todos | sumidos | aniversario | top
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [cls, vhs, vendasStats, allOS] = await Promise.all([
        clientStorage.getAll(user.oficina),
        vehicleStorage.getAll(user.oficina),
        vendaStorage.getClientStats().catch(() => ({})),
        osStorage.getAll(user.oficina),
      ])
      if (!alive) return

      // OS por veículo: contagem, última data, total entregue
      const osPorVeiculo = {}
      allOS.forEach(os => {
        const m = osPorVeiculo[os.vehicleId] || { count: 0, last: null, entregue: 0 }
        m.count += 1
        if (!m.last || (os.createdAt && os.createdAt > m.last)) m.last = os.createdAt
        if (os.status === 'entregue') m.entregue += (os.totals?.venda || 0)
        osPorVeiculo[os.vehicleId] = m
      })

      const vehiclesEnriched = vhs.map(v => ({
        ...v,
        osCount: osPorVeiculo[v.id]?.count || 0,
        lastOs:  osPorVeiculo[v.id]?.last || null,
        osTotal: osPorVeiculo[v.id]?.entregue || 0,
      }))

      const mesAtual = new Date().getMonth()

      const clientsEnriched = cls.map(c => {
        const veiculos = vehiclesEnriched
          .filter(v => v.clientId === c.id)
          .sort((a, b) => (b.lastOs || '').localeCompare(a.lastOs || ''))
        const lastVisit = veiculos.reduce((acc, v) => (!acc || (v.lastOs && v.lastOs > acc)) ? (v.lastOs || acc) : acc, null)
        const totalOS = veiculos.reduce((s, v) => s + v.osTotal, 0)
        const totalVendas = vendasStats[c.id]?.total || 0
        const dias = diasDesde(lastVisit)
        return {
          ...c,
          veiculos,
          lastVisit,
          totalGasto: totalOS + totalVendas,
          inativo: dias === null ? false : dias > INATIVO_DIAS,
          aniversariante: mesAniversario(c.dataNascimento) === mesAtual,
        }
      })

      setClients(clientsEnriched)
      setVehicles(vehiclesEnriched.map(v => ({
        ...v,
        clientNome: cls.find(c => c.id === v.clientId)?.nome || '—',
      })))
      setLoading(false)
    })()
    return () => { alive = false }
  }, [user.oficina])

  // Contadores para os chips
  const counts = useMemo(() => ({
    todos:       clients.length,
    sumidos:     clients.filter(c => c.inativo).length,
    aniversario: clients.filter(c => c.aniversariante).length,
  }), [clients])

  // Lista filtrada + busca
  const clientesFiltrados = useMemo(() => {
    let list = [...clients]
    if (filtro === 'sumidos')     list = list.filter(c => c.inativo)
    if (filtro === 'aniversario') list = list.filter(c => c.aniversariante)
    if (filtro === 'top')         list = list.sort((a, b) => b.totalGasto - a.totalGasto)
    else                          list = list.sort((a, b) => a.nome.localeCompare(b.nome))

    const q = norm(query.trim())
    if (q.length >= 1) {
      list = list.filter(c =>
        norm(c.nome).includes(q) ||
        (c.cpf || '').includes(q) ||
        c.veiculos.some(v => norm(v.placa).includes(q) || norm(v.modelo).includes(q))
      )
    }
    return list
  }, [clients, filtro, query])

  const veiculosFiltrados = useMemo(() => {
    let list = [...vehicles].sort((a, b) => (b.lastOs || '').localeCompare(a.lastOs || ''))
    const q = norm(query.trim())
    if (q.length >= 1) {
      list = list.filter(v =>
        norm(v.placa).includes(q) || norm(v.modelo).includes(q) || norm(v.clientNome).includes(q)
      )
    }
    return list
  }, [vehicles, query])

  const CHIPS = [
    { key: 'todos',       label: 'Todos',          count: counts.todos,       icon: null },
    { key: 'sumidos',     label: 'Sumidos',        count: counts.sumidos,     icon: Clock,       accent: 'amber' },
    { key: 'aniversario', label: 'Aniversariantes', count: counts.aniversario, icon: Cake,        accent: 'pink' },
    { key: 'top',         label: 'Maiores gastos', count: null,               icon: TrendingUp,  accent: 'green' },
  ]

  return (
    <div className="pb-36">
      {/* Faixa de aviso do protótipo */}
      <div className="bg-indigo-600 text-white text-[11px] text-center py-1.5 px-4 font-medium">
        🔬 Pré-visualização da aba "Clientes" — nada aqui altera o sistema real
      </div>

      {/* Header + busca fixos */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          {view === 'veiculos'
            ? <Car className="w-5 h-5 text-indigo-600" />
            : <Users className="w-5 h-5 text-indigo-600" />}
          <h1 className="text-xl font-bold text-slate-900">{view === 'veiculos' ? 'Veículos' : 'Clientes'}</h1>
          <span className="text-sm text-slate-400 font-medium">{view === 'veiculos' ? vehicles.length : clients.length}</span>

          {/* Toggle Clientes | Veículos */}
          <div className="ml-auto flex bg-gray-100 rounded-xl p-0.5">
            {[['clientes', 'Clientes'], ['veiculos', 'Veículos']].map(([k, lbl]) => (
              <button key={k} onClick={() => setView(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Busca + alternar visualização */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={view === 'clientes' ? 'Buscar cliente, placa ou CPF...' : 'Buscar placa, modelo ou dono...'}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setDisplay(d => d === 'cards' ? 'list' : 'cards')}
            title={display === 'cards' ? 'Ver em lista' : 'Ver em cards'}
            aria-label={display === 'cards' ? 'Ver em lista' : 'Ver em cards'}
            className="shrink-0 w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          >
            {display === 'cards' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>

        {/* Chips (insight + filtro) — só na visão Clientes */}
        {view === 'clientes' && (
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {CHIPS.map(chip => {
              const active = filtro === chip.key
              const Icon = chip.icon
              return (
                <button key={chip.key} onClick={() => setFiltro(chip.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {chip.label}
                  {chip.count != null && chip.count > 0 && (
                    <span className={`text-[10px] font-bold ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {chip.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : view === 'clientes' ? (
          clientesFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {filtro === 'sumidos' ? 'Nenhum cliente sumido 🎉'
                  : filtro === 'aniversario' ? 'Nenhum aniversariante este mês'
                  : query ? 'Nenhum cliente encontrado'
                  : 'Nenhum cliente cadastrado'}
              </p>
            </div>
          ) : (
            <div className={display === 'list'
              ? 'space-y-1.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2 lg:items-start'
              : 'space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5 lg:items-start'}>
              {clientesFiltrados.map(c => (
                <ClienteCard key={c.id} c={c}
                  compact={display === 'list'}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId(id => id === c.id ? null : c.id)} />
              ))}
            </div>
          )
        ) : (
          veiculosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{query ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}</p>
            </div>
          ) : (
            <div className={display === 'list'
              ? 'space-y-1.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2'
              : 'space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5'}>
              {veiculosFiltrados.map(v => <VeiculoCard key={v.id} v={v} compact={display === 'list'} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, MessageCircle, ChevronRight, ChevronUp, ChevronDown, X, Check,
  Trash2, Search, Car, FileText, AlertCircle,
  Printer, Share2, PackageCheck, RotateCcw,
  CreditCard, Banknote, Smartphone, DollarSign,
  Clock, Wrench, Package, Tag, Percent,
  CalendarClock, Gauge, ReceiptText, TrendingUp,
  CheckCircle2, Edit2, Send, Loader2,
  Flag, TriangleAlert, ClipboardList, Circle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  osStorage, itemStorage, clientStorage, vehicleStorage,
  STATUS_LABELS, STATUS_COLORS, formatCurrency, formatDate,
  SERVICOS_COMUNS, GARANTIA_OPTIONS, officeDataStorage,
  printOS, printReceipt, downloadOsPDF, downloadReceiptPDF, buildDescontoLabel, inventoryStorage
} from '../../lib/storage'

// ── HELPERS ───────────────────────────────────────────────
function iniciais(nome) {
  if (!nome) return ''
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function TecnicoAvatar({ nome, size = 'sm' }) {
  if (!nome) return null
  return (
    <div
      title={nome}
      className={`bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center shrink-0 ${
        size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
      }`}>
      {iniciais(nome)}
    </div>
  )
}

const WPP_MESSAGES = {
  orcamento: (cliente, modelo, total, link) =>
    link
      ? `Olá ${cliente}! 👋 O orçamento do seu *${modelo}* está pronto.\n\nTotal: *${formatCurrency(total)}*\n\n📋 Veja e aprove online:\n${link}`
      : `Olá ${cliente}! 👋 O orçamento do seu *${modelo}* está pronto.\n\nTotal: *${formatCurrency(total)}*\n\nPodemos prosseguir com o serviço?`,
  manutencao: (cliente, modelo) =>
    `Olá ${cliente}! 🔧 Seu *${modelo}* já está em manutenção. Assim que ficar pronto, te aviso!`,
  pronto: (cliente, modelo) =>
    `Olá ${cliente}! ✅ Seu *${modelo}* está *pronto para retirada*. Qualquer dúvida, estamos à disposição!`,
  entregue: (cliente, modelo) =>
    `Olá ${cliente}! 😊 Obrigado pela confiança! Esperamos que esteja tudo certo com seu *${modelo}*.`,
  revisao: (cliente, modelo, dias) =>
    `Olá ${cliente}! 🚗 Faz ${dias} dias desde a última visita do seu *${modelo}*. Que tal agendar uma revisão?`,
  aniversario: (cliente) =>
    `Olá ${cliente}! 🎂 Hoje é seu aniversário! A equipe da oficina deseja um dia incrível. Aproveite nosso desconto especial de aniversário! 🎁`,
}

function PlateTag({ placa }) {
  return (
    <div className="bg-slate-800 px-2.5 py-1.5 rounded-lg flex flex-col items-center min-w-[80px]">
      <span className="text-white text-sm font-bold plate-mercosul tracking-widest">{placa}</span>
      <span className="text-slate-500 text-[8px] mt-0.5">BRASIL</span>
    </div>
  )
}

function localDatetimeNow() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const PAYMENT_METHODS = [
  { key: 'pix',     label: 'PIX',     icon: Smartphone },
  { key: 'dinheiro',label: 'Dinheiro',icon: Banknote },
  { key: 'debito',  label: 'Débito',  icon: CreditCard },
  { key: 'credito', label: 'Crédito', icon: CreditCard },
  { key: 'outros',  label: 'Outros',  icon: DollarSign },
]

// ── HELPERS DE AGENDA ─────────────────────────────────────
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x }
function startOfWeek(d) {
  const x = new Date(d); const day = x.getDay()
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1)); x.setHours(0,0,0,0); return x
}
function endOfWeek(d) {
  const x = startOfWeek(d); x.setDate(x.getDate() + 6); x.setHours(23,59,59,999); return x
}

function agendaGroup(os) {
  if (!os.agendadoPara) return null
  const d = new Date(os.agendadoPara)
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)
  const weekEnd    = endOfWeek(now)
  const nextWeekStart = new Date(weekEnd); nextWeekStart.setDate(nextWeekStart.getDate() + 1); nextWeekStart.setHours(0,0,0,0)
  const nextWeekEnd   = endOfWeek(nextWeekStart)
  if (d < todayStart)          return 'atrasado'
  if (d <= todayEnd)           return 'hoje'
  if (d <= weekEnd)            return 'semana'
  if (d <= nextWeekEnd)        return 'proxima'
  return 'futuro'
}

function AgendaCard({ os, onOpen }) {
  const grupo = agendaGroup(os)
  const d = new Date(os.agendadoPara)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dia  = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

  const isAtrasado = grupo === 'atrasado'
  const isHoje     = grupo === 'hoje'

  return (
    <button onClick={() => onOpen(os)}
      className={`w-full rounded-2xl border p-3 flex items-center gap-3 text-left transition-colors ${
        isAtrasado ? 'bg-red-50 border-red-200 hover:bg-red-100' :
        isHoje     ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                     'bg-white border-gray-100 hover:border-indigo-100'
      }`}>
      <PlateTag placa={os.vehicle?.placa || '???'} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{os.vehicle?.modelo}</p>
        <p className="text-xs text-slate-500 truncate">{os.client?.nome}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs font-bold ${isAtrasado ? 'text-red-600' : isHoje ? 'text-amber-600' : 'text-indigo-600'}`}>{hora}</p>
        <p className="text-[10px] text-slate-400 capitalize">{dia}</p>
      </div>
    </button>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({ officeName, onOpenOS, onNewOS }) {
  const [data, setData] = useState({ all: [], prontos: [], manutencao: [], orcamento: [], agendados: [] })
  const [filtroAgenda, setFiltroAgenda] = useState('hoje')
  const [agendaAberta, setAgendaAberta] = useState(false)

  useEffect(() => {
    const load = async () => {
      const all = await osStorage.getAll(officeName)
      const active = all.filter(os => os.status !== 'entregue')
      // OS agendada = tem agendadoPara E status ainda é 'orcamento'
      const agendados = active.filter(os => os.agendadoPara && os.status === 'orcamento')
      const agendadosIds = new Set(agendados.map(o => o.id))
      setData({
        all: active,
        prontos:   active.filter(os => os.status === 'pronto'),
        manutencao:active.filter(os => os.status === 'manutencao'),
        orcamento: active.filter(os => os.status === 'orcamento' && !agendadosIds.has(os.id)),
        agendados,
      })
    }
    load()
  }, [officeName])

  // Auto-abre a agenda se houver agendamentos atrasados
  useEffect(() => {
    const hasAtrasados = data.agendados.some(os => agendaGroup(os) === 'atrasado')
    if (hasAtrasados) setAgendaAberta(true)
  }, [data.agendados])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  // Grupos de agenda
  const atrasados  = data.agendados.filter(os => agendaGroup(os) === 'atrasado')
  const hoje       = data.agendados.filter(os => agendaGroup(os) === 'hoje')
  const semana     = data.agendados.filter(os => agendaGroup(os) === 'semana')
  const proxima    = data.agendados.filter(os => agendaGroup(os) === 'proxima')
  const futuro     = data.agendados.filter(os => agendaGroup(os) === 'futuro')

  const agendadosFiltrados = (() => {
    if (filtroAgenda === 'hoje')    return hoje
    if (filtroAgenda === 'semana')  return semana
    if (filtroAgenda === 'proxima') return proxima
    return data.agendados // todos
  })()

  const FILTROS = [
    { key: 'hoje',    label: 'Hoje' },
    { key: 'semana',  label: 'Semana' },
    { key: 'proxima', label: 'Próxima' },
    { key: 'todos',   label: 'Todos' },
  ]

  const activeCount = data.all.filter(os => !os.agendadoPara || os.status !== 'orcamento').length

  return (
    <div className="p-4 pb-36 space-y-5">
      {/* Saudação */}
      <div>
        <p className="text-slate-400 text-sm">{saudacao} 👋</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">
          {activeCount === 0 ? 'Nenhuma OS em aberto' : `${activeCount} OS em andamento`}
        </p>
      </div>

      {/* Cards rápidos — 4 cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-green-50 rounded-2xl p-2.5 text-center border border-green-100">
          <p className="text-xl font-bold text-green-700">{data.prontos.length}</p>
          <p className="text-[10px] text-green-600 mt-0.5 font-medium leading-tight">Pronto{data.prontos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-2.5 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-700">{data.manutencao.length}</p>
          <p className="text-[10px] text-blue-600 mt-0.5 font-medium leading-tight">Manutenção</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-2.5 text-center border border-amber-100">
          <p className="text-xl font-bold text-amber-700">{data.orcamento.length}</p>
          <p className="text-[10px] text-amber-600 mt-0.5 font-medium leading-tight">Orçamento{data.orcamento.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-2.5 text-center border border-indigo-100 relative">
          <p className="text-xl font-bold text-indigo-700">{data.agendados.length}</p>
          <p className="text-[10px] text-indigo-600 mt-0.5 font-medium leading-tight">Agendados</p>
          {atrasados.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{atrasados.length}</span>
          )}
        </div>
      </div>

      {/* ── AGENDA ─────────────────────────────────────────── */}
      {data.agendados.length > 0 && (
        <div>
          {/* Cabeçalho colapsável */}
          <button
            onClick={() => setAgendaAberta(a => !a)}
            className="w-full flex items-center gap-2 mb-3 group">
            <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ver agendamentos ({data.agendados.length})
            </span>
            {atrasados.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                {atrasados.length} atrasado{atrasados.length > 1 ? 's' : ''}
              </span>
            )}
            <span className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors">
              {agendaAberta
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {agendaAberta && (
            <>
              {/* Chips de filtro */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {FILTROS.map(f => (
                  <button key={f.key} onClick={() => setFiltroAgenda(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      filtroAgenda === f.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                    }`}>
                    {f.label}
                    {f.key === 'hoje'    && hoje.length    > 0 && <span className="ml-1 opacity-70">({hoje.length})</span>}
                    {f.key === 'semana'  && semana.length  > 0 && <span className="ml-1 opacity-70">({semana.length})</span>}
                    {f.key === 'proxima' && proxima.length > 0 && <span className="ml-1 opacity-70">({proxima.length})</span>}
                    {f.key === 'todos'   && data.agendados.length > 0 && <span className="ml-1 opacity-70">({data.agendados.length})</span>}
                  </button>
                ))}
              </div>

              {/* Atrasados — sempre visíveis como alerta */}
              {atrasados.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    ⚠ Atrasados — não confirmaram chegada
                  </p>
                  <div className="space-y-2">
                    {atrasados.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)}
                  </div>
                </div>
              )}

              {/* Filtro selecionado */}
              {agendadosFiltrados.length === 0 && !atrasados.length ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum agendamento nesse período</p>
              ) : (
                <div className="space-y-2">
                  {filtroAgenda === 'todos' ? (
                    <>
                      {hoje.length   > 0 && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-2 mb-1">Hoje</p>}
                      {hoje.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)}
                      {semana.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">Esta semana</p>}
                      {semana.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)}
                      {proxima.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">Próxima semana</p>}
                      {proxima.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)}
                      {futuro.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">Mais à frente</p>}
                      {futuro.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)}
                    </>
                  ) : (
                    agendadosFiltrados.map(os => <AgendaCard key={os.id} os={os} onOpen={onOpenOS} />)
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Prontos para retirar */}
      {data.prontos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Prontos para retirar
          </p>
          <div className="space-y-2">
            {data.prontos.map(os => (
              <button key={os.id} onClick={() => onOpenOS(os)}
                className="w-full bg-white rounded-2xl border border-green-100 p-3 flex items-center gap-3 text-left hover:border-green-200 transition-colors shadow-sm">
                <PlateTag placa={os.vehicle?.placa || '???'} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{os.vehicle?.modelo}</p>
                  <p className="text-xs text-slate-500 truncate">{os.client?.nome}</p>
                </div>
                {os.totals?.venda > 0 && <p className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(os.totals.venda)}</p>}
                <TecnicoAvatar nome={os.tecnico} />
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Em manutenção */}
      {data.manutencao.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Em manutenção
          </p>
          <div className="space-y-2">
            {data.manutencao.map(os => (
              <button key={os.id} onClick={() => onOpenOS(os)}
                className={`w-full bg-white rounded-2xl border p-3 flex items-center gap-3 text-left transition-colors ${
                  os.urgente ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-blue-100'
                }`}>
                <div className="relative shrink-0">
                  <PlateTag placa={os.vehicle?.placa || '???'} />
                  {os.aprovacaoStatus === 'aprovado' && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {os.urgente && <TriangleAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    <p className="font-semibold text-slate-900 text-sm truncate">{os.vehicle?.modelo}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-slate-500 truncate">{os.client?.nome}</p>
                    {os.problemaFlag && <Flag className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                  {os.checklist?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${Math.round((os.checklist.filter(t=>t.feito).length / os.checklist.length) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {os.checklist.filter(t=>t.feito).length}/{os.checklist.length}
                      </span>
                    </div>
                  )}
                </div>
                <TecnicoAvatar nome={os.tecnico} />
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orçamentos */}
      {data.orcamento.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Orçamentos abertos
          </p>
          <div className="space-y-2">
            {data.orcamento.map(os => (
              <button key={os.id} onClick={() => onOpenOS(os)}
                className={`w-full bg-white rounded-2xl border p-3 flex items-center gap-3 text-left transition-colors ${
                  os.aprovacaoStatus === 'aprovado'
                    ? 'border-green-200 hover:border-green-300 bg-green-50/30'
                    : 'border-gray-100 hover:border-amber-100'
                }`}>
                <div className="relative shrink-0">
                  <PlateTag placa={os.vehicle?.placa || '???'} />
                  {os.aprovacaoStatus === 'aprovado' && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{os.vehicle?.modelo}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-slate-500 truncate">{os.client?.nome} · {formatDate(os.createdAt)}</p>
                    {os.aprovacaoStatus === 'aprovado' && (
                      <span className="text-xs text-green-600 font-semibold shrink-0">✓ Aprovado</span>
                    )}
                  </div>
                </div>
                <TecnicoAvatar nome={os.tecnico} />
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {activeCount === 0 && data.agendados.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tudo tranquilo por aqui!</p>
          <p className="text-sm mt-1">Toque no + para abrir uma OS</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onNewOS}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 z-40"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>
    </div>
  )
}

// ── MAIN OFICINA ──────────────────────────────────────────
export default function Oficina() {
  const { user } = useAuth()
  const [selectedOS, setSelectedOS] = useState(null)
  const [showNewOS, setShowNewOS] = useState(false)
  const [prefillPlate, setPrefillPlate] = useState('')
  const [refresh, setRefresh] = useState(0)
  const reload = () => setRefresh(r => r + 1)

  // Check sessionStorage for pre-fill plate (from Historico > Nova OS)
  useEffect(() => {
    const stored = sessionStorage.getItem('boxcerto_prefill_plate')
    if (stored) {
      sessionStorage.removeItem('boxcerto_prefill_plate')
      setPrefillPlate(stored)
      setShowNewOS(true)
    }
  }, [])

  const openOS = (os) => setSelectedOS(os)

  if (selectedOS) {
    return (
      <OSDetailModal
        os={selectedOS}
        onClose={() => { setSelectedOS(null); reload() }}
        officeName={user.oficina}
      />
    )
  }

  return (
    <>
      <Dashboard
        key={refresh}
        officeName={user.oficina}
        onOpenOS={openOS}
        onNewOS={() => { setPrefillPlate(''); setShowNewOS(true) }}
      />
      {showNewOS && (
        <NewOSModal
          officeName={user.oficina}
          prefillPlate={prefillPlate}
          onClose={() => { setShowNewOS(false); setPrefillPlate(''); reload() }}
        />
      )}
    </>
  )
}

// ── NEW OS MODAL ─────────────────────────────────────────
function NewOSModal({ officeName, onClose, prefillPlate = '' }) {
  const [placa, setPlaca] = useState(prefillPlate)
  const [step, setStep] = useState('plate') // plate | newClient | confirm
  const [vehicle, setVehicle] = useState(null)
  const [client, setClient] = useState(null)
  const [km, setKm] = useState('')
  const [agendadoPara, setAgendadoPara] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [newClient, setNewClient] = useState({
    nome: '', whatsapp: '', cpf: '', dataNascimento: '',
    cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '',
    modelo: ''
  })
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [existingClient, setExistingClient] = useState(null)
  const [allClients, setAllClients] = useState([]) // pre-loaded for suggestions
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    clientStorage.getAll(officeName).then(setAllClients)
  }, [officeName])

  const formatPlate = (v) => {
    const clean = v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (clean.length <= 3) return clean
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`
  }
  const formatWpp = (val) => {
    const n = val.replace(/\D/g, '')
    if (n.length <= 2) return n
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
  }
  const formatCPF = (val) => {
    const n = val.replace(/\D/g, '').slice(0, 11)
    if (n.length <= 3) return n
    if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`
    if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`
    return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`
  }
  const validateCPF = (cpf) => {
    if (!cpf) return true // optional
    const n = cpf.replace(/\D/g, '')
    if (n.length !== 11) return false
    if (/^(\d)\1{10}$/.test(n)) return false // all same digit
    return true
  }
  const handleCEP = async (val) => {
    const cep = val.replace(/\D/g, '')
    const formatted = cep.length > 5 ? `${cep.slice(0,5)}-${cep.slice(5,8)}` : cep
    setNewClient(p => ({ ...p, cep: formatted }))
    if (cep.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) setNewClient(p => ({ ...p, endereco: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' }))
      } catch {}
      setCepLoading(false)
    }
  }

  const validatePlate = (placa) => {
    const clean = placa.replace(/[^A-Z0-9]/g, '')
    if (/^[A-Z]{3}\d{4}$/.test(clean)) return true  // old: ABC1234
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean)) return true  // mercosul: ABC1A23
    return false
  }

  const searchPlate = async () => {
    const clean = placa.replace(/[^a-zA-Z0-9]/g, '')
    if (clean.length < 7) return setError('Placa inválida.')
    if (!validatePlate(placa.toUpperCase())) return setError('Formato inválido. Use ABC-1234 ou ABC-1A23 (Mercosul).')
    setError('')
    setLoading(true)
    const found = await vehicleStorage.getByPlate(officeName, placa)
    if (found) {
      setVehicle(found)
      const c = allClients.find(c => c.id === found.clientId)
      setClient(c)
      setStep('confirm')
    } else {
      setStep('newClient')
    }
    setLoading(false)
  }

  const handleNomeChange = (val) => {
    setNewClient(p => ({ ...p, nome: val }))
    setExistingClient(null)
    if (val.length >= 4) {
      const matches = allClients.filter(c => c.nome.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      setClientSuggestions(matches)
    } else {
      setClientSuggestions([])
    }
  }

  const selectExistingClient = (c) => {
    setExistingClient(c)
    setNewClient(p => ({
      ...p,
      nome: c.nome,
      whatsapp: c.whatsapp || '',
      cpf: c.cpf || '',
      dataNascimento: c.dataNascimento || '',
      cep: c.cep || '',
      endereco: c.endereco || '',
      numero: c.numero || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      uf: c.uf || '',
    }))
    setClientSuggestions([])
  }

  const createAndOpen = async () => {
    if (!newClient.nome || !newClient.whatsapp || !newClient.modelo)
      return setError('Nome, WhatsApp e Modelo são obrigatórios.')
    if (!validateCPF(newClient.cpf))
      return setError('CPF inválido. Verifique os 11 dígitos.')
    setLoading(true)
    try {
      const c = existingClient
        ? existingClient
        : await clientStorage.create({ officeName, ...newClient })
      const v = await vehicleStorage.create({ officeName, clientId: c.id, placa, modelo: newClient.modelo })
      await osStorage.create({ officeName, vehicleId: v.id, km, agendadoPara: agendadoPara || null })
      onClose()
    } catch (e) {
      setError(e.message || 'Erro ao criar OS.')
      setLoading(false)
    }
  }

  const openOS = async () => {
    setLoading(true)
    try {
      await osStorage.create({ officeName, vehicleId: vehicle.id, km, agendadoPara: agendadoPara || null })
      onClose()
    } catch (e) {
      setError(e.message || 'Erro ao criar OS.')
      setLoading(false)
    }
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Nova Ordem de Serviço</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          {step === 'plate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Placa do Veículo</label>
                <input type="text" value={placa} onChange={e => setPlaca(formatPlate(e.target.value))}
                  placeholder="ABC-1D23" maxLength={8} autoFocus
                  className="w-full px-4 py-4 text-center text-2xl font-bold plate-mercosul rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 uppercase tracking-widest" />
              </div>
              <button onClick={searchPlate} disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                <Search className="w-5 h-5 inline mr-2" />{loading ? 'Buscando...' : 'Buscar / Abrir OS'}
              </button>
            </div>
          )}

          {(step === 'newClient' || step === 'confirm') && (
            <div className="space-y-3">
              {/* Seção KM + Agendamento */}
              <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrada do Veículo</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Gauge className="w-3 h-3" />KM atual</label>
                    <input type="number" placeholder="Ex: 85000" value={km}
                      onChange={e => setKm(e.target.value)} className={inp} min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><CalendarClock className="w-3 h-3" />Agendar entrada</label>
                    <input type="datetime-local" value={agendadoPara}
                      onChange={e => setAgendadoPara(e.target.value)} className={inp} />
                  </div>
                </div>
              </div>

              {step === 'newClient' && (
                <>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
                    Placa <strong>{placa}</strong> não encontrada. Cadastre o cliente:
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Dados do Cliente</p>
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="João da Silva Santos"
                      value={newClient.nome}
                      onChange={e => handleNomeChange(e.target.value)}
                      autoFocus
                      className={`${inp} ${existingClient ? 'border-green-400 bg-green-50' : ''}`}
                    />
                    {existingClient && (
                      <span className="absolute right-3 top-[2.1rem] text-xs text-green-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Cliente encontrado
                      </span>
                    )}
                    {clientSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-3 pt-2 pb-1">Clientes cadastrados</p>
                        {clientSuggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); selectExistingClient(c) }}
                            className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-2 border-t border-gray-50"
                          >
                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-indigo-600 text-xs font-bold">{c.nome[0].toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{c.nome}</p>
                              {c.whatsapp && <p className="text-xs text-slate-400">{c.whatsapp}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">CPF</label>
                      <input type="text" placeholder="000.000.000-00" value={newClient.cpf}
                        onChange={e => setNewClient(p => ({...p, cpf: formatCPF(e.target.value)}))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nascimento</label>
                      <input type="date" value={newClient.dataNascimento}
                        onChange={e => setNewClient(p => ({...p, dataNascimento: e.target.value}))} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp *</label>
                    <input type="text" placeholder="(51) 99999-9999" value={newClient.whatsapp}
                      onChange={e => setNewClient(p => ({...p, whatsapp: formatWpp(e.target.value)}))} maxLength={15} className={inp} />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Endereço</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">CEP {cepLoading && <span className="text-indigo-500">buscando...</span>}</label>
                      <input type="text" placeholder="00000-000" value={newClient.cep}
                        onChange={e => handleCEP(e.target.value)} maxLength={9} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                      <input type="text" placeholder="123" value={newClient.numero}
                        onChange={e => setNewClient(p => ({...p, numero: e.target.value}))} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rua / Logradouro</label>
                    <input type="text" value={newClient.endereco}
                      onChange={e => setNewClient(p => ({...p, endereco: e.target.value}))} className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                      <input type="text" value={newClient.bairro}
                        onChange={e => setNewClient(p => ({...p, bairro: e.target.value}))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Cidade / UF</label>
                      <div className="flex gap-1">
                        <input type="text" value={newClient.cidade}
                          onChange={e => setNewClient(p => ({...p, cidade: e.target.value}))} className={inp} />
                        <input type="text" value={newClient.uf} maxLength={2}
                          onChange={e => setNewClient(p => ({...p, uf: e.target.value.toUpperCase()}))}
                          className={`${inp} w-12 text-center px-1`} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Veículo</p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Modelo *</label>
                    <input type="text" placeholder="Fiat Strada 2022" value={newClient.modelo}
                      onChange={e => setNewClient(p => ({...p, modelo: e.target.value}))} className={inp} />
                  </div>
                  <button onClick={createAndOpen} disabled={loading}
                    className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors mt-2 disabled:opacity-60">
                    {loading ? 'Salvando...' : 'Cadastrar e Abrir OS'}
                  </button>
                </>
              )}

              {step === 'confirm' && vehicle && client && (
                <>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <PlateTag placa={vehicle.placa} />
                      <div>
                        <p className="font-bold text-slate-900">{vehicle.modelo}</p>
                        <p className="text-sm text-slate-500">{client.nome}</p>
                      </div>
                    </div>
                    {client.whatsapp && <p className="text-xs text-slate-400">{client.whatsapp}</p>}
                  </div>
                  <button onClick={openOS} disabled={loading}
                    className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                    <Plus className="w-5 h-5 inline mr-2" />{loading ? 'Abrindo...' : 'Abrir OS'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── DELIVERY MODAL ────────────────────────────────────────
function DeliveryModal({ os, items, desconto, onConfirm, onCancel }) {
  const subtotal = items.reduce((s, i) => s + i.venda, 0)
  const descontoValor = (() => {
    if (!desconto || !desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * desconto.valor / 100
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total = Math.max(0, subtotal - descontoValor)

  const [deliveredAt, setDeliveredAt] = useState(localDatetimeNow())
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [payments, setPayments] = useState([])

  const paidTotal = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const remaining = total - paidTotal
  const balanced = Math.abs(remaining) < 0.01

  const addPayment = (method) => {
    if (payments.find(p => p.method === method)) return
    const autoAmount = remaining > 0 ? remaining.toFixed(2) : ''
    setPayments(prev => [...prev, { method, amount: autoAmount }])
  }
  const removePayment = (method) => setPayments(prev => prev.filter(p => p.method !== method))
  const updateAmount = (method, val) => setPayments(prev => prev.map(p => p.method === method ? { ...p, amount: val } : p))

  const handleConfirm = () => {
    if (!balanced || payments.length === 0) return
    onConfirm({ deliveredAt: new Date(deliveredAt).toISOString(), deliveryNotes, payments, desconto })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-900">Entregar Veículo</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4">
          {/* Total */}
          <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium">Total da OS</p>
              <p className="text-white text-2xl font-bold mt-0.5">{formatCurrency(total)}</p>
              {descontoValor > 0 && (
                <p className="text-green-400 text-xs mt-1">Desconto: − {formatCurrency(descontoValor)}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Pago</p>
              <p className={`text-xl font-bold mt-0.5 ${balanced ? 'text-green-400' : 'text-amber-400'}`}>{formatCurrency(paidTotal)}</p>
            </div>
          </div>

          {/* Saldo */}
          {!balanced && payments.length > 0 && (
            <div className={`rounded-xl px-4 py-3 flex justify-between ${remaining > 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
              <span className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-orange-600'}`}>{remaining > 0 ? 'Faltam' : 'Troco'}</span>
              <span className={`text-base font-bold ${remaining > 0 ? 'text-red-600' : 'text-orange-600'}`}>{formatCurrency(Math.abs(remaining))}</span>
            </div>
          )}
          {balanced && payments.length > 0 && (
            <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Conta fechada! Pronto para entregar.</span>
            </div>
          )}

          {/* Formas de pagamento */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formas de Pagamento</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => {
                const active = payments.find(p => p.method === key)
                return (
                  <button key={key} onClick={() => active ? removePayment(key) : addPayment(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-slate-600 hover:border-indigo-200'}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                    {active && <X className="w-3 h-3 ml-0.5 text-indigo-400" />}
                  </button>
                )
              })}
            </div>
            {payments.length > 0 && (
              <div className="space-y-2">
                {payments.map(({ method, amount }) => {
                  const meta = PAYMENT_METHODS.find(m => m.key === method)
                  return (
                    <div key={method} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <span className="text-sm font-medium text-slate-700 w-20 shrink-0">{meta?.label}</span>
                      <span className="text-slate-400 text-sm shrink-0">R$</span>
                      <input type="number" value={amount} onChange={e => updateAmount(method, e.target.value)}
                        placeholder="0,00" className="flex-1 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none" min="0" step="0.01" />
                      <button onClick={() => removePayment(method)} className="p-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  )
                })}
              </div>
            )}
            {payments.length === 0 && <p className="text-sm text-slate-400 text-center py-2">Selecione ao menos uma forma de pagamento</p>}
          </div>

          {/* Data/hora */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 inline mr-1" />Data e Hora de Entrega
            </label>
            <input type="datetime-local" value={deliveredAt} onChange={e => setDeliveredAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações da Entrega</label>
            <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
              placeholder="Ex: cliente satisfeito, peça em garantia de 90 dias..."
              rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          <button onClick={handleConfirm} disabled={!balanced || payments.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${balanced && payments.length > 0 ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <PackageCheck className="w-5 h-5" />Confirmar Entrega
          </button>
        </div>
      </div>
    </div>
  )
}

// ── STOCK PICKER ROW ─────────────────────────────────────
function StockPickerRow({ item, onAdd }) {
  const [qty, setQty] = useState(1)
  const semEstoque = item.quantidade <= 0
  const insuficiente = qty > item.quantidade

  return (
    <div className={`bg-white rounded-lg px-3 py-2.5 flex items-center gap-2 ${semEstoque ? 'opacity-70' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.produto}</p>
        <p className={`text-xs font-medium ${semEstoque ? 'text-red-500' : insuficiente ? 'text-amber-500' : 'text-slate-400'}`}>
          {semEstoque ? 'Sem estoque' : `${item.quantidade} disponível${item.quantidade > 1 ? 's' : ''}`}
        </p>
      </div>
      <p className="text-xs font-semibold text-slate-700 shrink-0">{formatCurrency(item.valorVenda)}</p>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
          className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-slate-600 font-bold text-sm hover:bg-gray-200 transition-colors">−</button>
        <span className="w-6 text-center text-sm font-bold text-slate-900">{qty}</span>
        <button type="button" onClick={() => setQty(q => q + 1)}
          className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-slate-600 font-bold text-sm hover:bg-gray-200 transition-colors">+</button>
      </div>
      <button type="button" onClick={() => onAdd(qty)}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${insuficiente ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
        {insuficiente ? '⚠️ Add' : 'Add'}
      </button>
    </div>
  )
}

// ── OS DETAIL MODAL ───────────────────────────────────────
function OSDetailModal({ os, onClose, officeName }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState(os.status)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showStockPicker, setShowStockPicker] = useState(false)
  const [newItem, setNewItem] = useState({ descricao: '', custo: '', venda: '', garantia: '' })
  const [suggestions, setSuggestions] = useState([])
  const [obs, setObs] = useState(os.observacoes || '')
  const [km, setKm] = useState(os.km || '')
  const [showDelivery, setShowDelivery] = useState(false)
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState({ deliveredAt: os.deliveredAt, payments: os.payments || [], deliveryNotes: os.deliveryNotes || '', desconto: os.desconto })
  const [desconto, setDesconto] = useState(() => {
    const d = os.desconto || {}
    const defaultMetodos = JSON.parse(localStorage.getItem('boxcerto_payment_defaults') || '["dinheiro","pix"]')
    const defaultTipo = localStorage.getItem('boxcerto_desconto_tipo') || 'valor'
    return {
      tipo: d.tipo || defaultTipo,
      valor: d.valor || '',
      metodos: d.metodos || defaultMetodos,
    }
  })
  const [showDesconto, setShowDesconto] = useState(!!(os.desconto?.valor))
  const [editKm, setEditKm] = useState(false)
  const [stockItems, setStockItems] = useState([])
  const [stockPending, setStockPending] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditData, setShowEditData] = useState(false)
  const [editForm, setEditForm] = useState({
    placa: os.vehicle?.placa || '',
    modelo: os.vehicle?.modelo || '',
    clienteNome: os.client?.nome || '',
    clienteWhatsapp: os.client?.whatsapp || '',
    clienteCpf: os.client?.cpf || '',
    clienteNascimento: os.client?.dataNascimento || '',
    clienteCep: os.client?.cep || '',
    clienteEndereco: os.client?.endereco || '',
    clienteNumero: os.client?.numero || '',
    clienteBairro: os.client?.bairro || '',
    clienteCidade: os.client?.cidade || '',
    clienteUf: os.client?.uf || '',
  })
  const [editCepLoading, setEditCepLoading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [itensAlteradosAposAprovacao, setItensAlteradosAposAprovacao] = useState(false)
  const [tecnico, setTecnico] = useState(os.tecnico || '')
  const [tecnicosList, setTecnicosList] = useState([])
  const [showTecnicoPicker, setShowTecnicoPicker] = useState(false)
  const [pickerPos, setPickerPos] = useState(null)
  const tecnicoButtonRef = useRef(null)
  // Bloco 1 — novas funcionalidades do técnico
  const [urgente, setUrgenteState] = useState(os.urgente || false)
  const [problemaFlag] = useState(os.problemaFlag || false)
  const [checklist, setChecklist]   = useState(os.checklist || [])
  const [notasInternas, setNotasInternas] = useState(os.notasInternas || [])
  const [novaTarefaGerente, setNovaTarefaGerente] = useState('')
  const [notaGerenteText, setNotaGerenteText] = useState('')
  const [sendingNotaGerente, setSendingNotaGerente] = useState(false)
  const [showNotasSection, setShowNotasSection] = useState(false)
  const [showChecklistSection, setShowChecklistSection] = useState(false)
  const notasGerenteEndRef = useRef(null)

  const toggleUrgente = async () => {
    const novo = !urgente
    setUrgenteState(novo)
    await osStorage.setUrgente(os.id, novo)
  }

  const adicionarTarefaGerente = async () => {
    if (!novaTarefaGerente.trim()) return
    const nova = [...checklist, { id: crypto.randomUUID(), texto: novaTarefaGerente.trim(), feito: false }]
    setChecklist(nova)
    setNovaTarefaGerente('')
    await osStorage.updateChecklist(os.id, nova)
  }

  const removerTarefaGerente = async (idx) => {
    const nova = checklist.filter((_, i) => i !== idx)
    setChecklist(nova)
    await osStorage.updateChecklist(os.id, nova)
  }

  const toggleTarefaGerente = async (idx) => {
    const nova = checklist.map((t, i) => i === idx ? { ...t, feito: !t.feito } : t)
    setChecklist(nova)
    await osStorage.updateChecklist(os.id, nova)
  }

  const enviarNotaGerente = async () => {
    if (!notaGerenteText.trim()) return
    setSendingNotaGerente(true)
    const nota = {
      autor: 'Gerente',
      texto: notaGerenteText.trim(),
      at: new Date().toISOString(),
      tipo: 'gerente',
    }
    const novas = [...notasInternas, nota]
    setNotasInternas(novas)
    setNotaGerenteText('')
    await osStorage.addNotaInterna(os.id, nota)
    setSendingNotaGerente(false)
    setTimeout(() => notasGerenteEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const reload = async () => {
    const loaded = await itemStorage.getByOS(os.id)
    setItems(loaded)
  }

  useEffect(() => {
    const init = async () => {
      const [loadedItems, loadedStock, officeData] = await Promise.all([
        itemStorage.getByOS(os.id),
        inventoryStorage.getAll(officeName),
        officeDataStorage.get(officeName),
      ])
      setItems(loadedItems)
      setStockItems(loadedStock)
      setTecnicosList(officeData?.tecnicos || [])
    }
    init()
  }, [])

  // totals computed from items state (synchronous)
  const totals = itemStorage.totals(items)
  const descontoValor = (() => {
    if (!desconto.valor) return 0
    if (desconto.tipo === 'percent') return totals.venda * Number(desconto.valor) / 100
    return Math.min(Number(desconto.valor), totals.venda)
  })()
  const totalComDesconto = Math.max(0, totals.venda - descontoValor)

  const handleStatus = async (s) => {
    if (s === 'entregue') { setShowDelivery(true); return }
    if (status === 'entregue') { setShowRevertConfirm(true); return }
    await osStorage.updateStatus(os.id, s)
    setStatus(s)
  }

  const handleDeliveryConfirm = async ({ deliveredAt, deliveryNotes, payments, desconto: d }) => {
    await osStorage.deliverOS(os.id, { deliveredAt, deliveryNotes, payments, desconto: d })
    // Baixa automática no estoque
    await Promise.all(items.filter(item => item.inventoryId).map(item => inventoryStorage.baixar(item.inventoryId, 1)))
    setStatus('entregue')
    setDeliveryInfo({ deliveredAt, payments, deliveryNotes, desconto: d })
    setShowDelivery(false)
  }

  const handleRevert = async () => {
    await osStorage.revertDelivery(os.id)
    setStatus('pronto')
    setDeliveryInfo({ deliveredAt: null, payments: [], deliveryNotes: '', desconto: null })
    setShowRevertConfirm(false)
  }

  const handleDeleteOS = async () => {
    await osStorage.delete(os.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    await Promise.all([
      os.client?.id && clientStorage.update(os.client.id, {
        nome: editForm.clienteNome,
        whatsapp: editForm.clienteWhatsapp,
        cpf: editForm.clienteCpf,
        dataNascimento: editForm.clienteNascimento,
        cep: editForm.clienteCep,
        endereco: editForm.clienteEndereco,
        numero: editForm.clienteNumero,
        bairro: editForm.clienteBairro,
        cidade: editForm.clienteCidade,
        uf: editForm.clienteUf,
      }),
      os.vehicle?.id && vehicleStorage.update(os.vehicle.id, {
        modelo: editForm.modelo,
        placa: editForm.placa,
      }),
    ])
    setSavingEdit(false)
    setShowEditData(false)
  }

  const handleEditCep = async (val) => {
    const cep = val.replace(/\D/g, '')
    const formatted = cep.length > 5 ? `${cep.slice(0,5)}-${cep.slice(5,8)}` : cep
    setEditForm(p => ({ ...p, clienteCep: formatted }))
    if (cep.length === 8) {
      setEditCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) setEditForm(p => ({
          ...p,
          clienteEndereco: data.logradouro || p.clienteEndereco,
          clienteBairro: data.bairro || p.clienteBairro,
          clienteCidade: data.localidade || p.clienteCidade,
          clienteUf: data.uf || p.clienteUf,
        }))
      } catch (_) {}
      setEditCepLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.descricao || !newItem.venda) return
    await itemStorage.add({ osId: os.id, ...newItem })
    setNewItem({ descricao: '', custo: '', venda: '', garantia: '' })
    setSuggestions([])
    setShowAddItem(false)
    await reload()
    if (os.aprovacaoStatus === 'aprovado') setItensAlteradosAposAprovacao(true)
  }

  const handleRemoveItem = async (itemId) => {
    await itemStorage.remove(itemId)
    await reload()
    if (os.aprovacaoStatus === 'aprovado') setItensAlteradosAposAprovacao(true)
  }

  const handleAddFromStock = async (stockItem, qty, forceAdd = false) => {
    const qtdInt = Math.max(1, parseInt(qty) || 1)
    const ficaNegativo = stockItem.quantidade - qtdInt < 0

    if (ficaNegativo && !forceAdd) {
      setStockPending({ item: stockItem, qty: qtdInt })
      return
    }

    const descricao = qtdInt > 1 ? `${stockItem.produto} (x${qtdInt})` : stockItem.produto
    await itemStorage.add({
      osId: os.id,
      descricao,
      custo: stockItem.valorCompra * qtdInt,
      venda: stockItem.valorVenda * qtdInt,
      garantia: '',
      inventoryId: stockItem.id,
    })
    const novaQtd = stockItem.quantidade - qtdInt
    await inventoryStorage.update(stockItem.id, { quantidade: novaQtd })
    setStockItems(prev => prev.map(s => s.id === stockItem.id ? { ...s, quantidade: novaQtd } : s))
    setStockPending(null)
    setShowStockPicker(false)
    await reload()
  }

  const handleDescricao = (val) => {
    setNewItem({ ...newItem, descricao: val })
    setSuggestions(val.length >= 2 ? SERVICOS_COMUNS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 4) : [])
  }

  const handleKmSave = async () => { await osStorage.updateKm(os.id, km); setEditKm(false) }
  const handleSaveObs = async () => osStorage.updateObservacoes(os.id, obs)

  const handleEnviarCliente = async () => {
    const phone = os.client?.whatsapp?.replace(/\D/g, '')
    if (!phone) return alert('Cliente sem WhatsApp cadastrado.')
    setEnviando(true)
    try {
      // Generate token if not exists, or reuse existing
      let token = os.aprovacaoToken
      if (!token) {
        token = await osStorage.generateApprovalToken(os.id)
        // Update local state - setSelectedOS is passed from parent, but here we update os directly
        os.aprovacaoToken = token
        os.aprovacaoStatus = 'pendente'
      }
      const baseUrl = window.location.origin
      const link = `${baseUrl}/o/${token}`
      const msg = WPP_MESSAGES.orcamento(
        os.client?.nome?.split(' ')[0] || 'cliente',
        os.vehicle?.modelo,
        totalComDesconto,
        link
      )
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    } catch (e) {
      alert('Erro ao gerar link de aprovação.')
    } finally {
      setEnviando(false)
    }
  }

  const handlePrint = async () => {
    const raw = await officeDataStorage.get(officeName)
    const officeData = { nome: officeName, ...raw }
    await downloadOsPDF({ os, client: os.client, vehicle: os.vehicle, items, officeData, formatCurrencyFn: formatCurrency, formatDateFn: formatDate, desconto })
  }

  const handlePrintReceipt = async () => {
    const raw = await officeDataStorage.get(officeName)
    const officeData = { nome: officeName, ...raw }
    await downloadReceiptPDF({ os: { ...os, ...deliveryInfo }, client: os.client, vehicle: os.vehicle, items, officeData, formatCurrencyFn: formatCurrency, formatDateFn: formatDate })
  }

  const handleShareWpp = () => {
    const phone = os.client?.whatsapp?.replace(/\D/g, '')
    if (!phone) return alert('Cliente sem WhatsApp cadastrado.')
    const linhas = items.map(i => `  • ${i.descricao}: ${formatCurrency(i.venda)}`).join('\n')
    const desc = descontoValor > 0 ? `\n\n  🏷️ Desconto: − ${formatCurrency(descontoValor)}\n  *Total: ${formatCurrency(totalComDesconto)}*` : `\n\n*Total: ${formatCurrency(totals.venda)}*`
    const msg = `*Orçamento — ${os.vehicle?.modelo} (${os.vehicle?.placa})*\n\nOlá ${os.client?.nome}! Segue o orçamento:\n\n${linhas}${desc}\n\nQualquer dúvida, estamos à disposição!`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const STATUS_WITHOUT_DELIVERY = Object.entries(STATUS_LABELS).filter(([k]) => k !== 'entregue')

  return (
    <>
{/* sem portal — picker controlado pelo estado showTecnicoPicker */}
      <div className="fixed inset-0 z-[60] bg-white flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full shrink-0"><X className="w-5 h-5 text-slate-600" /></button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{os.vehicle?.placa} · {editForm.modelo || os.vehicle?.modelo}</p>
            <p className="text-xs text-slate-400 truncate">{editForm.clienteNome || os.client?.nome} · {formatDate(os.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={`https://wa.me/55${os.client?.whatsapp?.replace(/\D/g,'')}?text=${encodeURIComponent(WPP_MESSAGES[status]?.(os.client?.nome, os.vehicle?.modelo, totalComDesconto) || '')}`}
              target="_blank" rel="noreferrer"
              className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </a>
            {os.status !== 'entregue' && (
              <button
                onClick={handleEnviarCliente}
                disabled={enviando}
                title="Enviar link de aprovação para o cliente"
                className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {enviando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Enviar para cliente
              </button>
            )}
            <button onClick={handleShareWpp} className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button onClick={handlePrint} className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
              <Printer className="w-4 h-4 text-indigo-600" />
            </button>
            <button onClick={() => setShowEditData(true)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Edit2 className="w-4 h-4 text-slate-500" />
            </button>
            {status !== 'entregue' && (
              <button onClick={() => setShowDeleteConfirm(true)} className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* ── Status bar — sempre visível no topo ────────────── */}
        <div className="shrink-0 grid grid-cols-3 gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
          {STATUS_WITHOUT_DELIVERY.map(([key, label]) => (
            <button key={key} onClick={() => handleStatus(key)} disabled={status === 'entregue'}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                status === key
                  ? key === 'orcamento'  ? 'bg-amber-500 text-white shadow-sm'
                  : key === 'manutencao' ? 'bg-blue-600 text-white shadow-sm'
                  :                        'bg-green-600 text-white shadow-sm'
                  : status === 'entregue' ? 'bg-gray-100 text-slate-300 cursor-not-allowed'
                  : 'bg-white text-slate-500 hover:bg-gray-100 border border-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Banner: Confirmar chegada */}
          {os.agendadoPara && status === 'orcamento' && (() => {
            const d = new Date(os.agendadoPara)
            const isAtrasado = d < new Date() && d.toDateString() !== new Date().toDateString()
            return (
              <div className={`rounded-2xl p-4 border flex items-center gap-3 ${isAtrasado ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <CalendarClock className={`w-5 h-5 shrink-0 ${isAtrasado ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${isAtrasado ? 'text-red-700' : 'text-amber-700'}`}>
                    {isAtrasado ? '⚠ Agendamento em atraso' : 'Agendado para:'}
                  </p>
                  <p className={`text-sm font-semibold ${isAtrasado ? 'text-red-900' : 'text-amber-900'}`}>
                    {d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} às {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={async () => { await osStorage.confirmarChegada(os.id); onClose() }}
                  className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors shrink-0 whitespace-nowrap">
                  Confirmar chegada ✓
                </button>
              </div>
            )
          })()}

          {/* KM + badge Aprovado na mesma linha */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-0">
              <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 shrink-0">KM</span>
              {editKm ? (
                <>
                  <input type="number" value={km} onChange={e => setKm(e.target.value)} autoFocus
                    className="flex-1 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none min-w-0" placeholder="0" />
                  <button onClick={handleKmSave} className="p-1 bg-indigo-100 rounded-lg shrink-0"><Check className="w-3.5 h-3.5 text-indigo-600" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-semibold text-slate-900">{km || '—'}</span>
                  {status !== 'entregue' && (
                    <button onClick={() => setEditKm(true)} className="p-1 hover:bg-gray-200 rounded-lg shrink-0"><Edit2 className="w-3.5 h-3.5 text-slate-400" /></button>
                  )}
                </>
              )}
            </div>

            {os.aprovacaoStatus === 'aprovado' && !itensAlteradosAposAprovacao && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-2.5 py-2 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-green-800 leading-tight">Aprovado</p>
                  {os.aprovadoEm && (
                    <p className="text-[10px] text-green-600 leading-tight">
                      {new Date(os.aprovadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Técnico responsável — lista inline, sem z-index */}
          {(tecnicosList.length > 0 || tecnico) && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {/* Linha do técnico atual */}
              <button
                onClick={() => status !== 'entregue' && setShowTecnicoPicker(p => !p)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${status !== 'entregue' ? 'hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer' : 'cursor-default'}`}
              >
                <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">Técnico</span>
                <span className={`flex-1 text-sm font-semibold ${tecnico ? 'text-slate-900' : 'text-slate-400'}`}>
                  {tecnico || 'Toque para atribuir'}
                </span>
                {tecnico && <TecnicoAvatar nome={tecnico} />}
                {status !== 'entregue' && (showTecnicoPicker
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Lista expandida inline */}
              {showTecnicoPicker && (
                <div className="border-t border-gray-200 bg-white">
                  {/* Sem técnico */}
                  <button
                    type="button"
                    onClick={async () => {
                      setTecnico('')
                      setShowTecnicoPicker(false)
                      await osStorage.updateTecnico(os.id, '')
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-gray-100 active:bg-gray-50 ${!tecnico ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-slate-400 text-[10px]">—</span>
                    </div>
                    <span className={`text-xs font-medium flex-1 ${!tecnico ? 'text-indigo-700' : 'text-slate-500'}`}>
                      Sem técnico
                    </span>
                    {!tecnico && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>

                  {/* Lista de técnicos */}
                  {tecnicosList.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={async () => {
                        setTecnico(t.nome)
                        setShowTecnicoPicker(false)
                        await osStorage.updateTecnico(os.id, t.nome)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-gray-100 last:border-0 active:bg-gray-50 ${tecnico === t.nome ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-[9px] font-bold">{iniciais(t.nome)}</span>
                      </div>
                      <span className={`flex-1 text-xs font-medium truncate ${tecnico === t.nome ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {t.nome}
                      </span>
                      {tecnico === t.nome && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Urgente + Problema flag ─────────────────────── */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleUrgente}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                urgente
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
              }`}
            >
              <TriangleAlert className={`w-3 h-3 ${urgente ? 'text-red-500' : 'text-slate-400'}`} />
              {urgente ? 'Urgente ✕' : 'Urgente'}
            </button>
            {problemaFlag && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                <Flag className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Problema</span>
              </div>
            )}
          </div>

          {/* ── Tarefas (checklist) ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowChecklistSection(p => !p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-slate-700">Tarefas</span>
              {checklist.length > 0 && (
                <span className="text-xs text-indigo-600 font-semibold">
                  {checklist.filter(t => t.feito).length}/{checklist.length}
                </span>
              )}
              {showChecklistSection
                ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              }
            </button>
            {showChecklistSection && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                {checklist.length > 0 && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.round((checklist.filter(t=>t.feito).length / checklist.length) * 100)}%` }}
                    />
                  </div>
                )}
                {checklist.map((task, i) => (
                  <div key={task.id || i} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => toggleTarefaGerente(i)}
                      className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${task.feito ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'}`}
                    >
                      {task.feito && <Check className="w-2.5 h-2.5 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.feito ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.texto}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerTarefaGerente(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-1">Nenhuma tarefa</p>
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={novaTarefaGerente}
                    onChange={e => setNovaTarefaGerente(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && adicionarTarefaGerente()}
                    placeholder="Adicionar tarefa..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-400 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={adicionarTarefaGerente}
                    disabled={!novaTarefaGerente.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Notas internas ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotasSection(p => !p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <Flag className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-slate-700">Notas internas</span>
              {notasInternas.length > 0 && (
                <span className="text-xs text-slate-400">{notasInternas.length}</span>
              )}
              {problemaFlag && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mr-1">⚠ Problema</span>
              )}
              {showNotasSection
                ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              }
            </button>
            {showNotasSection && (
              <div className="border-t border-gray-100">
                <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                  {notasInternas.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Nenhuma nota ainda</p>
                  )}
                  {notasInternas.map((nota, i) => {
                    const eh = nota.tipo === 'gerente'
                    return (
                      <div key={i} className={`flex flex-col ${eh ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          eh ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-slate-800 rounded-tl-sm'
                        }`}>
                          {nota.texto}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                          {nota.autor} · {nota.at ? new Date(nota.at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''}
                        </p>
                      </div>
                    )
                  })}
                  <div ref={notasGerenteEndRef} />
                </div>
                <div className="px-4 pb-3 flex gap-2 border-t border-gray-50">
                  <input
                    type="text"
                    value={notaGerenteText}
                    onChange={e => setNotaGerenteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarNotaGerente()}
                    placeholder="Nota interna..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-400 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={enviarNotaGerente}
                    disabled={!notaGerenteText.trim() || sendingNotaGerente}
                    className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                  >
                    {sendingNotaGerente ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aviso: itens alterados após aprovação */}
          {itensAlteradosAposAprovacao && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800">Orçamento alterado após aprovação</p>
                  <p className="text-xs text-amber-600 mt-0.5">O cliente aprovou uma versão diferente. Recomendamos re-enviar o link para nova aprovação.</p>
                </div>
              </div>
              <button
                onClick={handleEnviarCliente}
                disabled={enviando}
                className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Re-enviar para aprovação
              </button>
            </div>
          )}

          {/* Info entrega */}
          {status === 'entregue' && (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-bold text-green-800">Veículo Entregue</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintReceipt} className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700">
                    <ReceiptText className="w-3.5 h-3.5" /> Recibo
                  </button>
                  <button onClick={() => setShowRevertConfirm(true)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium">
                    <RotateCcw className="w-3.5 h-3.5" /> Estornar
                  </button>
                </div>
              </div>
              {deliveryInfo.deliveredAt && (
                <p className="text-xs text-green-700 mb-2"><Clock className="w-3 h-3 inline mr-1" />{new Date(deliveryInfo.deliveredAt).toLocaleString('pt-BR')}</p>
              )}
              {deliveryInfo.payments?.length > 0 && (
                <div className="space-y-1">
                  {deliveryInfo.payments.map((p, i) => {
                    const meta = PAYMENT_METHODS.find(m => m.key === p.method)
                    return <div key={i} className="flex justify-between text-xs text-green-700"><span>{meta?.label || p.method}</span><span className="font-semibold">{formatCurrency(Number(p.amount))}</span></div>
                  })}
                </div>
              )}
              {deliveryInfo.deliveryNotes && <p className="text-xs text-green-600 italic mt-2">"{deliveryInfo.deliveryNotes}"</p>}
            </div>
          )}

          {/* Itens */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Serviços / Peças</p>
              {status !== 'entregue' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowStockPicker(true); setShowAddItem(false) }}
                    className="flex items-center gap-1 text-xs text-slate-500 font-semibold hover:text-indigo-600 transition-colors">
                    <Package className="w-3.5 h-3.5" /> Estoque
                  </button>
                  <button onClick={() => { setShowAddItem(!showAddItem); setShowStockPicker(false) }}
                    className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              )}
            </div>

            {/* Picker do estoque */}
            {showStockPicker && (
              <div className="bg-indigo-50 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600">Selecione do estoque:</p>
                  <button onClick={() => setShowStockPicker(false)} className="text-xs text-slate-400 hover:text-slate-600">Fechar</button>
                </div>
                {stockItems.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhum produto cadastrado</p>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {stockItems.map(s => (
                      <StockPickerRow key={s.id} item={s} onAdd={(qty) => handleAddFromStock(s, qty)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal confirmação estoque negativo */}
            {stockPending && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-6">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-slate-900">Estoque insuficiente</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-1"><strong>{stockPending.item.produto}</strong></p>
                  <p className="text-sm text-slate-500 mb-5">
                    Disponível: <strong>{stockPending.item.quantidade}</strong> · Solicitado: <strong>{stockPending.qty}</strong><br />
                    O estoque ficará em <strong className="text-red-600">{stockPending.item.quantidade - stockPending.qty}</strong>. Deseja adicionar mesmo assim?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setStockPending(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => handleAddFromStock(stockPending.item, stockPending.qty, true)}
                      className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">
                      Adicionar mesmo assim
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAddItem && status !== 'entregue' && (
              <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
                <div className="relative">
                  <input type="text" placeholder="Descrição do serviço..." value={newItem.descricao}
                    onChange={e => handleDescricao(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden mt-1">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => { setNewItem({ ...newItem, descricao: s }); setSuggestions([]) }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Custo (seu)</label>
                    <input type="number" placeholder="0,00" value={newItem.custo}
                      onChange={e => setNewItem({ ...newItem, custo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Venda (cliente)</label>
                    <input type="number" placeholder="0,00" value={newItem.venda}
                      onChange={e => setNewItem({ ...newItem, venda: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">🛡️ Garantia (opcional)</label>
                  <select value={newItem.garantia} onChange={e => setNewItem({ ...newItem, garantia: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    {GARANTIA_OPTIONS.map(g => <option key={g} value={g}>{g || 'Sem garantia'}</option>)}
                  </select>
                </div>
                <button onClick={handleAddItem}
                  className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                  Adicionar Item
                </button>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">Custo: {formatCurrency(item.custo)}</p>
                        {item.garantia && <span className="text-xs text-indigo-500">🛡️ {item.garantia}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 shrink-0">{formatCurrency(item.venda)}</p>
                    {status !== 'entregue' && (
                      <button onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desconto e Pagamento */}
          {status !== 'entregue' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Toggle header */}
              <button
                onClick={() => setShowDesconto(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" />
                  Desconto e Pagamento
                  {descontoValor > 0 && (
                    <span className="ml-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full normal-case tracking-normal">
                      − {formatCurrency(descontoValor)}
                    </span>
                  )}
                </span>
                {showDesconto
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showDesconto && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                  {/* Tipo + valor */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Desconto</p>
                    <div className="flex gap-2">
                      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                        <button onClick={() => setDesconto(p => ({...p, tipo: 'valor'}))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${desconto.tipo === 'valor' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                          R$
                        </button>
                        <button onClick={() => setDesconto(p => ({...p, tipo: 'percent'}))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${desconto.tipo === 'percent' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                          %
                        </button>
                      </div>
                      <input type="number" value={desconto.valor} min="0"
                        max={desconto.tipo === 'percent' ? 100 : undefined}
                        onChange={e => setDesconto(p => ({...p, valor: e.target.value}))}
                        placeholder={desconto.tipo === 'percent' ? 'Ex: 10' : 'Ex: 50,00'}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                    </div>
                    {descontoValor > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1.5">
                        Desconto de {formatCurrency(descontoValor)} · Total: {formatCurrency(totalComDesconto)}
                      </p>
                    )}
                  </div>

                  {/* Formas de pagamento */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Desconto válido ao pagar em:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(m => {
                        const checked = desconto.metodos?.includes(m.key)
                        return (
                          <label key={m.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                            <input type="checkbox" checked={!!checked}
                              onChange={() => setDesconto(p => ({
                                ...p,
                                metodos: checked
                                  ? (p.metodos || []).filter(k => k !== m.key)
                                  : [...(p.metodos || []), m.key]
                              }))}
                              className="w-3.5 h-3.5 accent-indigo-600" />
                            <span className={`text-xs font-medium ${checked ? 'text-indigo-700' : 'text-slate-600'}`}>{m.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações</p>
            <textarea value={obs} onChange={e => setObs(e.target.value)} onBlur={handleSaveObs}
              disabled={status === 'entregue'} placeholder="Anotações sobre o serviço..."
              rows={3} className="w-full text-sm text-slate-700 resize-none focus:outline-none placeholder-slate-300 disabled:opacity-60" />
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-100 bg-white p-4 shrink-0">
          {items.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">{formatCurrency(totals.venda)}</span>
              </div>
              {descontoValor > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">{buildDescontoLabel(desconto, descontoValor) || 'Desconto'}</span>
                  <span className="text-green-600">− {formatCurrency(descontoValor)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">{formatCurrency(totalComDesconto)}</span>
              </div>
            </div>
          )}
          {status !== 'entregue' && (
            <button onClick={() => setShowDelivery(true)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95">
              <PackageCheck className="w-5 h-5" />Entregar Veículo
            </button>
          )}
        </div>
      </div>

      {showDelivery && (
        <DeliveryModal os={os} items={items} desconto={desconto}
          onConfirm={handleDeliveryConfirm} onCancel={() => setShowDelivery(false)} />
      )}

      {showRevertConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900">Estornar entrega?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">Cancela o registro de entrega e pagamento, voltando o status para <strong>Pronto</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRevertConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleRevert}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                Sim, estornar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditData && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Editar Dados da OS</h2>
              <button onClick={() => setShowEditData(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {/* Veículo */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veículo</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Placa</label>
                  <input value={editForm.placa}
                    onChange={e => setEditForm(p => ({...p, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')}))}
                    placeholder="ABC-1234"
                    maxLength={8}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 font-mono tracking-widest" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modelo</label>
                  <input value={editForm.modelo}
                    onChange={e => setEditForm(p => ({...p, modelo: e.target.value}))}
                    placeholder="Ex: Fiat Strada 2022"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>

              {/* Cliente */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Cliente</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo</label>
                <input value={editForm.clienteNome}
                  onChange={e => setEditForm(p => ({...p, clienteNome: e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp</label>
                  <input value={editForm.clienteWhatsapp}
                    onChange={e => setEditForm(p => ({...p, clienteWhatsapp: e.target.value}))}
                    placeholder="(51) 99999-9999"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CPF</label>
                  <input value={editForm.clienteCpf}
                    onChange={e => setEditForm(p => ({...p, clienteCpf: e.target.value}))}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data de Nascimento</label>
                <input type="date" value={editForm.clienteNascimento}
                  onChange={e => setEditForm(p => ({...p, clienteNascimento: e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
              </div>

              {/* Endereço */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Endereço</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    CEP {editCepLoading && <span className="text-indigo-500">buscando...</span>}
                  </label>
                  <input value={editForm.clienteCep}
                    onChange={e => handleEditCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                  <input value={editForm.clienteNumero}
                    onChange={e => setEditForm(p => ({...p, clienteNumero: e.target.value}))}
                    placeholder="Ex: 123"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro</label>
                <input value={editForm.clienteEndereco}
                  onChange={e => setEditForm(p => ({...p, clienteEndereco: e.target.value}))}
                  placeholder="Rua, Av..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                  <input value={editForm.clienteBairro}
                    onChange={e => setEditForm(p => ({...p, clienteBairro: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                  <input value={editForm.clienteCidade}
                    onChange={e => setEditForm(p => ({...p, clienteCidade: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
                <input value={editForm.clienteUf}
                  onChange={e => setEditForm(p => ({...p, clienteUf: e.target.value.toUpperCase().slice(0,2)}))}
                  placeholder="RS"
                  maxLength={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowEditData(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900">Excluir OS?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">Esta ação é <strong>irreversível</strong>. A OS e todos os seus itens serão removidos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteOS}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

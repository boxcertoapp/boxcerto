import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, Clock, ChevronRight, X, FileText, Users, Phone, MapPin, Calendar, Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  vehicleStorage, clientStorage, osStorage,
  formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS
} from '../../lib/storage'

function PlateTag({ placa }) {
  return (
    <div className="bg-slate-800 px-2 py-1 rounded-lg shrink-0">
      <span className="text-white text-xs font-bold plate-mercosul tracking-widest">{placa}</span>
    </div>
  )
}

// ── ADD CLIENT MODAL ──────────────────────────────────────
function AddClientModal({ officeName, onClose, onSaved }) {
  const [form, setForm] = useState({ nome: '', whatsapp: '', cpf: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSave = async () => {
    if (!form.nome.trim()) return setError('Nome é obrigatório.')
    if (!form.whatsapp.trim()) return setError('WhatsApp é obrigatório.')
    setLoading(true)
    try {
      await clientStorage.create({ officeName, nome: form.nome.trim(), whatsapp: form.whatsapp, cpf: form.cpf })
      onSaved()
      onClose()
    } catch (e) {
      setError('Erro ao salvar cliente.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Novo Cliente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
            <input autoFocus value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} placeholder="João da Silva" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp *</label>
            <input value={form.whatsapp} onChange={e => setForm(p => ({...p, whatsapp: formatWpp(e.target.value)}))} placeholder="(51) 99999-9999" maxLength={15} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">CPF (opcional)</label>
            <input value={form.cpf} onChange={e => setForm(p => ({...p, cpf: formatCPF(e.target.value)}))} placeholder="000.000.000-00" className={inp} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TIMELINE DE OS DE UM VEÍCULO ─────────────────────────
function VehicleTimeline({ vehicle, client, officeName, onBack }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    osStorage.getByVehicle(vehicle.id).then(setOrders)
  }, [vehicle.id])

  const handleNovaOS = () => {
    sessionStorage.setItem('boxcerto_prefill_plate', vehicle.placa)
    navigate('/app/oficina')
  }

  return (
    <div className="p-4 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <PlateTag placa={vehicle.placa} />
            <p className="font-bold text-slate-900">{vehicle.modelo}</p>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{client?.nome} · {client?.whatsapp}</p>
          {client?.cpf && <p className="text-xs text-slate-400">CPF: {client.cpf}</p>}
        </div>
        <button
          onClick={handleNovaOS}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nova OS
        </button>
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {orders.length} {orders.length === 1 ? 'Ordem de Serviço' : 'Ordens de Serviço'}
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma OS encontrada</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-200" />
          <div className="space-y-4">
            {orders.map((os) => (
              <div key={os.id} className="flex gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 mt-1 ${
                  os.status === 'entregue' ? 'bg-gray-100' : os.status === 'pronto' ? 'bg-green-100' :
                  os.status === 'manutencao' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  <Clock className={`w-3.5 h-3.5 ${os.status === 'entregue' ? 'text-gray-500' :
                    os.status === 'pronto' ? 'text-green-600' : os.status === 'manutencao' ? 'text-blue-600' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{formatDate(os.createdAt)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[os.status]}`}>
                      {STATUS_LABELS[os.status]}
                    </span>
                  </div>
                  {(!os.items || os.items.length === 0) ? (
                    <p className="text-sm text-slate-400 italic">OS sem itens</p>
                  ) : (
                    <div className="space-y-1">
                      {os.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-700 truncate pr-2">{item.descricao}</span>
                          <span className="text-slate-500 shrink-0">{formatCurrency(item.venda)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {os.totals && os.totals.venda > 0 && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-slate-400">Total</span>
                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(os.totals.venda)}</span>
                    </div>
                  )}
                  {os.observacoes && <p className="text-xs text-slate-400 mt-2 italic">"{os.observacoes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LIMIT = 10

// ── MAIN ─────────────────────────────────────────────────
export default function Historico() {
  const { user } = useAuth()
  const [tab, setTab] = useState('busca')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState(null)
  const [allClients, setAllClients] = useState([])
  const [allVehicles, setAllVehicles] = useState([])
  const [clientVehicles, setClientVehicles] = useState([])
  const [osCountMap, setOsCountMap] = useState({})
  const [lastOsDateMap, setLastOsDateMap] = useState({})
  const [showMoreClients, setShowMoreClients] = useState(false)
  const [showMoreVehicles, setShowMoreVehicles] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  const loadData = async () => {
    setShowMoreClients(false)
    setShowMoreVehicles(false)

    if (tab === 'clientes') {
      const [clients, vehicles] = await Promise.all([
        clientStorage.getAll(user.oficina),
        vehicleStorage.getAll(user.oficina),
      ])
      setAllClients(clients.sort((a, b) => a.nome.localeCompare(b.nome)))
      setClientVehicles(vehicles)
    }
    if (tab === 'veiculos') {
      const [vehicles, clients, allOS] = await Promise.all([
        vehicleStorage.getAll(user.oficina),
        clientStorage.getAll(user.oficina),
        osStorage.getAll(user.oficina),
      ])
      // Build counts and last OS date per vehicle
      const counts = {}
      const lastDate = {}
      allOS.forEach(os => {
        counts[os.vehicleId] = (counts[os.vehicleId] || 0) + 1
        if (!lastDate[os.vehicleId] || os.createdAt > lastDate[os.vehicleId]) {
          lastDate[os.vehicleId] = os.createdAt
        }
      })
      setOsCountMap(counts)
      setLastOsDateMap(lastDate)

      const enriched = vehicles
        .map(v => ({ ...v, client: clients.find(c => c.id === v.clientId) }))
        // Sort by most recent OS date, then by vehicle creation date
        .sort((a, b) => {
          const aDate = lastDate[a.id] || a.createdAt || ''
          const bDate = lastDate[b.id] || b.createdAt || ''
          return bDate.localeCompare(aDate)
        })
      setAllVehicles(enriched)
    }
  }

  useEffect(() => { loadData() }, [tab])

  const doSearch = async (q) => {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    const vehicles = await vehicleStorage.search(user.oficina, q.trim())
    setResults(vehicles)
    setSearched(true)
  }

  const openVehicle = (vehicle) => {
    const client = vehicle.client || allClients.find(c => c.id === vehicle.clientId) || null
    setSelected({ vehicle, client })
  }

  if (selected) {
    return <VehicleTimeline
      vehicle={selected.vehicle}
      client={selected.client}
      officeName={user.oficina}
      onBack={() => setSelected(null)}
    />
  }

  return (
    <div className="pb-36">
      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-4">
          {[{ key:'busca', label:'Busca' }, { key:'clientes', label:'Clientes' }, { key:'veiculos', label:'Veículos' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BUSCA ── */}
      {tab === 'busca' && (
        <div className="px-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" value={query} onChange={e => doSearch(e.target.value)}
              placeholder="Buscar por placa, nome, CPF..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm" />
            {query && <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
          </div>
          {!searched ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Busque por placa, nome ou CPF</p>
              <p className="text-sm mt-1">Digite ao menos 2 caracteres</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum resultado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(v => (
                <button key={v.id} onClick={() => openVehicle(v)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left hover:border-indigo-100 transition-all">
                  <PlateTag placa={v.placa} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{v.modelo}</p>
                    <p className="text-slate-400 text-xs">{v.client?.nome}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CLIENTES ── */}
      {tab === 'clientes' && (
        <div className="px-4">
          {allClients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum cliente cadastrado</p>
              <p className="text-sm mt-1">Abra uma OS ou use o + para cadastrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">{allClients.length} clientes</p>
              {(showMoreClients ? allClients : allClients.slice(0, LIMIT)).map(c => {
                const veiculos = clientVehicles.filter(v => v.clientId === c.id)
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.nome}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {c.whatsapp && <span className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.whatsapp}</span>}
                          {c.cpf && <span className="text-xs text-slate-400">CPF: {c.cpf}</span>}
                          {c.dataNascimento && <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(c.dataNascimento)}</span>}
                        </div>
                        {(c.cidade || c.endereco) && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {[c.endereco, c.numero, c.bairro, c.cidade, c.uf].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    {veiculos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                        {veiculos.map(v => (
                          <button key={v.id} onClick={() => openVehicle({ ...v, client: c })}
                            className="flex items-center gap-1.5 bg-gray-50 hover:bg-indigo-50 rounded-lg px-2 py-1 transition-colors">
                            <PlateTag placa={v.placa} />
                            <span className="text-xs text-slate-600">{v.modelo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {allClients.length > LIMIT && (
                <button onClick={() => setShowMoreClients(p => !p)}
                  className="w-full py-3 rounded-2xl border border-gray-200 text-sm text-slate-500 font-medium hover:bg-gray-50 transition-colors">
                  {showMoreClients ? 'Ver menos' : `Ver mais ${allClients.length - LIMIT} clientes`}
                </button>
              )}
            </div>
          )}

          {/* FAB add client */}
          <button
            onClick={() => setShowAddClient(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 z-40"
          >
            <Plus className="w-7 h-7 text-white" />
          </button>
        </div>
      )}

      {/* ── VEÍCULOS ── */}
      {tab === 'veiculos' && (
        <div className="px-4">
          {allVehicles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum veículo cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">{allVehicles.length} veículos · ordem: mais recente</p>
              {(showMoreVehicles ? allVehicles : allVehicles.slice(0, LIMIT)).map(v => {
                const osCount = osCountMap[v.id] || 0
                const lastDate = lastOsDateMap[v.id]
                return (
                  <button key={v.id} onClick={() => openVehicle(v)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left hover:border-indigo-100 transition-all">
                    <PlateTag placa={v.placa} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{v.modelo}</p>
                      <p className="text-slate-400 text-xs">{v.client?.nome}</p>
                      {lastDate && <p className="text-slate-300 text-[10px]">Última OS: {formatDate(lastDate)}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">{osCount} OS</p>
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-1 ml-auto" />
                    </div>
                  </button>
                )
              })}
              {allVehicles.length > LIMIT && (
                <button onClick={() => setShowMoreVehicles(p => !p)}
                  className="w-full py-3 rounded-2xl border border-gray-200 text-sm text-slate-500 font-medium hover:bg-gray-50 transition-colors">
                  {showMoreVehicles ? 'Ver menos' : `Ver mais ${allVehicles.length - LIMIT} veículos`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add client modal */}
      {showAddClient && (
        <AddClientModal
          officeName={user.oficina}
          onClose={() => setShowAddClient(false)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}

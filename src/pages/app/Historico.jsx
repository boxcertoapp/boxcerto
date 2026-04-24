import { useState, useEffect } from 'react'
import { Search, Car, Clock, ChevronRight, X, FileText, Users, Phone, MapPin, Calendar } from 'lucide-react'
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

// ── TIMELINE DE OS DE UM VEÍCULO ─────────────────────────
function VehicleTimeline({ vehicle, client, onBack }) {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    osStorage.getByVehicle(vehicle.id).then(setOrders)
  }, [vehicle.id])

  return (
    <div className="p-4 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <PlateTag placa={vehicle.placa} />
            <p className="font-bold text-slate-900">{vehicle.modelo}</p>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{client?.nome} · {client?.whatsapp}</p>
          {client?.cpf && <p className="text-xs text-slate-400">CPF: {client.cpf}</p>}
        </div>
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
  const [clientVehicles, setClientVehicles] = useState([]) // vehicles for clients tab
  const [osCountMap, setOsCountMap] = useState({}) // vehicleId → os count
  const [showMoreClients, setShowMoreClients] = useState(false)
  const [showMoreVehicles, setShowMoreVehicles] = useState(false)

  useEffect(() => {
    setShowMoreClients(false)
    setShowMoreVehicles(false)

    const load = async () => {
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
        const enriched = vehicles
          .map(v => ({ ...v, client: clients.find(c => c.id === v.clientId) }))
          .sort((a, b) => a.placa.localeCompare(b.placa))
        setAllVehicles(enriched)
        // build count map
        const counts = {}
        allOS.forEach(os => {
          counts[os.vehicleId] = (counts[os.vehicleId] || 0) + 1
        })
        setOsCountMap(counts)
      }
    }
    load()
  }, [tab])

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
    return <VehicleTimeline vehicle={selected.vehicle} client={selected.client} onBack={() => setSelected(null)} />
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
              <p className="text-sm mt-1">Abra uma OS para cadastrar clientes</p>
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
              <p className="text-xs text-slate-400 font-medium">{allVehicles.length} veículos</p>
              {(showMoreVehicles ? allVehicles : allVehicles.slice(0, LIMIT)).map(v => {
                const osCount = osCountMap[v.id] || 0
                return (
                  <button key={v.id} onClick={() => openVehicle(v)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left hover:border-indigo-100 transition-all">
                    <PlateTag placa={v.placa} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{v.modelo}</p>
                      <p className="text-slate-400 text-xs">{v.client?.nome}</p>
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
    </div>
  )
}

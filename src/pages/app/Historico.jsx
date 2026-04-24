import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Car, Clock, ChevronRight, X, FileText, Users, Phone, MapPin,
  Calendar, Plus, AlertCircle, Edit2, Check, ArrowUpDown
} from 'lucide-react'
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

// ── SHARED FORM HELPERS ───────────────────────────────────
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

// ── CLIENT FORM (create or edit) ──────────────────────────
function ClientForm({ initial, onSave, onCancel, saveLabel = 'Salvar' }) {
  const [form, setForm] = useState(initial || {
    nome: '', whatsapp: '', cpf: '', dataNascimento: '',
    cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '',
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'

  const handleCEP = async (val) => {
    const cep = val.replace(/\D/g, '')
    const fmt = cep.length > 5 ? `${cep.slice(0,5)}-${cep.slice(5,8)}` : cep
    f('cep', fmt)
    if (cep.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(p => ({ ...p, cep: fmt, endereco: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' }))
        }
      } catch {}
      setCepLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.nome.trim()) return setError('Nome é obrigatório.')
    if (!form.whatsapp.trim()) return setError('WhatsApp é obrigatório.')
    setError('')
    setLoading(true)
    try {
      await onSave(form)
    } catch (e) {
      setError('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
        <input autoFocus value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="João da Silva" className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp *</label>
          <input value={form.whatsapp} onChange={e => f('whatsapp', formatWpp(e.target.value))} placeholder="(51) 99999-9999" maxLength={15} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">CPF</label>
          <input value={form.cpf} onChange={e => f('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Data de Nascimento</label>
        <input type="date" value={form.dataNascimento} onChange={e => f('dataNascimento', e.target.value)} className={inp} />
      </div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Endereço</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">CEP {cepLoading && <span className="text-indigo-500">buscando...</span>}</label>
          <input type="text" placeholder="00000-000" value={form.cep} onChange={e => handleCEP(e.target.value)} maxLength={9} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
          <input type="text" placeholder="123" value={form.numero} onChange={e => f('numero', e.target.value)} className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Rua / Logradouro</label>
        <input type="text" value={form.endereco} onChange={e => f('endereco', e.target.value)} className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
          <input type="text" value={form.bairro} onChange={e => f('bairro', e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cidade / UF</label>
          <div className="flex gap-1">
            <input type="text" value={form.cidade} onChange={e => f('cidade', e.target.value)} className={inp} />
            <input type="text" value={form.uf} maxLength={2} onChange={e => f('uf', e.target.value.toUpperCase())} className={`${inp} w-12 text-center px-1`} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
          {loading ? 'Salvando...' : saveLabel}
        </button>
      </div>
    </div>
  )
}

// ── CLIENT MODAL (create or edit) ─────────────────────────
function ClientModal({ mode, client, officeName, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const title = isEdit ? 'Editar Cliente' : 'Novo Cliente'

  const initial = isEdit && client ? {
    nome: client.nome || '',
    whatsapp: client.whatsapp || '',
    cpf: client.cpf || '',
    dataNascimento: client.dataNascimento || '',
    cep: client.cep || '',
    endereco: client.endereco || '',
    numero: client.numero || '',
    bairro: client.bairro || '',
    cidade: client.cidade || '',
    uf: client.uf || '',
  } : undefined

  const handleSave = async (form) => {
    if (isEdit) {
      await clientStorage.update(client.id, {
        nome: form.nome.trim(),
        whatsapp: form.whatsapp,
        cpf: form.cpf,
        dataNascimento: form.dataNascimento,
        cep: form.cep,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
      })
    } else {
      await clientStorage.create({ officeName, ...form, nome: form.nome.trim() })
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          <ClientForm initial={initial} onSave={handleSave} onCancel={onClose} saveLabel={isEdit ? 'Atualizar' : 'Cadastrar'} />
        </div>
      </div>
    </div>
  )
}

// ── TIMELINE DE OS DE UM VEÍCULO ─────────────────────────
function VehicleTimeline({ vehicle, client, officeName, onBack, onVehicleUpdated }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [editModelo, setEditModelo] = useState(false)
  const [modelo, setModelo] = useState(vehicle.modelo)
  const [savingModelo, setSavingModelo] = useState(false)
  const [editClient, setEditClient] = useState(false)

  useEffect(() => {
    osStorage.getByVehicle(vehicle.id).then(setOrders)
  }, [vehicle.id])

  const handleNovaOS = () => {
    sessionStorage.setItem('boxcerto_prefill_plate', vehicle.placa)
    navigate('/app/oficina')
  }

  const handleSaveModelo = async () => {
    if (!modelo.trim()) return
    setSavingModelo(true)
    await vehicleStorage.update(vehicle.id, { modelo: modelo.trim() })
    setSavingModelo(false)
    setEditModelo(false)
    onVehicleUpdated?.()
  }

  return (
    <div className="p-4 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PlateTag placa={vehicle.placa} />
            {editModelo ? (
              <div className="flex items-center gap-1 flex-1">
                <input autoFocus value={modelo} onChange={e => setModelo(e.target.value)}
                  className="flex-1 text-sm font-bold text-slate-900 border-b-2 border-indigo-400 focus:outline-none bg-transparent py-0.5" />
                <button onClick={handleSaveModelo} disabled={savingModelo}
                  className="p-1 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                </button>
                <button onClick={() => { setModelo(vehicle.modelo); setEditModelo(false) }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <p className="font-bold text-slate-900">{modelo}</p>
                <button onClick={() => setEditModelo(true)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
          </div>
          {client && (
            <button onClick={() => setEditClient(true)} className="flex items-center gap-1 mt-0.5 group text-left">
              <p className="text-sm text-slate-400 group-hover:text-indigo-600 transition-colors">{client.nome} · {client.whatsapp}</p>
              <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </button>
          )}
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

      {/* Edit client modal */}
      {editClient && client && (
        <ClientModal
          mode="edit"
          client={client}
          officeName={officeName}
          onClose={() => setEditClient(false)}
          onSaved={() => { setEditClient(false); onVehicleUpdated?.() }}
        />
      )}
    </div>
  )
}

// ── SORT CHIPS ─────────────────────────────────────────────
function SortChips({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-3">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
            value === opt.key
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-gray-200 hover:border-indigo-300'
          }`}>
          {opt.label}
        </button>
      ))}
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
  const [clientModal, setClientModal] = useState(null) // null | { mode, client? }
  const [sortClientes, setSortClientes] = useState('az')
  const [sortVeiculos, setSortVeiculos] = useState('recent')

  const loadData = async () => {
    setShowMoreClients(false)
    setShowMoreVehicles(false)

    if (tab === 'clientes') {
      const [clients, vehicles] = await Promise.all([
        clientStorage.getAll(user.oficina),
        vehicleStorage.getAll(user.oficina),
      ])
      setAllClients(clients)
      setClientVehicles(vehicles)
    }
    if (tab === 'veiculos') {
      const [vehicles, clients, allOS] = await Promise.all([
        vehicleStorage.getAll(user.oficina),
        clientStorage.getAll(user.oficina),
        osStorage.getAll(user.oficina),
      ])
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
      setAllVehicles(vehicles.map(v => ({ ...v, client: clients.find(c => c.id === v.clientId) })))
    }
  }

  useEffect(() => { loadData() }, [tab])

  // Sorted clients
  const sortedClients = [...allClients].sort((a, b) => {
    if (sortClientes === 'az') return a.nome.localeCompare(b.nome)
    if (sortClientes === 'za') return b.nome.localeCompare(a.nome)
    return 0
  })

  // Sorted vehicles
  const sortedVehicles = [...allVehicles].sort((a, b) => {
    if (sortVeiculos === 'recent') {
      const aDate = lastOsDateMap[a.id] || a.createdAt || ''
      const bDate = lastOsDateMap[b.id] || b.createdAt || ''
      return bDate.localeCompare(aDate)
    }
    if (sortVeiculos === 'az') return a.placa.localeCompare(b.placa)
    if (sortVeiculos === 'za') return b.placa.localeCompare(a.placa)
    return 0
  })

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
      onVehicleUpdated={() => { loadData(); setSelected(null) }}
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
              <p className="text-sm mt-1">Use o + para cadastrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">{allClients.length} clientes</p>
              </div>
              <SortChips
                options={[{ key: 'az', label: 'A → Z' }, { key: 'za', label: 'Z → A' }]}
                value={sortClientes}
                onChange={setSortClientes}
              />
              {(showMoreClients ? sortedClients : sortedClients.slice(0, LIMIT)).map(c => {
                const veiculos = clientVehicles.filter(v => v.clientId === c.id)
                return (
                  <div key={c.id}
                    onClick={() => setClientModal({ mode: 'edit', client: c })}
                    className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-indigo-100 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 truncate">{c.nome}</p>
                          <Edit2 className="w-3 h-3 text-slate-300 shrink-0" />
                        </div>
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
                          <button key={v.id}
                            onClick={e => { e.stopPropagation(); openVehicle({ ...v, client: c }) }}
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
              {sortedClients.length > LIMIT && (
                <button onClick={() => setShowMoreClients(p => !p)}
                  className="w-full py-3 rounded-2xl border border-gray-200 text-sm text-slate-500 font-medium hover:bg-gray-50 transition-colors">
                  {showMoreClients ? 'Ver menos' : `Ver mais ${sortedClients.length - LIMIT} clientes`}
                </button>
              )}
            </div>
          )}

          {/* FAB add client */}
          <button
            onClick={() => setClientModal({ mode: 'create' })}
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
              <p className="text-xs text-slate-400 font-medium">{allVehicles.length} veículos</p>
              <SortChips
                options={[
                  { key: 'recent', label: 'Mais recente' },
                  { key: 'az', label: 'Placa A→Z' },
                  { key: 'za', label: 'Placa Z→A' },
                ]}
                value={sortVeiculos}
                onChange={setSortVeiculos}
              />
              {(showMoreVehicles ? sortedVehicles : sortedVehicles.slice(0, LIMIT)).map(v => {
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
              {sortedVehicles.length > LIMIT && (
                <button onClick={() => setShowMoreVehicles(p => !p)}
                  className="w-full py-3 rounded-2xl border border-gray-200 text-sm text-slate-500 font-medium hover:bg-gray-50 transition-colors">
                  {showMoreVehicles ? 'Ver menos' : `Ver mais ${sortedVehicles.length - LIMIT} veículos`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Client Modal (create or edit) */}
      {clientModal && (
        <ClientModal
          mode={clientModal.mode}
          client={clientModal.client}
          officeName={user.oficina}
          onClose={() => setClientModal(null)}
          onSaved={() => { setClientModal(null); loadData() }}
        />
      )}
    </div>
  )
}

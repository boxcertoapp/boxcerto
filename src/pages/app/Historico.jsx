import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Car, Clock, ChevronRight, ChevronDown, X, FileText, Users, Phone, MapPin,
  Calendar, Plus, AlertCircle, Edit2, Check, ArrowUpDown, Gauge, Mail,
  MessageCircle, Cake, TrendingUp, List, LayoutGrid
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { showSaveCheck } from '../../components/SaveCheck'
import SkeletonList from '../../components/Skeleton'
import PlateTag from '../../components/PlateTag'
import EmptyState from '../../components/EmptyState'
import {
  vehicleStorage, clientStorage, osStorage, vendaStorage,
  formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, norm
} from '../../lib/storage'


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
    nome: '', whatsapp: '', cpf: '', email: '', dataNascimento: '',
    cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '',
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [triedSave, setTriedSave] = useState(false)

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
  const inpReqBase = 'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors'
  const reqInp = (val) => `${inpReqBase} ${triedSave && !String(val || '').trim() ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-50'}`

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
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      setTriedSave(true)
      if (!form.nome.trim()) return setError('Nome é obrigatório.')
      return setError('WhatsApp é obrigatório.')
    }
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
        <input autoFocus value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="João da Silva" className={reqInp(form.nome)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp *</label>
          <input value={form.whatsapp} onChange={e => f('whatsapp', formatWpp(e.target.value))} placeholder="(51) 99999-9999" maxLength={15} className={reqInp(form.whatsapp)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">CPF</label>
          <input value={form.cpf} onChange={e => f('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" />E-mail</label>
        <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="cliente@email.com" className={inp} />
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
    email: client.email || '',
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
        email: form.email,
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
    showSaveCheck(isEdit ? 'Cliente salvo!' : 'Cliente cadastrado!')
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{formatDate(os.createdAt)}</span>
                      {os.km && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Gauge className="w-3 h-3" />{Number(os.km).toLocaleString('pt-BR')} km
                        </span>
                      )}
                    </div>
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

// ── Helpers de cliente ─────────────────────────────────────
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
  return d.getUTCMonth()
}

// ── Card de cliente (cards / lista) ─────────────────────────
function ClienteCard({ c, expanded, onToggle, compact = false, onOpenVehicle, onEditClient }) {
  const wppLink = c.whatsapp ? `https://wa.me/55${c.whatsapp.replace(/\D/g, '')}` : null
  const inicial = (c.nome?.[0] || '?').toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all">
      {compact ? (
        <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${c.inativo ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{inicial}</div>
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
        <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${c.inativo ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{inicial}</div>
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
            {c.totalGasto > 0 && <span className="text-sm font-bold text-slate-900">{formatCurrency(c.totalGasto)}</span>}
            {c.inativo
              ? <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">sumido</span>
              : <span className="w-2 h-2 rounded-full bg-green-400" title="ativo" />}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-3">
          {c.whatsapp && (
            <p className="text-xs text-slate-500 flex items-center gap-1 pt-2"><Phone className="w-3 h-3" />{c.whatsapp}</p>
          )}
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEditClient?.(c) }}
              className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Editar cliente
            </button>
            {wppLink && (
              <a href={wppLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="ml-auto inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
          </div>
          {c.veiculos.length > 0 ? (
            <div className="space-y-1.5">
              {c.veiculos.map(v => (
                <button key={v.id} onClick={(e) => { e.stopPropagation(); onOpenVehicle?.(v, c) }}
                  className="w-full flex items-center gap-2.5 bg-gray-50 rounded-xl px-2.5 py-2 text-left hover:bg-indigo-50 transition-colors">
                  <PlateTag placa={v.placa} sm />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{v.modelo}</p>
                    <p className="text-[11px] text-slate-400">{v.osCount} OS · {tempoRelativo(v.lastOs)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
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

// ── Card de veículo ─────────────────────────────────────────
function VeiculoCard({ v, compact = false, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full bg-white rounded-2xl border border-gray-100 flex items-center gap-3 text-left hover:border-indigo-100 transition-colors ${compact ? 'px-3 py-2' : 'p-3'}`}>
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
    </button>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function Historico() {
  const { user } = useAuth()
  const [loading, setLoading]   = useState(true)
  const [clients, setClients]   = useState([])   // enriquecidos
  const [vehicles, setVehicles] = useState([])   // enriquecidos
  const [view, setView]         = useState('clientes') // clientes | veiculos
  const [display, setDisplay]   = useState('cards')     // cards | list
  const [query, setQuery]       = useState('')
  const [filtro, setFiltro]     = useState('todos')     // todos | sumidos | aniversario | top
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState(null)        // { vehicle, client } → VehicleTimeline
  const [clientModal, setClientModal] = useState(null)  // null | { mode, client? }

  const loadData = async () => {
    const [cls, vhs, vendasStats, allOS] = await Promise.all([
      clientStorage.getAll(user.oficina),
      vehicleStorage.getAll(user.oficina),
      vendaStorage.getClientStats().catch(() => ({})),
      osStorage.getAll(user.oficina),
    ])

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
    setVehicles(vehiclesEnriched.map(v => {
      const cli = cls.find(c => c.id === v.clientId) || null
      return { ...v, client: cli, clientNome: cli?.nome || '—' }
    }))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Contadores dos chips
  const counts = {
    todos:       clients.length,
    sumidos:     clients.filter(c => c.inativo).length,
    aniversario: clients.filter(c => c.aniversariante).length,
  }

  // Lista de clientes filtrada + busca
  const clientesFiltrados = (() => {
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
  })()

  // Lista de veículos filtrada + busca
  const veiculosFiltrados = (() => {
    let list = [...vehicles].sort((a, b) => (b.lastOs || '').localeCompare(a.lastOs || ''))
    const q = norm(query.trim())
    if (q.length >= 1) {
      list = list.filter(v => norm(v.placa).includes(q) || norm(v.modelo).includes(q) || norm(v.clientNome).includes(q))
    }
    return list
  })()

  const CHIPS = [
    { key: 'todos',       label: 'Todos',           count: counts.todos,       icon: null },
    { key: 'sumidos',     label: 'Sumidos',         count: counts.sumidos,     icon: Clock },
    { key: 'aniversario', label: 'Aniversariantes', count: counts.aniversario, icon: Cake },
    { key: 'top',         label: 'Maiores gastos',  count: null,               icon: TrendingUp },
  ]

  const openVehicle = (vehicle, client) => setSelected({ vehicle, client: client || null })

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
      {/* Header + busca + filtros fixos */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center mb-3">
          {/* Seletor deslizante Clientes/Veículos — mostra os dois, desliza pro selecionado */}
          <div className="relative grid grid-cols-2 flex-1 sm:flex-none sm:w-full sm:max-w-xs bg-gray-100 rounded-xl p-1">
            {/* pilha branca que desliza */}
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-200 ease-out ${
                view === 'veiculos' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            {[['clientes', 'Clientes', Users], ['veiculos', 'Veículos', Car]].map(([k, lbl, Icon]) => (
              <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
                className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  view === k ? 'text-indigo-700' : 'text-slate-500'
                }`}>
                <Icon className={`w-4 h-4 ${view === k ? 'text-indigo-600' : 'text-slate-400'}`} />
                {lbl}
              </button>
            ))}
          </div>
          <span className="ml-3 text-sm text-slate-400 font-medium whitespace-nowrap">
            {view === 'veiculos'
              ? `${vehicles.length} ${vehicles.length === 1 ? 'veículo' : 'veículos'}`
              : `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}`}
          </span>
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
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1 -mx-4 px-4">
            {CHIPS.map(chip => {
              const active = filtro === chip.key
              const Icon = chip.icon
              return (
                <button key={chip.key} onClick={() => setFiltro(chip.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {chip.label}
                  {chip.count != null && chip.count > 0 && (
                    <span className={`text-[10px] font-bold ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{chip.count}</span>
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
          <SkeletonList count={6} className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5 lg:space-y-0" />
        ) : view === 'clientes' ? (
          clientesFiltrados.length === 0 ? (
            (!query && filtro === 'todos') ? (
              <EmptyState
                icon={Users}
                tone="indigo"
                title="Sua carteira de clientes começa aqui"
                subtitle="Cadastre seus clientes para acompanhar histórico, total gasto e quem anda sumido — e trazê-los de volta."
                action={{ label: 'Cadastrar cliente', icon: Plus, onClick: () => setClientModal({ mode: 'create' }) }}
              />
            ) : (
              <EmptyState
                icon={filtro === 'aniversario' ? Cake : filtro === 'sumidos' ? Clock : Users}
                tone={filtro === 'aniversario' ? 'pink' : 'slate'}
                title={filtro === 'sumidos' ? 'Nenhum cliente sumido 🎉'
                  : filtro === 'aniversario' ? 'Nenhum aniversariante este mês'
                  : 'Nenhum cliente encontrado'}
                subtitle={filtro === 'sumidos' ? 'Todos os seus clientes voltaram nos últimos meses.' : undefined}
              />
            )
          ) : (
            <div className={display === 'list'
              ? 'space-y-1.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2 lg:items-start'
              : 'space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5 lg:items-start'}>
              {clientesFiltrados.map(c => (
                <ClienteCard key={c.id} c={c}
                  compact={display === 'list'}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId(id => id === c.id ? null : c.id)}
                  onOpenVehicle={(v, cli) => openVehicle(v, cli)}
                  onEditClient={(cli) => setClientModal({ mode: 'edit', client: cli })} />
              ))}
            </div>
          )
        ) : (
          veiculosFiltrados.length === 0 ? (
            <EmptyState
              icon={Car}
              tone={query ? 'slate' : 'indigo'}
              title={query ? 'Nenhum veículo encontrado' : 'Nenhum veículo ainda'}
              subtitle={query ? 'Tente outra busca.' : 'Os veículos aparecem aqui quando você cria a primeira OS na aba Oficina.'}
            />
          ) : (
            <div className={display === 'list'
              ? 'space-y-1.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2'
              : 'space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5'}>
              {veiculosFiltrados.map(v => (
                <VeiculoCard key={v.id} v={v} compact={display === 'list'}
                  onClick={() => openVehicle(v, v.client)} />
              ))}
            </div>
          )
        )}
      </div>

      {/* FAB novo cliente — só na visão Clientes (veículos entram pela Nova OS) */}
      {view === 'clientes' && (
        <button
          onClick={() => setClientModal({ mode: 'create' })}
          title="Novo cliente" aria-label="Novo cliente"
          className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 z-40"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
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

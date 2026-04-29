/**
 * TecnicoOficina — Área de trabalho do técnico
 *
 * Permissões do técnico:
 *  ✅ Ver todas as OS da oficina
 *  ✅ Mudar status (orcamento → manutencao → pronto)
 *  ✅ Adicionar / editar / remover itens
 *  ✅ Editar observações e KM
 *  ✅ Assumir OS (se oficina permitir)
 *  ✅ Gerar PDF de orçamento
 *  ❌ Ver WhatsApp / contato do cliente
 *  ❌ Acessar financeiro / estoque / histórico
 *  ❌ Excluir OS ou entregar ao cliente
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Wrench, Plus, X, ChevronDown, ChevronUp, Save, Loader2,
  FileText, UserCheck, CheckCircle2, Clock, Settings2,
  AlertCircle, Trash2, Car, User, ClipboardList,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const iniciais = (nome = '') => nome.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'

const STATUS_LABEL = {
  orcamento:  { label: 'Orçamento',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  manutencao: { label: 'Em Serviço',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pronto:     { label: 'Pronto',      color: 'bg-green-50 text-green-700 border-green-200' },
  entregue:   { label: 'Entregue',    color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

// Statuses que o técnico pode mover (não pode entregar)
const STATUS_OPTIONS = [
  { value: 'orcamento',  label: 'Orçamento' },
  { value: 'manutencao', label: 'Em Serviço' },
  { value: 'pronto',     label: 'Pronto' },
]

// ── Fetch OS com joins ─────────────────────────────────────────
async function fetchOS() {
  const [osRes, vehiclesRes, clientsRes, itemsRes] = await Promise.all([
    supabase.from('service_orders').select('*').neq('status', 'entregue').order('updated_at', { ascending: false }),
    supabase.from('vehicles').select('*'),
    supabase.from('clients').select('id, nome'),
    supabase.from('service_items').select('*'),
  ])

  const vehicles = vehiclesRes.data || []
  const clients  = clientsRes.data || []
  const items    = itemsRes.data || []

  return (osRes.data || []).map(os => {
    const vehicle = vehicles.find(v => v.id === os.vehicle_id) || {}
    const client  = clients.find(c => c.id === vehicle.client_id) || {}
    const osItems = items.filter(i => i.os_id === os.id)
    const total   = osItems.reduce((s, i) => s + Number(i.venda || 0), 0)
    return {
      id:          os.id,
      status:      os.status,
      km:          os.km || '',
      observacoes: os.observacoes || '',
      tecnico:     os.tecnico || '',
      payments:    os.payments || [],
      desconto:    os.desconto || { tipo: 'valor', valor: 0 },
      userId:      os.user_id,
      createdAt:   os.created_at,
      updatedAt:   os.updated_at,
      placa:       vehicle.placa || '---',
      modelo:      vehicle.modelo || '',
      clienteNome: client.nome || '',
      items:       osItems.map(i => ({
        id:        i.id,
        descricao: i.descricao,
        custo:     Number(i.custo || 0),
        venda:     Number(i.venda || 0),
        garantia:  i.garantia || '',
      })),
      total,
    }
  })
}

// ── Componente principal ───────────────────────────────────────
export default function TecnicoOficina() {
  const { user } = useAuth()
  const [osList, setOsList]        = useState([])
  const [loading, setLoading]      = useState(true)
  const [filtroMinha, setFiltroMinha] = useState(false)
  const [selectedOS, setSelectedOS] = useState(null)
  const [officeSettings, setOfficeSettings] = useState({ podeAssumir: false, oficinaNome: '' })

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchOS()
      setOsList(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    // Carregar settings da oficina
    const loadSettings = async () => {
      const { data } = await supabase
        .from('office_data')
        .select('pode_assumir_os, nome_fantasia, razao_social')
        .eq('user_id', user.masterId)
        .maybeSingle()
      if (data) {
        setOfficeSettings({
          podeAssumir: data.pode_assumir_os || false,
          oficinaNome: data.nome_fantasia || data.razao_social || '',
        })
      }
    }
    loadSettings()
  }, [reload, user.masterId])

  // Filtra OS para exibição
  const minhasOS = filtroMinha
    ? osList.filter(os => os.tecnico?.toLowerCase() === user.nome?.toLowerCase())
    : osList

  // Agrupa por status
  const grupos = {
    manutencao: minhasOS.filter(os => os.status === 'manutencao'),
    orcamento:  minhasOS.filter(os => os.status === 'orcamento'),
    pronto:     minhasOS.filter(os => os.status === 'pronto'),
  }

  const openOS = (os) => {
    setSelectedOS({
      ...os,
      _editObservacoes: os.observacoes,
      _editKm: os.km,
      _editStatus: os.status,
      _saving: false,
      _dirty: false,
    })
  }

  const closeOS = () => setSelectedOS(null)

  const updateOS = async () => {
    if (!selectedOS) return
    setSelectedOS(p => ({ ...p, _saving: true }))
    await supabase.from('service_orders').update({
      status:      selectedOS._editStatus,
      observacoes: selectedOS._editObservacoes,
      km:          selectedOS._editKm,
      updated_at:  new Date().toISOString(),
    }).eq('id', selectedOS.id)
    await reload()
    setSelectedOS(null)
  }

  const assumirOS = async () => {
    if (!selectedOS) return
    await supabase.rpc('tecnico_assumir_os', {
      p_os_id: selectedOS.id,
      p_nome: user.nome || user.email,
    })
    await reload()
    setSelectedOS(null)
  }

  if (loading && osList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Ordens de Serviço</h1>
          <p className="text-xs text-slate-400">{officeSettings.oficinaNome || 'Área do técnico'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltroMinha(f => !f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filtroMinha
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {filtroMinha ? '✓ Minhas OS' : 'Minhas OS'}
          </button>
        </div>
      </div>

      {/* Grupos */}
      {(['manutencao', 'orcamento', 'pronto'] as const).map(status => {
        const grupo = grupos[status]
        if (grupo.length === 0) return null
        const info = STATUS_LABEL[status]
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.color}`}>
                {info.label}
              </span>
              <span className="text-xs text-slate-400">{grupo.length} OS</span>
            </div>
            <div className="space-y-2">
              {grupo.map(os => (
                <OSCard
                  key={os.id}
                  os={os}
                  meNome={user.nome}
                  onClick={() => openOS(os)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {osList.length === 0 && !loading && (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhuma OS em aberto</p>
        </div>
      )}

      {/* Modal */}
      {selectedOS && (
        <OSDetailModal
          os={selectedOS}
          meNome={user.nome}
          masterId={user.masterId}
          podeAssumir={officeSettings.podeAssumir}
          onClose={closeOS}
          onSave={updateOS}
          onAssumir={assumirOS}
          onChange={(field, value) =>
            setSelectedOS(p => ({ ...p, [field]: value, _dirty: true }))
          }
          onReload={async () => {
            const data = await fetchOS()
            setOsList(data)
            const updated = data.find(o => o.id === selectedOS.id)
            if (updated) setSelectedOS({
              ...updated,
              _editObservacoes: updated.observacoes,
              _editKm: updated.km,
              _editStatus: updated.status,
              _saving: false,
              _dirty: false,
            })
          }}
        />
      )}
    </div>
  )
}

// ── Card de OS ──────────────────────────────────────────────────
function OSCard({ os, meNome, onClick }) {
  const info = STATUS_LABEL[os.status] || STATUS_LABEL.orcamento
  const ehMinha = os.tecnico?.toLowerCase() === meNome?.toLowerCase()
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-indigo-100 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <Car className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">{os.placa}</p>
            <p className="text-xs text-slate-500 leading-tight">{os.modelo}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.color}`}>
            {info.label}
          </span>
          {os.total > 0 && (
            <span className="text-xs font-semibold text-slate-700">{fmt(os.total)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span>{os.clienteNome || 'Cliente'}</span>
        </div>
        {os.tecnico && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            ehMinha ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[8px]"
              style={{ background: ehMinha ? '#4f46e5' : '#94a3b8' }}>
              {iniciais(os.tecnico)}
            </span>
            {os.tecnico}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Modal de detalhe da OS ──────────────────────────────────────
function OSDetailModal({ os, meNome, masterId, podeAssumir, onClose, onSave, onAssumir, onChange, onReload }) {
  const [novoItem, setNovoItem]       = useState({ descricao: '', venda: '', custo: '' })
  const [addingItem, setAddingItem]   = useState(false)
  const [savingItem, setSavingItem]   = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [secItems, setSecItems]       = useState(false)
  const [secObs, setSecObs]           = useState(true)
  const [genPDF, setGenPDF]           = useState(false)

  const ehMinha = os.tecnico?.toLowerCase() === meNome?.toLowerCase()
  const naoTem  = !os.tecnico
  const podeAssumir2 = (naoTem || (podeAssumir && !ehMinha))

  const handleAddItem = async () => {
    if (!novoItem.descricao.trim()) return
    setSavingItem(true)
    const { error } = await supabase.from('service_items').insert({
      user_id:   masterId,
      os_id:     os.id,
      descricao: novoItem.descricao.trim(),
      custo:     Number(novoItem.custo) || 0,
      venda:     Number(novoItem.venda) || 0,
      garantia:  '',
    })
    if (!error) {
      setNovoItem({ descricao: '', venda: '', custo: '' })
      setAddingItem(false)
      await onReload()
    }
    setSavingItem(false)
  }

  const handleDeleteItem = async (itemId) => {
    setDeletingItem(itemId)
    await supabase.from('service_items').delete().eq('id', itemId)
    await onReload()
    setDeletingItem(null)
  }

  const handleGeneratePDF = async () => {
    setGenPDF(true)
    try {
      const { downloadOsPDF } = await import('../../lib/storage')
      // Adapta os para o formato esperado
      const osForPDF = {
        id: os.id,
        status: os.status,
        km: os.km,
        observacoes: os.observacoes,
        payments: os.payments,
        desconto: os.desconto,
        createdAt: os.createdAt,
        updatedAt: os.updatedAt,
        aprovacaoStatus: 'pendente',
        aprovadoEm: null,
        aprovacaoToken: null,
        tecnico: os.tecnico,
        deliveredAt: null,
        deliveryNotes: '',
        vehicleId: null,
      }
      const vehicleForPDF = { placa: os.placa, modelo: os.modelo }
      const clientForPDF  = { nome: os.clienteNome, whatsapp: '' }
      const itemsForPDF   = os.items
      await downloadOsPDF(osForPDF, vehicleForPDF, clientForPDF, itemsForPDF)
    } catch (err) {
      console.error('PDF error:', err)
    }
    setGenPDF(false)
  }

  const desconto = os.desconto || { tipo: 'valor', valor: 0 }
  const subtotal = os.items.reduce((s, i) => s + i.venda, 0)
  const totalDesconto = desconto.tipo === 'percentual'
    ? subtotal * (desconto.valor / 100)
    : Number(desconto.valor || 0)
  const totalFinal = Math.max(0, subtotal - totalDesconto)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{os.placa}</h2>
            <p className="text-xs text-slate-500">{os.modelo} · {os.clienteNome}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

          {/* Status */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange('_editStatus', opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    os._editStatus === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* KM */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">KM</span>
            <input
              type="number"
              value={os._editKm}
              onChange={e => onChange('_editKm', e.target.value)}
              placeholder="Quilometragem"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Técnico / Assumir */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {os.tecnico ? (
                  <span className="font-medium">{os.tecnico}</span>
                ) : (
                  <span className="text-slate-400 italic">Sem técnico</span>
                )}
              </span>
            </div>
            {podeAssumir2 && (
              <button
                onClick={onAssumir}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {naoTem ? 'Assumir' : 'Assumir de outro'}
              </button>
            )}
            {ehMinha && (
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sua OS
              </span>
            )}
          </div>

          {/* Observações */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2.5"
              onClick={() => setSecObs(s => !s)}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações</span>
              {secObs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {secObs && (
              <div className="px-3 pb-3">
                <textarea
                  value={os._editObservacoes}
                  onChange={e => onChange('_editObservacoes', e.target.value)}
                  rows={3}
                  placeholder="Anotações técnicas, observações..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2.5"
              onClick={() => setSecItems(s => !s)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Serviços / Peças
                </span>
                {os.items.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {os.items.length}
                  </span>
                )}
              </div>
              {secItems ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {secItems && (
              <div className="px-3 pb-3 space-y-2">
                {os.items.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.descricao}</p>
                      {item.garantia && (
                        <p className="text-[10px] text-slate-400">Garantia: {item.garantia}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{fmt(item.venda)}</p>
                        {item.custo > 0 && (
                          <p className="text-[10px] text-slate-400">Custo: {fmt(item.custo)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItem === item.id}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deletingItem === item.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                ))}

                {/* Adicionar item */}
                {addingItem ? (
                  <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={novoItem.descricao}
                      onChange={e => setNovoItem(p => ({ ...p, descricao: e.target.value }))}
                      placeholder="Descrição do serviço ou peça"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Valor venda</label>
                        <input
                          type="number"
                          value={novoItem.venda}
                          onChange={e => setNovoItem(p => ({ ...p, venda: e.target.value }))}
                          placeholder="0,00"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Custo (opcional)</label>
                        <input
                          type="number"
                          value={novoItem.custo}
                          onChange={e => setNovoItem(p => ({ ...p, custo: e.target.value }))}
                          placeholder="0,00"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAddingItem(false); setNovoItem({ descricao: '', venda: '', custo: '' }) }}
                        className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddItem}
                        disabled={savingItem || !novoItem.descricao.trim()}
                        className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {savingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingItem(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-indigo-600 border border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar serviço / peça
                  </button>
                )}

                {/* Total */}
                {os.items.length > 0 && (
                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total</span>
                    <span className="text-base font-bold text-slate-800">{fmt(totalFinal)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button
            onClick={handleGeneratePDF}
            disabled={genPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            {genPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            PDF
          </button>
          <button
            onClick={updateOS}
            disabled={os._saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {os._saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

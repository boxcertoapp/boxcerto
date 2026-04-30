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
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { osStorage, formatCurrency, formatDate } from '../../lib/storage'

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
  const assumir = async () => {
    setAssumindo(true)
    await supabase.rpc('tecnico_assumir_os', { p_os_id: os.id, p_nome: meNome })
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

  const ehMinha   = os.tecnico?.toLowerCase() === meNome?.toLowerCase()
  const semTecnico = !os.tecnico
  const totalFeitas = os.checklist.filter(t => t.feito).length

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col max-w-lg mx-auto">

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
          {!ehMinha && semTecnico && podeAssumir && (
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
  )
}

// ── Componente principal ───────────────────────────────────────
export default function TecnicoOficina() {
  const { user } = useAuth()
  const [osList, setOsList]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtroMinha, setFiltroMinha] = useState(false)
  const [selectedOS, setSelectedOS]   = useState(null)
  const [officeSettings, setOfficeSettings] = useState({ podeAssumir: false, oficinaNome: '' })

  const reload = useCallback(async () => {
    try {
      const data = await fetchOS()
      setOsList(data)
      // Atualiza OS selecionada se estiver aberta
      if (selectedOS) {
        const updated = data.find(o => o.id === selectedOS.id)
        if (updated) setSelectedOS(updated)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedOS?.id])

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

  // ── Filtro inteligente ──────────────────────────────────────
  // Exibe: minhas OS + sem técnico (OS de outro técnico ficam ocultas)
  const meNome = user.nome || user.email || ''
  const osVisiveis = osList.filter(os => {
    if (!os.tecnico) return true // sem técnico: sempre visível
    if (os.tecnico.toLowerCase() === meNome.toLowerCase()) return true // minha OS
    return officeSettings.podeAssumir // outro técnico: só se pode assumir
  })
  const osExibidas = filtroMinha
    ? osVisiveis.filter(os => os.tecnico?.toLowerCase() === meNome.toLowerCase())
    : osVisiveis

  // Estatísticas
  const minhasCount    = osVisiveis.filter(o => o.tecnico?.toLowerCase() === meNome.toLowerCase()).length
  const urgenteCount   = osVisiveis.filter(o => o.urgente).length
  const problemaCount  = osVisiveis.filter(o => o.problemaFlag).length

  const assumir = async (os) => {
    await supabase.rpc('tecnico_assumir_os', { p_os_id: os.id, p_nome: meNome })
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

  // ── Lista principal ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-black text-slate-600">{osVisiveis.length}</p>
            <p className="text-[10px] font-semibold text-slate-400">Visíveis</p>
          </div>
        </div>

        {/* Filtro */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFiltroMinha(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              !filtroMinha ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-500'
            }`}
          >
            Todas disponíveis
          </button>
          <button
            onClick={() => setFiltroMinha(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filtroMinha ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-500'
            }`}
          >
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
            <OSCard
              key={os.id}
              os={os}
              meNome={meNome}
              podeAssumir={officeSettings.podeAssumir}
              onOpen={setSelectedOS}
              onAssumir={assumir}
            />
          ))
        )}
      </div>
    </div>
  )
}

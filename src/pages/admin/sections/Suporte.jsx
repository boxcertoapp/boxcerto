import { useState, useEffect } from 'react'
import {
  Ticket, Loader2, ChevronDown, ChevronUp,
  CheckCircle, Clock, MessageSquare, RefreshCw,
  AlertCircle, HelpCircle, Lightbulb, CreditCard, LifeBuoy,
  Send, Filter
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const STATUS_CONFIG = {
  aberto:         { label: 'Aberto',          color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  em_atendimento: { label: 'Em atendimento',  color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  resolvido:      { label: 'Resolvido',        color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
}

const CAT_CONFIG = {
  duvida:     { label: 'Dúvida de uso',         icon: HelpCircle,  color: 'text-blue-600 bg-blue-50' },
  erro:       { label: 'Algo não funciona',      icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  financeiro: { label: 'Pagamento',              icon: CreditCard,  color: 'text-amber-600 bg-amber-50' },
  sugestao:   { label: 'Sugestão',               icon: Lightbulb,   color: 'text-emerald-600 bg-emerald-50' },
  outro:      { label: 'Outro',                  icon: LifeBuoy,    color: 'text-slate-600 bg-slate-50' },
}

function TicketCard({ ticket, onUpdate }) {
  const [expanded, setExpanded]   = useState(false)
  const [resposta, setResposta]   = useState(ticket.resposta || '')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const sc  = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aberto
  const cat = CAT_CONFIG[ticket.categoria]  || CAT_CONFIG.outro
  const CatIcon = cat.icon

  const salvarResposta = async (novoStatus) => {
    setSaving(true)
    const { error } = await supabase.rpc('admin_responder_ticket', {
      p_id:       ticket.id,
      p_resposta: resposta,
      p_status:   novoStatus || ticket.status,
    })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); onUpdate() }
  }

  const mudarStatus = async (status) => {
    await supabase.rpc('admin_mudar_status_ticket', {
      p_id:     ticket.id,
      p_status: status,
    })
    onUpdate()
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      ticket.status === 'aberto' ? 'border-amber-200' :
      ticket.status === 'resolvido' ? 'border-gray-100' : 'border-blue-200'
    }`}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
          <CatIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
            <span className="text-[10px] text-slate-400">{cat.label}</span>
          </div>
          <p className="text-sm font-bold text-slate-800 truncate">{ticket.titulo}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {ticket.oficina || 'Sem nome'} · {ticket.email} · {new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">

          {/* Mensagem do usuário */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Mensagem do cliente</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.mensagem}</p>
          </div>

          {/* Área de resposta */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Resposta</p>
            <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
              placeholder="Digite sua resposta aqui..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => salvarResposta('em_atendimento')} disabled={saving || !resposta.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {saved ? '✓ Salvo' : 'Responder'}
            </button>
            <button onClick={() => salvarResposta('resolvido')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Responder e Resolver
            </button>

            <div className="ml-auto flex gap-1.5">
              {ticket.status !== 'aberto' && (
                <button onClick={() => mudarStatus('aberto')}
                  className="px-2.5 py-2 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors">
                  Reabrir
                </button>
              )}
              {ticket.status !== 'resolvido' && (
                <button onClick={() => mudarStatus('resolvido')}
                  className="px-2.5 py-2 bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                  Marcar resolvido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Suporte() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState('aberto')

  const carregar = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_all_support_tickets')
    setTickets(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const filtrados = filtro === 'todos' ? tickets : tickets.filter(t => t.status === filtro)

  const counts = {
    aberto:         tickets.filter(t => t.status === 'aberto').length,
    em_atendimento: tickets.filter(t => t.status === 'em_atendimento').length,
    resolvido:      tickets.filter(t => t.status === 'resolvido').length,
    todos:          tickets.length,
  }

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Em aberto',       value: counts.aberto,         color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Em atendimento',  value: counts.em_atendimento, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Resolvidos',      value: counts.resolvido,      color: 'text-green-600', bg: 'bg-green-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-extrabold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {[
          { key: 'aberto',         label: `Abertos (${counts.aberto})` },
          { key: 'em_atendimento', label: `Em atendimento (${counts.em_atendimento})` },
          { key: 'resolvido',      label: `Resolvidos (${counts.resolvido})` },
          { key: 'todos',          label: `Todos (${counts.todos})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtro === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
        <button onClick={carregar} className="ml-auto p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Nenhum chamado {filtro !== 'todos' ? `"${STATUS_CONFIG[filtro]?.label?.toLowerCase()}"` : ''} no momento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(t => <TicketCard key={t.id} ticket={t} onUpdate={carregar} />)}
        </div>
      )}
    </div>
  )
}

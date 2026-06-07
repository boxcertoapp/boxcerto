// ============================================================
// OsDetailPreview — PROTÓTIPO OCULTO (rota /app/os-preview)
// Redesign da tela de detalhe da OS: header enxuto, faixa de
// status, seções por estágio, UMA ação primária no rodapé.
// Dados reais (read-only). Nada aqui altera a OS de verdade.
// ============================================================
import { useState, useEffect, useRef } from 'react'
import {
  X, MessageCircle, Edit2, MoreVertical, Printer, Share2, Trash2,
  ChevronDown, Send, PackageCheck, Wrench, ClipboardList, Flag,
  Tag, Package, Plus, Check, Clock, CheckCircle2, Gauge, TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { showToast } from '../../components/Toast'
import {
  osStorage, itemStorage, formatCurrency, formatDate, formatNumeroOS,
} from '../../lib/storage'

const demo = (msg) => showToast(msg, 'info')

// ── Faixa de status contextual ───────────────────────────────
function StatusBanner({ stage, aprovacao }) {
  const map = {
    orcamento: aprovacao === 'aprovado'
      ? { ic: CheckCircle2, txt: 'Orçamento aprovado pelo cliente', cls: 'bg-green-50 text-green-700' }
      : { ic: Clock, txt: 'Aguardando aprovação do cliente', cls: 'bg-amber-50 text-amber-700' },
    manutencao: { ic: Wrench, txt: 'Veículo em serviço', cls: 'bg-blue-50 text-blue-700' },
    pronto:     { ic: PackageCheck, txt: 'Pronto para retirada', cls: 'bg-green-50 text-green-700' },
    entregue:   { ic: Check, txt: 'Entregue', cls: 'bg-slate-100 text-slate-500' },
  }
  const s = map[stage] || map.orcamento
  const Ic = s.ic
  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold ${s.cls}`}>
      <Ic className="w-3.5 h-3.5 shrink-0" /> {s.txt}
    </div>
  )
}

// ── Card colapsável genérico ─────────────────────────────────
function Section({ icon: Icon, title, defaultOpen = false, accent, right, children }) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { setOpen(defaultOpen) }, [defaultOpen])
  return (
    <div className={`bg-white rounded-2xl border ${accent ? 'border-indigo-100' : 'border-gray-100'} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2.5 p-3.5 text-left">
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${accent ? 'text-indigo-600' : 'text-slate-400'}`} />}
        <span className={`text-sm font-bold ${accent ? 'text-slate-900' : 'text-slate-700'}`}>{title}</span>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && <div className="px-3.5 pb-3.5 -mt-1">{children}</div>}
    </div>
  )
}

// ── Conteúdos das seções (read-only) ─────────────────────────
function ItensBody({ items, totals }) {
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => demo('Adicionar item — exemplo no preview')} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-2">Nenhum item ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <div className="min-w-0">
                <p className="text-sm text-slate-800 truncate">{it.descricao}</p>
                {it.custo > 0 && <p className="text-[11px] text-slate-400">Custo: {formatCurrency(it.custo)}</p>}
              </div>
              <span className="text-sm font-semibold text-slate-900 shrink-0">{formatCurrency(it.venda)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function OsDetailPreview() {
  const { user } = useAuth()
  const [list, setList]     = useState([])
  const [osId, setOsId]     = useState('')
  const [os, setOs]         = useState(null)
  const [items, setItems]   = useState([])
  const [stage, setStage]   = useState('orcamento')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Carrega OS ativas para o seletor
  useEffect(() => {
    osStorage.getAll(user.oficina).then(all => {
      const ativas = all.filter(o => o.status !== 'entregue')
      const base = ativas.length ? ativas : all
      setList(base)
      if (base[0]) setOsId(base[0].id)
    })
  }, [user.oficina])

  // Carrega a OS selecionada + itens
  useEffect(() => {
    if (!osId) return
    const found = list.find(o => o.id === osId)
    if (found) { setOs(found); setStage(found.status === 'entregue' ? 'pronto' : found.status) }
    itemStorage.getByOS(osId).then(setItems).catch(() => setItems([]))
  }, [osId, list])

  // Fecha menu ⋯ ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    const onOut = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [menuOpen])

  if (!os) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  const total = os.totals?.venda || 0
  const checklist = os.checklist || []
  const feitas = checklist.filter(t => t.feito).length

  // Ação primária por estágio (UM verde, no rodapé)
  const ACTION = {
    orcamento:  { label: 'Enviar para cliente', Ic: Send },
    manutencao: { label: 'Marcar como Pronto',  Ic: CheckCircle2 },
    pronto:     { label: 'Entregar Veículo',     Ic: PackageCheck },
  }[stage] || { label: 'Enviar para cliente', Ic: Send }

  // Seção primária do estágio (aberta, no topo)
  const isOrc = stage === 'orcamento'
  const isMan = stage === 'manutencao'
  const isPro = stage === 'pronto'

  return (
    <div className="pb-40">
      {/* Barra do protótipo + seletor de OS */}
      <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium">🔬 Preview da OS — visual de teste, não altera nada</span>
        <select value={osId} onChange={e => setOsId(e.target.value)}
          className="ml-auto text-[11px] bg-indigo-500 border border-indigo-400 rounded-lg px-2 py-1 text-white max-w-[55%] truncate">
          {list.map(o => (
            <option key={o.id} value={o.id} className="text-slate-900">
              {o.vehicle?.placa} · {o.vehicle?.modelo?.slice(0, 22) || 'OS'}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-xl mx-auto bg-white sm:rounded-2xl sm:my-4 sm:border sm:border-gray-100 overflow-hidden">

        {/* ── HEADER ENXUTO ── */}
        <div className="flex items-center gap-2 p-3.5 border-b border-gray-100">
          <button onClick={() => demo('Fechar — exemplo')} className="p-1.5 hover:bg-gray-100 rounded-full shrink-0" aria-label="Fechar">
            <X className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-sm truncate">{os.vehicle?.placa} · {os.vehicle?.modelo}</p>
              {os.numeroOS && <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">{formatNumeroOS(os.numeroOS)}</span>}
            </div>
            <p className="text-xs text-slate-400 truncate">{os.client?.nome} · {formatDate(os.createdAt)}</p>
          </div>
          {/* Apenas WhatsApp + editar como ícones; o resto vai no menu */}
          <button onClick={() => demo('WhatsApp com o cliente — exemplo')} className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0" aria-label="WhatsApp">
            <MessageCircle className="w-4.5 h-4.5 text-green-600" />
          </button>
          <button onClick={() => demo('Editar dados — exemplo')} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label="Editar">
            <Edit2 className="w-4 h-4 text-slate-500" />
          </button>
          <div className="relative shrink-0" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Mais ações">
              <MoreVertical className="w-5 h-5 text-slate-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden py-1">
                {[[Printer, 'Imprimir OS'], [Share2, 'Compartilhar'], [Trash2, 'Excluir OS', true]].map(([Ic, label, danger]) => (
                  <button key={label} onClick={() => { setMenuOpen(false); demo(`${label} — exemplo`) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-gray-50 ${danger ? 'text-red-500' : 'text-slate-700'}`}>
                    <Ic className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── FAIXA DE STATUS ── */}
        <StatusBanner stage={stage} aprovacao={os.aprovacaoStatus} />

        {/* ── TABS DE ESTÁGIO ── */}
        <div className="p-3.5">
          <div className="flex gap-2">
            {[['orcamento', 'Orçamento'], ['manutencao', 'Em Manutenção'], ['pronto', 'Pronto']].map(([k, lbl]) => (
              <button key={k} onClick={() => setStage(k)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  stage === k ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-slate-500'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTEÚDO POR ESTÁGIO ── */}
        <div className="px-3.5 pb-4 space-y-2.5">

          {/* metadados leves: KM + urgente — discreto, sempre */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> KM {os.km || '—'}</span>
            {os.urgente && <span className="inline-flex items-center gap-1 text-red-500 font-semibold"><TriangleAlert className="w-3.5 h-3.5" /> Urgente</span>}
          </div>

          {/* ESTÁGIO: ORÇAMENTO → foco em Serviços/Peças */}
          {isOrc && (
            <>
              <Section icon={Package} title="Serviços / Peças" accent defaultOpen
                right={<span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>}>
                <ItensBody items={items} totals={os.totals} />
              </Section>
              <Section icon={Tag} title="Desconto e pagamento">
                <p className="text-sm text-slate-500 py-1">Desconto e forma de pagamento aparecem aqui.</p>
              </Section>
              <Section icon={ClipboardList} title="Mais detalhes (técnico, tarefas, notas)">
                <p className="text-sm text-slate-400 py-1">Esses campos ganham destaque quando a OS entra em <b>manutenção</b>.</p>
              </Section>
            </>
          )}

          {/* ESTÁGIO: MANUTENÇÃO → foco em execução */}
          {isMan && (
            <>
              <Section icon={ClipboardList} title="Tarefas" accent defaultOpen
                right={checklist.length > 0 && <span className="text-xs font-semibold text-indigo-600">{feitas}/{checklist.length}</span>}>
                {checklist.length === 0 ? (
                  <p className="text-sm text-slate-400 py-1">Nenhuma tarefa. Toque para adicionar um checklist do serviço.</p>
                ) : (
                  <div className="space-y-1.5">
                    {checklist.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${t.feito ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {t.feito && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className={t.feito ? 'text-slate-400 line-through' : 'text-slate-700'}>{t.texto || t.descricao}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
              <Section icon={Wrench} title="Técnico responsável" defaultOpen>
                <p className="text-sm text-slate-700 py-1">{os.tecnico || 'Não atribuído — toque para definir.'}</p>
              </Section>
              <Section icon={Flag} title="Notas internas" defaultOpen>
                {(os.notasInternas || []).length === 0
                  ? <p className="text-sm text-slate-400 py-1">Sem notas internas.</p>
                  : <div className="space-y-1">{os.notasInternas.map((n, i) => <p key={i} className="text-sm text-slate-600">• {n.texto || n}</p>)}</div>}
              </Section>
              <Section icon={Package} title="Serviços / Peças"
                right={<span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>}>
                <ItensBody items={items} totals={os.totals} />
              </Section>
            </>
          )}

          {/* ESTÁGIO: PRONTO → foco em cobrar/entregar */}
          {isPro && (
            <>
              <Section icon={Tag} title="Pagamento" accent defaultOpen
                right={<span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>}>
                <p className="text-sm text-slate-500 py-1">Resumo de valores e forma de pagamento — confirmados ao entregar.</p>
              </Section>
              <Section icon={Package} title="Serviços / Peças"
                right={<span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>}>
                <ItensBody items={items} totals={os.totals} />
              </Section>
              <button onClick={() => demo('Avisar cliente que está pronto — exemplo')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-200 text-green-700 text-sm font-semibold bg-green-50">
                <MessageCircle className="w-4 h-4" /> Avisar cliente no WhatsApp
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── RODAPÉ STICKY: UMA ação primária ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
          <button onClick={() => demo(`${ACTION.label} — exemplo no preview`)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-700 transition-colors">
            <ACTION.Ic className="w-5 h-5" /> {ACTION.label}
          </button>
        </div>
      </div>
    </div>
  )
}

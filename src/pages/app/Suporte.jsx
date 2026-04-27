import { useState, useEffect } from 'react'
import {
  MessageCircle, Ticket, ChevronDown, ChevronUp,
  CheckCircle, Loader2, Send, Clock, Wrench,
  Package, TrendingUp, FileText, X, LifeBuoy,
  AlertCircle, Lightbulb, HelpCircle, CreditCard
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const WPP = 'https://wa.me/5553997065725?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20BoxCerto!'

// ── Guia visual de funcionalidades ───────────────────────────
const GUIAS = [
  {
    icon: Wrench, color: 'bg-indigo-50 text-indigo-600', titulo: 'Criar uma Ordem de Serviço',
    passos: [
      'Na aba Oficina, toque em "Nova OS"',
      'Digite a placa do veículo — se já cadastrado, aparece automaticamente',
      'Preencha o modelo, KM e observações do serviço',
      'Adicione os itens (peças e serviços) com preço de custo e venda',
      'Altere o status conforme o andamento: Orçamento → Em serviço → Pronto → Entregue',
    ]
  },
  {
    icon: FileText, color: 'bg-emerald-50 text-emerald-600', titulo: 'Enviar orçamento ao cliente',
    passos: [
      'Abra a OS desejada em Histórico ou Oficina',
      'Toque no ícone de compartilhar (canto superior)',
      'Escolha "Enviar por WhatsApp" — o cliente recebe um link com o orçamento',
      'O cliente pode aprovar diretamente pelo link, sem precisar ligar',
      'Você é notificado quando ele aprovar',
    ]
  },
  {
    icon: Package, color: 'bg-amber-50 text-amber-600', titulo: 'Controlar o estoque de peças',
    passos: [
      'Acesse a aba Estoque',
      'Toque em "+" para cadastrar uma peça nova com quantidade e preço',
      'Ative "Alertar quando acabar" para avisos de estoque baixo',
      'Ao adicionar uma peça numa OS, o estoque baixa automaticamente',
      'O painel mostra em vermelho os itens com estoque crítico',
    ]
  },
  {
    icon: TrendingUp, color: 'bg-blue-50 text-blue-600', titulo: 'Acompanhar o financeiro',
    passos: [
      'Acesse a aba Financeiro',
      'Veja o faturamento do mês e compare com meses anteriores',
      'Adicione despesas (aluguel, ferramentas, luz) para ver o lucro real',
      'No Menu → Relatórios → Serviços do Mês você pode imprimir um relatório',
    ]
  },
  {
    icon: MessageCircle, color: 'bg-pink-50 text-pink-600', titulo: 'Recuperar clientes inativos',
    passos: [
      'Acesse Menu → Relatórios → Clientes Inativos',
      'Escolha o período (3, 6, 9 meses ou mais de 1 ano)',
      'Veja quem não voltou à oficina nesse período',
      'Toque em "WPP" para enviar uma mensagem automática de saudade no WhatsApp',
    ]
  },
]

// ── FAQs ──────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Perdi minha senha. O que faço?',
    a: 'Na tela de login, clique em "Esqueci minha senha". Vamos enviar um link para o seu e-mail para você criar uma nova senha.'
  },
  {
    q: 'Meus dados ficam salvos mesmo se eu fechar o app?',
    a: 'Sim. Tudo é salvo automaticamente em nuvem em tempo real. Pode fechar, mudar de dispositivo ou usar em vários aparelhos — seus dados estarão lá.'
  },
  {
    q: 'Posso usar em mais de um celular ao mesmo tempo?',
    a: 'Sim! Você pode acessar pelo celular, tablet e computador simultaneamente. Todos verão os mesmos dados atualizados.'
  },
  {
    q: 'Como imprimir uma OS ou recibo?',
    a: 'Abra a OS, toque no ícone de impressora ou compartilhamento. Você pode gerar um PDF para imprimir ou enviar pelo WhatsApp diretamente.'
  },
  {
    q: 'Como cancelar minha assinatura?',
    a: 'Acesse Menu → Minha Conta → Gerenciar assinatura. Lá você gerencia ou cancela direto pelo portal do Stripe, sem precisar falar com ninguém.'
  },
  {
    q: 'O BoxCerto funciona sem internet?',
    a: 'Não — o app precisa de conexão para salvar e buscar dados. Com dados móveis ou Wi-Fi fraco, pode haver lentidão. Recomendamos Wi-Fi ou 4G.'
  },
]

const CATEGORIAS = [
  { key: 'duvida',     label: 'Dúvida de uso',        icon: HelpCircle,  color: 'bg-blue-50 text-blue-600' },
  { key: 'erro',       label: 'Algo não está funcionando', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  { key: 'financeiro', label: 'Problema com pagamento', icon: CreditCard,  color: 'bg-amber-50 text-amber-600' },
  { key: 'sugestao',   label: 'Sugestão de melhoria',  icon: Lightbulb,   color: 'bg-emerald-50 text-emerald-600' },
  { key: 'outro',      label: 'Outro assunto',          icon: LifeBuoy,    color: 'bg-slate-50 text-slate-600' },
]

// ── FAQ Accordion item ────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-3">
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-slate-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

// ── Ticket form ───────────────────────────────────────────────
function FormTicket({ user, onEnviado }) {
  const [cat, setCat]       = useState('')
  const [titulo, setTitulo] = useState('')
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]     = useState('')

  const enviar = async () => {
    if (!cat)    return setErro('Escolha uma categoria.')
    if (!titulo.trim()) return setErro('Informe um assunto.')
    if (!msg.trim())    return setErro('Descreva sua dúvida.')
    setErro('')
    setLoading(true)
    const { error } = await supabase.from('support_tickets').insert({
      user_id:  user.id,
      oficina:  user.oficina || '',
      email:    user.email   || '',
      categoria: cat,
      titulo:   titulo.trim(),
      mensagem: msg.trim(),
      status:   'aberto',
    })
    setLoading(false)
    if (error) return setErro('Erro ao enviar. Tente novamente.')
    onEnviado()
  }

  return (
    <div className="space-y-4">
      {/* Categoria */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Categoria</p>
        <div className="grid grid-cols-1 gap-2">
          {CATEGORIAS.map(c => {
            const Icon = c.icon
            const sel = cat === c.key
            return (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  sel ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel ? 'bg-indigo-100' : c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${sel ? 'text-indigo-700' : 'text-slate-700'}`}>{c.label}</span>
                {sel && <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Assunto */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assunto</p>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={100}
          placeholder="Ex: Não consigo adicionar um item na OS"
          className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
      </div>

      {/* Mensagem */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descreva o problema</p>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} maxLength={1000}
          placeholder="Explique com detalhes o que aconteceu, qual tela você estava usando e o que esperava que fosse acontecer..."
          className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white resize-none" />
        <p className="text-right text-xs text-slate-400 mt-1">{msg.length}/1000</p>
      </div>

      {erro && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{erro}</p>
        </div>
      )}

      <button onClick={enviar} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {loading ? 'Enviando...' : 'Enviar chamado'}
      </button>
    </div>
  )
}

// ── Meus tickets ──────────────────────────────────────────────
function MeusTickets({ user }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    supabase.from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTickets(data || []); setLoading(false) })
  }, [user.id])

  const STATUS_CONFIG = {
    aberto:         { label: 'Aberto',          color: 'bg-amber-100 text-amber-700' },
    em_atendimento: { label: 'Em atendimento',  color: 'bg-blue-100 text-blue-700' },
    resolvido:      { label: 'Resolvido',        color: 'bg-green-100 text-green-700' },
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
  if (tickets.length === 0) return (
    <div className="text-center py-10">
      <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">Nenhum chamado aberto ainda.</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {tickets.map(t => {
        const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.aberto
        const expanded = expandedId === t.id
        return (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button onClick={() => setExpandedId(expanded ? null : t.id)}
              className="w-full flex items-start gap-3 p-4 text-left">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                  <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{t.titulo}</p>
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 mt-1 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-1 shrink-0" />}
            </button>
            {expanded && (
              <div className="border-t border-gray-50 px-4 pb-4 space-y-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Sua mensagem</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{t.mensagem}</p>
                </div>
                {t.resposta && (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">Resposta do suporte</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{t.resposta}</p>
                    {t.respondido_em && (
                      <p className="text-[10px] text-indigo-400 mt-2">{new Date(t.respondido_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    )}
                  </div>
                )}
                {!t.resposta && t.status !== 'resolvido' && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Aguardando resposta — normalmente em até 24h úteis
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function Suporte() {
  const { user } = useAuth()
  const [aba, setAba]                   = useState('ajuda')   // ajuda | chamado | meus
  const [guiaAberto, setGuiaAberto]     = useState(null)
  const [enviado, setEnviado]           = useState(false)

  const ABAS = [
    { key: 'ajuda',   label: 'Central de Ajuda' },
    { key: 'chamado', label: 'Abrir Chamado' },
    { key: 'meus',    label: 'Meus Chamados' },
  ]

  return (
    <div className="p-4 pb-36 space-y-4">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LifeBuoy className="w-5 h-5 text-indigo-200" />
              <p className="text-indigo-200 text-sm font-medium">Suporte BoxCerto</p>
            </div>
            <h1 className="text-xl font-extrabold mb-1">Como podemos ajudar?</h1>
            <p className="text-indigo-200 text-sm">Respondemos em até 24h úteis. Para urgências, use o WhatsApp.</p>
          </div>
        </div>
        <a href={WPP} target="_blank" rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 transition-colors text-white font-bold py-3 rounded-xl text-sm">
          <MessageCircle className="w-5 h-5" />
          Falar no WhatsApp agora
        </a>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {ABAS.map(t => (
          <button key={t.key} onClick={() => { setAba(t.key); setEnviado(false) }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${aba === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA: CENTRAL DE AJUDA ── */}
      {aba === 'ajuda' && (
        <div className="space-y-4">
          {/* Guias visuais */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Guias rápidos</p>
            <div className="space-y-2">
              {GUIAS.map((g, i) => {
                const Icon = g.icon
                const open = guiaAberto === i
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button onClick={() => setGuiaAberto(open ? null : i)}
                      className="w-full flex items-center gap-3 p-4 text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="flex-1 text-sm font-semibold text-slate-800">{g.titulo}</p>
                      {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    {open && (
                      <div className="border-t border-gray-50 px-4 pb-4">
                        <ol className="space-y-2.5 mt-3">
                          {g.passos.map((p, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{j+1}</span>
                              <p className="text-sm text-slate-600 leading-relaxed">{p}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Perguntas frequentes</p>
            <div className="bg-white rounded-2xl border border-gray-100 px-4">
              {FAQS.map((f, i) => <FaqItem key={i} {...f} />)}
            </div>
          </div>

          {/* CTA abrir chamado */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Não encontrou o que precisava?</p>
              <p className="text-xs text-slate-400">Abra um chamado e respondemos em até 24h.</p>
            </div>
            <button onClick={() => setAba('chamado')}
              className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
              Abrir
            </button>
          </div>
        </div>
      )}

      {/* ── ABA: ABRIR CHAMADO ── */}
      {aba === 'chamado' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {enviado ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-2">Chamado enviado!</h2>
              <p className="text-sm text-slate-500 mb-6">Respondemos em até 24h úteis. Você acompanha aqui em <strong>Meus Chamados</strong>.</p>
              <div className="flex gap-2">
                <button onClick={() => { setEnviado(false) }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors">
                  Novo chamado
                </button>
                <button onClick={() => setAba('meus')}
                  className="flex-1 py-3 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  Ver chamados
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Abrir chamado de suporte</h2>
              </div>
              <FormTicket user={user} onEnviado={() => setEnviado(true)} />
            </>
          )}
        </div>
      )}

      {/* ── ABA: MEUS CHAMADOS ── */}
      {aba === 'meus' && <MeusTickets user={user} />}
    </div>
  )
}

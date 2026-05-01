import { useState, useRef, useEffect } from 'react'
import { ArrowRight, CheckCircle, Zap, Star, Clock, TrendingUp, Package, FileText, ChevronRight, MessageCircle } from 'lucide-react'

const CADASTRO  = 'https://www.boxcerto.com/cadastro'
const WPP_NUM   = '5553997065725'
const WPP_MSG   = encodeURIComponent('Olá! Fiz o diagnóstico no site e quero saber mais sobre o BoxCerto.')

// ── Perguntas ─────────────────────────────────────────────────────────────────
const PERGUNTAS = [
  {
    id: 'volume',
    emoji: '🔧',
    titulo: 'Quantas ordens de serviço sua oficina faz por mês?',
    opcoes: [
      { value: 'pequena', label: 'Menos de 20',    desc: 'Oficina focada em qualidade' },
      { value: 'media',   label: 'Entre 20 e 50',  desc: 'Movimento constante'         },
      { value: 'grande',  label: 'Mais de 50',     desc: 'Alta demanda'                },
    ],
  },
  {
    id: 'orcamento',
    emoji: '📋',
    titulo: 'Como você envia orçamentos para os clientes hoje?',
    opcoes: [
      { value: 'whatsapp', label: 'Foto ou mensagem no WhatsApp', desc: 'Rápido mas sem rastreio'     },
      { value: 'papel',    label: 'Papel ou caderno',             desc: 'Funciona mas some'           },
      { value: 'planilha', label: 'Planilha ou e-mail',           desc: 'Organizado mas trabalhoso'   },
      { value: 'nenhum',   label: 'Não formalizo',                desc: 'Só falo o preço verbalmente' },
    ],
  },
  {
    id: 'dor',
    emoji: '😤',
    titulo: 'Qual é a sua maior dificuldade no dia a dia?',
    opcoes: [
      { value: 'aprovacao',  label: 'Cliente some sem aprovar o orçamento', desc: 'Trabalho e tempo perdidos'   },
      { value: 'estoque',    label: 'Peças perdidas ou estoque bagunçado',  desc: 'Dinheiro jogado fora'        },
      { value: 'financeiro', label: 'Não sei se estou lucrando de verdade', desc: 'Incerteza no fim do mês'     },
      { value: 'tempo',      label: 'Tempo demais em papelada e burocracia',desc: 'Menos tempo na chave'        },
    ],
  },
  {
    id: 'equipe',
    emoji: '👷',
    titulo: 'Quantos técnicos trabalham com você?',
    opcoes: [
      { value: 'solo',    label: 'Só eu mesmo',     desc: 'Dono e mecânico'  },
      { value: 'pequena', label: '1 a 3 técnicos',  desc: 'Equipe enxuta'    },
      { value: 'media',   label: '4 ou mais',       desc: 'Equipe maior'     },
    ],
  },
]

// ── Resultado personalizado ───────────────────────────────────────────────────
function gerarResultado({ volume, orcamento, dor, equipe }) {
  // Estimativa de perda mensal por faixa de volume
  // Base: OS médias × 15% abandono × ticket médio + estoque + tempo
  const perdaFaixa = {
    pequena: { min: 'R$800',   max: 'R$1.500',  liq_min: 'R$700',   liq_max: 'R$1.400'  },
    media:   { min: 'R$1.800', max: 'R$3.000',  liq_min: 'R$1.700', liq_max: 'R$2.900'  },
    grande:  { min: 'R$3.500', max: 'R$6.000',  liq_min: 'R$3.400', liq_max: 'R$5.900'  },
  }
  const perda = perdaFaixa[volume] || perdaFaixa.media

  const horas = volume === 'grande' ? '18 horas' : volume === 'media' ? '10 horas' : '5 horas'
  const os    = volume === 'grande' ? '50+' : volume === 'media' ? '20–50' : 'até 20'

  const doresMapa = {
    aprovacao: {
      icon: FileText,
      cor: 'indigo',
      titulo: 'Você perde dinheiro em orçamentos sem resposta',
      texto: 'Com BoxCerto, o cliente recebe um link profissional e aprova com um clique. Você vê o status em tempo real — sem precisar ligar, perguntar ou esperar.',
      stat: '68% dos orçamentos sem follow-up são abandonados. BoxCerto elimina esse problema.',
    },
    estoque: {
      icon: Package,
      cor: 'amber',
      titulo: 'Seu estoque invisível está custando caro',
      texto: 'BoxCerto controla entrada, saída e alerta quando uma peça está acabando. Você para de comprar duplicado e de perder serviço por falta de peça.',
      stat: 'Oficinas perdem em média R$400/mês com estoque descontrolado.',
    },
    financeiro: {
      icon: TrendingUp,
      cor: 'emerald',
      titulo: 'Sem número, você não sabe se está crescendo ou afundando',
      texto: 'O BoxCerto cruza receitas, despesas e serviços automaticamente. Você vê o lucro real da semana em 30 segundos, sem planilha, sem contador.',
      stat: '7 em cada 10 mecânicos descobrem que trabalhavam abaixo do custo real.',
    },
    tempo: {
      icon: Clock,
      cor: 'rose',
      titulo: 'Você passa horas em papelada que poderiam estar na chave',
      texto: 'BoxCerto gera OS, orçamento, recibo e histórico do veículo em segundos. Cada documento em seu lugar, acessível de qualquer celular.',
      stat: `Donos de oficina com ${os} OS/mês recuperam até ${horas} por mês com automação.`,
    },
  }

  const orcamentoMapa = {
    whatsapp: `Você já usa o WhatsApp — ótimo. O BoxCerto turbina isso: o orçamento chega formatado e profissional, o cliente aprova pelo link e você não precisa mais perguntar "aprovou?".`,
    papel:    `Papel funciona, mas some. Com BoxCerto, cada orçamento fica no histórico do cliente para sempre — acessível de qualquer lugar, em qualquer hora.`,
    planilha: `Planilha é um começo, mas não avisa quando o cliente aprovou, não gera OS e não rastreia o status. BoxCerto faz tudo isso automaticamente.`,
    nenhum:   `Orçamento verbal é o caminho mais rápido pro mal-entendido. Com BoxCerto, o cliente recebe tudo por escrito e aprova formalmente — você se protege e passa profissionalismo.`,
  }

  const equipeMapa = {
    solo:    `Como você trabalha sozinho, cada minuto economizado em burocracia é tempo a mais na chave — ou em casa com a família.`,
    pequena: `Com uma equipe pequena, o BoxCerto deixa cada técnico ver e atualizar as próprias OS — sem depender de você para tudo.`,
    media:   `Com 4 ou mais técnicos, o modo multi-técnico é essencial: cada um vê só o que é seu e você tem visão geral de tudo em tempo real.`,
  }

  return {
    perda,
    dor: doresMapa[dor],
    orcamentoMsg: orcamentoMapa[orcamento],
    equipeMsg: equipeMapa[equipe],
  }
}

// ── Cores por tipo ────────────────────────────────────────────────────────────
const COR = {
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: 'text-indigo-600',  badge: 'bg-indigo-600'  },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',  icon: 'text-amber-600',   badge: 'bg-amber-600'   },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200',icon: 'text-emerald-600', badge: 'bg-emerald-600' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',   icon: 'text-rose-600',    badge: 'bg-rose-600'    },
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
function ProgressBar({ atual, total }) {
  const pct = Math.round((atual / total) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>Pergunta {atual} de {total}</span>
        <span>{pct}% concluído</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function OpcaoCard({ opcao, selecionada, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group
        ${selecionada
          ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 hover:scale-[1.01]'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
          ${selecionada ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
          {selecionada && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
        <div>
          <p className={`text-sm font-semibold transition-colors ${selecionada ? 'text-indigo-700' : 'text-slate-800'}`}>
            {opcao.label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{opcao.desc}</p>
        </div>
        {selecionada && <ChevronRight className="w-4 h-4 text-indigo-600 ml-auto" />}
      </div>
    </button>
  )
}

function ResultadoCard({ dor, orcamentoMsg, equipeMsg, perda }) {
  const c = COR[dor.cor]
  const DorIcon = dor.icon

  return (
    <div className="space-y-5">

      {/* Headline do diagnóstico */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <CheckCircle className="w-3.5 h-3.5" />
          Diagnóstico concluído
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          Identificamos o que trava sua oficina
        </h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Com base nas suas respostas, veja o que está custando dinheiro agora — e como resolver isso hoje.
        </p>
      </div>

      {/* Card principal — dor */}
      <div className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.badge} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
            <DorIcon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Principal problema identificado</p>
            <h3 className="text-base font-bold text-slate-800">{dor.titulo}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">{dor.texto}</p>
        <div className="bg-white/80 rounded-xl px-4 py-2.5 border border-white">
          <p className="text-xs text-slate-500 font-medium">📊 {dor.stat}</p>
        </div>
      </div>

      {/* Cards secundários */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Como você envia orçamentos</p>
          <p className="text-sm text-slate-600 leading-relaxed">{orcamentoMsg}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Para o tamanho da sua equipe</p>
          <p className="text-sm text-slate-600 leading-relaxed">{equipeMsg}</p>
        </div>
      </div>

      {/* Bloco de perda × recuperação */}
      <div className="rounded-2xl overflow-hidden border-2 border-rose-200">
        {/* Topo — o que está perdendo */}
        <div className="bg-rose-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">⚠️ Sua oficina provavelmente está perdendo</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{perda.min} a {perda.max}</span>
            <span className="text-rose-400 font-semibold mb-0.5">/ mês</span>
          </div>
          <p className="text-xs text-rose-400 mt-1">em orçamentos abandonados, estoque descontrolado e tempo em burocracia</p>
        </div>
        {/* Divisor */}
        <div className="bg-white px-5 py-3 border-t border-b border-gray-100 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-slate-400 font-semibold">Com BoxCerto (R$97/mês) você recupera</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        {/* Base — o que ganha líquido */}
        <div className="bg-emerald-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">✅ Ganho líquido estimado</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">+{perda.liq_min} a +{perda.liq_max}</span>
            <span className="text-emerald-400 font-semibold mb-0.5">/ mês</span>
          </div>
          <p className="text-xs text-emerald-500 mt-1">já descontado o custo da assinatura</p>
        </div>
      </div>

      {/* Depoimento */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100">
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
        </div>
        <p className="text-sm text-slate-600 italic mb-3">
          "Antes eu perdia pelo menos 3 orçamentos por semana sem resposta. Com o BoxCerto, o cliente aprova pelo link e eu sei na hora. Em 2 meses recuperei o valor da assinatura várias vezes."
        </p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">M</div>
          <div>
            <p className="text-xs font-bold text-slate-800">Marcos S.</p>
            <p className="text-xs text-slate-400">Auto Center Marcos · Pelotas, RS</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3 pt-2">
        <a
          href={CADASTRO}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-lg shadow-indigo-200"
        >
          Começar gratuitamente — 7 dias grátis
          <ArrowRight className="w-5 h-5" />
        </a>
        <a
          href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 text-slate-700 font-semibold py-3.5 rounded-2xl hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com especialista no WhatsApp
        </a>
        <p className="text-center text-xs text-slate-400">Sem cartão de crédito · Cancele quando quiser</p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Diagnostico() {
  const [etapa, setEtapa]           = useState(0)         // 0 = intro, 1–4 = perguntas, 5 = resultado
  const [respostas, setRespostas]   = useState({})
  const [selecionada, setSelecionada] = useState(null)
  const resultadoRef = useRef(null)

  const perguntaAtual = PERGUNTAS[etapa - 1]
  const totalPerguntas = PERGUNTAS.length

  // Scroll para resultado quando termina
  useEffect(() => {
    if (etapa === totalPerguntas + 1 && resultadoRef.current) {
      setTimeout(() => resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [etapa, totalPerguntas])

  const selecionar = (value) => {
    setSelecionada(value)
    setTimeout(() => {
      const novasRespostas = { ...respostas, [perguntaAtual.id]: value }
      setRespostas(novasRespostas)
      setSelecionada(null)
      setEtapa(e => e + 1)
    }, 350)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">BoxCerto</span>
          </a>
          <div className="ml-auto text-xs text-slate-400">Diagnóstico gratuito</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* INTRO */}
        {etapa === 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5" />
              100% gratuito · Leva menos de 1 minuto
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
              Descubra quanto sua oficina<br />
              <span className="text-indigo-600">está perdendo por mês</span>
            </h1>
            <p className="text-slate-500 text-base mb-8 max-w-md mx-auto">
              Responda 4 perguntas rápidas e veja um diagnóstico personalizado da sua operação — com o que está custando dinheiro e como corrigir.
            </p>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 text-left max-w-sm mx-auto">
              {[
                '4 perguntas simples sobre sua oficina',
                'Diagnóstico personalizado na hora',
                'Quanto você pode economizar por mês',
                'Solução específica para o seu perfil',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEtapa(1)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-indigo-200"
            >
              Fazer o diagnóstico grátis
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-400 mt-3">Sem cadastro · Resultado imediato</p>
          </div>
        )}

        {/* PERGUNTAS */}
        {etapa >= 1 && etapa <= totalPerguntas && perguntaAtual && (
          <div>
            <div className="mb-8">
              <ProgressBar atual={etapa} total={totalPerguntas} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{perguntaAtual.emoji}</div>
                <h2 className="text-xl font-extrabold text-slate-900">{perguntaAtual.titulo}</h2>
              </div>

              <div className="space-y-3">
                {perguntaAtual.opcoes.map(opcao => (
                  <OpcaoCard
                    key={opcao.value}
                    opcao={opcao}
                    selecionada={selecionada === opcao.value}
                    onClick={() => selecionar(opcao.value)}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Clique em uma opção para avançar automaticamente
            </p>
          </div>
        )}

        {/* RESULTADO */}
        {etapa === totalPerguntas + 1 && (
          <div ref={resultadoRef}>
            <ResultadoCard {...gerarResultado(respostas)} />
          </div>
        )}

      </div>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-100 mt-12 py-6">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2025 BoxCerto. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-slate-600">Termos</a>
            <a href="/privacidade" className="hover:text-slate-600">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

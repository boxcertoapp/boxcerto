import { useState } from 'react'
import {
  CheckCircle, ArrowRight, Zap, Star, MessageCircle, Shield,
  Clock, Smartphone, FileText, ThumbsUp, Eye, Bell, Link2
} from 'lucide-react'

const CADASTRO = 'https://www.boxcerto.com/cadastro'
const WPP_NUM  = '5553997065725'
const WPP_MSG  = encodeURIComponent('Olá! Vi a página sobre orçamento online e quero saber mais.')

// ── Status Stepper ────────────────────────────────────────────
const STEPS = [
  { label: 'Orçamento',  desc: 'enviado',        bg: 'bg-slate-700',   ring: false },
  { label: 'Aprovado',   desc: 'pelo cliente',   bg: 'bg-indigo-600',  ring: false },
  { label: 'Em serviço', desc: 'mãos na massa',  bg: 'bg-amber-500',   ring: true  },
  { label: 'Pronto',     desc: 'para retirada',  bg: 'bg-emerald-500', ring: false },
]

function StatusStepper() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
      {STEPS.map((step, i) => (
        <div key={i} className="flex flex-col sm:flex-row items-center">
          <div className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl min-w-[110px] text-white ${step.bg} ${step.ring ? 'ring-4 ring-amber-300 shadow-xl scale-105 z-10' : 'opacity-90'}`}>
            <span className="text-xs font-extrabold">{step.label}</span>
            <span className="text-[10px] text-white/70 mt-0.5">{step.desc}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-px h-3 sm:h-px sm:w-5 bg-slate-300 my-0.5 sm:my-0 sm:mx-0.5" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Mock de aprovação interativo ──────────────────────────────
function AprovacaoDemo() {
  const [aprovado, setAprovado] = useState(false)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">

      {/* Passo 1 — você envia */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
          1. Você envia pelo WhatsApp
        </p>
        <div className="bg-[#e9fbe5] rounded-2xl p-4 shadow-md">
          <div className="flex items-start gap-2 mb-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">O</div>
            <div>
              <p className="text-[10px] font-bold text-indigo-700 mb-1">Oficina BoxCerto</p>
              <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[200px]">
                <p className="text-xs text-slate-700 font-medium mb-1">📋 Orçamento #247</p>
                <p className="text-[10px] text-slate-500 mb-2">Honda Civic · ABC-1234</p>
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Troca de pastilhas</span>
                    <span className="font-semibold text-slate-700">R$180</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Mão de obra</span>
                    <span className="font-semibold text-slate-700">R$120</span>
                  </div>
                  <div className="flex justify-between text-[10px] border-t border-gray-100 pt-1 mt-1">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-bold text-indigo-700">R$300</span>
                  </div>
                </div>
                <div className="bg-indigo-600 rounded-lg py-1.5 text-center">
                  <span className="text-white text-[10px] font-bold">👆 Toque para aprovar</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" /> Visualizado · 14:23
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0" />
        </div>
      </div>

      {/* Passo 2 — cliente aprova */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
          2. Cliente aprova em 1 clique
        </p>
        <div
          onClick={() => setAprovado(true)}
          className={`rounded-2xl border-2 p-4 shadow-md cursor-pointer transition-all duration-300 ${aprovado ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-gray-200 hover:border-indigo-300'}`}
        >
          <div className="text-center mb-3">
            <p className="text-xs font-bold text-slate-700 mb-0.5">Orçamento #247</p>
            <p className="text-[10px] text-slate-400">Honda Civic · ABC-1234</p>
          </div>
          <div className="space-y-1.5 mb-3">
            {[['Troca de pastilhas dianteiras', 'R$180'], ['Mão de obra', 'R$120']].map(([s, v]) => (
              <div key={s} className="flex justify-between text-xs py-1 border-b border-gray-100">
                <span className="text-slate-600">{s}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold text-indigo-700 pt-1">
              <span>Total</span>
              <span>R$300,00</span>
            </div>
          </div>

          {aprovado ? (
            <div className="flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl py-2.5">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-bold">Aprovado! ✓</span>
            </div>
          ) : (
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              Aprovar orçamento
            </button>
          )}

          {!aprovado && (
            <p className="text-center text-[10px] text-slate-400 mt-2">← Toque para simular</p>
          )}
        </div>

        {aprovado && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
            <Bell className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-700">Você foi notificado!</p>
              <p className="text-[10px] text-slate-500 mt-0.5">O orçamento #247 foi aprovado. Pode iniciar o serviço.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Depoimentos ───────────────────────────────────────────────
const DEPOIMENTOS = [
  {
    nome: 'André T.',
    oficina: 'Mecânica André · Canoas, RS',
    texto: 'Antes eu ficava ligando pro cliente pra saber se aprovou. Agora vejo em tempo real. Minha taxa de aprovação subiu 40% porque o link passa profissionalismo.',
    inicial: 'A',
  },
  {
    nome: 'Simone R.',
    oficina: 'Auto Center SR · Gravataí, RS',
    texto: 'O cliente abre o link no celular, vê o orçamento detalhado e aprova. Nunca mais tive aquele problema de "não sabia que era tão caro" — tudo está claro antes.',
    inicial: 'S',
  },
  {
    nome: 'Fábio N.',
    oficina: 'FN Mecânica · São Leopoldo, RS',
    texto: 'Trabalho com frotas. Antes mandar orçamento pra aprovação era um pesadelo. Com BoxCerto, o responsável aprova pelo link e já recebo a confirmação na hora.',
    inicial: 'F',
  },
  {
    nome: 'Luciana M.',
    oficina: 'Oficina LM · Novo Hamburgo, RS',
    texto: 'O histórico de aprovação salvou minha pele uma vez. Cliente disse que não tinha autorizado a troca. Abri o sistema e mostrei o print da aprovação dele. Acabou a discussão.',
    inicial: 'L',
  },
]

export default function LandingOrcamento() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">BoxCerto</span>
          </a>
          <a
            href={CADASTRO}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Link2 className="w-3.5 h-3.5" />
              Orçamento digital para oficinas mecânicas
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
              Chega de "o cliente<br />
              <span className="text-indigo-600">aprovou o orçamento?"</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Com BoxCerto, você envia o orçamento pelo WhatsApp e o cliente aprova com um clique. Você vê o status em tempo real — sem ligar, sem esperar, sem susto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-indigo-200"
              >
                Testar grátis por 7 dias
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-slate-700 font-semibold px-6 py-4 rounded-2xl hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
          </div>

          {/* Demo interativo */}
          <div className="bg-slate-900 rounded-3xl p-6 md:p-10">
            <p className="text-center text-slate-400 text-xs uppercase tracking-wider font-semibold mb-6">
              Como funciona na prática — clique para simular
            </p>
            <AprovacaoDemo />
          </div>
        </div>
      </section>

      {/* DORES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Orçamento manual custa caro
            </h2>
            <p className="text-slate-500">Cada orçamento sem resposta é trabalho, tempo e peça que não volta.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                emoji: '📵',
                titulo: 'Cliente some após o orçamento',
                desc: 'Você fez o diagnóstico, separou as peças, montou o valor — e o cliente para de responder. Sem rastreio, você não sabe se leu, se achou caro, se foi pra concorrência.',
              },
              {
                emoji: '😤',
                titulo: '"Não falou que era tanto"',
                desc: 'Orçamento verbal ou por mensagem solta não tem valor jurídico. Cliente questiona o valor na entrega e você fica sem argumento.',
              },
              {
                emoji: '⏰',
                titulo: 'Tempo perdido em ligações',
                desc: 'Ligar pra saber se aprovou, reenviar mensagem, esperar resposta. Cada follow-up manual é tempo que poderia estar no serviço.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-slate-800 mb-2">{item.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Do orçamento à entrega — tudo rastreado
            </h2>
            <p className="text-slate-500">O cliente acompanha cada etapa pelo link. Você atualiza o status em segundos.</p>
          </div>
          <div className="mb-8">
            <StatusStepper />
          </div>
          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { step: '1', titulo: 'Você cria o orçamento', desc: 'Adiciona peças, mão de obra e tempo estimado no BoxCerto. Leva menos de 2 minutos.' },
              { step: '2', titulo: 'Cliente recebe o link', desc: 'Você copia o link e manda pelo WhatsApp. Aparece profissional, detalhado, com total claro.' },
              { step: '3', titulo: 'Aprovação com 1 clique', desc: 'Cliente toca em "Aprovar" e você recebe a notificação na hora. Tudo registrado formalmente.' },
              { step: '4', titulo: 'Status em tempo real', desc: 'Cliente acompanha: Em serviço → Pronto → Aguardando retirada. Sem precisar ligar.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-sm mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{item.titulo}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              O que muda quando você usa orçamento digital
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: ThumbsUp, label: 'Mais aprovações', desc: 'Link profissional gera mais confiança. Taxa de aprovação sobe com orçamento visual e claro.' },
              { icon: Eye,       label: 'Você sabe quando leu', desc: 'Veja se o cliente abriu o orçamento. Saiba o momento certo de fazer o follow-up.' },
              { icon: Shield,    label: 'Aprovação formal', desc: 'Cada aprovação é registrada com data e hora. Nunca mais "eu não autorizei".' },
              { icon: Clock,     label: 'Zero ligação de cobrança', desc: 'Cliente vê que o carro está pronto pelo link. Você não precisa ligar pra avisar.' },
              { icon: FileText,  label: 'Histórico completo', desc: 'Todo orçamento e aprovação ficam no perfil do cliente para sempre.' },
              { icon: Smartphone,label: 'Funciona no celular', desc: 'Você cria, o cliente aprova — tudo pelo celular, sem precisar abrir computador.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-2xl p-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Quem já usa, não volta para o WhatsApp avulso
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 italic mb-4 leading-relaxed">"{d.texto}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">{d.inicial}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{d.nome}</p>
                    <p className="text-xs text-slate-400">{d.oficina}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-gradient-to-b from-indigo-600 to-indigo-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Comece hoje a enviar orçamentos que convertem
            </h2>
            <p className="text-indigo-200 mb-8 text-lg">
              7 dias grátis, sem cartão. Em menos de 10 minutos você já manda seu primeiro orçamento profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors text-base"
              >
                Testar grátis agora
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-indigo-400 text-white font-semibold px-6 py-4 rounded-2xl hover:bg-indigo-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Tirar dúvidas no WhatsApp
              </a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Sem cartão · Cancele quando quiser · Suporte incluso</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-400 font-semibold">BoxCerto</span>
            <span>· © 2025 Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-slate-300">Termos</a>
            <a href="/privacidade" className="hover:text-slate-300">Privacidade</a>
            <a href="/diagnostico" className="hover:text-slate-300">Diagnóstico gratuito</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

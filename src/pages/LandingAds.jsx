import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, ArrowRight, Star, Wrench,
  MessageCircle, Clock, TrendingUp, ShieldCheck,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────
function useScrolled(px = 500) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > px)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [px])
  return scrolled
}

// ─── componentes ────────────────────────────────────────────────────────────
function BenefitRow({ icon, title, desc }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-slate-900 text-sm">{title}</p>
        <p className="text-slate-500 text-sm leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function WppCard({ nome, tipo, msg, hora }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow border border-gray-200 max-w-xs">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128C7E' }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          {nome[0]}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{nome}</p>
          <p className="text-white/70 text-xs">{tipo}</p>
        </div>
      </div>
      <div className="p-4" style={{ background: '#E5DDD5' }}>
        <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm">
          <p className="text-slate-700 text-sm leading-relaxed">{msg}</p>
          <p className="text-slate-400 text-[10px] text-right mt-1">{hora}</p>
        </div>
        <div className="flex gap-0.5 mt-3 justify-end">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
        </div>
      </div>
    </div>
  )
}

// ─── aprovação mockup ────────────────────────────────────────────────────────
function AprovacaoMock() {
  return (
    <div className="space-y-4 max-w-xs mx-auto">
      {/* Mensagem WPP com link */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
          1 · Você envia o link pelo WhatsApp
        </p>
        <div className="rounded-2xl overflow-hidden shadow border border-gray-200">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#128C7E' }}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">O</div>
            <p className="text-white font-semibold text-sm">Oficina BoxCerto</p>
          </div>
          <div className="p-3" style={{ background: '#E5DDD5' }}>
            <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm text-sm text-slate-700 leading-relaxed">
              Olá João! Seu orçamento está pronto. Acesse o link para ver os detalhes e aprovar:
              <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center shrink-0">
                  <Wrench className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-700">Ver orçamento</p>
                  <p className="text-[10px] text-slate-400">boxcerto.com/o/abc123</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-right mt-1">14:30 ✓✓</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seta */}
      <div className="flex justify-center">
        <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90" />
      </div>

      {/* Página no navegador */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 text-center">
          2 · Cliente abre no celular e aprova
        </p>
        <div className="rounded-2xl overflow-hidden shadow border border-gray-200 bg-white">
          {/* Barra URL */}
          <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
            <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" />
            <span className="text-xs text-slate-500 truncate">boxcerto.com/o/abc123</span>
          </div>
          {/* Conteúdo */}
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400">Orçamento para</p>
              <p className="font-bold text-slate-900 text-sm">João Silva · Gol 2018</p>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between"><span>Troca de pastilhas</span><span className="font-semibold">R$ 180</span></div>
              <div className="flex justify-between"><span>Disco dianteiro (2x)</span><span className="font-semibold">R$ 220</span></div>
              <div className="flex justify-between"><span>Mão de obra</span><span className="font-semibold">R$ 120</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-slate-900 text-sm">
                <span>Total</span><span>R$ 520</span>
              </div>
            </div>
            <button className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprovar orçamento
            </button>
          </div>
          {/* Confirmação */}
          <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-semibold">Aprovado · 25/04 às 14:35 — registrado</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── página principal ────────────────────────────────────────────────────────
export default function LandingAds() {
  const navigate   = useNavigate()
  const scrolled   = useScrolled(500)
  const ctaRef     = useRef(null)

  const goRegister = () => navigate('/cadastro')

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV mínimo — só logo + CTA ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">BoxCerto</span>
        </div>
        <button
          onClick={goRegister}
          className="bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Testar grátis
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-indigo-50 to-white px-4 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <Clock className="w-3.5 h-3.5" />
          +347 oficinas já pararam de perder orçamento
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4 max-w-md mx-auto">
          Sua oficina está{' '}
          <span className="text-indigo-600">perdendo dinheiro</span>{' '}
          por causa do WhatsApp
        </h1>

        <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Orçamento mandado no zap, cliente sumiu. Serviço feito sem aprovação, cliente negou.
          O BoxCerto resolve isso em menos de 5 minutos.
        </p>

        <button
          ref={ctaRef}
          onClick={goRegister}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-base"
        >
          Testar 7 dias grátis
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-400 mt-3">Sem cartão · Sem burocracia · Cancele quando quiser</p>
      </section>

      {/* ── PROVA SOCIAL RÁPIDA ── */}
      <section className="border-y border-gray-100 bg-white px-4 py-5">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-lg mx-auto text-center text-sm text-slate-500">
          <span>⭐ 4,9 de avaliação média</span>
          <span>🔒 Dados 100% seus</span>
          <span>📱 Funciona no celular</span>
          <span>⚡ Pronto em 5 min</span>
        </div>
      </section>

      {/* ── DOR + BENEFÍCIOS ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
          Reconhece alguma dessas situações?
        </h2>
        <p className="text-slate-500 text-sm text-center mb-10">
          Se sim, você está deixando dinheiro na mesa todo dia.
        </p>

        <div className="space-y-6">
          <BenefitRow
            icon={<MessageCircle className="w-5 h-5 text-indigo-600" />}
            title='"Mandei o orçamento no WhatsApp e o cliente sumiu"'
            desc="Com o BoxCerto, o cliente recebe um link e aprova ou recusa online — tudo registrado."
          />
          <BenefitRow
            icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
            title='"Fiz o serviço e o cliente disse que não autorizou"'
            desc="A aprovação fica gravada com data, hora e nome do cliente. Sem discussão."
          />
          <BenefitRow
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            title='"Não sei quanto entrou de dinheiro esse mês"'
            desc="Histórico completo de orçamentos, aprovações e receita — tudo num lugar só."
          />
        </div>
      </section>

      {/* ── APROVAÇÃO POR LINK ── */}
      <section className="bg-indigo-50 px-4 py-14">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              DIFERENCIAL EXCLUSIVO
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Aprovação de orçamento por link
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Você envia um link pelo WhatsApp. O cliente abre no celular, vê os serviços e aprova com um toque.
              Tudo registrado automaticamente.
            </p>
          </div>
          <AprovacaoMock />
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">
          O que os mecânicos estão dizendo
        </h2>
        <div className="space-y-5">
          <WppCard
            nome="Carlos Mendes"
            tipo="Auto Mecânica Mendes · SP"
            msg="Cara, agora nenhum cliente consegue negar que aprovou. Mostro a tela e tchau. Isso vale ouro!"
            hora="09:14"
          />
          <WppCard
            nome="Fernanda Rocha"
            tipo="Oficina da Fer · RS"
            msg="Em uma semana já recuperei o valor da assinatura inteira. Os clientes aprovam muito mais rápido pelo link."
            hora="16:32"
          />
          <WppCard
            nome="Marcos Oliveira"
            tipo="Auto Elétrica Oliveira · MG"
            msg="Finalmente sei quanto entrou de dinheiro no mês. Antes ficava no escuro, agora é tudo na tela."
            hora="11:05"
          />
        </div>
      </section>

      {/* ── OFERTA / PREÇO ── */}
      <section className="bg-slate-900 px-4 py-14 text-center">
        <div className="max-w-sm mx-auto">
          <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            OFERTA DE LANÇAMENTO
          </span>
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Comece agora por R$0
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            7 dias para testar tudo, sem cartão de crédito. Depois, apenas{' '}
            <strong className="text-white">R$34,90/mês</strong> (plano anual) ou R$47,90/mês.
          </p>

          {/* Checklist */}
          <div className="text-left space-y-3 mb-8">
            {[
              'Orçamentos ilimitados',
              'Aprovação por link (diferencial único)',
              'Histórico completo de veículos',
              'Controle financeiro',
              'Gestão de estoque',
              'Suporte via WhatsApp',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={goRegister}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-lg text-base mb-3"
          >
            Quero testar 7 dias grátis ⭐
          </button>
          <p className="text-xs text-slate-500">Sem cartão · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── GARANTIA / SEGURANÇA ── */}
      <section className="bg-white px-4 py-10 text-center border-b border-gray-100">
        <div className="max-w-sm mx-auto">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Risco zero para você</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Se em 7 dias você não ver valor, é só não assinar. Sem multa, sem cobrança, sem enrolação. Seus dados ficam disponíveis para download.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-14 text-center bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Pronto para parar de perder orçamento?
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Leva menos de 5 minutos para configurar. Já no primeiro orçamento você sente a diferença.
          </p>
          <button
            onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-base"
          >
            Criar minha conta grátis
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400 mt-3">Sem cartão · 7 dias grátis · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── RODAPÉ MÍNIMO ── */}
      <footer className="border-t border-gray-100 px-4 py-6 text-center text-xs text-slate-400 space-y-1">
        <p>© {new Date().getFullYear()} BoxCerto Tecnologia Ltda. · CNPJ 52.354.481/0001-37</p>
        <p>
          <a href="/termos" target="_blank" className="hover:underline">Termos de Uso</a>
          {' · '}
          <a href="/privacidade" target="_blank" className="hover:underline">Privacidade</a>
          {' · '}
          <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="hover:underline">
            Suporte via WhatsApp
          </a>
        </p>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      {scrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-200 shadow-2xl md:hidden">
          <button
            onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-base"
          >
            Testar 7 dias grátis
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

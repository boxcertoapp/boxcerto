/**
 * /lp2 — Landing Page Tráfego Pago (Ângulo: PROVA SOCIAL + FOMO)
 * Tráfego QUENTE — Retargeting
 * Pressupõe que o visitante já conhece o produto — sem explicar o problema.
 * Urgência: FOMO competitivo real (não countdown falso).
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import {
  CheckCircle, ArrowRight, Star, Wrench, ShieldCheck,
  TrendingUp, Users, X, Award, Zap, DollarSign,
} from 'lucide-react'

// ─── hook scroll ──────────────────────────────────────────────────────────────
function useScrolled(px = 400) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const fn = () => setV(window.scrollY > px)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [px])
  return v
}

// ─── cores dos avatares ───────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#1565C0','#0D47A1'],
  ['#E65100','#BF360C'],
  ['#6A1B9A','#4A148C'],
  ['#00695C','#004D40'],
  ['#B71C1C','#7F0000'],
  ['#1B5E20','#003300'],
]

// ─── print de WhatsApp (realista, frame de celular) ───────────────────────────
function WppPrint({ nome, tipo, cidade, msg, hora, resultado, avatarIdx = 0 }) {
  const [c1, c2] = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length]
  const inicial = nome[0]

  return (
    <div className="max-w-xs mx-auto">
      <div className="bg-slate-800 rounded-[28px] p-2 shadow-2xl border-4 border-slate-700">
        {/* status bar */}
        <div className="bg-slate-900 rounded-t-2xl px-4 py-1.5 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-[2px] items-end h-3">
              {[3,4,5,6].map((h,i) => (
                <div key={i} style={{ height: h * 2, width: 2 }} className="bg-white rounded-sm opacity-80" />
              ))}
            </div>
            <svg width="12" height="10" viewBox="0 0 12 10">
              <rect x="0" y="1" width="10" height="8" rx="1.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <rect x="1" y="2" width="7" height="6" rx="0.8" fill="white"/>
              <rect x="10.5" y="3.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
            </svg>
          </div>
        </div>

        {/* header WPP */}
        <div className="px-3 py-2.5 flex items-center gap-3" style={{ background: '#075E54' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[13px] leading-tight truncate">{nome}</p>
            <p className="text-white/60 text-[10px]">{tipo} · {cidade}</p>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          </div>
        </div>

        {/* chat */}
        <div className="p-3" style={{ background: '#ECE5DD' }}>
          <div className="text-center mb-2">
            <span className="bg-black/20 text-white text-[9px] px-2 py-0.5 rounded-full">HOJE</span>
          </div>
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0 mb-1"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              {inicial}
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2.5 shadow-sm max-w-[200px]">
              <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-line">{msg}</p>
              <p className="text-slate-400 text-[9px] text-right mt-1.5">{hora}</p>
            </div>
          </div>
          {resultado && (
            <div className="ml-7 mt-2 bg-emerald-100 border border-emerald-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
              <p className="text-emerald-700 text-[10px] font-bold leading-tight">{resultado}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── card de métrica ──────────────────────────────────────────────────────────
function MetricCard({ valor, label, sub }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-indigo-600">{valor}</p>
      <p className="text-xs font-bold text-slate-900 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── timeline comparativa ─────────────────────────────────────────────────────
const LINHA = [
  ['Digita orçamento no WhatsApp',                'Monta orçamento no BoxCerto em 2 min'],
  ['Espera cliente responder (às vezes dias)',     'Envia link pelo WhatsApp em 1 toque'],
  ['Liga pra confirmar, ninguém atende',           'Cliente aprova em minutos, no celular'],
  ['Faz o serviço sem confirmação escrita',        'Aprovação registrada com data e hora'],
  ['Cliente nega que autorizou → prejuízo',        'Mostra a tela, acabou a discussão'],
  ['No fim do mês, sem saber o lucro real',        'Relatório de receita em tempo real'],
]

function Timeline() {
  return (
    <div className="max-w-sm mx-auto space-y-2">
      {LINHA.map(([a, d], i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 flex items-start gap-1.5">
            <X className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{a}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">{d}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── objeção accordion ────────────────────────────────────────────────────────
function Objecao({ p, r }) {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-all">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-slate-900 text-sm">{p}</p>
        <span className={`text-indigo-500 font-bold text-xl transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      {open && <p className="text-slate-500 text-sm leading-relaxed mt-3 pt-3 border-t border-gray-100">{r}</p>}
    </button>
  )
}

// ─── página ───────────────────────────────────────────────────────────────────
export default function LandingAds2() {
  const navigate   = useNavigate()
  const scrolled   = useScrolled()
  const goRegister = useCallback(() => navigate('/cadastro'), [navigate])

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <Logo size="md" priority />
        <button onClick={goRegister}
          className="bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-400 transition-colors">
          Entrar grátis
        </button>
      </nav>

      {/* HERO — FOMO COMPETITIVO */}
      <section className="px-4 pt-10 pb-12 text-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <Users className="w-3.5 h-3.5" />
          +347 oficinas já deixaram o caos para trás
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4 max-w-xs mx-auto">
          Enquanto você pensa,{' '}
          <span className="text-indigo-600">outro mecânico da sua cidade</span>{' '}
          está aprovando orçamento pelo link
        </h1>

        <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-xs mx-auto">
          Eles pararam de perder orçamento, de levar calote e de trabalhar sem saber se estão lucrando.
          <strong className="text-slate-700"> Agora é a sua vez.</strong>
        </p>

        {/* depoimento rápido no hero */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 max-w-xs mx-auto shadow-sm mb-6 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex -space-x-2">
              {['J','R','A','L','C','T'].map((l,i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: AVATAR_COLORS[i][0] }}>{l}</div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed italic">
            "Recuperei o valor da assinatura no primeiro orçamento aprovado pelo link. Não tinha como voltar atrás."
          </p>
          <p className="text-slate-400 text-xs mt-1.5">— Ricardo M., São Paulo/SP · Auto Elétrica</p>
        </div>

        <button onClick={goRegister}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl shadow-emerald-100 text-base">
          Quero entrar agora — grátis <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-400 mt-2">7 dias grátis · Sem cartão · Pronto em 2 min</p>
      </section>

      {/* MÉTRICAS */}
      <section className="bg-slate-900 px-4 py-10">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-5">
          Números das oficinas que usam
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <MetricCard valor="+347" label="Oficinas ativas" sub="em todo o Brasil" />
          <MetricCard valor="4,9★" label="Avaliação média" sub="dos usuários" />
          <MetricCard valor="68%" label="Mais aprovações" sub="no primeiro mês" />
          <MetricCard valor="2 min" label="Para configurar" sub="e mandar o 1º link" />
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">Resultados reais</h2>
        </div>
        <p className="text-slate-500 text-sm text-center mb-10">
          Prints do WhatsApp de quem entrou em contato com a gente.
        </p>
        <div className="space-y-8">
          <WppPrint
            avatarIdx={0}
            nome="João Batista R."
            tipo="Mecânica"
            cidade="Curitiba/PR"
            msg={"cara o cliente chegou ontem falando que não tinha autorizado a troca de embreagem\n\neu abri o sistema, mostrei pra ele: nome dele, 14h23 de sábado, aprovado. ele ficou sem palavras kkkk pagou na hora"}
            hora="09:14"
            resultado="Cobrança de R$ 780 que seria perdida"
          />
          <WppPrint
            avatarIdx={2}
            nome="Ana Cristina P."
            tipo="Centro Automotivo"
            cidade="Goiânia/GO"
            msg={"meu marido achava que eu ia precisar de secretária pra dar conta da oficina\n\ndesde março não preciso de ninguém pra controlar aprovação de cliente, tá tudo automático pelo link"}
            hora="14:22"
            resultado="Sem secretária, sem perda de aprovação"
          />
          <WppPrint
            avatarIdx={3}
            nome="Leandro M."
            tipo="Estofaria Automotiva"
            cidade="Porto Alegre/RS"
            msg={"quem trabalha com estofamento sabe: cliente sempre quer negar o que aprovou depois. meu serviço leva 3 dias, quando entrego o cara tenta mudar o preço\n\nagora tenho tudo registrado, acabou a discussão"}
            hora="11:08"
            resultado="Zerou disputas sobre serviços aprovados"
          />
          <WppPrint
            avatarIdx={4}
            nome="Claudinho A."
            tipo="Mecânica de Motos"
            cidade="Belo Horizonte/MG"
            msg={"achei que era só pra carro mas funciona igual pra moto\n\nsemana passada um cliente aprovou às 23h enquanto eu dormia kkk cheguei de manhã, já tava aprovado, é outra vida"}
            hora="08:55"
            resultado="Aprovações mesmo fora do horário comercial"
          />
        </div>
      </section>

      {/* TRANSFORMAÇÃO */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            Como fica o dia a dia
          </h2>
          <p className="text-slate-500 text-sm text-center mb-8">
            Cada linha é uma situação que acontece toda semana na sua oficina.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-100 text-red-600 text-xs font-bold text-center py-2 rounded-xl">Sem BoxCerto</div>
            <div className="bg-emerald-100 text-emerald-700 text-xs font-bold text-center py-2 rounded-xl">Com BoxCerto</div>
          </div>
          <Timeline />
        </div>
      </section>

      {/* CTA INTERMEDIÁRIO */}
      <section className="px-4 py-10 bg-indigo-600 text-center">
        <div className="max-w-sm mx-auto">
          <Zap className="w-8 h-8 text-white mx-auto mb-3" />
          <h3 className="text-xl font-extrabold text-white mb-2">Você já sabia que precisava disso.</h3>
          <p className="text-indigo-200 text-sm mb-5">
            7 dias grátis, sem cartão. O pior que pode acontecer é você voltar para o jeito antigo.
          </p>
          <button onClick={goRegister}
            className="w-full bg-white text-indigo-600 font-extrabold py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg text-base">
            Começar meu teste grátis agora
          </button>
          <p className="text-indigo-300 text-xs mt-2">Menos de 2 minutos para configurar</p>
        </div>
      </section>

      {/* OBJEÇÕES */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">O que ainda te impede?</h2>
        <p className="text-slate-500 text-sm text-center mb-8">Respostas diretas para as dúvidas mais comuns.</p>
        <div className="space-y-3">
          <Objecao
            p='"Não tenho tempo para aprender um sistema novo."'
            r="2 minutos. Sério. Você cadastra a oficina, monta o orçamento e manda o link. Sem treinamento, sem manual, sem configuração complicada. Se você usa WhatsApp, você usa o BoxCerto."
          />
          <Objecao
            p='"E se eu não gostar depois dos 7 dias?"'
            r="Você simplesmente não assina. Sem cobrança automática, sem multa, sem ligação de vendedor pedindo explicação. Seus dados ficam disponíveis para exportar por mais 30 dias."
          />
          <Objecao
            p='"Meus dados ficam seguros?"'
            r="Sim. Usamos infraestrutura com criptografia e autenticação segura. Seus dados de clientes pertencem a você — não vendemos e não compartilhamos com ninguém. CNPJ 52.354.481/0001-37."
          />
          <Objecao
            p='"R$ 97 por mês cabe no orçamento de oficina pequena?"'
            r="Se você fechar um orçamento a mais por mês por causa do sistema, você pagou mais de uma assinatura inteira. A maioria das oficinas recupera o valor na primeira semana. No anual fica R$ 79,90/mês — menos de R$ 3 por dia."
          />
          <Objecao
            p='"Funciona para minha tipo de oficina?"'
            r="Funciona para mecânica geral, auto elétrica, funilaria, estofaria, mecânica de motos, centro automotivo e qualquer negócio automotivo que emite orçamento e precisa de aprovação do cliente."
          />
        </div>
      </section>

      {/* OFERTA FINAL */}
      <section className="bg-slate-900 px-4 py-14">
        <div className="max-w-sm mx-auto text-center">
          <span className="inline-block bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-4 tracking-wide">
            OFERTA DE LANÇAMENTO
          </span>
          <h2 className="text-2xl font-extrabold text-white mb-1">Comece hoje por R$ 0</h2>
          <p className="text-slate-400 text-sm mb-6">
            7 dias grátis, sem cartão. Depois só <strong className="text-white">R$ 79,90/mês</strong> no plano anual.
          </p>
          <div className="text-left space-y-3 mb-8 bg-white/5 rounded-2xl p-5">
            {[
              'Orçamentos ilimitados',
              'Aprovação por link (exclusivo BoxCerto)',
              'Histórico digital de clientes e veículos',
              'Controle financeiro em tempo real',
              'Gestão de estoque',
              'Suporte humano via WhatsApp',
              'Cancele quando quiser, sem multa',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={goRegister}
            className="w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-2xl shadow-emerald-900 text-base mb-3">
            Entrar agora — é grátis ⭐
          </button>
          <p className="text-slate-500 text-xs">Sem cartão no trial · Cancele quando quiser</p>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="px-4 py-12 bg-white border-b border-gray-100 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Nossa promessa</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Se em 7 dias você não conseguir mandar um orçamento por link, aprovado pelo cliente, com tudo registrado — é só sair.
            Sem cobrança. Sem multa. Sem pergunta. A palavra do BoxCerto.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-14 bg-gradient-to-b from-white to-indigo-50 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Você vai continuar perdendo orçamento amanhã também?
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            +347 oficinas já disseram não para o caos. São 2 minutos para você se juntar a elas.
          </p>
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl shadow-emerald-100 text-base mb-3">
            Entrar agora — é grátis <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400">Sem cartão · 7 dias grátis · Cancele quando quiser</p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-gray-100 px-4 py-6 text-center text-xs text-slate-400 space-y-1">
        <p>© {new Date().getFullYear()} BoxCerto Tecnologia Ltda. · CNPJ 52.354.481/0001-37</p>
        <p>
          <a href="/termos" target="_blank" rel="noreferrer" className="hover:underline">Termos de Uso</a>
          {' · '}
          <a href="/privacidade" target="_blank" rel="noreferrer" className="hover:underline">Privacidade</a>
          {' · '}
          <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="hover:underline">Suporte WhatsApp</a>
        </p>
      </footer>

      {/* STICKY MOBILE */}
      {scrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-900 border-t border-slate-700 shadow-2xl md:hidden">
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base">
            Entrar agora — é grátis <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-[11px] text-center mt-1">7 dias sem cartão · Cancele quando quiser</p>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wrench, CheckCircle, ChevronDown, ChevronUp,
  MessageCircle, TrendingUp, Clock, Search,
  Star, ArrowRight, Zap, Shield, X,
  FileText, Users, Package, Monitor
} from 'lucide-react'

const WPP_SUPORTE = 'https://wa.me/5553999999999?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20o%20BoxCerto!'

export default function Landing() {
  const navigate = useNavigate()
  const [faqOpen, setFaqOpen] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goRegister = () => navigate('/cadastro')

  const faqs = [
    { q: 'Preciso instalar algum programa?', a: 'Não. O BoxCerto funciona direto no navegador — no celular, no tablet ou no computador. Só entrar e usar. Sem instalação, sem complicação.' },
    { q: 'Funciona no computador e no tablet também?', a: 'Sim, funciona em qualquer dispositivo com navegador. Abra no celular na oficina, no tablet no balcão ou no computador no escritório — tudo sincronizado, tudo no mesmo lugar.' },
    { q: 'Funciona para quem trabalha sozinho?', a: 'Foi feito exatamente para isso. Um mecânico solo consegue usar sem treinamento nenhum. Se você sabe usar o WhatsApp, sabe usar o BoxCerto.' },
    { q: 'Meus dados ficam seguros?', a: 'Sim. Todos os dados ficam em servidores seguros. Nenhuma informação sua ou dos seus clientes é compartilhada com ninguém.' },
    { q: 'Posso cancelar quando quiser?', a: 'No plano mensal, sim — cancela a qualquer momento sem multa. No anual, você trava o menor preço pelo ano todo.' },
    { q: 'O que acontece depois dos 7 dias grátis?', a: 'Você escolhe um plano e continua usando. Se não quiser assinar, pode sair sem custo algum. Não pedimos cartão para começar.' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>BoxCerto</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className={`text-sm font-medium px-3 py-2 transition-colors ${scrolled ? 'text-slate-500 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>Entrar</button>
            <button onClick={goRegister} className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm">Testar grátis</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative bg-slate-900 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-0 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            7 dias grátis &middot; Sem cartão de crédito
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
            Chega de caderno.<br />
            <span className="text-indigo-400">Sua oficina no controle.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Controle carros, clientes, orçamentos e lucro em um só lugar.
            Funciona no celular, no tablet e no computador — simples o suficiente para usar no primeiro dia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={goRegister} className="w-full sm:w-auto bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 group">
              Testar grátis por 7 dias — sem cartão
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto text-slate-400 hover:text-white text-base font-medium px-6 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all">
              Já tenho conta
            </button>
          </div>

          {/* Mockup */}
          <div className="max-w-xs mx-auto relative">
            <div className="absolute -inset-4 bg-indigo-600/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border border-slate-700">
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden">
                <div className="bg-white h-6 flex items-center justify-center">
                  <div className="w-20 h-3 bg-gray-200 rounded-full" />
                </div>
                {/* Header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center"><Wrench className="w-3 h-3 text-white" /></div>
                    <span className="text-xs font-bold text-slate-900">BoxCerto</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Oficina do José</span>
                </div>
                {/* Dashboard cards */}
                <div className="bg-gray-50 px-3 py-2 grid grid-cols-3 gap-1.5">
                  <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                    <p className="text-[14px] font-bold text-amber-600">3</p>
                    <p className="text-[8px] text-amber-500 font-medium">Orçamentos</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                    <p className="text-[14px] font-bold text-blue-600">5</p>
                    <p className="text-[8px] text-blue-500 font-medium">Manutenção</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2 text-center border border-green-100">
                    <p className="text-[14px] font-bold text-green-600">2</p>
                    <p className="text-[8px] text-green-500 font-medium">Prontos</p>
                  </div>
                </div>
                {/* OS cards */}
                <div className="p-2 space-y-2 bg-gray-50">
                  {[
                    { placa: 'RST-2F45', modelo: 'Ford Ranger',  cliente: 'Carlos M.',  status: 'Pronto',    sc: 'bg-green-100 text-green-700' },
                    { placa: 'ABC-1D23', modelo: 'Fiat Strada',  cliente: 'Ana Paula',  status: 'Manutenção', sc: 'bg-blue-100 text-blue-700' },
                    { placa: 'XYZ-8G90', modelo: 'VW Gol',       cliente: 'Roberto S.', status: 'Orçamento',  sc: 'bg-amber-100 text-amber-700' },
                  ].map((c, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-gray-100">
                      <div className="bg-slate-800 px-1.5 py-1 rounded-md min-w-[52px] text-center">
                        <span className="text-white text-[9px] font-bold tracking-wider">{c.placa}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{c.modelo}</p>
                        <p className="text-[9px] text-slate-400 truncate">{c.cliente}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.sc}`}>{c.status}</span>
                        <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-3 h-3 text-green-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Tab bar — 5 abas */}
                <div className="bg-white border-t border-gray-100 flex justify-around py-2">
                  {[
                    { icon: Wrench,     label: 'Oficina',    a: true  },
                    { icon: Clock,      label: 'Histórico',  a: false },
                    { icon: TrendingUp, label: 'Financeiro', a: false },
                    { icon: Package,    label: 'Estoque',    a: false },
                    { icon: Users,      label: 'Menu',       a: false },
                  ].map((t, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${t.a ? 'text-indigo-600' : 'text-gray-300'}`}>
                      <t.icon className="w-3 h-3" />
                      <span className="text-[7px] font-medium">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-8">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 70 800 0 0 60L0 80Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-3 gap-6 text-center">
          {[
            { num: '2 min',   desc: 'para aprender a usar' },
            { num: '7 dias',  desc: 'grátis, sem cartão' },
            { num: 'Web',     desc: 'celular, tablet ou computador' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-bold text-indigo-600 mb-1">{s.num}</p>
              <p className="text-slate-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DORES */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">A realidade de quem não usa</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Reconhece alguma dessas situações?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { e: '📋', d: '"Onde foi que eu anotei o telefone desse cliente?"', t: 'Papéis perdidos, cadernos rasurados, post-it que some. Você perde tempo toda semana procurando informação que deveria estar na ponta dos dedos.' },
              { e: '📞', d: '"Meu carro tá pronto?" — 3 vezes por dia.', t: 'Cliente ligando, você parando o serviço pra atender, explicando tudo de novo. Com o BoxCerto, você manda um WhatsApp em 1 toque — de qualquer dispositivo.' },
              { e: '💸', d: 'Trabalhou o mês todo e não sabe quanto lucrou.', t: 'Recebeu dinheiro, pagou peça, pagou conta — mas no final do mês, sobrou quanto? Sem controle, você pode estar trabalhando de graça.' },
              { e: '🔧', d: '"Esse carro já veio aqui antes?" Não lembro.', t: 'Cliente volta com o carro e você não tem o histórico. Não sabe o que foi feito, quanto cobrou, quais peças usou. Cada atendimento começa do zero.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition-all group">
                <span className="text-3xl shrink-0">{item.e}</span>
                <div>
                  <p className="font-bold text-slate-900 mb-1 group-hover:text-red-700 transition-colors">"{item.d}"</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.t}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-slate-400 text-sm mb-4">Se você se identificou com qualquer um desses, o BoxCerto é para você.</p>
            <button onClick={goRegister} className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2">
              Quero resolver isso agora <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sua oficina organizada em 5 telas</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Sem menus complicados. Sem treinamento. Tudo que você precisa em 5 abas — no celular, no tablet ou no computador.</p>
          </div>

          {/* Badge multi-device */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm px-5 py-2.5 rounded-full">
              <Monitor className="w-4 h-4 text-indigo-400" />
              Funciona em qualquer dispositivo com navegador — sem instalar nada
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Wrench className="w-6 h-6 text-white" />, bg: 'bg-indigo-600', n: '1', title: 'Oficina — Visão em tempo real', desc: 'Dashboard com todos os carros na sua frente. Placa, modelo, cliente e status em um card. Um toque pra mandar mensagem no WhatsApp com o status atualizado.', items: ['Dashboard com resumo do dia', 'Agendamento e KM do veículo', 'WhatsApp automático com 1 toque'] },
              { icon: <Search className="w-6 h-6 text-white" />, bg: 'bg-violet-600', n: '2', title: 'Histórico — Memória eterna', desc: 'Busque qualquer cliente ou placa e veja tudo que já foi feito. Nunca mais perca o histórico de um cliente, mesmo que ele volte anos depois.', items: ['Busca por placa, nome ou CPF', 'Linha do tempo de todas as OS', 'Lista completa de clientes e veículos'] },
              { icon: <TrendingUp className="w-6 h-6 text-white" />, bg: 'bg-emerald-600', n: '3', title: 'Financeiro — Lucro real', desc: 'Veja quanto entrou, quanto custou e quanto você realmente lucrou. Custo de peça fica invisível para o cliente — só você vê.', items: ['Lucro líquido do mês em destaque', 'Custo de peça separado do valor cobrado', 'Controle de despesas fixas'] },
              { icon: <FileText className="w-6 h-6 text-white" />, bg: 'bg-amber-500', n: '4', title: 'Orçamento — Profissional', desc: 'Monte o orçamento item por item com desconto, garantia por peça e recibo de pagamento. O app calcula o lucro previsto automaticamente.', items: ['Desconto em % ou R$ na entrega', 'Garantia por item de serviço', 'Recibo de pagamento em PDF'] },
              { icon: <Package className="w-6 h-6 text-white" />, bg: 'bg-rose-500', n: '5', title: 'Estoque — Sem surpresa', desc: 'Cadastre suas peças e o app desconta automaticamente ao abrir uma OS. Alerta de estoque baixo e relatório imprimível em um toque.', items: ['Baixa automática ao usar no orçamento', 'Alerta de estoque baixo configurável', 'Relatório de estoque para imprimir'] },
            ].map((f, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-500 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>{f.icon}</div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Módulo {f.n}</p>
                    <p className="text-white font-bold text-sm leading-tight">{f.title}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{f.desc}</p>
                <ul className="space-y-2">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Quem usa, não volta ao papel.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { nome: 'Carlos Mendonça', cidade: 'Porto Alegre, RS', cargo: 'Mecânica Mendonça', texto: 'Em 2 semanas de uso já recuperei clientes que eu nem lembrava mais. O histórico salvou minha vida numa discussão sobre garantia — tava tudo registrado.' },
              { nome: 'Adriana Freitas', cidade: 'Curitiba, PR', cargo: 'Auto Elétrica AF', texto: 'Trabalho sozinha. Antes eu gastava 1 hora por dia só respondendo "meu carro tá pronto?". Agora mando um WhatsApp em 5 segundos e volto pro serviço.' },
              { nome: 'Marcos Teixeira', cidade: 'São Paulo, SP', cargo: 'Oficina Teixeira', texto: 'Descobri que tava lucrando 30% a menos do que achava porque não separava custo de peça direito. O financeiro do app abriu meu olho.' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-700 leading-relaxed mb-5 flex-1 italic">"{t.texto}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-bold">{t.nome[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.nome}</p>
                    <p className="text-slate-400 text-xs">{t.cargo} &middot; {t.cidade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">R$1,60 por dia. Menos que um café.</h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-3">Comece grátis por 7 dias. Sem cartão. Sem compromisso.</p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto italic">Recupere 1 cliente perdido por mês e já se paga — o resto é lucro.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Mensal */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Plano Mensal</h3>
              <p className="text-slate-400 text-sm mb-6">Flexibilidade total, cancele quando quiser</p>
              <div className="flex items-end gap-1 mb-8">
                <span className="text-5xl font-bold text-slate-900">R$47,90</span>
                <span className="text-slate-400 mb-1.5">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'OS ilimitadas',
                  'Clientes e veículos ilimitados',
                  'WhatsApp automático',
                  'Histórico completo',
                  'Controle financeiro',
                  'Acesso em qualquer dispositivo',
                  'Suporte via WhatsApp',
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-slate-600 text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={goRegister} className="w-full border-2 border-indigo-600 text-indigo-600 font-bold py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors">
                Testar 7 dias grátis
              </button>
            </div>

            {/* Anual */}
            <div className="bg-indigo-600 rounded-3xl p-8 relative flex flex-col shadow-xl shadow-indigo-200">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                MAIS RECOMENDADO &mdash; ECONOMIZE R$156/ANO
              </div>
              <h3 className="text-lg font-bold text-white mb-1 mt-2">Plano Anual</h3>
              <p className="text-indigo-200 text-sm mb-6">Pague uma vez, use o ano todo</p>
              <div className="mb-2">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-white">R$34,90</span>
                  <span className="text-indigo-200 mb-1.5">/mês</span>
                </div>
                <p className="text-indigo-300 text-sm mt-1 mb-6">Cobrado R$418,80 uma vez por ano</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tudo do plano mensal',
                  'Acesso em qualquer dispositivo',
                  'Prioridade no suporte',
                  'Acesso antecipado a novidades',
                  'Menor preço garantido',
                  '7 dias grátis para testar',
                  'Garantia de reembolso',
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-200 shrink-0" />
                    <span className="text-white text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={goRegister} className="w-full bg-white text-indigo-600 font-bold py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors">
                Testar 7 dias grátis &mdash; melhor oferta
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-400">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Pagamento seguro</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 7 dias grátis, sem cartão</div>
            <div className="flex items-center gap-2"><X className="w-4 h-4" /> Cancele quando quiser</div>
          </div>

          {/* WhatsApp suporte */}
          <div className="text-center mt-8">
            <p className="text-slate-400 text-sm mb-2">Ficou com alguma dúvida antes de começar?</p>
            <a
              href={WPP_SUPORTE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Fale com a gente no WhatsApp agora
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Perguntas frequentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                  {faqOpen === i ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>
                {faqOpen === i && <div className="px-5 pb-5 text-slate-500 leading-relaxed text-sm">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Sua oficina merece<br />funcionar do jeito certo.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
            Não precisa de cartão. Não precisa de treinamento. Só entrar e usar — do computador, do tablet ou do celular. 7 dias completamente grátis.
          </p>
          <button onClick={goRegister} className="bg-white text-indigo-600 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-indigo-50 transition-all inline-flex items-center gap-3 shadow-xl group">
            Testar grátis por 7 dias — sem cartão
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-indigo-300 text-sm mt-5">Sem cartão de crédito &middot; Cancele quando quiser &middot; Suporte por WhatsApp</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">BoxCerto</span>
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href={WPP_SUPORTE} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Suporte WhatsApp
            </a>
            <a href="mailto:contato@boxcerto.com" className="hover:text-white transition-colors">Contato</a>
          </div>
          <p className="text-slate-500 text-sm">&copy; 2025 BoxCerto</p>
        </div>
      </footer>
    </div>
  )
}

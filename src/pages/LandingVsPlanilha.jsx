import { useState } from 'react'
import {
  CheckCircle, XCircle, Minus, ArrowRight, Zap, Star, MessageCircle,
  Shield, TrendingUp, AlertTriangle, Calculator
} from 'lucide-react'
import { usePageMeta } from '../hooks/usePageMeta'
import { useConfig } from '../hooks/useConfig'

const CADASTRO = 'https://www.boxcerto.com/cadastro'
const WPP_NUM  = '5553997065725'
const WPP_MSG  = encodeURIComponent('Olá! Vi a comparação com planilha e quero saber mais sobre o BoxCerto.')

// ── Tabela comparativa ────────────────────────────────────────
const LINHAS = [
  { feature: 'Ordens de serviço ilimitadas',      caderno: 'sim',  planilha: 'sim',  boxcerto: 'sim'  },
  { feature: 'Aprovação de orçamento por link',   caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
  { feature: 'Rastreio de status em tempo real',  caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
  { feature: 'Notificação automática ao cliente', caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
  { feature: 'Histórico completo de clientes',    caderno: 'nao',  planilha: 'parcial', boxcerto: 'sim' },
  { feature: 'Controle financeiro com lucro real',caderno: 'nao',  planilha: 'parcial', boxcerto: 'sim' },
  { feature: 'Controle de estoque com alertas',   caderno: 'nao',  planilha: 'parcial', boxcerto: 'sim' },
  { feature: 'Impressão de OS e recibo',          caderno: 'nao',  planilha: 'trabalhoso', boxcerto: 'sim' },
  { feature: 'Backup automático na nuvem',        caderno: 'nao',  planilha: 'risco', boxcerto: 'sim'  },
  { feature: 'Funciona no celular',               caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
  { feature: 'Modo técnico para funcionários',    caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
  { feature: 'Suporte humano incluído',           caderno: 'nao',  planilha: 'nao',  boxcerto: 'sim'  },
]

function CelulaStatus({ valor }) {
  if (valor === 'sim')
    return <div className="flex justify-center"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
  if (valor === 'nao')
    return <div className="flex justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
  // parcial / trabalhoso / risco
  const labels = { parcial: 'Parcial', trabalhoso: 'Trabalhoso', risco: 'Risco de perda' }
  return (
    <div className="flex justify-center">
      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{labels[valor] || valor}</span>
    </div>
  )
}

// ── Calculadora de perda ──────────────────────────────────────
function Calculadora() {
  const [osM, setOsM]   = useState(30)
  const [perdaPct, setPerdaPct] = useState(10)
  const [ticketM, setTicketM]   = useState(350)

  const perdaOs    = Math.round(osM * perdaPct / 100)
  const perdaMes   = perdaOs * ticketM
  const ganhoLiq   = perdaMes - 97

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-indigo-600" />
        <h3 className="font-extrabold text-slate-800">Calcule o quanto você está perdendo</h3>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>OS por mês</span>
            <span className="font-bold text-slate-800">{osM}</span>
          </div>
          <input type="range" min={5} max={100} value={osM} onChange={e => setOsM(+e.target.value)}
            className="w-full accent-indigo-600" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>% de orçamentos sem aprovação</span>
            <span className="font-bold text-slate-800">{perdaPct}%</span>
          </div>
          <input type="range" min={5} max={50} value={perdaPct} onChange={e => setPerdaPct(+e.target.value)}
            className="w-full accent-indigo-600" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>Ticket médio por OS (R$)</span>
            <span className="font-bold text-slate-800">R${ticketM}</span>
          </div>
          <input type="range" min={100} max={2000} step={50} value={ticketM} onChange={e => setTicketM(+e.target.value)}
            className="w-full accent-indigo-600" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-slate-500">OS perdidas por mês</span>
          <span className="text-sm font-bold text-slate-700">~{perdaOs} ordens</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-slate-500">Receita perdida/mês</span>
          <span className="text-sm font-bold text-rose-600">- R${perdaMes.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-slate-500">Custo do BoxCerto/mês</span>
          <span className="text-sm font-bold text-slate-700">R${cfg_pm % 1 === 0 ? cfg_pm.toFixed(0) : cfg_pm.toFixed(2).replace('.',',')}</span>
        </div>
        <div className={`flex justify-between items-center py-3 px-3 rounded-xl mt-1 ${ganhoLiq > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <span className="text-sm font-bold text-slate-700">Ganho líquido estimado</span>
          <span className={`text-lg font-extrabold ${ganhoLiq > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            + R${Math.max(0, ganhoLiq).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Depoimentos ───────────────────────────────────────────────
const DEPOIMENTOS = [
  {
    nome: 'Tiago B.',
    oficina: 'TBM Mecânica · Porto Alegre, RS',
    texto: 'Passei 6 anos em planilha. Achava que funcionava. Quando migrei pro BoxCerto, descobri que estava perdendo 5 orçamentos por semana. Em 30 dias recuperei 3× o valor da assinatura.',
    inicial: 'T',
  },
  {
    nome: 'Cláudia M.',
    oficina: 'Auto Express CM · Caxias do Sul, RS',
    texto: 'Meu marido insistia em planilha. Mostrei a calculadora do site e ele viu que estávamos perdendo R$1.400/mês em orçamentos não aprovados. No mesmo dia assinou o plano.',
    inicial: 'C',
  },
  {
    nome: 'Renato S.',
    oficina: 'RS Revisões · Pelotas, RS',
    texto: 'O que me convenceu foi o backup. Perdi uma planilha em 2022 quando o notebook queimou. Com BoxCerto, tudo está na nuvem. Nunca mais perdi um dado.',
    inicial: 'R',
  },
  {
    nome: 'Fernanda O.',
    oficina: 'FO Auto Center · Canoas, RS',
    texto: 'Planilha não avisa quando peça vai acabar. Perdi um serviço porque faltou amortecedor que eu achava que tinha. Com BoxCerto, recebo alerta antes de acabar.',
    inicial: 'F',
  },
]

export default function LandingVsPlanilha() {
  usePageMeta({
    title: 'BoxCerto vs Planilha | Por que sua Oficina Perde Dinheiro Controlando no Excel',
    description: 'Veja por que controlar oficina por planilha faz você perder orçamento, histórico e lucro. Calculadora de perda + comparativo completo. Migre grátis por 7 dias.',
    canonical: 'https://boxcerto.com/boxcerto-vs-planilha',
  })
  const cfg = useConfig()
  const cfg_pm = parseFloat(cfg.price_monthly) || 97

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
          <a href={CADASTRO}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-rose-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <AlertTriangle className="w-3.5 h-3.5" />
              A planilha está te custando dinheiro todo mês
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
              BoxCerto vs. Planilha:<br />
              <span className="text-indigo-600">a comparação que vai te convencer</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Planilha organiza. BoxCerto converte. Veja o que você está deixando na mesa enquanto gerencia sua oficina com Excel ou Google Sheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-indigo-200">
                Testar grátis por 7 dias
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="/diagnostico"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-slate-700 font-semibold px-6 py-4 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                Fazer diagnóstico gratuito
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Quanto sua oficina perde por mês com planilha?
            </h2>
            <p className="text-slate-500">Ajuste os valores e veja a diferença que o BoxCerto faria no seu caixa.</p>
          </div>
          <Calculadora />
        </div>
      </section>

      {/* TABELA COMPARATIVA */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Comparativo completo
            </h2>
            <p className="text-slate-500">Tudo lado a lado. Sem enrolação.</p>
          </div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-bold text-slate-500 w-[45%]">Funcionalidade</th>
                  <th className="py-3 px-3 text-center w-[18%]">
                    <div className="text-xs font-bold text-slate-500">📓 Caderno</div>
                  </th>
                  <th className="py-3 px-3 text-center w-[18%]">
                    <div className="text-xs font-bold text-slate-500">📊 Planilha</div>
                  </th>
                  <th className="py-3 px-3 text-center w-[19%]">
                    <div className="bg-indigo-600 rounded-xl px-3 py-2">
                      <div className="text-xs font-extrabold text-white flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" /> BoxCerto
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {LINHAS.map((linha, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-slate-700">{linha.feature}</td>
                    <td className="py-3 px-3"><CelulaStatus valor={linha.caderno} /></td>
                    <td className="py-3 px-3"><CelulaStatus valor={linha.planilha} /></td>
                    <td className="py-3 px-3 bg-indigo-50/50"><CelulaStatus valor={linha.boxcerto} /></td>
                  </tr>
                ))}
                {/* Linha de preço */}
                <tr className="border-t-2 border-gray-200">
                  <td className="py-4 px-4 text-sm font-bold text-slate-800">Custo mensal</td>
                  <td className="py-4 px-3 text-center text-sm font-semibold text-slate-600">R$0</td>
                  <td className="py-4 px-3 text-center text-sm font-semibold text-slate-600">R$0–30</td>
                  <td className="py-4 px-3 bg-indigo-50/50 text-center text-sm font-extrabold text-indigo-700">R${cfg_pm % 1 === 0 ? cfg_pm.toFixed(0) : cfg_pm.toFixed(2).replace('.',',')}/mês</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-rose-600 font-medium">Custo oculto (orçamentos perdidos)</td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-rose-500">R$500–2.000</td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-rose-500">R$300–1.500</td>
                  <td className="py-3 px-3 bg-indigo-50/50 text-center text-sm font-bold text-emerald-600">~R$0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 max-w-4xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Custo real da planilha:</strong> R$0 de assinatura, mas sem rastreio de orçamentos, um mecânico com 30 OS/mês perde em média 3 aprovações — equivalente a R$900–1.500/mês de receita que simplesmente some.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUE A PLANILHA FALHA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              A planilha não falha por acidente — ela falha por design
            </h2>
            <p className="text-slate-500">Ela foi feita para organizar dados. Nunca foi feita para gerir uma oficina.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                emoji: '📵',
                titulo: 'Não comunica com o cliente',
                desc: 'Planilha não envia orçamento, não avisa quando o carro fica pronto, não rastreia aprovação. Você faz tudo manualmente pelo WhatsApp — duplicando trabalho.',
              },
              {
                emoji: '💾',
                titulo: 'Risco de perda total',
                desc: 'Notebook queimou, celular roubado, arquivo corrompido — sem backup automático, anos de histórico de clientes podem desaparecer em segundos.',
              },
              {
                emoji: '📈',
                titulo: 'Não escala com você',
                desc: 'Com 10 OS por mês, planilha resolve. Com 30 ou 50, vira um pesadelo de abas, fórmulas quebradas e dados desatualizados. BoxCerto cresce com a oficina.',
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

      {/* MIGRAÇÃO SIMPLES */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Migrar é mais simples do que parece
            </h2>
            <p className="text-indigo-200">Você não precisa abandonar a planilha de um dia pro outro.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { passo: '1', titulo: 'Crie sua conta', desc: 'Cadastro em 2 minutos. Sem configuração complicada, sem instalar nada.' },
              { passo: '2', titulo: 'Abra a primeira OS', desc: 'Cadastre um cliente e abra uma OS. O sistema é intuitivo — sem tutorial obrigatório.' },
              { passo: '3', titulo: 'Migre no seu tempo', desc: 'Use o BoxCerto em paralelo com a planilha pelos primeiros dias. Quando ver o resultado, a planilha vai pro lixo sozinha.' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center">
                <div className="w-10 h-10 bg-white text-indigo-700 rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-3">
                  {item.passo}
                </div>
                <h3 className="font-bold text-white mb-2">{item.titulo}</h3>
                <p className="text-sm text-indigo-200 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Quem migrou e não voltou atrás
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
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
              Sua planilha está te custando mais do que o BoxCerto
            </h2>
            <p className="text-indigo-200 mb-8 text-lg">
              7 dias grátis. Sem cartão. Se não gostar, cancela com 1 clique. Sem burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors text-base">
                Largar a planilha agora
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-indigo-400 text-white font-semibold px-6 py-4 rounded-2xl hover:bg-indigo-700 transition-colors">
                <MessageCircle className="w-5 h-5" />
                Conversar no WhatsApp
              </a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Sem cartão · Cancele quando quiser · Migração simples</p>
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

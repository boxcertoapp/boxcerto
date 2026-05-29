import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight,
  Copy, ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react'
import Logo from '../components/Logo'

const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white'

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-slate-800 text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{a}</div>}
    </div>
  )
}

export default function Parceiro() {
  const [form, setForm]       = useState({ nome: '', email: '', whatsapp: '', empresa: '', tipo: 'parceiro' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const formatWpp = (val) => {
    const n = val.replace(/\D/g, '')
    if (n.length <= 2) return n
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nome.trim() || !form.email.trim() || !form.whatsapp.trim())
      return setError('Nome, e-mail e WhatsApp são obrigatórios.')
    if (!form.email.includes('@'))
      return setError('E-mail inválido.')

    setLoading(true)
    try {
      const res  = await fetch('/api/affiliate-apply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Erro ao cadastrar. Tente novamente.')
      setResult(data)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const TIERS = [
    { range: '1 a 10 clientes ativos', pct: '20%', color: 'bg-indigo-50 text-indigo-700' },
    { range: '11 a 20 clientes ativos', pct: '25%', color: 'bg-violet-50 text-violet-700' },
    { range: '21+ clientes ativos',     pct: '30%', color: 'bg-green-50 text-green-700' },
  ]

  // ── Tela de sucesso ─────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo, {result.nome.split(' ')[0]}! 🎉</h2>
          <p className="text-slate-500 text-sm mb-7">
            Seu cadastro foi aprovado. Comece a divulgar agora mesmo!
          </p>

          <div className="space-y-4 text-left">
            <div className="bg-indigo-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Seu link exclusivo</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-slate-800 flex-1 truncate">{result.link}</p>
                <button onClick={() => copyLink(result.link)}
                  className="p-2 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors shrink-0">
                  <Copy className="w-4 h-4 text-indigo-600" />
                </button>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Seu cupom (10% de desconto pro cliente)</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold font-mono text-green-800 flex-1 tracking-widest">{result.coupon_code}</p>
                <button onClick={() => copyLink(result.coupon_code)}
                  className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors shrink-0">
                  <Copy className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>

            {copied && (
              <p className="text-center text-xs text-indigo-600 font-semibold">Copiado!</p>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Enviamos um e-mail com todos os detalhes para <strong>{result.nome}</strong>.
          </p>
        </div>
      </div>
    )
  }

  // ── Página principal ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/"><Logo className="h-7 w-auto" /></Link>
          <a href="#cadastro"
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            Quero ser parceiro
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
          Programa de Parceiros
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
          Indique oficinas e <br className="hidden md:block" />
          <span className="text-indigo-600">ganhe comissão recorrente</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">
          Você indica o BoxCerto para oficinas mecânicas e recebe comissão todo mês
          enquanto os clientes permanecerem ativos — até 30% por ano.
        </p>
        <a href="#cadastro"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-base">
          Começar agora <ArrowRight className="w-5 h-5" />
        </a>
      </section>

      {/* Como funciona */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Users className="w-7 h-7 text-indigo-600" />, title: '1. Cadastre-se grátis', desc: 'Preencha o formulário abaixo e receba seu link e cupom exclusivos na hora.' },
              { icon: <TrendingUp className="w-7 h-7 text-indigo-600" />, title: '2. Divulgue para oficinas', desc: 'Compartilhe seu link, mencione seu cupom nas redes ou indique pessoalmente.' },
              { icon: <DollarSign className="w-7 h-7 text-indigo-600" />, title: '3. Receba todo mês', desc: 'Ganha R$ 50 quando o cliente assina + % do plano todo mês por até 12 meses.' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">{s.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabela de comissões */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Quanto você ganha</h2>
          <p className="text-center text-slate-500 text-sm mb-10">Quanto mais clientes ativos, maior sua comissão — calculada todo mês.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">R$ 50,00 de bônus</p>
                <p className="text-sm text-slate-500">Pago quando o cliente indicado assina o plano</p>
              </div>
            </div>
            {TIERS.map((t, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl p-4 border ${t.color.includes('indigo') ? 'border-indigo-100' : t.color.includes('violet') ? 'border-violet-100' : 'border-green-100'}`}>
                <div className={`rounded-xl px-3 py-1 text-xs font-bold ${t.color}`}>{t.range}</div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-slate-900">{t.pct}</p>
                  <p className="text-xs text-slate-400">do plano / mês</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 mt-4">
            Pagamentos via PIX, todo dia 5 do mês seguinte.
            Comissões mensais por 12 meses por cliente ativo.
          </p>
        </div>
      </section>

      {/* Formulário de cadastro */}
      <section id="cadastro" className="bg-slate-50 py-16">
        <div className="max-w-lg mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Cadastre-se como parceiro</h2>
          <p className="text-center text-slate-500 text-sm mb-8">Aprovação automática. Seu link e cupom ficam prontos na hora.</p>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label>
              <input value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="João da Silva" className={inp} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail *</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="joao@email.com" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp *</label>
                <input value={form.whatsapp} onChange={e => f('whatsapp', formatWpp(e.target.value))} placeholder="(51) 99999-9999" maxLength={15} className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Canal / Empresa <span className="font-normal text-slate-400">(opcional)</span></label>
              <input value={form.empresa} onChange={e => f('empresa', e.target.value)} placeholder="@seuperfil ou Nome da empresa" className={inp} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Você é...</label>
              <select value={form.tipo} onChange={e => f('tipo', e.target.value)} className={inp}>
                <option value="influencer">Influencer / Criador de conteúdo</option>
                <option value="empresa">Empresa do setor automotivo</option>
                <option value="parceiro">Parceiro comercial</option>
                <option value="vendedor">Vendedor externo</option>
              </select>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</> : 'Quero ser parceiro →'}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Ao cadastrar, você concorda com os{' '}
              <Link to="/termos" className="underline hover:text-indigo-500">Termos de Uso</Link>.
              Sem custo. Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Dúvidas frequentes</h2>
        <div className="space-y-3">
          <FAQ q="Quando começo a receber?"
            a="A comissão de R$ 50 é gerada quando o cliente indicado assina um plano. Ela fica pendente por 30 dias (proteção contra cancelamento) e é paga todo dia 5 do mês seguinte via PIX." />
          <FAQ q="Por quanto tempo recebo comissão mensal?"
            a="Você recebe comissão todo mês enquanto o cliente estiver ativo, por até 12 meses por cliente indicado. Após 12 meses, encerra a comissão daquele cliente." />
          <FAQ q="O que acontece se o cliente cancelar?"
            a="Se o cliente cancelar nos primeiros 30 dias, a comissão de entrada é cancelada. Após 30 dias, as comissões já aprovadas são mantidas." />
          <FAQ q="Existe limite de indicações?"
            a="Não. Quanto mais clientes ativos você tiver, maior sua faixa de comissão (20%, 25% ou 30% do plano/mês)." />
          <FAQ q="O cliente recebe algum benefício?"
            a="Sim! Usando seu cupom, o cliente ganha 10% de desconto no primeiro pagamento. Isso aumenta muito a conversão das suas indicações." />
          <FAQ q="Como o BoxCerto sabe que o cliente veio de mim?"
            a="Através do seu link exclusivo (?ref=seu-slug) ou do cupom. O link rastreia por 90 dias — se o cliente acessar hoje e assinar amanhã, você ainda é comissionado." />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-slate-400">
        <div className="flex justify-center mb-3"><Logo className="h-6 w-auto opacity-50" /></div>
        <p>© {new Date().getFullYear()} BoxCerto. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/termos" className="hover:text-indigo-500">Termos</Link>
          <Link to="/privacidade" className="hover:text-indigo-500">Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}

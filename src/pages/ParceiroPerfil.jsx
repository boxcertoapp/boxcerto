// ============================================================
// ParceiroPerfil — LP personalizada por parceiro
// Rota: /parceiro/:slug
// Carrega dados públicos do parceiro e mostra página co-branded
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Check, Wrench, ClipboardCheck, BarChart2, Users, Clock, Star, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { captureAffiliateRef, saveAffiliateCoupon } from '../lib/affiliateTracking'

// ── Dados estáticos dos benefícios ──────────────────────────
const BENEFITS = [
  { icon: ClipboardCheck, title: 'Orçamento aprovado por link', desc: 'Cliente aprova no celular, com data e hora registradas. Zero ligação desnecessária.' },
  { icon: BarChart2,       title: 'Controle financeiro integrado', desc: 'Cada OS quitada vira receita no financeiro automaticamente. Saiba seu lucro em tempo real.' },
  { icon: Users,           title: 'Histórico completo por cliente', desc: 'Veja todo o histórico de um veículo com quilometragem, serviços e peças usadas.' },
  { icon: Clock,           title: 'Economize horas por semana', desc: 'Menos papel, menos ligação, menos retrabalho. Foque no que importa: atender bem.' },
]

const PLANS = [
  { label: 'Mensal', price: 'R$97/mês', desc: '7 dias grátis para testar' },
  { label: 'Anual',  price: 'R$79,90/mês', desc: 'Cobrado anualmente · economize 20%', highlight: true },
]

export default function ParceiroPerfil() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { navigate('/lp', { replace: true }); return }

    supabase
      .from('affiliate_partners')
      .select('id, nome, slug, coupon_code, tipo, empresa, materials')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false)
        if (!data) {
          // Parceiro não existe ou inativo → redireciona com ref
          try {
            const url = new URL(window.location.href)
            url.searchParams.set('ref', slug)
            window.history.replaceState({}, '', url.toString())
            captureAffiliateRef()
          } catch {}
          navigate('/lp', { replace: true })
          return
        }

        setPartner(data)

        // Salva ref e cupom no tracking
        try {
          const url = new URL(window.location.href)
          url.searchParams.set('ref', data.slug)
          window.history.replaceState({}, '', url.toString())
          captureAffiliateRef()
          if (data.coupon_code) saveAffiliateCoupon(data.coupon_code)
        } catch {}

        // Registra evento de clique (fire-and-forget)
        supabase.from('affiliate_events').insert({
          partner_id: data.id,
          event_type: 'click',
          metadata:   { source: 'perfil_lp', slug },
        }).catch(() => {})
      })
  }, [slug])

  const handleCTA = () => {
    const params = new URLSearchParams()
    if (partner?.slug)        params.set('ref', partner.slug)
    if (partner?.coupon_code) params.set('coupon', partner.coupon_code)
    navigate(`/cadastro?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!partner) return null

  const firstName  = partner.nome.split(' ')[0]
  const coupon     = partner.coupon_code

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Topo: banner de indicação ─────────────────────── */}
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm">
        <span className="font-semibold">{firstName}</span> te convidou para conhecer o BoxCerto
        {coupon && (
          <span className="ml-2 bg-white/20 px-2 py-0.5 rounded font-mono font-bold text-xs">
            {coupon}
          </span>
        )}
      </div>

      {/* ── Header ───────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900">BoxCerto</span>
          <div className="ml-auto">
            <button onClick={handleCTA}
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pt-14 pb-12 text-center">

        {/* Avatar inicial do parceiro */}
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="w-5 h-5 bg-indigo-600 rounded-full text-white flex items-center justify-center text-[10px] font-bold">
            {partner.nome.charAt(0).toUpperCase()}
          </span>
          Indicado por {partner.nome}
          {partner.empresa ? ` · ${partner.empresa}` : ''}
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
          Sua oficina no próximo nível.<br />
          <span className="text-indigo-600">Sem planilha, sem papel.</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Sistema completo para mecânicas: orçamento aprovado por link, histórico de clientes,
          controle financeiro e muito mais — tudo num só lugar.
        </p>

        {/* Cupom de desconto */}
        {coupon && (
          <div className="inline-flex flex-col items-center bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl px-8 py-5 mb-8">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-1">
              Sua oferta exclusiva
            </p>
            <p className="text-3xl font-black text-emerald-700 tracking-tight font-mono">{coupon}</p>
            <p className="text-sm text-emerald-600 mt-1 font-medium">
              10% de desconto na primeira mensalidade
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button onClick={handleCTA}
            className="bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
            Começar teste grátis de 7 dias
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-400">Sem cartão de crédito</p>
        </div>
      </section>

      {/* ── Benefícios ───────────────────────────────────── */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Por que mecânicos escolhem o BoxCerto
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ──────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Planos simples, sem surpresa</h2>
          <p className="text-slate-500 text-sm mb-10">
            7 dias grátis para testar. Cancele quando quiser.
            {coupon && <span className="font-semibold text-emerald-600"> Cupom <span className="font-mono">{coupon}</span> para 10% de desconto.</span>}
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {PLANS.map(p => (
              <div key={p.label} className={`rounded-2xl border-2 p-6 text-center ${p.highlight ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                {p.highlight && (
                  <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    Mais popular
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-lg mb-1">{p.label}</h3>
                <p className="text-3xl font-black text-slate-900 mb-1">{p.price.split('/')[0]}<span className="text-base font-semibold text-slate-400">/{p.price.split('/')[1]}</span></p>
                <p className="text-xs text-slate-500 mb-5">{p.desc}</p>
                <button onClick={handleCTA}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
                    ${p.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  Começar com {p.label.toLowerCase()}
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-slate-500">
            {['Sem contrato de fidelidade', 'Dados sempre seus', 'Suporte humano via WhatsApp'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────── */}
      <section className="bg-slate-900 py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
          </div>
          <blockquote className="text-white text-lg font-medium leading-relaxed mb-4">
            "Antes ficava 30 minutos no telefone pra aprovar um orçamento. Hoje mando o link e o cliente aprova em minutos."
          </blockquote>
          <p className="text-slate-400 text-sm">Carlos, Mecânica Central · São Paulo</p>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Pronto para organizar sua oficina?
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Comece grátis por 7 dias. {coupon ? `Use o cupom ${coupon} para ganhar 10% de desconto.` : 'Sem cartão de crédito necessário.'}
          </p>
          <button onClick={handleCTA}
            className="bg-indigo-600 text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 inline-flex items-center gap-2">
            Criar minha conta grátis
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6 px-4 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <Wrench className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-semibold text-slate-600">BoxCerto</span>
        </div>
        <p>Sistema para Oficinas Mecânicas · <a href="/termos" className="hover:underline">Termos</a> · <a href="/privacidade" className="hover:underline">Privacidade</a></p>
      </footer>
    </div>
  )
}

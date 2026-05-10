import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Wrench, Link, TrendingUp, Zap } from 'lucide-react'

const REDIRECT_SECONDS = 6

const steps = [
  { icon: Wrench,      color: 'bg-indigo-100 text-indigo-600', title: 'Abra sua primeira OS',          desc: 'Cadastre o cliente, a placa e os serviços' },
  { icon: Link,        color: 'bg-green-100 text-green-600',   title: 'Envie o orçamento pelo WhatsApp', desc: 'O cliente aprova em 1 clique, com hora registrada' },
  { icon: TrendingUp,  color: 'bg-amber-100 text-amber-600',   title: 'Acompanhe tudo em tempo real',   desc: 'OS, financeiro e estoque no mesmo lugar' },
]

export default function BemVindo() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nome    = params.get('nome') || 'dono da oficina'
  const oficina = params.get('oficina') || 'sua oficina'

  const [count, setCount] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval)
          navigate('/app/oficina', { replace: true })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [navigate])

  const pct = ((REDIRECT_SECONDS - count) / REDIRECT_SECONDS) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Ícone animado */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        {/* Círculo de progresso */}
        <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="#e2e8f0" strokeWidth="4" />
          <circle
            cx="48" cy="48" r="44" fill="none"
            stroke="#4f46e5" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-800 text-lg">BoxCerto</span>
      </div>

      {/* Texto principal */}
      <div className="text-center max-w-lg mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          Parabéns, {nome}! 🎉
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          A <strong className="text-slate-700">{oficina}</strong> acabou de dar o primeiro passo para uma gestão mais organizada e profissional.
          Você tem <strong className="text-indigo-600">7 dias grátis</strong> para explorar tudo.
        </p>
      </div>

      {/* 3 passos */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {steps.map(({ icon: Icon, color, title, desc }, i) => (
          <div key={i} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contador + botão */}
      <div className="text-center">
        <button
          onClick={() => navigate('/app/oficina', { replace: true })}
          className="bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm mb-3 shadow-lg shadow-indigo-200"
        >
          Entrar na minha oficina agora →
        </button>
        <p className="text-slate-400 text-xs">
          Entrando automaticamente em <strong className="text-slate-600">{count}s</strong>...
        </p>
      </div>
    </div>
  )
}

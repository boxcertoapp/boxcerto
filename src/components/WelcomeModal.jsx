import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Aparece toda vez que o usuário entrar enquanto não tiver criado nenhuma OS.
// Some automaticamente quando ele completar a primeira tarefa do onboarding.
export default function WelcomeModal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user || user.isAdmin || user.isTecnico) return

    // Exibe enquanto nenhum dos 3 passos foi concluído
    const nenhum = !user.onboardingOsDone && !user.onboardingOficinaD && !user.onboardingOrcamentoDone
    if (!nenhum) return

    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [
    user?.id,
    user?.onboardingOsDone,
    user?.onboardingOficinaD,
    user?.onboardingOrcamentoDone,
  ])

  // Fecha só para essa sessão — volta na próxima vez que entrar
  const fechar = () => setVisible(false)

  const criarOS = () => {
    fechar()
    navigate('/app/oficina')
    setTimeout(() => window.dispatchEvent(new CustomEvent('boxcerto:abrir-nova-os')), 400)
  }

  if (!visible) return null

  const nome = user?.responsavel?.split(' ')[0] || 'parceiro'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Topo colorido */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="text-5xl mb-3">🔧</div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Olá, {nome}!<br />
            <span className="text-indigo-200">Bem-vindo ao BoxCerto</span>
          </h2>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            Que tal enviar seu primeiro orçamento<br />
            pelo WhatsApp agora? Leva 2 minutos.
          </p>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-6">
            {[
              { icon: '⚡', text: 'Registre o carro e o problema do cliente' },
              { icon: '📲', text: 'Envie o orçamento pelo WhatsApp em segundos' },
              { icon: '✅', text: 'Controle tudo em um único lugar' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{icon}</span>
                <p className="text-sm text-slate-700 font-medium">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={criarOS}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Criar meu primeiro orçamento agora →
          </button>

          <button
            onClick={fechar}
            className="w-full text-slate-400 text-sm py-3 mt-2 hover:text-slate-600 transition-colors"
          >
            Explorar o sistema primeiro
          </button>
        </div>
      </div>
    </div>
  )
}

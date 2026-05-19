import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Mostra apenas UMA VEZ para usuários novos que ainda não criaram nenhuma OS
// Rastreado via localStorage por usuário — nunca volta depois que o usuário age
export default function WelcomeModal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!user || user.isAdmin || user.isTecnico) return

    // Só exibe se nenhum passo foi concluído
    const nenhum = !user.onboardingOsDone && !user.onboardingOficinaD && !user.onboardingOrcamentoDone
    if (!nenhum) return

    // Só exibe uma vez por usuário (persiste no localStorage)
    const key = `boxcerto_welcome_seen_${user.id}`
    if (localStorage.getItem(key)) return

    // Pequeno delay para a tela carregar antes de mostrar o modal
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [user?.id, user?.onboardingOsDone, user?.onboardingOficinaD, user?.onboardingOrcamentoDone])

  const marcarVisto = () => {
    if (user?.id) localStorage.setItem(`boxcerto_welcome_seen_${user.id}`, '1')
    setVisible(false)
  }

  const criarOS = () => {
    marcarVisto()
    navigate('/app/oficina')
    setTimeout(() => window.dispatchEvent(new CustomEvent('boxcerto:abrir-nova-os')), 120)
  }

  if (!visible) return null

  const nome = user?.responsavel?.split(' ')[0] || 'Mecânico'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-none">

        {/* Topo colorido */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="text-5xl mb-3">🔧</div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Olá, {nome}!<br />
            <span className="text-indigo-200">Bem-vindo ao BoxCerto</span>
          </h2>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            Vamos criar sua primeira Ordem de Serviço?<br />
            Leva menos de 2 minutos.
          </p>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5">

          {/* O que você vai conseguir */}
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

          {/* CTA principal */}
          <button
            onClick={criarOS}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Criar minha primeira OS agora →
          </button>

          {/* Secundário */}
          <button
            onClick={marcarVisto}
            className="w-full text-slate-400 text-sm py-3 mt-2 hover:text-slate-600 transition-colors"
          >
            Explorar o sistema primeiro
          </button>
        </div>
      </div>
    </div>
  )
}

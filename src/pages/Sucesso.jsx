import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Sucesso() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  // Recarrega o perfil do usuário assim que chega nesta página,
  // para que o status 'active' seja refletido imediatamente.
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">

        {/* Ícone */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900">BoxCerto</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Assinatura ativada!
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Obrigado por assinar o BoxCerto. Seu acesso completo já está liberado.
        </p>

        <button
          onClick={() => navigate('/app/oficina')}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors mb-3"
        >
          Ir para o sistema
        </button>

        <p className="text-xs text-slate-400">
          Se o seu acesso ainda não foi atualizado, aguarde alguns instantes e recarregue a página.
        </p>
      </div>
    </div>
  )
}

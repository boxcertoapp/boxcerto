import { useLocation, Link } from 'react-router-dom'
import { Wrench, Clock, CheckCircle, MessageCircle } from 'lucide-react'

export default function Pending() {
  const location = useLocation()
  const nome = location.state?.nome || 'Mecânico'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10 text-center">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-xl">MecanicaCerto</span>
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-md w-full">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Quase lá, {nome.split(' ')[0]}!</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          Seu cadastro foi recebido com sucesso. Nossa equipe vai revisar e ativar sua conta em até <strong className="text-slate-700">24 horas</strong>. Você receberá a confirmação pelo e-mail cadastrado.
        </p>

        <div className="space-y-3 text-left mb-8">
          {[
            { icon: <CheckCircle className="w-5 h-5 text-green-500" />, text: 'Cadastro enviado' },
            { icon: <Clock className="w-5 h-5 text-amber-500" />, text: 'Revisão em andamento (até 24h)' },
            { icon: <MessageCircle className="w-5 h-5 text-gray-300" />, text: 'Link de ativação por e-mail' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm text-slate-600">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-indigo-700">
            Tem alguma dúvida? Fale com a gente pelo WhatsApp:{' '}
            <a
              href="https://wa.me/5553997065725?text=Ol%C3%A1%2C%20acabei%20de%20me%20cadastrar%20no%20BoxCerto%20e%20tenho%20uma%20d%C3%BAvida."
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              Chamar no WhatsApp
            </a>
          </p>
        </div>
      </div>

      <Link to="/login" className="mt-8 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        Voltar para o login
      </Link>
    </div>
  )
}

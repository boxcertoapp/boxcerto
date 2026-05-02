import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) return setErro(error.message || 'Erro ao enviar o e-mail. Tente novamente.')
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">E-mail enviado!</h2>
          <p className="text-slate-500 text-sm mb-2">
            Enviamos um link para <strong>{email}</strong>.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
          </p>
          <Link to="/login" className="text-indigo-600 text-sm font-semibold hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link to="/"><Logo size="md" /></Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Esqueci minha senha</h1>
        <p className="text-slate-400 text-sm mb-6">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {erro}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wrench, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [sessaoOk, setSessaoOk] = useState(false)
  const [verificando, setVerificando] = useState(true)

  // Supabase injeta o token na URL como hash — precisamos capturar a sessão
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessaoOk(true)
      }
      setVerificando(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setErro('')
    if (form.password.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    if (form.password !== form.confirm) return setErro('As senhas não coincidem.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })
    setLoading(false)
    if (error) return setErro('Não foi possível redefinir a senha. O link pode ter expirado.')
    setSucesso(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!sessaoOk) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link inválido ou expirado</h2>
          <p className="text-slate-500 text-sm mb-6">Solicite um novo link de redefinição de senha.</p>
          <Link to="/esqueci-senha"
            className="block w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors text-center">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Senha redefinida!</h2>
          <p className="text-slate-500 text-sm">Você será redirecionado para o login em instantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-xl">BoxCerto</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Nova senha</h1>
        <p className="text-slate-400 text-sm mb-6">Escolha uma senha segura para sua conta.</p>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {erro}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova senha</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm pr-11"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar senha</label>
            <input
              type={show ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repita a senha"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

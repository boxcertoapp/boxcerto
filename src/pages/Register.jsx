import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wrench, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    oficina: '', responsavel: '', whatsapp: '',
    email: '', password: '', plan: 'annual',
  })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const formatWpp = (val) => {
    const n = val.replace(/\D/g, '')
    if (n.length <= 2) return n
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.')
    setLoading(true)
    const result = await register({
      oficina: form.oficina.trim(),
      responsavel: form.responsavel.trim(),
      whatsapp: form.whatsapp,
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)
    if (!result.ok) return setError(result.error)

    // Envia email de boas-vindas em background (não bloqueia o redirecionamento)
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        to: form.email.trim(),
        nome: form.responsavel.trim(),
        oficina: form.oficina.trim(),
        trialDias: 7,
      }),
    }).catch(() => {}) // silencia erros — não impede o cadastro

    navigate('/app/oficina')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-xl">BoxCerto</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Cadastrar oficina</h1>
        <p className="text-slate-400 text-sm mb-6">7 dias grátis · Sem cartão agora</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Oficina</label>
            <input name="oficina" required value={form.oficina} onChange={handle}
              placeholder="Ex: Auto Elétrica do João"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Seu Nome</label>
            <input name="responsavel" required value={form.responsavel} onChange={handle}
              placeholder="Nome do responsável"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp</label>
            <input name="whatsapp" required value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: formatWpp(e.target.value) })}
              placeholder="(51) 99999-9999" maxLength={15}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input name="email" type="email" required value={form.email} onChange={handle}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <input name="password" type={show ? 'text' : 'password'} required value={form.password}
                onChange={handle} placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm pr-11" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2">
            {loading ? 'Cadastrando...' : 'Cadastrar gratuitamente'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          Ao cadastrar, você concorda com nossos{' '}
          <Link to="/termos" target="_blank" className="text-indigo-600 hover:underline">Termos de Uso</Link>
          {' '}e{' '}
          <Link to="/privacidade" target="_blank" className="text-indigo-600 hover:underline">Privacidade</Link>.
        </p>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Entrar</Link>
      </p>
    </div>
  )
}

/**
 * TecnicoConvite — Página de aceite de convite do técnico
 * URL: /tecnico-convite?m=MASTER_ID&n=NOME&e=EMAIL
 *
 * O gerente gera este link e compartilha (WhatsApp / cópia).
 * O técnico acessa, define sua senha e já entra no app.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Wrench, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function TecnicoConvite() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()

  // Dados do convite vindos da URL
  const masterId  = params.get('m') || ''
  const nomeParam = (() => { try { return atob(params.get('n') || '') } catch { return '' } })()
  const emailParam = (() => { try { return atob(params.get('e') || '') } catch { return '' } })()

  const [oficina, setOficina] = useState('')
  const [loadingOficina, setLoadingOficina] = useState(true)
  const [invalido, setInvalido] = useState(false)

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Carrega nome da oficina para mostrar ao técnico
  useEffect(() => {
    if (!masterId || !emailParam || !nomeParam) {
      setInvalido(true)
      setLoadingOficina(false)
      return
    }
    const load = async () => {
      try {
        const { data } = await supabase
          .from('office_data')
          .select('nome_fantasia, razao_social')
          .eq('user_id', masterId)
          .maybeSingle()
        setOficina(data?.nome_fantasia || data?.razao_social || 'sua oficina')
      } catch {
        setOficina('sua oficina')
      } finally {
        setLoadingOficina(false)
      }
    }
    load()
  }, [masterId, emailParam, nomeParam])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      // Registra o técnico com metadata especial
      const { error } = await supabase.auth.signUp({
        email: emailParam,
        password: senha,
        options: {
          data: {
            tipo: 'tecnico',
            master_id: masterId,
            nome: nomeParam,
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setErro('Este e-mail já possui uma conta. Tente fazer login.')
        } else {
          setErro(error.message)
        }
        setLoading(false)
        return
      }

      setSucesso(true)
      // Aguarda um momento para mostrar sucesso e redireciona
      setTimeout(() => navigate('/login?tecnico=1'), 2500)
    } catch (err) {
      setErro('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  // ── Link inválido ────────────────────────────────────────────
  if (!loadingOficina && invalido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Link inválido</h2>
          <p className="text-sm text-slate-500">
            Este link de convite está incompleto ou expirado. Peça ao gerente da oficina um novo link.
          </p>
        </div>
      </div>
    )
  }

  // ── Carregando ───────────────────────────────────────────────
  if (loadingOficina) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // ── Sucesso ──────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Conta criada!</h2>
          <p className="text-sm text-slate-500 mb-1">
            Bem-vindo(a), <strong>{nomeParam}</strong>!
          </p>
          <p className="text-sm text-slate-400">
            Verifique seu e-mail para confirmar a conta e depois faça login.
          </p>
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto mt-5" />
        </div>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 text-center">
            Convite de técnico
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1">
            Você foi convidado para <strong>{oficina}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Seu nome</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm text-slate-700 border border-gray-100">
              {nomeParam}
            </div>
          </div>

          {/* E-mail (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm text-slate-500 border border-gray-100">
              {emailParam}
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Crie sua senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{erro}</p>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
            ) : (
              'Criar minha conta'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          Já tem conta?{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-500 hover:underline">
            Fazer login
          </button>
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell, Info, AlertTriangle, CheckCircle, Zap, Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

const TIPOS = [
  { key: 'info',    label: 'Informativo', icon: Info,          bg: 'bg-blue-600',   preview: 'bg-blue-600' },
  { key: 'warning', label: 'Aviso',       icon: AlertTriangle, bg: 'bg-amber-500',  preview: 'bg-amber-500' },
  { key: 'success', label: 'Sucesso',      icon: CheckCircle,  bg: 'bg-green-600',  preview: 'bg-green-600' },
  { key: 'promo',   label: 'Promoção',    icon: Zap,           bg: 'bg-indigo-600', preview: 'bg-indigo-600' },
]

const TARGETS = [
  { key: 'all',          label: 'Todos os usuários' },
  { key: 'trial',        label: 'Apenas em trial' },
  { key: 'active',       label: 'Apenas assinantes' },
  { key: 'inadimplente', label: 'Apenas inadimplentes' },
]

export default function Anuncios() {
  const { user } = useAuth()
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'info',
    target_status: 'all',
    expira_em: '',
  })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAnuncios() }, [])

  const loadAnuncios = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('criado_em', { ascending: false })
    setAnuncios(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.titulo || !form.mensagem) return
    setSaving(true)
    await supabase.from('announcements').insert({
      titulo: form.titulo,
      mensagem: form.mensagem,
      tipo: form.tipo,
      target_status: form.target_status,
      expira_em: form.expira_em ? new Date(form.expira_em).toISOString() : null,
      criado_por: user.id,
      ativo: true,
    })
    setForm({ titulo: '', mensagem: '', tipo: 'info', target_status: 'all', expira_em: '' })
    setShowForm(false)
    setSaving(false)
    loadAnuncios()
  }

  const toggleAtivo = async (id, ativo) => {
    await supabase.from('announcements').update({ ativo: !ativo }).eq('id', id)
    loadAnuncios()
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este anúncio?')) return
    await supabase.from('announcements').delete().eq('id', id)
    loadAnuncios()
  }

  const tipoAtual = TIPOS.find(t => t.key === form.tipo) || TIPOS[0]
  const TipoIcon = tipoAtual.icon

  return (
    <div className="space-y-5">

      {/* Explicação */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">Como funciona</p>
            <p className="text-sm text-indigo-700 mt-1">
              Anúncios aparecem como uma barra colorida no topo da tela de todos os usuários logados.
              O usuário pode fechar o aviso. Use para comunicar novidades, promoções, manutenção ou avisos importantes.
            </p>
          </div>
        </div>
      </div>

      {/* Botão novo */}
      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">
        <Plus className="w-4 h-4" />
        Novo anúncio
      </button>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Criar novo anúncio</p>

          {/* Preview */}
          <div className={`${tipoAtual.preview} text-white px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm`}>
            <TipoIcon className="w-4 h-4 shrink-0" />
            <div>
              {form.titulo && <span className="font-bold mr-2">{form.titulo}</span>}
              <span className="opacity-90">{form.mensagem || 'Prévia do anúncio aqui...'}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Título (opcional)</label>
              <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                placeholder="Ex: Novidade!"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
              <div className="flex gap-2">
                {TIPOS.map(t => (
                  <button key={t.key} onClick={() => setForm({...form, tipo: t.key})}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.tipo === t.key ? `${t.bg} text-white` : 'bg-gray-100 text-slate-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mensagem *</label>
            <textarea value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})}
              placeholder="Mensagem que aparecerá na barra..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Público-alvo</label>
              <select value={form.target_status} onChange={e => setForm({...form, target_status: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                {TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Expira em (opcional)</label>
              <input type="datetime-local" value={form.expira_em} onChange={e => setForm({...form, expira_em: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.mensagem}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-40">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Publicar anúncio'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de anúncios */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : anuncios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Nenhum anúncio criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anuncios.map(a => {
            const tipo = TIPOS.find(t => t.key === a.tipo) || TIPOS[0]
            const target = TARGETS.find(t => t.key === a.target_status)
            const expirado = a.expira_em && new Date(a.expira_em) < new Date()
            const Icon = tipo.icon
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-4 ${!a.ativo || expirado ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${tipo.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {a.titulo && <p className="text-sm font-bold text-slate-800">{a.titulo}</p>}
                    <p className="text-sm text-slate-600">{a.mensagem}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                      <span>Público: {target?.label}</span>
                      {a.expira_em && <span>Expira: {new Date(a.expira_em).toLocaleDateString('pt-BR')}</span>}
                      <span>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.ativo && !expirado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {expirado ? 'Expirado' : a.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => toggleAtivo(a.id, a.ativo)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-slate-400">
                      {a.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

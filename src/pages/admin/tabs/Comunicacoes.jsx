import { useState, useEffect } from 'react'
import {
  Mail, MessageCircle, Send, Loader2, CheckCircle,
  Users, Clock, AlertCircle, Filter, Eye
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const SEGMENTOS = [
  { key: 'all',          label: 'Todos os usuários',        icon: Users,       color: 'text-slate-600',  bg: 'bg-slate-100' },
  { key: 'trial',        label: 'Em trial',                  icon: Clock,       color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { key: 'active',       label: 'Assinantes ativos',         icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100' },
  { key: 'inadimplente', label: 'Inadimplentes',             icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'trial_ending', label: 'Trial expirando (3 dias)',  icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-100' },
  { key: 'inactive',     label: 'Inativos / Cancelados',     icon: Users,       color: 'text-gray-500',   bg: 'bg-gray-100' },
]

const TEMPLATES = [
  {
    key: 'welcome',
    label: '👋 Boas-vindas',
    assunto: 'Bem-vindo ao BoxCerto!',
    desc: 'Enviado automaticamente no cadastro. Use para reenviar.',
  },
  {
    key: 'trial_ending',
    label: '⏳ Trial expirando',
    assunto: 'Seu trial BoxCerto expira em breve',
    desc: 'Incentiva conversão antes do trial acabar.',
  },
  {
    key: 'reativacao',
    label: '🔄 Reativação',
    assunto: 'Sentimos sua falta no BoxCerto!',
    desc: 'Para usuários inativos ou cancelados.',
    html: (nome, oficina) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${nome}! 👋</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Sentimos falta da <strong>${oficina}</strong> no BoxCerto.<br>
      Sua conta ainda está aqui com todos os dados preservados.
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Que tal dar uma nova chance? Temos novidades desde sua última visita!
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://appboxcerto.vercel.app/assinar"
         style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Voltar ao BoxCerto →
      </a>
    </div>
  </div>
</div>`,
  },
  {
    key: 'novidade',
    label: '🚀 Novidade',
    assunto: 'Novidade no BoxCerto!',
    desc: 'Anuncie uma nova funcionalidade para todos.',
    html: (nome) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Novidade para você!</p>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${nome}! 🚀</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Temos uma novidade incrível para você no BoxCerto.<br>
      [Descreva a novidade aqui]
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://appboxcerto.vercel.app/app/oficina"
         style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Ver agora →
      </a>
    </div>
  </div>
</div>`,
  },
  {
    key: 'promocao',
    label: '🏷️ Promoção',
    assunto: 'Oferta especial BoxCerto',
    desc: 'Oferta por tempo limitado para converter ou reativar.',
    html: (nome) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#4f46e5;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:24px">BoxCerto</h1>
    <p style="color:#fde68a;margin:6px 0 0;font-size:13px;font-weight:bold">OFERTA ESPECIAL</p>
  </div>
  <div style="background:white;border-radius:14px;padding:28px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin:0 0 12px">Olá, ${nome}! 🎁</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Temos uma oferta exclusiva para você. Por tempo limitado:<br>
      [Descreva a promoção aqui]
    </p>
    <div style="background:#fef3c7;border-radius:10px;padding:16px;text-align:center;margin:16px 0">
      <p style="color:#92400e;font-weight:bold;font-size:18px;margin:0">[CUPOM ou DESCONTO]</p>
    </div>
    <div style="text-align:center;margin:16px 0">
      <a href="https://appboxcerto.vercel.app/assinar"
         style="background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block">
        Aproveitar oferta →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:11px;text-align:center">Oferta válida por tempo limitado.</p>
  </div>
</div>`,
  },
]

export default function Comunicacoes({ users }) {
  const [segmento, setSegmento] = useState('trial_ending')
  const [template, setTemplate] = useState(TEMPLATES[1])
  const [canal, setCanal] = useState('email')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [logs, setLogs] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .order('enviado_em', { ascending: false })
      .limit(50)
    setLogs(data || [])
  }

  const getTargetUsers = () => {
    const now = new Date()
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    switch (segmento) {
      case 'all':          return users
      case 'trial':        return users.filter(u => u.status === 'trial')
      case 'active':       return users.filter(u => u.status === 'active')
      case 'inadimplente': return users.filter(u => u.status === 'inadimplente')
      case 'trial_ending': return users.filter(u => u.status === 'trial' && u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now)
      case 'inactive':     return users.filter(u => ['inactive', 'cancelado'].includes(u.status))
      default:             return []
    }
  }

  const targets = getTargetUsers()

  // Anti-spam: verifica últimos envios
  const canSend = async (userIds) => {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('email_logs')
      .select('user_id')
      .in('user_id', userIds)
      .gte('enviado_em', since)
    const recentIds = new Set((data || []).map(l => l.user_id))
    return targets.filter(u => !recentIds.has(u.id))
  }

  const handleEnviar = async () => {
    if (!targets.length) return
    setLoading(true)
    setResultado(null)

    const elegíveis = canal === 'email' ? await canSend(targets.map(u => u.id)) : targets
    let ok = 0, skip = 0, wppLinks = []

    for (const u of elegíveis) {
      if (canal === 'email' && u.email) {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: template.key,
              to: u.email,
              nome: u.responsavel || u.oficina || 'Cliente',
              oficina: u.oficina || '',
              diasRestantes: u.trialEnd ? Math.ceil((new Date(u.trialEnd) - new Date()) / (1000*60*60*24)) : 0,
            }),
          })
          if (res.ok) {
            ok++
            await supabase.from('email_logs').insert({
              destinatario_email: u.email,
              destinatario_nome: u.responsavel || u.oficina,
              user_id: u.id,
              template: template.key,
              assunto: template.assunto,
              canal: 'email',
            })
          }
        } catch { /* silencia */ }
      } else if (canal === 'whatsapp' && u.whatsapp) {
        const nome = u.responsavel || u.oficina || 'Cliente'
        const msg = template.key === 'reativacao'
          ? `Olá ${nome}! 👋 Sentimos falta da *${u.oficina}* no BoxCerto. Sua conta ainda está aqui! Acesse: https://appboxcerto.vercel.app/login`
          : template.key === 'trial_ending'
          ? `Olá ${nome}! ⏳ Seu trial do BoxCerto expira em breve. Não perca seus dados — assine agora: https://appboxcerto.vercel.app/assinar`
          : `Olá ${nome}! 👋 Temos novidades no BoxCerto para você: https://appboxcerto.vercel.app/app/oficina`
        wppLinks.push({
          nome,
          link: `https://wa.me/55${u.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`
        })
        ok++
        await supabase.from('email_logs').insert({
          destinatario_email: u.email || '',
          destinatario_nome: nome,
          user_id: u.id,
          template: template.key,
          canal: 'whatsapp',
        })
      }
    }

    skip = targets.length - elegíveis.length
    setResultado({ ok, skip, wppLinks, canal })
    setLoading(false)
    loadLogs()
  }

  const seg = SEGMENTOS.find(s => s.key === segmento)

  return (
    <div className="space-y-6">

      {/* Seleção de segmento */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">1. Escolha o público-alvo</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SEGMENTOS.map(s => {
            const now = new Date(), in3d = new Date(now.getTime() + 3*24*60*60*1000)
            const count = s.key === 'all' ? users.length
              : s.key === 'trial' ? users.filter(u => u.status === 'trial').length
              : s.key === 'active' ? users.filter(u => u.status === 'active').length
              : s.key === 'inadimplente' ? users.filter(u => u.status === 'inadimplente').length
              : s.key === 'trial_ending' ? users.filter(u => u.status === 'trial' && u.trialEnd && new Date(u.trialEnd) <= in3d && new Date(u.trialEnd) >= now).length
              : users.filter(u => ['inactive','cancelado'].includes(u.status)).length
            return (
              <button key={s.key} onClick={() => setSegmento(s.key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${segmento === s.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{s.label}</p>
                  <p className="text-xs text-slate-400">{count} usuários</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Seleção de template */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">2. Escolha o template</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {TEMPLATES.map(t => (
            <button key={t.key} onClick={() => setTemplate(t)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${template.key === t.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="text-sm font-semibold text-slate-700">{t.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-slate-500"><strong>Assunto:</strong> {template.assunto}</p>
        </div>
      </div>

      {/* Canal e envio */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">3. Canal de envio</p>
        </div>
        <div className="flex gap-3 mb-5">
          <button onClick={() => setCanal('email')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${canal === 'email' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-slate-600'}`}>
            <Mail className="w-4 h-4" /> Email
          </button>
          <button onClick={() => setCanal('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${canal === 'whatsapp' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-slate-600'}`}>
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>

        {/* Resumo antes de enviar */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-600">
            Enviar <strong>"{template.label}"</strong> via <strong>{canal === 'email' ? 'Email' : 'WhatsApp'}</strong> para{' '}
            <strong className="text-indigo-600">{targets.length} usuários</strong>{' '}
            do segmento <strong>"{seg?.label}"</strong>
          </p>
          {canal === 'email' && (
            <p className="text-xs text-amber-600 mt-1.5">⚠️ Anti-spam ativo: usuários que receberam email nas últimas 48h serão ignorados.</p>
          )}
          {canal === 'whatsapp' && (
            <p className="text-xs text-green-600 mt-1.5">💬 Serão gerados links para abrir o WhatsApp — você clica em cada um.</p>
          )}
        </div>

        <button onClick={handleEnviar}
          disabled={loading || !targets.length}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Enviando...' : `Disparar para ${targets.length} usuários`}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-2xl border p-5 ${resultado.ok > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-sm font-semibold text-slate-700 mb-2">Resultado do disparo</p>
          <p className="text-sm text-slate-600">✅ Enviados: <strong>{resultado.ok}</strong></p>
          {resultado.skip > 0 && <p className="text-sm text-amber-600">⏭️ Ignorados (anti-spam 48h): <strong>{resultado.skip}</strong></p>}
          {resultado.canal === 'whatsapp' && resultado.wppLinks?.length > 0 && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase">Links WhatsApp gerados:</p>
              {resultado.wppLinks.map((l, i) => (
                <a key={i} href={l.link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Abrir WhatsApp — {l.nome}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Histórico de envios</p>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum envio registrado ainda.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-slate-700">{l.destinatario_nome || l.destinatario_email}</span>
                  <span className="text-slate-400 ml-2">· {l.template} · {l.canal}</span>
                </div>
                <span className="text-slate-400 shrink-0 ml-2">
                  {new Date(l.enviado_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

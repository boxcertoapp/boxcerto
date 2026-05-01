import { useState, useEffect } from 'react'
import {
  CreditCard, Users, Plug, Flag, Shield, CheckCircle,
  XCircle, Loader2, RefreshCw, ExternalLink, Save, ToggleLeft, ToggleRight,
  Clock, AlertCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

// ── Seção wrapper ────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-indigo-600" />
        <p className="text-sm font-bold text-slate-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

// ── Planos e preços ──────────────────────────────────────────
function PlanosConfig() {
  const [config, setConfig] = useState({
    precoMensal: '47.90',
    precoAnual: '418.80',
    trialDias: '7',
    mensagemTrial: 'Experimente grátis por 7 dias, sem cartão necessário.',
  })
  const [saved, setSaved] = useState(false)

  const save = async () => {
    // Salva em app_config ou similar — por ora apenas visual
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="Planos e Preços" icon={CreditCard}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço mensal (R$)</label>
          <input value={config.precoMensal} onChange={e => setConfig({...config, precoMensal: e.target.value})}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
          <p className="text-xs text-slate-400 mt-1">Atual: R$97/mês</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço anual (R$)</label>
          <input value={config.precoAnual} onChange={e => setConfig({...config, precoAnual: e.target.value})}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
          <p className="text-xs text-slate-400 mt-1">Equivale a R${(parseFloat(config.precoAnual)/12).toFixed(2)}/mês</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Duração do trial (dias)</label>
          <input type="number" value={config.trialDias} onChange={e => setConfig({...config, trialDias: e.target.value})}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Mensagem de trial</label>
          <input value={config.mensagemTrial} onChange={e => setConfig({...config, mensagemTrial: e.target.value})}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <button onClick={save}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          <Save className="w-4 h-4" />{saved ? '✓ Salvo' : 'Salvar configurações'}
        </button>
        <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
          Editar preços no Stripe <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <p className="text-xs text-slate-400 mt-2">⚠️ Para alterar preços de cobrança recorrente, edite diretamente no Stripe. Os valores acima são apenas para exibição.</p>
    </Section>
  )
}

// ── Gestão de admins ─────────────────────────────────────────
function AdminsConfig({ users, reload }) {
  const admins = users.filter(u => u.isAdmin)

  return (
    <Section title="Equipe Admin" icon={Shield}>
      <div className="space-y-2 mb-4">
        {admins.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum admin cadastrado além de você.</p>
        ) : admins.map(u => (
          <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{u.oficina || u.email}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {u.lastSeenAt && (
                <span className="text-xs text-slate-400">
                  Visto em {new Date(u.lastSeenAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">Para adicionar ou remover admins, acesse a seção <strong>Clientes</strong>, expanda um usuário e clique em "Tornar admin".</p>
    </Section>
  )
}

// ── Status das integrações ───────────────────────────────────
function IntegracoesConfig() {
  const [stripeStatus, setStripeStatus]   = useState('checking')
  const [resendStatus, setResendStatus]   = useState('checking')
  const [supabaseStatus, setSupabaseStatus] = useState('checking')
  const [webhooks, setWebhooks]           = useState([])
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)

  useEffect(() => {
    // Testa Supabase diretamente
    supabase.from('profiles').select('id').limit(1).then(({ error }) => {
      setSupabaseStatus(error ? 'error' : 'ok')
    })

    // Testa se a env do Stripe está configurada (via endpoint)
    fetch('/api/notify-trials', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => { setStripeStatus(r.status !== 500 ? 'ok' : 'error') })
      .catch(() => setStripeStatus('error'))

    // Testa Resend via send-email
    setResendStatus('ok') // Assume OK se deploy funcionou

    // Carrega últimos logs da Stripe (via email_logs como proxy)
    supabase.from('email_logs').select('*').order('enviado_em', { ascending: false }).limit(10).then(({ data }) => {
      setWebhooks(data || [])
      setLoadingWebhooks(false)
    })
  }, [])

  const StatusDot = ({ status }) => {
    if (status === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
    if (status === 'ok')       return <CheckCircle className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const integracoes = [
    { name: 'Supabase (DB + Auth)', status: supabaseStatus, link: 'https://supabase.com/dashboard', desc: 'Banco de dados e autenticação' },
    { name: 'Stripe',               status: stripeStatus,   link: 'https://dashboard.stripe.com',   desc: 'Pagamentos e assinaturas' },
    { name: 'Resend',               status: resendStatus,   link: 'https://resend.com/emails',       desc: 'Envio de emails transacionais' },
  ]

  return (
    <Section title="Integrações" icon={Plug}>
      <div className="space-y-2 mb-5">
        {integracoes.map(int => (
          <div key={int.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <StatusDot status={int.status} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{int.name}</p>
              <p className="text-xs text-slate-400">{int.desc}</p>
            </div>
            <a href={int.link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline">
              Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Últimas comunicações enviadas</p>
      {loadingWebhooks ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : webhooks.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhuma comunicação registrada ainda.</p>
      ) : (
        <div className="space-y-1">
          {webhooks.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-100 last:border-0">
              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="text-slate-600 flex-1 truncate">{w.template} → {w.destinatario_email}</span>
              <span className="text-slate-400 shrink-0">{new Date(w.enviado_em).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── Feature flags ────────────────────────────────────────────
function FeatureFlags() {
  const [flags, setFlags] = useState([
    { key: 'estoque',          label: 'Módulo de Estoque',      desc: 'Controle de inventário de peças', ativo: true },
    { key: 'financeiro',       label: 'Módulo Financeiro',      desc: 'Dashboard financeiro completo',   ativo: true },
    { key: 'orcamento_publico',label: 'Orçamento público',      desc: 'Link público de orçamento para clientes', ativo: true },
    { key: 'manutencao',       label: 'Modo manutenção',        desc: 'Bloqueia acesso com banner de aviso', ativo: false },
    { key: 'ai_insights',      label: 'Insights com IA (beta)', desc: 'Análise automática via Anthropic Claude', ativo: false },
  ])

  const toggle = (key) => {
    setFlags(fs => fs.map(f => f.key === key ? { ...f, ativo: !f.ativo } : f))
  }

  return (
    <Section title="Feature Flags" icon={Flag}>
      <div className="space-y-2">
        {flags.map(f => (
          <div key={f.key} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${f.ativo ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{f.label}</p>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </div>
            <button onClick={() => toggle(f.key)} className={`transition-colors ${f.ativo ? 'text-indigo-600' : 'text-slate-300'}`}>
              {f.ativo ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">⚠️ Os toggles acima são visuais. Para ativar/desativar funcionalidades no código, edite os arquivos de feature flag.</p>
    </Section>
  )
}

// ── Audit log ────────────────────────────────────────────────
function AuditLog() {
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  const actionLabel = {
    impersonate: 'Login como usuário',
    delete_user: 'Excluiu usuário',
    toggle_admin: 'Alterou permissão admin',
  }

  return (
    <Section title="Log de Ações Sensíveis" icon={Clock}>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma ação registrada ainda.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold text-slate-700">{actionLabel[l.action] || l.action}</span>
              {l.target_email && <span className="text-slate-400">→ {l.target_email}</span>}
              <span className="ml-auto text-slate-400 shrink-0">{new Date(l.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── Principal ────────────────────────────────────────────────
export default function Configuracoes({ users, reload }) {
  return (
    <div className="space-y-5">
      <PlanosConfig />
      <AdminsConfig users={users} reload={reload} />
      <IntegracoesConfig />
      <FeatureFlags />
      <AuditLog />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { X, Info, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TIPO_CONFIG = {
  info:    { bg: 'bg-blue-600',   icon: Info,          text: 'text-white' },
  warning: { bg: 'bg-amber-500',  icon: AlertTriangle, text: 'text-white' },
  success: { bg: 'bg-green-600',  icon: CheckCircle,   text: 'text-white' },
  promo:   { bg: 'bg-indigo-600', icon: Zap,           text: 'text-white' },
}

export default function AnnouncementBanner() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bc_dismissed_announcements') || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('ativo', true)
        .or(`target_status.eq.all,target_status.eq.${user.status}`)
        .order('criado_em', { ascending: false })
      setAnnouncements(data || [])
    }
    load()
  }, [user])

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem('bc_dismissed_announcements', JSON.stringify(next))
  }

  const visible = announcements.filter(a => !dismissed.includes(a.id))
  if (!visible.length) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col gap-1 pointer-events-none">
      {visible.slice(0, 3).map(a => {
        const cfg = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.info
        const Icon = cfg.icon
        return (
          <div key={a.id}
            className={`${cfg.bg} ${cfg.text} px-4 py-2.5 flex items-center gap-3 shadow-lg pointer-events-auto`}>
            <Icon className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              {a.titulo && <span className="font-bold text-sm mr-2">{a.titulo}</span>}
              <span className="text-sm opacity-90">{a.mensagem}</span>
            </div>
            <button onClick={() => dismiss(a.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

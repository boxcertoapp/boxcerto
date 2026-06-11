import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Expõe o cliente no console para debug/testes manuais.
// Seguro: a anon key já é pública (está no bundle) e o RLS + triggers
// protegem os dados; ter window.supabase não concede nenhum poder novo.
if (typeof window !== 'undefined') window.supabase = supabase

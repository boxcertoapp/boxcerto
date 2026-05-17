-- ============================================================
-- Tabela: cadastro_events
-- Registra eventos do funil de cadastro para o painel admin
-- Executar no Supabase SQL Editor
-- ============================================================

create table if not exists cadastro_events (
  id           uuid primary key default gen_random_uuid(),
  event_name   text not null,
  origem       text,
  utm_source   text,
  utm_campaign text,
  utm_content  text,
  device       text,          -- 'mobile' | 'desktop'
  error_type   text,          -- 'nome_vazio' | 'whatsapp_incompleto' | etc.
  error_field  text,          -- campo que gerou o erro
  fields_count int,           -- quantos campos preenchidos no momento
  created_at   timestamptz default now()
);

-- Index para queries de período
create index if not exists idx_cadastro_events_created_at on cadastro_events (created_at desc);
create index if not exists idx_cadastro_events_name       on cadastro_events (event_name);

-- RLS: qualquer um pode inserir (página pública), só autenticados lêem
alter table cadastro_events enable row level security;

drop policy if exists "cadastro_events_insert_public" on cadastro_events;
drop policy if exists "cadastro_events_select_auth"   on cadastro_events;

create policy "cadastro_events_insert_public"
  on cadastro_events for insert to anon
  with check (true);

create policy "cadastro_events_select_auth"
  on cadastro_events for select
  using (auth.role() = 'authenticated');

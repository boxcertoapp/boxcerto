-- ============================================================
-- BOXCERTO — Schema Supabase
-- Cole este script no SQL Editor do painel Supabase e execute.
-- ============================================================

-- ── PROFILES (estende auth.users) ────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  oficina       text not null default '',
  responsavel   text not null default '',
  whatsapp      text default '',
  status        text not null default 'trial',
  plan          text default null,
  trial_end     timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz default now(),
  activated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê seu perfil"
  on public.profiles for select
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'rogerioknfilho@gmail.com');

create policy "Usuário atualiza seu perfil"
  on public.profiles for update
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'rogerioknfilho@gmail.com');

create policy "Usuário insere seu perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── COLUNAS EXTRAS (execute separadamente se o schema já existia) ──
-- alter table public.profiles add column if not exists is_admin boolean default false;
-- alter table public.profiles add column if not exists email text default '';

-- Trigger: cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, oficina, responsavel, whatsapp, status, trial_end)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'oficina', ''),
    coalesce(new.raw_user_meta_data->>'responsavel', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    'trial',
    now() + interval '7 days'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── CLIENTS ──────────────────────────────────────────────
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  nome            text not null,
  whatsapp        text default '',
  cpf             text default '',
  data_nascimento text default '',
  cep             text default '',
  endereco        text default '',
  numero          text default '',
  bairro          text default '',
  cidade          text default '',
  uf              text default '',
  created_at      timestamptz default now()
);

alter table public.clients enable row level security;
create policy "CRUD clients próprios"
  on public.clients for all using (auth.uid() = user_id);


-- ── VEHICLES ─────────────────────────────────────────────
create table public.vehicles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  placa      text not null,
  modelo     text not null,
  created_at timestamptz default now()
);

alter table public.vehicles enable row level security;
create policy "CRUD vehicles próprios"
  on public.vehicles for all using (auth.uid() = user_id);


-- ── SERVICE ORDERS ────────────────────────────────────────
create table public.service_orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  status         text not null default 'orcamento',
  km             text default '',
  observacoes    text default '',
  agendado_para  timestamptz default null,
  delivered_at   timestamptz default null,
  delivery_notes text default '',
  payments       jsonb default '[]',
  desconto       jsonb default '{"tipo":"valor","valor":0}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.service_orders enable row level security;
create policy "CRUD service_orders próprias"
  on public.service_orders for all using (auth.uid() = user_id);


-- ── SERVICE ITEMS ─────────────────────────────────────────
create table public.service_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  os_id        uuid not null references public.service_orders(id) on delete cascade,
  descricao    text not null,
  custo        numeric default 0,
  venda        numeric default 0,
  garantia     text default '',
  inventory_id uuid default null,
  created_at   timestamptz default now()
);

alter table public.service_items enable row level security;
create policy "CRUD service_items próprios"
  on public.service_items for all using (auth.uid() = user_id);


-- ── EXPENSES ─────────────────────────────────────────────
create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  descricao  text not null,
  valor      numeric not null,
  mes        integer not null,
  ano        integer not null,
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;
create policy "CRUD expenses próprias"
  on public.expenses for all using (auth.uid() = user_id);


-- ── INVENTORY ────────────────────────────────────────────
create table public.inventory (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  produto       text not null,
  quantidade    numeric default 0,
  quantidade_min numeric default 0,
  alerta_ativo  boolean default false,
  valor_compra  numeric default 0,
  valor_venda   numeric default 0,
  fornecedor    text default '',
  created_at    timestamptz default now()
);

alter table public.inventory enable row level security;
create policy "CRUD inventory próprio"
  on public.inventory for all using (auth.uid() = user_id);


-- ── OFFICE DATA ───────────────────────────────────────────
create table public.office_data (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  nome       text default '',
  cnpj       text default '',
  telefone   text default '',
  endereco   text default '',
  logo       text default '',
  updated_at timestamptz default now()
);

alter table public.office_data enable row level security;
create policy "CRUD office_data próprios"
  on public.office_data for all using (auth.uid() = user_id);

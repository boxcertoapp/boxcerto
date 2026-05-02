-- ============================================================
-- BOXCERTO — Patch de correção de perfis
-- Execute ESTE SCRIPT no SQL Editor do painel Supabase.
-- Ele é seguro para rodar múltiplas vezes (idempotente).
-- ============================================================

-- 1. Adiciona colunas novas à tabela profiles (ignoradas se já existirem)
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists email    text     not null default '';

-- 2. Cria perfil para usuários que ainda não têm um
--    (acontece quando o usuário registrou antes do trigger existir)
insert into public.profiles (id, oficina, responsavel, whatsapp, status, trial_end)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'oficina',     ''),
  coalesce(u.raw_user_meta_data->>'responsavel', ''),
  coalesce(u.raw_user_meta_data->>'whatsapp',    ''),
  'trial',
  now() + interval '7 days'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3. Copia o email de auth.users → profiles (para exibir no AdminPanel)
update public.profiles p
set    email = u.email
from   auth.users u
where  p.id = u.id
  and  (p.email is null or p.email = '');

-- 4. Garante que as policies do admin funcionem corretamente
--    (usa auth.jwt() para evitar recursão infinita)
drop policy if exists "Usuário vê seu perfil"      on public.profiles;
drop policy if exists "Usuário atualiza seu perfil" on public.profiles;

create policy "Usuário vê seu perfil"
  on public.profiles for select
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'rogerioknfilho@gmail.com');

create policy "Usuário atualiza seu perfil"
  on public.profiles for update
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'rogerioknfilho@gmail.com');

-- 5. Concede permissão de admin ao dono do sistema
update public.profiles
set is_admin = true
from auth.users
where public.profiles.id = auth.users.id
  and auth.users.email = 'rogerioknfilho@gmail.com';

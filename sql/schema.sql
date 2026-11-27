-- Shadows CRM: tables and security rules. Paste into Supabase > SQL Editor > Run. Safe to run once.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text,
  role text not null default 'employee' check (role in ('admin','manager','employee')),
  created_at timestamptz default now()
);
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null, category text default 'other', priority text default 'normal',
  status text not null default 'open', description text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null, created_at timestamptz default now()
);
create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type text not null default 'annual', start_date date not null, end_date date not null, days int not null default 1,
  reason text, status text not null default 'pending', decided_by uuid references public.profiles(id), decision_note text,
  created_at timestamptz default now()
);
create table if not exists public.resignations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  last_day date not null, reason text, notes text, status text not null default 'pending',
  decided_by uuid references public.profiles(id), decision_note text, created_at timestamptz default now()
);
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  name text not null, contact text, phone text, email text, status text not null default 'lead', notes text,
  created_at timestamptz default now()
);

-- the first person to sign up becomes admin; everyone else starts as employee
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          case when (select count(*) from public.profiles) = 0 then 'admin' else 'employee' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_manager() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','manager'));
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.leaves enable row level security;
alter table public.resignations enable row level security;
alter table public.clients enable row level security;

-- profiles: everyone signed in can see names; only an admin changes roles; you can edit your own name
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- tickets, leaves, resignations: own rows for employees, everything for managers
create policy "tickets read" on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "tickets insert" on public.tickets for insert to authenticated with check (user_id = auth.uid());
create policy "tickets update" on public.tickets for update to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "comments read" on public.ticket_comments for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_manager())));
create policy "comments insert" on public.ticket_comments for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_manager())));

create policy "leaves read" on public.leaves for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "leaves insert" on public.leaves for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "leaves update" on public.leaves for update to authenticated using (public.is_manager() or (user_id = auth.uid() and status = 'pending')) with check (public.is_manager() or (user_id = auth.uid() and status in ('pending','cancelled')));

create policy "resign read" on public.resignations for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "resign insert" on public.resignations for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "resign update" on public.resignations for update to authenticated using (public.is_manager() or (user_id = auth.uid() and status = 'pending')) with check (public.is_manager() or (user_id = auth.uid() and status in ('pending','withdrawn')));

-- clients: the whole team works on them
create policy "clients read" on public.clients for select to authenticated using (true);
create policy "clients insert" on public.clients for insert to authenticated with check (true);
create policy "clients update" on public.clients for update to authenticated using (true);
create policy "clients delete" on public.clients for delete to authenticated using (public.is_manager());

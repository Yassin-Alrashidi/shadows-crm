-- round 4 (not run yet; needed only for the live switch): checklist and links on tasks
alter table public.tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.tasks add column if not exists links jsonb not null default '[]'::jsonb;
-- links on clients, and the notes log
alter table public.clients add column if not exists links jsonb not null default '[]'::jsonb;
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
alter table public.client_notes enable row level security;
drop policy if exists "cn read" on public.client_notes;
drop policy if exists "cn write" on public.client_notes;
drop policy if exists "cn delete" on public.client_notes;
create policy "cn read" on public.client_notes for select to authenticated using (public.is_member());
create policy "cn write" on public.client_notes for insert to authenticated with check (public.is_member() and user_id = auth.uid());
create policy "cn delete" on public.client_notes for delete to authenticated using (public.is_manager() or user_id = auth.uid());
-- payments tracker (managers only)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 80),
  amount numeric not null check (amount > 0),
  due_date date,
  status text not null default 'sent' check (status in ('sent','paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
drop policy if exists "inv read" on public.invoices;
drop policy if exists "inv write" on public.invoices;
drop policy if exists "inv update" on public.invoices;
drop policy if exists "inv delete" on public.invoices;
create policy "inv read" on public.invoices for select to authenticated using (public.is_manager());
create policy "inv write" on public.invoices for insert to authenticated with check (public.is_manager() and user_id = auth.uid());
create policy "inv update" on public.invoices for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "inv delete" on public.invoices for delete to authenticated using (public.is_manager());

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

-- v95: monthly scope (promised vs delivered) per client
create table if not exists public.retainers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month text not null,
  label text not null,
  promised int not null default 0,
  delivered int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.retainers enable row level security;
drop policy if exists "ret read" on public.retainers;
drop policy if exists "ret write" on public.retainers;
drop policy if exists "ret update" on public.retainers;
drop policy if exists "ret delete" on public.retainers;
create policy "ret read" on public.retainers for select to authenticated using (true);
create policy "ret write" on public.retainers for insert to authenticated with check (public.is_manager());
create policy "ret update" on public.retainers for update to authenticated using (true) with check (true);
create policy "ret delete" on public.retainers for delete to authenticated using (public.is_manager());

-- v96: time tracking
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  task_id uuid references public.tasks(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  seconds int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table public.time_entries add column if not exists note text;
alter table public.time_entries enable row level security;
drop policy if exists "te read" on public.time_entries;
drop policy if exists "te write" on public.time_entries;
drop policy if exists "te update" on public.time_entries;
drop policy if exists "te delete" on public.time_entries;
create policy "te read" on public.time_entries for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "te write" on public.time_entries for insert to authenticated with check (user_id = auth.uid());
create policy "te update" on public.time_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "te delete" on public.time_entries for delete to authenticated using (user_id = auth.uid() or public.is_manager());

-- v97: content calendar per client
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text not null,
  platform text,
  due_date date,
  status text not null default 'idea',
  created_at timestamptz not null default now()
);
alter table public.content_items enable row level security;
drop policy if exists "ci read" on public.content_items;
drop policy if exists "ci write" on public.content_items;
drop policy if exists "ci update" on public.content_items;
drop policy if exists "ci delete" on public.content_items;
create policy "ci read" on public.content_items for select to authenticated using (true);
create policy "ci write" on public.content_items for insert to authenticated with check (user_id = auth.uid());
create policy "ci update" on public.content_items for update to authenticated using (true) with check (true);
create policy "ci delete" on public.content_items for delete to authenticated using (user_id = auth.uid() or public.is_manager());

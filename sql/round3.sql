-- Round 3: teams, client members, client-linked tasks, leave calendar. Run after schema.sql.
alter table public.profiles add column if not exists team text;
alter table public.tasks add column if not exists client_id uuid references public.clients(id) on delete set null;
create table if not exists public.client_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);
alter table public.client_members enable row level security;
drop policy if exists "cm read" on public.client_members;
drop policy if exists "cm write" on public.client_members;
drop policy if exists "cm delete" on public.client_members;
create policy "cm read" on public.client_members for select to authenticated using (public.is_member());
create policy "cm write" on public.client_members for insert to authenticated with check (public.is_manager());
create policy "cm delete" on public.client_members for delete to authenticated using (public.is_manager());
-- Only managers may change a person's team (same rule as roles: check your profiles update policy).
-- Team calendar: approved leaves only, no reason text, readable by the whole team.
create or replace view public.leave_calendar with (security_invoker = false) as
  select id, user_id, type, start_date, end_date, days from public.leaves where status = 'approved';
revoke all on public.leave_calendar from anon;
grant select on public.leave_calendar to authenticated;

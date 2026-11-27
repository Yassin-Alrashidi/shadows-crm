-- Shadows CRM: tables and security rules. Paste into Supabase > SQL Editor > Run. Safe to run once.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text, nickname text, job_title text,
  role text not null default 'employee' check (role in ('admin','manager','employee')),
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists job_title text;
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  team boolean not null default false,
  title text not null, description text, priority text default 'normal',
  status text not null default 'todo', due_date date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
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

-- Exactly two fixed admins, chosen by company email in public.admin_emails. Everyone else is an employee.
-- Nobody can change a role from the app. Insert the two emails BEFORE they sign up (see the end of this file).
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;  -- no policies: invisible to the app
-- Invite-only: only emails in public.invited_emails (or the two admin emails) can create an account.
-- Keep "Confirm email" ON in Supabase Auth. Admin role is granted here, server-side, only after the address is verified.
create table if not exists public.invited_emails (email text primary key, invited_at timestamptz default now());
alter table public.invited_emails enable row level security;  -- no policies: invisible to the app
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare is_adm boolean;
begin
  is_adm := exists (select 1 from public.admin_emails where lower(email) = lower(new.email));
  if not is_adm and not exists (select 1 from public.invited_emails where lower(email) = lower(new.email)) then
    raise exception 'not invited';
  end if;
  insert into public.profiles (id, email, name, nickname, job_title, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), left(new.raw_user_meta_data->>'nickname',30), left(new.raw_user_meta_data->>'job_title',60),
          case when is_adm and new.email_confirmed_at is not null then 'admin' else 'employee' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.promote_verified_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users for each row execute function public.promote_verified_admin();
-- A member is an invited person whose email is verified. Everything below requires it.
create or replace function public.is_member() returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.profiles p join auth.users u on u.id = p.id where p.id = auth.uid() and u.email_confirmed_at is not null);
$$;

create or replace function public.is_manager() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_member() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_member() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.leaves enable row level security;
alter table public.resignations enable row level security;
alter table public.clients enable row level security;

-- profiles: everyone signed in can see names; roles never change from the app; you can edit your own name
create policy "profiles read" on public.profiles for select to authenticated using (public.is_member());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- leaves, resignations: own rows for employees, everything for managers

create policy "leaves read" on public.leaves for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "leaves insert" on public.leaves for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "leaves update" on public.leaves for update to authenticated using (public.is_manager() or (user_id = auth.uid() and status = 'pending')) with check (public.is_manager() or (user_id = auth.uid() and status in ('pending','cancelled')));

create policy "resign read" on public.resignations for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "resign insert" on public.resignations for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "resign update" on public.resignations for update to authenticated using (public.is_manager() or (user_id = auth.uid() and status = 'pending')) with check (public.is_manager() or (user_id = auth.uid() and status in ('pending','withdrawn')));

-- clients: the whole team works on them
create policy "clients read" on public.clients for select to authenticated using (public.is_member());
create policy "clients insert" on public.clients for insert to authenticated with check (true);
create policy "clients update" on public.clients for update to authenticated using (public.is_member());
create policy "clients delete" on public.clients for delete to authenticated using (public.is_manager());

-- tasks: admins/managers assign; the assignee and creator see and update; managers see all
create policy "tasks read" on public.tasks for select to authenticated using (team or created_by = auth.uid() or assigned_to = auth.uid() or public.is_manager());
create policy "tasks insert" on public.tasks for insert to authenticated with check (created_by = auth.uid() and (assigned_to = auth.uid() or assigned_to is null or public.is_manager()) and (not team or public.is_manager()));
create policy "tasks update" on public.tasks for update to authenticated using (created_by = auth.uid() or assigned_to = auth.uid() or public.is_manager());
create policy "tasks delete" on public.tasks for delete to authenticated using (public.is_manager());
create policy "task comments read" on public.task_comments for select to authenticated using (exists (select 1 from public.tasks t where t.id = task_id and (t.team or t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_manager())));
create policy "task comments insert" on public.task_comments for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.tasks t where t.id = task_id and (t.team or t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_manager())));

-- attendance: check in / check out. Times come from the database clock.
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  check_in timestamptz not null default now(), check_out timestamptz,
  created_at timestamptz default now()
);
create unique index if not exists attendance_one_open on public.attendance(user_id) where check_out is null;
create or replace function public.attendance_stamp() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then new.check_in := now(); new.check_out := null;
  else new.user_id := old.user_id; new.check_in := old.check_in;
       if old.check_out is not null then new.check_out := old.check_out; else new.check_out := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists attendance_stamp_t on public.attendance;
create trigger attendance_stamp_t before insert or update on public.attendance for each row execute function public.attendance_stamp();
alter table public.attendance enable row level security;
create policy "attendance read" on public.attendance for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "attendance insert" on public.attendance for insert to authenticated with check (user_id = auth.uid());
create policy "attendance update" on public.attendance for update to authenticated using (user_id = auth.uid());

-- INVITES: add each team member's company email here before they sign up (or use Supabase > Authentication > Invite user):
-- insert into public.invited_emails (email) values ('person@company.example');
-- THE TWO ADMINS: run this once with the real company emails, before they create their accounts:
-- insert into public.admin_emails (email) values ('admin1@company.example'), ('admin2@company.example');

-- notifications: in-app notification center (real push comes later). Each person reads only their own.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null, ref text, subject text,
  actor uuid references public.profiles(id) on delete set null,
  read boolean not null default false, created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif insert" on public.notifications for insert to authenticated with check (actor = auth.uid());
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid());

-- decision log: who decided a leave or resignation, and when. Insert only. No update, no delete.
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('leave','resignation')), ref_id uuid not null,
  subject_user uuid references public.profiles(id) on delete set null,
  decided_by uuid not null default auth.uid() references public.profiles(id),
  decision text not null, note text, created_at timestamptz default now()
);
alter table public.decisions enable row level security;
create policy "decisions read" on public.decisions for select to authenticated using (public.is_manager() or subject_user = auth.uid());
create policy "decisions insert" on public.decisions for insert to authenticated with check (public.is_manager() and decided_by = auth.uid());

-- if the tasks table already exists from an earlier run, this adds the team column
alter table public.tasks add column if not exists team boolean not null default false;

-- voice notes on tasks (kept small: the app limits a note to 45 seconds)
create table if not exists public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  audio text not null, secs int, created_at timestamptz default now()
);
alter table public.voice_notes enable row level security;
create policy "voice read" on public.voice_notes for select to authenticated using (exists (select 1 from public.tasks t where t.id = task_id and (t.team or t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_manager())));
create policy "voice insert" on public.voice_notes for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.tasks t where t.id = task_id and (t.team or t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_manager())));

-- team tasks: each member marks their own side done
create table if not exists public.task_ack (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz default now(), unique (task_id, user_id)
);
alter table public.task_ack enable row level security;
create policy "ack read" on public.task_ack for select to authenticated using (public.is_member());
create policy "ack insert" on public.task_ack for insert to authenticated with check (user_id = auth.uid());

-- star of the week: one per week, picked by an admin
create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null unique, picked_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.stars enable row level security;
create policy "stars read" on public.stars for select to authenticated using (public.is_member());
create policy "stars insert" on public.stars for insert to authenticated with check (public.is_manager());
create policy "stars delete" on public.stars for delete to authenticated using (public.is_manager());

-- broadcasts: one message from an admin to the whole team
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null, urgent boolean not null default false, created_at timestamptz default now()
);
alter table public.broadcasts enable row level security;
create policy "bc read" on public.broadcasts for select to authenticated using (public.is_member());
create policy "bc insert" on public.broadcasts for insert to authenticated with check (public.is_manager() and from_user = auth.uid());

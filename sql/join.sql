-- Standalone team form (join.html). Separate from the app: no accounts, no login.
-- Run once in Supabase > SQL Editor. Then run the last block with YOUR OWN long secret.
create extension if not exists pgcrypto;
create table if not exists public.join_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null check (char_length(full_name) between 5 and 120),
  nickname text check (char_length(nickname) <= 30),
  job_title text not null check (char_length(job_title) between 1 and 60),
  enc_password text not null check (char_length(enc_password) between 100 and 1000)  -- encrypted in the browser, never plain text
);
alter table public.join_responses enable row level security;
drop policy if exists join_insert on public.join_responses;
create policy join_insert on public.join_responses for insert to anon, authenticated with check (true);
-- no select/update/delete policy: nobody can read the table through the API
grant insert on public.join_responses to anon, authenticated;

create table if not exists public.join_admin (id int primary key default 1 check (id = 1), hash text not null, pubkey text);
alter table public.join_admin enable row level security;  -- no policies: invisible to the API

create or replace function public.join_pubkey() returns text language sql stable security definer set search_path = public as $$
  select pubkey from public.join_admin where id = 1;
$$;
create or replace function public.join_set_pubkey(secret text, k text) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.join_admin where id = 1 and hash = crypt(secret, hash)) then raise exception 'denied'; end if;
  update public.join_admin set pubkey = k where id = 1;
end $$;
create or replace function public.join_export(secret text) returns setof public.join_responses language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.join_admin where id = 1 and hash = crypt(secret, hash)) then raise exception 'denied'; end if;
  return query select * from public.join_responses order by created_at;
end $$;
grant execute on function public.join_pubkey() to anon, authenticated;
grant execute on function public.join_set_pubkey(text, text) to anon, authenticated;
grant execute on function public.join_export(text) to anon, authenticated;

-- LAST STEP, run on its own: replace the text with a long secret only you know (20+ characters), then run.
-- insert into public.join_admin (hash) values (crypt('PUT-YOUR-LONG-SECRET-HERE', gen_salt('bf'))) on conflict (id) do update set hash = excluded.hash;

-- Run in Supabase SQL editor AFTER schema.sql and BEFORE real data. Each block should return the expected result.
-- 1) Anonymous: must see nothing / be denied.
set local role anon;
select count(*) as anon_profiles from public.profiles;       -- expect 0 or permission denied
select count(*) as anon_leaves from public.leaves;           -- expect 0 or permission denied
reset role;
-- 2) Invite gate: this must FAIL with "not invited" (run in a transaction and roll back).
-- begin; insert into auth.users (id, email) values (gen_random_uuid(), 'stranger@example.com'); rollback;
-- 3) Employee isolation: replace the UUIDs with two real employee ids from profiles.
-- set local role authenticated; select set_config('request.jwt.claims', '{"sub":"<EMPLOYEE_A_ID>","role":"authenticated"}', true);
-- select count(*) from public.leaves where user_id <> '<EMPLOYEE_A_ID>';       -- expect 0
-- select count(*) from public.resignations where user_id <> '<EMPLOYEE_A_ID>'; -- expect 0
-- select count(*) from public.attendance where user_id <> '<EMPLOYEE_A_ID>';   -- expect 0
-- update public.profiles set role = 'admin' where id = '<EMPLOYEE_A_ID>';      -- expect 0 rows / denied
-- reset role;
-- 4) Admin rights: exactly the two admin emails, both verified.
select email, role from public.profiles where role = 'admin';   -- expect exactly the two company admin emails
select count(*) as unverified_admins from public.profiles p join auth.users u on u.id = p.id where p.role = 'admin' and u.email_confirmed_at is null;  -- expect 0

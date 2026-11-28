-- round 4 (not run yet; needed only for the live switch): checklist and links on tasks
alter table public.tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.tasks add column if not exists links jsonb not null default '[]'::jsonb;

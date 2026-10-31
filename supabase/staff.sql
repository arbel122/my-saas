-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק מידע קיים.
--
-- צוות במספרה/עסק: כמה מטפלים באותו אתר, לכל אחד יומן משלו.
-- 1. טבלת מטפלים (נגישה רק לשרת, לא ישירות מהדפדפן).
-- 2. לכל תור אפשר לשייך מטפל (staff_id).
-- 3. מניעת חפיפה עוברת מרמת האתר לרמת המטפל: שני מטפלים יכולים לעבוד באותה שעה,
--    אבל לאותו מטפל אי אפשר לקבוע שני תורים חופפים (גם אם שני לקוחות לוחצים באותה שנייה).

create table if not exists public.site_staff (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  services jsonb not null default '[]'::jsonb,
  invite_token uuid not null default gen_random_uuid(),
  status text not null default 'invited',
  created_at timestamptz not null default now()
);

create unique index if not exists site_staff_invite_token_key on public.site_staff (invite_token);
create unique index if not exists site_staff_site_user_key on public.site_staff (site_id, user_id) where user_id is not null;
create index if not exists site_staff_user_idx on public.site_staff (user_id);

alter table public.site_staff enable row level security;
revoke all on public.site_staff from anon, authenticated;

alter table public.appointments add column if not exists staff_id text;
create index if not exists appointments_staff_idx on public.appointments (staff_id, starts_at);

-- "משאב" התור: המטפל אם יש, אחרת האתר (אתרים בלי צוות ממשיכים לעבוד בדיוק כמו קודם).
alter table public.appointments
  add column if not exists resource_key text generated always as (coalesce(staff_id, site_id)) stored;

alter table public.appointments drop constraint if exists appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    resource_key with =,
    tsrange(starts_at, ends_at, '[)') with &&
  )
  where (starts_at is not null and ends_at is not null);

drop index if exists public.appointments_site_slot_key;
create unique index if not exists appointments_resource_slot_key
  on public.appointments (resource_key, slot_key)
  where slot_key is not null;

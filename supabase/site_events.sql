-- סטטיסטיקות לבעל העסק: כמה לחצו על וואטסאפ/טלפון באתר, ומאיפה הגיעו (לפי המקור).
-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run. בטוח להרצה חוזרת.
-- עד שמריצים את זה, האתר ממשיך לעבוד כרגיל, ופשוט לא נאספות הסטטיסטיקות החדשות.

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  type text not null check (type in ('whatsapp', 'phone')),
  source text,
  created_at timestamptz not null default now()
);

create index if not exists site_events_site_created_idx on public.site_events (site_id, created_at desc);

-- גישה רק מהשרת (service role). בלי מדיניות, אף משתמש בדפדפן לא יכול לקרוא או לכתוב.
alter table public.site_events enable row level security;

-- מקור הגעה של כל תור (למשל instagram.com, google, ישיר)
alter table public.appointments add column if not exists source text;

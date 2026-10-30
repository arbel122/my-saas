-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת.

-- 1. מזהה אקראי לכל תור (לקישורי ביטול וביקורת, במקום מספר רץ שאפשר לנחש).
--    תורים קיימים מקבלים מזהה אוטומטית.
alter table public.appointments
  add column if not exists token uuid not null default gen_random_uuid();

create unique index if not exists appointments_token_key
  on public.appointments (token);

-- 2. מפתח שעה מנורמל (YYYY-MM-DD HH:MM) שמונע כפל הזמנות לאותה שעה באותו אתר,
--    גם כשיש שני בקשות באותו רגע.
alter table public.appointments
  add column if not exists slot_key text;

create unique index if not exists appointments_site_slot_key
  on public.appointments (site_id, slot_key)
  where slot_key is not null;

-- 3. הגדלת מונה צפיות באופן אטומי. רק השרת (service role) יכול להריץ.
create or replace function public.increment_site_views(p_site_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sites set views = coalesce(views, 0) + 1 where id = p_site_id;
$$;

revoke execute on function public.increment_site_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_site_views(uuid) to service_role;

-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק שום מידע קיים.
--
-- הבעיה: כשמוחקים אתר, התורים שלו (שם וטלפון של לקוחות) נשארים במסד בלי אתר.
-- התיקון: מעכשיו, מחיקת אתר מוחקת גם את התורים שלו (ואת הביקורות עליהם).
--
-- למה טריגר ולא foreign key: בטבלת appointments העמודה site_id היא text,
-- ובטבלת sites העמודה id היא uuid, ולכן אי אפשר לקשר ביניהן ישירות.
-- טריגר לא משנה את מבנה הטבלאות ולא משפיע על חוקי ההרשאות הקיימים.
-- תורים יתומים שכבר קיימים (מאתרים שנמחקו בעבר) לא נמחקים.

-- ליתר ביטחון: אם הרצת בטעות את הגרסה הקודמת של הקובץ, אין מה להסיר (היא נכשלה).
alter table public.appointments
  drop constraint if exists appointments_site_id_fkey;

create or replace function public.delete_site_appointments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.reviews
  where appointment_id in (
    select id from public.appointments where site_id = old.id::text
  );

  delete from public.appointments where site_id = old.id::text;

  return old;
end;
$$;

drop trigger if exists delete_site_appointments_trigger on public.sites;

create trigger delete_site_appointments_trigger
  after delete on public.sites
  for each row execute function public.delete_site_appointments();

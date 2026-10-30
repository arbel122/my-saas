-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק שום מידע קיים.
--
-- הבעיה: כשמוחקים אתר, התורים שלו (שם וטלפון של לקוחות) נשארים במסד בלי אתר.
-- התיקון: מעכשיו, מחיקת אתר מוחקת גם את התורים שלו.
--
-- "not valid" אומר שהאילוץ חל רק על שינויים עתידיים. תורים יתומים שכבר קיימים
-- (שייכים לאתרים שנמחקו בעבר) לא נבדקים ולא נמחקים, ואפשר לטפל בהם ידנית.

alter table public.appointments
  drop constraint if exists appointments_site_id_fkey;

alter table public.appointments
  add constraint appointments_site_id_fkey
  foreign key (site_id) references public.sites (id) on delete cascade
  not valid;

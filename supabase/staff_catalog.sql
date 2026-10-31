-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק מידע קיים.
-- מוצרים לכל מטפל: כל מטפל מנהל קטלוג משלו מהדשבורד שלו, והוא מוצג באתר העסק על שמו.
alter table public.site_staff add column if not exists catalog jsonb not null default '[]'::jsonb;

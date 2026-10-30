-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק מידע קיים.
--
-- מוסיף לתורים שעת התחלה ושעת סיום, ואילוץ שמונע בכל מקרה (גם כששני לקוחות
-- לוחצים באותה שנייה) שני תורים חופפים באותו אתר. תור של שעה וחצי חוסם את כל
-- הזמן שלו, ולא רק את שעת ההתחלה.
-- שעות נשמרות כשעון ישראל (בלי אזור זמן), כמו שהלקוח רואה אותן.

create extension if not exists btree_gist with schema extensions;

alter table public.appointments add column if not exists starts_at timestamp;
alter table public.appointments add column if not exists ends_at timestamp;

alter table public.appointments drop constraint if exists appointments_no_overlap;

-- התורים הישנים (בלי starts_at) לא נבדקים, ולכן לא מושפעים.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    site_id with =,
    tsrange(starts_at, ends_at, '[)') with &&
  )
  where (starts_at is not null and ends_at is not null);

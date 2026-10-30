-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק מידע.
--
-- שומר מתי נגמרת התקופה ששולמה כשמנוי מבוטל. עד אז האתר נשאר באוויר.
-- ריק (null) = מנוי פעיל ללא תאריך סיום.

alter table public.pro_users add column if not exists ends_at timestamptz;

-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run
-- בטוח להרצה חוזרת. לא מוחק מידע.
--
-- הבעיה: כל אחד יכול להכניס תורים מזויפים ישר למסד (בעקיפת האפליקציה וההגבלות שלה)
-- ולהציף את היומן של בעל עסק.
-- התיקון: כל הכתיבה לתורים ולביקורות נעשית בשרת (service role). חוסמים כתיבה ישירה
-- לתפקידים של הדפדפן (anon = אורח, authenticated = משתמש מחובר).
--
-- מה נשאר: משתמש מחובר ממשיך לקרוא את התורים של האתרים שלו (הדשבורד), ואורחים
-- ממשיכים לקרוא ביקורות (מוצגות באתר). service_role לא מושפע.

revoke insert, update, delete on public.appointments from anon, authenticated;
revoke select on public.appointments from anon;

revoke insert, update, delete on public.reviews from anon, authenticated;

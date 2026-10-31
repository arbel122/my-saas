-- אתר שעוד לא פורסם נראה רק לבעלים שלו. אתר מפורסם נראה לכולם.
-- (בלי זה אפשר לשלוף ישירות מהמסד את כל האתרים, כולל טיוטות של משתמשים אחרים.)
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'sites' and cmd = 'SELECT' loop
    execute format('drop policy %I on public.sites', p.policyname);
  end loop;
end $$;

create policy "read published or own sites" on public.sites
  for select using (is_pro = true or auth.uid() = user_id);

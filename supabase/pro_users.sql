-- להריץ פעם אחת ב-Supabase: SQL Editor -> New query -> Run

create table if not exists public.pro_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  paypal_subscription_id text not null,
  is_active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- משתמש יכול רק לקרוא את הסטטוס של עצמו. כתיבה אפשרית רק מהשרת (service role).
alter table public.pro_users enable row level security;

drop policy if exists "read own pro status" on public.pro_users;
create policy "read own pro status"
  on public.pro_users for select
  to authenticated
  using (auth.uid() = user_id);

-- מונע ממשתמשים לסמן את האתר שלהם כ-Pro בעצמם דרך הדפדפן.
-- רק השרת (service role) יכול לשנות את is_pro.
create or replace function public.protect_is_pro()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.is_pro := false;
    else
      new.is_pro := old.is_pro;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_pro_trigger on public.sites;
create trigger protect_is_pro_trigger
  before insert or update on public.sites
  for each row execute function public.protect_is_pro();

-- תורים שייכים לחשבון הלקוח שקבע אותם
alter table appointments add column if not exists customer_user_id uuid;
create index if not exists appointments_customer_idx on appointments (customer_user_id, starts_at);

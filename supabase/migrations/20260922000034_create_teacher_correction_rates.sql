begin;

create table public.teacher_correction_rates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  effective_from date not null,
  effective_to date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_correction_rates_month_start_check
    check (extract(day from effective_from) = 1),
  constraint teacher_correction_rates_period_check
    check (effective_to is null or effective_to >= effective_from)
);

create index teacher_correction_rates_teacher_period_idx
  on public.teacher_correction_rates (teacher_id, effective_from desc);

create unique index teacher_correction_rates_default_start_unique
  on public.teacher_correction_rates (effective_from)
  where teacher_id is null;

create unique index teacher_correction_rates_teacher_start_unique
  on public.teacher_correction_rates (teacher_id, effective_from)
  where teacher_id is not null;

alter table public.teacher_correction_rates enable row level security;

revoke all on table public.teacher_correction_rates from public, anon, authenticated;
grant select on table public.teacher_correction_rates to authenticated;
grant select, insert, update, delete on table public.teacher_correction_rates to service_role;

create policy "Admins read teacher correction rates"
on public.teacher_correction_rates for select
to authenticated
using (public.get_my_role() = 'ADMIN');

create policy "Teachers read applicable correction rates"
on public.teacher_correction_rates for select
to authenticated
using (
  public.get_my_role() = 'TEACHER'
  and (teacher_id is null or teacher_id = auth.uid())
);

create policy "Teachers read their own payments"
on public.teacher_payments for select
to authenticated
using (teacher_id = auth.uid() and public.get_my_role() = 'TEACHER');

create policy "Teachers read their own receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and public.get_my_role() = 'TEACHER'
  and (storage.foldername(name))[1] = auth.uid()::text
);

insert into public.teacher_correction_rates (
  teacher_id,
  amount,
  effective_from,
  effective_to,
  created_by
)
values (null, 10.00, date '1970-01-01', null, null);

create or replace function public.schedule_teacher_correction_rate(
  p_teacher_id uuid,
  p_amount numeric,
  p_effective_from date
)
returns public.teacher_correction_rates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_allowed_month date := (
    date_trunc('month', now() at time zone 'America/Sao_Paulo') + interval '1 month'
  )::date;
  v_rate public.teacher_correction_rates;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can schedule correction rates.';
  end if;

  if extract(day from p_effective_from) <> 1 then
    raise exception 'Correction rates must start on the first day of a month.';
  end if;

  if p_effective_from < v_first_allowed_month then
    raise exception 'Correction rate changes must start in a future month.';
  end if;

  if p_amount is not null and p_amount <= 0 then
    raise exception 'Correction rate amount must be greater than zero.';
  end if;

  if p_teacher_id is null and p_amount is null then
    raise exception 'The default correction rate cannot be removed.';
  end if;

  if p_teacher_id is not null and not exists (
    select 1
    from public.profiles
    where id = p_teacher_id
      and role = 'TEACHER'
  ) then
    raise exception 'Teacher not found.';
  end if;

  delete from public.teacher_correction_rates
  where teacher_id is not distinct from p_teacher_id
    and effective_from >= p_effective_from;

  update public.teacher_correction_rates
  set effective_to = p_effective_from - 1,
      updated_at = now()
  where teacher_id is not distinct from p_teacher_id
    and effective_from < p_effective_from
    and (effective_to is null or effective_to >= p_effective_from);

  if p_amount is null then
    select *
    into v_rate
    from public.teacher_correction_rates
    where teacher_id is not distinct from p_teacher_id
    order by effective_from desc
    limit 1;

    return v_rate;
  end if;

  insert into public.teacher_correction_rates (
    teacher_id,
    amount,
    effective_from,
    created_by
  )
  values (
    p_teacher_id,
    p_amount,
    p_effective_from,
    auth.uid()
  )
  returning * into v_rate;

  return v_rate;
end;
$$;

revoke all on function public.schedule_teacher_correction_rate(uuid, numeric, date)
from public, anon, authenticated;

grant execute on function public.schedule_teacher_correction_rate(uuid, numeric, date)
to authenticated;

create or replace function public.resolve_teacher_correction_rate(
  p_teacher_id uuid,
  p_billing_month date
)
returns numeric
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_billing_month)::date;
  v_amount numeric;
begin
  if auth.uid() <> p_teacher_id and not public.is_admin() then
    raise exception 'Not authorized to read this correction rate.';
  end if;

  select rate.amount
  into v_amount
  from public.teacher_correction_rates rate
  where rate.teacher_id = p_teacher_id
    and rate.effective_from <= v_month
    and (rate.effective_to is null or rate.effective_to >= v_month)
  order by rate.effective_from desc
  limit 1;

  if v_amount is null then
    select rate.amount
    into v_amount
    from public.teacher_correction_rates rate
    where rate.teacher_id is null
      and rate.effective_from <= v_month
      and (rate.effective_to is null or rate.effective_to >= v_month)
    order by rate.effective_from desc
    limit 1;
  end if;

  if v_amount is null then
    raise exception 'No correction rate configured for this billing month.';
  end if;

  return v_amount;
end;
$$;

revoke all on function public.resolve_teacher_correction_rate(uuid, date)
from public, anon, authenticated;

grant execute on function public.resolve_teacher_correction_rate(uuid, date)
to authenticated;

comment on table public.teacher_correction_rates is
  'Monthly teacher correction rates. A null teacher_id represents the global default.';

comment on function public.schedule_teacher_correction_rate(uuid, numeric, date) is
  'Atomically schedules a future monthly default or teacher-specific correction rate. A null amount removes a teacher override.';

create or replace function public.set_teacher_default_payment_account(
  p_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid;
begin
  select account.teacher_id
  into v_teacher_id
  from public.teacher_payment_accounts account
  where account.id = p_account_id;

  if v_teacher_id is null then
    raise exception 'Payment account not found.';
  end if;

  if auth.uid() <> v_teacher_id and not public.is_admin() then
    raise exception 'Not authorized to manage this payment account.';
  end if;

  update public.teacher_payment_accounts
  set is_default = false,
      updated_at = now()
  where teacher_id = v_teacher_id
    and is_default = true;

  update public.teacher_payment_accounts
  set is_default = true,
      updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.set_teacher_default_payment_account(uuid)
from public, anon, authenticated;

grant execute on function public.set_teacher_default_payment_account(uuid)
to authenticated;

create or replace function public.delete_teacher_payment_account(
  p_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid;
  v_was_default boolean;
  v_next_account_id uuid;
begin
  select account.teacher_id, account.is_default
  into v_teacher_id, v_was_default
  from public.teacher_payment_accounts account
  where account.id = p_account_id;

  if v_teacher_id is null then
    raise exception 'Payment account not found.';
  end if;

  if auth.uid() <> v_teacher_id and not public.is_admin() then
    raise exception 'Not authorized to delete this payment account.';
  end if;

  delete from public.teacher_payment_accounts
  where id = p_account_id;

  if v_was_default then
    select account.id
    into v_next_account_id
    from public.teacher_payment_accounts account
    where account.teacher_id = v_teacher_id
    order by account.created_at desc
    limit 1;

    if v_next_account_id is not null then
      update public.teacher_payment_accounts
      set is_default = true,
          updated_at = now()
      where id = v_next_account_id;
    end if;
  end if;
end;
$$;

revoke all on function public.delete_teacher_payment_account(uuid)
from public, anon, authenticated;

grant execute on function public.delete_teacher_payment_account(uuid)
to authenticated;

commit;

begin;

do $$
declare
  v_offer_id uuid;
begin
  if public.subscription_credit_allocation_available_at(
    '2026-01-15 12:00:00+00'::timestamptz,
    1
  ) <> '2026-01-15 12:00:00+00'::timestamptz then
    raise exception 'The first monthly allocation must be immediately available';
  end if;

  if public.subscription_credit_allocation_available_at(
    '2026-01-15 12:00:00+00'::timestamptz,
    2
  ) <> '2026-02-15 12:00:00+00'::timestamptz then
    raise exception 'The second allocation must be available one month later';
  end if;

  if public.subscription_credit_allocation_available_at(
    '2026-01-15 12:00:00+00'::timestamptz,
    3
  ) <> '2026-03-15 12:00:00+00'::timestamptz then
    raise exception 'The third allocation must be available two months later';
  end if;

  if public.subscription_credit_allocation_available_at(
    '2026-01-15 12:00:00+00'::timestamptz,
    4
  ) is not null then
    raise exception 'A quarterly schedule cannot create a fourth allocation';
  end if;

  insert into public.plans (
    name,
    description,
    external_id,
    credits_included,
    price,
    interval,
    interval_count,
    discount_percentage,
    is_recommended,
    sort_order
  ) values (
    'Independent quarterly test offer',
    'Offer without a monthly counterpart',
    'plan_test_' || replace(gen_random_uuid()::text, '-', ''),
    7,
    15000,
    'month',
    3,
    12,
    true,
    30
  )
  returning id into v_offer_id;

  if not exists (
    select 1
    from public.plans
    where id = v_offer_id
      and interval = 'month'
      and interval_count = 3
      and credits_included = 7
      and discount_percentage = 12
      and is_recommended
  ) then
    raise exception 'A quarterly offer must persist without a monthly counterpart';
  end if;
end;
$$;

rollback;

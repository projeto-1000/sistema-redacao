begin;

alter table public.plans
  add column if not exists discount_percentage smallint,
  add column if not exists is_recommended boolean not null default false,
  add column if not exists sort_order integer not null default 0;

alter table public.plans
  add constraint plans_discount_percentage_valid
    check (discount_percentage is null or discount_percentage between 0 and 100),
  add constraint plans_sort_order_valid
    check (sort_order >= 0);

comment on column public.plans.discount_percentage is
  'Optional promotional discount displayed for this independent offer.';
comment on column public.plans.is_recommended is
  'Controls whether this offer is visually highlighted in plan catalogs.';
comment on column public.plans.sort_order is
  'Controls offer ordering within each billing cadence.';

update public.plans
set discount_percentage = 15
where interval = 'month'
  and coalesce(interval_count, 1) = 3
  and discount_percentage is null;

update public.plans
set is_recommended = true
where lower(btrim(name)) in ('avançado', 'avancado')
  and is_recommended = false;

update public.plans
set sort_order = case
  when lower(btrim(name)) = 'essencial' then 10
  when lower(btrim(name)) in ('avançado', 'avancado') then 20
  else sort_order
end
where sort_order = 0;

create index plans_public_catalog_idx
  on public.plans (interval, interval_count, sort_order, price)
  where is_active and is_public and price > 0;

drop policy if exists "Public can read plans" on public.plans;
drop policy if exists "Anonymous read public plans" on public.plans;
drop policy if exists "Students read public or subscribed plans" on public.plans;

create policy "Anonymous read public plans"
  on public.plans
  for select
  to anon
  using (is_active and is_public);

create policy "Students read public or subscribed plans"
  on public.plans
  for select
  to authenticated
  using (
    (is_active and is_public)
    or exists (
      select 1
      from public.subscriptions as subscription
      where subscription.plan_id = plans.id
        and subscription.user_id = (select auth.uid())
    )
  );

create table public.subscription_credit_allocations (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  contract_id uuid not null references public.subscription_contracts(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  cycle_number smallint not null,
  amount integer not null,
  available_at timestamptz not null,
  status text not null default 'scheduled',
  released_at timestamptz,
  grant_transaction_id uuid references public.credit_transactions(id) on delete restrict,
  expiration_transaction_id uuid references public.credit_transactions(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_credit_allocations_period_valid
    check (billing_period_end > billing_period_start),
  constraint subscription_credit_allocations_cycle_valid
    check (cycle_number between 1 and 3),
  constraint subscription_credit_allocations_amount_valid
    check (amount > 0),
  constraint subscription_credit_allocations_available_at_valid
    check (available_at >= billing_period_start and available_at < billing_period_end),
  constraint subscription_credit_allocations_status_valid
    check (status in ('scheduled', 'released', 'skipped')),
  constraint subscription_credit_allocations_release_valid
    check (
      (status = 'scheduled' and released_at is null and grant_transaction_id is null)
      or (status = 'released' and released_at is not null and grant_transaction_id is not null)
      or status = 'skipped'
    ),
  constraint subscription_credit_allocations_cycle_unique
    unique (subscription_id, contract_id, billing_period_start, cycle_number)
);

create index subscription_credit_allocations_due_idx
  on public.subscription_credit_allocations (available_at, id)
  where status = 'scheduled';

alter table public.subscription_credit_allocations enable row level security;
revoke all on table public.subscription_credit_allocations from public, anon, authenticated;
grant select, insert, update on table public.subscription_credit_allocations to service_role;

create function public.subscription_credit_allocation_available_at(
  p_period_start timestamptz,
  p_cycle_number integer
)
returns timestamptz
language sql
immutable
strict
set search_path = ''
as $$
  select case
    when p_cycle_number between 1 and 3
      then (
        (p_period_start at time zone 'UTC')
        + make_interval(months => p_cycle_number - 1)
      ) at time zone 'UTC'
    else null
  end;
$$;

revoke all on function public.subscription_credit_allocation_available_at(timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.subscription_credit_allocation_available_at(timestamptz, integer)
  to service_role;

create function public.schedule_quarterly_subscription_credit_allocations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract public.subscription_contracts%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_contract_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if new.type not in ('new_subscription', 'subscription_reactivation', 'plan_renewal')
    or new.amount <= 0
    or coalesce(new.metadata ->> 'grant_type', '') not in (
      'subscription_initial_cycle',
      'subscription_reactivation_cycle',
      'subscription_renewal_cycle'
    )
    or coalesce(new.metadata ->> 'terms_source', 'subscription_contract')
      <> 'subscription_contract'
  then
    return new;
  end if;

  v_contract_id := coalesce(
    nullif(new.metadata ->> 'contract_id', '')::uuid,
    nullif(new.metadata ->> 'active_contract_id', '')::uuid
  );

  if v_contract_id is null then
    return new;
  end if;

  select contract.*
  into v_contract
  from public.subscription_contracts as contract
  where contract.id = v_contract_id;

  if not found
    or v_contract.billing_mode <> 'recurring'
    or v_contract.interval <> 'month'
    or v_contract.interval_count <> 3
  then
    return new;
  end if;

  select subscription.*
  into v_subscription
  from public.subscriptions as subscription
  where subscription.id = v_contract.subscription_id;

  if not found or v_subscription.user_id is distinct from new.user_id then
    raise exception 'Contrato trimestral sem assinatura consistente.';
  end if;

  v_period_start := coalesce(
    nullif(new.metadata ->> 'period_start', '')::timestamptz,
    v_subscription.current_period_start
  );
  v_period_end := coalesce(
    nullif(new.metadata ->> 'period_end', '')::timestamptz,
    v_subscription.current_period_end
  );

  if v_period_start is null
    or v_period_end is null
    or v_period_end <= v_period_start
  then
    raise exception 'Período trimestral inválido para agendar créditos mensais.';
  end if;

  insert into public.subscription_credit_allocations (
    subscription_id,
    contract_id,
    user_id,
    plan_id,
    billing_period_start,
    billing_period_end,
    cycle_number,
    amount,
    available_at,
    status,
    released_at,
    grant_transaction_id,
    metadata
  )
  select
    v_subscription.id,
    v_contract.id,
    v_subscription.user_id,
    v_contract.plan_id,
    v_period_start,
    v_period_end,
    cycle_number,
    v_contract.credits_included,
    public.subscription_credit_allocation_available_at(v_period_start, cycle_number),
    case when cycle_number = 1 then 'released' else 'scheduled' end,
    case when cycle_number = 1 then new.created_at else null end,
    case when cycle_number = 1 then new.id else null end,
    jsonb_build_object(
      'source', 'subscription_credit_schedule',
      'billing_interval', v_contract.interval,
      'billing_interval_count', v_contract.interval_count,
      'contract_version', v_contract.version
    )
  from generate_series(1, 3) as cycles(cycle_number)
  where public.subscription_credit_allocation_available_at(v_period_start, cycle_number)
    < v_period_end
  on conflict (subscription_id, contract_id, billing_period_start, cycle_number)
  do nothing;

  return new;
end;
$$;

revoke all on function public.schedule_quarterly_subscription_credit_allocations()
  from public, anon, authenticated;

create trigger schedule_quarterly_subscription_credit_allocations
  after insert on public.credit_transactions
  for each row
  execute function public.schedule_quarterly_subscription_credit_allocations();

create function public.process_due_subscription_credit_allocations(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allocation public.subscription_credit_allocations%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_contract public.subscription_contracts%rowtype;
  v_plan_balance integer;
  v_expiration_transaction_id uuid;
  v_grant_transaction_id uuid;
  v_released_count integer := 0;
  v_skipped_count integer := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 500 then
    raise exception 'Limite inválido.';
  end if;

  for v_allocation in
    select allocation.*
    from public.subscription_credit_allocations as allocation
    where allocation.status = 'scheduled'
      and allocation.available_at <= p_now
    order by allocation.available_at, allocation.id
    for update skip locked
    limit p_limit
  loop
    select subscription.*
    into v_subscription
    from public.subscriptions as subscription
    where subscription.id = v_allocation.subscription_id
    for update;

    select contract.*
    into v_contract
    from public.subscription_contracts as contract
    where contract.id = v_allocation.contract_id;

    if not found
      or v_subscription.id is null
      or v_subscription.status not in ('active', 'trial')
      or v_subscription.plan_id is distinct from v_allocation.plan_id
      or v_contract.status <> 'active'
      or v_contract.subscription_id is distinct from v_subscription.id
      or v_allocation.available_at >= v_allocation.billing_period_end
      or p_now >= v_allocation.available_at + interval '1 month'
    then
      update public.subscription_credit_allocations
      set status = 'skipped', updated_at = now()
      where id = v_allocation.id;

      v_skipped_count := v_skipped_count + 1;
      continue;
    end if;

    select credits.plan_credits
    into v_plan_balance
    from public.student_credits as credits
    where credits.user_id = v_allocation.user_id
    for update;

    v_plan_balance := coalesce(v_plan_balance, 0);
    v_expiration_transaction_id := null;

    if v_plan_balance > 0 then
      insert into public.credit_transactions (
        user_id, type, amount, description, metadata
      ) values (
        v_allocation.user_id,
        'plan_expiration',
        -v_plan_balance,
        format('Expiração de %s crédito(s) restantes do ciclo mensal.', v_plan_balance),
        jsonb_build_object(
          'source', 'subscription_credit_schedule',
          'grant_type', 'monthly_credit_expiration',
          'allocation_id', v_allocation.id,
          'subscription_id', v_allocation.subscription_id,
          'contract_id', v_allocation.contract_id,
          'plan_id', v_allocation.plan_id,
          'cycle_number', v_allocation.cycle_number
        )
      ) returning id into v_expiration_transaction_id;
    end if;

    insert into public.credit_transactions (
      user_id, type, amount, description, metadata
    ) values (
      v_allocation.user_id,
      'plan_renewal',
      v_allocation.amount,
      format('Liberação mensal de %s crédito(s) do plano %s.', v_allocation.amount, v_contract.plan_name),
      jsonb_build_object(
        'source', 'subscription_credit_schedule',
        'grant_type', 'subscription_monthly_credit_release',
        'allocation_id', v_allocation.id,
        'subscription_id', v_allocation.subscription_id,
        'contract_id', v_allocation.contract_id,
        'contract_version', v_contract.version,
        'plan_id', v_allocation.plan_id,
        'plan_name', v_contract.plan_name,
        'cycle_number', v_allocation.cycle_number,
        'billing_period_start', v_allocation.billing_period_start,
        'billing_period_end', v_allocation.billing_period_end
      )
    ) returning id into v_grant_transaction_id;

    update public.subscription_credit_allocations
    set
      status = 'released',
      released_at = p_now,
      grant_transaction_id = v_grant_transaction_id,
      expiration_transaction_id = v_expiration_transaction_id,
      updated_at = now()
    where id = v_allocation.id;

    v_released_count := v_released_count + 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'skipped_count', v_skipped_count,
    'processed_at', p_now
  );
end;
$$;

revoke all on function public.process_due_subscription_credit_allocations(timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.process_due_subscription_credit_allocations(timestamptz, integer)
  to service_role;

commit;

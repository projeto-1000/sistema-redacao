begin;

create table public.subscription_contracts (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid not null references public.subscriptions(id) on delete restrict,
    version integer not null,
    status text not null,
    source text not null,
    billing_mode text not null,
    effective_at timestamptz not null,
    ended_at timestamptz,
    plan_id uuid not null references public.plans(id) on delete restrict,
    plan_name varchar(100) not null,
    price_cents integer not null,
    currency varchar(3) not null default 'BRL',
    credits_included integer not null,
    interval varchar(20) not null,
    interval_count integer,
    credits_expiration_days integer not null,
    provider_plan_id varchar(100),
    provider_subscription_item_id varchar(100),
    benefits_schema_version integer not null default 1,
    benefits_snapshot jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint subscription_contracts_subscription_version_unique
        unique (subscription_id, version),
    constraint subscription_contracts_version_positive
        check (version > 0),
    constraint subscription_contracts_status_valid
        check (status in ('active', 'pending', 'superseded', 'canceled')),
    constraint subscription_contracts_source_valid
        check (source in ('checkout', 'upgrade', 'downgrade', 'backfill', 'free_trial', 'mentorship')),
    constraint subscription_contracts_billing_mode_valid
        check (billing_mode in ('recurring', 'one_time', 'free')),
    constraint subscription_contracts_plan_name_not_blank
        check (length(btrim(plan_name)) > 0),
    constraint subscription_contracts_price_non_negative
        check (price_cents >= 0),
    constraint subscription_contracts_currency_valid
        check (currency ~ '^[A-Z]{3}$'),
    constraint subscription_contracts_credits_non_negative
        check (credits_included >= 0),
    constraint subscription_contracts_interval_valid
        check (interval in ('day', 'week', 'month', 'year', 'lifetime')),
    constraint subscription_contracts_interval_count_consistent
        check (
            (interval = 'lifetime' and interval_count is null)
            or (interval <> 'lifetime' and interval_count > 0)
        ),
    constraint subscription_contracts_credits_expiration_positive
        check (credits_expiration_days > 0),
    constraint subscription_contracts_provider_plan_id_not_blank
        check (provider_plan_id is null or length(btrim(provider_plan_id)) > 0),
    constraint subscription_contracts_provider_item_id_not_blank
        check (
            provider_subscription_item_id is null
            or length(btrim(provider_subscription_item_id)) > 0
        ),
    constraint subscription_contracts_benefits_schema_version_positive
        check (benefits_schema_version > 0),
    constraint subscription_contracts_benefits_snapshot_object
        check (jsonb_typeof(benefits_snapshot) = 'object'),
    constraint subscription_contracts_metadata_object
        check (jsonb_typeof(metadata) = 'object')
);

create index subscription_contracts_subscription_id_idx
    on public.subscription_contracts (subscription_id);

create index subscription_contracts_status_idx
    on public.subscription_contracts (status);

create unique index subscription_contracts_one_active_per_subscription_idx
    on public.subscription_contracts (subscription_id)
    where status = 'active';

create unique index subscription_contracts_one_pending_per_subscription_idx
    on public.subscription_contracts (subscription_id)
    where status = 'pending';

create function public.set_subscription_contract_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

revoke all on function public.set_subscription_contract_updated_at() from public, anon, authenticated;

create trigger set_subscription_contract_updated_at
    before update on public.subscription_contracts
    for each row
    execute function public.set_subscription_contract_updated_at();

alter table public.subscription_contracts enable row level security;

revoke all on table public.subscription_contracts from anon, authenticated;

grant select, insert, update on table public.subscription_contracts to authenticated;
grant select, insert, update on table public.subscription_contracts to service_role;

create policy "Students read their own subscription contracts"
    on public.subscription_contracts
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.subscriptions
            where subscriptions.id = subscription_contracts.subscription_id
              and subscriptions.user_id = auth.uid()
        )
    );

create policy "Admins read subscription contracts"
    on public.subscription_contracts
    for select
    to authenticated
    using (public.get_my_role() = 'ADMIN');

create policy "Admins insert subscription contracts"
    on public.subscription_contracts
    for insert
    to authenticated
    with check (public.get_my_role() = 'ADMIN');

create policy "Admins update subscription contracts"
    on public.subscription_contracts
    for update
    to authenticated
    using (public.get_my_role() = 'ADMIN')
    with check (public.get_my_role() = 'ADMIN');

commit;

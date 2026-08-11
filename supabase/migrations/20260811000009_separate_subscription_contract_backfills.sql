begin;

alter table public.subscription_contracts
    drop constraint subscription_contracts_credits_expiration_positive;

alter table public.subscription_contracts
    add constraint subscription_contracts_credits_expiration_valid
    check (
        (billing_mode = 'free' and credits_expiration_days >= 0)
        or (billing_mode <> 'free' and credits_expiration_days > 0)
    );

create or replace function public.backfill_subscription_contracts(
    p_apply boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_from_history bigint := 0;
    v_from_fallback bigint := 0;
    v_insufficient bigint := 0;
    v_inserted_from_history bigint := 0;
    v_inserted_from_fallback bigint := 0;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext('subscription_contracts_paid_backfill')
    );

    with candidates as (
        select
            subscription.id as subscription_id,
            plan.id as plan_id,
            plan.name as plan_name,
            plan.price as plan_price,
            plan.credits_included as plan_credits,
            plan.interval,
            plan.interval_count,
            plan.credits_expiration_days,
            plan.external_id as plan_external_id,
            subscription.status as subscription_status,
            subscription.current_period_start,
            subscription.created_at as subscription_created_at,
            subscription.canceled_at,
            subscription.provider_canceled_at,
            subscription.external_id as subscription_external_id,
            subscription.metadata as subscription_metadata,
            recurring_payment.id as recurring_payment_id,
            recurring_payment.amount as recurring_price,
            recurring_payment.credits_amount as recurring_credits,
            recurring_payment.paid_at as recurring_paid_at,
            recurring_payment.created_at as recurring_created_at
        from public.subscriptions as subscription
        left join public.plans as plan
            on plan.id = subscription.plan_id
        left join lateral (
            select payment.*
            from public.student_payments as payment
            where payment.subscription_id = subscription.id
              and payment.plan_id = subscription.plan_id
              and payment.kind = 'subscription'
              and payment.provider = 'pagarme'
              and payment.status in ('paid', 'active')
              and payment.amount > 0
              and payment.credits_amount is not null
              and payment.credits_amount >= 0
            order by
                coalesce(payment.paid_at, payment.created_at) desc,
                payment.id desc
            limit 1
        ) as recurring_payment on true
        where not exists (
            select 1
            from public.subscription_contracts as contract
            where contract.subscription_id = subscription.id
        )
          and (
              subscription.metadata ->> 'provider' = 'pagarme'
              or left(subscription.external_id, 4) = 'sub_'
              or recurring_payment.id is not null
          )
    ), classified as (
        select
            candidates.*,
            case
                when plan_id is not null
                    and plan_name is not null
                    and btrim(plan_name) <> ''
                    and plan_price > 0
                    and plan_credits >= 0
                    and interval in ('day', 'week', 'month', 'year')
                    and (interval_count is null or interval_count > 0)
                    and credits_expiration_days > 0
                    then case
                        when recurring_payment_id is not null then 'history'
                        else 'fallback'
                    end
                else 'insufficient'
            end as strategy
        from candidates
    )
    select
        count(*) filter (where strategy = 'history'),
        count(*) filter (where strategy = 'fallback'),
        count(*) filter (where strategy = 'insufficient')
    into v_from_history, v_from_fallback, v_insufficient
    from classified;

    if p_apply then
        with candidates as (
            select
                subscription.id as subscription_id,
                plan.id as plan_id,
                plan.name as plan_name,
                plan.price as plan_price,
                plan.credits_included as plan_credits,
                plan.interval,
                plan.interval_count,
                plan.credits_expiration_days,
                plan.external_id as plan_external_id,
                subscription.status as subscription_status,
                subscription.current_period_start,
                subscription.created_at as subscription_created_at,
                subscription.canceled_at,
                subscription.provider_canceled_at,
                subscription.external_id as subscription_external_id,
                subscription.metadata as subscription_metadata,
                recurring_payment.id as recurring_payment_id,
                recurring_payment.amount as recurring_price,
                recurring_payment.credits_amount as recurring_credits,
                recurring_payment.paid_at as recurring_paid_at,
                recurring_payment.created_at as recurring_created_at
            from public.subscriptions as subscription
            left join public.plans as plan
                on plan.id = subscription.plan_id
            left join lateral (
                select payment.*
                from public.student_payments as payment
                where payment.subscription_id = subscription.id
                  and payment.plan_id = subscription.plan_id
                  and payment.kind = 'subscription'
                  and payment.provider = 'pagarme'
                  and payment.status in ('paid', 'active')
                  and payment.amount > 0
                  and payment.credits_amount is not null
                  and payment.credits_amount >= 0
                order by
                    coalesce(payment.paid_at, payment.created_at) desc,
                    payment.id desc
                limit 1
            ) as recurring_payment on true
            where not exists (
                select 1
                from public.subscription_contracts as contract
                where contract.subscription_id = subscription.id
            )
              and (
                  subscription.metadata ->> 'provider' = 'pagarme'
                  or left(subscription.external_id, 4) = 'sub_'
                  or recurring_payment.id is not null
              )
        ), classified as (
            select
                candidates.*,
                case
                    when plan_id is not null
                        and plan_name is not null
                        and btrim(plan_name) <> ''
                        and plan_price > 0
                        and plan_credits >= 0
                        and interval in ('day', 'week', 'month', 'year')
                        and (interval_count is null or interval_count > 0)
                        and credits_expiration_days > 0
                        then case
                            when recurring_payment_id is not null then 'history'
                            else 'fallback'
                        end
                    else 'insufficient'
                end as strategy
            from candidates
        ), inserted as (
            insert into public.subscription_contracts (
                subscription_id,
                version,
                status,
                source,
                billing_mode,
                effective_at,
                ended_at,
                plan_id,
                plan_name,
                price_cents,
                currency,
                credits_included,
                interval,
                interval_count,
                credits_expiration_days,
                provider_plan_id,
                provider_subscription_item_id,
                benefits_snapshot,
                metadata
            )
            select
                classified.subscription_id,
                1,
                case
                    when classified.subscription_status = 'canceled'
                        then 'canceled'
                    else 'active'
                end,
                'backfill',
                'recurring',
                coalesce(
                    classified.recurring_paid_at,
                    classified.recurring_created_at,
                    classified.current_period_start,
                    classified.subscription_created_at,
                    now()
                ),
                case
                    when classified.subscription_status = 'canceled'
                        then coalesce(
                            classified.canceled_at,
                            classified.provider_canceled_at,
                            now()
                        )
                    else null
                end,
                classified.plan_id,
                classified.plan_name,
                coalesce(
                    classified.recurring_price,
                    classified.plan_price
                ),
                'BRL',
                coalesce(
                    classified.recurring_credits,
                    classified.plan_credits
                ),
                classified.interval,
                classified.interval_count,
                classified.credits_expiration_days,
                case
                    when left(classified.plan_external_id, 5) = 'plan_'
                        then classified.plan_external_id
                    else null
                end,
                case
                    when left(
                        classified.subscription_metadata
                            ->> 'pagarme_subscription_item_id',
                        3
                    ) = 'si_'
                        then classified.subscription_metadata
                            ->> 'pagarme_subscription_item_id'
                    else null
                end,
                '{}'::jsonb,
                jsonb_build_object(
                    'provider_subscription_id',
                    classified.subscription_external_id,
                    'backfill_strategy',
                    classified.strategy,
                    'recurring_payment_id',
                    classified.recurring_payment_id,
                    'reconciliation_required',
                    classified.strategy = 'fallback',
                    'fallback_reason',
                    case
                        when classified.strategy = 'fallback'
                            then 'no_valid_recurring_payment_for_current_plan'
                        else null
                    end,
                    'price_and_credits_source',
                    case
                        when classified.strategy = 'history'
                            then 'last_valid_recurring_payment'
                        else 'current_plan_fallback'
                    end
                )
            from classified
            where classified.strategy in ('history', 'fallback')
            on conflict do nothing
            returning metadata ->> 'backfill_strategy' as strategy
        )
        select
            count(*) filter (where strategy = 'history'),
            count(*) filter (where strategy = 'fallback')
        into v_inserted_from_history, v_inserted_from_fallback
        from inserted;
    end if;

    return jsonb_build_object(
        'scope', 'paid_recurring',
        'dry_run', not p_apply,
        'from_recurring_history', v_from_history,
        'from_current_plan_fallback', v_from_fallback,
        'without_sufficient_data', v_insufficient,
        'eligible_total', v_from_history + v_from_fallback,
        'inserted_from_history', v_inserted_from_history,
        'inserted_from_fallback', v_inserted_from_fallback,
        'inserted', v_inserted_from_history + v_inserted_from_fallback
    );
end;
$$;

revoke all on function public.backfill_subscription_contracts(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_subscription_contracts(boolean)
to service_role;

create or replace function public.backfill_free_trial_subscription_contracts(
    p_apply boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_trials_ready bigint := 0;
    v_insufficient bigint := 0;
    v_inserted bigint := 0;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext('subscription_contracts_free_trial_backfill')
    );

    with candidates as (
        select
            subscription.id as subscription_id,
            subscription.status as subscription_status,
            subscription.current_period_start,
            subscription.created_at as subscription_created_at,
            subscription.external_id as subscription_external_id,
            subscription.metadata as subscription_metadata,
            plan.id as plan_id,
            plan.name as plan_name,
            plan.price as plan_price,
            plan.credits_included as plan_credits,
            plan.interval,
            plan.interval_count,
            plan.credits_expiration_days,
            plan.features
        from public.subscriptions as subscription
        left join public.plans as plan
            on plan.id = subscription.plan_id
        where subscription.metadata ->> 'provider' = 'internal'
          and subscription.metadata ->> 'subscription_type' = 'free_trial'
          and not exists (
              select 1
              from public.subscription_contracts as contract
              where contract.subscription_id = subscription.id
          )
    ), classified as (
        select
            candidates.*,
            case
                when plan_id is not null
                    and plan_name is not null
                    and btrim(plan_name) <> ''
                    and plan_price = 0
                    and plan_credits >= 0
                    and subscription_status in ('active', 'trial')
                    and interval in ('day', 'week', 'month', 'year', 'lifetime')
                    and (interval_count is null or interval_count > 0)
                    and credits_expiration_days >= 0
                    then 'ready'
                else 'insufficient'
            end as strategy
        from candidates
    )
    select
        count(*) filter (where strategy = 'ready'),
        count(*) filter (where strategy = 'insufficient')
    into v_trials_ready, v_insufficient
    from classified;

    if p_apply then
        with candidates as (
            select
                subscription.id as subscription_id,
                subscription.status as subscription_status,
                subscription.current_period_start,
                subscription.created_at as subscription_created_at,
                subscription.external_id as subscription_external_id,
                subscription.metadata as subscription_metadata,
                plan.id as plan_id,
                plan.name as plan_name,
                plan.price as plan_price,
                plan.credits_included as plan_credits,
                plan.interval,
                plan.interval_count,
                plan.credits_expiration_days,
                plan.features
            from public.subscriptions as subscription
            left join public.plans as plan
                on plan.id = subscription.plan_id
            where subscription.metadata ->> 'provider' = 'internal'
              and subscription.metadata ->> 'subscription_type' = 'free_trial'
              and not exists (
                  select 1
                  from public.subscription_contracts as contract
                  where contract.subscription_id = subscription.id
              )
        ), classified as (
            select
                candidates.*,
                case
                    when plan_id is not null
                        and plan_name is not null
                        and btrim(plan_name) <> ''
                        and plan_price = 0
                        and plan_credits >= 0
                        and subscription_status in ('active', 'trial')
                        and interval in (
                            'day',
                            'week',
                            'month',
                            'year',
                            'lifetime'
                        )
                        and (interval_count is null or interval_count > 0)
                        and credits_expiration_days >= 0
                        then 'ready'
                    else 'insufficient'
                end as strategy
            from candidates
        ), inserted as (
            insert into public.subscription_contracts (
                subscription_id,
                version,
                status,
                source,
                billing_mode,
                effective_at,
                ended_at,
                plan_id,
                plan_name,
                price_cents,
                currency,
                credits_included,
                interval,
                interval_count,
                credits_expiration_days,
                provider_plan_id,
                provider_subscription_item_id,
                benefits_snapshot,
                metadata
            )
            select
                classified.subscription_id,
                1,
                'active',
                'free_trial',
                'free',
                coalesce(
                    classified.current_period_start,
                    classified.subscription_created_at,
                    now()
                ),
                null,
                classified.plan_id,
                classified.plan_name,
                classified.plan_price,
                'BRL',
                classified.plan_credits,
                classified.interval,
                classified.interval_count,
                classified.credits_expiration_days,
                null,
                null,
                jsonb_build_object(
                    'features',
                    coalesce(to_jsonb(classified.features), '[]'::jsonb)
                ),
                jsonb_build_object(
                    'provider', 'internal',
                    'provider_subscription_id',
                    classified.subscription_external_id,
                    'backfill_strategy', 'free_trial_current_plan',
                    'creation_flow', 'backfill_existing_free_trial',
                    'free_credit_expires_at',
                    classified.subscription_metadata
                        ->> 'free_credit_expires_at',
                    'reconciliation_required', false
                )
            from classified
            where classified.strategy = 'ready'
            on conflict do nothing
            returning id
        )
        select count(*) into v_inserted from inserted;
    end if;

    return jsonb_build_object(
        'scope', 'free_trial',
        'dry_run', not p_apply,
        'trials_ready', v_trials_ready,
        'trials_without_sufficient_data', v_insufficient,
        'eligible_total', v_trials_ready,
        'trials_created', v_inserted,
        'inserted', v_inserted
    );
end;
$$;

revoke all on function public.backfill_free_trial_subscription_contracts(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_free_trial_subscription_contracts(boolean)
to service_role;

commit;

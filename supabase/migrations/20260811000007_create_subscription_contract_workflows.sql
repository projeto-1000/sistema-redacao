begin;

alter table public.subscription_contracts
    drop constraint subscription_contracts_interval_count_consistent;

alter table public.subscription_contracts
    add constraint subscription_contracts_interval_count_consistent
    check (interval_count is null or interval_count > 0);

create function public.finalize_checkout_subscription(
    p_user_id uuid,
    p_plan_id uuid,
    p_plan_name text,
    p_price_cents integer,
    p_currency text,
    p_credits_included integer,
    p_interval text,
    p_interval_count integer,
    p_credits_expiration_days integer,
    p_provider_plan_id text,
    p_provider_subscription_item_id text,
    p_provider_subscription_id text,
    p_subscription_status text,
    p_current_period_start timestamptz,
    p_current_period_end timestamptz,
    p_next_billing_at timestamptz,
    p_payment_method text,
    p_payment_card_id uuid,
    p_subscription_metadata jsonb,
    p_payment_status text,
    p_paid_at timestamptz,
    p_effective_at timestamptz,
    p_checkout_operation text,
    p_previous_subscription_external_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription public.subscriptions%rowtype;
    v_existing_payment public.student_payments%rowtype;
    v_active_contract public.subscription_contracts%rowtype;
    v_contract_id uuid;
    v_contract_version integer;
    v_payment_id uuid;
    v_credit_transaction_id uuid;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    if p_user_id is null or p_plan_id is null then
        raise exception 'Aluno e plano são obrigatórios.';
    end if;

    if not exists (select 1 from public.plans where id = p_plan_id) then
        raise exception 'Plano não encontrado.';
    end if;

    if p_plan_name is null or btrim(p_plan_name) = '' then
        raise exception 'Nome do plano inválido.';
    end if;

    if p_price_cents is null or p_price_cents <= 0 then
        raise exception 'Preço do checkout inválido.';
    end if;

    if p_credits_included is null or p_credits_included < 0 then
        raise exception 'Quantidade de créditos inválida.';
    end if;

    if p_credits_expiration_days is null or p_credits_expiration_days <= 0 then
        raise exception 'Validade dos créditos inválida.';
    end if;

    if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
        raise exception 'Moeda inválida.';
    end if;

    if p_interval not in ('day', 'week', 'month', 'year', 'lifetime')
        or (p_interval_count is not null and p_interval_count <= 0)
    then
        raise exception 'Intervalo contratual inválido.';
    end if;

    if p_provider_plan_id is null or p_provider_plan_id !~ '^plan_' then
        raise exception 'Plano da Pagar.me inválido.';
    end if;

    if p_provider_subscription_id is null or p_provider_subscription_id !~ '^sub_' then
        raise exception 'Assinatura da Pagar.me inválida.';
    end if;

    if p_provider_subscription_item_id is not null
        and p_provider_subscription_item_id !~ '^si_'
    then
        raise exception 'Item da assinatura Pagar.me inválido.';
    end if;

    if p_subscription_status not in ('active', 'trial', 'past_due', 'canceled', 'unpaid') then
        raise exception 'Status da assinatura inválido.';
    end if;

    if p_payment_method not in ('credit_card', 'debit_card', 'boleto') then
        raise exception 'Método de pagamento inválido.';
    end if;

    if p_payment_status is null or btrim(p_payment_status) = '' then
        raise exception 'Status do pagamento inválido.';
    end if;

    if p_effective_at is null then
        raise exception 'Início de vigência não informado.';
    end if;

    if p_checkout_operation not in ('new_subscription', 'subscription_reactivation') then
        raise exception 'Operação de checkout inválida.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_user_id::text, 0)
    );

    select payment.*
    into v_existing_payment
    from public.student_payments as payment
    where payment.provider = 'pagarme'
      and payment.external_id = p_provider_subscription_id
    limit 1;

    if found then
        select subscription.*
        into v_subscription
        from public.subscriptions as subscription
        where subscription.id = v_existing_payment.subscription_id;

        select contract.id, contract.version
        into v_contract_id, v_contract_version
        from public.subscription_contracts as contract
        where contract.subscription_id = v_subscription.id
          and contract.metadata ->> 'provider_subscription_id' = p_provider_subscription_id
        order by contract.version desc
        limit 1;

        if v_subscription.id is null or v_contract_id is null then
            raise exception 'Checkout existente sem contrato consistente.';
        end if;

        return jsonb_build_object(
            'success', true,
            'duplicate', true,
            'subscription_id', v_subscription.id,
            'contract_id', v_contract_id,
            'contract_version', v_contract_version,
            'payment_id', v_existing_payment.id,
            'credit_transaction_id', null
        );
    end if;

    select subscription.*
    into v_subscription
    from public.subscriptions as subscription
    where subscription.user_id = p_user_id
    for update;

    if found then
        update public.subscriptions
        set
            plan_id = p_plan_id,
            status = p_subscription_status::public.subscription_status,
            current_period_start = p_current_period_start,
            current_period_end = p_current_period_end,
            next_billing_at = p_next_billing_at,
            cancel_at_period_end = false,
            pending_plan_id = null,
            pending_change_type = null,
            pending_change_at = null,
            cancellation_requested_at = null,
            cancellation_effective_at = null,
            cancellation_reason = null,
            cancellation_provider_status = null,
            provider_canceled_at = null,
            canceled_at = null,
            cancellation_metadata = '{}'::jsonb,
            external_id = p_provider_subscription_id,
            payment_method = p_payment_method,
            payment_card_id = p_payment_card_id,
            metadata = coalesce(p_subscription_metadata, '{}'::jsonb),
            updated_at = now()
        where id = v_subscription.id
        returning * into v_subscription;
    else
        insert into public.subscriptions (
            user_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            next_billing_at,
            cancel_at_period_end,
            external_id,
            payment_method,
            payment_card_id,
            metadata,
            updated_at
        )
        values (
            p_user_id,
            p_plan_id,
            p_subscription_status::public.subscription_status,
            p_current_period_start,
            p_current_period_end,
            p_next_billing_at,
            false,
            p_provider_subscription_id,
            p_payment_method,
            p_payment_card_id,
            coalesce(p_subscription_metadata, '{}'::jsonb),
            now()
        )
        returning * into v_subscription;
    end if;

    select contract.*
    into v_active_contract
    from public.subscription_contracts as contract
    where contract.subscription_id = v_subscription.id
      and contract.status = 'active'
    for update;

    if found
        and v_active_contract.metadata ->> 'provider_subscription_id'
            = p_provider_subscription_id
    then
        if v_active_contract.plan_id is distinct from p_plan_id
            or v_active_contract.plan_name is distinct from p_plan_name
            or v_active_contract.price_cents is distinct from p_price_cents
            or v_active_contract.currency is distinct from p_currency
            or v_active_contract.credits_included is distinct from p_credits_included
            or v_active_contract.interval is distinct from p_interval
            or v_active_contract.interval_count is distinct from p_interval_count
            or v_active_contract.credits_expiration_days
                is distinct from p_credits_expiration_days
        then
            raise exception 'O contrato existente diverge dos termos do checkout.';
        end if;

        v_contract_id := v_active_contract.id;
        v_contract_version := v_active_contract.version;
    else
        if v_active_contract.id is not null then
            update public.subscription_contracts
            set
                status = 'superseded',
                ended_at = p_effective_at
            where id = v_active_contract.id;
        end if;

        select coalesce(max(contract.version), 0) + 1
        into v_contract_version
        from public.subscription_contracts as contract
        where contract.subscription_id = v_subscription.id;

        insert into public.subscription_contracts (
            subscription_id,
            version,
            status,
            source,
            billing_mode,
            effective_at,
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
        values (
            v_subscription.id,
            v_contract_version,
            'active',
            'checkout',
            'recurring',
            p_effective_at,
            p_plan_id,
            p_plan_name,
            p_price_cents,
            p_currency,
            p_credits_included,
            p_interval,
            p_interval_count,
            p_credits_expiration_days,
            p_provider_plan_id,
            p_provider_subscription_item_id,
            '{}'::jsonb,
            jsonb_build_object(
                'provider', 'pagarme',
                'provider_subscription_id', p_provider_subscription_id,
                'checkout_operation', p_checkout_operation,
                'previous_subscription_external_id', p_previous_subscription_external_id
            )
        )
        returning id into v_contract_id;
    end if;

    insert into public.student_payments (
        user_id,
        subscription_id,
        plan_id,
        payment_card_id,
        kind,
        provider,
        external_id,
        amount,
        credits_amount,
        status,
        payment_method,
        paid_at,
        idempotency_key,
        metadata
    )
    values (
        p_user_id,
        v_subscription.id,
        p_plan_id,
        p_payment_card_id,
        'subscription',
        'pagarme',
        p_provider_subscription_id,
        p_price_cents,
        p_credits_included,
        p_payment_status,
        p_payment_method,
        p_paid_at,
        'pagarme-checkout:' || p_provider_subscription_id,
        jsonb_build_object(
            'provider', 'pagarme',
            'pagarme_subscription_id', p_provider_subscription_id,
            'contract_id', v_contract_id,
            'contract_version', v_contract_version,
            'checkout_operation', p_checkout_operation,
            'previous_subscription_external_id', p_previous_subscription_external_id,
            'current_period_start', p_current_period_start,
            'current_period_end', p_current_period_end,
            'next_billing_at', p_next_billing_at
        )
    )
    returning id into v_payment_id;

    if p_subscription_status = 'active' and p_credits_included > 0 then
        insert into public.credit_transactions (
            user_id,
            type,
            amount,
            description,
            student_payment_id,
            metadata
        )
        values (
            p_user_id,
            p_checkout_operation::public.transaction_type,
            p_credits_included,
            case
                when p_checkout_operation = 'subscription_reactivation'
                    then format(
                        'Liberação de %s crédito(s) pela reativação do plano %s.',
                        p_credits_included,
                        p_plan_name
                    )
                else format(
                    'Liberação de %s crédito(s) do plano %s.',
                    p_credits_included,
                    p_plan_name
                )
            end,
            v_payment_id,
            jsonb_build_object(
                'source', 'checkout',
                'grant_type', case
                    when p_checkout_operation = 'subscription_reactivation'
                        then 'subscription_reactivation_cycle'
                    else 'subscription_initial_cycle'
                end,
                'checkout_operation', p_checkout_operation,
                'subscription_id', v_subscription.id,
                'contract_id', v_contract_id,
                'contract_version', v_contract_version,
                'previous_subscription_external_id', p_previous_subscription_external_id,
                'plan_id', p_plan_id,
                'plan_name', p_plan_name,
                'interval', p_interval,
                'interval_count', p_interval_count,
                'credits_expiration_days', p_credits_expiration_days
            )
        )
        returning id into v_credit_transaction_id;
    end if;

    return jsonb_build_object(
        'success', true,
        'duplicate', false,
        'subscription_id', v_subscription.id,
        'contract_id', v_contract_id,
        'contract_version', v_contract_version,
        'payment_id', v_payment_id,
        'credit_transaction_id', v_credit_transaction_id
    );
end;
$$;

revoke all on function public.finalize_checkout_subscription(
    uuid, uuid, text, integer, text, integer, text, integer, integer,
    text, text, text, text, timestamptz, timestamptz, timestamptz,
    text, uuid, jsonb, text, timestamptz, timestamptz, text, text
) from public, anon, authenticated;

grant execute on function public.finalize_checkout_subscription(
    uuid, uuid, text, integer, text, integer, text, integer, integer,
    text, text, text, text, timestamptz, timestamptz, timestamptz,
    text, uuid, jsonb, text, timestamptz, timestamptz, text, text
) to service_role;

create function public.create_free_trial_subscription_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_plan public.plans%rowtype;
begin
    if new.metadata ->> 'provider' <> 'internal'
        or new.metadata ->> 'subscription_type' <> 'free_trial'
    then
        return new;
    end if;

    select plan.*
    into v_plan
    from public.plans as plan
    where plan.id = new.plan_id;

    if not found then
        raise exception 'Plano gratuito não encontrado para o contrato.';
    end if;

    insert into public.subscription_contracts (
        subscription_id,
        version,
        status,
        source,
        billing_mode,
        effective_at,
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
    values (
        new.id,
        1,
        'active',
        'free_trial',
        'free',
        coalesce(new.current_period_start, new.created_at, now()),
        v_plan.id,
        v_plan.name,
        v_plan.price,
        'BRL',
        v_plan.credits_included,
        v_plan.interval,
        v_plan.interval_count,
        v_plan.credits_expiration_days,
        null,
        null,
        jsonb_build_object('features', coalesce(to_jsonb(v_plan.features), '[]'::jsonb)),
        jsonb_build_object(
            'provider', 'internal',
            'provider_subscription_id', new.external_id,
            'creation_flow', 'automatic_free_trial'
        )
    )
    on conflict (subscription_id, version) do nothing;

    return new;
end;
$$;

revoke all on function public.create_free_trial_subscription_contract()
from public, anon, authenticated;

create trigger create_free_trial_subscription_contract
    after insert on public.subscriptions
    for each row
    when (
        new.metadata ->> 'provider' = 'internal'
        and new.metadata ->> 'subscription_type' = 'free_trial'
    )
    execute function public.create_free_trial_subscription_contract();

create function public.backfill_subscription_contracts(p_apply boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_from_history bigint := 0;
    v_from_fallback bigint := 0;
    v_insufficient bigint := 0;
    v_inserted bigint := 0;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext('subscription_contracts_backfill')
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
        left join public.plans as plan on plan.id = subscription.plan_id
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
            order by coalesce(payment.paid_at, payment.created_at) desc, payment.id desc
            limit 1
        ) as recurring_payment on true
        where not exists (
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
                    and plan_price >= 0
                    and plan_credits >= 0
                    and interval in ('day', 'week', 'month', 'year', 'lifetime')
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
            left join public.plans as plan on plan.id = subscription.plan_id
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
                order by coalesce(payment.paid_at, payment.created_at) desc, payment.id desc
                limit 1
            ) as recurring_payment on true
            where not exists (
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
                        and plan_price >= 0
                        and plan_credits >= 0
                        and interval in ('day', 'week', 'month', 'year', 'lifetime')
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
                    when classified.subscription_status = 'canceled' then 'canceled'
                    else 'active'
                end,
                'backfill',
                case
                    when coalesce(classified.recurring_price, classified.plan_price) = 0 then 'free'
                    when classified.interval = 'lifetime' then 'one_time'
                    else 'recurring'
                end,
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
                coalesce(classified.recurring_price, classified.plan_price),
                'BRL',
                coalesce(classified.recurring_credits, classified.plan_credits),
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
                        classified.subscription_metadata ->> 'pagarme_subscription_item_id',
                        3
                    ) = 'si_'
                        then classified.subscription_metadata ->> 'pagarme_subscription_item_id'
                    else null
                end,
                '{}'::jsonb,
                jsonb_build_object(
                    'provider_subscription_id', classified.subscription_external_id,
                    'backfill_strategy', classified.strategy,
                    'recurring_payment_id', classified.recurring_payment_id,
                    'reconciliation_required', classified.strategy = 'fallback',
                    'fallback_reason', case
                        when classified.strategy = 'fallback'
                            then 'no_valid_recurring_payment_for_current_plan'
                        else null
                    end,
                    'price_and_credits_source', case
                        when classified.strategy = 'history'
                            then 'last_valid_recurring_payment'
                        else 'current_plan_fallback'
                    end
                )
            from classified
            where classified.strategy in ('history', 'fallback')
            on conflict do nothing
            returning id
        )
        select count(*) into v_inserted from inserted;
    end if;

    return jsonb_build_object(
        'dry_run', not p_apply,
        'from_recurring_history', v_from_history,
        'from_current_plan_fallback', v_from_fallback,
        'without_sufficient_data', v_insufficient,
        'eligible_total', v_from_history + v_from_fallback,
        'inserted', v_inserted
    );
end;
$$;

revoke all on function public.backfill_subscription_contracts(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_subscription_contracts(boolean)
to service_role;

commit;

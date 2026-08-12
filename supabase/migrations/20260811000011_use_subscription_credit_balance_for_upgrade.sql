begin;

drop function public.finalize_plan_upgrade(
    uuid, uuid, uuid, uuid, uuid, integer, integer, text, text, text,
    timestamptz, text, timestamptz, timestamptz
);

create function public.finalize_plan_upgrade(
    p_user_id uuid,
    p_subscription_id uuid,
    p_payment_id uuid,
    p_expected_current_plan_id uuid,
    p_expected_current_contract_id uuid,
    p_target_plan_id uuid,
    p_original_amount integer,
    p_financial_credit integer,
    p_prorated_amount integer,
    p_additional_credits integer,
    p_remaining_subscription_credits integer,
    p_target_plan_name text,
    p_target_plan_price integer,
    p_target_plan_credits integer,
    p_target_plan_interval text,
    p_target_plan_interval_count integer,
    p_target_plan_credits_expiration_days integer,
    p_target_provider_plan_id text,
    p_order_external_id text,
    p_order_status text,
    p_charge_external_id text,
    p_paid_at timestamptz,
    p_subscription_item_external_id text,
    p_current_period_start timestamptz,
    p_current_period_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription public.subscriptions%rowtype;
    v_payment public.student_payments%rowtype;
    v_active_contract public.subscription_contracts%rowtype;
    v_target_plan public.plans%rowtype;
    v_plan_credits integer;
    v_calculated_amount integer;
    v_contract_id uuid;
    v_contract_version integer;
    v_credit_transaction_id uuid;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    if p_user_id is null
        or p_subscription_id is null
        or p_payment_id is null
        or p_expected_current_contract_id is null
    then
        raise exception 'Dados obrigatórios do upgrade não informados.';
    end if;

    if p_original_amount <= 0
        or p_prorated_amount <= 0
        or p_financial_credit < 0
        or p_original_amount - p_financial_credit <> p_prorated_amount
    then
        raise exception 'Valores financeiros do upgrade são inválidos.';
    end if;

    if p_remaining_subscription_credits < 0 or p_additional_credits <= 0 then
        raise exception 'Reconciliação de créditos do upgrade inválida.';
    end if;

    if p_order_external_id is null or btrim(p_order_external_id) = '' then
        raise exception 'O pedido da Pagar.me é obrigatório.';
    end if;

    select subscription.*
    into v_subscription
    from public.subscriptions as subscription
    where subscription.id = p_subscription_id
      and subscription.user_id = p_user_id
    for update;

    if not found then
        raise exception 'Assinatura não encontrada.';
    end if;

    select payment.*
    into v_payment
    from public.student_payments as payment
    where payment.id = p_payment_id
      and payment.user_id = p_user_id
      and payment.subscription_id = p_subscription_id
      and payment.plan_id = p_target_plan_id
      and payment.kind = 'plan_upgrade_prorata'
    for update;

    if not found then
        raise exception 'Pagamento do upgrade não encontrado.';
    end if;

    if v_subscription.plan_id = p_target_plan_id
        and v_payment.status in ('paid', 'active')
    then
        select contract.id, contract.version
        into v_contract_id, v_contract_version
        from public.subscription_contracts as contract
        where contract.subscription_id = p_subscription_id
          and contract.status = 'active'
          and contract.plan_id = p_target_plan_id
          and contract.metadata ->> 'upgrade_payment_id' = p_payment_id::text
        limit 1;

        if v_contract_id is null then
            raise exception 'Upgrade processado sem contrato ativo compatível.';
        end if;

        select transaction.id
        into v_credit_transaction_id
        from public.credit_transactions as transaction
        where transaction.student_payment_id = p_payment_id
          and transaction.type = 'plan_change'
        limit 1;

        return jsonb_build_object(
            'success', true,
            'already_processed', true,
            'subscription_id', p_subscription_id,
            'payment_id', p_payment_id,
            'contract_id', v_contract_id,
            'contract_version', v_contract_version,
            'credit_transaction_id', v_credit_transaction_id
        );
    end if;

    if v_subscription.plan_id <> p_expected_current_plan_id then
        raise exception 'O plano atual da assinatura foi alterado durante a operação.';
    end if;

    if v_subscription.current_period_start is distinct from p_current_period_start
        or v_subscription.current_period_end is distinct from p_current_period_end
        or v_subscription.current_period_end <= now()
    then
        raise exception 'O ciclo atual da assinatura foi alterado ou encerrado.';
    end if;

    if v_subscription.status not in ('active', 'trial')
        or coalesce(v_subscription.cancel_at_period_end, false)
    then
        raise exception 'A assinatura atual não permite upgrade.';
    end if;

    if v_payment.status not in ('paid', 'active')
        or v_payment.external_id is distinct from p_order_external_id
    then
        raise exception 'O pagamento do upgrade ainda não foi confirmado.';
    end if;

    select credits.plan_credits
    into v_plan_credits
    from public.student_credits as credits
    where credits.user_id = p_user_id
    for update;

    if not found or v_plan_credits <> p_remaining_subscription_credits then
        raise exception 'O saldo de créditos da assinatura mudou durante o upgrade.';
    end if;

    select contract.*
    into v_active_contract
    from public.subscription_contracts as contract
    where contract.id = p_expected_current_contract_id
      and contract.subscription_id = p_subscription_id
      and contract.status = 'active'
    for update;

    if not found
        or v_active_contract.plan_id <> p_expected_current_plan_id
        or v_active_contract.price_cents <= 0
        or v_active_contract.credits_included <= 0
        or p_remaining_subscription_credits > v_active_contract.credits_included
    then
        raise exception 'O contrato ativo não corresponde aos termos reservados.';
    end if;

    select plan.*
    into v_target_plan
    from public.plans as plan
    where plan.id = p_target_plan_id
      and plan.is_active = true
      and plan.is_public = true;

    if not found
        or v_target_plan.name is distinct from p_target_plan_name
        or v_target_plan.price is distinct from p_target_plan_price
        or v_target_plan.credits_included is distinct from p_target_plan_credits
        or v_target_plan.interval is distinct from p_target_plan_interval
        or v_target_plan.interval_count is distinct from p_target_plan_interval_count
        or v_target_plan.credits_expiration_days
            is distinct from p_target_plan_credits_expiration_days
        or v_target_plan.external_id is distinct from p_target_provider_plan_id
    then
        raise exception 'Os termos do novo plano mudaram durante o upgrade.';
    end if;

    if p_target_plan_price <= v_active_contract.price_cents
        or p_target_plan_credits <= v_active_contract.credits_included
        or p_target_plan_interval <> v_active_contract.interval
        or coalesce(p_target_plan_interval_count, 1)
            <> coalesce(v_active_contract.interval_count, 1)
    then
        raise exception 'A alteração solicitada não é um upgrade válido.';
    end if;

    v_calculated_amount := greatest(
        round(
            p_target_plan_price::numeric
            - (
                p_remaining_subscription_credits::numeric
                * v_active_contract.price_cents::numeric
                / v_active_contract.credits_included::numeric
            )
        )::integer,
        0
    );

    if p_original_amount <> p_target_plan_price
        or p_prorated_amount <> v_calculated_amount
        or p_financial_credit <> p_target_plan_price - v_calculated_amount
        or p_additional_credits <> p_target_plan_credits - p_remaining_subscription_credits
        or v_payment.amount <> p_prorated_amount
        or v_payment.credits_amount <> p_additional_credits
    then
        raise exception 'A reserva não corresponde ao cálculo do upgrade.';
    end if;

    update public.subscription_contracts
    set
        status = 'superseded',
        ended_at = coalesce(p_paid_at, now())
    where id = v_active_contract.id;

    select coalesce(max(contract.version), 0) + 1
    into v_contract_version
    from public.subscription_contracts as contract
    where contract.subscription_id = p_subscription_id;

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
        p_subscription_id,
        v_contract_version,
        'active',
        'upgrade',
        'recurring',
        coalesce(p_paid_at, now()),
        p_target_plan_id,
        p_target_plan_name,
        p_target_plan_price,
        'BRL',
        p_target_plan_credits,
        p_target_plan_interval,
        p_target_plan_interval_count,
        p_target_plan_credits_expiration_days,
        p_target_provider_plan_id,
        p_subscription_item_external_id,
        jsonb_build_object(
            'features',
            coalesce(to_jsonb(v_target_plan.features), '[]'::jsonb)
        ),
        jsonb_build_object(
            'provider', 'pagarme',
            'provider_subscription_id', v_subscription.external_id,
            'upgrade_payment_id', p_payment_id,
            'previous_contract_id', v_active_contract.id,
            'original_amount', p_original_amount,
            'financial_credit', p_financial_credit,
            'final_amount', p_prorated_amount,
            'remaining_subscription_credits', p_remaining_subscription_credits,
            'additional_credits', p_additional_credits
        )
    )
    returning id into v_contract_id;

    update public.student_payments
    set
        status = 'paid',
        paid_at = coalesce(p_paid_at, paid_at, now()),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'provider', 'pagarme',
            'pagarme_order_id', p_order_external_id,
            'pagarme_order_status', p_order_status,
            'pagarme_charge_id', p_charge_external_id,
            'upgrade_finalized_at', now(),
            'previous_plan_id', p_expected_current_plan_id,
            'previous_contract_id', v_active_contract.id,
            'target_plan_id', p_target_plan_id,
            'target_contract_id', v_contract_id,
            'target_contract_version', v_contract_version,
            'subscription_item_external_id', p_subscription_item_external_id,
            'original_amount', p_original_amount,
            'financial_credit', p_financial_credit,
            'final_amount', p_prorated_amount,
            'remaining_subscription_credits', p_remaining_subscription_credits,
            'additional_credits', p_additional_credits,
            'current_period_start', p_current_period_start,
            'current_period_end', p_current_period_end
        ),
        updated_at = now()
    where id = p_payment_id;

    update public.subscriptions
    set
        plan_id = p_target_plan_id,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'previous_plan_id', p_expected_current_plan_id,
            'previous_plan_name', v_active_contract.plan_name,
            'previous_contract_id', v_active_contract.id,
            'current_plan_id', p_target_plan_id,
            'current_plan_name', p_target_plan_name,
            'current_contract_id', v_contract_id,
            'last_plan_upgrade_payment_id', p_payment_id,
            'last_plan_upgrade_order_id', p_order_external_id,
            'pagarme_subscription_item_id', p_subscription_item_external_id,
            'last_plan_upgrade_at', now()
        ),
        updated_at = now()
    where id = p_subscription_id;

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
        'plan_change',
        p_additional_credits,
        format(
            'Liberação de %s crédito(s) pelo upgrade do plano %s para o plano %s.',
            p_additional_credits,
            v_active_contract.plan_name,
            p_target_plan_name
        ),
        p_payment_id,
        jsonb_build_object(
            'source', 'plan_upgrade',
            'credit_type', 'plan',
            'grant_type', 'plan_upgrade_reconciliation',
            'subscription_id', p_subscription_id,
            'previous_plan_id', p_expected_current_plan_id,
            'previous_contract_id', v_active_contract.id,
            'target_plan_id', p_target_plan_id,
            'target_contract_id', v_contract_id,
            'remaining_subscription_credits', p_remaining_subscription_credits,
            'additional_credits', p_additional_credits,
            'final_subscription_credits', p_target_plan_credits,
            'original_amount', p_original_amount,
            'financial_credit', p_financial_credit,
            'final_amount', p_prorated_amount,
            'pagarme_order_id', p_order_external_id,
            'pagarme_charge_id', p_charge_external_id,
            'current_period_start', p_current_period_start,
            'current_period_end', p_current_period_end
        )
    )
    returning id into v_credit_transaction_id;

    return jsonb_build_object(
        'success', true,
        'already_processed', false,
        'subscription_id', p_subscription_id,
        'payment_id', p_payment_id,
        'contract_id', v_contract_id,
        'contract_version', v_contract_version,
        'credit_transaction_id', v_credit_transaction_id,
        'previous_plan_id', p_expected_current_plan_id,
        'target_plan_id', p_target_plan_id,
        'additional_credits', p_additional_credits
    );
end;
$$;

revoke all on function public.finalize_plan_upgrade(
    uuid, uuid, uuid, uuid, uuid, uuid, integer, integer, integer, integer,
    integer, text, integer, integer, text, integer, integer, text, text, text,
    text, timestamptz, text, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_plan_upgrade(
    uuid, uuid, uuid, uuid, uuid, uuid, integer, integer, integer, integer,
    integer, text, integer, integer, text, integer, integer, text, text, text,
    text, timestamptz, text, timestamptz, timestamptz
) to service_role;

commit;

begin;

create table public.credit_allocation_movement_legacy_transactions (
    movement_id uuid not null
        references public.credit_allocation_movements(id) on delete cascade,
    credit_transaction_id uuid not null
        references public.credit_transactions(id) on delete restrict,
    evidence_role text not null,
    created_at timestamptz not null default now(),
    primary key (movement_id, credit_transaction_id),
    constraint credit_allocation_movement_legacy_transactions_role_valid
        check (evidence_role in (
            'primary_grant',
            'opening_component',
            'upgrade_difference',
            'legacy_source'
        ))
);

create unique index credit_allocation_movement_legacy_transactions_grant_unique
    on public.credit_allocation_movement_legacy_transactions (credit_transaction_id);

create function public.validate_credit_allocation_movement_legacy_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_allocation_user_id uuid;
    v_movement_type public.credit_allocation_movement_type;
    v_transaction_user_id uuid;
begin
    if tg_op = 'UPDATE' then
        raise exception 'Credit allocation movement evidence is immutable'
            using errcode = '55000';
    end if;

    select allocation.user_id, movement.type
    into v_allocation_user_id, v_movement_type
    from public.credit_allocation_movements as movement
    join public.credit_allocations as allocation
      on allocation.id = movement.allocation_id
    where movement.id = new.movement_id;

    select transaction.user_id
    into v_transaction_user_id
    from public.credit_transactions as transaction
    where transaction.id = new.credit_transaction_id;

    if v_allocation_user_id is null
       or v_transaction_user_id is null
       or v_allocation_user_id <> v_transaction_user_id then
        raise exception 'Legacy grant evidence must belong to the allocation owner'
            using errcode = '23514';
    end if;

    if v_movement_type <> 'opening_balance' then
        raise exception 'Legacy grant evidence can only be linked to an opening balance movement'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

revoke all on function public.validate_credit_allocation_movement_legacy_transaction()
from public, anon, authenticated;

create trigger validate_credit_allocation_movement_legacy_transaction
    before insert or update
    on public.credit_allocation_movement_legacy_transactions
    for each row
    execute function public.validate_credit_allocation_movement_legacy_transaction();

alter table public.credit_allocation_movement_legacy_transactions
    enable row level security;

revoke all on table public.credit_allocation_movement_legacy_transactions
from anon, authenticated;

grant select on table public.credit_allocation_movement_legacy_transactions
to authenticated;

grant all privileges on table public.credit_allocation_movement_legacy_transactions
to service_role;

create policy "Students read their own credit allocation movement evidence"
    on public.credit_allocation_movement_legacy_transactions
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.credit_allocation_movements as movement
            join public.credit_allocations as allocation
              on allocation.id = movement.allocation_id
            where movement.id = credit_allocation_movement_legacy_transactions.movement_id
              and (
                  allocation.user_id = auth.uid()
                  or public.get_my_role() = 'ADMIN'
              )
        )
    );

alter function public.audit_credit_allocation_backfill()
    rename to audit_credit_allocation_backfill_v2;

revoke all on function public.audit_credit_allocation_backfill_v2()
from public, anon, authenticated, service_role;

create function public.audit_credit_allocation_backfill()
returns table (
    record_kind text,
    classification text,
    proposed_origin text,
    user_id uuid,
    legacy_source text,
    legacy_id uuid,
    subscription_id uuid,
    contract_id uuid,
    student_payment_id uuid,
    grant_transaction_id uuid,
    granted_amount integer,
    remaining_amount integer,
    available_at timestamptz,
    expires_at timestamptz,
    reconciliation_movement_amount integer,
    reason text,
    proposed_metadata jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    return query
    with legacy_non_plan as (
        select
            previous.record_kind,
            previous.classification,
            previous.proposed_origin,
            previous.user_id,
            previous.legacy_source,
            previous.legacy_id,
            previous.subscription_id,
            previous.contract_id,
            previous.student_payment_id,
            previous.grant_transaction_id,
            previous.granted_amount,
            previous.remaining_amount,
            previous.available_at,
            previous.expires_at,
            previous.reconciliation_movement_amount,
            previous.reason,
            coalesce(previous.proposed_metadata, '{}'::jsonb)
                || jsonb_build_object(
                    'audit_rules_version', 3,
                    'apply_eligible',
                        previous.record_kind = 'candidate'
                        and previous.classification in ('migratable', 'fallback'),
                    'source_key', format(
                        '%s:%s:%s',
                        previous.legacy_source,
                        previous.user_id,
                        coalesce(previous.legacy_id::text, 'aggregate')
                    ),
                    'grant_transaction_ids', case
                        when previous.grant_transaction_id is null then '[]'::jsonb
                        else jsonb_build_array(previous.grant_transaction_id)
                    end
                ) as proposed_metadata
        from public.audit_credit_allocation_backfill_v2() as previous
        where not (
            previous.legacy_source = 'student_credits.plan_credits'
            and previous.record_kind = 'candidate'
        )
    ), plan_context as (
        select
            credits.user_id,
            credits.plan_credits,
            subscription.id as subscription_id,
            subscription.status as subscription_status,
            subscription.plan_id as subscription_plan_id,
            subscription.current_period_start,
            subscription.current_period_end,
            contract.id as contract_id,
            contract.version as contract_version,
            contract.source as contract_source,
            contract.plan_id as contract_plan_id,
            contract.credits_included,
            contract.credits_expiration_days,
            contract.metadata as contract_metadata,
            recurring_payment.id as recurring_payment_id,
            recurring_payment.user_id as recurring_payment_user_id,
            recurring_payment.subscription_id as recurring_payment_subscription_id,
            recurring_payment.plan_id as recurring_payment_plan_id,
            recurring_payment.kind as recurring_payment_kind,
            recurring_payment.status as recurring_payment_status,
            recurring_payment.credits_amount as recurring_payment_credits_amount,
            recurring_payment.created_at as recurring_payment_created_at,
            recurring_payment.paid_at as recurring_payment_paid_at
        from public.student_credits as credits
        left join lateral (
            select candidate.*
            from public.subscriptions as candidate
            where candidate.user_id = credits.user_id
              and candidate.status in ('active', 'trial')
            order by candidate.updated_at desc, candidate.id desc
            limit 1
        ) as subscription on true
        left join lateral (
            select candidate.*
            from public.subscription_contracts as candidate
            where candidate.subscription_id = subscription.id
              and candidate.status = 'active'
            order by candidate.version desc, candidate.id desc
            limit 1
        ) as contract on true
        left join public.student_payments as recurring_payment
          on recurring_payment.id::text = contract.metadata ->> 'recurring_payment_id'
        where credits.plan_credits > 0
    ), plan_evidence as (
        select
            context.*,
            ledger.trial_amount,
            ledger.trial_count,
            ledger.trial_transaction_ids,
            ledger.trial_evidence,
            ledger.plan_mutation_count,
            grants.paid_grant_count,
            grants.paid_grant_amount,
            grants.paid_grant_transaction_ids,
            direct_grant.id as direct_grant_id,
            direct_grant.amount as direct_grant_amount,
            direct_grant.created_at as direct_grant_created_at,
            direct_grant.metadata as direct_grant_metadata,
            base_grant.id as base_grant_id,
            base_grant.amount as base_grant_amount,
            base_grant.student_payment_id as base_payment_id,
            base_grant.created_at as base_grant_created_at,
            base_payment.plan_id as base_payment_plan_id,
            base_payment.kind as base_payment_kind,
            base_payment.status as base_payment_status,
            base_payment.credits_amount as base_payment_credits_amount,
            base_payment.created_at as base_payment_created_at,
            base_payment.paid_at as base_payment_paid_at,
            upgrade_grant.id as upgrade_grant_id,
            upgrade_grant.amount as upgrade_grant_amount,
            upgrade_grant.student_payment_id as upgrade_payment_id,
            upgrade_grant.created_at as upgrade_grant_created_at,
            upgrade_grant.metadata as upgrade_grant_metadata,
            upgrade_payment.plan_id as upgrade_payment_plan_id,
            upgrade_payment.kind as upgrade_payment_kind,
            upgrade_payment.status as upgrade_payment_status,
            upgrade_payment.credits_amount as upgrade_payment_credits_amount,
            upgrade_payment.created_at as upgrade_payment_created_at,
            upgrade_payment.paid_at as upgrade_payment_paid_at,
            (
                context.recurring_payment_id is not null
                and context.recurring_payment_user_id = context.user_id
                and context.recurring_payment_subscription_id = context.subscription_id
                and context.recurring_payment_plan_id = context.contract_plan_id
                and context.recurring_payment_kind = 'subscription'
                and context.recurring_payment_status in ('paid', 'active')
                and context.recurring_payment_credits_amount = context.credits_included
                and coalesce(
                    context.recurring_payment_paid_at,
                    context.recurring_payment_created_at
                ) >= context.current_period_start
                and coalesce(
                    context.recurring_payment_paid_at,
                    context.recurring_payment_created_at
                ) < context.current_period_end
                and direct_grant.id is not null
                and direct_grant.amount = context.credits_included
                and grants.paid_grant_count = 1
            ) as direct_proven,
            (
                base_grant.id is not null
                and upgrade_grant.id is not null
                and grants.paid_grant_count = 2
                and base_grant.amount + upgrade_grant.amount = context.credits_included
                and base_payment.user_id = context.user_id
                and base_payment.subscription_id = context.subscription_id
                and base_payment.kind = 'subscription'
                and base_payment.status in ('paid', 'active')
                and base_payment.credits_amount = base_grant.amount
                and coalesce(base_payment.paid_at, base_payment.created_at)
                    >= context.current_period_start
                and coalesce(base_payment.paid_at, base_payment.created_at)
                    < context.current_period_end
                and upgrade_payment.user_id = context.user_id
                and upgrade_payment.subscription_id = context.subscription_id
                and upgrade_payment.kind = 'plan_upgrade_prorata'
                and upgrade_payment.status in ('paid', 'active')
                and upgrade_payment.plan_id = context.contract_plan_id
                and upgrade_payment.credits_amount = upgrade_grant.amount
                and coalesce(upgrade_payment.paid_at, upgrade_payment.created_at)
                    >= context.current_period_start
                and coalesce(upgrade_payment.paid_at, upgrade_payment.created_at)
                    < context.current_period_end
                and upgrade_grant.metadata ->> 'previous_plan_id'
                    = base_payment.plan_id::text
                and upgrade_grant.metadata ->> 'target_plan_id'
                    = context.contract_plan_id::text
                and upgrade_grant.metadata ->> 'final_subscription_credits'
                    = context.credits_included::text
                and upgrade_grant.metadata -> 'current_period_start'
                    = to_jsonb(context.current_period_start)
                and upgrade_grant.metadata -> 'current_period_end'
                    = to_jsonb(context.current_period_end)
            ) as composite_proven
        from plan_context as context
        left join lateral (
            select
                coalesce(sum(transaction.amount) filter (
                    where transaction.type = 'free_trial_grant'
                ), 0)::integer as trial_amount,
                count(*) filter (
                    where transaction.type = 'free_trial_grant'
                ) as trial_count,
                coalesce(jsonb_agg(transaction.id order by transaction.created_at, transaction.id)
                    filter (where transaction.type = 'free_trial_grant'), '[]'::jsonb)
                    as trial_transaction_ids,
                coalesce(jsonb_agg(jsonb_build_object(
                    'credit_transaction_id', transaction.id,
                    'amount', transaction.amount,
                    'created_at', transaction.created_at,
                    'metadata', transaction.metadata
                ) order by transaction.created_at, transaction.id)
                    filter (where transaction.type = 'free_trial_grant'), '[]'::jsonb)
                    as trial_evidence,
                count(*) filter (
                    where transaction.type in (
                        'essay_usage',
                        'essay_refund',
                        'administrative_adjustment'
                    )
                ) as plan_mutation_count
            from public.credit_transactions as transaction
            where transaction.user_id = context.user_id
              and coalesce(transaction.metadata ->> 'plan_source', '') <> 'mentorship'
              and transaction.metadata ->> 'mentorship_allocation_id' is null
              and (
                  (
                      transaction.type = 'free_trial_grant'
                      and transaction.metadata ->> 'plan_source' = 'free_trial'
                      and coalesce(transaction.metadata ->> 'credit_type', 'plan') = 'plan'
                  )
                  or (
                      transaction.type in (
                          'essay_usage',
                          'essay_refund',
                          'administrative_adjustment'
                      )
                      and coalesce(transaction.metadata ->> 'credit_type', 'plan') = 'plan'
                  )
              )
        ) as ledger on true
        left join lateral (
            select
                count(*) as paid_grant_count,
                coalesce(sum(transaction.amount), 0)::integer as paid_grant_amount,
                coalesce(
                    jsonb_agg(transaction.id order by transaction.created_at, transaction.id),
                    '[]'::jsonb
                ) as paid_grant_transaction_ids
            from public.credit_transactions as transaction
            where transaction.user_id = context.user_id
              and transaction.amount > 0
              and transaction.type in (
                  'plan_renewal',
                  'plan_change',
                  'new_subscription',
                  'subscription_reactivation'
              )
              and transaction.metadata ->> 'subscription_id' = context.subscription_id::text
              and transaction.created_at >= context.current_period_start
              and transaction.created_at < context.current_period_end
        ) as grants on true
        left join lateral (
            select transaction.*
            from public.credit_transactions as transaction
            where transaction.user_id = context.user_id
              and transaction.student_payment_id = context.recurring_payment_id
              and transaction.amount > 0
              and transaction.type in (
                  'plan_renewal',
                  'new_subscription',
                  'subscription_reactivation'
              )
              and transaction.metadata ->> 'subscription_id' = context.subscription_id::text
              and transaction.created_at >= context.current_period_start
              and transaction.created_at < context.current_period_end
            order by transaction.created_at, transaction.id
            limit 1
        ) as direct_grant on true
        left join lateral (
            select transaction.*
            from public.credit_transactions as transaction
            join public.student_payments as payment
              on payment.id = transaction.student_payment_id
            where transaction.user_id = context.user_id
              and transaction.amount > 0
              and transaction.type in (
                  'plan_renewal',
                  'new_subscription',
                  'subscription_reactivation'
              )
              and transaction.metadata ->> 'subscription_id' = context.subscription_id::text
              and transaction.created_at >= context.current_period_start
              and transaction.created_at < context.current_period_end
            order by transaction.created_at, transaction.id
            limit 1
        ) as base_grant on true
        left join public.student_payments as base_payment
          on base_payment.id = base_grant.student_payment_id
        left join lateral (
            select transaction.*
            from public.credit_transactions as transaction
            where transaction.user_id = context.user_id
              and transaction.amount > 0
              and transaction.type = 'plan_change'
              and transaction.metadata ->> 'subscription_id' = context.subscription_id::text
              and transaction.created_at >= context.current_period_start
              and transaction.created_at < context.current_period_end
            order by transaction.created_at desc, transaction.id desc
            limit 1
        ) as upgrade_grant on true
        left join public.student_payments as upgrade_payment
          on upgrade_payment.id = upgrade_grant.student_payment_id
    ), plan_decisions as (
        select
            evidence.*,
            case
                when evidence.subscription_id is null
                  or evidence.contract_id is null
                    then 'ambiguous'
                when evidence.current_period_end is not null
                  and evidence.current_period_end <= now()
                    then 'inconsistency'
                when evidence.credits_included is null
                  or evidence.credits_included <= 0
                    then 'inconsistency'
                when evidence.trial_amount > 0
                  and evidence.plan_mutation_count > 0
                    then 'ambiguous'
                when (evidence.direct_proven or evidence.composite_proven)
                  and evidence.trial_amount = 0
                  and evidence.plan_credits <= evidence.credits_included
                    then 'subscription_only'
                when (evidence.direct_proven or evidence.composite_proven)
                  and evidence.trial_amount > 0
                  and evidence.plan_mutation_count = 0
                  and evidence.plan_credits
                      = evidence.credits_included + evidence.trial_amount
                    then 'decomposed'
                when not (evidence.direct_proven or evidence.composite_proven)
                  and evidence.paid_grant_count = 0
                  and evidence.trial_amount > 0
                  and evidence.plan_mutation_count = 0
                  and evidence.plan_credits = evidence.trial_amount
                    then 'trial_only'
                when evidence.plan_credits > evidence.credits_included
                    then 'inconsistency'
                else 'ambiguous'
            end as decision
        from plan_evidence as evidence
    ), subscription_rows as (
        select
            'candidate'::text as record_kind,
            'migratable'::text as classification,
            'subscription'::text as proposed_origin,
            decision.user_id,
            'student_credits.plan_credits'::text as legacy_source,
            case
                when decision.composite_proven then decision.upgrade_grant_id
                else decision.direct_grant_id
            end as legacy_id,
            decision.subscription_id,
            decision.contract_id,
            case
                when decision.composite_proven then decision.upgrade_payment_id
                else decision.recurring_payment_id
            end as student_payment_id,
            case
                when decision.composite_proven then decision.upgrade_grant_id
                else decision.direct_grant_id
            end as grant_transaction_id,
            decision.credits_included as granted_amount,
            case
                when decision.decision = 'decomposed'
                    then decision.credits_included
                else decision.plan_credits
            end as remaining_amount,
            decision.current_period_start as available_at,
            decision.current_period_end as expires_at,
            case
                when decision.decision = 'decomposed' then 0
                else decision.plan_credits - decision.credits_included
            end as reconciliation_movement_amount,
            case
                when decision.composite_proven
                    then 'subscription_composite_upgrade_deterministically_reconstructed'
                when decision.decision = 'decomposed'
                    then 'subscription_balance_deterministically_decomposed'
                else 'subscription_deterministically_reconstructed_from_recurring_payment'
            end as reason,
            jsonb_strip_nulls(jsonb_build_object(
                'audit_rules_version', 3,
                'apply_eligible', true,
                'upgrade_eligible', true,
                'source_key', format(
                    'student_credits.plan_credits:subscription:%s:%s',
                    decision.user_id,
                    decision.contract_id
                ),
                'reconstruction_mode', case
                    when decision.composite_proven
                      and decision.decision = 'decomposed'
                        then 'composite_upgrade_decomposed'
                    when decision.composite_proven then 'composite_upgrade'
                    when decision.decision = 'decomposed' then 'decomposed_subscription'
                    else 'recurring_payment_bridge'
                end,
                'subscription_id', decision.subscription_id,
                'contract_id', decision.contract_id,
                'contract_version', decision.contract_version,
                'contract_source', decision.contract_source,
                'recurring_payment_id', decision.recurring_payment_id,
                'grant_transaction_ids', case
                    when decision.composite_proven
                        then jsonb_build_array(
                            decision.base_grant_id,
                            decision.upgrade_grant_id
                        )
                    else jsonb_build_array(decision.direct_grant_id)
                end,
                'grant_evidence_roles', case
                    when decision.composite_proven then jsonb_build_object(
                        decision.base_grant_id::text, 'opening_component',
                        decision.upgrade_grant_id::text, 'upgrade_difference'
                    )
                    else jsonb_build_object(
                        decision.direct_grant_id::text, 'primary_grant'
                    )
                end,
                'paid_grant_amount', decision.paid_grant_amount,
                'deterministic_evidence', jsonb_build_object(
                    'period_start', decision.current_period_start,
                    'period_end', decision.current_period_end,
                    'contract_plan_id', decision.contract_plan_id,
                    'contract_credits_included', decision.credits_included,
                    'recurring_payment', jsonb_strip_nulls(jsonb_build_object(
                        'id', decision.recurring_payment_id,
                        'plan_id', decision.recurring_payment_plan_id,
                        'kind', decision.recurring_payment_kind,
                        'status', decision.recurring_payment_status,
                        'credits_amount', decision.recurring_payment_credits_amount,
                        'created_at', decision.recurring_payment_created_at,
                        'paid_at', decision.recurring_payment_paid_at
                    )),
                    'base_grant', jsonb_strip_nulls(jsonb_build_object(
                        'credit_transaction_id', decision.base_grant_id,
                        'amount', decision.base_grant_amount,
                        'created_at', decision.base_grant_created_at,
                        'student_payment_id', decision.base_payment_id,
                        'payment_plan_id', decision.base_payment_plan_id,
                        'payment_kind', decision.base_payment_kind,
                        'payment_status', decision.base_payment_status,
                        'payment_credits_amount', decision.base_payment_credits_amount,
                        'payment_created_at', decision.base_payment_created_at,
                        'payment_paid_at', decision.base_payment_paid_at
                    )),
                    'upgrade_grant', jsonb_strip_nulls(jsonb_build_object(
                        'credit_transaction_id', decision.upgrade_grant_id,
                        'amount', decision.upgrade_grant_amount,
                        'created_at', decision.upgrade_grant_created_at,
                        'student_payment_id', decision.upgrade_payment_id,
                        'payment_plan_id', decision.upgrade_payment_plan_id,
                        'payment_kind', decision.upgrade_payment_kind,
                        'payment_status', decision.upgrade_payment_status,
                        'payment_credits_amount', decision.upgrade_payment_credits_amount,
                        'payment_created_at', decision.upgrade_payment_created_at,
                        'payment_paid_at', decision.upgrade_payment_paid_at,
                        'grant_metadata', decision.upgrade_grant_metadata
                    ))
                ),
                'decomposed_trial_amount', case
                    when decision.decision = 'decomposed' then decision.trial_amount
                    else null
                end
            )) as proposed_metadata
        from plan_decisions as decision
        where decision.decision in ('subscription_only', 'decomposed')
    ), legacy_trial_rows as (
        select
            'candidate'::text as record_kind,
            'fallback'::text as classification,
            'free_promotional'::text as proposed_origin,
            decision.user_id,
            'student_credits.plan_credits.legacy_free_trial'::text as legacy_source,
            (decision.trial_transaction_ids ->> 0)::uuid as legacy_id,
            null::uuid as subscription_id,
            null::uuid as contract_id,
            null::uuid as student_payment_id,
            (decision.trial_transaction_ids ->> 0)::uuid as grant_transaction_id,
            decision.trial_amount as granted_amount,
            decision.trial_amount as remaining_amount,
            null::timestamptz as available_at,
            null::timestamptz as expires_at,
            0::integer as reconciliation_movement_amount,
            'legacy_free_trial_missing_expiry'::text as reason,
            jsonb_build_object(
                'audit_rules_version', 3,
                'apply_eligible', false,
                'upgrade_eligible', false,
                'source_key', format(
                    'student_credits.plan_credits:legacy_free_trial:%s:%s',
                    decision.user_id,
                    decision.trial_transaction_ids ->> 0
                ),
                'reconstruction_mode', case
                    when decision.decision = 'decomposed' then 'decomposed_legacy_free_trial'
                    else 'legacy_free_trial_only'
                end,
                'grant_transaction_ids', decision.trial_transaction_ids,
                'legacy_grant_evidence', decision.trial_evidence,
                'missing_field', 'expires_at',
                'requires_product_decision', true
            ) as proposed_metadata
        from plan_decisions as decision
        where decision.decision in ('decomposed', 'trial_only')
    ), unresolved_plan_rows as (
        select
            'candidate'::text as record_kind,
            case
                when decision.decision = 'inconsistency' then 'inconsistency'
                else 'ambiguous'
            end as classification,
            case
                when decision.trial_amount > 0
                  and decision.paid_grant_count = 0
                    then 'free_promotional'
                else 'legacy_unclassified'
            end as proposed_origin,
            decision.user_id,
            'student_credits.plan_credits'::text as legacy_source,
            null::uuid as legacy_id,
            decision.subscription_id,
            decision.contract_id,
            null::uuid as student_payment_id,
            null::uuid as grant_transaction_id,
            null::integer as granted_amount,
            decision.plan_credits as remaining_amount,
            decision.current_period_start as available_at,
            decision.current_period_end as expires_at,
            null::integer as reconciliation_movement_amount,
            case
                when decision.current_period_end is not null
                  and decision.current_period_end <= now()
                    then 'expired_subscription_balance_without_expiration_event'
                when decision.subscription_id is null
                    then 'positive_plan_balance_without_active_subscription'
                when decision.contract_id is null
                    then 'positive_plan_balance_without_active_contract'
                when decision.credits_included is null
                  or decision.credits_included <= 0
                    then 'active_contract_has_no_positive_credit_grant'
                when decision.trial_amount > 0
                  and decision.plan_mutation_count > 0
                    then 'ambiguous_due_to_missing_consumption_provenance'
                when decision.plan_credits > decision.credits_included
                    then 'plan_balance_exceeds_proven_contract_and_legacy_components'
                else 'subscription_grant_not_deterministically_reconstructed'
            end as reason,
            jsonb_strip_nulls(jsonb_build_object(
                'audit_rules_version', 3,
                'apply_eligible', false,
                'upgrade_eligible', false,
                'source_key', format(
                    'student_credits.plan_credits:unresolved:%s',
                    decision.user_id
                ),
                'subscription_id', decision.subscription_id,
                'contract_id', decision.contract_id,
                'contract_version', decision.contract_version,
                'contract_source', decision.contract_source,
                'recurring_payment_id', decision.recurring_payment_id,
                'paid_grant_transaction_ids', decision.paid_grant_transaction_ids,
                'paid_grant_amount', decision.paid_grant_amount,
                'trial_transaction_ids', decision.trial_transaction_ids,
                'trial_evidence', decision.trial_evidence,
                'trial_amount', decision.trial_amount,
                'plan_mutation_count', decision.plan_mutation_count,
                'legacy_plan_balance', decision.plan_credits,
                'contract_credits_included', decision.credits_included,
                'direct_payment_bridge_proven', decision.direct_proven,
                'composite_upgrade_proven', decision.composite_proven
            )) as proposed_metadata
        from plan_decisions as decision
        where decision.decision not in (
            'subscription_only',
            'decomposed',
            'trial_only'
        )
    ), audit_rows as (
        select * from legacy_non_plan
        union all
        select * from subscription_rows
        union all
        select * from legacy_trial_rows
        union all
        select * from unresolved_plan_rows
    )
    select row.*
    from audit_rows as row
    order by
        case row.classification
            when 'inconsistency' then 1
            when 'ambiguous' then 2
            when 'fallback' then 3
            else 4
        end,
        row.user_id,
        row.proposed_origin,
        row.legacy_id;
end;
$$;

revoke all on function public.audit_credit_allocation_backfill()
from public, anon, authenticated;

grant execute on function public.audit_credit_allocation_backfill()
to service_role;

alter function public.backfill_credit_allocations(boolean)
    rename to backfill_credit_allocations_v2;

revoke all on function public.backfill_credit_allocations_v2(boolean)
from public, anon, authenticated, service_role;

create function public.backfill_credit_allocations(
    p_apply boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_report jsonb;
    v_candidate record;
    v_origin public.credit_allocation_origin;
    v_allocation_id uuid;
    v_opening_movement_id uuid;
    v_granted_amount integer;
    v_reconciliation_amount integer;
    v_idempotency_key text;
    v_allocation_inserted integer;
    v_allocations_planned bigint := 0;
    v_movements_planned bigint := 0;
    v_legacy_unclassified_planned bigint := 0;
    v_evidence_links_planned bigint := 0;
    v_allocations_inserted bigint := 0;
    v_movements_inserted bigint := 0;
    v_legacy_unclassified_inserted bigint := 0;
    v_evidence_links_inserted bigint := 0;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    if p_apply is true then
        perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtext('credit_allocations_backfill_v1')
        );

        lock table
            public.student_credits,
            public.credit_transactions,
            public.free_credit_allocations,
            public.mentorship_credit_allocations,
            public.subscriptions,
            public.subscription_contracts,
            public.student_payments
        in share mode;
    end if;

    with audit as materialized (
        select * from public.audit_credit_allocation_backfill()
    )
    select jsonb_build_object(
        'dry_run', p_apply is distinct from true,
        'apply_supported', true,
        'rules_version', 3,
        'generated_at', now(),
        'total_analyzed', count(*),
        'candidate_records', count(*) filter (where record_kind = 'candidate'),
        'reconciliation_records', count(*) filter (where record_kind = 'reconciliation'),
        'students_analyzed', count(distinct user_id),
        'migratable', jsonb_build_object(
            'total', count(*) filter (where classification = 'migratable'),
            'credits', coalesce(sum(remaining_amount) filter (
                where classification = 'migratable'
            ), 0),
            'by_origin', jsonb_build_object(
                'subscription', jsonb_build_object(
                    'allocations', count(*) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'subscription'
                    ),
                    'credits', coalesce(sum(remaining_amount) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'subscription'
                    ), 0)
                ),
                'free_promotional', jsonb_build_object(
                    'allocations', count(*) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'free_promotional'
                    ),
                    'credits', coalesce(sum(remaining_amount) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'free_promotional'
                    ), 0)
                ),
                'mentorship', jsonb_build_object(
                    'allocations', count(*) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'mentorship'
                    ),
                    'credits', coalesce(sum(remaining_amount) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'mentorship'
                    ), 0)
                ),
                'extra_purchase', jsonb_build_object(
                    'allocations', count(*) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'extra_purchase'
                    ),
                    'credits', coalesce(sum(remaining_amount) filter (
                        where classification = 'migratable'
                          and proposed_origin = 'extra_purchase'
                    ), 0)
                )
            )
        ),
        'fallback', jsonb_build_object(
            'total', count(*) filter (where classification = 'fallback'),
            'credits', coalesce(sum(remaining_amount) filter (
                where classification = 'fallback'
            ), 0),
            'apply_eligible', count(*) filter (
                where classification = 'fallback'
                  and not proposed_metadata @> '{"apply_eligible": false}'::jsonb
            ),
            'details', coalesce(jsonb_agg(to_jsonb(audit)
                order by user_id, proposed_origin, legacy_id)
                filter (where classification = 'fallback'), '[]'::jsonb)
        ),
        'ambiguous', jsonb_build_object(
            'total', count(*) filter (where classification = 'ambiguous'),
            'credits', coalesce(sum(remaining_amount) filter (
                where classification = 'ambiguous'
            ), 0),
            'details', coalesce(jsonb_agg(to_jsonb(audit)
                order by user_id, proposed_origin, legacy_id)
                filter (where classification = 'ambiguous'), '[]'::jsonb)
        ),
        'inconsistencies', jsonb_build_object(
            'total', count(*) filter (where classification = 'inconsistency'),
            'details', coalesce(jsonb_agg(to_jsonb(audit)
                order by user_id, proposed_origin, legacy_id)
                filter (where classification = 'inconsistency'), '[]'::jsonb)
        ),
        'deterministic_reconstruction', jsonb_build_object(
            'subscription', count(*) filter (
                where proposed_origin = 'subscription'
                  and classification = 'migratable'
            ),
            'composite_upgrades', count(*) filter (
                where reason = 'subscription_composite_upgrade_deterministically_reconstructed'
            ),
            'decomposed_balances', count(distinct user_id) filter (
                where proposed_metadata ->> 'reconstruction_mode'
                    in (
                        'decomposed_subscription',
                        'composite_upgrade_decomposed',
                        'decomposed_legacy_free_trial'
                    )
            ),
            'legacy_free_trial_missing_expiry', count(*) filter (
                where reason = 'legacy_free_trial_missing_expiry'
            ),
            'ambiguous_missing_consumption_provenance', count(*) filter (
                where reason = 'ambiguous_due_to_missing_consumption_provenance'
            ),
            'expired_subscription_balance', count(*) filter (
                where reason = 'expired_subscription_balance_without_expiration_event'
            )
        ),
        'migration_candidate_count', count(*) filter (
            where record_kind = 'candidate'
              and classification in ('migratable', 'fallback')
              and remaining_amount > 0
              and not proposed_metadata @> '{"apply_eligible": false}'::jsonb
        ),
        'migration_candidates', coalesce(jsonb_agg(to_jsonb(audit)
            order by user_id, proposed_origin, legacy_id) filter (
                where record_kind = 'candidate'
                  and classification in ('migratable', 'fallback')
                  and remaining_amount > 0
                  and not proposed_metadata @> '{"apply_eligible": false}'::jsonb
            ), '[]'::jsonb)
    )
    into v_report
    from audit;

    select
        count(*),
        count(*) + count(*) filter (
            where candidate.remaining_amount < greatest(
                coalesce(candidate.granted_amount, candidate.remaining_amount),
                candidate.remaining_amount
            )
        ),
        count(*) filter (where candidate.classification = 'fallback'),
        coalesce(sum(jsonb_array_length(
            coalesce(candidate.proposed_metadata -> 'grant_transaction_ids', '[]'::jsonb)
        )), 0)
    into
        v_allocations_planned,
        v_movements_planned,
        v_legacy_unclassified_planned,
        v_evidence_links_planned
    from public.audit_credit_allocation_backfill() as candidate
    where candidate.record_kind = 'candidate'
      and candidate.classification in ('migratable', 'fallback')
      and candidate.remaining_amount > 0
      and not candidate.proposed_metadata @> '{"apply_eligible": false}'::jsonb;

    if p_apply is distinct from true then
        return v_report || jsonb_build_object(
            'planned', jsonb_build_object(
                'allocations', v_allocations_planned,
                'movements', v_movements_planned,
                'legacy_unclassified', v_legacy_unclassified_planned,
                'movement_evidence_links', v_evidence_links_planned
            ),
            'inserted', jsonb_build_object(
                'allocations', 0,
                'movements', 0,
                'legacy_unclassified', 0,
                'movement_evidence_links', 0
            )
        );
    end if;

    for v_candidate in
        select candidate.*
        from public.audit_credit_allocation_backfill() as candidate
        where candidate.record_kind = 'candidate'
          and candidate.classification in ('migratable', 'fallback')
          and candidate.remaining_amount > 0
          and not candidate.proposed_metadata @> '{"apply_eligible": false}'::jsonb
        order by candidate.user_id, candidate.legacy_source, candidate.legacy_id
    loop
        v_origin := case
            when v_candidate.classification = 'fallback'
                then 'legacy_unclassified'::public.credit_allocation_origin
            else v_candidate.proposed_origin::public.credit_allocation_origin
        end;

        v_granted_amount := greatest(
            coalesce(v_candidate.granted_amount, v_candidate.remaining_amount),
            v_candidate.remaining_amount
        );
        v_reconciliation_amount := v_candidate.remaining_amount - v_granted_amount;
        v_idempotency_key := 'credit-allocation-backfill:v1:'
            || coalesce(
                v_candidate.proposed_metadata ->> 'source_key',
                format(
                    '%s:%s:%s',
                    v_candidate.legacy_source,
                    v_candidate.user_id,
                    coalesce(v_candidate.legacy_id::text, 'aggregate')
                )
            );

        insert into public.credit_allocations (
            user_id,
            origin,
            subscription_id,
            subscription_contract_id,
            student_payment_id,
            granted_amount,
            available_at,
            expires_at,
            reason,
            source_reference,
            idempotency_key,
            metadata
        )
        values (
            v_candidate.user_id,
            v_origin,
            case when v_origin = 'subscription' then v_candidate.subscription_id end,
            case when v_origin = 'subscription' then v_candidate.contract_id end,
            case
                when v_candidate.classification = 'migratable'
                    then v_candidate.student_payment_id
            end,
            v_granted_amount,
            coalesce(v_candidate.available_at, now()),
            v_candidate.expires_at,
            case
                when v_candidate.classification = 'fallback'
                    then format('Legacy credit fallback: %s', v_candidate.reason)
            end,
            coalesce(
                v_candidate.proposed_metadata ->> 'source_key',
                format('%s:%s', v_candidate.legacy_source, v_candidate.user_id)
            ),
            v_idempotency_key,
            coalesce(v_candidate.proposed_metadata, '{}'::jsonb)
                || jsonb_build_object(
                    'backfill_version', 2,
                    'backfill_classification', v_candidate.classification,
                    'backfill_reason', v_candidate.reason,
                    'upgrade_eligible', v_origin = 'subscription'
                )
        )
        on conflict (idempotency_key) where idempotency_key is not null
        do nothing;

        get diagnostics v_allocation_inserted = row_count;
        if v_allocation_inserted = 0 then
            continue;
        end if;

        select allocation.id
        into strict v_allocation_id
        from public.credit_allocations as allocation
        where allocation.idempotency_key = v_idempotency_key;

        v_allocations_inserted := v_allocations_inserted + 1;
        if v_origin = 'legacy_unclassified' then
            v_legacy_unclassified_inserted := v_legacy_unclassified_inserted + 1;
        end if;

        insert into public.credit_allocation_movements (
            allocation_id,
            type,
            amount,
            description,
            idempotency_key,
            metadata,
            legacy_credit_transaction_id
        )
        values (
            v_allocation_id,
            'opening_balance',
            v_granted_amount,
            'Opening balance imported from the legacy credit system',
            v_idempotency_key || ':opening',
            jsonb_build_object(
                'backfill_version', 2,
                'legacy_source', v_candidate.legacy_source,
                'legacy_id', v_candidate.legacy_id,
                'classification', v_candidate.classification,
                'reason', v_candidate.reason,
                'grant_transaction_ids', coalesce(
                    v_candidate.proposed_metadata -> 'grant_transaction_ids',
                    '[]'::jsonb
                )
            ),
            case
                when jsonb_array_length(coalesce(
                    v_candidate.proposed_metadata -> 'grant_transaction_ids',
                    '[]'::jsonb
                )) = 1 then v_candidate.grant_transaction_id
                else null
            end
        )
        returning id into v_opening_movement_id;

        v_movements_inserted := v_movements_inserted + 1;

        with evidence as (
            select value::uuid as credit_transaction_id
            from jsonb_array_elements_text(coalesce(
                v_candidate.proposed_metadata -> 'grant_transaction_ids',
                '[]'::jsonb
            ))
        )
        insert into public.credit_allocation_movement_legacy_transactions (
            movement_id,
            credit_transaction_id,
            evidence_role
        )
        select
            v_opening_movement_id,
            evidence.credit_transaction_id,
            coalesce(
                v_candidate.proposed_metadata
                    -> 'grant_evidence_roles'
                    ->> evidence.credit_transaction_id::text,
                case
                    when evidence.credit_transaction_id = v_candidate.grant_transaction_id
                        then 'primary_grant'
                    else 'legacy_source'
                end
            )
        from evidence
        on conflict do nothing;

        get diagnostics v_allocation_inserted = row_count;
        v_evidence_links_inserted :=
            v_evidence_links_inserted + v_allocation_inserted;

        if v_reconciliation_amount < 0 then
            insert into public.credit_allocation_movements (
                allocation_id,
                type,
                amount,
                description,
                idempotency_key,
                metadata
            )
            values (
                v_allocation_id,
                'adjustment',
                v_reconciliation_amount,
                'Legacy consumption summarized during credit allocation backfill',
                v_idempotency_key || ':reconciliation',
                jsonb_build_object(
                    'backfill_version', 2,
                    'opening_amount', v_granted_amount,
                    'legacy_remaining_amount', v_candidate.remaining_amount,
                    'summarizes_legacy_movements', true
                )
            );
            v_movements_inserted := v_movements_inserted + 1;
        end if;
    end loop;

    return v_report || jsonb_build_object(
        'dry_run', false,
        'planned', jsonb_build_object(
            'allocations', v_allocations_planned,
            'movements', v_movements_planned,
            'legacy_unclassified', v_legacy_unclassified_planned,
            'movement_evidence_links', v_evidence_links_planned
        ),
        'inserted', jsonb_build_object(
            'allocations', v_allocations_inserted,
            'movements', v_movements_inserted,
            'legacy_unclassified', v_legacy_unclassified_inserted,
            'movement_evidence_links', v_evidence_links_inserted
        )
    );
end;
$$;

revoke all on function public.backfill_credit_allocations(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_credit_allocations(boolean)
to service_role;

commit;

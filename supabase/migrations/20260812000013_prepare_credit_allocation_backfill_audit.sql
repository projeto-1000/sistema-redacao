begin;

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
    with free_candidates as (
        select
            'candidate'::text as record_kind,
            case
                when allocation.status <> 'active'
                    or allocation.expires_at <= now()
                    then 'inconsistency'
                when grant_transaction.id is not null
                    and grant_transaction.amount <> allocation.amount
                    then 'inconsistency'
                when grant_transaction.id is null
                    then 'fallback'
                else 'migratable'
            end as classification,
            'free_promotional'::text as proposed_origin,
            allocation.user_id,
            'free_credit_allocations'::text as legacy_source,
            allocation.id as legacy_id,
            allocation.subscription_id,
            null::uuid as contract_id,
            grant_transaction.student_payment_id,
            grant_transaction.id as grant_transaction_id,
            allocation.amount as granted_amount,
            allocation.remaining_amount,
            allocation.granted_at as available_at,
            allocation.expires_at,
            allocation.remaining_amount - allocation.amount
                as reconciliation_movement_amount,
            case
                when allocation.status <> 'active'
                    then 'free_allocation_has_remaining_balance_with_non_active_status'
                when allocation.expires_at <= now()
                    then 'free_allocation_has_remaining_balance_after_expiration'
                when grant_transaction.id is not null
                    and grant_transaction.amount <> allocation.amount
                    then 'free_grant_amount_differs_from_legacy_allocation'
                when grant_transaction.id is null
                    then 'free_allocation_missing_matching_grant_transaction'
                else 'free_allocation_and_grant_transaction_match'
            end as reason,
            jsonb_strip_nulls(
                jsonb_build_object(
                    'legacy_source', 'free_credit_allocations',
                    'legacy_allocation_id', allocation.id,
                    'legacy_status', allocation.status,
                    'legacy_grant_transaction_id', allocation.grant_transaction_id,
                    'legacy_expiration_transaction_id', allocation.expiration_transaction_id,
                    'subscription_id', allocation.subscription_id,
                    'grant_metadata', grant_transaction.metadata
                )
            ) as proposed_metadata
        from public.free_credit_allocations as allocation
        left join public.credit_transactions as grant_transaction
          on grant_transaction.id = allocation.grant_transaction_id
         and grant_transaction.user_id = allocation.user_id
         and grant_transaction.type = 'free_trial_grant'
         and grant_transaction.amount > 0
         and grant_transaction.metadata ->> 'free_credit_allocation_id' = allocation.id::text
        where allocation.remaining_amount > 0
    ), mentorship_candidates as (
        select
            'candidate'::text as record_kind,
            case
                when allocation.status <> 'active'
                    or allocation.available_at > now()
                    or allocation.expires_at <= now()
                    then 'inconsistency'
                when grant_transaction.id is not null
                    and grant_transaction.amount <> allocation.amount
                    then 'inconsistency'
                when grant_transaction.id is null
                    then 'fallback'
                else 'migratable'
            end as classification,
            'mentorship'::text as proposed_origin,
            allocation.user_id,
            'mentorship_credit_allocations'::text as legacy_source,
            allocation.id as legacy_id,
            allocation.subscription_id,
            null::uuid as contract_id,
            grant_transaction.student_payment_id,
            grant_transaction.id as grant_transaction_id,
            allocation.amount + allocation.compensatory_refunds as granted_amount,
            allocation.remaining_amount,
            allocation.available_at,
            allocation.expires_at,
            allocation.remaining_amount
                - (allocation.amount + allocation.compensatory_refunds)
                as reconciliation_movement_amount,
            case
                when allocation.status <> 'active'
                    then 'mentorship_allocation_has_remaining_balance_with_non_active_status'
                when allocation.available_at > now()
                    then 'mentorship_allocation_has_balance_before_availability'
                when allocation.expires_at <= now()
                    then 'mentorship_allocation_has_remaining_balance_after_expiration'
                when grant_transaction.id is not null
                    and grant_transaction.amount <> allocation.amount
                    then 'mentorship_grant_amount_differs_from_cycle_amount'
                when grant_transaction.id is null
                    then 'mentorship_allocation_missing_matching_grant_transaction'
                else 'mentorship_cycle_and_grant_transaction_match'
            end as reason,
            jsonb_strip_nulls(
                jsonb_build_object(
                    'legacy_source', 'mentorship_credit_allocations',
                    'legacy_allocation_id', allocation.id,
                    'legacy_status', allocation.status,
                    'mentorship_access_id', allocation.mentorship_access_id,
                    'mentorship_cycle_number', allocation.cycle_number,
                    'compensatory_refunds', allocation.compensatory_refunds,
                    'subscription_id', allocation.subscription_id,
                    'legacy_grant_transaction_id', allocation.grant_transaction_id,
                    'legacy_expiration_transaction_id', allocation.expiration_transaction_id,
                    'grant_metadata', grant_transaction.metadata
                )
            ) as proposed_metadata
        from public.mentorship_credit_allocations as allocation
        left join public.credit_transactions as grant_transaction
          on grant_transaction.id = allocation.grant_transaction_id
         and grant_transaction.user_id = allocation.user_id
         and grant_transaction.type = 'mentorship_bonus'
         and grant_transaction.amount > 0
         and grant_transaction.metadata ->> 'mentorship_allocation_id' = allocation.id::text
        where allocation.remaining_amount > 0
    ), subscription_candidates as (
        select
            credits.user_id,
            credits.plan_credits,
            subscription.id as subscription_id,
            subscription.status as subscription_status,
            subscription.current_period_start,
            subscription.current_period_end,
            contract.id as contract_id,
            contract.credits_included,
            contract.credits_expiration_days,
            grant_transaction.id as grant_transaction_id,
            grant_transaction.type as grant_transaction_type,
            grant_transaction.amount as grant_transaction_amount,
            grant_transaction.student_payment_id,
            grant_transaction.created_at as grant_created_at,
            grant_transaction.metadata as grant_metadata,
            contamination.adjustment_count,
            contamination.other_grant_count,
            payment.user_id as payment_user_id,
            payment.subscription_id as payment_subscription_id,
            payment.kind as payment_kind
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
        left join lateral (
            select candidate.*
            from public.credit_transactions as candidate
            where candidate.user_id = credits.user_id
              and candidate.amount > 0
              and candidate.type in (
                  'plan_renewal',
                  'plan_change',
                  'new_subscription',
                  'subscription_reactivation'
              )
              and candidate.metadata ->> 'subscription_id' = subscription.id::text
              and (
                  candidate.metadata ->> 'contract_id' = contract.id::text
                  or candidate.metadata ->> 'target_contract_id' = contract.id::text
              )
            order by candidate.created_at desc, candidate.id desc
            limit 1
        ) as grant_transaction on true
        left join lateral (
            select
                count(*) filter (
                    where candidate.type = 'administrative_adjustment'
                ) as adjustment_count,
                count(*) filter (
                    where candidate.amount > 0
                      and candidate.type in (
                          'plan_renewal',
                          'plan_change',
                          'new_subscription',
                          'subscription_reactivation',
                          'free_trial_grant'
                      )
                      and candidate.id is distinct from grant_transaction.id
                ) as other_grant_count
            from public.credit_transactions as candidate
            where candidate.user_id = credits.user_id
              and candidate.created_at >= coalesce(
                  grant_transaction.created_at,
                  subscription.current_period_start,
                  '-infinity'::timestamptz
              )
              and coalesce(candidate.metadata ->> 'credit_type', 'plan') = 'plan'
              and coalesce(candidate.metadata ->> 'plan_source', '') <> 'mentorship'
              and candidate.metadata ->> 'mentorship_allocation_id' is null
        ) as contamination on true
        left join public.student_payments as payment
          on payment.id = grant_transaction.student_payment_id
        where credits.plan_credits > 0
    ), classified_subscriptions as (
        select
            'candidate'::text as record_kind,
            case
                when candidate.subscription_id is null
                    or candidate.contract_id is null
                    then 'ambiguous'
                when candidate.plan_credits > candidate.credits_included
                    or candidate.credits_included <= 0
                    then 'inconsistency'
                when candidate.current_period_end is not null
                    and candidate.current_period_end <= now()
                    then 'inconsistency'
                when candidate.student_payment_id is not null
                    and (
                        candidate.payment_user_id is distinct from candidate.user_id
                        or candidate.payment_subscription_id is distinct from candidate.subscription_id
                        or candidate.payment_kind not in ('subscription', 'plan_upgrade_prorata')
                    )
                    then 'inconsistency'
                when candidate.adjustment_count > 0
                    or candidate.other_grant_count > 0
                    then 'fallback'
                when candidate.grant_transaction_id is null
                    then 'fallback'
                when candidate.grant_transaction_type = 'plan_change'
                    and candidate.grant_metadata ->> 'final_subscription_credits'
                        is distinct from candidate.credits_included::text
                    then 'fallback'
                when candidate.grant_transaction_type <> 'plan_change'
                    and candidate.grant_transaction_amount is distinct from candidate.credits_included
                    then 'fallback'
                else 'migratable'
            end as classification,
            'subscription'::text as proposed_origin,
            candidate.user_id,
            'student_credits.plan_credits'::text as legacy_source,
            candidate.grant_transaction_id as legacy_id,
            candidate.subscription_id,
            candidate.contract_id,
            candidate.student_payment_id,
            candidate.grant_transaction_id,
            candidate.credits_included as granted_amount,
            candidate.plan_credits as remaining_amount,
            coalesce(candidate.current_period_start, candidate.grant_created_at) as available_at,
            coalesce(
                candidate.current_period_end,
                candidate.grant_created_at
                    + make_interval(days => candidate.credits_expiration_days)
            ) as expires_at,
            candidate.plan_credits - candidate.credits_included
                as reconciliation_movement_amount,
            case
                when candidate.subscription_id is null
                    then 'positive_plan_balance_without_active_subscription'
                when candidate.contract_id is null
                    then 'positive_plan_balance_without_active_contract'
                when candidate.credits_included <= 0
                    then 'active_contract_has_no_positive_credit_grant'
                when candidate.plan_credits > candidate.credits_included
                    then 'plan_balance_exceeds_active_contract_credit_grant'
                when candidate.current_period_end is not null
                    and candidate.current_period_end <= now()
                    then 'plan_balance_remains_after_subscription_period_end'
                when candidate.student_payment_id is not null
                    and (
                        candidate.payment_user_id is distinct from candidate.user_id
                        or candidate.payment_subscription_id is distinct from candidate.subscription_id
                        or candidate.payment_kind not in ('subscription', 'plan_upgrade_prorata')
                    )
                    then 'grant_payment_does_not_match_subscription_owner'
                when candidate.adjustment_count > 0
                    then 'current_plan_balance_contains_legacy_administrative_adjustment'
                when candidate.other_grant_count > 0
                    then 'current_plan_balance_has_multiple_possible_grant_events'
                when candidate.grant_transaction_id is null
                    then 'active_contract_found_but_original_grant_not_identified'
                when candidate.grant_transaction_type = 'plan_change'
                    and candidate.grant_metadata ->> 'final_subscription_credits'
                        is distinct from candidate.credits_included::text
                    then 'upgrade_grant_does_not_reconcile_with_active_contract'
                when candidate.grant_transaction_type <> 'plan_change'
                    and candidate.grant_transaction_amount is distinct from candidate.credits_included
                    then 'subscription_grant_amount_differs_from_active_contract'
                else 'active_subscription_contract_and_grant_match'
            end as reason,
            jsonb_strip_nulls(
                jsonb_build_object(
                    'legacy_source', 'student_credits.plan_credits',
                    'subscription_id', candidate.subscription_id,
                    'contract_id', candidate.contract_id,
                    'student_payment_id', candidate.student_payment_id,
                    'grant_transaction_id', candidate.grant_transaction_id,
                    'grant_transaction_type', candidate.grant_transaction_type,
                    'legacy_adjustment_count', candidate.adjustment_count,
                    'other_possible_grant_count', candidate.other_grant_count,
                    'grant_metadata', candidate.grant_metadata,
                    'upgrade_eligible_only_while_contract_active', true
                )
            ) as proposed_metadata
        from subscription_candidates as candidate
    ), extra_ledger as (
        select
            transaction.user_id,
            coalesce(
                sum(
                    case
                        when transaction.type = 'standalone_purchase' then transaction.amount
                        when transaction.type in (
                            'essay_usage',
                            'essay_refund',
                            'administrative_adjustment'
                        )
                        and transaction.metadata ->> 'credit_type' = 'extra'
                            then transaction.amount
                        else 0
                    end
                ),
                0
            )::integer as ledger_balance,
            count(*) filter (
                where transaction.type = 'standalone_purchase'
                  and transaction.amount > 0
            ) as purchase_count,
            count(*) filter (
                where transaction.type = 'administrative_adjustment'
                  and transaction.metadata ->> 'credit_type' = 'extra'
            ) as adjustment_count,
            (array_agg(
                transaction.id
                order by transaction.created_at, transaction.id
            ) filter (
                where transaction.type = 'standalone_purchase'
                  and transaction.amount > 0
            ))[1] as purchase_transaction_id
        from public.credit_transactions as transaction
        where transaction.type = 'standalone_purchase'
           or (
               transaction.type in (
                   'essay_usage',
                   'essay_refund',
                   'administrative_adjustment'
               )
               and transaction.metadata ->> 'credit_type' = 'extra'
           )
        group by transaction.user_id
    ), extra_candidates as (
        select
            'candidate'::text as record_kind,
            case
                when coalesce(ledger.ledger_balance, 0) <> credits.extra_credits
                    then 'inconsistency'
                when ledger.purchase_count = 1
                    and ledger.adjustment_count = 0
                    and credits.extra_credits <= purchase.amount
                    and (
                        purchase.student_payment_id is null
                        or (
                            payment.user_id = credits.user_id
                            and payment.kind = 'extra_credits'
                        )
                    )
                    then 'migratable'
                else 'ambiguous'
            end as classification,
            case
                when coalesce(ledger.ledger_balance, 0) = credits.extra_credits
                    and ledger.purchase_count = 1
                    and ledger.adjustment_count = 0
                    and credits.extra_credits <= purchase.amount
                    and (
                        purchase.student_payment_id is null
                        or (
                            payment.user_id = credits.user_id
                            and payment.kind = 'extra_credits'
                        )
                    )
                    then 'extra_purchase'
                else 'legacy_unclassified'
            end as proposed_origin,
            credits.user_id,
            'student_credits.extra_credits'::text as legacy_source,
            purchase.id as legacy_id,
            null::uuid as subscription_id,
            null::uuid as contract_id,
            purchase.student_payment_id,
            purchase.id as grant_transaction_id,
            purchase.amount as granted_amount,
            credits.extra_credits as remaining_amount,
            purchase.created_at as available_at,
            null::timestamptz as expires_at,
            case
                when purchase.amount is not null
                    then credits.extra_credits - purchase.amount
                else null
            end as reconciliation_movement_amount,
            case
                when coalesce(ledger.ledger_balance, 0) <> credits.extra_credits
                    then 'extra_credit_ledger_does_not_match_aggregate_balance'
                when ledger.purchase_count = 0
                    then 'extra_balance_without_purchase_transaction'
                when ledger.purchase_count > 1
                    then 'remaining_extra_balance_cannot_be_assigned_between_purchases'
                when ledger.adjustment_count > 0
                    then 'extra_balance_contains_legacy_administrative_adjustments'
                when credits.extra_credits > purchase.amount
                    then 'extra_balance_exceeds_single_purchase_grant'
                when purchase.student_payment_id is not null
                    and (
                        payment.user_id is distinct from credits.user_id
                        or payment.kind is distinct from 'extra_credits'
                    )
                    then 'extra_purchase_payment_does_not_match_owner_or_kind'
                else 'single_extra_purchase_and_ledger_match'
            end as reason,
            jsonb_strip_nulls(
                jsonb_build_object(
                    'legacy_source', 'student_credits.extra_credits',
                    'purchase_transaction_id', purchase.id,
                    'student_payment_id', purchase.student_payment_id,
                    'purchase_count', ledger.purchase_count,
                    'legacy_adjustment_count', ledger.adjustment_count,
                    'ledger_balance', ledger.ledger_balance,
                    'grant_metadata', purchase.metadata
                )
            ) as proposed_metadata
        from public.student_credits as credits
        left join extra_ledger as ledger
          on ledger.user_id = credits.user_id
        left join public.credit_transactions as purchase
          on purchase.id = ledger.purchase_transaction_id
        left join public.student_payments as payment
          on payment.id = purchase.student_payment_id
        where credits.extra_credits > 0
    ), free_reconciliation as (
        select
            'reconciliation'::text as record_kind,
            'inconsistency'::text as classification,
            'free_promotional'::text as proposed_origin,
            users.user_id,
            'student_credits.free_credits'::text as legacy_source,
            null::uuid as legacy_id,
            null::uuid as subscription_id,
            null::uuid as contract_id,
            null::uuid as student_payment_id,
            null::uuid as grant_transaction_id,
            allocation_balance.remaining_amount as granted_amount,
            aggregate_balance.free_credits as remaining_amount,
            null::timestamptz as available_at,
            null::timestamptz as expires_at,
            null::integer as reconciliation_movement_amount,
            'free_allocation_balance_does_not_match_student_credits'::text as reason,
            jsonb_build_object(
                'student_credits_balance', coalesce(aggregate_balance.free_credits, 0),
                'free_allocations_balance', coalesce(allocation_balance.remaining_amount, 0)
            ) as proposed_metadata
        from (
            select credits.user_id
            from public.student_credits as credits
            union
            select allocations.user_id
            from public.free_credit_allocations as allocations
        ) as users
        left join public.student_credits as aggregate_balance
          on aggregate_balance.user_id = users.user_id
        left join (
            select
                allocations.user_id,
                sum(allocations.remaining_amount)::integer as remaining_amount
            from public.free_credit_allocations as allocations
            group by allocations.user_id
        ) as allocation_balance
          on allocation_balance.user_id = users.user_id
        where coalesce(aggregate_balance.free_credits, 0)
            <> coalesce(allocation_balance.remaining_amount, 0)
    ), extra_reconciliation as (
        select
            'reconciliation'::text as record_kind,
            'inconsistency'::text as classification,
            'legacy_unclassified'::text as proposed_origin,
            ledger.user_id,
            'student_credits.extra_credits'::text as legacy_source,
            null::uuid as legacy_id,
            null::uuid as subscription_id,
            null::uuid as contract_id,
            null::uuid as student_payment_id,
            null::uuid as grant_transaction_id,
            ledger.ledger_balance as granted_amount,
            coalesce(credits.extra_credits, 0) as remaining_amount,
            null::timestamptz as available_at,
            null::timestamptz as expires_at,
            null::integer as reconciliation_movement_amount,
            'extra_credit_ledger_exists_without_matching_aggregate_balance'::text as reason,
            jsonb_build_object(
                'student_credits_balance', coalesce(credits.extra_credits, 0),
                'extra_ledger_balance', ledger.ledger_balance,
                'purchase_count', ledger.purchase_count,
                'legacy_adjustment_count', ledger.adjustment_count
            ) as proposed_metadata
        from extra_ledger as ledger
        left join public.student_credits as credits
          on credits.user_id = ledger.user_id
        where coalesce(credits.extra_credits, 0) = 0
          and ledger.ledger_balance <> 0
    ), negative_aggregate_balances as (
        select
            'reconciliation'::text as record_kind,
            'inconsistency'::text as classification,
            'legacy_unclassified'::text as proposed_origin,
            credits.user_id,
            ('student_credits.' || wallet.wallet_name)::text as legacy_source,
            null::uuid as legacy_id,
            null::uuid as subscription_id,
            null::uuid as contract_id,
            null::uuid as student_payment_id,
            null::uuid as grant_transaction_id,
            null::integer as granted_amount,
            wallet.balance as remaining_amount,
            null::timestamptz as available_at,
            null::timestamptz as expires_at,
            null::integer as reconciliation_movement_amount,
            ('negative_aggregate_balance_' || wallet.wallet_name)::text as reason,
            jsonb_build_object(
                'wallet', wallet.wallet_name,
                'balance', wallet.balance
            ) as proposed_metadata
        from public.student_credits as credits
        cross join lateral (
            values
                ('plan_credits'::text, credits.plan_credits),
                ('extra_credits'::text, credits.extra_credits)
        ) as wallet(wallet_name, balance)
        where wallet.balance < 0
    ), audit_rows as (
        select * from free_candidates
        union all
        select * from mentorship_candidates
        union all
        select * from classified_subscriptions
        union all
        select * from extra_candidates
        union all
        select * from free_reconciliation
        union all
        select * from extra_reconciliation
        union all
        select * from negative_aggregate_balances
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
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    if p_apply is distinct from false then
        raise exception 'O backfill de allocations ainda não está habilitado; execute somente em dry-run.'
            using errcode = '0A000';
    end if;

    with audit as materialized (
        select *
        from public.audit_credit_allocation_backfill()
    )
    select jsonb_build_object(
        'dry_run', true,
        'apply_supported', false,
        'rules_version', 1,
        'generated_at', now(),
        'total_analyzed', count(*),
        'candidate_records', count(*) filter (where record_kind = 'candidate'),
        'reconciliation_records', count(*) filter (where record_kind = 'reconciliation'),
        'students_analyzed', count(distinct user_id),
        'classification_definitions', jsonb_build_object(
            'migratable', 'origin_and_balance_reconstructed_with_matching_evidence',
            'fallback', 'origin_known_but_original_evidence_requires_an_explicit_fallback_rule',
            'ambiguous', 'origin_cannot_be_safely_reconstructed; report_only',
            'inconsistency', 'legacy_sources_contradict_each_other_or_violate_current_rules'
        ),
        'schema_note', 'subscription_id_and_student_payment_id_are_reported_but_not_yet_columns_of_credit_allocations',
        'migratable', jsonb_build_object(
            'total', count(*) filter (where classification = 'migratable'),
            'credits', coalesce(
                sum(remaining_amount) filter (where classification = 'migratable'),
                0
            ),
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
            'credits', coalesce(
                sum(remaining_amount) filter (where classification = 'fallback'),
                0
            ),
            'details', coalesce(
                jsonb_agg(to_jsonb(audit) order by user_id, proposed_origin, legacy_id)
                    filter (where classification = 'fallback'),
                '[]'::jsonb
            )
        ),
        'ambiguous', jsonb_build_object(
            'total', count(*) filter (where classification = 'ambiguous'),
            'credits', coalesce(
                sum(remaining_amount) filter (where classification = 'ambiguous'),
                0
            ),
            'details', coalesce(
                jsonb_agg(to_jsonb(audit) order by user_id, proposed_origin, legacy_id)
                    filter (where classification = 'ambiguous'),
                '[]'::jsonb
            )
        ),
        'inconsistencies', jsonb_build_object(
            'total', count(*) filter (where classification = 'inconsistency'),
            'details', coalesce(
                jsonb_agg(to_jsonb(audit) order by user_id, proposed_origin, legacy_id)
                    filter (where classification = 'inconsistency'),
                '[]'::jsonb
            )
        ),
        'migration_candidates', coalesce(
            jsonb_agg(to_jsonb(audit) order by user_id, proposed_origin, legacy_id)
                filter (where classification = 'migratable'),
            '[]'::jsonb
        )
    )
    into v_report
    from audit;

    return v_report;
end;
$$;

revoke all on function public.audit_credit_allocation_backfill()
from public, anon, authenticated;

grant execute on function public.audit_credit_allocation_backfill()
to service_role;

revoke all on function public.backfill_credit_allocations(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_credit_allocations(boolean)
to service_role;

commit;

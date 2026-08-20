begin;

alter function public.audit_credit_allocation_backfill()
    rename to audit_credit_allocation_backfill_v1;

revoke all on function public.audit_credit_allocation_backfill_v1()
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
    select
        audit.record_kind,
        case
            when audit.classification = 'fallback'
                 and audit.proposed_origin in ('free_promotional', 'mentorship')
                then 'migratable'
            when audit.classification = 'ambiguous'
                 and audit.proposed_origin = 'legacy_unclassified'
                 and audit.reason in (
                     'extra_balance_without_purchase_transaction',
                     'remaining_extra_balance_cannot_be_assigned_between_purchases',
                     'extra_balance_contains_legacy_administrative_adjustments'
                 )
                then 'fallback'
            else audit.classification
        end as classification,
        case
            when audit.classification = 'fallback'
                 and audit.proposed_origin = 'subscription'
                then 'legacy_unclassified'
            else audit.proposed_origin
        end as proposed_origin,
        audit.user_id,
        audit.legacy_source,
        audit.legacy_id,
        audit.subscription_id,
        audit.contract_id,
        audit.student_payment_id,
        audit.grant_transaction_id,
        audit.granted_amount,
        audit.remaining_amount,
        audit.available_at,
        audit.expires_at,
        audit.reconciliation_movement_amount,
        audit.reason,
        coalesce(audit.proposed_metadata, '{}'::jsonb)
            || jsonb_build_object(
                'audit_rules_version', 2,
                'original_classification', audit.classification,
                'original_proposed_origin', audit.proposed_origin,
                'upgrade_eligible',
                    audit.classification = 'migratable'
                    and audit.proposed_origin = 'subscription'
            ) as proposed_metadata
    from public.audit_credit_allocation_backfill_v1() as audit;
end;
$$;

revoke all on function public.audit_credit_allocation_backfill()
from public, anon, authenticated;

grant execute on function public.audit_credit_allocation_backfill()
to service_role;

alter function public.backfill_credit_allocations(boolean)
    rename to backfill_credit_allocations_v1;

revoke all on function public.backfill_credit_allocations_v1(boolean)
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
    v_granted_amount integer;
    v_reconciliation_amount integer;
    v_idempotency_key text;
    v_allocation_inserted integer;
    v_allocations_planned bigint := 0;
    v_movements_planned bigint := 0;
    v_legacy_unclassified_planned bigint := 0;
    v_allocations_inserted bigint := 0;
    v_movements_inserted bigint := 0;
    v_legacy_unclassified_inserted bigint := 0;
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Acesso não autorizado.';
    end if;

    if p_apply is distinct from true then
        v_report := public.backfill_credit_allocations_v1(false)
            || jsonb_build_object(
                'rules_version', 2,
                'schema_note', 'subscription_id, contract_id and student_payment_id use typed relations'
            );

        select
            count(*),
            count(*)
                + count(*) filter (
                    where audit.remaining_amount
                        < greatest(
                            coalesce(audit.granted_amount, audit.remaining_amount),
                            audit.remaining_amount
                        )
                ),
            count(*) filter (where audit.classification = 'fallback')
        into
            v_allocations_planned,
            v_movements_planned,
            v_legacy_unclassified_planned
        from public.audit_credit_allocation_backfill() as audit
        where audit.record_kind = 'candidate'
          and audit.classification in ('migratable', 'fallback')
          and audit.remaining_amount > 0;

        return v_report || jsonb_build_object(
            'dry_run', true,
            'apply_supported', true,
            'planned', jsonb_build_object(
                'allocations', v_allocations_planned,
                'movements', v_movements_planned,
                'legacy_unclassified', v_legacy_unclassified_planned
            ),
            'inserted', jsonb_build_object(
                'allocations', 0,
                'movements', 0,
                'legacy_unclassified', 0
            )
        );
    end if;

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

    v_report := public.backfill_credit_allocations_v1(false)
        || jsonb_build_object(
            'rules_version', 2,
            'schema_note', 'subscription_id, contract_id and student_payment_id use typed relations'
        );

    select
        count(*),
        count(*)
            + count(*) filter (
                where audit.remaining_amount
                    < greatest(
                        coalesce(audit.granted_amount, audit.remaining_amount),
                        audit.remaining_amount
                    )
            ),
        count(*) filter (where audit.classification = 'fallback')
    into
        v_allocations_planned,
        v_movements_planned,
        v_legacy_unclassified_planned
    from public.audit_credit_allocation_backfill() as audit
    where audit.record_kind = 'candidate'
      and audit.classification in ('migratable', 'fallback')
      and audit.remaining_amount > 0;

    for v_candidate in
        select audit.*
        from public.audit_credit_allocation_backfill() as audit
        where audit.record_kind = 'candidate'
          and audit.classification in ('migratable', 'fallback')
          and audit.remaining_amount > 0
        order by audit.user_id, audit.legacy_source, audit.legacy_id
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

        v_idempotency_key := format(
            'credit-allocation-backfill:v1:%s:%s:%s',
            v_candidate.legacy_source,
            v_candidate.user_id,
            coalesce(v_candidate.legacy_id::text, 'aggregate')
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
            v_candidate.subscription_id,
            case
                when v_origin = 'subscription'
                    then v_candidate.contract_id
                else null
            end,
            case
                when v_candidate.classification = 'migratable'
                    then v_candidate.student_payment_id
                else null
            end,
            v_granted_amount,
            coalesce(v_candidate.available_at, now()),
            v_candidate.expires_at,
            case
                when v_candidate.classification = 'fallback'
                    then format('Legacy credit fallback: %s', v_candidate.reason)
                else null
            end,
            format(
                '%s:%s',
                v_candidate.legacy_source,
                coalesce(v_candidate.legacy_id::text, v_candidate.user_id::text)
            ),
            v_idempotency_key,
            coalesce(v_candidate.proposed_metadata, '{}'::jsonb)
                || jsonb_build_object(
                    'backfill_version', 1,
                    'backfill_classification', v_candidate.classification,
                    'backfill_reason', v_candidate.reason,
                    'reported_subscription_id', v_candidate.subscription_id,
                    'reported_contract_id', v_candidate.contract_id,
                    'reported_student_payment_id', v_candidate.student_payment_id,
                    'reported_grant_transaction_id', v_candidate.grant_transaction_id,
                    'upgrade_eligible', v_origin = 'subscription'
                )
        )
        on conflict (idempotency_key)
            where idempotency_key is not null
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
            v_legacy_unclassified_inserted :=
                v_legacy_unclassified_inserted + 1;
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
                'backfill_version', 1,
                'legacy_source', v_candidate.legacy_source,
                'legacy_id', v_candidate.legacy_id,
                'classification', v_candidate.classification,
                'reason', v_candidate.reason
            ),
            case
                when v_candidate.classification = 'migratable'
                    then v_candidate.grant_transaction_id
                else null
            end
        );

        v_movements_inserted := v_movements_inserted + 1;

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
                    'backfill_version', 1,
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
        'apply_supported', true,
        'planned', jsonb_build_object(
            'allocations', v_allocations_planned,
            'movements', v_movements_planned,
            'legacy_unclassified', v_legacy_unclassified_planned
        ),
        'inserted', jsonb_build_object(
            'allocations', v_allocations_inserted,
            'movements', v_movements_inserted,
            'legacy_unclassified', v_legacy_unclassified_inserted
        )
    );
end;
$$;

revoke all on function public.backfill_credit_allocations(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_credit_allocations(boolean)
to service_role;

commit;

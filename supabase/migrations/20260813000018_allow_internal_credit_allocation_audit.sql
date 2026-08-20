begin;

alter function public.audit_credit_allocation_backfill()
    rename to audit_credit_allocation_backfill_v3;

revoke all on function public.audit_credit_allocation_backfill_v3()
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
declare
    v_previous_jwt_claims text;
begin
    if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
        return query
        select *
        from public.audit_credit_allocation_backfill_v3();
        return;
    end if;

    if session_user <> 'postgres' then
        raise exception 'Acesso não autorizado.';
    end if;

    v_previous_jwt_claims := current_setting('request.jwt.claims', true);

    perform set_config(
        'request.jwt.claims',
        '{"role":"service_role"}',
        true
    );

    begin
        return query
        select *
        from public.audit_credit_allocation_backfill_v3();
    exception
        when others then
            perform set_config(
                'request.jwt.claims',
                coalesce(v_previous_jwt_claims, '{}'),
                true
            );
            raise;
    end;

    perform set_config(
        'request.jwt.claims',
        coalesce(v_previous_jwt_claims, '{}'),
        true
    );
end;
$$;

revoke all on function public.audit_credit_allocation_backfill()
from public, anon, authenticated;

grant execute on function public.audit_credit_allocation_backfill()
to service_role;

alter function public.backfill_credit_allocations(boolean)
    rename to backfill_credit_allocations_v3;

revoke all on function public.backfill_credit_allocations_v3(boolean)
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
    v_previous_jwt_claims text;
    v_report jsonb;
begin
    if p_apply is true then
        if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
           or session_user = 'postgres' then
            raise exception 'Acesso não autorizado para aplicar o backfill.';
        end if;

        return public.backfill_credit_allocations_v3(true);
    end if;

    if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
        return public.backfill_credit_allocations_v3(false);
    end if;

    if session_user <> 'postgres' then
        raise exception 'Acesso não autorizado.';
    end if;

    v_previous_jwt_claims := current_setting('request.jwt.claims', true);

    perform set_config(
        'request.jwt.claims',
        '{"role":"service_role"}',
        true
    );

    begin
        v_report := public.backfill_credit_allocations_v3(false);
    exception
        when others then
            perform set_config(
                'request.jwt.claims',
                coalesce(v_previous_jwt_claims, '{}'),
                true
            );
            raise;
    end;

    perform set_config(
        'request.jwt.claims',
        coalesce(v_previous_jwt_claims, '{}'),
        true
    );

    return v_report;
end;
$$;

revoke all on function public.backfill_credit_allocations(boolean)
from public, anon, authenticated;

grant execute on function public.backfill_credit_allocations(boolean)
to service_role;

commit;

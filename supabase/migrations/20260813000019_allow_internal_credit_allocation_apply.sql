begin;

create or replace function public.backfill_credit_allocations(
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
        if session_user <> 'postgres' then
            raise exception 'Acesso não autorizado para aplicar o backfill.';
        end if;

        v_previous_jwt_claims := current_setting('request.jwt.claims', true);

        perform set_config(
            'request.jwt.claims',
            '{"role":"service_role"}',
            true
        );

        begin
            v_report := public.backfill_credit_allocations_v3(true);
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

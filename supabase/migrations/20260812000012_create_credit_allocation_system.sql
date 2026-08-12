begin;

create type public.credit_allocation_origin as enum (
    'subscription',
    'admin_adjustment',
    'mentorship',
    'extra_purchase',
    'free_promotional'
);

create type public.credit_allocation_status as enum (
    'active',
    'depleted',
    'expired'
);

create type public.credit_allocation_movement_type as enum (
    'consumption',
    'expiration',
    'refund',
    'adjustment'
);

create type public.credit_reservation_status as enum (
    'active',
    'consumed',
    'released',
    'expired'
);

create table public.credit_allocations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    origin public.credit_allocation_origin not null,
    subscription_contract_id uuid references public.subscription_contracts(id) on delete restrict,
    granted_amount integer not null,
    remaining_amount integer not null default 0,
    reserved_amount integer not null default 0,
    status public.credit_allocation_status not null default 'active',
    available_at timestamptz not null default now(),
    expires_at timestamptz,
    reason text,
    source_reference text,
    idempotency_key text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint credit_allocations_granted_amount_positive
        check (granted_amount > 0),
    constraint credit_allocations_remaining_amount_non_negative
        check (remaining_amount >= 0),
    constraint credit_allocations_reserved_amount_valid
        check (reserved_amount >= 0 and reserved_amount <= remaining_amount),
    constraint credit_allocations_status_balance_consistent
        check (
            (status = 'active' and remaining_amount > 0)
            or (status in ('depleted', 'expired') and remaining_amount = 0)
        ),
    constraint credit_allocations_expiration_valid
        check (expires_at is null or expires_at > available_at),
    constraint credit_allocations_subscription_contract_consistent
        check (
            (origin = 'subscription' and subscription_contract_id is not null)
            or (origin <> 'subscription' and subscription_contract_id is null)
        ),
    constraint credit_allocations_admin_reason_required
        check (
            origin <> 'admin_adjustment'
            or (
                reason is not null
                and length(btrim(reason)) > 0
                and expires_at is not null
            )
        ),
    constraint credit_allocations_reason_not_blank
        check (reason is null or length(btrim(reason)) > 0),
    constraint credit_allocations_source_reference_not_blank
        check (source_reference is null or length(btrim(source_reference)) > 0),
    constraint credit_allocations_idempotency_key_not_blank
        check (idempotency_key is null or length(btrim(idempotency_key)) > 0),
    constraint credit_allocations_metadata_object
        check (jsonb_typeof(metadata) = 'object')
);

create table public.credit_reservations (
    id uuid primary key default gen_random_uuid(),
    allocation_id uuid not null references public.credit_allocations(id) on delete cascade,
    amount integer not null,
    status public.credit_reservation_status not null default 'active',
    purpose text not null,
    idempotency_key text,
    expires_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    resolved_at timestamptz,
    constraint credit_reservations_amount_positive
        check (amount > 0),
    constraint credit_reservations_purpose_not_blank
        check (length(btrim(purpose)) > 0),
    constraint credit_reservations_idempotency_key_not_blank
        check (idempotency_key is null or length(btrim(idempotency_key)) > 0),
    constraint credit_reservations_expiration_valid
        check (expires_at is null or expires_at > created_at),
    constraint credit_reservations_resolution_consistent
        check (
            (status = 'active' and resolved_at is null)
            or (status <> 'active' and resolved_at is not null)
        ),
    constraint credit_reservations_metadata_object
        check (jsonb_typeof(metadata) = 'object')
);

create table public.credit_allocation_movements (
    id uuid primary key default gen_random_uuid(),
    allocation_id uuid not null references public.credit_allocations(id) on delete cascade,
    reservation_id uuid,
    type public.credit_allocation_movement_type not null,
    amount integer not null,
    description text not null,
    idempotency_key text,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint credit_allocation_movements_amount_non_zero
        check (amount <> 0),
    constraint credit_allocation_movements_amount_direction
        check (
            (type in ('consumption', 'expiration') and amount < 0)
            or (type = 'refund' and amount > 0)
            or type = 'adjustment'
        ),
    constraint credit_allocation_movements_description_not_blank
        check (length(btrim(description)) > 0),
    constraint credit_allocation_movements_idempotency_key_not_blank
        check (idempotency_key is null or length(btrim(idempotency_key)) > 0),
    constraint credit_allocation_movements_metadata_object
        check (jsonb_typeof(metadata) = 'object'),
    constraint credit_allocation_movements_reservation_consistent
        check (
            reservation_id is null
            or type = 'consumption'
        ),
    constraint credit_allocation_movements_reservation_id_fkey
        foreign key (reservation_id)
        references public.credit_reservations(id)
        on delete restrict
);

create unique index credit_allocations_idempotency_key_unique
    on public.credit_allocations (idempotency_key)
    where idempotency_key is not null;

create index credit_allocations_consumption_order_idx
    on public.credit_allocations (
        user_id,
        expires_at asc nulls last,
        ((origin = 'subscription')) asc,
        available_at,
        created_at,
        id
    )
    where status = 'active' and remaining_amount > reserved_amount;

create index credit_allocations_subscription_contract_idx
    on public.credit_allocations (subscription_contract_id, user_id, expires_at)
    where origin = 'subscription' and status = 'active';

create index credit_allocation_movements_allocation_created_idx
    on public.credit_allocation_movements (allocation_id, created_at, id);

create unique index credit_allocation_movements_idempotency_key_unique
    on public.credit_allocation_movements (idempotency_key)
    where idempotency_key is not null;

create unique index credit_allocation_movements_reservation_unique
    on public.credit_allocation_movements (reservation_id)
    where reservation_id is not null;

create index credit_reservations_active_allocation_idx
    on public.credit_reservations (allocation_id, expires_at, created_at)
    where status = 'active';

create unique index credit_reservations_idempotency_key_unique
    on public.credit_reservations (idempotency_key)
    where idempotency_key is not null;

create function public.initialize_credit_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_contract_user_id uuid;
begin
    new.remaining_amount := new.granted_amount;
    new.reserved_amount := 0;
    new.status := 'active';
    new.updated_at := now();

    if new.origin = 'subscription' then
        select subscriptions.user_id
        into v_contract_user_id
        from public.subscription_contracts
        join public.subscriptions
          on subscriptions.id = subscription_contracts.subscription_id
        where subscription_contracts.id = new.subscription_contract_id;

        if v_contract_user_id is null or v_contract_user_id <> new.user_id then
            raise exception 'Subscription credit allocation must belong to the contract owner'
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

create function public.protect_credit_allocation_balances()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if pg_trigger_depth() = 1
       and (
           new.remaining_amount is distinct from old.remaining_amount
           or new.reserved_amount is distinct from old.reserved_amount
           or new.status is distinct from old.status
       ) then
        raise exception 'Allocation balances and status can only be changed by internal ledger operations'
            using errcode = '55000';
    end if;

    new.updated_at := now();
    return new;
end;
$$;

create function public.apply_credit_allocation_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_allocation public.credit_allocations%rowtype;
    v_new_remaining integer;
    v_new_status public.credit_allocation_status;
begin
    select *
    into v_allocation
    from public.credit_allocations
    where id = new.allocation_id
    for update;

    if not found then
        raise exception 'Credit allocation % does not exist', new.allocation_id
            using errcode = '23503';
    end if;

    if v_allocation.status = 'expired' then
        raise exception 'Expired credit allocation % cannot receive movements', new.allocation_id
            using errcode = '55000';
    end if;

    if new.reservation_id is not null
       and not exists (
           select 1
           from public.credit_reservations
           where id = new.reservation_id
             and allocation_id = new.allocation_id
             and status = 'consumed'
       ) then
        raise exception 'Consumed reservation does not belong to the movement allocation'
            using errcode = '23514';
    end if;

    if new.type = 'expiration' then
        if v_allocation.expires_at is null or v_allocation.expires_at > now() then
            raise exception 'Credit allocation % has not expired', new.allocation_id
                using errcode = '55000';
        end if;

        if v_allocation.reserved_amount > 0 then
            raise exception 'Credit allocation % has active reservations', new.allocation_id
                using errcode = '55000';
        end if;

        if new.amount <> -v_allocation.remaining_amount then
            raise exception 'Expiration movement must deplete the allocation balance'
                using errcode = '23514';
        end if;
    elsif new.type = 'consumption'
          and (
              v_allocation.available_at > now()
              or (v_allocation.expires_at is not null and v_allocation.expires_at <= now())
          ) then
        raise exception 'Credit allocation % is not available for consumption', new.allocation_id
            using errcode = '55000';
    end if;

    v_new_remaining := v_allocation.remaining_amount + new.amount;

    if v_new_remaining < v_allocation.reserved_amount then
        raise exception 'Movement would reduce allocation balance below its reserved amount'
            using errcode = '23514';
    end if;

    v_new_status := case
        when v_new_remaining > 0 then 'active'::public.credit_allocation_status
        when new.type = 'expiration' then 'expired'::public.credit_allocation_status
        else 'depleted'::public.credit_allocation_status
    end;

    update public.credit_allocations
    set remaining_amount = v_new_remaining,
        status = v_new_status,
        updated_at = now()
    where id = new.allocation_id;

    return new;
end;
$$;

create function public.prevent_credit_allocation_movement_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    raise exception 'Credit allocation movements are immutable'
        using errcode = '55000';
end;
$$;

create function public.manage_credit_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_allocation public.credit_allocations%rowtype;
begin
    if tg_op = 'INSERT' then
        new.status := 'active';
        new.resolved_at := null;
        new.updated_at := now();

        select *
        into v_allocation
        from public.credit_allocations
        where id = new.allocation_id
        for update;

        if not found then
            raise exception 'Credit allocation % does not exist', new.allocation_id
                using errcode = '23503';
        end if;

        if v_allocation.status <> 'active'
           or v_allocation.available_at > now()
           or (v_allocation.expires_at is not null and v_allocation.expires_at <= now()) then
            raise exception 'Credit allocation % is not available for reservation', new.allocation_id
                using errcode = '55000';
        end if;

        if new.amount > v_allocation.remaining_amount - v_allocation.reserved_amount then
            raise exception 'Insufficient available balance in credit allocation %', new.allocation_id
                using errcode = '23514';
        end if;

        if new.expires_at is not null and new.expires_at <= now() then
            raise exception 'Credit reservation expiration must be in the future'
                using errcode = '23514';
        end if;

        if v_allocation.expires_at is not null
           and (new.expires_at is null or new.expires_at > v_allocation.expires_at) then
            raise exception 'Credit reservation cannot outlive its allocation'
                using errcode = '23514';
        end if;

        update public.credit_allocations
        set reserved_amount = reserved_amount + new.amount,
            updated_at = now()
        where id = new.allocation_id;

        return new;
    end if;

    if new.allocation_id is distinct from old.allocation_id
       or new.amount is distinct from old.amount
       or new.purpose is distinct from old.purpose
       or new.idempotency_key is distinct from old.idempotency_key
       or new.created_at is distinct from old.created_at then
        raise exception 'Reservation identity and amount are immutable'
            using errcode = '55000';
    end if;

    if old.status <> 'active' or new.status = 'active' then
        raise exception 'Credit reservation status transition is invalid'
            using errcode = '55000';
    end if;

    if new.status = 'expired'
       and (old.expires_at is null or old.expires_at > now()) then
        raise exception 'Credit reservation has not expired'
            using errcode = '55000';
    end if;

    update public.credit_allocations
    set reserved_amount = reserved_amount - old.amount,
        updated_at = now()
    where id = old.allocation_id
      and reserved_amount >= old.amount;

    if not found then
        raise exception 'Reserved allocation balance is inconsistent'
            using errcode = '23514';
    end if;

    new.resolved_at := now();
    new.updated_at := now();

    return new;
end;
$$;

create function public.consume_credit_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if old.status = 'active' and new.status = 'consumed' then
        insert into public.credit_allocation_movements (
            allocation_id,
            reservation_id,
            type,
            amount,
            description,
            metadata,
            created_by
        )
        values (
            new.allocation_id,
            new.id,
            'consumption',
            -new.amount,
            'Credit reservation consumed',
            jsonb_build_object('reservation_purpose', new.purpose),
            auth.uid()
        );
    end if;

    return new;
end;
$$;

create trigger initialize_credit_allocation
    before insert on public.credit_allocations
    for each row
    execute function public.initialize_credit_allocation();

create trigger protect_credit_allocation_balances
    before update on public.credit_allocations
    for each row
    execute function public.protect_credit_allocation_balances();

create trigger apply_credit_allocation_movement
    before insert on public.credit_allocation_movements
    for each row
    execute function public.apply_credit_allocation_movement();

create trigger prevent_credit_allocation_movement_update
    before update on public.credit_allocation_movements
    for each row
    execute function public.prevent_credit_allocation_movement_update();

create trigger manage_credit_reservation
    before insert or update on public.credit_reservations
    for each row
    execute function public.manage_credit_reservation();

create trigger consume_credit_reservation
    after update on public.credit_reservations
    for each row
    execute function public.consume_credit_reservation();

revoke all on function public.initialize_credit_allocation() from public, anon, authenticated;
revoke all on function public.protect_credit_allocation_balances() from public, anon, authenticated;
revoke all on function public.apply_credit_allocation_movement() from public, anon, authenticated;
revoke all on function public.prevent_credit_allocation_movement_update() from public, anon, authenticated;
revoke all on function public.manage_credit_reservation() from public, anon, authenticated;
revoke all on function public.consume_credit_reservation() from public, anon, authenticated;

alter table public.credit_allocations enable row level security;
alter table public.credit_allocation_movements enable row level security;
alter table public.credit_reservations enable row level security;

revoke all on table public.credit_allocations from anon, authenticated;
revoke all on table public.credit_allocation_movements from anon, authenticated;
revoke all on table public.credit_reservations from anon, authenticated;

grant select on table public.credit_allocations to authenticated;
grant select on table public.credit_allocation_movements to authenticated;
grant select on table public.credit_reservations to authenticated;

grant all privileges on table public.credit_allocations to service_role;
grant all privileges on table public.credit_allocation_movements to service_role;
grant all privileges on table public.credit_reservations to service_role;

create policy "Students read their own credit allocations"
    on public.credit_allocations
    for select
    to authenticated
    using (user_id = auth.uid() or public.get_my_role() = 'ADMIN');

create policy "Students read their own credit allocation movements"
    on public.credit_allocation_movements
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.credit_allocations
            where credit_allocations.id = credit_allocation_movements.allocation_id
              and (
                  credit_allocations.user_id = auth.uid()
                  or public.get_my_role() = 'ADMIN'
              )
        )
    );

create policy "Students read their own credit reservations"
    on public.credit_reservations
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.credit_allocations
            where credit_allocations.id = credit_reservations.allocation_id
              and (
                  credit_allocations.user_id = auth.uid()
                  or public.get_my_role() = 'ADMIN'
              )
        )
    );

commit;

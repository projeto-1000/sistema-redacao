begin;

alter table public.credit_allocations
    add column subscription_id uuid,
    add column student_payment_id uuid;

alter table public.credit_allocations
    add constraint credit_allocations_subscription_id_fkey
        foreign key (subscription_id)
        references public.subscriptions(id)
        on delete restrict,
    add constraint credit_allocations_student_payment_id_fkey
        foreign key (student_payment_id)
        references public.student_payments(id)
        on delete set null;

alter table public.credit_allocations
    drop constraint credit_allocations_subscription_contract_consistent;

alter table public.credit_allocations
    add constraint credit_allocations_subscription_links_consistent
        check (
            (
                origin = 'subscription'
                and subscription_id is not null
                and subscription_contract_id is not null
            )
            or (
                origin <> 'subscription'
                and subscription_contract_id is null
            )
        );

create index credit_allocations_subscription_idx
    on public.credit_allocations (subscription_id, user_id, status);

create index credit_allocations_student_payment_idx
    on public.credit_allocations (student_payment_id)
    where student_payment_id is not null;

alter table public.credit_allocation_movements
    add column legacy_credit_transaction_id uuid;

alter table public.credit_allocation_movements
    add constraint credit_allocation_movements_legacy_transaction_id_fkey
        foreign key (legacy_credit_transaction_id)
        references public.credit_transactions(id)
        on delete set null,
    add constraint credit_allocation_movements_legacy_transaction_consistent
        check (
            legacy_credit_transaction_id is null
            or type = 'opening_balance'
        );

alter table public.credit_allocation_movements
    drop constraint credit_allocation_movements_amount_direction;

alter table public.credit_allocation_movements
    add constraint credit_allocation_movements_amount_direction
        check (
            (type in ('consumption', 'expiration') and amount < 0)
            or (type in ('refund', 'opening_balance') and amount > 0)
            or type = 'adjustment'
        );

create unique index credit_allocation_movements_one_opening_balance_idx
    on public.credit_allocation_movements (allocation_id)
    where type = 'opening_balance';

create unique index credit_allocation_movements_legacy_transaction_unique
    on public.credit_allocation_movements (legacy_credit_transaction_id)
    where legacy_credit_transaction_id is not null;

create or replace function public.initialize_credit_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_subscription_user_id uuid;
    v_contract_subscription_id uuid;
    v_contract_user_id uuid;
    v_payment_user_id uuid;
    v_payment_subscription_id uuid;
begin
    new.remaining_amount := new.granted_amount;
    new.reserved_amount := 0;
    new.status := 'active';
    new.updated_at := now();

    if new.subscription_id is not null then
        select subscription.user_id
        into v_subscription_user_id
        from public.subscriptions as subscription
        where subscription.id = new.subscription_id;

        if v_subscription_user_id is null
           or v_subscription_user_id <> new.user_id then
            raise exception 'Credit allocation subscription must belong to the allocation owner'
                using errcode = '23514';
        end if;
    end if;

    if new.subscription_contract_id is not null then
        select contract.subscription_id, subscription.user_id
        into v_contract_subscription_id, v_contract_user_id
        from public.subscription_contracts as contract
        join public.subscriptions as subscription
          on subscription.id = contract.subscription_id
        where contract.id = new.subscription_contract_id;

        if v_contract_subscription_id is null
           or v_contract_subscription_id is distinct from new.subscription_id
           or v_contract_user_id <> new.user_id then
            raise exception 'Credit allocation contract must match its subscription and owner'
                using errcode = '23514';
        end if;
    end if;

    if new.student_payment_id is not null then
        select payment.user_id, payment.subscription_id
        into v_payment_user_id, v_payment_subscription_id
        from public.student_payments as payment
        where payment.id = new.student_payment_id;

        if v_payment_user_id is null or v_payment_user_id <> new.user_id then
            raise exception 'Credit allocation payment must belong to the allocation owner'
                using errcode = '23514';
        end if;

        if new.origin = 'subscription'
           and v_payment_subscription_id is distinct from new.subscription_id then
            raise exception 'Subscription credit payment must match the allocation subscription'
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

create or replace function public.apply_credit_allocation_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_allocation public.credit_allocations%rowtype;
    v_legacy_transaction_user_id uuid;
    v_legacy_transaction_payment_id uuid;
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

    if new.type = 'opening_balance' then
        if new.amount <> v_allocation.granted_amount then
            raise exception 'Opening balance movement must match the allocation granted amount'
                using errcode = '23514';
        end if;

        if exists (
            select 1
            from public.credit_allocation_movements as movement
            where movement.allocation_id = new.allocation_id
              and movement.type = 'opening_balance'
        ) then
            raise exception 'Credit allocation % already has an opening balance', new.allocation_id
                using errcode = '23505';
        end if;

        if new.legacy_credit_transaction_id is not null then
            select transaction.user_id, transaction.student_payment_id
            into v_legacy_transaction_user_id, v_legacy_transaction_payment_id
            from public.credit_transactions as transaction
            where transaction.id = new.legacy_credit_transaction_id;

            if v_legacy_transaction_user_id is null
               or v_legacy_transaction_user_id <> v_allocation.user_id then
                raise exception 'Legacy credit transaction must belong to the allocation owner'
                    using errcode = '23514';
            end if;

            if v_legacy_transaction_payment_id is not null
               and v_allocation.student_payment_id
                   is distinct from v_legacy_transaction_payment_id then
                raise exception 'Allocation payment must match the legacy grant transaction payment'
                    using errcode = '23514';
            end if;
        end if;

        return new;
    end if;

    if v_allocation.status = 'expired' then
        raise exception 'Expired credit allocation % cannot receive movements', new.allocation_id
            using errcode = '55000';
    end if;

    if new.reservation_id is not null
       and not exists (
           select 1
           from public.credit_reservations as reservation
           where reservation.id = new.reservation_id
             and reservation.allocation_id = new.allocation_id
             and reservation.status = 'consumed'
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

revoke all on function public.initialize_credit_allocation()
from public, anon, authenticated;

revoke all on function public.apply_credit_allocation_movement()
from public, anon, authenticated;

commit;

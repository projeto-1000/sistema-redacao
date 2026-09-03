begin;

create or replace function public.set_student_default_payment_card(
  p_user_id uuid,
  p_payment_card_id uuid,
  p_expected_subscription_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subscription_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'student_not_found';
  end if;

  perform 1
  from public.student_payment_cards
  where id = p_payment_card_id
    and user_id = p_user_id
    and is_active = true
    and deleted_at is null
  for update;

  if not found then
    raise exception 'payment_card_not_available';
  end if;

  select id
  into v_subscription_id
  from public.subscriptions
  where user_id = p_user_id
    and status in ('active', 'trial')
  for update;

  if v_subscription_id is distinct from p_expected_subscription_id then
    raise exception 'subscription_state_changed';
  end if;

  update public.student_payment_cards
  set is_default = false,
      updated_at = now()
  where user_id = p_user_id
    and id <> p_payment_card_id
    and is_default = true;

  update public.student_payment_cards
  set is_default = true,
      updated_at = now()
  where id = p_payment_card_id
    and user_id = p_user_id;

  if v_subscription_id is not null then
    update public.subscriptions
    set payment_card_id = p_payment_card_id,
        updated_at = now()
    where id = v_subscription_id
      and user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.set_student_default_payment_card(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.set_student_default_payment_card(uuid, uuid, uuid)
to service_role;

create or replace function public.soft_delete_student_payment_card(
  p_user_id uuid,
  p_payment_card_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_was_default boolean;
  v_replacement_id uuid;
  v_active_subscription_id uuid;
  v_active_subscription_card_id uuid;
  v_active_subscription_count integer := 0;
  v_active_subscription record;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'student_not_found';
  end if;

  select is_default
  into v_was_default
  from public.student_payment_cards
  where id = p_payment_card_id
    and user_id = p_user_id
    and is_active = true
    and deleted_at is null
  for update;

  if not found then
    raise exception 'payment_card_not_available';
  end if;

  for v_active_subscription in
    select id, payment_card_id
    from public.subscriptions
    where user_id = p_user_id
      and status in ('active', 'trial')
    for update
  loop
    v_active_subscription_count := v_active_subscription_count + 1;

    if v_active_subscription_count > 1 then
      raise exception 'multiple_active_subscriptions';
    end if;

    v_active_subscription_id := v_active_subscription.id;
    v_active_subscription_card_id := v_active_subscription.payment_card_id;
  end loop;

  if v_active_subscription_card_id = p_payment_card_id then
    raise exception 'payment_card_used_by_active_subscription';
  end if;

  if v_was_default then
    if v_active_subscription_id is not null then
      if v_active_subscription_card_id is null then
        raise exception 'active_subscription_payment_card_not_available';
      end if;

      select id
      into v_replacement_id
      from public.student_payment_cards
      where id = v_active_subscription_card_id
        and user_id = p_user_id
        and is_active = true
        and deleted_at is null
      for update;

      if v_replacement_id is null then
        raise exception 'active_subscription_payment_card_not_available';
      end if;
    else
      select id
      into v_replacement_id
      from public.student_payment_cards
      where user_id = p_user_id
        and id <> p_payment_card_id
        and is_active = true
        and deleted_at is null
      order by created_at desc, id desc
      limit 1
      for update;
    end if;
  end if;

  update public.student_payment_cards
  set is_default = false,
      is_active = false,
      deleted_at = now(),
      updated_at = now()
  where id = p_payment_card_id
    and user_id = p_user_id;

  if v_replacement_id is not null then
    update public.student_payment_cards
    set is_default = true,
        updated_at = now()
    where id = v_replacement_id
      and user_id = p_user_id;
  end if;

  return v_replacement_id;
end;
$$;

revoke all on function public.soft_delete_student_payment_card(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.soft_delete_student_payment_card(uuid, uuid)
to service_role;

commit;

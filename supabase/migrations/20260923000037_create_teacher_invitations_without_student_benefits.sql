begin;

-- Admin-created teacher invitations carry this marker in user_metadata at
-- auth.users INSERT time. The custom app_role is persisted later by Auth.
-- A user-controlled marker can only leave the account without a role; it
-- must never grant TEACHER access by itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_acquisition_channel text;

  v_free_plan_id uuid;
  v_free_subscription_id uuid;

  v_free_allocation_id uuid;
  v_free_credit_transaction_id uuid;
  v_free_credit_expires_at timestamptz;
begin
  if new.raw_user_meta_data ->> 'teacher_invitation_pending' = 'true' then
    v_role := null;
  else
    v_role := coalesce(
      nullif(new.raw_app_meta_data ->> 'app_role', '')::public.app_role,
      'STUDENT'::public.app_role
    );
  end if;

  v_acquisition_channel :=
    coalesce(
      nullif(
        new.raw_user_meta_data ->> 'acquisition_channel',
        ''
      ),
      'ORGANIC'
    );

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    document,
    phone_country_code,
    phone,
    terms_accepted_at,
    acquisition_channel
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    v_role,
    new.raw_user_meta_data ->> 'document',
    coalesce(
      nullif(
        new.raw_user_meta_data ->> 'phone_country_code',
        ''
      ),
      '55'
    ),
    new.raw_user_meta_data ->> 'phone',
    (
      new.raw_user_meta_data ->> 'terms_accepted_at'
    )::timestamptz,
    v_acquisition_channel
  );

  if v_role = 'STUDENT'::public.app_role
    and v_acquisition_channel <> 'HOTMART_MENTORIA'
  then
    select plan.id
    into v_free_plan_id
    from public.plans as plan
    where plan.external_id = 'internal_free_trial'
      and plan.is_active = true;

    if not found then
      raise exception
        'O Plano Gratuito não está cadastrado ou está inativo.';
    end if;

    v_free_credit_expires_at :=
      (
        (
          timezone(
            'America/Sao_Paulo',
            coalesce(new.created_at, now())
          )::date
          + 15
        )
        + time '23:59:59.999999'
      ) at time zone 'America/Sao_Paulo';

    v_free_allocation_id := gen_random_uuid();

    insert into public.subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      external_id,
      payment_method,
      payment_card_id,
      metadata,
      updated_at
    )
    values (
      new.id,
      v_free_plan_id,
      'trial',
      coalesce(new.created_at, now()),
      null,
      false,
      'internal-free-trial:' || new.id::text,
      null,
      null,
      jsonb_build_object(
        'provider',
        'internal',
        'subscription_type',
        'free_trial',
        'acquisition_channel',
        v_acquisition_channel,
        'granted_automatically',
        true,
        'free_credit_expires_at',
        v_free_credit_expires_at
      ),
      now()
    )
    returning id
    into v_free_subscription_id;

    insert into public.credit_transactions (
      user_id,
      type,
      amount,
      description,
      metadata
    )
    values (
      new.id,
      'free_trial_grant',
      1,
      'Liberação da correção gratuita de boas-vindas.',
      jsonb_build_object(
        'source',
        'automatic_free_trial',
        'credit_type',
        'free',
        'plan_source',
        'free_trial',
        'free_credit_allocation_id',
        v_free_allocation_id,
        'subscription_id',
        v_free_subscription_id,
        'plan_id',
        v_free_plan_id,
        'acquisition_channel',
        v_acquisition_channel,
        'credits_granted',
        1,
        'expires_at',
        v_free_credit_expires_at
      )
    )
    returning id
    into v_free_credit_transaction_id;

    insert into public.free_credit_allocations (
      id,
      user_id,
      subscription_id,
      amount,
      remaining_amount,
      granted_at,
      expires_at,
      status,
      grant_transaction_id,
      updated_at
    )
    values (
      v_free_allocation_id,
      new.id,
      v_free_subscription_id,
      1,
      1,
      coalesce(new.created_at, now()),
      v_free_credit_expires_at,
      'active',
      v_free_credit_transaction_id,
      now()
    );
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Keep the strict legacy path for invitations created before this migration.
-- New invitations have a role-less profile and no student records to delete.
create or replace function public.finalize_teacher_invitation_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user auth.users%rowtype;
  v_profile public.profiles%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_transaction public.credit_transactions%rowtype;
  v_allocation public.free_credit_allocations%rowtype;
  v_credits public.student_credits%rowtype;
  v_contract public.subscription_contracts%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Only the service role can finalize teacher invitations.';
  end if;

  select * into v_user from auth.users where id = p_user_id for update;
  if not found
    or v_user.raw_app_meta_data ->> 'app_role' is distinct from 'TEACHER'
    or v_user.raw_user_meta_data ->> 'teacher_invitation_pending' is distinct from 'true'
  then
    raise exception 'This account is not a pending teacher invitation.';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'The invitation profile does not exist.';
  end if;

  if v_profile.role is null then
    if exists (select 1 from public.subscriptions where user_id = p_user_id)
      or exists (select 1 from public.credit_transactions where user_id = p_user_id)
      or exists (select 1 from public.free_credit_allocations where user_id = p_user_id)
      or exists (select 1 from public.student_credits where user_id = p_user_id)
      or exists (select 1 from public.credit_allocations where user_id = p_user_id)
      or exists (select 1 from public.subscription_credit_allocations where user_id = p_user_id)
      or exists (select 1 from public.essays where student_id = p_user_id)
      or exists (select 1 from public.student_payments where user_id = p_user_id)
    then
      raise exception 'The pending teacher account has unexpected student activity.';
    end if;

    update public.profiles set role = 'TEACHER'::public.app_role where id = p_user_id;
    return;
  end if;

  if v_profile.role is distinct from 'STUDENT'::public.app_role then
    raise exception 'The invitation profile is not pending finalization.';
  end if;

  if (select count(*) from public.subscriptions where user_id = p_user_id) <> 1
    or (select count(*) from public.credit_transactions where user_id = p_user_id) <> 1
    or (select count(*) from public.free_credit_allocations where user_id = p_user_id) <> 1
    or (select count(*) from public.subscription_contracts as contract
        join public.subscriptions as subscription on subscription.id = contract.subscription_id
        where subscription.user_id = p_user_id) > 1
    or exists (select 1 from public.credit_allocations where user_id = p_user_id)
    or exists (select 1 from public.subscription_credit_allocations where user_id = p_user_id)
    or exists (select 1 from public.essays where student_id = p_user_id)
    or exists (select 1 from public.student_payments where user_id = p_user_id)
  then
    raise exception 'The invitation account has unexpected student activity.';
  end if;

  select * into strict v_subscription from public.subscriptions where user_id = p_user_id for update;
  select * into strict v_transaction from public.credit_transactions where user_id = p_user_id for update;
  select * into strict v_allocation from public.free_credit_allocations where user_id = p_user_id for update;
  select * into strict v_credits from public.student_credits where user_id = p_user_id for update;
  select * into v_contract from public.subscription_contracts
    where subscription_id = v_subscription.id for update;

  if v_subscription.external_id is distinct from 'internal-free-trial:' || p_user_id::text
    or v_subscription.status is distinct from 'trial'::public.subscription_status
    or v_transaction.type is distinct from 'free_trial_grant'::public.transaction_type
    or v_transaction.amount is distinct from 1
    or v_transaction.metadata ->> 'source' is distinct from 'automatic_free_trial'
    or v_allocation.subscription_id is distinct from v_subscription.id
    or v_allocation.grant_transaction_id is distinct from v_transaction.id
    or v_allocation.amount is distinct from 1
    or v_allocation.remaining_amount is distinct from 1
    or v_allocation.status is distinct from 'active'
    or v_credits.free_credits is distinct from 1
    or v_credits.plan_credits is distinct from 0
    or v_credits.extra_credits is distinct from 0
    or (v_contract.id is not null and (
      v_contract.source is distinct from 'free_trial'
      or v_contract.billing_mode is distinct from 'free'
      or v_contract.status is distinct from 'active'
      or v_contract.price_cents is distinct from 0
    ))
  then
    raise exception 'The invitation trial is not intact.';
  end if;

  delete from public.free_credit_allocations where id = v_allocation.id;
  delete from public.credit_transactions where id = v_transaction.id;
  delete from public.student_credits where user_id = p_user_id;
  if v_contract.id is not null then
    delete from public.subscription_contracts where id = v_contract.id;
  end if;
  delete from public.subscriptions where id = v_subscription.id;
  update public.profiles set role = 'TEACHER'::public.app_role where id = p_user_id;
end;
$$;

revoke all on function public.finalize_teacher_invitation_profile(uuid) from public, anon, authenticated;
grant execute on function public.finalize_teacher_invitation_profile(uuid) to service_role;

commit;

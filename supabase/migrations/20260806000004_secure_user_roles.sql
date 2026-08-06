begin;

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
  v_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'app_role', '')::public.app_role,
    'STUDENT'::public.app_role
  );

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

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and auth.uid() is not null
  then
    raise exception 'A função do usuário não pode ser alterada por este fluxo.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;

create trigger prevent_profile_role_change
before update of role on public.profiles
for each row
execute function public.prevent_profile_role_change();

revoke all on function public.prevent_profile_role_change() from public, anon, authenticated;

commit;

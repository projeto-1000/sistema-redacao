begin;

-- Supabase Auth persists custom app_metadata after the auth.users INSERT trigger.
-- The insert trigger therefore initially creates the profile as STUDENT and grants
-- a free trial. Finalize only a pristine, admin-created teacher invitation here.
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
  if not found or v_profile.role is distinct from 'STUDENT'::public.app_role then
    raise exception 'The invitation profile is not an unfinalized student profile.';
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

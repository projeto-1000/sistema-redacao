-- Isolated LOCAL database only, after 20261008000003. Run as postgres.
-- Exercises the real RPC and rolls back every fixture and side effect.
begin;

set local session_replication_role = replica;

insert into auth.users (id)
values
  ('19000000-0000-0000-0000-000000000001'),
  ('19000000-0000-0000-0000-000000000002'),
  ('19000000-0000-0000-0000-000000000003'),
  ('19000000-0000-0000-0000-000000000004'),
  ('19000000-0000-0000-0000-000000000005');

insert into public.profiles (id, email, full_name, phone, document, role, status)
values
  ('19000000-0000-0000-0000-000000000001', 'grant-admin@example.com', 'Grant Admin',
    '11999999991', '12345678901', 'ADMIN', 'active'),
  ('19000000-0000-0000-0000-000000000002', 'grant-plan@example.com', 'Plan Student',
    '11999999992', '12345678902', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000003', 'grant-mentorship@example.com', 'Mentorship Student',
    '11999999993', '12345678903', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000004', 'grant-extra@example.com', 'Extra Student',
    '11999999994', '12345678904', 'STUDENT', 'active'),
  ('19000000-0000-0000-0000-000000000005', 'grant-blocked@example.com', 'Blocked Student',
    '11999999995', '12345678905', 'STUDENT', 'blocked');

insert into public.plans (id, name, external_id, credits_included, price, interval, interval_count)
values
  ('29000000-0000-0000-0000-000000000001', 'Grant paid plan', 'plan_manual_grant',
    4, 3990, 'month', 1),
  ('29000000-0000-0000-0000-000000000002', 'Grant mentorship plan',
    'internal_mentoria_free', 0, 0, 'month', 3);

insert into public.subscriptions (
  id, user_id, plan_id, status, current_period_start, current_period_end, external_id
)
values
  ('39000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000002',
    '29000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day',
    now() + interval '10 days', 'sub_manual_grant'),
  ('39000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000003',
    '29000000-0000-0000-0000-000000000002', 'active', now() - interval '1 day',
    now() + interval '10 days', 'sub_manual_mentorship');

insert into public.mentorship_credit_allocations (
  id, mentorship_access_id, subscription_id, user_id, cycle_number, amount,
  remaining_amount, available_at, expires_at, released_at, status
)
values (
  '49000000-0000-0000-0000-000000000001',
  '59000000-0000-0000-0000-000000000001',
  '39000000-0000-0000-0000-000000000002',
  '19000000-0000-0000-0000-000000000003',
  1, 2, 0, now() - interval '1 day', now() + interval '10 days', now() - interval '1 day',
  'consumed'
);

set local session_replication_role = origin;
set local role authenticated;
set local "request.jwt.claims" =
  '{"role":"authenticated","sub":"19000000-0000-0000-0000-000000000001"}';

do $$
declare
  v_result jsonb;
  v_plan_expiration timestamptz;
begin
  select public.grant_manual_credits(
    '69000000-0000-4000-8000-000000000001',
    '19000000-0000-0000-0000-000000000004',
    'extra', 3, 'courtesy', null
  ) into v_result;

  assert v_result ->> 'replayed' = 'false', 'First extra grant must not be a replay';
  assert (select extra_credits = 3 from public.student_credits
    where user_id = '19000000-0000-0000-0000-000000000004'),
    'Extra grant must update only the extra balance';
  assert (select expires_at is null from public.manual_credit_grants
    where id = '69000000-0000-4000-8000-000000000001'),
    'Extra grant must not expire';
  assert (select not (metadata ? 'internal_note') and not (metadata ? 'administrator_id')
    from public.credit_transactions
    where id = (select credit_transaction_id from public.manual_credit_grants
      where id = '69000000-0000-4000-8000-000000000001')),
    'Public credit history metadata must not expose private audit fields';

  select public.grant_manual_credits(
    '69000000-0000-4000-8000-000000000001',
    '19000000-0000-0000-0000-000000000004',
    'extra', 3, 'courtesy', null
  ) into v_result;

  assert v_result ->> 'replayed' = 'true', 'Repeated operation must be idempotent';
  assert (select count(*) = 1 from public.manual_credit_grants
    where id = '69000000-0000-4000-8000-000000000001'),
    'Repeated operation must not duplicate the audit record';
  assert (select extra_credits = 3 from public.student_credits
    where user_id = '19000000-0000-0000-0000-000000000004'),
    'Repeated operation must not duplicate the balance';

  select public.grant_manual_credits(
    '69000000-0000-4000-8000-000000000002',
    '19000000-0000-0000-0000-000000000002',
    'plan', 2, 'technical_issue_compensation', null
  ) into v_result;

  select public.subscription_access_end(current_period_end)
  into v_plan_expiration
  from public.subscriptions
  where id = '39000000-0000-0000-0000-000000000001';

  assert (select plan_credits = 2 from public.student_credits
    where user_id = '19000000-0000-0000-0000-000000000002'),
    'Plan grant must update the plan balance';
  assert (v_result ->> 'expires_at')::timestamptz = v_plan_expiration,
    'Plan grant must inherit the paid-cycle expiration';

  select public.grant_manual_credits(
    '69000000-0000-4000-8000-000000000003',
    '19000000-0000-0000-0000-000000000003',
    'mentorship', 4, 'mentorship_bonus', 'Local mentorship test'
  ) into v_result;

  assert (select remaining_amount = 4 and administrative_grants = 4 and status = 'active'
    from public.mentorship_credit_allocations
    where id = '49000000-0000-0000-0000-000000000001'),
    'Mentorship grant must reactivate and increase the current allocation';
  assert (select plan_credits = 0 from public.student_credits
    where user_id = '19000000-0000-0000-0000-000000000003'),
    'Mentorship grant must not contaminate the paid-plan aggregate balance';

  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000004',
      '19000000-0000-0000-0000-000000000005',
      'extra', 1, 'courtesy', null
    );
    raise exception 'Blocked student grant should have failed';
  exception
    when others then
      if sqlerrm = 'Blocked student grant should have failed'
        or position('conta bloqueada' in sqlerrm) = 0
      then
        raise;
      end if;
  end;

  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000005',
      '19000000-0000-0000-0000-000000000004',
      'extra', 1, 'administrative_adjustment', null
    );
    raise exception 'Required note validation should have failed';
  exception
    when others then
      if sqlerrm = 'Required note validation should have failed'
        or position('observação interna' in sqlerrm) = 0
      then
        raise;
      end if;
  end;

  assert not exists (
    select 1 from public.manual_credit_grants
    where id in (
      '69000000-0000-4000-8000-000000000004',
      '69000000-0000-4000-8000-000000000005'
    )
  ), 'Rejected grants must not leave audit records';
end;
$$;

set local "request.jwt.claims" =
  '{"role":"authenticated","sub":"19000000-0000-0000-0000-000000000004"}';

do $$
begin
  assert (select count(*) = 0 from public.manual_credit_grants),
    'Students must not read administrative grant audits';

  begin
    perform public.grant_manual_credits(
      '69000000-0000-4000-8000-000000000006',
      '19000000-0000-0000-0000-000000000004',
      'extra', 1, 'courtesy', null
    );
    raise exception 'Student grant should have failed';
  exception
    when others then
      if sqlerrm = 'Student grant should have failed'
        or position('Acesso não autorizado' in sqlerrm) = 0
      then
        raise;
      end if;
  end;
end;
$$;

rollback;

begin;

set local session_replication_role = replica;
insert into auth.users (id)
values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002');
set local session_replication_role = origin;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000001';
  v_admin_id uuid := '12000000-0000-0000-0000-000000000002';
  v_plan_id uuid := '22000000-0000-0000-0000-000000000001';
  v_subscription_id uuid := '32000000-0000-0000-0000-000000000001';
  v_payment_id uuid := '42000000-0000-0000-0000-000000000001';
begin
  insert into public.profiles (id, email, full_name, phone, document, role)
  values
    (v_student_id, 'withdrawal-student@example.com', 'Withdrawal Student', '11999999999', '12345678901', 'STUDENT'),
    (v_admin_id, 'withdrawal-admin@example.com', 'Withdrawal Admin', '11999999998', '12345678902', 'ADMIN');

  insert into public.plans (
    id, name, external_id, credits_included, price, interval, interval_count
  ) values (
    v_plan_id, 'Withdrawal test plan', 'plan_withdrawal_test', 5, 5000, 'month', 1
  );

  insert into public.subscriptions (
    id, user_id, plan_id, status, current_period_start, current_period_end,
    next_billing_at, external_id, payment_method
  ) values (
    v_subscription_id,
    v_student_id,
    v_plan_id,
    'active',
    now() - interval '24 hours',
    now() + interval '29 days',
    now() + interval '29 days',
    'sub_withdrawalone',
    'credit_card'
  );

  insert into public.student_payments (
    id, user_id, subscription_id, plan_id, kind, provider, external_id,
    amount, credits_amount, status, payment_method, paid_at, metadata
  ) values (
    v_payment_id,
    v_student_id,
    v_subscription_id,
    v_plan_id,
    'subscription',
    'pagarme',
    'sub_withdrawalone',
    5000,
    5,
    'paid',
    'credit_card',
    now() - interval '24 hours',
    jsonb_build_object('pagarme_subscription_id', 'sub_withdrawalone')
  );

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values (
    v_student_id,
    'new_subscription',
    5,
    'Withdrawal policy test grant',
    jsonb_build_object('credit_type', 'plan', 'subscription_id', v_subscription_id)
  );
end;
$$;

set local role authenticated;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"12000000-0000-0000-0000-000000000001"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000001';
  v_result jsonb;
  v_count integer;
  v_balance integer;
begin

  select public.request_subscription_withdrawal(
    '52000000-0000-4000-8000-000000000001',
    'other',
    'First automatic request'
  ) into v_result;

  if v_result ->> 'processing_mode' <> 'automatic'
    or v_result ->> 'status' <> 'refund_processing'
  then
    raise exception 'The first request must start automatic refund processing: %', v_result;
  end if;

  select plan_credits into v_balance
  from public.student_credits where user_id = v_student_id;

  if v_balance <> 0 then
    raise exception 'Plan credits must be blocked immediately; balance is %', v_balance;
  end if;

  select public.request_subscription_withdrawal(
    '52000000-0000-4000-8000-000000000001',
    'other',
    'Repeated delivery'
  ) into v_result;

  select count(*) into v_count
  from public.subscription_withdrawal_requests
  where student_id = v_student_id;

  if not coalesce((v_result ->> 'duplicate')::boolean, false) or v_count <> 1 then
    raise exception 'An idempotent retry must not create or count another request';
  end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000001';
  v_plan_id uuid := '22000000-0000-0000-0000-000000000001';
  v_subscription_id uuid := '32000000-0000-0000-0000-000000000001';
  v_payment_id uuid := '42000000-0000-0000-0000-000000000001';
  v_request_id uuid;
  v_result jsonb;
  v_status text;
begin
  select id into v_request_id
  from public.subscription_withdrawal_requests
  where student_id = v_student_id and request_number = 1;

  begin
    insert into public.student_payments (
      user_id, subscription_id, kind, provider, amount, credits_amount,
      status, payment_method, idempotency_key, metadata
    ) values (
      v_student_id, v_subscription_id, 'extra_credits', 'pagarme', 1000, 1,
      'processing', 'credit_card', 'withdrawal-extra-credit-block', '{}'::jsonb
    );

    raise exception 'Extra-credit purchase should have been blocked';
  exception
    when others then
      if sqlerrm = 'Extra-credit purchase should have been blocked'
        or sqlerrm <> 'A compra de créditos extras está bloqueada durante o arrependimento.'
      then
        raise;
      end if;
  end;

  insert into public.subscription_withdrawal_refunds (
    request_id, student_payment_id, provider_charge_id, provider_invoice_id,
    amount, status, idempotency_key
  ) values (
    v_request_id,
    v_payment_id,
    'ch_withdrawalone',
    'in_withdrawalone',
    5000,
    'processing',
    'withdrawal-refund-test-one'
  );

  select public.process_subscription_withdrawal_refund_confirmation(
    'ch_withdrawalone',
    now(),
    'tran_withdrawalone'
  ) into v_result;

  select status::text into v_status
  from public.subscriptions where id = v_subscription_id;

  if not coalesce((v_result ->> 'completed')::boolean, false) or v_status <> 'canceled' then
    raise exception 'Confirmed refund must finalize the subscription: %', v_result;
  end if;

  update public.subscriptions
  set
    external_id = 'sub_withdrawaltwo',
    status = 'active',
    current_period_start = now() - interval '12 hours',
    current_period_end = now() + interval '30 days',
    next_billing_at = now() + interval '30 days',
    canceled_at = null,
    cancellation_requested_at = null,
    cancellation_effective_at = null,
    cancellation_provider_status = 'active'
  where id = v_subscription_id;

  insert into public.student_payments (
    user_id, subscription_id, plan_id, kind, provider, external_id,
    amount, credits_amount, status, payment_method, paid_at, metadata
  ) values (
    v_student_id,
    v_subscription_id,
    v_plan_id,
    'subscription',
    'pagarme',
    'sub_withdrawaltwo',
    5000,
    5,
    'paid',
    'credit_card',
    now() - interval '12 hours',
    jsonb_build_object('pagarme_subscription_id', 'sub_withdrawaltwo')
  );

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values (
    v_student_id,
    'new_subscription',
    5,
    'Second withdrawal policy test grant',
    jsonb_build_object('credit_type', 'plan', 'subscription_id', v_subscription_id)
  );
end;
$$;

set local role authenticated;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"12000000-0000-0000-0000-000000000001"}';

do $$
declare
  v_result jsonb;
begin

  select public.request_subscription_withdrawal(
    '52000000-0000-4000-8000-000000000002',
    'other',
    'Second request for the same account'
  ) into v_result;

  if v_result ->> 'processing_mode' <> 'manual'
    or v_result ->> 'status' <> 'under_review'
  then
    raise exception 'The second request on the account must require manual review: %', v_result;
  end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000001';
  v_admin_id uuid := '12000000-0000-0000-0000-000000000002';
  v_request_id uuid;
  v_result jsonb;
  v_balance integer;
begin
  select id into v_request_id
  from public.subscription_withdrawal_requests
  where student_id = v_student_id and request_number = 2;

  select public.reject_subscription_withdrawal(
    v_request_id,
    v_admin_id,
    'Manual review rejection test'
  ) into v_result;

  select plan_credits into v_balance
  from public.student_credits where user_id = v_student_id;

  if v_balance <> 5 then
    raise exception 'Rejected manual review must release held plan credits; balance is %', v_balance;
  end if;
end;
$$;

rollback;

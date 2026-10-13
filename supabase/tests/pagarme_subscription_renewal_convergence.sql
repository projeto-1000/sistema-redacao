begin;

set local session_replication_role = replica;
insert into auth.users (id)
values ('10000000-0000-0000-0000-000000000001');
set local session_replication_role = origin;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_user_id uuid := '10000000-0000-0000-0000-000000000001';
  v_plan_id uuid := '20000000-0000-0000-0000-000000000001';
  v_other_plan_id uuid := '20000000-0000-0000-0000-000000000002';
  v_subscription_id uuid := '30000000-0000-0000-0000-000000000001';
  v_contract_id uuid := '40000000-0000-0000-0000-000000000001';
  v_event_one_id uuid := '50000000-0000-0000-0000-000000000001';
  v_event_two_id uuid := '50000000-0000-0000-0000-000000000002';
  v_event_ambiguous_id uuid := '50000000-0000-0000-0000-000000000003';
  v_event_gap_id uuid := '50000000-0000-0000-0000-000000000004';
  v_existing_payment_id uuid := '60000000-0000-0000-0000-000000000002';
  v_result jsonb;
  v_payment_count integer;
  v_grant_count integer;
  v_expiration_count integer;
  v_plan_balance integer;
  v_period_already_applied boolean;
begin
  insert into public.profiles (id, email, full_name, phone, document)
  values (v_user_id, 'renewal-test@example.com', 'Renewal Test', '11999999999', '12345678901');

  insert into public.student_credits (user_id, plan_credits, extra_credits, free_credits)
  values (v_user_id, 0, 0, 0);

  insert into public.plans (
    id, name, external_id, credits_included, price, interval, interval_count
  ) values
    (v_plan_id, 'Renewal test plan', 'plan_renewal_test', 5, 10000, 'month', 1),
    (v_other_plan_id, 'Divergent test plan', 'plan_divergent_test', 5, 10000, 'month', 1);

  insert into public.subscriptions (
    id,
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    next_billing_at,
    external_id,
    payment_method
  ) values (
    v_subscription_id,
    v_user_id,
    v_plan_id,
    'active',
    '2026-01-01 00:00:00+00',
    '2026-02-01 00:00:00+00',
    '2026-02-01 00:00:00+00',
    'sub_renewal_convergence_test',
    'credit_card'
  );

  insert into public.subscription_contracts (
    id,
    subscription_id,
    version,
    status,
    source,
    billing_mode,
    effective_at,
    plan_id,
    plan_name,
    price_cents,
    credits_included,
    interval,
    interval_count,
    credits_expiration_days,
    provider_plan_id
  ) values (
    v_contract_id,
    v_subscription_id,
    1,
    'active',
    'checkout',
    'recurring',
    '2026-01-01 00:00:00+00',
    v_plan_id,
    'Renewal test plan',
    10000,
    5,
    'month',
    1,
    30,
    'plan_renewal_test'
  );

  insert into public.credit_transactions (
    user_id, type, amount, description, metadata
  ) values (
    v_user_id,
    'plan_renewal',
    2,
    'Opening plan balance for renewal test',
    '{"credit_type":"plan","source":"test"}'::jsonb
  );

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, source, status, payload
  ) values (
    v_event_one_id,
    'reconciliation:invoice.paid:in_renewal_test_one',
    'invoice.paid',
    'reconciliation',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'in_renewal_test_one',
        'subscription', jsonb_build_object('id', 'sub_renewal_convergence_test')
      )
    )
  );

  select public.process_pagarme_subscription_renewal(
    v_event_one_id,
    'sub_renewal_convergence_test',
    'in_renewal_test_one',
    10000,
    'paid',
    'credit_card',
    '2026-02-01 00:00:00+00',
    '2026-03-01 00:00:00+00',
    '2026-04-01 00:00:00+00',
    '2026-02-01 00:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'success')::boolean, false)
    or not coalesce((v_result ->> 'payment_created')::boolean, false)
    or not coalesce((v_result ->> 'grant_created')::boolean, false)
    or not coalesce((v_result ->> 'subscription_updated')::boolean, false)
  then
    raise exception 'A new invoice must create its payment, grant, and period: %', v_result;
  end if;

  select count(*) into v_payment_count
  from public.student_payments
  where provider = 'pagarme' and external_id = 'in_renewal_test_one';

  select count(*) into v_grant_count
  from public.credit_transactions as transaction
  join public.student_payments as payment on payment.id = transaction.student_payment_id
  where payment.external_id = 'in_renewal_test_one' and transaction.type = 'plan_renewal';

  select count(*) into v_expiration_count
  from public.credit_transactions as transaction
  join public.student_payments as payment on payment.id = transaction.student_payment_id
  where payment.external_id = 'in_renewal_test_one' and transaction.type = 'plan_expiration';

  select plan_credits into v_plan_balance
  from public.student_credits
  where user_id = v_user_id;

  if v_payment_count <> 1 or v_grant_count <> 1 or v_expiration_count <> 1
    or v_plan_balance <> 5
  then
    raise exception 'The first renewal did not converge to one payment/grant/expiration and five credits';
  end if;

  select public.process_pagarme_subscription_renewal(
    v_event_one_id,
    'sub_renewal_convergence_test',
    'in_renewal_test_one',
    10000,
    'paid',
    'credit_card',
    '2026-02-01 00:00:00+00',
    '2026-03-01 00:00:00+00',
    '2026-04-01 00:00:00+00',
    '2026-02-01 00:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'duplicate')::boolean, false) then
    raise exception 'A fully applied renewal must be a no-op: %', v_result;
  end if;

  insert into public.student_payments (
    id,
    user_id,
    subscription_id,
    plan_id,
    kind,
    provider,
    external_id,
    amount,
    credits_amount,
    status,
    payment_method,
    paid_at,
    idempotency_key,
    metadata
  ) values (
    v_existing_payment_id,
    v_user_id,
    v_subscription_id,
    v_plan_id,
    'subscription',
    'pagarme',
    'in_renewal_test_two',
    10000,
    5,
    'paid',
    'credit_card',
    '2026-03-01 00:00:00+00',
    'pagarme-renewal:in_renewal_test_two',
    '{}'::jsonb
  );

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, source, status, payload
  ) values (
    v_event_two_id,
    'reconciliation:invoice.paid:in_renewal_test_two',
    'invoice.paid',
    'reconciliation',
    'processed',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'in_renewal_test_two',
        'subscription', jsonb_build_object('id', 'sub_renewal_convergence_test')
      )
    )
  );

  select public.process_pagarme_subscription_renewal(
    v_event_two_id,
    'sub_renewal_convergence_test',
    'in_renewal_test_two',
    10000,
    'paid',
    'credit_card',
    '2026-03-01 00:00:00+00',
    '2026-04-01 00:00:00+00',
    '2026-05-01 00:00:00+00',
    '2026-03-01 00:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'success')::boolean, false)
    or coalesce((v_result ->> 'payment_created')::boolean, true)
    or not coalesce((v_result ->> 'grant_created')::boolean, false)
    or not coalesce((v_result ->> 'subscription_updated')::boolean, false)
  then
    raise exception 'An existing payment must not short-circuit the missing effects: %', v_result;
  end if;

  select count(*) into v_payment_count
  from public.student_payments
  where provider = 'pagarme' and external_id = 'in_renewal_test_two';

  select count(*) into v_grant_count
  from public.credit_transactions
  where student_payment_id = v_existing_payment_id and type = 'plan_renewal';

  select current_period_end = '2026-04-01 00:00:00+00'::timestamptz
  into strict v_period_already_applied
  from public.subscriptions
  where id = v_subscription_id;

  if v_payment_count <> 1 or v_grant_count <> 1 or not v_period_already_applied then
    raise exception 'The existing-payment repair did not converge';
  end if;

  select public.process_pagarme_subscription_renewal(
    v_event_two_id,
    'sub_renewal_convergence_test',
    'in_renewal_test_two',
    10000,
    'paid',
    'credit_card',
    '2026-03-01 00:00:00+00',
    '2026-04-01 00:00:00+00',
    '2026-05-01 00:00:00+00',
    '2026-03-01 00:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'duplicate')::boolean, false) then
    raise exception 'A repaired renewal must become a no-op: %', v_result;
  end if;

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, source, status, payload
  ) values (
    v_event_gap_id,
    'reconciliation:invoice.paid:in_renewal_gap',
    'invoice.paid',
    'reconciliation',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'in_renewal_gap',
        'subscription', jsonb_build_object('id', 'sub_renewal_convergence_test')
      )
    )
  );

  select public.process_pagarme_subscription_renewal(
    v_event_gap_id,
    'sub_renewal_convergence_test',
    'in_renewal_gap',
    10000,
    'paid',
    'credit_card',
    '2026-05-01 00:00:00+00',
    '2026-06-01 00:00:00+00',
    '2026-07-01 00:00:00+00',
    '2026-05-01 00:00:00+00'
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, false)
    or position('lacuna' in coalesce(v_result ->> 'message', '')) = 0
  then
    raise exception 'A renewal with a period gap must require intervention: %', v_result;
  end if;

  if exists (
    select 1 from public.student_payments
    where provider = 'pagarme' and external_id = 'in_renewal_gap'
  ) or exists (
    select 1
    from public.credit_transactions as transaction
    join public.student_payments as payment on payment.id = transaction.student_payment_id
    where payment.external_id = 'in_renewal_gap'
  ) or not exists (
    select 1 from public.subscriptions
    where id = v_subscription_id
      and current_period_start = '2026-03-01 00:00:00+00'::timestamptz
      and current_period_end = '2026-04-01 00:00:00+00'::timestamptz
  ) then
    raise exception 'A rejected period gap must not create payment, credits, or advance the subscription';
  end if;

  update public.subscriptions set plan_id = v_other_plan_id where id = v_subscription_id;

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, source, status, payload
  ) values (
    v_event_ambiguous_id,
    'reconciliation:invoice.paid:in_renewal_ambiguous',
    'invoice.paid',
    'reconciliation',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'in_renewal_ambiguous',
        'subscription', jsonb_build_object('id', 'sub_renewal_convergence_test')
      )
    )
  );

  select public.process_pagarme_subscription_renewal(
    v_event_ambiguous_id,
    'sub_renewal_convergence_test',
    'in_renewal_ambiguous',
    10000,
    'paid',
    'credit_card',
    '2026-04-01 00:00:00+00',
    '2026-05-01 00:00:00+00',
    '2026-06-01 00:00:00+00',
    '2026-04-01 00:00:00+00'
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, false)
    or position('intervenção necessária' in coalesce(v_result ->> 'message', '')) = 0
  then
    raise exception 'A contract/plan divergence must require intervention: %', v_result;
  end if;
end;
$$;

rollback;

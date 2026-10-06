begin;

set local session_replication_role = replica;
insert into auth.users (id)
values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002'),
  ('12000000-0000-0000-0000-000000000003');
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
  v_upgrade_payment_id uuid := '42000000-0000-0000-0000-000000000002';
  v_topic_id uuid := '62000000-0000-0000-0000-000000000001';
  v_essay_id uuid := '72000000-0000-0000-0000-000000000001';
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
    now() - interval '30 days',
    now() + interval '1 day',
    now() + interval '1 day',
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

  insert into public.student_payments (
    id, user_id, subscription_id, plan_id, kind, provider, external_id,
    amount, credits_amount, status, payment_method, paid_at, metadata
  ) values (
    v_upgrade_payment_id,
    v_student_id,
    v_subscription_id,
    v_plan_id,
    'plan_upgrade_prorata',
    'pagarme',
    'or_withdrawalupgrade',
    2000,
    0,
    'paid',
    'credit_card',
    now() - interval '12 hours',
    jsonb_build_object(
      'pagarme_subscription_id', 'sub_withdrawalone',
      'pagarme_charge_id', 'ch_withdrawalupgrade'
    )
  );

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values
    (
      v_student_id,
      'new_subscription',
      5,
      'Withdrawal policy test grant',
      jsonb_build_object('credit_type', 'plan', 'subscription_id', v_subscription_id)
    ),
    (
      v_student_id,
      'standalone_purchase',
      2,
      'Withdrawal policy extra-credit grant',
      jsonb_build_object('credit_type', 'extra')
    ),
    (
      v_student_id,
      'free_trial_grant',
      3,
      'Withdrawal policy free-credit grant',
      jsonb_build_object('credit_type', 'free')
    );

  insert into public.essay_topics (id, title, axis)
  values (v_topic_id, 'Withdrawal policy topic', 'Educação');

  insert into public.essays (
    id, student_id, title, thematic_axis, content, submission_date, status, topic_id
  ) values (
    v_essay_id,
    v_student_id,
    'Withdrawal policy essay',
    'Educação',
    'Test content',
    now() - interval '25 hours',
    'pending',
    v_topic_id
  );

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values (
    v_student_id,
    'essay_usage',
    -1,
    'Withdrawal policy essay usage',
    jsonb_build_object('credit_type', 'plan', 'essay_id', v_essay_id)
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
  v_plan_balance integer;
  v_extra_balance integer;
  v_free_balance integer;
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

  select plan_credits, extra_credits, free_credits
  into v_plan_balance, v_extra_balance, v_free_balance
  from public.student_credits where user_id = v_student_id;

  if v_plan_balance <> 0 or v_extra_balance <> 2 or v_free_balance <> 3 then
    raise exception
      'Only plan credits must be blocked immediately; balances are plan %, extra %, free %',
      v_plan_balance,
      v_extra_balance,
      v_free_balance;
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
  v_upgrade_payment_id uuid := '42000000-0000-0000-0000-000000000002';
  v_essay_id uuid := '72000000-0000-0000-0000-000000000001';
  v_cancellation_event_id uuid := '82000000-0000-0000-0000-000000000001';
  v_renewal_event_id uuid := '82000000-0000-0000-0000-000000000002';
  v_request_id uuid;
  v_result jsonb;
  v_status text;
  v_provider_status text;
  v_cancel_at_period_end boolean;
  v_plan_balance integer;
  v_extra_balance integer;
  v_free_balance integer;
  v_count integer;
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

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, status, payload
  ) values (
    v_cancellation_event_id,
    'hook_withdrawal_subscription_canceled',
    'subscription.canceled',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'sub_withdrawalone',
        'status', 'canceled'
      )
    )
  );

  select public.process_pagarme_subscription_cancellation(
    v_cancellation_event_id,
    'sub_withdrawalone',
    'canceled',
    now()
  ) into v_result;

  select status::text, cancellation_provider_status, cancel_at_period_end
  into v_status, v_provider_status, v_cancel_at_period_end
  from public.subscriptions where id = v_subscription_id;

  if v_status <> 'active'
    or v_provider_status <> 'canceled'
    or v_cancel_at_period_end is not true
    or v_result ->> 'reason' <> 'withdrawal_refund_pending'
    or coalesce((v_result ->> 'credits_expired')::integer, -1) <> 0
  then
    raise exception 'Provider cancellation must not finalize withdrawal before refunds: %', v_result;
  end if;

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, status, payload
  ) values (
    v_renewal_event_id,
    'hook_withdrawal_invoice_paid',
    'invoice.paid',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'in_withdrawalrenewal',
        'subscription', jsonb_build_object('id', 'sub_withdrawalone')
      )
    )
  );

  select public.process_pagarme_subscription_renewal(
    v_renewal_event_id,
    'sub_withdrawalone',
    'in_withdrawalrenewal',
    5000,
    'paid',
    'credit_card',
    now(),
    now() + interval '1 month',
    now() + interval '2 months',
    now()
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, true)
    or v_result ->> 'message' <> 'A assinatura está programada para cancelamento.'
  then
    raise exception 'Renewal must be rejected during withdrawal: %', v_result;
  end if;

  insert into public.subscription_withdrawal_refunds (
    request_id, student_payment_id, provider_charge_id, provider_invoice_id,
    amount, status, idempotency_key
  ) values
    (
      v_request_id,
      v_payment_id,
      'ch_withdrawalone',
      'in_withdrawalone',
      5000,
      'processing',
      'withdrawal-refund-test-one'
    ),
    (
      v_request_id,
      v_upgrade_payment_id,
      'ch_withdrawalupgrade',
      null,
      2000,
      'processing',
      'withdrawal-refund-test-upgrade'
    );

  select public.process_subscription_withdrawal_refund_confirmation(
    'ch_withdrawalone',
    now(),
    'tran_withdrawalone'
  ) into v_result;

  select status::text into v_status
  from public.subscriptions where id = v_subscription_id;

  if coalesce((v_result ->> 'completed')::boolean, true) or v_status <> 'active' then
    raise exception 'The first of multiple refunds must not finalize the subscription: %', v_result;
  end if;

  select public.process_subscription_withdrawal_refund_confirmation(
    'ch_withdrawalupgrade',
    now(),
    'tran_withdrawalupgrade'
  ) into v_result;

  select status::text into v_status
  from public.subscriptions where id = v_subscription_id;

  if not coalesce((v_result ->> 'completed')::boolean, false) or v_status <> 'canceled' then
    raise exception 'All confirmed refunds must finalize the subscription: %', v_result;
  end if;

  select plan_credits, extra_credits, free_credits
  into v_plan_balance, v_extra_balance, v_free_balance
  from public.student_credits where user_id = v_student_id;

  if v_plan_balance <> 0 or v_extra_balance <> 2 or v_free_balance <> 3 then
    raise exception
      'Finalized withdrawal must preserve extra/free credits; balances are plan %, extra %, free %',
      v_plan_balance,
      v_extra_balance,
      v_free_balance;
  end if;

  if not exists (
    select 1 from public.essays
    where id = v_essay_id and status = 'pending'
  ) then
    raise exception 'An essay submitted before withdrawal must remain in its existing flow';
  end if;

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values (
    v_student_id,
    'essay_refund',
    1,
    'Returned essay after refunded withdrawal',
    jsonb_build_object('credit_type', 'plan', 'essay_id', v_essay_id)
  );

  select count(*) into v_count
  from public.credit_transactions
  where user_id = v_student_id
    and type = 'administrative_adjustment'
    and amount = 0
    and metadata ->> 'adjustment_kind' = 'withdrawal_refund_suppressed'
    and metadata ->> 'essay_id' = v_essay_id::text;

  select plan_credits into v_plan_balance
  from public.student_credits where user_id = v_student_id;

  if v_count <> 1 or v_plan_balance <> 0 then
    raise exception 'Returned essay credit must be audited but remain unusable after refund';
  end if;

  select public.process_subscription_withdrawal_refund_confirmation(
    'ch_withdrawalupgrade',
    now(),
    'tran_withdrawalupgrade'
  ) into v_result;

  select count(*) into v_count
  from public.credit_transactions
  where user_id = v_student_id
    and type = 'plan_expiration'
    and metadata ->> 'expiration_reason' = 'subscription_withdrawal'
    and metadata ->> 'withdrawal_request_id' = v_request_id::text;

  if not coalesce((v_result ->> 'completed')::boolean, false) or v_count <> 1 then
    raise exception 'Duplicate refund confirmation must be idempotent: %', v_result;
  end if;

  select public.process_subscription_withdrawal_refund_confirmation(
    'ch_unknownwithdrawal',
    now(),
    null
  ) into v_result;

  if coalesce((v_result ->> 'matched')::boolean, true) then
    raise exception 'Unknown refund confirmation must be ignored safely: %', v_result;
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

  -- Fixtures share transaction-time now(); put the prior grant in its real cycle.
  update public.credit_transactions set created_at = now() - interval '23 hours'
    where user_id = v_student_id and type::text = 'new_subscription';

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
    jsonb_build_object('credit_type', 'plan', 'subscription_id', v_subscription_id,
      'provider_subscription_id', 'sub_withdrawaltwo')
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

  if v_result ->> 'processing_mode' <> 'automatic'
    or v_result ->> 'status' <> 'refund_processing'
  then
    raise exception 'Repeated eligible requests must remain automatic: %', v_result;
  end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_request_id uuid;
  v_history public.subscription_cancellation_history%rowtype;
  v_snapshot jsonb;
  v_count integer;
begin
  select id into v_request_id from public.subscription_withdrawal_requests
    where student_id = '12000000-0000-0000-0000-000000000001' and request_number = 2;
  select * into v_history from public.subscription_cancellation_history
    where withdrawal_request_id = v_request_id;
  if not found or v_history.snapshot ->> 'credits_granted' is distinct from '5'
    or v_history.snapshot ->> 'credits_used' is distinct from '0'
    or v_history.snapshot ->> 'amount' is distinct from '5000'
  then raise exception 'New requests must capture attributable credits/payment: %', v_history; end if;
  v_snapshot := v_history.snapshot;

  begin
    perform public.reject_subscription_withdrawal(v_request_id,
      '12000000-0000-0000-0000-000000000002', 'No longer allowed');
    raise exception 'Retired rejection unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'A recusa administrativa de arrependimento foi desativada.' then raise; end if;
  end;
  begin
    perform public.approve_subscription_withdrawal(v_request_id,
      '12000000-0000-0000-0000-000000000002', null);
    raise exception 'Retired approval unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'A aprovação administrativa de arrependimento foi desativada.' then raise; end if;
  end;

  perform public.mark_subscription_withdrawal_operational_issue(v_request_id,
    'provider_refund', 'Fixture failure');
  if not exists (select 1 from public.subscription_cancellation_history
    where withdrawal_request_id = v_request_id and status = 'operational_issue')
  then raise exception 'Failure must be recorded in consultation history'; end if;

  insert into public.subscription_withdrawal_refunds
    (request_id, provider_charge_id, amount, status, idempotency_key)
    values (v_request_id, 'ch_repeatedautomatic', 5000, 'processing', 'test-repeatedautomatic');
  perform public.process_subscription_withdrawal_refund_confirmation('ch_repeatedautomatic', now(), 'tran_repeat');
  select jsonb_array_length(events) into v_count from public.subscription_cancellation_history
    where withdrawal_request_id = v_request_id;
  perform public.process_subscription_withdrawal_refund_confirmation('ch_repeatedautomatic', now(), 'tran_repeat');
  if not exists (select 1 from public.subscription_cancellation_history
    where withdrawal_request_id = v_request_id and status = 'refunded'
      and refund_completed_at is not null and snapshot = v_snapshot
      and jsonb_array_length(events) = v_count)
  then raise exception 'Confirmation replay must preserve snapshot and timeline'; end if;

  update public.plans set name = 'Changed later' where id = '22000000-0000-0000-0000-000000000001';
  if not exists (select 1 from public.subscription_cancellation_history
    where withdrawal_request_id = v_request_id and snapshot = v_snapshot)
  then raise exception 'Later plan edits must not rewrite history'; end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000003';
  v_plan_id uuid := '22000000-0000-0000-0000-000000000001';
  v_subscription_id uuid := '32000000-0000-0000-0000-000000000003';
begin
  insert into public.profiles (id, email, full_name, phone, document, role)
  values (
    v_student_id,
    'withdrawal-expired@example.com',
    'Withdrawal Expired Student',
    '11999999997',
    '12345678903',
    'STUDENT'
  );

  insert into public.subscriptions (
    id, user_id, plan_id, status, current_period_start, current_period_end,
    next_billing_at, external_id, payment_method
  ) values (
    v_subscription_id,
    v_student_id,
    v_plan_id,
    'active',
    now() - interval '1 day',
    now() + interval '29 days',
    now() + interval '29 days',
    'sub_withdrawalexpired',
    'credit_card'
  );

  insert into public.student_payments (
    user_id, subscription_id, plan_id, kind, provider, external_id,
    amount, credits_amount, status, payment_method, paid_at, metadata
  ) values
    (
      v_student_id,
      v_subscription_id,
      v_plan_id,
      'subscription',
      'pagarme',
      'in_withdrawalinitialold',
      5000,
      5,
      'paid',
      'credit_card',
      now() - interval '8 days',
      jsonb_build_object('pagarme_subscription_id', 'sub_withdrawalexpired')
    ),
    (
      v_student_id,
      v_subscription_id,
      v_plan_id,
      'subscription',
      'pagarme',
      'in_withdrawalrecentrenewal',
      5000,
      5,
      'paid',
      'credit_card',
      now() - interval '1 day',
      jsonb_build_object('pagarme_subscription_id', 'sub_withdrawalexpired')
    );

  insert into public.credit_transactions (user_id, type, amount, description, metadata)
  values (
    v_student_id,
    'plan_renewal',
    5,
    'Expired withdrawal window test grant',
    jsonb_build_object('credit_type', 'plan', 'subscription_id', v_subscription_id)
  );
end;
$$;

set local role authenticated;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"12000000-0000-0000-0000-000000000003"}';

do $$
declare
  v_student_id uuid := '12000000-0000-0000-0000-000000000003';
  v_balance integer;
begin
  begin
    perform public.request_subscription_withdrawal(
      '52000000-0000-4000-8000-000000000004',
      'other',
      'Renewal must not reopen withdrawal window'
    );

    raise exception 'A recent renewal should not reopen the withdrawal window';
  exception
    when others then
      if sqlerrm = 'A recent renewal should not reopen the withdrawal window'
        or sqlerrm <> 'A janela de arrependimento de 7 dias foi encerrada.'
      then
        raise;
      end if;
  end;

  select plan_credits into v_balance
  from public.student_credits where user_id = v_student_id;

  if v_balance <> 5 or exists (
    select 1 from public.subscription_withdrawal_requests
    where student_id = v_student_id
  ) then
    raise exception 'Expired withdrawal attempt must not change credits or create a request';
  end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_subscription_id uuid := '32000000-0000-0000-0000-000000000003';
  v_history_id uuid;
  v_snapshot jsonb;
begin
  update public.subscriptions set cancel_at_period_end = true,
    cancellation_mode = 'end_of_period', cancellation_requested_at = now(),
    cancellation_effective_at = current_period_end,
    cancellation_provider_status = 'pending', cancellation_reason = 'not_using'
  where id = v_subscription_id;
  select id, snapshot into v_history_id, v_snapshot
    from public.subscription_cancellation_history where subscription_id = v_subscription_id;
  if v_history_id is null then raise exception 'Ordinary cancellation must create a history row'; end if;
  update public.subscriptions set cancellation_requested_at = now() + interval '1 second'
    where id = v_subscription_id;
  if (select count(*) from public.subscription_cancellation_history
    where subscription_id = v_subscription_id) <> 1 then
    raise exception 'Repeated cancellation clicks must not create another history row';
  end if;
  update public.subscriptions set cancellation_provider_status = 'canceled',
    provider_canceled_at = now() where id = v_subscription_id;
  update public.subscriptions set cancel_at_period_end = false, cancellation_mode = null,
    cancellation_requested_at = null, external_id = 'sub_reactivationreplacement'
    where id = v_subscription_id;
  if not exists (select 1 from public.subscription_cancellation_history
    where id = v_history_id and status = 'undone' and snapshot = v_snapshot)
  then raise exception 'Reactivation must retain the original cancellation snapshot'; end if;
end;
$$;

set local role authenticated;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"12000000-0000-0000-0000-000000000001"}';
do $$ begin
  if exists (select 1 from public.subscription_cancellation_history) then
    raise exception 'Non-admin must not read the admin history';
  end if;
end; $$;
set local "request.jwt.claims" = '{"role":"authenticated","sub":"12000000-0000-0000-0000-000000000002"}';
do $$ begin
  if not exists (select 1 from public.subscription_cancellation_history) then
    raise exception 'Admin must be able to read the history';
  end if;
end; $$;

rollback;

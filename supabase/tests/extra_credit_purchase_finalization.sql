begin;

set local session_replication_role = replica;
insert into auth.users (id)
values ('11000000-0000-0000-0000-000000000001');
set local session_replication_role = origin;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

do $$
declare
  v_user_id uuid := '11000000-0000-0000-0000-000000000001';
  v_package_id uuid := '21000000-0000-0000-0000-000000000001';
  v_payment_id uuid := '61000000-0000-0000-0000-000000000001';
  v_already_paid_id uuid := '61000000-0000-0000-0000-000000000002';
  v_existing_grant_id uuid := '61000000-0000-0000-0000-000000000003';
  v_amount_mismatch_id uuid := '61000000-0000-0000-0000-000000000004';
  v_wrong_kind_id uuid := '61000000-0000-0000-0000-000000000005';
  v_failed_payment_id uuid := '61000000-0000-0000-0000-000000000006';
  v_result jsonb;
  v_count integer;
  v_balance integer;
  v_status text;
  v_external_id text;
begin
  insert into public.profiles (id, email, full_name, phone, document)
  values (v_user_id, 'extra-credit-finalization@example.com', 'Extra Credit Test', '11999999999', '12345678902');

  insert into public.student_credits (user_id, plan_credits, extra_credits, free_credits)
  values (v_user_id, 0, 0, 0);

  insert into public.student_payments (
    id, user_id, kind, provider, external_id, amount, credits_amount,
    status, payment_method, idempotency_key, metadata
  ) values (
    v_payment_id,
    v_user_id,
    'extra_credits',
    'pagarme',
    null,
    4000,
    4,
    'processing',
    'credit_card',
    'extra-credit-finalization:primary',
    jsonb_build_object(
      'source', 'extra_credit_purchase',
      'extra_credit_package_id', v_package_id::text
    )
  );

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, status, payload
  ) values (
    '51000000-0000-0000-0000-000000000001',
    'hook_extra_credit_paid_one',
    'order.paid',
    'received',
    jsonb_build_object(
      'data', jsonb_build_object(
        'id', 'or_paidone',
        'status', 'paid',
        'amount', 4000,
        'metadata', jsonb_build_object(
          'source', 'extra_credit_purchase',
          'user_id', v_user_id::text,
          'extra_credit_package_id', v_package_id::text,
          'credits_amount', '4',
          'local_payment_id', v_payment_id::text
        )
      )
    )
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000001',
    v_payment_id,
    v_user_id,
    'or_paidone',
    4000,
    'paid',
    'ch_paidone',
    'paid',
    '2026-09-02 12:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'success')::boolean, false)
    or not coalesce((v_result ->> 'grant_created')::boolean, false)
  then
    raise exception 'Processing payment must be finalized and granted: %', v_result;
  end if;

  select status, external_id into v_status, v_external_id
  from public.student_payments where id = v_payment_id;

  select count(*) into v_count
  from public.credit_transactions
  where student_payment_id = v_payment_id and type = 'standalone_purchase';

  select extra_credits into v_balance
  from public.student_credits where user_id = v_user_id;

  if v_status <> 'paid' or v_external_id <> 'or_paidone' or v_count <> 1 or v_balance <> 4 then
    raise exception 'Paid finalization did not converge payment, ledger, and balance';
  end if;

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000001',
    v_payment_id,
    v_user_id,
    'or_paidone',
    4000,
    'paid',
    'ch_paidone',
    'paid',
    '2026-09-02 12:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'duplicate')::boolean, false) then
    raise exception 'Repeated finalization must be a convergent no-op: %', v_result;
  end if;

  insert into public.pagarme_webhook_events (
    id, external_id, event_type, status, payload
  ) values (
    '51000000-0000-0000-0000-000000000002',
    'hook_extra_credit_paid_two',
    'order.paid',
    'received',
    (select payload from public.pagarme_webhook_events where id = '51000000-0000-0000-0000-000000000001')
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000002',
    v_payment_id,
    v_user_id,
    'or_paidone',
    4000,
    'paid',
    'ch_paidone',
    'paid',
    '2026-09-02 12:00:00+00'
  ) into v_result;

  select count(*) into v_count
  from public.credit_transactions
  where student_payment_id = v_payment_id and type = 'standalone_purchase';

  select extra_credits into v_balance
  from public.student_credits where user_id = v_user_id;

  if not coalesce((v_result ->> 'duplicate')::boolean, false)
    or v_count <> 1
    or v_balance <> 4
  then
    raise exception 'Different hooks for the same order must not duplicate credits: %', v_result;
  end if;

  insert into public.student_payments (
    id, user_id, kind, provider, external_id, amount, credits_amount,
    status, payment_method, paid_at, idempotency_key, metadata
  ) values (
    v_already_paid_id, v_user_id, 'extra_credits', 'pagarme', 'or_alreadypaid',
    3000, 3, 'paid', 'credit_card', '2026-09-02 13:00:00+00',
    'extra-credit-finalization:already-paid',
    jsonb_build_object('source', 'extra_credit_purchase', 'extra_credit_package_id', v_package_id::text)
  );

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000003', 'hook_extra_credit_already_paid',
    'order.paid', 'processed', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_alreadypaid', 'status', 'paid', 'amount', 3000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '3',
        'local_payment_id', v_already_paid_id::text
      )
    ))
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000003', v_already_paid_id, v_user_id,
    'or_alreadypaid', 3000, 'paid', 'ch_alreadypaid', 'paid', '2026-09-02 13:00:00+00'
  ) into v_result;

  if not coalesce((v_result ->> 'grant_created')::boolean, false) then
    raise exception 'A paid payment with a missing transaction must be repaired: %', v_result;
  end if;

  insert into public.student_payments (
    id, user_id, kind, provider, external_id, amount, credits_amount,
    status, payment_method, idempotency_key, metadata
  ) values (
    v_existing_grant_id, v_user_id, 'extra_credits', 'pagarme', 'or_existinggrant',
    2000, 2, 'processing', 'credit_card', 'extra-credit-finalization:existing-grant',
    jsonb_build_object('source', 'extra_credit_purchase', 'extra_credit_package_id', v_package_id::text)
  );

  insert into public.credit_transactions (
    user_id, type, amount, description, metadata, student_payment_id
  ) values (
    v_user_id, 'standalone_purchase', 2, 'Existing extra-credit grant',
    jsonb_build_object('credit_type', 'extra', 'source', 'extra_credit_purchase'),
    v_existing_grant_id
  );

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000004', 'hook_extra_credit_existing_grant',
    'order.paid', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_existinggrant', 'status', 'paid', 'amount', 2000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '2',
        'local_payment_id', v_existing_grant_id::text
      )
    ))
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000004', v_existing_grant_id, v_user_id,
    'or_existinggrant', 2000, 'paid', 'ch_existinggrant', 'paid', '2026-09-02 14:00:00+00'
  ) into v_result;

  select count(*) into v_count from public.credit_transactions
  where student_payment_id = v_existing_grant_id and type = 'standalone_purchase';

  if v_count <> 1 then
    raise exception 'An existing standalone purchase must not be duplicated';
  end if;

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000005', 'hook_extra_credit_wrong_order',
    'order.paid', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_wrongorder', 'status', 'paid', 'amount', 4000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '4',
        'local_payment_id', v_payment_id::text
      )
    ))
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000005', v_payment_id, v_user_id,
    'or_wrongorder', 4000, 'paid', 'ch_wrongorder', 'paid', '2026-09-02 15:00:00+00'
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, false) then
    raise exception 'A payment already linked to another order must be rejected';
  end if;

  insert into public.student_payments (
    id, user_id, kind, provider, amount, credits_amount, status,
    payment_method, idempotency_key, metadata
  ) values (
    v_amount_mismatch_id, v_user_id, 'extra_credits', 'pagarme', 4000, 4,
    'processing', 'credit_card', 'extra-credit-finalization:amount-mismatch',
    jsonb_build_object('source', 'extra_credit_purchase', 'extra_credit_package_id', v_package_id::text)
  );

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000006', 'hook_extra_credit_amount_mismatch',
    'order.paid', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_amountmismatch', 'status', 'paid', 'amount', 5000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '4',
        'local_payment_id', v_amount_mismatch_id::text
      )
    ))
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000006', v_amount_mismatch_id, v_user_id,
    'or_amountmismatch', 5000, 'paid', 'ch_amountmismatch', 'paid', '2026-09-02 16:00:00+00'
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, false) then
    raise exception 'An amount mismatch must be rejected';
  end if;

  insert into public.student_payments (
    id, user_id, kind, provider, amount, credits_amount, status,
    payment_method, idempotency_key, metadata
  ) values (
    v_wrong_kind_id, v_user_id, 'subscription', 'pagarme', 4000, 4,
    'processing', 'credit_card', 'extra-credit-finalization:wrong-kind',
    jsonb_build_object('source', 'extra_credit_purchase', 'extra_credit_package_id', v_package_id::text)
  );

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000007', 'hook_extra_credit_wrong_kind',
    'order.paid', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_wrongkind', 'status', 'paid', 'amount', 4000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '4',
        'local_payment_id', v_wrong_kind_id::text
      )
    ))
  );

  select public.finalize_extra_credit_purchase(
    '51000000-0000-0000-0000-000000000007', v_wrong_kind_id, v_user_id,
    'or_wrongkind', 4000, 'paid', 'ch_wrongkind', 'paid', '2026-09-02 17:00:00+00'
  ) into v_result;

  if coalesce((v_result ->> 'success')::boolean, false) then
    raise exception 'A non-extra-credit payment must be rejected';
  end if;

  insert into public.student_payments (
    id, user_id, kind, provider, amount, credits_amount, status,
    payment_method, idempotency_key, metadata
  ) values (
    v_failed_payment_id, v_user_id, 'extra_credits', 'pagarme', 2500, 2,
    'processing', 'credit_card', 'extra-credit-finalization:failed',
    jsonb_build_object('source', 'extra_credit_purchase', 'extra_credit_package_id', v_package_id::text)
  );

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000008', 'hook_extra_credit_failed',
    'order.payment_failed', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_failedone', 'status', 'failed', 'amount', 2500,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '2',
        'local_payment_id', v_failed_payment_id::text
      )
    ))
  );

  select public.process_extra_credit_purchase_failure(
    '51000000-0000-0000-0000-000000000008', v_failed_payment_id, v_user_id,
    'or_failedone', 2500, 'failed', '2026-09-02 18:00:00+00'
  ) into v_result;

  select status into v_status from public.student_payments where id = v_failed_payment_id;
  select count(*) into v_count from public.credit_transactions
  where student_payment_id = v_failed_payment_id and type = 'standalone_purchase';

  if not coalesce((v_result ->> 'success')::boolean, false)
    or v_status <> 'failed'
    or v_count <> 0
  then
    raise exception 'A failed order must fail the payment without granting credits: %', v_result;
  end if;

  insert into public.pagarme_webhook_events (id, external_id, event_type, status, payload)
  values (
    '51000000-0000-0000-0000-000000000009', 'hook_extra_credit_failure_after_paid',
    'order.payment_failed', 'received', jsonb_build_object('data', jsonb_build_object(
      'id', 'or_paidone', 'status', 'failed', 'amount', 4000,
      'metadata', jsonb_build_object(
        'source', 'extra_credit_purchase', 'user_id', v_user_id::text,
        'extra_credit_package_id', v_package_id::text, 'credits_amount', '4',
        'local_payment_id', v_payment_id::text
      )
    ))
  );

  select public.process_extra_credit_purchase_failure(
    '51000000-0000-0000-0000-000000000009', v_payment_id, v_user_id,
    'or_paidone', 4000, 'failed', '2026-09-02 19:00:00+00'
  ) into v_result;

  select status into v_status from public.student_payments where id = v_payment_id;
  select count(*) into v_count from public.credit_transactions
  where student_payment_id = v_payment_id and type = 'standalone_purchase';

  if not coalesce((v_result ->> 'ignored')::boolean, false)
    or v_status <> 'paid'
    or v_count <> 1
  then
    raise exception 'A failure after paid must never downgrade or duplicate the purchase: %', v_result;
  end if;
end;
$$;

rollback;

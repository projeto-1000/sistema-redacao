-- Isolated LOCAL database only, after 20261008000001. Run as postgres.
-- Calls the real expiry routine with a reference date; never changes the clock.
-- All fixtures and side effects are rolled back, including on assertion failure.
begin;
set local session_replication_role = replica;
insert into auth.users(id) values ('18000000-0000-0000-0000-000000000001');
insert into public.profiles(id,email,full_name,phone,document,role)
values ('18000000-0000-0000-0000-000000000001','courtesy-local@example.com','Local Courtesy',
  '11999999997','12345678903','STUDENT');
insert into public.plans(id,name,external_id,credits_included,price,interval,interval_count)
values ('28000000-0000-0000-0000-000000000001','Local plan','plan_localcourtesy',4,3990,'month',1);
insert into public.subscriptions(id,user_id,plan_id,status,external_id,current_period_start,current_period_end,
  cancel_at_period_end,cancellation_mode,cancellation_requested_at,cancellation_effective_at,cancellation_metadata)
values ('38000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001','active','sub_localcourtesy','2080-10-01T03:00:00Z',
  '2080-10-10T02:59:59.999Z',true,'end_of_period','2080-10-08T15:00:00Z','2080-10-10T02:59:59.999Z',
  '{"source":"admin_support","support_operation_id":"58000000-0000-0000-0000-000000000001"}');
insert into public.student_credits(user_id,plan_credits,extra_credits,free_credits)
values ('18000000-0000-0000-0000-000000000001',2,3,1);
-- Expiry recomputes balances from the ledger, so the fixture needs matching grants.
insert into public.credit_transactions(user_id,type,amount,description,metadata)
values
  ('18000000-0000-0000-0000-000000000001','new_subscription',2,'Local plan credits',
    '{"credit_type":"plan"}'),
  ('18000000-0000-0000-0000-000000000001','standalone_purchase',3,'Local extra credits',
    '{"credit_type":"extra"}'),
  ('18000000-0000-0000-0000-000000000001','free_trial_grant',1,'Local free credit',
    '{"credit_type":"free"}');
insert into public.student_payments(id,user_id,subscription_id,plan_id,kind,provider,external_id,
  amount,credits_amount,status,payment_method,paid_at)
values ('48000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001',
  '38000000-0000-0000-0000-000000000001','28000000-0000-0000-0000-000000000001',
  'subscription','pagarme','sub_localcourtesy',3990,4,'paid','credit_card','2080-10-01T03:00:00Z');
insert into public.subscription_cancellation_history(id,student_id,subscription_id,provider_subscription_id,
  kind,requested_at,last_activity_at,status,refund_completed_at,effective_at,snapshot)
values ('68000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001',
  '38000000-0000-0000-0000-000000000001','sub_localcourtesy','support','2080-10-08T15:00:00Z',
  '2080-10-08T15:01:00Z','refunded','2080-10-08T15:01:00Z','2080-10-10T02:59:59.999Z','{}');
insert into public.subscription_support_operations(id,student_id,actor_id,subscription_id,payment_id,history_id,
  provider_subscription_id,provider_charge_id,action,amount,baseline_refunded,reason,courtesy_credits,
  courtesy_until,status,provider_canceled,refund_confirmed,snapshot)
values ('58000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001',
  '18000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',
  '48000000-0000-0000-0000-000000000001','68000000-0000-0000-0000-000000000001',
  'sub_localcourtesy','ch_localcourtesy','refund_courtesy',3990,0,'Local regression fixture',2,
  '2080-10-10T02:59:59.999Z','completed',true,true,'{}');
set local session_replication_role = origin;

do $$
declare
  v_sub uuid := '38000000-0000-0000-0000-000000000001';
  v_student uuid := '18000000-0000-0000-0000-000000000001';
  v_history uuid := '68000000-0000-0000-0000-000000000001';
  v_events jsonb;
begin
  perform public.process_scheduled_subscription_cancellations('2080-10-10T02:59:59.998Z');
  assert (select status = 'active' from public.subscriptions where id = v_sub), 'Access before deadline';
  assert (select plan_credits = 2 from public.student_credits where user_id = v_student), 'Credits before deadline';

  perform public.process_scheduled_subscription_cancellations('2080-10-10T03:00:00Z');
  assert (select status = 'canceled' from public.subscriptions where id = v_sub), 'Access ends after deadline';
  assert (select plan_credits = 0 and extra_credits = 3 and free_credits = 1
    from public.student_credits where user_id = v_student), 'Only remaining plan credits expire';
  assert (select status = 'refunded' from public.subscription_cancellation_history where id = v_history),
    'Expiry must preserve the completed refund';
  assert (select count(*) = 1 from public.subscription_cancellation_history h,
    lateral jsonb_array_elements(h.events) e where h.id = v_history and e ->> 'label' = 'Acesso encerrado'),
    'Record access closure once';
  select events into v_events from public.subscription_cancellation_history where id = v_history;
  perform public.process_scheduled_subscription_cancellations('2080-10-11T03:00:00Z');
  assert (select events = v_events from public.subscription_cancellation_history where id = v_history),
    'Repeated expiry is idempotent';
  assert (select count(*) = 1 from public.credit_transactions where user_id = v_student and type = 'plan_expiration'),
    'No duplicate credit expiration';

  -- Same local row receives a NEW paid contract, not an undo of the old refund.
  update public.subscriptions set status = 'active',external_id = 'sub_localnewcontract',
    cancel_at_period_end = false,cancellation_mode = null,cancellation_requested_at = null,
    cancellation_effective_at = null,cancellation_metadata = '{}' where id = v_sub;
  assert (select status = 'refunded' and events = v_events
    from public.subscription_cancellation_history where id = v_history), 'Re-subscription preserves the old refund';

  -- Real undo of a still-scheduled ordinary cancellation may use a new provider ID.
  update public.subscriptions set cancel_at_period_end = true,cancellation_mode = 'end_of_period',
    cancellation_requested_at = '2080-10-11T15:00:00Z',cancellation_effective_at = '2080-11-01T03:00:00Z'
    where id = v_sub;
  update public.subscriptions set cancel_at_period_end = false,cancellation_mode = null,
    cancellation_requested_at = null,external_id = 'sub_localundone' where id = v_sub;
  assert (select status = 'undone' from public.subscription_cancellation_history
    where subscription_id = v_sub and provider_subscription_id = 'sub_localnewcontract'), 'Ordinary undo still works';
end $$;
rollback;

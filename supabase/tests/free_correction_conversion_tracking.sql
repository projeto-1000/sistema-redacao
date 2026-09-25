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
  v_topic_id uuid := '22000000-0000-0000-0000-000000000001';
  v_essay_id uuid := '32000000-0000-0000-0000-000000000001';
  v_free_plan_id uuid := '42000000-0000-0000-0000-000000000001';
  v_paid_plan_id uuid := '42000000-0000-0000-0000-000000000002';
  v_subscription_id uuid := '52000000-0000-0000-0000-000000000001';
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    document,
    role,
    acquisition_channel
  )
  values
    (
      v_student_id,
      'free-correction-campaign-student@example.com',
      'Campaign Student',
      '11999999991',
      '12345678901',
      'STUDENT',
      'ORGANIC'
    ),
    (
      v_admin_id,
      'free-correction-campaign-admin@example.com',
      'Campaign Admin',
      '11999999992',
      '12345678902',
      'ADMIN',
      'ORGANIC'
    );

  insert into public.plans (
    id,
    name,
    description,
    external_id,
    credits_included,
    price,
    interval,
    interval_count,
    is_public
  )
  values
    (
      v_free_plan_id,
      'Campaign free trial',
      'Campaign test free trial',
      'internal_free_trial_campaign_tracking_test',
      1,
      0,
      'lifetime',
      1,
      false
    ),
    (
      v_paid_plan_id,
      'Campaign paid plan',
      'Campaign test paid plan',
      'plan_campaign_tracking_test',
      4,
      4990,
      'month',
      1,
      true
    );

  insert into public.subscriptions (
    id,
    user_id,
    plan_id,
    status,
    external_id,
    metadata
  )
  values (
    v_subscription_id,
    v_student_id,
    v_free_plan_id,
    'trial',
    'internal-free-trial:' || v_student_id::text,
    jsonb_build_object('subscription_type', 'free_trial')
  );

  insert into public.essay_topics (
    id,
    title,
    axis,
    source_type
  )
  values (
    v_topic_id,
    'Campaign tracking topic',
    'Educação',
    'AUTORAL'
  );

  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    description,
    metadata
  )
  values (
    v_student_id,
    'essay_usage',
    -1,
    'Campaign tracking essay usage',
    jsonb_build_object(
      'essay_id', v_essay_id,
      'credit_type', 'free',
      'credit_source', 'free_trial'
    )
  );

  insert into public.essays (
    id,
    student_id,
    topic_id,
    title,
    thematic_axis,
    content,
    status,
    correction_date
  )
  values (
    v_essay_id,
    v_student_id,
    v_topic_id,
    'Campaign tracking essay',
    'Educação',
    'Campaign tracking content',
    'corrected',
    now()
  );

  if not exists (
    select 1
    from public.conversion_campaign_participants
    where campaign_id = 'post_free_correction'
      and user_id = v_student_id
      and essay_id = v_essay_id
  ) then
    raise exception 'Corrected free-credit essay did not enroll in the campaign';
  end if;
end;
$$;

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}';

select public.record_post_free_correction_campaign_event(
  '32000000-0000-0000-0000-000000000001',
  'impression',
  'score_card',
  '{}'::jsonb
);

select public.record_post_free_correction_campaign_event(
  '32000000-0000-0000-0000-000000000001',
  'impression',
  'score_card',
  '{}'::jsonb
);

select public.record_post_free_correction_campaign_event(
  '32000000-0000-0000-0000-000000000001',
  'impression',
  'footer_banner',
  '{}'::jsonb
);

select public.record_post_free_correction_campaign_event(
  '32000000-0000-0000-0000-000000000001',
  'click',
  'footer_banner',
  '{}'::jsonb
);

select public.record_post_free_correction_checkout_started(
  '42000000-0000-0000-0000-000000000002'
);

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

update public.subscriptions
set
  plan_id = '42000000-0000-0000-0000-000000000002',
  status = 'active',
  external_id = 'sub_campaign_tracking_test',
  updated_at = now()
where id = '52000000-0000-0000-0000-000000000001';

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
  metadata
)
values (
  '62000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000002',
  'subscription',
  'pagarme',
  'sub_campaign_tracking_test',
  4990,
  4,
  'paid',
  'credit_card',
  now(),
  jsonb_build_object('checkout_operation', 'new_subscription')
);

do $$
declare
  v_count integer;
  v_placement text;
begin
  select count(*)
  into v_count
  from public.conversion_campaign_events as event
  inner join public.conversion_campaign_participants as participant
    on participant.id = event.participant_id
  where participant.user_id = '12000000-0000-0000-0000-000000000001'
    and event.event_type = 'impression'
    and event.placement = 'score_card';

  if v_count <> 1 then
    raise exception 'Impression tracking must be idempotent, got % rows', v_count;
  end if;

  select event.placement
  into v_placement
  from public.conversion_campaign_conversions as conversion
  inner join public.conversion_campaign_events as event
    on event.id = conversion.source_event_id
  where conversion.payment_id = '62000000-0000-0000-0000-000000000001'
    and conversion.attribution_type = 'last_click'
    and conversion.revenue_cents = 4990;

  if v_placement is distinct from 'footer_banner' then
    raise exception 'Conversion was not attributed to the latest footer click';
  end if;
end;
$$;

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
declare
  v_metrics jsonb;
  v_audience jsonb;
  v_events jsonb;
begin
  select public.get_post_free_correction_campaign_metrics(
    now() - interval '1 day',
    now() + interval '1 day'
  )
  into v_metrics;

  if (v_metrics #>> '{totals,eligible}')::integer <> 1
    or (v_metrics #>> '{totals,exposed}')::integer <> 1
    or (v_metrics #>> '{totals,clickers}')::integer <> 1
    or (v_metrics #>> '{totals,checkout_starters}')::integer <> 1
    or (v_metrics #>> '{totals,conversions}')::integer <> 1
    or (v_metrics #>> '{totals,revenue_cents}')::integer <> 4990
  then
    raise exception 'Campaign metrics are inconsistent: %', v_metrics;
  end if;

  select public.get_post_free_correction_campaign_audience(
    now() - interval '1 day',
    now() + interval '1 day',
    20,
    0
  )
  into v_audience;

  if (v_audience ->> 'total')::integer <> 1
    or v_audience #>> '{students,0,email}'
      is distinct from 'free-correction-campaign-student@example.com'
    or v_audience #>> '{students,0,stage}' is distinct from 'converted'
    or v_audience #>> '{students,0,first_impression_at}' is null
    or v_audience #>> '{students,0,first_click_at}' is null
    or v_audience #>> '{students,0,checkout_started_at}' is null
    or v_audience #>> '{students,0,converted_at}' is null
    or v_audience #>> '{students,0,attributed_placement}' is distinct from 'footer_banner'
  then
    raise exception 'Campaign audience is inconsistent: %', v_audience;
  end if;

  select public.get_post_free_correction_campaign_events(
    now() - interval '1 day',
    now() + interval '1 day',
    20,
    0
  )
  into v_events;

  if (v_events ->> 'total')::integer <> 6
    or not exists (
      select 1
      from jsonb_array_elements(v_events -> 'events') as event
      where event ->> 'event_type' = 'converted'
        and event ->> 'placement' = 'footer_banner'
    )
  then
    raise exception 'Campaign timeline events are inconsistent: %', v_events;
  end if;
end;
$$;

set local role service_role;
set local "request.jwt.claims" = '{"role":"service_role"}';

update public.conversion_campaigns
set
  starts_at = now() - interval '2 days',
  ends_at = now() - interval '1 day'
where id = 'post_free_correction';

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
begin
  if public.can_view_post_free_correction_campaign(
    '32000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Expired campaign must not keep displaying its banners';
  end if;
end;
$$;

rollback;

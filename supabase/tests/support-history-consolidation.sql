-- Local PostgreSQL only. No remote data is changed.
-- Fixtures exercise the grouping/order used by get_subscription_history_events.
do $$
declare visible_count integer; confirmed_count integer; started_at timestamptz;
begin
  with fixtures(id,user_id,type,created_at,metadata) as (values
    (1, 'student', 'administrative_adjustment', '2026-10-07T10:00:00Z'::timestamptz,
      '{"source":"admin_support","support_operation_id":"one"}'::jsonb),
    (2, 'student', 'administrative_adjustment', '2026-10-07T10:01:00Z'::timestamptz,
      '{"source":"admin_support","support_operation_id":"one","refund_amount":500}'::jsonb),
    (3, 'student', 'administrative_adjustment', '2026-10-07T11:00:00Z'::timestamptz,
      '{"source":"admin_support","support_operation_id":"two"}'::jsonb),
    (4, 'student', 'new_subscription', '2026-10-07T09:00:00Z'::timestamptz, '{}'::jsonb),
    (5, 'student', 'administrative_adjustment', '2026-10-07T12:00:00Z'::timestamptz,
      '{"source":"admin_support"}'::jsonb)
  ), ranked as (
    select f.*,
      row_number() over (
        partition by case when type = 'administrative_adjustment'
          and metadata ->> 'source' = 'admin_support'
          and nullif(metadata ->> 'support_operation_id','') is not null
        then 'support:' || (metadata ->> 'support_operation_id') else 'transaction:' || id::text end
        order by (metadata ? 'refund_amount') desc, created_at desc, id desc
      ) as display_rank,
      min(created_at) over (
        partition by case when type = 'administrative_adjustment'
          and metadata ->> 'source' = 'admin_support'
          and nullif(metadata ->> 'support_operation_id','') is not null
        then 'support:' || (metadata ->> 'support_operation_id') else 'transaction:' || id::text end
      ) as requested_at
    from fixtures f
  )
  select count(*), count(*) filter(where metadata ? 'refund_amount'),
    min(requested_at) filter(where metadata ->> 'support_operation_id' = 'one')
  into visible_count, confirmed_count, started_at from ranked where display_rank = 1;
  assert visible_count = 4, 'One row per attendance; preserve unrelated and legacy rows';
  assert confirmed_count = 1, 'The completed row replaces the started row';
  assert started_at = '2026-10-07T10:00:00Z'::timestamptz, 'Preserve request date';
end $$;

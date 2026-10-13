begin;

create or replace function public.get_dashboard_metrics_internal()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_month_start timestamptz := date_trunc('month', now());
  last_month_start timestamptz := current_month_start - interval '1 month';

  p_current integer;
  p_last integer;

  e_pending integer;
  e_current integer;
  e_last integer;

  s_current integer;
  s_last integer;
begin
  select
    count(distinct profile.id),
    count(distinct profile.id) filter (
      where subscription.created_at < current_month_start
    )
  into p_current, p_last
  from public.profiles as profile
  inner join public.subscriptions as subscription
    on subscription.user_id = profile.id
  where profile.role = 'STUDENT'
    and subscription.status = 'active';

  select
    count(*),
    count(*) filter (where created_at < current_month_start)
  into s_current, s_last
  from public.subscriptions
  where status = 'active';

  select
    count(*) filter (where status = 'pending'),
    count(*) filter (where created_at >= current_month_start),
    count(*) filter (
      where created_at >= last_month_start
        and created_at < current_month_start
    )
  into e_pending, e_current, e_last
  from public.essays;

  return json_build_object(
    'current_students', p_current,
    'last_month_students', p_last,
    'pending_essays', e_pending,
    'current_essays', e_current,
    'last_month_essays', e_last,
    'current_plans', s_current,
    'last_month_plans', s_last
  );
end;
$$;

commit;

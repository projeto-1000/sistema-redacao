begin;

create or replace function public.get_weekly_essay_volume()
returns table (
  chart_date date,
  sent bigint,
  corrected bigint
)
language sql
as $$
  with local_period as (
    select
      (now() at time zone 'America/Sao_Paulo')::date - 6 as start_date,
      (now() at time zone 'America/Sao_Paulo')::date + 1 as end_date
  ),
  period_bounds as (
    select
      local_period.start_date,
      local_period.start_date::timestamp at time zone 'America/Sao_Paulo' as start_at,
      local_period.end_date::timestamp at time zone 'America/Sao_Paulo' as end_at
    from local_period
  ),
  dates as (
    select period_bounds.start_date + day_offset as chart_date
    from period_bounds
    cross join generate_series(0, 6) as days(day_offset)
  ),
  sent_essays as (
    select
      (essay.submission_date at time zone 'America/Sao_Paulo')::date as chart_date,
      count(*) as total
    from public.essays as essay
    cross join period_bounds
    where essay.status in ('pending', 'correcting', 'corrected', 'returned')
      and essay.submission_date >= period_bounds.start_at
      and essay.submission_date < period_bounds.end_at
    group by 1
  ),
  corrected_essays as (
    select
      (essay.correction_date at time zone 'America/Sao_Paulo')::date as chart_date,
      count(*) as total
    from public.essays as essay
    cross join period_bounds
    where essay.status = 'corrected'
      and essay.correction_date >= period_bounds.start_at
      and essay.correction_date < period_bounds.end_at
    group by 1
  )
  select
    dates.chart_date,
    coalesce(sent_essays.total, 0) as sent,
    coalesce(corrected_essays.total, 0) as corrected
  from dates
  left join sent_essays using (chart_date)
  left join corrected_essays using (chart_date)
  order by dates.chart_date;
$$;

create or replace function public.get_weekly_essay_volume(weeks_ago integer default 0)
returns table (
  chart_date date,
  sent bigint,
  corrected bigint
)
language sql
as $$
  with local_week as (
    select (
      date_trunc('week', now() at time zone 'America/Sao_Paulo')
      - interval '1 week' * weeks_ago
    )::date as start_date
  ),
  week_bounds as (
    select
      local_week.start_date,
      local_week.start_date::timestamp at time zone 'America/Sao_Paulo' as start_at,
      (local_week.start_date + 7)::timestamp at time zone 'America/Sao_Paulo' as end_at
    from local_week
  ),
  dates as (
    select week_bounds.start_date + day_offset as chart_date
    from week_bounds
    cross join generate_series(0, 6) as days(day_offset)
  ),
  sent_essays as (
    select
      (essay.submission_date at time zone 'America/Sao_Paulo')::date as chart_date,
      count(*) as total
    from public.essays as essay
    cross join week_bounds
    where essay.status in ('pending', 'correcting', 'corrected', 'returned')
      and essay.submission_date >= week_bounds.start_at
      and essay.submission_date < week_bounds.end_at
    group by 1
  ),
  corrected_essays as (
    select
      (essay.correction_date at time zone 'America/Sao_Paulo')::date as chart_date,
      count(*) as total
    from public.essays as essay
    cross join week_bounds
    where essay.status = 'corrected'
      and essay.correction_date >= week_bounds.start_at
      and essay.correction_date < week_bounds.end_at
    group by 1
  )
  select
    dates.chart_date,
    coalesce(sent_essays.total, 0) as sent,
    coalesce(corrected_essays.total, 0) as corrected
  from dates
  left join sent_essays using (chart_date)
  left join corrected_essays using (chart_date)
  order by dates.chart_date;
$$;

commit;

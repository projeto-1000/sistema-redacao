begin;

create or replace function public.essay_correction_sla_hours()
returns integer
language sql
immutable
set search_path = 'public'
as $$
  select 48;
$$;

comment on function public.essay_correction_sla_hours() is
  'Single source of truth for the essay correction SLA, in business-day hours.';

create or replace function public.calculate_easter_sunday(p_year integer)
returns date
language plpgsql
immutable
set search_path = 'public'
as $$
declare
  v_a integer;
  v_b integer;
  v_c integer;
  v_d integer;
  v_e integer;
  v_f integer;
  v_g integer;
  v_h integer;
  v_i integer;
  v_k integer;
  v_l integer;
  v_m integer;
  v_month integer;
  v_day integer;
begin
  v_a := p_year % 19;
  v_b := p_year / 100;
  v_c := p_year % 100;
  v_d := v_b / 4;
  v_e := v_b % 4;
  v_f := (v_b + 8) / 25;
  v_g := (v_b - v_f + 1) / 3;
  v_h := (19 * v_a + v_b - v_d - v_g + 15) % 30;
  v_i := v_c / 4;
  v_k := v_c % 4;
  v_l := (32 + 2 * v_e + 2 * v_i - v_h - v_k) % 7;
  v_m := (v_a + 11 * v_h + 22 * v_l) / 451;
  v_month := (v_h + v_l - 7 * v_m + 114) / 31;
  v_day := ((v_h + v_l - 7 * v_m + 114) % 31) + 1;

  return make_date(p_year, v_month, v_day);
end;
$$;

create or replace function public.is_essay_business_day(p_date date)
returns boolean
language plpgsql
stable
set search_path = 'public'
as $$
declare
  v_easter date := public.calculate_easter_sunday(extract(year from p_date)::integer);
begin
  if extract(isodow from p_date) in (6, 7) then
    return false;
  end if;

  if to_char(p_date, 'MM-DD') in (
    '01-01',
    '04-21',
    '05-01',
    '09-07',
    '10-12',
    '11-02',
    '11-15',
    '11-20',
    '12-25'
  ) then
    return false;
  end if;

  -- Preserves the nationally observed movable dates already represented
  -- by the holidays table, without limiting the rule to seeded years.
  if p_date in (
    v_easter - 47, -- Carnival Tuesday
    v_easter - 2,  -- Good Friday
    v_easter + 60  -- Corpus Christi
  ) then
    return false;
  end if;

  return not exists (
    select 1
    from public.holidays as holiday
    where holiday.date = p_date
  );
end;
$$;

create or replace function public.calculate_essay_due_date(
  p_start_date timestamp with time zone
)
returns timestamp with time zone
language plpgsql
stable
set search_path = 'public'
as $$
declare
  v_cursor timestamp without time zone :=
    p_start_date at time zone 'America/Sao_Paulo';
  v_day_end timestamp without time zone;
  v_available_seconds bigint;
  v_remaining_seconds bigint :=
    public.essay_correction_sla_hours()::bigint * 60 * 60;
begin
  while v_remaining_seconds > 0 loop
    if not public.is_essay_business_day(v_cursor::date) then
      v_cursor := date_trunc('day', v_cursor) + interval '1 day';
      continue;
    end if;

    v_day_end := date_trunc('day', v_cursor) + interval '1 day';
    v_available_seconds := extract(epoch from (v_day_end - v_cursor))::bigint;

    if v_remaining_seconds <= v_available_seconds then
      v_cursor := v_cursor + make_interval(secs => v_remaining_seconds);
      v_remaining_seconds := 0;
    else
      v_remaining_seconds := v_remaining_seconds - v_available_seconds;
      v_cursor := v_day_end;
    end if;
  end loop;

  return v_cursor at time zone 'America/Sao_Paulo';
end;
$$;

-- submit_essay currently passes a São Paulo wall-clock timestamp. This exact
-- overload prevents PostgreSQL from implicitly interpreting that value as UTC.
create or replace function public.calculate_essay_due_date(
  p_start_date timestamp without time zone
)
returns timestamp with time zone
language sql
stable
set search_path = 'public'
as $$
  select public.calculate_essay_due_date(
    p_start_date at time zone 'America/Sao_Paulo'
  );
$$;

create or replace function public.calculate_essay_business_seconds(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
returns bigint
language plpgsql
stable
set search_path = 'public'
as $$
declare
  v_cursor timestamp with time zone := p_start_date;
  v_local_date date;
  v_next_day timestamp with time zone;
  v_segment_end timestamp with time zone;
  v_total_seconds bigint := 0;
begin
  if p_end_date < p_start_date then
    return -public.calculate_essay_business_seconds(p_end_date, p_start_date);
  end if;

  while v_cursor < p_end_date loop
    v_local_date := (v_cursor at time zone 'America/Sao_Paulo')::date;
    v_next_day := (v_local_date + 1)::timestamp at time zone 'America/Sao_Paulo';
    v_segment_end := least(p_end_date, v_next_day);

    if public.is_essay_business_day(v_local_date) then
      v_total_seconds := v_total_seconds
        + extract(epoch from (v_segment_end - v_cursor))::bigint;
    end if;

    v_cursor := v_segment_end;
  end loop;

  return v_total_seconds;
end;
$$;

create or replace function public.essay_remaining_business_seconds(
  p_essay public.essays
)
returns bigint
language sql
stable
security definer
set search_path = 'public'
as $$
  select case
    when p_essay.due_date is null then null
    else public.calculate_essay_business_seconds(now(), p_essay.due_date)
  end;
$$;

revoke all on function public.essay_correction_sla_hours()
from public, anon, authenticated;

revoke all on function public.calculate_easter_sunday(integer)
from public, anon, authenticated;

revoke all on function public.is_essay_business_day(date)
from public, anon, authenticated;

revoke all on function public.calculate_essay_due_date(timestamp with time zone)
from public, anon, authenticated;

revoke all on function public.calculate_essay_due_date(timestamp without time zone)
from public, anon, authenticated;

revoke all on function public.calculate_essay_business_seconds(
  timestamp with time zone,
  timestamp with time zone
)
from public, anon, authenticated;

revoke all on function public.essay_remaining_business_seconds(public.essays)
from public, anon, authenticated;

grant execute on function public.essay_remaining_business_seconds(public.essays)
to authenticated, service_role;

grant execute on function public.essay_correction_sla_hours()
to service_role;

grant execute on function public.calculate_easter_sunday(integer)
to service_role;

grant execute on function public.is_essay_business_day(date)
to service_role;

grant execute on function public.calculate_essay_due_date(timestamp with time zone)
to service_role;

grant execute on function public.calculate_essay_due_date(timestamp without time zone)
to service_role;

grant execute on function public.calculate_essay_business_seconds(
  timestamp with time zone,
  timestamp with time zone
)
to service_role;

notify pgrst, 'reload schema';

commit;

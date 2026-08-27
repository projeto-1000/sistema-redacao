begin;

do $$
declare
  v_deadline timestamptz;
begin
  if public.essay_correction_sla_hours() <> 48 then
    raise exception 'SLA configuration must be 48 business hours';
  end if;

  -- 1. Monday without a holiday.
  v_deadline := public.calculate_essay_due_date('2026-08-17 13:00:00+00'::timestamptz);
  if v_deadline <> '2026-08-19 13:00:00+00'::timestamptz then
    raise exception 'Unexpected Monday deadline: %', v_deadline;
  end if;

  -- 2. Submission close to the end of Friday.
  v_deadline := public.calculate_essay_due_date('2026-08-22 02:30:00+00'::timestamptz);
  if v_deadline <> '2026-08-26 02:30:00+00'::timestamptz then
    raise exception 'Unexpected late-Friday deadline: %', v_deadline;
  end if;

  -- 3. Deadline crossing Saturday and Sunday.
  v_deadline := public.calculate_essay_due_date('2026-08-21 18:00:00+00'::timestamptz);
  if v_deadline <> '2026-08-25 18:00:00+00'::timestamptz then
    raise exception 'Unexpected weekend deadline: %', v_deadline;
  end if;

  if public.calculate_essay_due_date('2026-08-22 15:00:00+00'::timestamptz)
    <> '2026-08-26 03:00:00+00'::timestamptz then
    raise exception 'A weekend submission did not start at the next valid midnight';
  end if;

  if public.calculate_essay_business_seconds(
    '2026-08-22 15:00:00+00'::timestamptz,
    v_deadline
  ) <> public.calculate_essay_business_seconds(
    '2026-08-23 15:00:00+00'::timestamptz,
    v_deadline
  ) then
    raise exception 'Remaining business time changed during the weekend';
  end if;

  -- 4. Deadline crossing the September 7 national holiday.
  v_deadline := public.calculate_essay_due_date('2026-09-04 15:00:00+00'::timestamptz);
  if v_deadline <> '2026-09-09 15:00:00+00'::timestamptz then
    raise exception 'Unexpected holiday deadline: %', v_deadline;
  end if;

  if public.calculate_essay_business_seconds(
    '2026-09-07 13:00:00+00'::timestamptz,
    v_deadline
  ) <> public.calculate_essay_business_seconds(
    '2026-09-07 21:00:00+00'::timestamptz,
    v_deadline
  ) then
    raise exception 'Remaining business time changed during a national holiday';
  end if;

  -- 5. Deadline crossing a holiday and a weekend.
  v_deadline := public.calculate_essay_due_date('2026-09-04 23:00:00+00'::timestamptz);
  if v_deadline <> '2026-09-09 23:00:00+00'::timestamptz then
    raise exception 'Unexpected holiday/weekend deadline: %', v_deadline;
  end if;

  -- 6. Deadline close to the turn of the year.
  v_deadline := public.calculate_essay_due_date('2026-12-31 15:00:00+00'::timestamptz);
  if v_deadline <> '2027-01-05 15:00:00+00'::timestamptz then
    raise exception 'Unexpected year-turn deadline: %', v_deadline;
  end if;

  -- 7. UTC input preserves the equivalent São Paulo wall-clock time.
  v_deadline := public.calculate_essay_due_date('2026-08-17 13:00:00+00'::timestamptz);
  if v_deadline at time zone 'America/Sao_Paulo' <> timestamp '2026-08-19 10:00:00' then
    raise exception 'UTC conversion changed the local submission time: %', v_deadline;
  end if;

  if public.calculate_essay_due_date(timestamp '2026-08-17 10:00:00')
    <> '2026-08-19 13:00:00+00'::timestamptz then
    raise exception 'São Paulo wall-clock compatibility overload shifted the deadline';
  end if;

  -- Movable holiday derived from Easter (Good Friday).
  v_deadline := public.calculate_essay_due_date('2026-04-02 15:00:00+00'::timestamptz);
  if v_deadline <> '2026-04-07 15:00:00+00'::timestamptz then
    raise exception 'Unexpected movable-holiday deadline: %', v_deadline;
  end if;

  -- 8 and 10. A new deadline contains exactly the configured business SLA.
  if public.calculate_essay_business_seconds(
    '2026-08-21 18:00:00+00'::timestamptz,
    public.calculate_essay_due_date('2026-08-21 18:00:00+00'::timestamptz)
  ) <> public.essay_correction_sla_hours() * 60 * 60 then
    raise exception 'New deadline does not contain the configured business SLA';
  end if;

  -- 9. It becomes late only after the full business SLA is consumed.
  v_deadline := public.calculate_essay_due_date('2026-08-21 18:00:00+00'::timestamptz);
  if public.calculate_essay_business_seconds(
    '2026-08-25 17:59:59+00'::timestamptz,
    v_deadline
  ) <= 0 then
    raise exception 'Deadline became late before the SLA was consumed';
  end if;

  if public.calculate_essay_business_seconds(
    '2026-08-25 18:00:01+00'::timestamptz,
    v_deadline
  ) >= 0 then
    raise exception 'Deadline did not become late after the SLA was consumed';
  end if;
end;
$$;

rollback;

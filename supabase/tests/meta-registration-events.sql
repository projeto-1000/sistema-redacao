-- Isolated regression only: fixtures are rolled back and no external requests are made.
begin;

do $$
begin
  if has_table_privilege('anon', 'public.meta_registration_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.meta_registration_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.meta_registration_events', 'INSERT')
    or has_function_privilege('authenticated', 'public.claim_meta_registration_events(uuid, integer)', 'EXECUTE')
  then raise exception 'Marketing attribution/outbox must remain service-only'; end if;
end;
$$;

-- Suppress unrelated signup side effects while constructing the auth fixtures.
set local session_replication_role = replica;
insert into auth.users(id, email, created_at, raw_user_meta_data) values
 ('19000000-0000-0000-0000-000000000001', 'meta-one@example.test', now(),
  '{"registration_attribution":{"utm_source":"meta","fbclid":"test_click","fbc":"fb.1.1792670400000.test_click","event_source_url":"https://app.projeto1000.com.br/cadastro/senha"}}'),
 ('19000000-0000-0000-0000-000000000002', 'meta-two@example.test', now(), '{}'),
 ('19000000-0000-0000-0000-000000000003', 'meta-teacher@example.test', now(), '{}'),
 ('19000000-0000-0000-0000-000000000004', 'meta-rollback@example.test', now(), '{}');
set local session_replication_role = origin;

insert into public.profiles(id, email, full_name, document, phone_country_code, phone, role) values
 ('19000000-0000-0000-0000-000000000001', ' META-ONE@example.test ', 'Meta Test One', '19000000001', '55', '11999990001', 'STUDENT'),
 ('19000000-0000-0000-0000-000000000002', 'meta-two@example.test', 'Meta Test Two', '19000000002', '55', '11999990002', 'STUDENT'),
 ('19000000-0000-0000-0000-000000000003', 'meta-teacher@example.test', 'Meta Teacher', '19000000003', '55', '11999990003', 'TEACHER');

do $$
declare
  v_row public.meta_registration_events;
  v_count integer;
begin
  select * into strict v_row from public.meta_registration_events
    where user_id = '19000000-0000-0000-0000-000000000001';
  if v_row.event_id <> 'registration:19000000-0000-0000-0000-000000000001'
    or v_row.email_hash <> encode(sha256(convert_to('meta-one@example.test', 'UTF8')), 'hex')
    or v_row.phone_hash <> encode(sha256(convert_to('5511999990001', 'UTF8')), 'hex')
    or v_row.attribution ->> 'utm_source' <> 'meta'
  then raise exception 'Event must preserve source, stable identity and normalized SHA-256 contacts'; end if;

  if exists (select 1 from public.meta_registration_events where user_id = '19000000-0000-0000-0000-000000000003')
    then raise exception 'Teacher accounts must not count as student registrations'; end if;

  update public.profiles set full_name = 'Renamed'
    where id = '19000000-0000-0000-0000-000000000001';
  select count(*) into v_count from public.meta_registration_events
    where user_id = '19000000-0000-0000-0000-000000000001';
  if v_count <> 1 then raise exception 'Profile updates must not register another conversion'; end if;

  -- A failed transaction must not leave a registration to deliver.
  begin
    insert into public.profiles(id, email, full_name, document, phone_country_code, phone, role)
      values ('19000000-0000-0000-0000-000000000004', 'meta-rollback@example.test', 'Rollback', '19000000004', '55', '11999990004', 'STUDENT');
    raise exception 'simulate failure' using errcode = 'P9999';
  exception when sqlstate 'P9999' then null;
  end;
  if exists (select 1 from public.meta_registration_events where user_id = '19000000-0000-0000-0000-000000000004')
    then raise exception 'Failed account creation left an event behind'; end if;

  select count(*) into v_count from public.claim_meta_registration_events('19000000-0000-0000-0000-000000000001', 1);
  if v_count <> 1 then raise exception 'A new registration must be claimable'; end if;
  select count(*) into v_count from public.claim_meta_registration_events('19000000-0000-0000-0000-000000000001', 1);
  if v_count <> 0 then raise exception 'Active delivery lease was claimed twice'; end if;

  -- A process crash releases through expiry; retries preserve the identity and event time.
  update public.meta_registration_events set locked_until = now() - interval '1 second'
    where user_id = '19000000-0000-0000-0000-000000000001';
  select * into strict v_row from public.claim_meta_registration_events('19000000-0000-0000-0000-000000000001', 1);
  if v_row.attempts <> 2 or v_row.event_id <> 'registration:19000000-0000-0000-0000-000000000001'
    then raise exception 'Retry changed identity or failed to recover expired lease'; end if;
  update public.meta_registration_events set sent_at = now(), locked_until = null
    where user_id = '19000000-0000-0000-0000-000000000001';
  select count(*) into v_count from public.claim_meta_registration_events('19000000-0000-0000-0000-000000000001', 1);
  if v_count <> 0 then raise exception 'Delivered conversion was retried'; end if;

  update public.meta_registration_events set event_time = now() - interval '8 days'
    where user_id = '19000000-0000-0000-0000-000000000002';
  select count(*) into v_count from public.claim_meta_registration_events('19000000-0000-0000-0000-000000000002', 1);
  if v_count <> 0 then raise exception 'Expired conversion was sent as a recent registration'; end if;
end;
$$;
rollback;

begin;

alter table public.signup_attempts
  add column registration_attribution jsonb not null default '{}'::jsonb
  check (jsonb_typeof(registration_attribution) = 'object'
    and octet_length(registration_attribution::text) <= 8192);

-- Attribution belongs to the user; delivery state is a durable outbox.
-- No historical accounts are backfilled as new registrations.
create table public.meta_registration_events (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  event_id text unique not null,
  event_time timestamptz not null default now(),
  email_hash text,
  phone_hash text,
  attribution jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  sent_at timestamptz,
  last_error_code text
);

create index meta_registration_events_pending_idx
  on public.meta_registration_events(next_attempt_at) where sent_at is null;
alter table public.meta_registration_events enable row level security;
revoke all on public.meta_registration_events from public, anon, authenticated;
grant select, insert, update on public.meta_registration_events to service_role;

create function public.queue_meta_registration_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attribution jsonb;
  v_created_at timestamptz;
  v_phone text;
begin
  select u.raw_user_meta_data -> 'registration_attribution', u.created_at
    into v_attribution, v_created_at from auth.users u where u.id = new.id;
  if v_attribution is null or jsonb_typeof(v_attribution) <> 'object'
      or octet_length(v_attribution::text) > 8192 then
    v_attribution := '{}'::jsonb;
  end if;
  v_phone := regexp_replace(coalesce(new.phone_country_code, '55') || coalesce(new.phone, ''), '[^0-9]', '', 'g');
  insert into public.meta_registration_events(user_id, event_id, event_time, email_hash, phone_hash, attribution)
    values (new.id, 'registration:' || new.id::text, coalesce(v_created_at, now()),
      case when nullif(trim(new.email), '') is not null
        then encode(sha256(convert_to(lower(trim(new.email)), 'UTF8')), 'hex') end,
      case when nullif(new.phone, '') is not null
        then encode(sha256(convert_to(v_phone, 'UTF8')), 'hex') end,
      v_attribution)
    on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_meta_registration_event() from public, anon, authenticated;

-- The existing auth trigger inserts the profile in the account-creation transaction.
-- A failed signup therefore cannot leave an event behind. Teachers are excluded.
create trigger queue_student_meta_registration
  after insert on public.profiles
  for each row when (new.role = 'STUDENT')
  execute function public.queue_meta_registration_event();

create function public.claim_meta_registration_events(p_user_id uuid default null, p_limit integer default 5)
returns setof public.meta_registration_events
language sql
security definer
set search_path = ''
as $$
  with due as (
    select e.user_id from public.meta_registration_events e
    where e.sent_at is null
      and e.next_attempt_at <= now()
      and (e.locked_until is null or e.locked_until < now())
      and e.event_time > now() - interval '7 days'
      and (p_user_id is null or e.user_id = p_user_id)
    order by e.next_attempt_at
    limit greatest(1, least(coalesce(p_limit, 5), 5))
    for update skip locked
  )
  update public.meta_registration_events e
    set locked_until = now() + interval '2 minutes', attempts = e.attempts + 1
    from due where e.user_id = due.user_id
    returning e.*;
$$;
revoke all on function public.claim_meta_registration_events(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_meta_registration_events(uuid, integer) to service_role;

-- Rollback: disable CAPI delivery, then drop the trigger and the two functions.
-- Retain the outbox and attribution column to preserve collected attribution/history.
commit;

begin;

create table public.conversion_campaigns (
  id text primary key,
  name text not null,
  description text,
  attribution_window_days integer not null default 7,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversion_campaigns_id_not_blank check (length(btrim(id)) > 0),
  constraint conversion_campaigns_name_not_blank check (length(btrim(name)) > 0),
  constraint conversion_campaigns_attribution_window_positive
    check (attribution_window_days > 0),
  constraint conversion_campaigns_period_valid
    check (ends_at is null or ends_at > starts_at)
);

insert into public.conversion_campaigns (
  id,
  name,
  description,
  attribution_window_days
)
values (
  'post_free_correction',
  'Pós-correção gratuita',
  'Conversão de alunos orgânicos após o uso do crédito gratuito de redação.',
  7
);

create table public.conversion_campaign_participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.conversion_campaigns(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  essay_id uuid not null references public.essays(id) on delete restrict,
  eligible_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversion_campaign_participants_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint conversion_campaign_participants_campaign_user_unique
    unique (campaign_id, user_id)
);

create table public.conversion_campaign_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references public.conversion_campaign_participants(id) on delete cascade,
  event_type text not null,
  placement text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint conversion_campaign_events_type_valid
    check (event_type in ('impression', 'click', 'dismiss', 'checkout_started')),
  constraint conversion_campaign_events_placement_valid
    check (placement in ('score_card', 'footer_banner')),
  constraint conversion_campaign_events_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create unique index conversion_campaign_events_singleton_idx
  on public.conversion_campaign_events (participant_id, event_type, placement)
  where event_type in ('impression', 'dismiss');

create index conversion_campaign_events_participant_created_idx
  on public.conversion_campaign_events (participant_id, created_at desc);

create index conversion_campaign_events_type_created_idx
  on public.conversion_campaign_events (event_type, created_at desc);

create table public.conversion_campaign_conversions (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.conversion_campaigns(id) on delete restrict,
  participant_id uuid not null
    references public.conversion_campaign_participants(id) on delete restrict,
  payment_id uuid not null references public.student_payments(id) on delete restrict,
  source_event_id uuid not null references public.conversion_campaign_events(id) on delete restrict,
  attribution_type text not null,
  attribution_window_days integer not null,
  revenue_cents integer not null,
  converted_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint conversion_campaign_conversions_payment_unique unique (payment_id),
  constraint conversion_campaign_conversions_attribution_valid
    check (attribution_type in ('last_click', 'view_through')),
  constraint conversion_campaign_conversions_window_positive
    check (attribution_window_days > 0),
  constraint conversion_campaign_conversions_revenue_positive
    check (revenue_cents > 0)
);

create index conversion_campaign_conversions_campaign_converted_idx
  on public.conversion_campaign_conversions (campaign_id, converted_at desc);

alter table public.conversion_campaigns enable row level security;
alter table public.conversion_campaign_participants enable row level security;
alter table public.conversion_campaign_events enable row level security;
alter table public.conversion_campaign_conversions enable row level security;

create policy "Authenticated users read active conversion campaigns"
on public.conversion_campaigns for select
to authenticated
using (is_active or public.is_admin());

create policy "Users read their own conversion campaign participation"
on public.conversion_campaign_participants for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Users read their own conversion campaign events"
on public.conversion_campaign_events for select
to authenticated
using (
  exists (
    select 1
    from public.conversion_campaign_participants as participant
    where participant.id = participant_id
      and (participant.user_id = auth.uid() or public.is_admin())
  )
);

create policy "Admins read conversion campaign conversions"
on public.conversion_campaign_conversions for select
to authenticated
using (public.is_admin());

create function public.is_post_free_correction_campaign_eligible(
  p_user_id uuid,
  p_essay_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.conversion_campaigns as campaign
      where campaign.id = 'post_free_correction'
        and campaign.is_active
        and campaign.starts_at <= now()
        and (campaign.ends_at is null or campaign.ends_at > now())
    )
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = p_user_id
        and profile.acquisition_channel = 'ORGANIC'
    )
    and exists (
      select 1
      from public.essays as essay
      where essay.id = p_essay_id
        and essay.student_id = p_user_id
        and essay.status = 'corrected'
    )
    and exists (
      select 1
      from public.credit_transactions as transaction
      where transaction.user_id = p_user_id
        and transaction.type = 'essay_usage'
        and transaction.metadata ->> 'essay_id' = p_essay_id::text
        and transaction.metadata ->> 'credit_type' = 'free'
        and transaction.metadata ->> 'credit_source' = 'free_trial'
    )
    and not exists (
      select 1
      from public.subscriptions as subscription
      inner join public.plans as plan on plan.id = subscription.plan_id
      where subscription.user_id = p_user_id
        and subscription.status = 'active'
        and plan.price > 0
        and coalesce(plan.external_id, '') not in (
          'internal_free_trial',
          'internal_mentoria_free'
        )
    );
$$;

revoke all on function public.is_post_free_correction_campaign_eligible(uuid, uuid)
from public, anon, authenticated;

create function public.can_view_post_free_correction_campaign(
  p_essay_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and public.is_post_free_correction_campaign_eligible(auth.uid(), p_essay_id);
$$;

revoke all on function public.can_view_post_free_correction_campaign(uuid)
from public, anon;

grant execute on function public.can_view_post_free_correction_campaign(uuid)
to authenticated;

create function public.enroll_post_free_correction_campaign_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'corrected'
    or not public.is_post_free_correction_campaign_eligible(new.student_id, new.id)
  then
    return new;
  end if;

  insert into public.conversion_campaign_participants (
    campaign_id,
    user_id,
    essay_id,
    eligible_at
  )
  values (
    'post_free_correction',
    new.student_id,
    new.id,
    coalesce(new.correction_date, new.updated_at, now())
  )
  on conflict (campaign_id, user_id) do nothing;

  return new;
exception
  when others then
    raise warning 'Falha ao inscrever a redação % na campanha pós-correção: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger enroll_post_free_correction_campaign_participant
after insert or update of status on public.essays
for each row
execute function public.enroll_post_free_correction_campaign_participant();

insert into public.conversion_campaign_participants (
  campaign_id,
  user_id,
  essay_id,
  eligible_at,
  metadata
)
select
  'post_free_correction',
  essay.student_id,
  essay.id,
  coalesce(essay.correction_date, essay.updated_at, now()),
  jsonb_build_object('source', 'migration_backfill')
from public.essays as essay
where public.is_post_free_correction_campaign_eligible(essay.student_id, essay.id)
on conflict (campaign_id, user_id) do nothing;

create function public.record_post_free_correction_campaign_event(
  p_essay_id uuid,
  p_event_type text,
  p_placement text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_participant_id uuid;
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_event_type not in ('impression', 'click', 'dismiss') then
    raise exception 'Evento de campanha inválido.';
  end if;

  if p_placement not in ('score_card', 'footer_banner') then
    raise exception 'Posição de campanha inválida.';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Metadados de campanha inválidos.';
  end if;

  if not public.is_post_free_correction_campaign_eligible(v_user_id, p_essay_id) then
    raise exception 'Aluno não elegível para a campanha.';
  end if;

  insert into public.conversion_campaign_participants (
    campaign_id,
    user_id,
    essay_id
  )
  values (
    'post_free_correction',
    v_user_id,
    p_essay_id
  )
  on conflict (campaign_id, user_id)
  do update set
    updated_at = now()
  returning id into v_participant_id;

  if p_event_type in ('impression', 'dismiss') then
    insert into public.conversion_campaign_events (
      participant_id,
      event_type,
      placement,
      metadata
    )
    values (
      v_participant_id,
      p_event_type,
      p_placement,
      p_metadata
    )
    on conflict (participant_id, event_type, placement)
      where event_type in ('impression', 'dismiss')
    do nothing
    returning id into v_event_id;

    if v_event_id is null then
      select event.id
      into v_event_id
      from public.conversion_campaign_events as event
      where event.participant_id = v_participant_id
        and event.event_type = p_event_type
        and event.placement = p_placement;
    end if;
  else
    insert into public.conversion_campaign_events (
      participant_id,
      event_type,
      placement,
      metadata
    )
    values (
      v_participant_id,
      p_event_type,
      p_placement,
      p_metadata
    )
    returning id into v_event_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_post_free_correction_campaign_event(uuid, text, text, jsonb)
from public, anon;

grant execute on function public.record_post_free_correction_campaign_event(uuid, text, text, jsonb)
to authenticated;

create function public.record_post_free_correction_checkout_started(
  p_plan_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_participant_id uuid;
  v_click_event_id uuid;
  v_placement text;
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.plans as plan
    where plan.id = p_plan_id
      and plan.is_active
      and plan.is_public
      and plan.price > 0
  ) then
    raise exception 'Plano de checkout inválido.';
  end if;

  select
    participant.id,
    event.id,
    event.placement
  into
    v_participant_id,
    v_click_event_id,
    v_placement
  from public.conversion_campaign_events as event
  inner join public.conversion_campaign_participants as participant
    on participant.id = event.participant_id
  inner join public.conversion_campaigns as campaign
    on campaign.id = participant.campaign_id
  where participant.user_id = v_user_id
    and participant.campaign_id = 'post_free_correction'
    and event.event_type = 'click'
    and event.created_at >= now() - make_interval(days => campaign.attribution_window_days)
    and campaign.is_active
  order by event.created_at desc, event.id desc
  limit 1;

  if v_participant_id is null then
    return null;
  end if;

  insert into public.conversion_campaign_events (
    participant_id,
    event_type,
    placement,
    metadata
  )
  values (
    v_participant_id,
    'checkout_started',
    v_placement,
    jsonb_build_object(
      'plan_id', p_plan_id,
      'source_click_event_id', v_click_event_id
    )
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.record_post_free_correction_checkout_started(uuid)
from public, anon;

grant execute on function public.record_post_free_correction_checkout_started(uuid)
to authenticated;

create function public.attribute_post_free_correction_conversion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_id uuid;
  v_campaign_id text;
  v_source_event_id uuid;
  v_attribution_type text;
  v_window_days integer;
begin
  if new.kind <> 'subscription'
    or new.paid_at is null
    or new.metadata ->> 'checkout_operation' <> 'new_subscription'
  then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.paid_at is not null then
      return new;
    end if;
  end if;

  select
    participant.id,
    participant.campaign_id,
    event.id,
    'last_click',
    campaign.attribution_window_days
  into
    v_participant_id,
    v_campaign_id,
    v_source_event_id,
    v_attribution_type,
    v_window_days
  from public.conversion_campaign_events as event
  inner join public.conversion_campaign_participants as participant
    on participant.id = event.participant_id
  inner join public.conversion_campaigns as campaign
    on campaign.id = participant.campaign_id
  where participant.user_id = new.user_id
    and participant.campaign_id = 'post_free_correction'
    and campaign.is_active
    and event.event_type = 'click'
    and event.created_at <= new.paid_at
    and event.created_at >= new.paid_at - make_interval(days => campaign.attribution_window_days)
  order by event.created_at desc, event.id desc
  limit 1;

  if v_source_event_id is null then
    select
      participant.id,
      participant.campaign_id,
      event.id,
      'view_through',
      campaign.attribution_window_days
    into
      v_participant_id,
      v_campaign_id,
      v_source_event_id,
      v_attribution_type,
      v_window_days
    from public.conversion_campaign_events as event
    inner join public.conversion_campaign_participants as participant
      on participant.id = event.participant_id
    inner join public.conversion_campaigns as campaign
      on campaign.id = participant.campaign_id
    where participant.user_id = new.user_id
      and participant.campaign_id = 'post_free_correction'
      and campaign.is_active
      and event.event_type = 'impression'
      and event.created_at <= new.paid_at
      and event.created_at >= new.paid_at - make_interval(days => campaign.attribution_window_days)
    order by event.created_at desc, event.id desc
    limit 1;
  end if;

  if v_source_event_id is null then
    return new;
  end if;

  insert into public.conversion_campaign_conversions (
    campaign_id,
    participant_id,
    payment_id,
    source_event_id,
    attribution_type,
    attribution_window_days,
    revenue_cents,
    converted_at
  )
  values (
    v_campaign_id,
    v_participant_id,
    new.id,
    v_source_event_id,
    v_attribution_type,
    v_window_days,
    new.amount,
    new.paid_at
  )
  on conflict (payment_id) do nothing;

  return new;
exception
  when others then
    raise warning 'Falha ao atribuir conversão da campanha ao pagamento %: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger attribute_post_free_correction_conversion
after insert or update of paid_at on public.student_payments
for each row
execute function public.attribute_post_free_correction_conversion();

create function public.get_post_free_correction_campaign_metrics(
  p_from timestamptz default (now() - interval '30 days'),
  p_to timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_from is null or p_to is null or p_from >= p_to then
    raise exception 'Período inválido.';
  end if;

  with campaign_participants as (
    select participant.*
    from public.conversion_campaign_participants as participant
    where participant.campaign_id = 'post_free_correction'
  ), eligible_participants as (
    select participant.*
    from campaign_participants as participant
    where participant.eligible_at >= p_from
      and participant.eligible_at < p_to
  ), events as (
    select event.*
    from public.conversion_campaign_events as event
    inner join campaign_participants as participant on participant.id = event.participant_id
    where event.created_at >= p_from
      and event.created_at < p_to
  ), conversions as (
    select conversion.*
    from public.conversion_campaign_conversions as conversion
    inner join campaign_participants as participant on participant.id = conversion.participant_id
    where conversion.converted_at >= p_from
      and conversion.converted_at < p_to
  ), placements as (
    select unnest(array['score_card', 'footer_banner']) as placement
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'totals', jsonb_build_object(
      'eligible', (select count(*) from eligible_participants),
      'exposed', (
        select count(distinct participant_id)
        from events
        where event_type = 'impression'
      ),
      'clickers', (
        select count(distinct participant_id)
        from events
        where event_type = 'click'
      ),
      'dismissals', (
        select count(distinct participant_id)
        from events
        where event_type = 'dismiss'
      ),
      'checkout_starters', (
        select count(distinct participant_id)
        from events
        where event_type = 'checkout_started'
      ),
      'conversions', (select count(*) from conversions),
      'click_conversions', (
        select count(*)
        from conversions
        where attribution_type = 'last_click'
      ),
      'revenue_cents', (
        select coalesce(sum(revenue_cents), 0)
        from conversions
      ),
      'click_revenue_cents', (
        select coalesce(sum(revenue_cents), 0)
        from conversions
        where attribution_type = 'last_click'
      )
    ),
    'placements', (
      select coalesce(
        jsonb_object_agg(
          placement.placement,
          jsonb_build_object(
            'impressions', (
              select count(distinct event.participant_id)
              from events as event
              where event.event_type = 'impression'
                and event.placement = placement.placement
            ),
            'clickers', (
              select count(distinct event.participant_id)
              from events as event
              where event.event_type = 'click'
                and event.placement = placement.placement
            ),
            'dismissals', (
              select count(distinct event.participant_id)
              from events as event
              where event.event_type = 'dismiss'
                and event.placement = placement.placement
            ),
            'checkout_starters', (
              select count(distinct event.participant_id)
              from events as event
              where event.event_type = 'checkout_started'
                and event.placement = placement.placement
            ),
            'click_conversions', (
              select count(*)
              from conversions as conversion
              inner join events as event on event.id = conversion.source_event_id
              where conversion.attribution_type = 'last_click'
                and event.placement = placement.placement
            ),
            'click_revenue_cents', (
              select coalesce(sum(conversion.revenue_cents), 0)
              from conversions as conversion
              inner join events as event on event.id = conversion.source_event_id
              where conversion.attribution_type = 'last_click'
                and event.placement = placement.placement
            )
          )
        ),
        '{}'::jsonb
      )
      from placements as placement
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_post_free_correction_campaign_metrics(timestamptz, timestamptz)
from public, anon;

grant execute on function public.get_post_free_correction_campaign_metrics(timestamptz, timestamptz)
to authenticated;

commit;

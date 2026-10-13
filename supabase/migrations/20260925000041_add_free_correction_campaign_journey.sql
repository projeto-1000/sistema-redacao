begin;

create or replace function public.get_post_free_correction_campaign_audience(
  p_from timestamptz default (now() - interval '30 days'),
  p_to timestamptz default now(),
  p_limit integer default 20,
  p_offset integer default 0
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

  if p_limit < 1 or p_limit > 500 or p_offset < 0 then
    raise exception 'Paginação inválida.';
  end if;

  with filtered_participants as (
    select participant.*
    from public.conversion_campaign_participants as participant
    where participant.campaign_id = 'post_free_correction'
      and participant.eligible_at >= p_from
      and participant.eligible_at < p_to
  ), paged_participants as (
    select participant.*
    from filtered_participants as participant
    order by participant.eligible_at desc, participant.id desc
    limit p_limit
    offset p_offset
  ), audience as (
    select
      participant.id as participant_id,
      participant.user_id,
      participant.essay_id,
      participant.eligible_at,
      profile.full_name,
      profile.email,
      profile.phone,
      activity.first_impression_at,
      activity.first_click_at,
      activity.checkout_started_at,
      activity.last_event_at,
      activity.last_click_placement,
      case
        when conversion.converted_at is not null then 'converted'
        when activity.checkout_started_at is not null then 'checkout_started'
        when activity.first_click_at is not null then 'clicked'
        when activity.first_impression_at is not null then 'exposed'
        else 'eligible'
      end as stage,
      conversion.converted_at,
      conversion.attribution_type,
      conversion.attributed_placement,
      coalesce(conversion.revenue_cents, 0) as revenue_cents
    from paged_participants as participant
    inner join public.profiles as profile on profile.id = participant.user_id
    left join lateral (
      select
        min(event.created_at) filter (where event.event_type = 'impression')
          as first_impression_at,
        min(event.created_at) filter (where event.event_type = 'click')
          as first_click_at,
        min(event.created_at) filter (where event.event_type = 'checkout_started')
          as checkout_started_at,
        max(event.created_at) as last_event_at,
        (
          select click_event.placement
          from public.conversion_campaign_events as click_event
          where click_event.participant_id = participant.id
            and click_event.event_type = 'click'
          order by click_event.created_at desc, click_event.id desc
          limit 1
        ) as last_click_placement
      from public.conversion_campaign_events as event
      where event.participant_id = participant.id
    ) as activity on true
    left join lateral (
      select
        latest_conversion.converted_at,
        latest_conversion.attribution_type,
        source_event.placement as attributed_placement,
        totals.revenue_cents
      from (
        select conversion.*
        from public.conversion_campaign_conversions as conversion
        where conversion.participant_id = participant.id
        order by conversion.converted_at desc, conversion.id desc
        limit 1
      ) as latest_conversion
      left join public.conversion_campaign_events as source_event
        on source_event.id = latest_conversion.source_event_id
      cross join lateral (
        select coalesce(sum(conversion.revenue_cents), 0) as revenue_cents
        from public.conversion_campaign_conversions as conversion
        where conversion.participant_id = participant.id
      ) as totals
    ) as conversion on true
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered_participants),
    'students', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'participant_id', audience.participant_id,
            'user_id', audience.user_id,
            'essay_id', audience.essay_id,
            'full_name', audience.full_name,
            'email', audience.email,
            'phone', audience.phone,
            'eligible_at', audience.eligible_at,
            'first_impression_at', audience.first_impression_at,
            'first_click_at', audience.first_click_at,
            'checkout_started_at', audience.checkout_started_at,
            'last_event_at', audience.last_event_at,
            'last_click_placement', audience.last_click_placement,
            'stage', audience.stage,
            'converted_at', audience.converted_at,
            'attribution_type', audience.attribution_type,
            'attributed_placement', audience.attributed_placement,
            'revenue_cents', audience.revenue_cents
          )
          order by audience.eligible_at desc, audience.participant_id desc
        )
        from audience
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

create function public.get_post_free_correction_campaign_events(
  p_from timestamptz default (now() - interval '30 days'),
  p_to timestamptz default now(),
  p_limit integer default 500,
  p_offset integer default 0
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

  if p_limit < 1 or p_limit > 500 or p_offset < 0 then
    raise exception 'Paginação inválida.';
  end if;

  with filtered_participants as (
    select participant.*
    from public.conversion_campaign_participants as participant
    where participant.campaign_id = 'post_free_correction'
      and participant.eligible_at >= p_from
      and participant.eligible_at < p_to
  ), timeline_events as (
    select
      'eligibility:' || participant.id::text as event_id,
      participant.id as participant_id,
      participant.user_id,
      participant.essay_id,
      profile.full_name,
      profile.email,
      'eligible'::text as event_type,
      null::text as placement,
      participant.eligible_at as occurred_at,
      '{}'::jsonb as metadata
    from filtered_participants as participant
    inner join public.profiles as profile on profile.id = participant.user_id

    union all

    select
      event.id::text as event_id,
      participant.id as participant_id,
      participant.user_id,
      participant.essay_id,
      profile.full_name,
      profile.email,
      event.event_type,
      event.placement,
      event.created_at as occurred_at,
      event.metadata
    from filtered_participants as participant
    inner join public.profiles as profile on profile.id = participant.user_id
    inner join public.conversion_campaign_events as event
      on event.participant_id = participant.id

    union all

    select
      'conversion:' || conversion.id::text as event_id,
      participant.id as participant_id,
      participant.user_id,
      participant.essay_id,
      profile.full_name,
      profile.email,
      'converted'::text as event_type,
      source_event.placement,
      conversion.converted_at as occurred_at,
      jsonb_build_object(
        'attribution_type', conversion.attribution_type,
        'revenue_cents', conversion.revenue_cents
      ) as metadata
    from filtered_participants as participant
    inner join public.profiles as profile on profile.id = participant.user_id
    inner join public.conversion_campaign_conversions as conversion
      on conversion.participant_id = participant.id
    left join public.conversion_campaign_events as source_event
      on source_event.id = conversion.source_event_id
  ), paged_events as (
    select event.*
    from timeline_events as event
    order by event.occurred_at desc, event.event_id desc
    limit p_limit
    offset p_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from timeline_events),
    'events', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'event_id', event.event_id,
            'participant_id', event.participant_id,
            'user_id', event.user_id,
            'essay_id', event.essay_id,
            'full_name', event.full_name,
            'email', event.email,
            'event_type', event.event_type,
            'placement', event.placement,
            'occurred_at', event.occurred_at,
            'metadata', event.metadata
          )
          order by event.occurred_at desc, event.event_id desc
        )
        from paged_events as event
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_post_free_correction_campaign_events(
  timestamptz,
  timestamptz,
  integer,
  integer
)
from public, anon;

grant execute on function public.get_post_free_correction_campaign_events(
  timestamptz,
  timestamptz,
  integer,
  integer
)
to authenticated;

commit;

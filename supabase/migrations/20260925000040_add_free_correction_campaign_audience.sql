begin;

create function public.get_post_free_correction_campaign_audience(
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
      activity.last_event_at,
      case
        when conversion.converted_at is not null then 'converted'
        when activity.has_checkout then 'checkout_started'
        when activity.has_click then 'clicked'
        when activity.has_impression then 'exposed'
        else 'eligible'
      end as stage,
      conversion.converted_at,
      coalesce(conversion.revenue_cents, 0) as revenue_cents
    from paged_participants as participant
    inner join public.profiles as profile on profile.id = participant.user_id
    left join lateral (
      select
        max(event.created_at) as last_event_at,
        coalesce(bool_or(event.event_type = 'impression'), false) as has_impression,
        coalesce(bool_or(event.event_type = 'click'), false) as has_click,
        coalesce(bool_or(event.event_type = 'checkout_started'), false) as has_checkout
      from public.conversion_campaign_events as event
      where event.participant_id = participant.id
    ) as activity on true
    left join lateral (
      select
        max(conversion.converted_at) as converted_at,
        coalesce(sum(conversion.revenue_cents), 0) as revenue_cents
      from public.conversion_campaign_conversions as conversion
      where conversion.participant_id = participant.id
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
            'last_event_at', audience.last_event_at,
            'stage', audience.stage,
            'converted_at', audience.converted_at,
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

revoke all on function public.get_post_free_correction_campaign_audience(
  timestamptz,
  timestamptz,
  integer,
  integer
)
from public, anon;

grant execute on function public.get_post_free_correction_campaign_audience(
  timestamptz,
  timestamptz,
  integer,
  integer
)
to authenticated;

commit;

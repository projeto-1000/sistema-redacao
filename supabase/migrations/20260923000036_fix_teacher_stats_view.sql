create or replace view public.teacher_stats_view
with (security_invoker = 'on')
as
select
  profile.id,
  profile.full_name,
  profile.email,
  profile.status,
  profile.avatar_url,
  count(essay.id)::integer as total,
  count(essay.id) filter (
    where date_trunc(
      'month',
      essay.correction_date at time zone 'America/Sao_Paulo'
    ) = date_trunc(
      'month',
      now() at time zone 'America/Sao_Paulo'
    )
  )::integer as "currentMonth"
from public.profiles as profile
left join public.essays as essay
  on profile.id = essay.teacher_id
  and essay.status = 'corrected'
where profile.role = 'TEACHER'::public.app_role
group by
  profile.id,
  profile.full_name,
  profile.email,
  profile.status,
  profile.avatar_url;

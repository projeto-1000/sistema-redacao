begin;

create function public.claim_signup_attempt(
    p_attempt_id uuid,
    p_processing_at timestamptz,
    p_lock_cutoff timestamptz
)
returns setof public.signup_attempts
language sql
strict
security definer
set search_path = ''
as $$
    update public.signup_attempts
    set
        processing_at = p_processing_at,
        last_error_code = null,
        last_error_at = null
    where id = p_attempt_id
      and completed_at is null
      and (
          processing_at is null
          or processing_at <= p_lock_cutoff
      )
    returning *;
$$;

revoke all on function public.claim_signup_attempt(uuid, timestamptz, timestamptz)
from public, anon, authenticated;

grant execute on function public.claim_signup_attempt(uuid, timestamptz, timestamptz)
to service_role;

commit;

begin;

-- DEV and PROD have different default privileges for newly created tables.
-- Declare this table's access explicitly so both environments enforce the
-- same contract: only authenticated administrators can read campaigns.
revoke all privileges on table public.conversion_campaigns
from public, anon, authenticated;

grant select on table public.conversion_campaigns
to authenticated;

grant all privileges on table public.conversion_campaigns
to service_role;

drop policy if exists "Authenticated users read active conversion campaigns"
on public.conversion_campaigns;

create policy "Admins read conversion campaigns"
on public.conversion_campaigns for select
to authenticated
using (public.is_admin());

commit;

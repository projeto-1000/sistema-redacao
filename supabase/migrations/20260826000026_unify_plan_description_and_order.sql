begin;

-- Preserve legacy catalog content without overwriting descriptions already managed
-- by the admin. Empty feature entries are ignored and line order is retained.
with legacy_plan_descriptions as (
  select
    plan.id,
    string_agg(btrim(feature.value), E'\n' order by feature.position) as description
  from public.plans as plan
  cross join lateral unnest(plan.features) with ordinality as feature(value, position)
  where nullif(btrim(plan.description), '') is null
    and nullif(btrim(feature.value), '') is not null
  group by plan.id
)
update public.plans as plan
set
  description = legacy.description,
  updated_at = now()
from legacy_plan_descriptions as legacy
where plan.id = legacy.id;

drop index if exists public.plans_public_catalog_idx;

create index plans_public_catalog_idx
  on public.plans (interval, interval_count, price)
  where is_active = true
    and is_public = true
    and price > 0;

comment on column public.plans.features is
  'Legacy catalog content. Runtime plan presentation uses description.';

comment on column public.plans.sort_order is
  'Legacy display order. Runtime catalogs order plans by price.';

commit;

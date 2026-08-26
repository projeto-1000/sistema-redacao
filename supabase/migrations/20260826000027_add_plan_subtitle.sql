begin;

alter table public.plans
  add column if not exists subtitle text;

comment on column public.plans.subtitle is
  'Short catalog positioning text displayed directly below the plan name.';

commit;

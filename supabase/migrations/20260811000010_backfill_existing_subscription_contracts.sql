begin;

select pg_catalog.set_config(
    'request.jwt.claims',
    '{"role":"service_role"}',
    true
);

select public.backfill_subscription_contracts(true);
select public.backfill_free_trial_subscription_contracts(true);

commit;

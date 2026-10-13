-- Local database only, after migration 20261006000004. No customer data mutations.
do $$ begin
  assert public.subscription_access_end('2026-10-24T23:59:59Z') = '2026-10-25T02:59:59.999Z'::timestamptz;
  assert public.subscription_access_end('2026-10-25T01:00:00Z') = '2026-10-25T02:59:59.999Z'::timestamptz;
  assert public.subscription_access_end('2026-10-25T02:59:59.999Z') = '2026-10-25T02:59:59.999Z'::timestamptz;
end $$;

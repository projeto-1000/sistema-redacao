begin;

-- Recover only provable zero-usage legacy withdrawals. Do not infer usage
-- from today's balance or from credits held/released during cancellation.
-- Payment contract + local subscription identifies the original grant even
-- when older checkout entries lack provider_subscription_id.
with verified as (
  select h.id, g.credits, g.evidence
  from public.subscription_cancellation_history h
  join public.student_payments p
    on p.id::text = h.snapshot ->> 'payment_id'
    and p.user_id = h.student_id
    and p.subscription_id = h.subscription_id
    and p.kind = 'subscription'
    and p.paid_at <= h.requested_at
    and (p.external_id = h.provider_subscription_id
      or p.metadata ->> 'pagarme_subscription_id' = h.provider_subscription_id)
  cross join lateral (
    select sum(t.amount)::integer as credits,
      jsonb_agg(t.id order by t.created_at, t.id) as evidence,
      count(*) as grant_count
    from public.credit_transactions t
    where t.user_id = h.student_id
      and t.created_at >= p.paid_at
      and t.created_at <= h.requested_at
      and t.type::text = 'new_subscription'
      and t.amount > 0
      and coalesce(t.metadata ->> 'credit_type', 'plan') = 'plan'
      and t.metadata ->> 'subscription_id' = h.subscription_id::text
      and nullif(p.metadata ->> 'contract_id', '') is not null
      and t.metadata ->> 'contract_id' = p.metadata ->> 'contract_id'
  ) g
  where h.kind = 'withdrawal'
    and h.snapshot ->> 'historical_reconstruction' = 'true'
    and h.snapshot ->> 'credits_granted' is null
    and h.snapshot ->> 'credits_used' is null
    and g.grant_count = 1
    and g.credits > 0
    -- Legacy usage can lack any subscription reference. Conservatively veto
    -- every plan usage in the time window, not only explicitly linked usage.
    and not exists (
      select 1 from public.credit_transactions t
      where t.user_id = h.student_id
        and t.created_at >= p.paid_at
        and t.created_at <= h.requested_at
        and coalesce(t.metadata ->> 'credit_type', 'plan') = 'plan'
        and t.type::text = 'essay_usage' and t.amount < 0
    )
    -- A competing grant in this window makes the attribution ambiguous.
    and not exists (
      select 1 from public.credit_transactions t
      where t.user_id = h.student_id
        and t.created_at >= p.paid_at
        and t.created_at <= h.requested_at
        and coalesce(t.metadata ->> 'credit_type', 'plan') = 'plan'
        and t.type::text in ('new_subscription', 'subscription_reactivation', 'plan_change', 'plan_renewal')
        and t.amount > 0
        and (t.metadata ->> 'contract_id' is distinct from p.metadata ->> 'contract_id'
          or t.metadata ->> 'subscription_id' is distinct from h.subscription_id::text)
    )
)
update public.subscription_cancellation_history h
set snapshot = h.snapshot || jsonb_build_object(
  'credits_granted', v.credits,
  'credits_used', 0,
  'credit_recovery', jsonb_build_object(
    'migration', '20261006000002',
    'method', 'payment_contract_grant_and_no_plan_usage',
    'grant_transaction_ids', v.evidence,
    'previous_credits_granted', h.snapshot -> 'credits_granted',
    'previous_credits_used', h.snapshot -> 'credits_used',
    'recovered_at', transaction_timestamp()
  )
)
from verified v where h.id = v.id;

-- Keep original request/activity/refund dates, events, outcomes and balances.
commit;

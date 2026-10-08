# Completed cancellation history and courtesy expiry

Apply `20261008000001` through a reviewed database rollout, after the existing support migrations. This task does not apply remote migrations.

The migration replaces only `record_ordinary_cancellation_history`. It preserves completed refunds on re-subscription, and records courtesy access closure without replacing the refund outcome. Only an active, still-scheduled cancellation without a completed refund can become `undone`. Authorization, provider calls, balances and refund RPCs are unchanged.

## Local regression

Run `completed-cancellation-history.sql` as postgres in an isolated local database with all migrations applied. It uses invented fixtures and the real scheduled-cancellation routine, then rolls back. Never run this fixture against DEV or production: the routine accepts a reference date and processes all due subscriptions in that database.

Checks: just before expiry, after expiry, remaining plan-credit removal, preservation of extra/free credits, completed refund status, one access-closure event, repeated execution, re-subscription and ordinary undo with a new provider ID. No provider requests or clock changes occur.

## Sandbox end-to-end

For the existing courtesy ending on 09/10/2026 in Brasília, verify that benefits are unavailable from 10/10/2026 00:00. The repository schedules finalization daily at 09:30 UTC (06:30 Brasília), not at midnight. After that job runs, verify: canceled plan, zero remaining plan credits, one expiration entry, unchanged other credit balances, refund still confirmed and no new charge. Verify the actual deployed job separately; SQL tests alone do not prove scheduler delivery. Local development does not run Vercel's scheduler automatically. Access checks must reject expired benefits even before the finalization job.

## Existing records and rollback

No historical rows are rewritten by this migration. A previously misclassified `undone` record needs a separately reviewed data repair verified against the completed operation and provider refund; never replay that payment. Preserve its audit trail.

Rollback: restore only the function definition from `20261006000003` with `create or replace function`, not the entire migration. No schema removal or financial reversal is needed. This reintroduces the old bug, so prefer a forward correction.

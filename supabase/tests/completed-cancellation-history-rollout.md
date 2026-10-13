# Completed cancellation history and courtesy expiry

Apply `20261008000001` and `20261008000002` in order through the DEV migration workflow, after the existing support migrations. This task does not apply remote migrations.

The migration replaces only `record_ordinary_cancellation_history`. It preserves completed refunds on re-subscription, and records courtesy access closure without replacing the refund outcome. Only an active, still-scheduled cancellation without a completed refund can become `undone`. Authorization, provider calls, balances and refund RPCs are unchanged.

## Local regression

Run `completed-cancellation-history.sql` as postgres in an isolated local database with all migrations applied. It uses invented fixtures and the real scheduled-cancellation routine, then rolls back. Never run this fixture against DEV or production: the routine accepts a reference date and processes all due subscriptions in that database.

To run without local Docker/PostgreSQL, push the branch. The `Cancellation Expiry SQL Test (isolated)` GitHub Action runs on pushes to this feature branch that change its workflow, migrations or this test. It starts its own local PostgreSQL 17 Supabase on the runner, applies the branch migrations, and executes this SQL file. The test runner temporarily overrides `db.major_version` because the initial schema contains `transaction_timeout`, and disables the unrelated seed because the regression has its own fixtures. It does not use DEV or production database credentials and does not change the repository config. This is separate from `Supabase DEV Migration`. GitHub permits manual `workflow_dispatch` only after the workflow file exists on the default branch.

Checks: just before expiry, after expiry, remaining plan-credit removal, preservation of extra/free credits, completed refund status, one access-closure event, repeated execution, re-subscription and ordinary undo with a new provider ID. No provider requests or clock changes occur.

## Sandbox end-to-end

For the existing courtesy ending on 09/10/2026 in Brasília, verify that benefits are unavailable from 10/10/2026 00:00. The repository schedules finalization daily at 09:30 UTC (06:30 Brasília), not at midnight. After that job runs, verify: canceled plan, zero remaining plan credits, one expiration entry, unchanged other credit balances, refund still confirmed and no new charge. Verify the actual deployed job separately; SQL tests alone do not prove scheduler delivery. Local development does not run Vercel's scheduler automatically. Access checks must reject expired benefits even before the finalization job.

## Existing records and rollback

The second migration repairs only support history rows marked `undone` whose linked support operation is completed, whose refund is confirmed and whose history contains a refund completion timestamp. It restores `refunded`, keeps the original event array in `snapshot.history_repair` for audit, and removes the false undo event from the displayed timeline. It is idempotent and does not change subscriptions, credits or payments. After applying on DEV, verify the affected student's old request shows `refunded` and the associated Pagar.me charge remains refunded. Do not replay the payment.

Rollback of the function: restore only its definition from `20261006000003` with `create or replace function`, not the entire migration. This reintroduces the old bug, so prefer a forward correction. Do not roll a verified refund history back to the false `undone` state; the original value and events remain in its repair snapshot for investigation.

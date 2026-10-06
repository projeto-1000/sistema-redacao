# Cancellation history rollout

Migration: `20261006000001_cancellation_history_and_automatic_withdrawals.sql`.

## Scope and order

- Apply only in an isolated development database first. This change has not been applied remotely by the implementation task.
- Run `subscription_withdrawal_policy.sql` in that database after all migrations. It rolls its fixtures back.
- Deploy Admin and Students together after the migration. The new Students action checks policy version 2 before creating a withdrawal, so an older DB cannot silently create a manual-review request.
- Confirm a first and repeated eligible request both start full refunds in the payment sandbox, and outside-window cancellation still preserves access until the end of the paid period.
- Confirm ordinary cancellation / undo / cancellation again retains separate history records, and duplicate webhook delivery does not append a duplicate confirmation.
- The Admin screen is read-only. It no longer performs reconciliation or retries. Payment confirmation continues through the existing authenticated webhook path. Operational failures must be handled through a separately authorized maintenance workflow, not hidden approval buttons.

## Legacy records

- Existing refunded/rejected/manual records are not rewritten as automatic outcomes.
- Existing `under_review` requests are displayed as legacy pending analysis. Inventory these before rollout. Resolving them requires a separately authorized sandbox/maintenance operation; a schema migration must never pretend a refund happened or invoke a payment provider.
- Recoverable historical payments are linked; unavailable historic usage/grants remain null. Current names/plans recovered for older records are explicitly marked as reconstructed, not exact past snapshots.
- Previously overwritten ordinary cancellations cannot be reconstructed reliably from the current subscription row. The new table prevents this loss going forward.

## Rollback (preserve data)

1. Pause cancellation requests in the isolated environment and stop deploying the new app versions.
2. Restore the prior `request_subscription_withdrawal`, `approve_subscription_withdrawal`, and `reject_subscription_withdrawal` function definitions from `20260928000042_add_subscription_withdrawal_policy.sql` in a reviewed corrective migration. Do not revert executed financial operations.
3. Drop the two new recording triggers (`record_withdrawal_history` and `record_ordinary_cancellation_history`) and the policy-version function in that corrective migration if reverting capture behavior.
4. Restore the prior app versions. Keep `subscription_cancellation_history` and its restricted permissions intact; never drop it or erase snapshots as rollback cleanup.
5. Review any eligible requests already processed under the automatic policy. A refund cannot be reversed by restoring code.

## Security

- Only ADMIN-authenticated sessions can select this history under RLS; there is no anonymous or student read policy for this administrative dataset.
- Recording functions are server-side trigger functions with an empty search path and revoked direct execution from public/anon/authenticated.
- Original ownership, 168-hour validation, subscription/credit locks, and payment idempotency remain in place.
- Retired approval/rejection RPCs raise errors, including for old service-role callers.
- No credentials, production configuration, external charges or refunds are changed by this migration.

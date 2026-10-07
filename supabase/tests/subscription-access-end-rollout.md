# End-of-day cancellation access

Migration `20261006000004` depends on `20261006000003`. Apply only through the approved database rollout; do not run against a remote database from this task.

- Access ends at 23:59:59 Brasília on the existing final local calendar day for ordinary cancellation and support `cancel_only`.
- Courtesy may end at 23:59:59 Brasília on that same last day. Existing-credit limits remain unchanged.
- `cancel_refund` still holds plan credits at preparation and ends benefits only on confirmed refund. `refund_only` leaves the cycle unchanged.
- Provider timestamps and next billing are not extended. `original_period_end` is recorded in cancellation metadata; undoing ordinary cancellation restores it before the next cycle.
- No historical records are updated automatically. Previously scheduled cancellations retain their recorded deadlines pending an explicitly approved backfill.

## Validation in isolated DEV

Run `subscription-access-end.sql` locally after migrations. With sandbox fixtures, exercise cancellation at a UTC 23:59 period boundary, courtesy on the final paid day, undo/re-cancel, duplicate verification/webhooks and both refund modes. Check persisted end dates, balances, history and the unchanged billing date.

## Rollback

Roll back the application changes together with restoring the definition of `prepare_subscription_support_operation` from `20261006000003` using `create or replace function` (do not rerun that entire migration). Remove `subscription_access_end` only after its callers are rolled back. Do not automatically shorten access already promised to students. If a data correction is required, review each affected operation and its recorded `original_period_end` separately; financial operations must never be replayed.

# Subscription support rollout

## Scope and deployment order

Local migration `20261006000003_subscription_support_operations.sql` is additive:
an ADMIN-readable audit/reservation table, authenticated ADMIN-only preparation
and preview RPCs, and a service-role-only confirmation RPC. No remote migration
was executed. Apply and test in isolated DEV before enabling the UI. Deploy the
Students webhook consumer as well as Admin. Existing withdrawal logic stays in
place; a missing support table does not break the withdrawal webhook.

The authenticated preparation RPC locks the current subscription/payment/balance,
captures an immutable snapshot, and uses the existing credit ledger trigger.
Courtesy is limited to existing plan credits and the paid period. Only the current
cycle's attributable subscription payment is supported; unrelated, historical,
upgrade, extra-credit and ambiguous charges are rejected. Refunds require a credit
card; boleto refunds require a different banking workflow. Full legal withdrawal
remains the existing automatic student workflow, not support approval.

## Failure and concurrency policy

- Stable operation UUID, unique unfinished student/charge reservations, a one-time
  dispatch claim and provider keys prevent competing clicks from sending twice.
- Uncertain results remain reserved. Verify only reads provider data and records
  cumulative refund confirmation; it does not resend cancellation/refund.
- A canceled charge alone is not refund evidence. Partial refunds require a
  cumulative confirmed amount covering previous refunds plus this request.
- Failed dispatch is not automatically retried. Investigate the provider before
  manually repairing audit state or authorizing a new financial request.
- The verified/authenticated webhook path handles support separately from legal
  withdrawals, so refund-only never cancels access or renewal.
- Cancel-and-refund and courtesy reserve the credits not retained. Scheduled
  future credit allocations are marked skipped, with their original state in
  metadata. Later essay refunds belonging to that contract do not recreate
  refunded or non-retained credits. Ambiguous legacy credit attribution blocks
  these actions before any mutation. Other credit
  sources are untouched. Support actions are visible to the student in the same
  history mapper used by Admin.

## Required isolated DEV tests before release

1. ADMIN vs STUDENT/anonymous: preparation/preview denied for non-admins; direct
   table writes and confirmation RPC denied to authenticated users.
2. Cancel-only: provider renewal stopped, no refund; access/credits through paid end.
3. Cancel/refund integral and partial: one financial request, correct amount,
   remaining credits blocked, final access ended only after recorded confirmation.
4. Courtesy: quantity 0 / remaining max, shorter date / paid-end date; no new grants;
   excessive quantity/date rejected without effects; eventual access expiry.
5. Refund-only full/partial: provider subscription unchanged; access, renewal and
   every credit balance unchanged; later partial cannot exceed remaining value.
6. Double clicks, multiple tabs and duplicated/out-of-order webhooks: one dispatch,
   one audit completion, no duplicated holds/credits/refunds.
7. Failure before/after provider mutation and before local confirmation: reservation
   retained, verifying does not resend, later verified webhook finishes safely.
8. Concurrent student withdrawal, checkout/reactivation and essay return: no overlap
   replacing the contract; no resurrection of refunded plan credits.
9. Histories: actor/reason/payment/value/dates/credits present; legacy rejection
   details still match student view; historyPage independent from essay page.

## Rollback

Before any real support operation, revert the application changes and remove the
new triggers/RPCs/table in a separately reviewed local rollback migration. Restore
the original history kind constraint only if no `kind = 'support'` rows exist.
Restore `record_ordinary_cancellation_history` from migration `20261006000001`
before removing the support table (the extended recorder references it).

After any operation has been dispatched, **do not drop or delete audit data**.
Disable new starts by revoking authenticated execution on
`prepare_subscription_support_operation(uuid,uuid,uuid,text,integer,text,text,integer,integer,timestamptz)`
and hide the Admin action. Keep confirmation RPC, webhook consumer, reservations,
and audit records until every financial outcome is reconciled. Prefer a forward
repair migration; never silently restore held credits after a timeout. Rollback of
application code does not reverse a Pagar.me cancellation or refund.

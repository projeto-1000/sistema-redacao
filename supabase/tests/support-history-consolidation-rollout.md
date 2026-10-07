# Consolidated support history

Migration: `20261007000001_consolidate_support_history.sql`.

- Read-only projection change: audit transactions and balances are not rewritten.
- Existing admin/student authorization and RPC return contract are preserved.
- Group only administrative support events with a nonempty operation ID.
- Prefer completion over initiation, even when timestamps tie.
- Group before date/type filters, counting and pagination, so an initiation cannot
  reappear on another page or a date range that excludes its completion.
- Both Admin and Students consume the same RPC and shared history row.

## Local validation

Run `support-history-consolidation.sql` on local PostgreSQL. Then validate the RPC
with fixtures for pending/completed support operations, unrelated payments and
credit movements, pagination with limit 1, same-timestamp initiation/completion,
and date/type filters. Verify a student cannot read another student's history.

## DEV smoke after migration is applied by the operator

For the existing sandbox partial refund, expect one R$ 5.00 completed attendance,
with request and completion dates in its details. The initiation remains in audit
data but is not another visible row. Compare Admin and Students, and verify a
pending attendance stays visible until confirmation. Do not submit another refund.

## Rollback

Restore only `get_subscription_history_events` from
`20260805000001_initial_schema.sql` using `CREATE OR REPLACE FUNCTION`. No data
rollback is needed. The optional shared display fields are backward compatible.

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

To create [API routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) add an `api/` directory to the `app/` directory with a `route.ts` file. For individual endpoints, create a subfolder in the `api` directory, like `api/hello/route.ts` would map to [http://localhost:3001/api/hello](http://localhost:3001/api/hello).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn/foundations/about-nextjs) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_source=github.com&utm_medium=referral&utm_campaign=turborepo-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Meta registration tracking

Validation status (2026-10-22): migration `20261022000001` was applied to DEV
through the CLI after an exclusive dry-run plan. SQL regressions passed in a
rolled-back rehearsal and again after application; no fixture rows remained.
Website/Students changes are still local. No requests to Meta were sent.

Pixel ID: `1498795297218230`. The Website and Students layouts use the same
shared constant. `CompleteRegistration` is recorded only on insertion of a new
STUDENT profile, in the same database transaction as account creation. The
outbox retains attribution per user, snapshots normalized SHA-256 email/phone,
and excludes teacher invitations and existing accounts. No historical backfill.

Apply `20261022000001_meta_registration_events.sql` before deploying the new
Website/Students code. Creating the migration does not apply it to DEV or PROD.
Validate it in an isolated PostgreSQL/Supabase instance with
`supabase/tests/meta-registration-events.sql` first. This transaction rolls back
all fixtures and never calls Meta or the CRM.

Server-only configuration on Students (never use `NEXT_PUBLIC_` for these):

- `META_CONVERSIONS_ENABLED=true` explicitly enables delivery; otherwise the queue
  stays pending and no CAPI requests are sent.
- `META_CONVERSIONS_ACCESS_TOKEN`: configure securely in the deployment environment.
  Do not paste credentials into source, chat, URLs or logs.
- `META_CONVERSIONS_TEST_EVENT_CODE`: Meta Test Events code. Required for local/preview
  delivery. Remove it for normal production delivery after joint validation.
- Existing `CRON_SECRET`: protects `GET /api/meta/registrations`.

The existing Vercel cron configuration retries every 15 minutes. New signups also
request delivery after the response. The service-only claim RPC leases rows with
`SKIP LOCKED`; rejected or unacknowledged deliveries retry with the original
`event_id` and time. Retries stop when the event reaches Meta's seven-day age
limit. Inspect old pending rows before enabling an environment; do not represent
old accounts as new registrations. Responses and failures log only fixed error
codes, never tokens or customer payloads.

Browser attribution is retained for up to 90 days. The Website posts only approved
marketing fields with the registration details, and Students stores them on the
signup attempt before the subdomain transition. Query tokens/fragments are
removed from source URLs. `fbclid` is preserved and used to construct `fbc` only
when an actual click ID exists; `fbc`/`fbp`, IP and user agent are not hashed.
IP is taken only from Vercel's trusted edge header; no client-provided IP is used.

Validation before completion: in an authorized test environment, create one
account through Website → password, direct Students signup and Mentoria (with
sandbox fixtures). In Meta Test Events, confirm browser and server events have
the name `CompleteRegistration` and the same identifier, producing one conversion.
Opening the signup form, failed submissions, existing accounts and profile edits
must not produce a registration. Pixel Helper checks only the browser half;
server reception/deduplication must be checked in Events Manager. Do not trigger
real signup emails, CRM events or payment operations just to test tracking.

Rollback: disable `META_CONVERSIONS_ENABLED`, restore the previous application
version, and disable/drop the new profile trigger and its two RPC/trigger
functions through a reviewed migration if needed. Keep the outbox and attribution
column to preserve collected data. Production has not been migrated and no
application deployment has been performed.

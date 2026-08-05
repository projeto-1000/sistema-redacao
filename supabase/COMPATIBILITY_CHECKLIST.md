# Supabase compatibility checklist

Use this checklist before merging an application change that depends on a database migration and
before promoting that change to Production.

## Environment alignment

- Confirm the application points to the intended Supabase project in each Vercel environment.
- Compare the remote migration history for Development and Production.
- Never execute `20260805000001_initial_schema.sql` against the existing Development database.
- Mark the initial schema baseline as applied in Development only after confirming that its schema
  matches the versioned baseline.
- Review Development's current RLS policies, grants, triggers, functions, and Storage policies before
  applying the security baseline. Do not mark the security migration as applied without verifying
  that the same behavior already exists.
- Apply and validate every migration after the baseline in Development before applying it to
  Production.
- Do not run `seed.sql` against Development as part of baseline alignment. Its reference records may
  intentionally differ from the current Development data.

## Required configuration

- Configure Development Vercel variables with Development Supabase values.
- Configure Production Vercel variables with Production Supabase values.
- Keep `SUPABASE_SECRET_KEY` and `CRON_SECRET` server-only.
- Configure `CRON_SECRET` before deploying the protected holiday synchronization route.
- Confirm the `receipts` bucket is private and that Admin users can create signed URLs.
- Register the internal free plan before testing or enabling student signup in Production.
- Register Production payment plans with Production Pagar.me identifiers before enabling checkout.

## Student flows

- Create an account and confirm the profile, free subscription, and credits are created.
- Complete onboarding.
- Update the profile name and avatar.
- Create, edit, reopen, and delete an essay draft.
- Confirm temporary backup autosave and cleanup.
- Submit an essay and confirm credits are consumed once.
- View essay history and corrected essay details.
- View subscription, credits, and transaction history.
- Exercise checkout only with an approved non-production payment strategy.

## Teacher flows

- View available essays.
- Claim an essay without allowing a second teacher to claim it.
- Save and reopen a correction draft.
- Finish a correction and confirm the student can view it.
- Return an assigned essay to the student.
- Update profile name and avatar.
- Create, update, and delete the teacher's own payment account.

## Admin flows

- View students, teachers, essays, subscriptions, and credit histories.
- Block and unblock a student and a teacher.
- Create, edit, and delete an essay topic with text and image motivators.
- Confirm legacy Development image URLs and new Storage object paths both render.
- Claim an essay, save and reopen a correction draft, and finish the correction.
- Create a teacher payment with a PDF receipt and reopen it through a signed URL.
- Confirm receipt links expire and unauthenticated access is denied.
- Create and edit plans without using Development payment-provider identifiers in Production.

## Release gate

Release only when all applicable flows pass in Development, the same committed migrations are
present in Production, Vercel variables are isolated by environment, and no real customer or payment
data was used during validation.

# Supabase environments

The project uses two isolated Supabase projects:

- Development: non-production data and broader team access.
- Production: real customer data and restricted operational access.

Both environments receive the same database structure through the versioned files in
`supabase/migrations`. Data, Auth users, secrets, URLs, and Storage objects are never copied by
these migrations.

## Change workflow

1. Create a new migration locally instead of editing the database manually in the dashboard.
2. Review the migration, especially RLS, grants, functions, triggers, and destructive statements.
3. Apply and validate it in Development first.
4. Commit the reviewed migration with the related application code.
5. Apply the exact same committed migration to Production only after approval.

Production must never receive a migration that has not already been validated in Development.

## Initial baseline

- `20260805000001_initial_schema.sql` reproduces the verified Development schema without data.
- `20260805000002_initial_security.sql` enables RLS, defines access policies, protects privileged
  profile fields, restricts RPC execution, creates Storage buckets, and configures private receipts.
- `20260806000004_secure_user_roles.sql` makes `profiles.role` authoritative, defaults public
  signups to `STUDENT`, and prevents authenticated users from changing their own role.
- `seed.sql` contains only reviewed, non-sensitive reference data: 33 essay topics, 121
  motivational items with corrected numbering, and the 2026/2027 holidays.

The baseline does not import Development users, application rows, or plans. Production plans must be
registered manually so their payment-provider identifiers belong to the Production environment.

The existing Development database predates this migration history. Do not execute the initial schema
migration or the baseline seed against it. First compare its schema and migration history with the
versioned baseline. Mark the initial schema migration as applied only after that comparison. Review
and apply the security migrations separately so Development and Production enforce the same runtime
behavior without recreating Development data.

Theme image values in the seed are portable Storage object paths rather than Development URLs. The
47 reviewed image files must be uploaded to the Production `themes` bucket using the same paths
before go-live. The applications convert these paths into the correct environment-specific public
URLs when reading a topic.

## User roles

Application authorization must read `profiles.role` through `get_my_role()`. Never authorize from
`auth.users.raw_user_meta_data`, because users can update their own user metadata.

Public email and Hotmart signups always create students. Privileged users must be provisioned by a
trusted administrative process that sets `app_metadata.app_role` to `TEACHER` or `ADMIN`; this value
must never come from a public form or browser request.

## Rollback strategy

Before go-live, the clean Production project can be discarded and recreated if the baseline fails.
After go-live, never edit or delete an already-applied migration. Create a new forward migration that
reverts the specific change, validate it in Development, and only then apply it to Production.

Database backups are a recovery layer, not a replacement for reviewed migrations.

Use `COMPATIBILITY_CHECKLIST.md` as the required release gate for database-dependent changes.

## Required environment values

Each Vercel environment must point to the matching Supabase project. Never reuse Development values
in Production.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_KEY` (server only)
- `CRON_SECRET` (server only, used to authenticate scheduled routes)

Do not commit any value for these variables.

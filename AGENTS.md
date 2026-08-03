# Projeto1000 — Repository Instructions

## Repository overview

This repository is a pnpm and Turborepo monorepo.

### Applications

- `apps/admin`: administrative application, running locally on port 3000.
- `apps/students`: student application, running locally on port 3001.
- `apps/teachers`: teacher application, running locally on port 3002.

### Shared packages

- `packages/ui`: shared React components and styles.
- `packages/types`: shared TypeScript types.
- `packages/validators`: shared validation schemas.
- `packages/hooks`: shared React hooks.
- `packages/utils`: shared utilities.
- `packages/constants`: shared constants.
- `packages/payments`: server-only payment integrations.
- `packages/eslint-config`: shared ESLint configuration.
- `packages/prettier-config`: shared Prettier configuration.
- `packages/tailwind-config`: shared Tailwind configuration.
- `packages/typescript-config`: shared TypeScript configuration.

## Working agreement

- Explain the proposed approach and relevant tradeoffs before editing code.
- Do not begin implementation until the requested behavior and scope are clear.
- Keep changes focused on the active task.
- Do not modify unrelated files or revert changes made by the user.
- Prefer existing project patterns over introducing new abstractions.
- Ask before adding or upgrading production dependencies.
- Use English for branch names and commit messages.
- Use Conventional Commits, such as `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, and `chore:`.
- Do not commit, push, open a pull request, merge, or deploy unless explicitly requested.
- Never work directly on `main` or `develop`; use a dedicated feature or maintenance branch.

## Package manager and commands

- Use `pnpm`; do not use npm, Yarn, or Bun.
- Run commands from the repository root unless a package-specific command is required.
- Use filtered commands when validating a localized change.

Common repository commands:

```bash
pnpm dev
pnpm lint
pnpm check-types
pnpm build
```

Examples of scoped validation:

```bash
pnpm --filter students lint
pnpm --filter students check-types
pnpm --filter teachers lint
pnpm --filter teachers check-types
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter @repo/ui lint
pnpm --filter @repo/ui check-types
pnpm --filter @repo/payments lint
pnpm --filter @repo/payments typecheck
```

- Do not run the repository-wide formatting command unless requested, because it may rewrite unrelated files.
- Run the smallest relevant checks first.
- Before handing off a code change, run lint and type checking for every affected workspace when possible.
- Run a full build only when its value justifies the time and required environment variables.
- Report checks that could not run and explain why.
- Do not claim tests passed when the repository has no applicable automated test command.

## Secrets and environment files

- Never print, copy, summarize, expose, or commit secrets.
- Do not read `.env.local` or other environment files unless the user explicitly authorizes it for a specific diagnostic need.
- Never include secret values in prompts, logs, commits, issues, pull requests, or documentation.
- Use placeholder names when documenting environment variables.
- Do not change production credentials or configuration.
- Do not access production services unless the user explicitly requests and authorizes the exact action.

## Supabase and database safety

- Treat database migrations, schema changes, row-level security policies, authentication settings, and RPC functions as high-risk changes.
- Explain the migration and rollback strategy before changing database-related code.
- Do not execute migrations against a remote or production database.
- Do not delete or overwrite remote data.
- Prefer local or isolated development environments.
- Preserve authorization checks and row-level security assumptions.
- Flag code that uses admin or service-role clients and verify that it remains server-only.

## Payments and webhooks

- Treat Pagar.me, Hotmart, payment flows, subscriptions, and webhooks as security-sensitive.
- Never trigger real charges, refunds, subscription changes, or production webhook deliveries.
- Do not send real customer or payment data to external services during development.
- Preserve webhook authentication, idempotency, replay protection, and audit behavior.
- Use mocks, fixtures, or documented sandbox environments for payment testing.
- Request explicit approval before any external API call that could change remote state.

## Application and package boundaries

- Check whether a change belongs in a shared package before duplicating it across applications.
- Consider the effect of shared-package changes on all three applications.
- Keep server-only code out of client components and browser bundles.
- Preserve Next.js server/client boundaries.
- Avoid importing application-specific code into shared packages.
- Update shared types and validators together when their contracts change.

## Verification and review

- Review the final diff for scope, accidental secret exposure, generated files, and unrelated formatting.
- For authentication, authorization, payments, webhooks, or database changes, explicitly describe security and failure-mode considerations.
- Summarize changed files, checks performed, and remaining risks.
- Call out assumptions and unresolved questions.
- Do not conceal warnings or failed checks.

## Code review rules

- Flag exposed secrets, credentials, tokens, or personal data.
- Flag missing authentication or authorization checks.
- Flag service-role or administrative Supabase access that can reach client code.
- Flag payment operations without validation, idempotency, or safe error handling.
- Flag webhook handlers that do not authenticate or safely handle duplicate delivery.
- Flag database changes without a migration and rollback plan.
- Flag cross-application regressions caused by shared-package changes.
- Flag new dependencies that were not justified or approved.

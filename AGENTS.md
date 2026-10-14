# Projeto1000 — Repository Instructions

## Repository overview

This repository is a pnpm and Turborepo monorepo.

### Applications

- `apps/admin`: administrative application, running locally on port 3000.
- `apps/students`: student application, running locally on port 3001.
- `apps/teachers`: teacher application, running locally on port 3002.
- `apps/website`: public website and landing page, running locally on port 3003.

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

- Keep changes focused on the active task.
- Do not modify unrelated files or revert existing changes.
- Prefer established project patterns over unnecessary abstractions.
- Respect previously established requirements and decisions.
- Do not reopen resolved decisions without a relevant technical reason.
- Do not implement unsolicited improvements or related fixes.
- Report relevant out-of-scope problems separately.
- Prioritize correctness, maintainability, security, and efficiency.

## Task execution and autonomy

Treat investigation, planning, implementation, and deployment as distinct stages.

### Investigation

- Investigation-only requests must remain read-only.
- Do not create a branch solely for investigation.
- Analyze the relevant code and present findings, risks, and proposed solutions.
- Do not begin implementation when only investigation or planning was requested.

### Implementation

- When implementation is explicitly requested and requirements are clear, proceed without unnecessary approval checkpoints.
- Briefly explain the approach before editing code.
- Adapt planning depth to task complexity.
- For simple tasks, avoid extensive planning.
- For complex or sensitive tasks, investigate architecture, dependencies, risks, and relevant alternatives.
- Make routine technical decisions autonomously when consistent with existing architecture.
- Request a decision when unresolved questions materially affect business rules, architecture, security, data integrity, or expected behavior.
- If new findings invalidate an approved decision, explain the issue before changing the approach.
- Do not expand the approved scope without authorization.

## Git workflow

### Branch management

- `develop` is the source of truth for development.
- New branches must always be created from the latest `origin/develop`.
- Fetch remote updates before creating a branch and ensure the base reflects the latest `origin/develop`.
- Never overwrite or discard changes from `develop`.
- Never modify code directly on `main` or `develop` unless explicitly instructed.
- When implementation starts from `main` or `develop`, automatically create a dedicated branch and inform the user. Additional authorization is not required.
- When continuing work on an existing working branch, reuse that branch unless instructed otherwise.
- Do not create additional branches during an ongoing implementation unless requested.
- Investigation without code changes does not require a new branch.

### Branch naming

- Use descriptive English branch names following Conventional Commits conventions.
- Prefer prefixes such as `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, and `test/`.
- Do not use `codex/` or other agent-specific prefixes.

### Worktrees

- Worktrees may be used autonomously when concurrent tasks require isolation.
- Worktrees are not mandatory for ordinary implementations.
- Preserve existing worktrees, branches, and uncommitted changes.
- Do not create additional branches through worktrees unless permitted by the branch management rules.

### Synchronization

- The Work agent may fetch and synchronize existing working branches with the latest `origin/develop` when necessary.
- Preserve changes from both `develop` and the working branch.
- Local merge commits are permitted exclusively when required to synchronize a working branch with `develop`.
- This is the only exception to the rule prohibiting automatic commits.
- Resolve straightforward conflicts only when the correct resolution is clear and preserves both branches' intended behavior.
- Request guidance when conflicts cannot be resolved safely.
- Never use `git reset --hard` or `git push --force` without explicit authorization.
- Never discard, overwrite, or revert existing changes without authorization.

### Commits and publication

- Use Conventional Commits with English messages.
- Do not create ordinary commits, push, merge for publication, open pull requests, or deploy unless explicitly requested.
- Authorization for one operation does not imply authorization for subsequent operations.
- When committing, stage only files related to the authorized task.
- Review staged changes using `git diff --staged`.
- Avoid `git add .` when unrelated changes may be included.
- Never include unrelated or preexisting changes without authorization.
- If ownership of a change is unclear, ask before including it.

### Production publication

- The standard publication flow is working branch → `develop` → `main`.
- Production publication requires explicit authorization.
- Verify branch divergence and preserve existing history before publication.
- Never overwrite the history of `main`.
- When an authorized push may trigger automatic Vercel deployments or Supabase migrations, inform the user of those consequences.
- Configured automatic effects of an explicitly authorized push do not require a separate approval.
- Do not independently execute additional deployment or migration operations without authorization.

## Efficient investigation and token usage

- Investigate the smallest relevant area of the codebase first.
- Identify relevant entry points and dependencies before expanding the investigation.
- Prefer targeted searches over repository-wide scans.
- Avoid reading entire files when only specific functions or sections are relevant.
- Limit command output to relevant information without hiding necessary details.
- Avoid repeating searches, commands, or analyses whose results are already known.
- Reuse findings and decisions established during the current task.
- Treat the current repository code as the primary source of truth for existing implementations.
- Verify relevant code rather than relying on assumptions from previous tasks.
- Consult external documentation only when necessary.
- Prioritize official documentation matching installed dependency versions.
- Do not perform extensive external research when available evidence is sufficient.
- Expand investigations whenever necessary to preserve correctness, security, or maintainability.
- Never sacrifice implementation quality solely to reduce token consumption.

## Debugging and problem solving

- Investigate the probable root cause before modifying code.
- Base diagnoses on available evidence, including execution paths, error messages, and observed behavior.
- Avoid speculative fixes without a reasonable technical hypothesis.
- Prefer fixing root causes rather than symptoms.
- Do not repeat failed attempts without changing the hypothesis or approach.
- When an attempt fails, investigate why before trying another solution.
- Reevaluate the strategy when repeated attempts produce no meaningful progress.
- Distinguish preexisting errors from regressions introduced by the current task.
- Fix regressions caused by the implementation.
- Report unrelated preexisting problems without automatically fixing them.
- Verify that the original problem is resolved and check for relevant regressions.

## Code quality and reuse

### Reuse and shared code

- Before creating functions, types, interfaces, Zod schemas, hooks, components, or constants, search for equivalent existing implementations.
- Prioritize reusing or adapting existing code.
- Avoid duplicating business rules, validations, and data transformations.
- Equivalent functionality reused across applications must be centralized in the appropriate shared monorepo package.
- Repeated functionality used only within one application should be centralized within that application.
- Use the existing shared packages according to their responsibilities.
- Do not unify code that only appears similar but represents different responsibilities or business rules.
- Avoid unnecessary abstractions and excessive coupling.
- Keep application-specific behavior within the relevant application.

### TypeScript

- Prefer accurate, reusable types and clear typing.
- Avoid `any`, unnecessary type assertions, and `@ts-ignore` directives that conceal type problems.
- Fix typing issues at their source whenever possible.
- Reuse existing types and Zod schemas.
- Validate external or untrusted data at appropriate boundaries.
- Do not disable TypeScript or ESLint rules merely to bypass errors.
- Allow technically justified exceptions when necessary.

### Code maintenance

- Remove code made obsolete by the current implementation.
- Remove unused imports, functions, components, and temporary code introduced or superseded by the task.
- Do not leave commented-out implementations as substitutes for working code.
- Verify consumers before removing or changing existing functionality.
- Avoid unnecessary compatibility layers.
- Do not perform unrelated cleanup or refactoring.

## Application and package boundaries

- Respect the responsibilities of each application and shared package.
- Consider the effect of shared-package changes on all affected applications.
- Keep server-only code out of client components and browser bundles.
- Preserve Next.js server/client boundaries.
- Avoid importing application-specific code into shared packages.
- Update related shared types and validators together when contracts change.
- Identify relevant consumers before changing existing interfaces, APIs, schemas, or contracts.
- Preserve backward compatibility whenever reasonable.
- Explain breaking changes and request approval when they materially affect existing behavior.
- Avoid introducing unnecessary dependencies between applications.

## Package manager and dependencies

- Use `pnpm`; do not use npm, Yarn, or Bun.
- Run commands from the repository root unless a package-specific command is required.
- Prefer existing dependencies and built-in framework capabilities.
- Ask before adding, removing, or upgrading any dependency, including devDependencies.
- Explain why a dependency change is necessary and why existing solutions are insufficient.

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

- Do not run repository-wide formatting unless requested.
- Prefer scoped commands and validations for localized changes.

## Verification and testing

- Run the smallest relevant checks first.
- Run lint and type checking for every affected workspace when possible.
- Run applicable automated tests when available.
- Create or update automated tests when changes affect important behavior and appropriate testing infrastructure exists.
- Prioritize tests that protect business rules and prevent regressions.
- Avoid redundant or unnecessarily complex tests.
- Do not introduce testing dependencies or frameworks without authorization.
- Run full builds when necessary to validate significant changes or integration behavior.
- Avoid unnecessary full builds for trivial changes.
- Verify relevant functionality and failure scenarios.
- Review the final diff for scope, accidental secret exposure, generated files, and unrelated formatting.
- Report checks that could not run and explain why.
- Do not claim tests passed when no applicable automated tests were executed.

## UI and frontend quality

- Preserve consistency with existing components and design patterns.
- Consider responsive behavior and accessibility.
- Handle loading, error, empty, and success states when relevant.
- Verify affected components and user flows.
- Avoid unnecessary visual redesigns or unsolicited UX changes.
- Consider the impact of changes on rendering, data fetching, and page loading.
- Prefer existing React and Next.js capabilities before introducing additional solutions.
- Avoid unnecessary database queries and repeated requests.
- Do not introduce premature optimizations without demonstrated benefits.
- Investigate concrete performance concerns when relevant to the task.

## Secrets and environment safety

- Never print, copy, summarize, expose, or commit secrets.
- Do not read `.env.local` or other environment files unless explicitly authorized for a specific diagnostic need.
- Never include secret values in prompts, logs, commits, issues, pull requests, or documentation.
- Use placeholder names when documenting environment variables.
- Never expose sensitive customer or authentication data.

### Development environment

- Read-only investigations of development services are permitted when relevant to the task, subject to secret-access restrictions.
- Do not modify remote development data, credentials, or service configurations without explicit authorization.
- Normal non-sensitive local configuration changes may be included in an authorized implementation.

### Production environment

- Do not access production services without explicit authorization for the intended action.
- Do not modify production data, credentials, or configurations without explicit authorization.
- Never assume that development permissions extend to production.

### Remote data protection

- Never delete or overwrite remote data without explicit authorization identifying the environment and intended operation.
- Destructive bulk operations require specific authorization.
- Preserve existing data and avoid unnecessary destructive operations.

## Supabase and database safety

- Treat migrations, schema changes, RLS policies, authentication settings, and RPC functions as sensitive operations.
- Distinguish ordinary query or data-access changes from structural database changes.
- Evaluate impacts and provide migration and rollback strategies when structural changes require them.
- Creating migration files during an authorized implementation is permitted.
- Creating a migration does not authorize executing it.
- Local migration validation is permitted in isolated environments.
- Never execute migrations against remote DEV or PROD databases without explicit authorization for the environment and operation.
- Do not execute migrations from isolated worktrees unless explicitly authorized.
- Preserve authorization checks and RLS assumptions.
- Keep service-role and administrative Supabase access server-only.
- Consider transaction integrity, concurrency, and idempotency when relevant.
- Avoid partial operations that leave related data inconsistent.
- Preserve existing audit trails and historical records.

## Authentication and authorization

- Never rely exclusively on frontend restrictions to enforce permissions.
- Validate authentication and authorization at appropriate server or database boundaries.
- Respect application roles and existing access-control mechanisms.
- Review relevant permission implications when modifying APIs, Server Actions, RPCs, or RLS policies.
- Reuse existing authorization patterns instead of duplicating permission logic.
- Do not weaken security checks to simplify an implementation.

## Payments, webhooks, and external integrations

- Treat Pagar.me, Hotmart, subscriptions, credits, payment flows, and webhooks as security-sensitive.
- Never trigger real charges, refunds, subscription changes, or production webhook deliveries.
- Do not send real customer or payment data to external services during development.
- Preserve webhook authentication, idempotency, replay protection, and auditing.
- Use mocks, fixtures, or documented sandbox environments for payment testing.
- Request explicit approval before external API calls that could change remote state.
- Identify potential side effects before testing external integrations.
- Do not send real emails, notifications, or production CRM events during tests without explicit authorization.
- Prefer existing preview, mock, or testing mechanisms.
- Do not permanently disable integrations merely to simplify testing.
- Preserve data consistency across payment, subscription, credit, and related operations.
- Consider failure recovery when external operations may partially succeed.

## Error handling and observability

- Handle errors explicitly and avoid silent failures.
- Follow established error-handling patterns.
- Record useful diagnostic information when appropriate.
- Never log passwords, tokens, secrets, or unnecessary personal data.
- Provide understandable user-facing errors without exposing internal implementation details.
- Avoid excessive logging, especially in production.
- Do not introduce monitoring services or dependencies without authorization.

## Documentation

- Do not create unnecessary planning files, investigation reports, or auxiliary documentation.
- Prefer presenting investigation findings directly in the conversation.
- Update existing documentation when code changes make it inaccurate.
- Create new documentation only when requested or justified by meaningful maintenance needs.
- Do not sacrifice essential technical documentation solely to reduce token usage.

## Communication and handoff

- Keep responses concise, practical, and focused on the active task.
- Avoid repeating established context, requirements, or decisions.
- Distinguish completed work, remaining tasks, risks, and recommendations.
- After implementation, summarize relevant changes, validations, and unresolved issues.
- Explain security and failure-mode considerations for sensitive changes.
- Report warnings, failed checks, and important limitations.
- Do not automatically provide commit, push, merge, or deployment procedures.
- When Git instructions are requested, provide clear commands in execution order.
- Do not suggest unrelated follow-up work unless it addresses a meaningful risk or blocker.

## Code review rules

Keep reviews focused on changed code and directly affected dependencies.

Expand the investigation when evidence indicates broader impact.

Do not perform repository-wide audits unless requested.

Flag relevant issues involving:

- Exposed secrets, credentials, tokens, or personal data.
- Missing authentication or authorization checks.
- Service-role or administrative Supabase access exposed to client code.
- Payment operations without validation, idempotency, or safe error handling.
- Webhook handlers lacking authentication or duplicate-delivery protection.
- Database changes without appropriate migration or rollback considerations.
- Cross-application regressions caused by shared-package changes.
- Unapproved or unjustified dependency changes.
- Data consistency, concurrency, or audit-trail risks.
- Breaking changes affecting existing functionality.

Report critical unrelated findings separately without automatically expanding the implementation scope.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# AGENTS.md — lumera-cms

## Repository Responsibility
`lumera-cms` is the custom operations control center for the Lumera platform. It provides staff authentication, role-based navigation, dashboard metrics, and administrative workflows for products, orders, customers, and business configuration.

## Allowed Technologies
* Next.js 15 (App Router)
* React 19
* TypeScript (strict mode)
* Tailwind CSS 3
* Native Fetch API (via `src/lib/api/admin-client.ts`)

## Directory Conventions
* `src/app/`: Next.js App Router admin pages, layout, and route groups.
* `src/components/layout/`: Navigation shells, Sidebar, Header, AdminShell.
* `src/components/modules/<module>/`: Module-specific admin components (e.g. `products/`, `orders/`, `staff/`).
* `src/lib/api/`: Centralized Admin API client (`admin-client.ts`).
* `src/lib/auth/`: Permission guards and authorization contexts (`permissions.tsx`).

## Coding Conventions
* Strict TypeScript: no unannotated `any`.
* All operations pages and mutating actions must be guarded by permission checks using `usePermissions()` and `<Can permission="...">`.
* Standard error handling: always consume normalized backend error shapes (`error.code`, `error.message`, `error.details`).
* Co-locate module tests and maintain comprehensive loading/empty/error states.

## Testing Requirements
* `npm run typecheck` must pass with 0 errors.
* `npm run build` must complete cleanly.
* Verify permission gating and token header propagation.

## Git Rules
* Branch naming: `feature/<module-name>`, `fix/<bug-name>`, `chore/<chore-name>`.
* Commit messages: Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`).
* Target branch: `main` (protected; changes merged via PR).

## Security Rules
* **UI restriction is NOT authorization**: Hiding buttons or routes in the CMS does not replace backend enforcement. Every action must be verified server-side by `lumera-backend`.
* **Token security**: Staff access tokens must reside in memory; never store in `localStorage`.
* **Zero secrets**: Do not place backend secrets or private keys in CMS code. Only `NEXT_PUBLIC_*` variables are permitted.

## What the Agent Must NOT Modify
* Do not introduce customer storefront code here.
* Do not introduce backend Python or Django code.
* Do not attempt to mount Django Admin.
* Do not alter root project architecture without an approved ADR in `lumera-spec`.

## Where Shared Project Specification Lives
All shared architectural specifications, API schemas, and business rules live in:
`lumera-spec/` (e.g., `architecture/cms-architecture.md`, `contracts/api-contract.yaml`).

## How to Handle Architecture Changes
If an administrative endpoint or permission code is missing:
1. Update the specification in `lumera-spec/contracts/api-contract.yaml` and `lumera-spec/security/security.md`.
2. Implement backend endpoint and permission in `lumera-backend`.
3. Update `lumera-cms` to consume the new endpoint.

## Definition of Done
* `npm run typecheck` passes with 0 errors.
* `npm run build` compiles with 0 errors.
* Permission-aware UI correctly hides unauthorized controls and handles 403 Forbidden responses cleanly.

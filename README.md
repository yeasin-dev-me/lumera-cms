# Lumera Operations CMS (`lumera-cms`)

## Purpose
`lumera-cms` is the custom operational control center and admin interface for Lumera business operations, merchandising, customer service, and staff management.

**Critical Architecture Decision:** Lumera strictly does **NOT** use Django Admin (`django.contrib.admin`). All back-office operations are conducted through this custom Next.js CMS.

---

## Architecture Role
In the Lumera ecosystem:
* Dedicated operational user interface for staff, merchandisers, and operations teams.
* Communicates with the backend headless API exclusively over the `/api/v1/admin/` namespace with JWT staff tokens.
* Enforces permission-aware UI rendering: displays or restricts actions based on granular permissions (`usePermissions()`, `<Can permission="...">`).
* Backend remains the sole authoritative gatekeeper for business validation, database persistence, and RBAC authorization.

```text
Staff User Browser
       │
       ▼
  lumera-cms (Next.js 15 App Router)
       │
       ▼ (REST: /api/v1/admin/* with Bearer token)
lumera-backend (Django REST API)
```

---

## Technology Stack
* **Framework:** Next.js 15 (App Router)
* **Library:** React 19
* **Language:** TypeScript 5 (Strict Mode)
* **Styling:** Tailwind CSS 3 (Admin operations theme)
* **HTTP Client:** Centralized Admin API client with error normalization

---

## Repository Structure
```text
lumera-cms/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout with AdminShell
│   │   └── page.tsx         # Dashboard with metrics, health, and navigation
│   ├── components/
│   │   └── layout/          # AdminShell, Sidebar, Header
│   ├── lib/
│   │   ├── api/             # Centralized Admin API client (admin-client.ts)
│   │   └── auth/            # Permission context and <Can> guard (permissions.tsx)
│   ├── styles/              # Global styling and CSS variables
│   └── types/               # CMS-specific API interfaces
├── Dockerfile               # Multi-stage production container build
├── tailwind.config.ts       # Tailwind CSS theme
├── tsconfig.json            # Strict TypeScript configuration
├── package.json             # Dependencies and scripts
└── AGENTS.md                # AI agent operating instructions
```

---

## Local Development
### Prerequisites
* Node.js 20+ and npm

### Installation & Run
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) to view the CMS operations interface.

---

## Environment Variables
Defined in `.env.example`:
```env
# CMS Admin API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```
* Note: Only `NEXT_PUBLIC_*` environment variables are exposed to the browser.
* Never place backend secrets or private keys in this file.

---

## Running Tests
```bash
# Typecheck
npm run typecheck

# Linting
npm run lint
```

---

## Build
```bash
# Production Next.js build
npm run build

# Start production server
npm start
```

---

## Related Repositories
* [lumera-spec](https://github.com/yeasin-dev-me/lumera-spec) — Single Source of Truth for architecture & contracts
* [lumera-backend](https://github.com/yeasin-dev-me/lumera-backend) — Headless Django REST API
* [lumera-frontend](https://github.com/yeasin-dev-me/lumera-frontend) — Customer-facing Next.js Storefront
* [lumera-integration](https://github.com/yeasin-dev-me/lumera-integration) — Cross-system contract and E2E tests
* [lumera-devops](https://github.com/yeasin-dev-me/lumera-devops) — Deployment, Docker, and Nginx configurations

---

## Documentation
* CMS Architecture: [lumera-spec/architecture/cms-architecture.md](https://github.com/yeasin-dev-me/lumera-spec/blob/main/architecture/cms-architecture.md)
* API Architecture: [lumera-spec/architecture/api-architecture.md](https://github.com/yeasin-dev-me/lumera-spec/blob/main/architecture/api-architecture.md)
* API Contract: [lumera-spec/contracts/api-contract.yaml](https://github.com/yeasin-dev-me/lumera-spec/blob/main/contracts/api-contract.yaml)

---

## Contribution / Git Workflow
1. Branch from `main`: `feature/<module-name>` or `fix/<bug-name>`.
2. Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`).
3. Ensure `npm run typecheck` and `npm run build` pass before opening a Pull Request.
4. Merge into `main` via squash-and-merge.

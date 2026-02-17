# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Translation Management System (TMS) for German translation agencies. SaaS product with multi-tenancy. All UI text and business logic is in **German**.

## Architecture

Monorepo with two independent projects:
- **`/backend/`** — Laravel 12 (PHP 8.2+) REST API with Sanctum token auth
- **`/frontend/`** — React 19 + TypeScript SPA with Vite

No root-level package.json. Frontend and backend are entirely separate.

## Development Commands

### Backend (`/backend/`)
```bash
composer setup          # Full first-time setup (install, .env, key, migrate, npm)
composer dev            # Start all services concurrently (server + queue + logs + vite)
composer test           # Run PHPUnit tests
php artisan serve       # Dev server on :8000
php artisan migrate     # Run migrations
php artisan db:seed --class=MasterDataSeeder  # Seed languages, doc types, services
```

### Frontend (`/frontend/`)
```bash
npm run dev             # Vite dev server on :5173
npm run build           # tsc -b && vite build
npm run lint            # ESLint
npm run preview         # Preview production build
```

Vite proxies `/api/*` and `/sanctum/*` to `http://localhost:8000`.

## Database

SQLite by default (configurable in `.env`). 58+ migrations. All monetary values stored as **integer cents**.

## Multi-Tenancy

Row-level tenant isolation via `BelongsToTenant` trait + global `TenantScope`. Every data model auto-filters by `tenant_id` from the authenticated user. New models that hold tenant data **must** use the `BelongsToTenant` trait.

## Authentication

Laravel Sanctum Personal Access Tokens stored in `localStorage`. Axios interceptor (`/frontend/src/api/axios.ts`) attaches Bearer token and handles 401 → redirect to login. 2FA via TOTP (`pragmarx/google2fa`). Users without a `tenant_id` are routed through onboarding to create their Tenant.

## Key Patterns

- **API services**: All API calls centralized in `/frontend/src/api/services.ts`, using the Axios instance from `/frontend/src/api/axios.ts`
- **UI components**: shadcn/ui-style (Radix UI primitives + Tailwind variants) in `/frontend/src/components/ui/`
- **State/data fetching**: TanStack React Query with polling for live updates
- **Path alias**: `@` maps to `/frontend/src/` (configured in vite.config.ts and tsconfig)
- **Activity logging**: `LogsAllActivity` trait (Spatie) on models that need audit trails
- **Route guards**: `ProtectedRoute` (requires auth + tenant) and `PublicRoute` in `/frontend/src/components/auth/`

## German Compliance (GoBD / ZUGFeRD)

- **Invoices are immutable** once issued. Corrections use Storno/Gutschrift (credit note) workflow. No hard-deletes on issued invoices.
- Sequential, gap-free invoice numbering per tenant per year.
- ZUGFeRD/XRechnung e-invoicing via `horstoeko/zugferd-laravel`.
- DATEV accounting export support.

## API Structure

Routes in `/backend/routes/api.php`. Key groups:
- Public: `/api/login`, `/api/register`, email verification
- Guest (no auth): `/api/guest/project/{token}` — external client portal
- Authenticated (`auth:sanctum`): CRUD for customers, partners, projects, invoices, mails, reports, notifications, settings
- Admin (`/api/admin`): tenant management, system health

## Domain Concepts

- **Customer** — Client of the translation office
- **Partner** — External translator/subcontractor
- **Project** — Translation job linking customer, partner, languages, document types, files, positions, payments, messages
- **ProjectPosition** — Line items within a project
- **InvoiceItem** — Frozen copy of line items (not live-linked to ProjectPosition)
- **Guest Project Portal** — Token-based access for external clients (view status, upload files, message)

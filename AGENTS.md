# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Translater Office (TMS)** — a multi-tenant Translation Management System for translation agencies. Stack: Laravel 12 (backend API) + React 19 + TypeScript (frontend SPA) + Filament 5 (admin panel).

The project lives in `Translation-Office/` with three subdirectories:
- `backend/` — Laravel API + Filament admin panel
- `frontend/` — React SPA
- `landing-page/` — Static marketing site

---

## Development Commands

### Backend (run from `backend/`)

```bash
# Install & setup
composer install
cp env.example .env && php artisan key:generate
php artisan migrate

# Run all services together (API + queue + logs + Vite for blade)
composer dev

# Individual services
php artisan serve          # API on :8000
php artisan queue:listen --tries=1 --timeout=0
php artisan reverb:start   # WebSocket server

# Testing
composer test              # runs php artisan test
php artisan test --filter TestName   # single test

# Code style
./vendor/bin/pint          # Laravel Pint (PSR-12)
```

### Frontend (run from `frontend/`)

```bash
npm install
npm run dev      # Vite dev server on :5173 (proxies /api to :8000)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
```

### Database

MySQL database: `db_tmsoffice` (configured in `.env` as `DB_DATABASE`).

```bash
php artisan migrate
php artisan db:seed
```

---

## Architecture

### Multi-tenancy

Every resource model (Project, Customer, Partner, Invoice, etc.) uses the `BelongsToTenant` trait (`app/Traits/BelongsToTenant.php`). This trait:
1. Registers a global `TenantScope` that automatically filters all Eloquent queries by `tenant_id = Auth::user()->tenant_id`.
2. Auto-sets `tenant_id` on model creation from the authenticated user.

**Never** query tenant-scoped models without an authenticated user in scope or you'll get no results / errors.

### Role System

Three roles with hierarchy (highest → lowest): `owner > manager > employee`.

- Enforced via `EnsureTenantRole` middleware (`tenant.role:owner|manager|employee`).
- Owner-only: user/team management, company settings, billing, bulk-delete.
- Manager+: invoices, reports, mail, partner management, master data settings.
- Employee+: projects, customers, calendar, notifications.
- Frontend enforces via `<RoleGuard minRole="...">` in `App.tsx`.

### API Authentication

Laravel Sanctum token-based auth. The frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>`. The Vite dev server proxies `/api/*` and `/sanctum/*` to `http://localhost:8000`.

### Real-time (WebSockets)

Laravel Reverb is the WebSocket server. Frontend uses `laravel-echo` + `pusher-js` to subscribe to channels for live project/notification updates.

### Frontend Data Fetching

TanStack Query (`@tanstack/react-query`) for all server state. API service functions live in `frontend/src/api/services/`. The central Axios instance (`frontend/src/api/axios.ts`) handles auth headers, 401 redirects, and toast-based error display globally.

Path alias `@/` maps to `frontend/src/`.

### Filament Admin Panel

Located at `/admin` (web route). Used by platform admins (`is_admin = true` on User) to manage tenants, subscriptions, system health, and API logs. Filament resources are in `app/Filament/`.

### Invoice / E-Invoicing

Invoices support ZUGFeRD XML (via `horstoeko/zugferd-laravel`) and PDF generation (via `barryvdh/laravel-dompdf`). Invoice lifecycle: draft → issued → paid/cancelled. DATEV export is supported.

### Key Third-party Packages

| Package | Purpose |
|---|---|
| `spatie/laravel-activitylog` | Audit log on all models with `LogsAllActivity` trait |
| `spatie/laravel-health` + Filament widget | System health checks |
| `spatie/laravel-backup` | Automated backups |
| `webklex/laravel-imap` | IMAP inbox sync |
| `pragmarx/google2fa` | TOTP two-factor auth |
| `laravel/pulse` | Performance monitoring |
| `dcblogdev/laravel-sent-emails` | Sent email log |

---

## Environment Notes

- Backend `.env`: copy from `env.example`. Key vars: `DB_DATABASE=db_tmsoffice`, `BROADCAST_CONNECTION=reverb`, `QUEUE_CONNECTION=database`.
- Frontend env: `VITE_API_URL` (defaults to relative `/api` via Vite proxy in dev).
- CORS is configured in `backend/config/cors.php` to allow `localhost:5173` and `localhost:3000`.
- XAMPP MySQL runs on port 3306 with root/no-password by default.

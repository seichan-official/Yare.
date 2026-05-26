# Yare — Accountability-Based Programming Learning Platform

A full-stack SaaS application that enforces programming study habits through **financial commitment**. Users set a challenge with a monetary stake, prove progress via GitHub commits, and are automatically charged if they fail to meet their goal. Built entirely from scratch — product concept, architecture, and implementation.

---

## Concept

Most people quit learning to code within days. Yare addresses this using **loss aversion psychology**: users pre-register a payment card and set a challenge with a monetary amount (¥500–¥100,000). If they commit enough code to GitHub each day, they pay nothing. If they fall short — the charge goes through automatically.

```
Sign up (GitHub OAuth)
  → Age verification
  → Legal agreement (tamper-proof audit log)
  → Card registration (Stripe SetupIntent)
  → Create a challenge (repo · period · daily commit target · amount)
  → GitHub commits auto-validated daily by background worker
  → Challenge ends → achieved = ¥0 charged / failed = amount captured
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 / TypeScript / Tailwind CSS v4 |
| Backend API | Go / Echo v4 |
| Background Worker | Go (ticker-based, separate process) |
| Database | PostgreSQL / pgx v5 / sqlc |
| Payments | Stripe (SetupIntent + deferred capture) |
| Auth | GitHub OAuth 2.0 + JWT (access + refresh tokens) |
| Email | Resend |
| Deployment | Railway (API and Worker as separate services) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         Next.js 16 (App Router)             │
│  Landing · Auth flow · Dashboard · Challenges│
└──────────────────┬──────────────────────────┘
                   │ REST API (JWT)
┌──────────────────▼──────────────────────────┐
│               Backend API (Go)               │
│  handler → usecase → domain → infrastructure │
│                                              │
│  Auth · Challenges · Payments · Notifications│
│  Agreements · Webhooks (GitHub + Stripe)    │
└──────────┬───────────────────────────────────┘
           │                    │
   ┌───────▼───────┐   ┌────────▼────────┐
   │  PostgreSQL   │   │  Background     │
   │  (pgx + sqlc) │   │  Worker (Go)    │
   └───────────────┘   │                 │
                       │ • Fetch commits  │
                       │ • Validate       │
                       │ • Judge results  │
                       │ • Capture charge │
                       └─────────────────┘
```

### Repository Structure

```
yare/
├── yare-frontend/          # Next.js application
│   ├── app/
│   │   ├── (auth)/         # Onboarding flow (age verify · consent · payment setup)
│   │   ├── (dashboard)/    # Protected: dashboard · challenges · notifications · settings
│   │   └── page.tsx        # Public landing page
│   ├── components/
│   │   ├── dashboard/      # KPI cards · commit calendar · bar chart · achievement ring
│   │   └── layout/         # Topbar · Sidebar
│   └── lib/                # API client · auth helpers · types
│
└── yare-backend/
    ├── cmd/
    │   ├── api/            # HTTP server entrypoint
    │   └── worker/         # Background worker entrypoint
    └── internal/
        ├── domain/         # Core models + error definitions
        ├── usecase/        # Business logic (auth · challenge · payment · judge · commit)
        ├── handler/        # Echo HTTP handlers
        ├── worker/         # Ticker-based job runner
        └── infrastructure/
            ├── db/         # PostgreSQL queries (sqlc-generated)
            ├── github/     # GitHub OAuth + Commit API client
            ├── stripe/     # SetupIntent, PaymentIntent, webhook verification
            ├── email/      # Resend transactional email
            ├── validator/  # Commit validation engine (4-stage pipeline)
            └── crypto/     # AES-256-GCM encryption for sensitive fields
```

---

## Key Engineering Decisions

### Commit Validation Engine (4-stage pipeline)

Every GitHub commit is run through a multi-stage validator before being counted toward the daily goal. This prevents gaming the system with empty or low-quality commits.

| Stage | Check | Result |
|---|---|---|
| Hard reject | Zero additions/deletions | Invalid |
| Hard reject | No files matching target language extensions | Invalid |
| Hard reject | Fewer additions than minimum lines threshold | Invalid |
| Hard reject | >30% repeated characters (padding detection) | Invalid |
| Soft flag | Low Shannon entropy (high compressibility) | Suspicious — manual review |
| Soft flag | Low identifier diversity (generated/copied code) | Suspicious — manual review |
| Soft flag | Commit timestamps within ±5 min of daily pattern | Suspicious — manual review |
| Pass | All checks clear | Valid |

`suspicious` commits enter a manual review queue; the user has 7 days to respond before the day is voided.

### Tamper-Proof Agreement Audit Log

Legal agreements are recorded as a **SHA-256 hash chain**: each user agreement record includes a hash of the previous record, making the history tamper-evident. This is stored on every `POST /agreements` call and cannot be retroactively modified without breaking the chain — important for dispute resolution.

### Stripe SetupIntent + Deferred Capture

Card details are never stored by Yare. During onboarding, a Stripe `SetupIntent` is created; the user's card is tokenized as a `PaymentMethod`. When a challenge fails, the worker creates a `PaymentIntent` referencing that `PaymentMethod` and captures the exact challenge amount. No charge is created unless the challenge is genuinely failed.

### Clean Architecture (Go Backend)

The backend follows strict layer separation:

```
handler → usecase → domain ← infrastructure
```

Handlers only parse HTTP and call usecases. Usecases hold all business logic and depend only on domain interfaces. Infrastructure implements those interfaces (DB, Stripe, GitHub). This means the payment provider, database, or email service can be swapped without touching business logic.

### Separated API + Worker Processes

The background worker runs as a **completely separate Go binary** on Railway. This means:
- The worker can be scaled, restarted, or redeployed independently of the API
- A worker crash does not affect API availability
- Each process has its own environment, concurrency controls, and ticker interval

---

## Core API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/github` | Exchange GitHub OAuth code for JWT pair |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/agreements` | Record legal agreement with hash chain |
| `POST` | `/payment/setup-intent` | Create Stripe SetupIntent for card registration |
| `POST` | `/payment/method` | Save PaymentMethod ID after client-side confirmation |
| `GET` | `/challenges` | List user's challenges |
| `POST` | `/challenges` | Create a new challenge |
| `GET` | `/challenges/:id` | Challenge detail with repositories, progress, commits |
| `GET` | `/challenges/:id/progress` | Daily progress records |
| `GET` | `/challenges/:id/commits` | Raw commits with validation status |
| `GET` | `/notifications` | Notification list with unread count |
| `PATCH` | `/notifications/:id/read` | Mark notification as read |
| `POST` | `/webhook/github` | Receive GitHub push events (HMAC-verified) |
| `POST` | `/webhook/stripe` | Receive Stripe payment events (signature-verified) |
| `GET` | `/health` | Health check |

---

## Frontend Highlights

- **App Router** with route groups for auth flow `(auth)` and dashboard `(dashboard)`, each with their own layout
- **Custom design system** — no UI component library dependency for the core UI; hand-crafted with Tailwind CSS v4 and DM Sans / DM Mono fonts
- **Commit calendar** — GitHub-style heatmap showing daily achievement status across the challenge period
- **Achievement ring** — SVG progress ring showing overall completion percentage
- **Multi-step onboarding** — age verification → legal checkpoints → Stripe card entry (Stripe Elements) → dashboard
- **CSS animations** — staggered fade-up on landing page hero, slide-in for notification lists, hover lift effects on cards

---

## Local Development

### Prerequisites

- Go 1.21+
- Node.js 20+
- PostgreSQL 15+
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI

### Backend

```bash
cd yare-backend
cp .env.example .env          # Fill in DATABASE_URL, JWT_SECRET, GITHUB_*, STRIPE_*, RESEND_API_KEY
make migrate-up               # Run DB migrations
make run-api                  # Start API server on :8080
make run-worker               # Start background worker (separate terminal)
```

### Frontend

```bash
cd yare-frontend
npm install
cp .env.example .env.local    # Set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PK
npm run dev                   # Start dev server on :3000
```

### Backend Commands

```bash
make build        # Compile binaries
make test         # Run tests
make lint         # golangci-lint
make migrate-up   # Apply migrations
make migrate-down # Roll back last migration
make sqlc-gen     # Regenerate sqlc query code
make tidy         # go mod tidy
```

---

## Deployment

Both services are deployed on **Railway** as independent services from the same repository.

- `yare-backend/Dockerfile` — multi-stage build; `CMD` is overridden per service (`api` vs `worker`)
- `railway.toml` — health check path (`/health`) and restart policy configured
- Environment variables managed per-service in Railway's dashboard
- PostgreSQL provisioned as a Railway managed database

---

## What I Built

This is a solo project — every line of code, every product decision, and every infrastructure choice was made by me:

- Defined the product concept and user flow from scratch
- Designed the database schema and migration strategy
- Implemented the entire Go backend (clean architecture, all business logic, all integrations)
- Built the 4-stage commit validation engine with anti-cheat heuristics
- Integrated Stripe SetupIntent flow for card registration without storing card data
- Designed and built the full frontend in Next.js with a hand-crafted design system
- Set up deployment on Railway with API and Worker as separate processes

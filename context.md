# Current Project Context For ChatGPT

Updated: 2026-03-14

This file replaces the older stale context snapshot. It is based on the code and folders currently present in this repository.

Important scope note:
- This document reflects the current source tree and import graph.
- It does not claim a live PostgreSQL state unless that is directly visible in code.
- The backend now contains schema bootstrap code, so the old claim "there is no schema creation step" is no longer accurate.

## What Changed Since The Previous Context

- A Vite + React + TypeScript frontend was added at the repo root:
  - `index.html`
  - `package.json`
  - `vite.config.ts`
  - `tailwind.config.ts`
  - `postcss.config.js`
  - `src/`
- A dashboard API was added:
  - `routers/dashboard_router.py`
  - `services/dashboard/dashboard_service.py`
  - `services/dashboard/summary_service.py`
  - `services/dashboard/gst_analytics_service.py`
  - `services/dashboard/session_service.py`
- Schema bootstrap was added:
  - `database/init_schema.py`
  - `main.py` now calls `create_all_tables()` during startup
- `main.py` now includes `dashboard_router`
- The frontend in `src/` is currently only a placeholder landing page, not a full dashboard client yet
- Local frontend install artifacts now exist in the repo folder:
  - `package-lock.json`
  - `node_modules/`
- Legacy HTML testers still exist under `frontend/` and `frontend - Copy/`

## High-Level Architecture

- Backend runtime: FastAPI
- Frontend runtime: React 18 + TypeScript + Vite + Tailwind
- Upstream GST integration: Sandbox GST HTTP APIs via `requests`
- Database: PostgreSQL via SQLAlchemy async + `asyncpg`
- Session storage model:
  - runtime source of truth = JSON files under `sessions/` plus in-memory state
  - persisted copy = `gst_sessions` table in PostgreSQL

## Current Repository Map

```text
MultiUserGstDashboard/
  database/
    __init__.py
    init_schema.py
    core/
      __init__.py
      base.py
      config.py
      database.py
    migrations_placeholder/
      README.md
    models/
      __init__.py
      client.py
      session.py
    services/
      __init__.py
      gst_return_status/
        __init__.py
        models.py
      gstr1/
        __init__.py
        models.py
      gstr2a/
        __init__.py
        models.py
      gstr2b/
        __init__.py
        models.py
      gstr3b/
        __init__.py
        models.py
      gstr9/
        __init__.py
        models.py
      ledger/
        __init__.py
        models.py
  frontend/
    db_proxy.py
    gst-api-tester.html
    test_fe.html
  frontend - Copy/
    app.js
    index-original.html
    index.html
    style.css
    trial.html
  parsers/
    gstr1_parser.py
  routers/
    __init__.py
    auth_router.py
    dashboard_router.py
    gst_r1_router.py
    gst_return_status_router.py
    gstr_2A_router.py
    gstr_2B_router.py
    gstr_3B_router.py
    gstr_9_router.py
    ledger_router.py
  schemas/
    gstr1.py
  services/
    __init__.py
    auth.py
    gst_return_status_service.py
    gstr1_service.py
    gstr_2A_service.py
    gstr_2B_service.py
    gstr_3B_service.py
    gstr_9_service.py
    ledger_service.py
    session_refresh_manager.py
    dashboard/
      __init__.py
      dashboard_service.py
      gst_analytics_service.py
      session_service.py
      summary_service.py
    save_db/
      __init__.py
      base_saver.py
      save_auth.py
      save_gstr1.py
      save_gstr2a.py
      save_gstr2b.py
      save_gstr3b.py
      save_gstr9.py
      save_ledger.py
      save_return_status.py
  sessions/
    <GSTIN>_session.json
  src/
    App.tsx
    index.css
    main.tsx
    vite-env.d.ts
    pages/
      Index.tsx
  config.py
  index.html
  main.py
  package.json
  package-lock.json
  postcss.config.js
  session_storage.py
  smoke_auth_persistence.py
  tailwind.config.ts
  tsconfig.json
  vite.config.ts
```

## Backend Startup Flow

`main.py` is the application entrypoint.

Startup behavior:
1. `ensure_database_exists()` runs
2. `create_all_tables()` runs
3. background GST session refresh scheduler starts

Shutdown behavior:
1. session refresh scheduler stops

Other startup facts:
- CORS is fully open: origins `*`, methods `*`, headers `*`
- App title: `GST API Service`
- App version: `2.0.0`
- Health endpoint exists at `GET /health`

## Current Backend Routers

Registered in `main.py`:
- `auth_router`
- `gst_r1_router`
- `gstr_2A_router`
- `gstr_2B_router`
- `gstr_3B_router`
- `gstr_9_router`
- `ledger_router`
- `gst_return_status_router`
- `dashboard_router`

### Auth routes

- `POST /auth/generate-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `GET /auth/session/{gstin}`

These use JSON session storage plus DB persistence for saved sessions.

### Dashboard routes

These are new relative to the older context. They are read-only and query PostgreSQL only.

- `GET /dashboard/summary/{gstin}`
  - optional query: `year`, `month`
  - service: `DashboardService.get_summary()`
  - also returns filing status from `DashboardService.get_filing_status()`

- `GET /dashboard/ledger/{gstin}`
  - service: `GstAnalyticsService.get_ledger_analytics()`

- `GET /dashboard/returns/{gstin}`
  - optional query: `year`, `month`
  - service: `SummaryService.get_return_summaries()`

- `GET /dashboard/session/{gstin}`
  - service: `SessionService`
  - returns active sessions, expiry, last refresh

### GSTR-1 routes

- `GET /gstr1/advance-tax/{gstin}/{year}/{month}`
- `GET /gstr1/b2b/{gstin}/{year}/{month}`
- `GET /gstr1/summary/{gstin}/{year}/{month}`
- `GET /gstr1/b2csa/{gstin}/{year}/{month}`
- `GET /gstr1/b2cs/{gstin}/{year}/{month}`
- `GET /gstr1/cdnr/{gstin}/{year}/{month}`
- `GET /gstr1/doc-issue/{gstin}/{year}/{month}`
- `GET /gstr1/hsn/{gstin}/{year}/{month}`
- `GET /gstr1/nil/{gstin}/{year}/{month}`
- `GET /gstr1/b2cl/{gstin}/{year}/{month}`
- `GET /gstr1/cdnur/{gstin}/{year}/{month}`
- `GET /gstr1/exp/{gstin}/{year}/{month}`
- `GET /gstr1/gstr1/{gstin}/{year}/{month}/txp`

### GSTR-2A routes

- `GET /gstr2A/b2b/{gstin}/{year}/{month}`
- `GET /gstr2A/b2ba/{gstin}/{year}/{month}`
- `GET /gstr2A/cdn/{gstin}/{year}/{month}`
- `GET /gstr2A/cdna/{gstin}/{year}/{month}`
- `GET /gstr2A/document/{gstin}/{year}/{month}`
- `GET /gstr2A/isd/{gstin}/{year}/{month}`
- `GET /gstr2A/gstr2a/{gstin}/{year}/{month}/tds`

### GSTR-2B routes

- `GET /gstr2B/gstr2b/{gstin}/{year}/{month}`
- `GET /gstr2B/gstr2b/{gstin}/regenerate/status`

### GSTR-3B routes

- `GET /gstr3B/gstr3b/{gstin}/{year}/{month}`
- `GET /gstr3B/gstr3b/{gstin}/{year}/{month}/auto-liability-calc`

### GSTR-9 routes

- `GET /gstr9/gstr9/{gstin}/auto-calculated`
- `GET /gstr9/gstr9/{gstin}/table-8a`
- `GET /gstr9/gstr9/{gstin}`

### Ledger routes

- `GET /ledgers/ledgers/{gstin}/{year}/{month}/balance`
- `GET /ledgers/ledgers/{gstin}/cash`
- `GET /ledgers/ledgers/{gstin}/itc`
- `GET /ledgers/ledgers/{gstin}/tax/{year}/{month}`

### Return status route

- `GET /return_status/returns/{gstin}/{year}/{month}/status`

### Utility route

- `GET /health`

## Service Layer Overview

### Upstream GST-facing services

These call Sandbox GST APIs and usually persist normalized output through `services/save_db/`.

- `services/auth.py`
- `services/gstr1_service.py`
- `services/gstr_2A_service.py`
- `services/gstr_2B_service.py`
- `services/gstr_3B_service.py`
- `services/gstr_9_service.py`
- `services/ledger_service.py`
- `services/gst_return_status_service.py`

### New dashboard services

These do not call Sandbox APIs. They query PostgreSQL only.

- `services/dashboard/dashboard_service.py`
  - aggregates GSTR-1, GSTR-2A, GSTR-3B, ledger, and filing status data

- `services/dashboard/summary_service.py`
  - dashboard card totals from `gstr1_summary`, `gstr2b`, `gstr3b_details`

- `services/dashboard/gst_analytics_service.py`
  - ledger transaction totals, min/max, balances, grouped monthly cash totals

- `services/dashboard/session_service.py`
  - read-only session queries from `gst_sessions`

## Database Layer

### ORM metadata

- `database/init_schema.py` force-imports all model modules before calling `Base.metadata.create_all()`
- Current metadata table count is 34

### Table groups

Core tables:
- `clients`
- `gst_sessions`

GSTR-1 tables:
- 13 ORM tables

GSTR-2A tables:
- 7 ORM tables

GSTR-2B tables:
- 2 ORM tables

GSTR-3B tables:
- 2 ORM tables

GSTR-9 tables:
- 3 ORM tables

Ledger tables:
- 4 ORM tables

Return status tables:
- 1 ORM table

### DB bootstrap status

Old context was outdated here.

Current code behavior:
- database existence bootstrap: present
- schema auto-creation with `create_all`: present
- migration framework: still absent

So the current gap is not "no schema creation code"; the gap is "no managed migration system."

### Session model

GST session state is still split across:
- JSON files under `sessions/`
- in-memory state in `session_storage.py`
- PostgreSQL rows in `gst_sessions`

Practical implication:
- runtime API auth checks still depend on JSON/in-memory session presence
- dashboard session views read from PostgreSQL

## Frontend Status

The repo now contains a modern frontend shell at the root.

### Stack

- React 18
- TypeScript
- React Router
- Vite
- Tailwind CSS
- `tailwindcss-animate`

### Current `src/` state

- `src/App.tsx`
  - one route: `/`

- `src/pages/Index.tsx`
  - static landing page
  - does not call the backend yet
  - currently displays a simple status card mentioning:
    - 34 ORM tables auto-created on startup
    - OTP auth with 5h30m auto-refresh
    - GSTR and ledger endpoints

- `src/index.css`
  - minimal Tailwind theme variables

### Dev server

- configured in `vite.config.ts`
- host: `::`
- port: `8080`

### Legacy frontend assets still present

- `frontend/gst-api-tester.html`
- `frontend/test_fe.html`
- `frontend/db_proxy.py`
- `frontend - Copy/*`

These are separate from the new Vite app and appear to be older manual/test artifacts.

## Configuration

### Sandbox API config

`config.py` still contains hardcoded defaults for:
- `BASE_URL`
- `SANDBOX_API_KEY`
- `SANDBOX_API_SECRET`
- `SANDBOX_API_VERSION`
- sample `GSTIN`
- sample `USERNAME`

### Database config

`database/core/config.py` currently hardcodes:

`postgresql+asyncpg://postgres:root@localhost:5432/gst_platform`

It does not currently read `DATABASE_URL` from the environment.

## Run Model

Backend:
- start with `uvicorn main:app --reload --host 127.0.0.1 --port 8000`
- requires Python dependencies such as:
  - `fastapi`
  - `uvicorn`
  - `sqlalchemy`
  - `asyncpg`
  - `requests`
  - `pydantic`
- expects PostgreSQL reachable at the hardcoded DSN unless code is changed

Frontend:
- run with `npm.cmd install`
- then `npm.cmd run dev`
- Vite serves on `http://localhost:8080`

PowerShell note:
- use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`

## Known Issues And Caveats

These are still relevant in the current code:

- `config.py` contains hardcoded Sandbox credentials and sample identity values
- `database/core/config.py` hardcodes PostgreSQL DSN and ignores env-based DB URL configuration
- there is still no Alembic setup or migration history
- many async service functions still use blocking `requests`
- route contracts still include duplicated or awkward path segments:
  - `/gstr1/gstr1/.../txp`
  - `/gstr2A/gstr2a/.../tds`
  - `/gstr9/gstr9/...`
  - `/ledgers/ledgers/...`
- persistence failures are intentionally swallowed in `run_persistence()` for connectivity issues, so API success does not guarantee DB success
- `save_ledger_to_db()` still inserts the same `transactions` rows into cash, ITC, and liability ledger tables
- `save_gstr3b_to_db()` still stores `auto_liability` inside general detail rows and again in the dedicated auto-liability table
- `save_gstr2a_to_db()` still has overlapping document/section persistence behavior
- `get_or_create_client_id()` normalizes GSTIN by trimming whitespace only, not full uppercase normalization
- the new React frontend is still a placeholder and does not yet consume the backend APIs
- there is no Python dependency manifest in the repo root (`requirements.txt` or `pyproject.toml` is absent)
- `frontend/db_proxy.py` is still dangerous outside local-only development because it exposes SQL over HTTP

## Guidance For Another AI

If another AI is asked to work on this repo, it should assume:

- the backend is a real FastAPI GST service with both upstream API routes and local dashboard routes
- the new frontend exists, but it is only a starting shell
- exact backend route paths must be preserved unless the user explicitly requests a route cleanup
- dashboard endpoints read only from PostgreSQL
- non-dashboard GST endpoints depend on an active GST session in JSON/in-memory storage
- schema auto-creation now exists, but migration tooling still needs to be added

Priority order for meaningful improvements:
1. Move hardcoded config to environment-driven settings
2. Add a proper Python dependency manifest
3. Add Alembic migrations
4. Build the real React dashboard against `/dashboard/*` and the GST endpoints
5. Replace blocking `requests` with an async HTTP client
6. Clean up saver-layer data pollution and duplication
7. Align session source of truth between JSON runtime state and PostgreSQL

## One-Paragraph Summary

This repository is now a combined FastAPI + PostgreSQL backend and Vite/React frontend shell for a multi-user GST dashboard. Compared with the older context snapshot, the important additions are the new React app under `src/`, the new read-only dashboard API under `/dashboard/*`, and schema bootstrap via `database/init_schema.py` plus `create_all_tables()` in startup. The backend still uses hardcoded config, still lacks migrations, still stores runtime auth state in JSON files, and still has several saver-layer and route-shape issues, but it is no longer accurate to describe it as a backend with no schema creation step or no frontend structure.

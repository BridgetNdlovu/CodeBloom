# Uncommon CodeBloom — Frontend

React 19 + TypeScript + Vite frontend for the Uncommon CodeBloom learning platform.

All learner, instructor and admin data is loaded from the ASP.NET Core API. There is no
mock/demo data layer in the frontend: missions, progress, achievements, classes,
assignments and statistics come from SQL Server through the API.

## Technology stack

- React 19 with TypeScript
- Vite
- React Router v7
- Blockly (visual block programming)
- Framer Motion (animations)
- Lucide React (icons)

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- Backend API running — see `../uncommon-code-bloom-api/README.md`
- SQL Server Express with the `UncommonCodeBloom_Dev` database migrated and seeded

## Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure the API URL

Copy `.env.example` to `.env.local` and confirm the backend URL:

```powershell
copy .env.example .env.local
```

For local development, `.env.example` uses
`VITE_API_BASE_URL=http://localhost:5202`. This local URL is never used as a
production fallback. A production build requires an explicit HTTPS API URL.

The API must allow the frontend origin through CORS. The checked-in backend
configuration allows only the local Vite origins.

### Deploying the frontend to Vercel

The Vercel frontend cannot reach `localhost:5202`. Publish the ASP.NET Core API to
your Somee Windows/IIS website, configure its SQL connection using the database
endpoint from the Somee control panel, and then set the public API URL in Vercel.
Somee's current Windows plan information lists ASP.NET Core 10; the API is published
as a folder, not as the local Docker image. See the backend README for publish,
configuration and database migration instructions. Do not share Somee passwords or
database credentials in chat. In the Vercel project, open
**Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://codebloom-api.somee.com` (after `/health` is reachable) |

Set the value to the Somee HTTPS hostname without `/api`. Select
**Production** (and **Preview** if preview deployments should use the API), save, then
trigger a new Vercel deployment. Vite embeds `VITE_*` variables at build time.
If the value is missing, malformed, HTTP-only, or points to localhost, the deployed
app now displays a configuration error instead of silently calling a local URL.
The older message `Could not reach the CodeBloom API at http://localhost:5202`
comes from a bundle that still attempts the request, so it indicates an older
deployment or cached page rather than the current production URL guard.
Verify that opening `https://codebloom-api.somee.com/health` returns a healthy
response before switching Vercel. The account dashboard reports the site and SSL
as active, but an external check on 2026-11-06 resolved the hostname and had its
HTTPS connection reset, so public API readiness is not confirmed yet.

The API host must allow the exact Vercel frontend origin via
`Cors:AllowedOrigins` (environment variable `Cors__AllowedOrigins__0`); make sure the
production configuration includes the deployed frontend origin and does not rely on
the local-only origins from the base settings. Since
authentication uses credentialed HttpOnly cookies, HTTPS and compatible cookie
same-site behavior are also required. Prefer hosting the frontend and API on
same-site custom domains (such as `app.example.com` and `api.example.com`); unrelated
domains can have cross-site cookies blocked by browsers.

If the live site still shows `Could not reach the CodeBloom API at
http://localhost:5202`, it is serving an old frontend bundle. Check Vercel's
Production `VITE_API_BASE_URL`, ensure the latest deployment is Ready and attached
to the production domain, redeploy, then hard-refresh or try a private window. The
current frontend rejects localhost before making a request.

The API host connects to Somee SQL Server using the private values from your Somee
panel. The hostname supplied for this deployment is
`https://codebloom-api.somee.com`; the SQL endpoint and credentials are available
only in your Somee panel. Do not guess or send them in chat. For cookie-based login across
the default Vercel and Somee domains, the API can set `Auth__CookieSameSite=None`
over HTTPS, but browser third-party-cookie restrictions may still block login.
Same-site custom domains for frontend and API are more reliable.

For local development only, the API README retains Docker instructions. Somee shared
hosting uses Windows/IIS folder publishing; do not upload the Docker image there.

### 3. Run the development server

```powershell
npm run dev
```

The frontend is available at `http://localhost:5173`.

### 4. Build for production

```powershell
npm run build
```

This runs `tsc -b && vite build`. The build currently succeeds with no TypeScript
errors; Vite reports only a bundle-size warning.

### 5. Lint

```powershell
npm run lint
```

## Authentication and roles

- Login accepts either an email address or a username.
- Registration offers **Student** or **Instructor**; admin accounts are created by
  promoting an existing account from the admin dashboard.
- The JWT is delivered in the HttpOnly cookie `cb_token`; it is never stored in
  `localStorage` or readable from JavaScript.
- Role-aware routing is strict:
  - student routes: `/app`, `/app/missions`, `/app/game/:missionId`,
    `/app/assignments`, `/app/projects`, `/app/achievements`, `/app/progress`,
    `/app/join-class`, `/app/profile`, `/app/settings`
  - instructor routes: `/app/instructor`, `/app/instructor/classes`,
    `/app/instructor/classes/create`, `/app/instructor/classes/:classId`,
    `/app/instructor/assignments`, `/app/instructor/assignments/create`,
    `/app/instructor/assignments/:assignmentId/submissions`,
    `/app/instructor/reports`
  - admin route: `/app/admin`
- Unauthorized API responses redirect to `/login`; wrong-role pages show an
  "Access denied" screen instead of the page content.

## Feature map

| Area | Where | Data source |
|------|-------|-------------|
| Student dashboard | `features/dashboard/Dashboard.tsx` | `GET /api/students/me/dashboard` |
| Mission map | `features/missions/MissionMap.tsx` | `GET /api/missions/map` |
| Mission gameplay | `components/game/CodingGame.tsx` | mission config + progress endpoints |
| Assignments | `features/assignments/StudentAssignments.tsx` | `/api/student/assignments` |
| Achievements | `features/achievements/Achievements.tsx` | `GET /api/achievements/me` |
| Progress | `features/progress/Progress.tsx` | progress records + dashboard + map |
| Projects | `features/projects/*` | `/api/projects/*` |
| Profile / Settings | `features/profile`, `features/settings` | student profile + preferences |
| Instructor tools | `features/instructor/*` | `/api/instructor/*` |
| Admin tools | `features/admin/AdminDashboard.tsx` | `/api/admin/*` |

Mission gameplay is driven by the backend mission `ConfigJson`: grid size, start and
goal positions, obstacles, available blocks, optimal block count and hints. The
`repeat` block is expanded into flat `move` / `turn_left` / `turn_right` commands
before the program is sent to the server, because the backend mission engine executes
flat command lists. Scores, points, achievements and the next unlocked mission all
come from the server response; the UI does not invent rewards.

## Project structure

```
src/
  components/
    ai/             — Bloom's Coach AI panel (backend-only API calls)
    character/      — Character illustrations
    game/           — Blockly game player, garden board, block setup
    layout/         — AppShell, RequireAuth, RequireRole, sidebar, topbar
    ui/             — Button, inputs, Badge, ProgressBar, EmptyState
  context/          — AuthContext, ToastContext
  features/
    achievements/   — Achievement catalogue
    admin/          — Admin dashboard (users, missions, settings, analytics)
    app/            — Role-aware dashboard selector
    assignments/    — Student assignments
    auth/           — Login, Register
    dashboard/      — Student dashboard
    instructor/     — Instructor dashboard, classes, assignments, grading, reports
    landing/        — Public landing page
    missions/       — Mission map
    profile/        — Profile page
    progress/       — Progress page
    projects/       — Projects list and editor
    settings/       — Settings page
  services/         — apiClient, authService, progressService, aiService
  styles/           — CSS tokens and component styles
  types/            — TypeScript domain types
```

The former demo scaffolding (`src/data/mock.ts`, `src/services/missionService.ts`,
`src/services/persistence/localPersistence.ts`) has been removed. No component imports
local mock data or persists learner progress in browser storage.

## Backend API

The frontend expects the ASP.NET Core Web API at `VITE_API_BASE_URL` (local
development default `http://localhost:5202`; production requires an explicit HTTPS
URL). See `../uncommon-code-bloom-api/README.md` for database, migration, launch and
configuration instructions.

## Current limitations

- **AI assistant:** the UI shows an honest "not configured" message unless the
  backend has a real Gemini API key. No key is shipped in this repository.
- **Python execution:** disabled. The Python Discovery Lab pages describe the
  concept, but `/api/python/run` returns `available: false` until an isolated runner
  is configured.
- **Tests:** the frontend has no automated test framework configured; the build and
  manual/HTTP end-to-end verification are the current checks.
- See `../DEVELOPMENT_STATUS.md` for verification evidence and remaining work.

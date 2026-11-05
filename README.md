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

Default: `VITE_API_BASE_URL=http://localhost:5202`

The API must allow the frontend origin through CORS. The checked-in backend
configuration allows `http://localhost:5173` and `http://127.0.0.1:5173`.

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

The frontend expects the ASP.NET Core Web API at `VITE_API_BASE_URL`
(default `http://localhost:5202`). See `../uncommon-code-bloom-api/README.md` for
database, migration, launch and configuration instructions.

## Current limitations

- **AI assistant:** the UI shows an honest "not configured" message unless the
  backend has a real Gemini API key. No key is shipped in this repository.
- **Python execution:** disabled. The Python Discovery Lab pages describe the
  concept, but `/api/python/run` returns `available: false` until an isolated runner
  is configured.
- **Tests:** the frontend has no automated test framework configured; the build and
  manual/HTTP end-to-end verification are the current checks.
- See `../DEVELOPMENT_STATUS.md` for verification evidence and remaining work.

## Deploying the frontend to Vercel

This repository contains the React/Vite frontend. Authentication, registration, learner records and progress require the separate ASP.NET Core API and SQL Server database described above; Vercel does not host that backend or database automatically.

1. Import `BridgetNdlovu/CodeBloom` into Vercel and use the repository root as the project root.
2. Set the build command to `npm run build` and the output directory to `dist` (the install command is `npm install`).
3. In Vercel Project Settings → Environment Variables, set `VITE_API_BASE_URL` to the public HTTPS base URL of the deployed CodeBloom ASP.NET Core API. Do not use `localhost` for a production deployment. Redeploy after changing this variable. The frontend defaults to `http://localhost:5202` only for local development.
4. Configure the API's CORS policy to allow the Vercel production domain and credentials. If the API uses the `cb_token` HttpOnly cookie across different sites, its cookie settings must support secure cross-site use (`Secure` and `SameSite=None`), and the API must allow credentialed requests. Keep secrets such as the Gemini key on the backend, never in `VITE_*` variables.
5. Check the Vercel deployment build log and test `/login` and `/register` against the deployed API. A successful frontend deployment alone does not confirm API, database, or authentication availability.

`vercel.json` rewrites client-side routes to the Vite app so direct navigation and refreshes on routes such as `/login` and `/app` load the application correctly.

### Registration and accounts

The registration screen supports student and instructor roles. Accounts are created through `POST /api/auth/register`; login uses `POST /api/auth/login` and the backend-issued HttpOnly `cb_token` cookie. User creation, role validation, password hashing, duplicate prevention, and database persistence are backend responsibilities. Ensure the API is reachable and configured as above; the frontend deliberately does not create local or demo accounts when the API is unavailable.

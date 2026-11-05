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

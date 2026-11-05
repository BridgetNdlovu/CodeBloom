import { createBrowserRouter, RouterProvider } from "react-router-dom";
import type { ReactElement } from "react";
import { Landing } from "./features/landing/Landing";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { MissionMap } from "./features/missions/MissionMap";
import { CodingGame } from "./components/game/CodingGame";
import { Achievements } from "./features/achievements/Achievements";
import { Projects } from "./features/projects/Projects";
import { ProjectEditor } from "./features/projects/ProjectEditor";
import { Progress } from "./features/progress/Progress";
import { Profile } from "./features/profile/Profile";
import { Settings } from "./features/settings/Settings";
import { StudentAssignments } from "./features/assignments/StudentAssignments";
import { NotFound } from "./features/NotFound";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/layout/RequireAuth";
import { RequireRole } from "./components/layout/RequireRole";
import { AppDashboard } from "./features/app/AppDashboard";
import { InstructorDashboard } from "./features/instructor/InstructorDashboard";
import { InstructorClasses } from "./features/instructor/InstructorClasses";
import { CreateClass } from "./features/instructor/CreateClass";
import { InstructorClassDetail } from "./features/instructor/InstructorClassDetail";
import { InstructorAssignments } from "./features/instructor/InstructorAssignments";
import { CreateAssignment } from "./features/instructor/CreateAssignment";
import { InstructorSubmissions } from "./features/instructor/InstructorSubmissions";
import { InstructorReports } from "./features/instructor/InstructorReports";
import { JoinClass } from "./features/instructor/JoinClass";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { GameLibrary } from "./features/games/GameLibrary";
import { GamePlayer } from "./features/games/GamePlayer";
import { GameStudio } from "./features/games/GameStudio";
import type { UserRole } from "./types";

const STUDENT_ROLES: UserRole[] = ["student"];
const INSTRUCTOR_ROLES: UserRole[] = ["instructor"];
const ADMIN_ROLES: UserRole[] = ["admin"];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <AppDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "missions",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <MissionMap />
          </RequireRole>
        ),
      },
      {
        path: "game/:missionId",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <CodingGame />
          </RequireRole>
        ),
      },
      {
        path: "assignments",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <StudentAssignments />
          </RequireRole>
        ),
      },
      {
        path: "achievements",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <Achievements />
          </RequireRole>
        ),
      },
      {
        path: "projects",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <Projects />
          </RequireRole>
        ),
      },
      {
        path: "projects/new",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <ProjectEditor />
          </RequireRole>
        ),
      },
      {
        path: "projects/:projectId",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <ProjectEditor />
          </RequireRole>
        ),
      },
      {
        path: "studio",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <GameStudio />
          </RequireRole>
        ),
      },
      {
        path: "studio/:projectId",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <GameStudio />
          </RequireRole>
        ),
      },
      {
        path: "games",
        element: (
          <RequireAuth>
            <GameLibrary />
          </RequireAuth>
        ),
      },
      {
        path: "games/:gameId",
        element: (
          <RequireAuth>
            <GamePlayer />
          </RequireAuth>
        ),
      },
      {
        path: "progress",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <Progress />
          </RequireRole>
        ),
      },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireAuth>
            <Settings />
          </RequireAuth>
        ),
      },
      {
        path: "join-class",
        element: (
          <RequireRole allowedRoles={STUDENT_ROLES}>
            <JoinClass />
          </RequireRole>
        ),
      },
      {
        path: "instructor",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorDashboard />
          </RequireRole>
        ),
      },
      {
        path: "instructor/classes",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorClasses />
          </RequireRole>
        ),
      },
      {
        path: "instructor/classes/create",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <CreateClass />
          </RequireRole>
        ),
      },
      {
        path: "instructor/classes/:classId",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorClassDetail />
          </RequireRole>
        ),
      },
      {
        path: "instructor/assignments",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorAssignments />
          </RequireRole>
        ),
      },
      {
        path: "instructor/assignments/create",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <CreateAssignment />
          </RequireRole>
        ),
      },
      {
        path: "instructor/assignments/:assignmentId/submissions",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorSubmissions />
          </RequireRole>
        ),
      },
      {
        path: "instructor/reports",
        element: (
          <RequireRole allowedRoles={INSTRUCTOR_ROLES}>
            <InstructorReports />
          </RequireRole>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireRole allowedRoles={ADMIN_ROLES}>
            <AdminDashboard />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export function AppRoutes(): ReactElement {
  return <RouterProvider router={router} />;
}

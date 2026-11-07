/* eslint-disable react-refresh/only-export-components -- Navigation metadata is shared with TopBar. */
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Compass,
  Gamepad2,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  Sprout,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CharacterAvatar } from "../character/Character";
import type { UserRole } from "../../types";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const STUDENT_ITEMS: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/missions", label: "Explore Missions", icon: Compass },
  { to: "/app/games", label: "Game Library", icon: Gamepad2 },
  { to: "/app/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/app/projects", label: "My Projects", icon: Sprout },
  { to: "/app/achievements", label: "Achievements", icon: Trophy },
  { to: "/app/progress", label: "My Progress", icon: LineChart },
];

const INSTRUCTOR_ITEMS: NavItem[] = [
  { to: "/app/instructor", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/instructor/classes", label: "Classes", icon: Users },
  { to: "/app/instructor/assignments", label: "Assignments", icon: BookOpen },
  { to: "/app/instructor/reports", label: "Reports", icon: BarChart3 },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: "/app/admin", label: "Administration", icon: ShieldCheck, end: true },
];

export const APP_NAV_ITEMS = STUDENT_ITEMS;

export function navItemsForRole(role: UserRole | undefined): NavItem[] {
  if (role === "instructor") return INSTRUCTOR_ITEMS;
  if (role === "admin") return ADMIN_ITEMS;
  return STUDENT_ITEMS;
}

export function roleLabel(role: UserRole | undefined): string {
  if (role === "instructor") return "Instructor";
  if (role === "admin") return "Administrator";
  return "Student";
}

export function DesktopSidebar() {
  const { learner } = useAuth();
  const items = navItemsForRole(learner?.role);

  return (
    <aside className="cb-sidebar" aria-label="Primary">
      <NavLink to="/app" className="cb-sidebar-brand">
        <span className="cb-brand-mark" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 8L3 12L7 16"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 8L17 12L13 16"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="cb-brand-text">
          <strong>CodeBloom</strong>
          <small>Uncommon Dot Org</small>
        </span>
      </NavLink>

      <nav className="cb-sidebar-nav" aria-label={roleLabel(learner?.role)}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `cb-sidebar-link${isActive ? " active" : ""}`
            }
          >
            <item.icon size={20} aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `cb-sidebar-link${isActive ? " active" : ""}`
          }
        >
          <Settings size={20} aria-hidden />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="cb-sidebar-footer">
        <CharacterAvatar
          character={learner?.character ?? "girl"}
          name={learner?.displayName}
          size={44}
        />
        <div className="cb-sidebar-user">
          <strong>{learner?.displayName ?? "Coder"}</strong>
          <small>{roleLabel(learner?.role)}</small>
        </div>
      </div>
    </aside>
  );
}

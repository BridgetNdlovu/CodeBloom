import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Compass,
  Gamepad2,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface MobileItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const STUDENT_ITEMS: MobileItem[] = [
  { to: "/app", label: "Home", icon: LayoutDashboard },
  { to: "/app/missions", label: "Missions", icon: Compass },
  { to: "/app/games", label: "Games", icon: Gamepad2 },
  { to: "/app/assignments", label: "Tasks", icon: ClipboardList },
  { to: "/app/projects", label: "Projects", icon: Sprout },
  { to: "/app/progress", label: "Progress", icon: LineChart },
];

const INSTRUCTOR_ITEMS: MobileItem[] = [
  { to: "/app/instructor", label: "Home", icon: LayoutDashboard },
  { to: "/app/instructor/classes", label: "Classes", icon: Users },
  { to: "/app/instructor/assignments", label: "Tasks", icon: BookOpen },
  { to: "/app/instructor/reports", label: "Reports", icon: BarChart3 },
];

const ADMIN_ITEMS: MobileItem[] = [
  { to: "/app/admin", label: "Admin", icon: ShieldCheck },
];

function itemsForRole(role: string | undefined): MobileItem[] {
  if (role === "instructor") return INSTRUCTOR_ITEMS;
  if (role === "admin") return ADMIN_ITEMS;
  return STUDENT_ITEMS;
}

export function MobileNavigation() {
  const { learner } = useAuth();
  const items = itemsForRole(learner?.role);

  return (
    <nav className="cb-mobile-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/app" || item.to === "/app/instructor" || item.to === "/app/admin"}
          className={({ isActive }) => `cb-mobile-nav-link${isActive ? " active" : ""}`}
        >
          <item.icon size={22} aria-hidden />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

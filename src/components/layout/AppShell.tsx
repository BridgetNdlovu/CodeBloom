import { Outlet, useLocation } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { TopBar } from "./TopBar";

export function AppShell() {
  const location = useLocation();
  const isAppRoute =
    location.pathname === "/app" || location.pathname.startsWith("/app/");

  if (!isAppRoute) {
    return <Outlet />;
  }

  return (
    <div className="cb-app-shell">
      <DesktopSidebar />
      <div className="cb-app-body">
        <TopBar />
        <main className="cb-app-main" id="main-content">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

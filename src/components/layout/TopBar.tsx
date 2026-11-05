import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CharacterAvatar } from "../character/Character";
import { navItemsForRole, roleLabel } from "./DesktopSidebar";
import { useToast } from "../../context/ToastContext";

export function TopBar() {
  const { learner, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = navItemsForRole(learner?.role);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    toast("You have been signed out. See you soon!");
    navigate("/");
  };

  return (
    <header className="cb-topbar">
      <NavLink to="/app" className="cb-topbar-brand" aria-label="CodeBloom home">
        <span className="cb-brand-mark" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 8L3 12L7 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 8L17 12L13 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="cb-brand-text">
          <strong>CodeBloom</strong>
        </span>
      </NavLink>

      <div className="cb-topbar-actions">
        <span className="cb-muted cb-hide-sm" style={{ fontSize: "0.85rem" }}>
          {learner?.displayName} · {roleLabel(learner?.role)}
        </span>
        <CharacterAvatar character={learner?.character ?? "girl"} name={learner?.displayName} size={38} />
        <button
          type="button"
          className="cb-icon-btn cb-topbar-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav className="cb-mobile-menu" aria-label="Mobile menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `cb-mobile-menu-link${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/app/profile"
            className={({ isActive }) => `cb-mobile-menu-link${isActive ? " active" : ""}`}
            onClick={() => setOpen(false)}
          >
            My Profile
          </NavLink>
          <NavLink
            to="/app/settings"
            className={({ isActive }) => `cb-mobile-menu-link${isActive ? " active" : ""}`}
            onClick={() => setOpen(false)}
          >
            Settings
          </NavLink>
          <button type="button" className="cb-mobile-menu-link" onClick={() => void handleSignOut()}>
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </nav>
      ) : null}
    </header>
  );
}

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/inputs";
import { useAuth } from "../../context/AuthContext";

type Role = "student" | "instructor" | "admin";

export function RequireRole({ children, allowedRoles }: { children: ReactNode; allowedRoles: Role[] }) {
  const { learner, loading } = useAuth();

  if (loading) {
    return (
      <div className="cb-page">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <LoadingState label="Loading your adventure…" />
        </div>
      </div>
    );
  }

  if (!learner) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(learner.role as Role)) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <h2>Access denied</h2>
            <p className="cb-body-text">
              Your account does not have permission to view this page. If you believe this is an error,
              please contact support.
            </p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => window.location.reload()}>Return Home</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

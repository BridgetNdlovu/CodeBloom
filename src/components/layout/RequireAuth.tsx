import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../ui/inputs";

export function RequireAuth({ children }: { children: ReactNode }) {
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

  return <>{children}</>;
}

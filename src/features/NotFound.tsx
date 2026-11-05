import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="cb-page">
      <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem" }}>404</h1>
        <h2>Hmm, this path didn't bloom.</h2>
        <p className="cb-body-text">The page you're looking for doesn't exist or has moved.</p>
        <div className="cb-hero-actions" style={{ justifyContent: "center" }}>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
          <Button variant="secondary" onClick={() => navigate("/app")}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}

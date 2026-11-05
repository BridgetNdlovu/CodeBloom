import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, PageHeader, TextInput } from "../../components/ui/inputs";
import { joinClass } from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

export function JoinClass() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (joinCode.trim().length < 1) next.joinCode = "Please enter a join code.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await joinClass(joinCode.trim().toUpperCase());
      navigate("/app/assignments");
    } catch (err) {
      const error = toAuthError(
        err,
        "Unable to join class. Please check the code and try again.",
      );
      if (error.status === 404) {
        setFormError("That join code was not found. Ask your instructor for the current code.");
      } else if (error.status === 409) {
        setFormError("You are already a member of this class.");
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cb-page-pad">
      <div className="cb-container" style={{ maxWidth: 500 }}>
        <PageHeader
          title="Join a Class"
          subtitle="Enter the join code shared by your instructor."
          actions={
            <Link to="/app/assignments" className="cb-btn cb-btn-secondary cb-btn-sm">
              <ArrowLeft size={16} aria-hidden /> Back to assignments
            </Link>
          }
        />

        <div className="cb-card cb-card-pad" style={{ marginBottom: "var(--cb-space-6)" }}>
          <p className="cb-body-text" style={{ marginBottom: 0, fontSize: "0.9rem" }}>
            Ask your instructor for the class join code. After joining, their assignments will
            appear in <Link to="/app/assignments">My Assignments</Link>.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Field label="Join code" required error={errors.joinCode}>
            <TextInput
              id="join-code"
              name="joinCode"
              autoComplete="off"
              inputMode="text"
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              style={{
                fontFamily: "var(--cb-font-mono)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            />
          </Field>

          {formError ? <ErrorMessage message={formError} /> : null}

          <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-6)" }}>
            <Button type="submit" size="lg" loading={submitting} disabled={submitting}>
              <Users size={18} aria-hidden />
              Join Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, PasswordInput, TextInput } from "../../components/ui/inputs";
import { CharacterIllustration } from "../../components/character/Character";
import { GoogleMark } from "../../components/auth/GoogleMark";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { AuthError } from "../../services/authService";
import { firebaseConfigured } from "../../services/firebase";
import { LoadingState } from "../../components/ui/inputs";

export function Login() {
  const navigate = useNavigate();
  const { learner, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ usernameOrEmail?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Covers the redirect-based Google flow and already-signed-in visitors.
  useEffect(() => {
    if (learner) navigate("/app", { replace: true });
  }, [learner, navigate]);

  const validate = (): boolean => {
    const next: { usernameOrEmail?: string; password?: string } = {};
    if (usernameOrEmail.trim().length < 1) next.usernameOrEmail = "Please enter your email or username.";
    if (password.length < 1) next.password = "Please enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) {
      setFormError("Please check your details and try again.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ usernameOrEmail, password });
      toast("Welcome back! Ready to code?");
      navigate("/app");
    } catch (error) {
      const message =
        error instanceof AuthError
          ? error.message
          : "We could not sign you in. Please check your details.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(undefined);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : "Google sign-in could not be completed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="cb-page">
      <header className="cb-landing-header">
        <div className="cb-container cb-landing-header-inner">
          <span className="cb-brand-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 8L3 12L7 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 8L17 12L13 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="cb-flex">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign In</Button>
            <Button onClick={() => navigate("/register")}>Get Started</Button>
          </div>
        </div>
      </header>

      <div className="cb-auth-layout">
        <div className="cb-auth-panel">
          <div className="cb-auth-card">
            <h1>Welcome back, coder!</h1>
            <p className="cb-body-text">Ready to discover something new today?</p>

            {submitting ? (
              <LoadingState label="Signing you in…" />
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                <Field label="Email or username" required error={errors.usernameOrEmail}>
                  <TextInput
                    id="login-username-or-email"
                    name="usernameOrEmail"
                    autoComplete="username"
                    leadingIcon={<Mail size={18} aria-hidden />}
                    placeholder="e.g. maya@school.edu or mayabloom"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                  />
                </Field>
                <Field label="Password" required error={errors.password}>
                  <PasswordInput
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    leadingIcon={<Lock size={18} aria-hidden />}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                {formError ? <ErrorMessage message={formError} /> : null}

                <Button type="submit" size="lg" fullWidth loading={submitting}>
                  Sign In
                </Button>
              </form>
            )}

            {firebaseConfigured ? (
              <>
                <div className="cb-auth-divider" aria-hidden>
                  <span>or</span>
                </div>
                <button
                  type="button"
                  className="cb-google-button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={googleLoading || submitting}
                >
                  <GoogleMark />
                  {googleLoading ? "Connecting to Google…" : "Continue with Google"}
                </button>
                <p className="cb-auth-note">
                  Students can sign in with Google. Existing instructor and administrator
                  accounts keep the role assigned in CodeBloom.
                </p>
              </>
            ) : null}

            <p className="cb-auth-alt">
              New to CodeBloom? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>

        <aside className="cb-auth-side">
          <CharacterIllustration character="girl" />
          <h2>Your garden is waiting, coder.</h2>
          <p>Sign in to continue your adventure with Bloom.</p>
        </aside>
      </div>
    </div>
  );
}

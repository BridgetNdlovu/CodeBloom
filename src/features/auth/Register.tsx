import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Mail, ShieldCheck, User, Lock, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, PasswordInput, TextInput } from "../../components/ui/inputs";
import { CharacterIllustration } from "../../components/character/Character";
import { GoogleMark } from "../../components/auth/GoogleMark";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { AuthError } from "../../services/authService";
import { firebaseConfigured } from "../../services/firebase";
import type { CharacterPreference, AgeGroup } from "../../types";

const AGE_GROUPS: Array<{ value: AgeGroup; label: string }> = [
  { value: "3-5", label: "3–5 years" },
  { value: "6-8", label: "6–8 years" },
  { value: "9-12", label: "9–12 years" },
];

type AccountType = "student" | "instructor";

export function Register() {
  const navigate = useNavigate();
  const { learner, register, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountType>("student");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [character, setCharacter] = useState<CharacterPreference>("girl");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Covers the redirect-based Google flow and already-signed-in visitors.
  useEffect(() => {
    if (learner) navigate("/app", { replace: true });
  }, [learner, navigate]);

  const selectAccountType = (type: AccountType) => {
    setAccountType(type);
    setFormError(undefined);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (displayName.trim().length < 2) next.displayName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username.trim())) next.username = "3–16 letters, numbers or _.";
    if (password.length < 6) next.password = "Use at least 6 characters.";
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    if (accountType === "student" && !ageGroup) next.ageGroup = "Please choose an age group.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) {
      setFormError("A few details still need attention. Check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        displayName,
        username,
        email,
        password,
        role: accountType,
        character,
        ageGroup: ageGroup as AgeGroup,
      });
      toast("Welcome to CodeBloom! Your account has been created.");
      navigate("/app");
    } catch (error) {
      const message =
        error instanceof AuthError ? error.message : "We could not create your account. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError(undefined);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast("Welcome to CodeBloom! You can personalise your character in Profile.");
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : "Google sign-up could not be completed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const isStudent = accountType === "student";

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
            <div className="cb-register-header">
              <h1>Let's grow your coding journey!</h1>
              <p className="cb-body-text">Create your account and get ready to explore.</p>
            </div>

            <section className="cb-account-type-picker">
              <h2 className="cb-account-type-question">How will you use CodeBloom?</h2>
              <div className="cb-account-type-cards">
                <button
                  type="button"
                  className={`cb-account-card${accountType === "student" ? " selected" : ""}`}
                  onClick={() => selectAccountType("student")}
                  aria-checked={accountType === "student"}
                >
                  <div className="cb-account-card-icon">
                    <CharacterIllustration character="girl" style={{ maxHeight: 64 }} />
                  </div>
                  <h3>Student</h3>
                  <p className="cb-account-card-description">
                    Explore coding worlds, complete missions, learn Python and grow your coding skills.
                  </p>
                  <span className="cb-account-card-check">
                    {accountType === "student" ? <Check size={18} aria-hidden /> : null}
                  </span>
                </button>

                <button
                  type="button"
                  className={`cb-account-card${accountType === "instructor" ? " selected" : ""}`}
                  onClick={() => selectAccountType("instructor")}
                  aria-checked={accountType === "instructor"}
                >
                  <div className="cb-account-card-icon">
                    <ShieldCheck size={32} strokeWidth={2.5} />
                  </div>
                  <h3>Instructor</h3>
                  <p className="cb-account-card-description">
                    Create classes, guide learners, assign missions and monitor learning progress.
                  </p>
                  <span className="cb-account-card-check">
                    {accountType === "instructor" ? <Check size={18} aria-hidden /> : null}
                  </span>
                </button>
              </div>
              <p className="cb-account-type-hint">
                You can switch account types at any time before creating your account.
              </p>
            </section>

            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
              <Field label="Full name" required error={fieldError("displayName")}>
                <TextInput
                  id="reg-display-name"
                  name="displayName"
                  autoComplete="name"
                  placeholder="e.g. Maya Bloom"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </Field>

              <Field label="Email address" required error={fieldError("email")}>
                <TextInput
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  leadingIcon={<Mail size={18} aria-hidden />}
                  placeholder="e.g. maya@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Username" required error={fieldError("username")}>
                <TextInput
                  id="reg-username"
                  name="username"
                  autoComplete="username"
                  leadingIcon={<User size={18} aria-hidden />}
                  placeholder="e.g. mayabloom"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>

              {isStudent ? (
                <>
                  <Field label="Age group" required error={fieldError("ageGroup")}>
                    <div className="cb-char-options" style={{ gridTemplateColumns: "1fr", gap: "var(--cb-space-2)" }}>
                      {AGE_GROUPS.map((g) => (
                        <label
                          key={g.value}
                          className={`cb-char-option${ageGroup === g.value ? " selected" : ""}`}
                          style={{ flexDirection: "row", justifyContent: "flex-start", gap: "var(--cb-space-3)", padding: "0.8rem 1rem" }}
                        >
                          <input
                            type="radio"
                            name="ageGroup"
                            value={g.value}
                            checked={ageGroup === g.value}
                            onChange={() => setAgeGroup(g.value)}
                            style={{ width: 18, height: 18 }}
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Choose your character">
                    <div className="cb-char-options" role="radiogroup" aria-label="Character preference">
                      <button
                        type="button"
                        className={`cb-char-option${character === "girl" ? " selected" : ""}`}
                        onClick={() => setCharacter("girl")}
                        role="radio"
                        aria-checked={character === "girl"}
                      >
                        <span className="cb-char-check"><Check size={14} aria-hidden /></span>
                        <CharacterIllustration character="girl" />
                        <span className="cb-char-name">Bloom</span>
                      </button>
                      <button
                        type="button"
                        className={`cb-char-option${character === "boy" ? " selected" : ""}`}
                        onClick={() => setCharacter("boy")}
                        role="radio"
                        aria-checked={character === "boy"}
                      >
                        <span className="cb-char-check"><Check size={14} aria-hidden /></span>
                        <CharacterIllustration character="boy" />
                        <span className="cb-char-name">Bumble</span>
                      </button>
                    </div>
                  </Field>
                </>
              ) : null}

              <Field label="Password" required error={fieldError("password")}>
                <PasswordInput
                  id="reg-password"
                  name="password"
                  autoComplete="new-password"
                  leadingIcon={<Lock size={18} aria-hidden />}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <Field label="Confirm password" required error={fieldError("confirmPassword")}>
                <PasswordInput
                  id="reg-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  leadingIcon={<Lock size={18} aria-hidden />}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>

              {formError ? <ErrorMessage message={formError} /> : null}

              <Button type="submit" size="lg" fullWidth loading={submitting} disabled={submitting}>
                {submitting ? "Creating your account…" : "Create Account"}
              </Button>
            </form>

            {isStudent && firebaseConfigured ? (
              <>
                <div className="cb-auth-divider" aria-hidden>
                  <span>or</span>
                </div>
                <button
                  type="button"
                  className="cb-google-button"
                  onClick={() => void handleGoogleSignUp()}
                  disabled={googleLoading || submitting}
                >
                  <GoogleMark />
                  {googleLoading ? "Connecting to Google…" : "Sign up with Google"}
                </button>
                <p className="cb-auth-note">
                  Google creates a student account with a default character and age group.
                  You can change them in Profile after signing in.
                </p>
              </>
            ) : null}

            <p className="cb-auth-alt">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <aside className="cb-auth-side">
          <CharacterIllustration character={isStudent ? "girl" : "boy"} />
          <h2>{isStudent ? "Every great coder starts with a small step." : "Guide the next generation of coders."}</h2>
          <p>
            {isStudent ? (
              <>
                <Sparkles size={16} aria-hidden style={{ verticalAlign: "-3px" }} /> Pick your character, complete your
                first mission, and watch your confidence grow.
              </>
            ) : (
              <>
                Set up your classes, invite students with a join code, and track their learning progress.
              </>
            )}
          </p>
        </aside>
      </div>
    </div>
  );

  function fieldError(key: string) {
    return errors[key];
  }
}

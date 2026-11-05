import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge, PageHeader } from "../../components/ui/inputs";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { changePreferences, toAuthError } from "../../services/authService";
import type { LearnerPreferences } from "../../types";

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="cb-setting-row">
      <div>
        <div className="cb-setting-title">{label}</div>
        {description ? <div className="cb-setting-desc">{description}</div> : null}
      </div>
      <label className="cb-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="cb-slider" />
      </label>
    </div>
  );
}

export function Settings() {
  const { learner, signOut, updateLearner } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isStudent = learner?.role === "student";
  const [preferences, setPreferences] = useState<LearnerPreferences>(
    learner?.preferences ?? { sound: true, motion: true, hints: true, reducedMotion: false },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const persist = async (next: LearnerPreferences) => {
    const previous = preferences;
    setPreferences(next);
    setSaving(true);
    setError(undefined);
    try {
      await changePreferences({
        sound: next.sound,
        reducedMotion: next.reducedMotion,
        showHints: next.hints,
      });
      updateLearner({ preferences: next });
      toast("Preferences saved.");
    } catch (err) {
      setPreferences(previous);
      setError(toAuthError(err, "Unable to save your preferences.").message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast("You have been signed out. See you soon!");
    navigate("/");
  };

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Settings"
          subtitle={isStudent ? "Choose how missions feel while you play." : "Your account settings."}
        />

        {isStudent ? (
          <section className="cb-card" aria-label="Learning preferences" style={{ maxWidth: 720 }}>
            <Toggle
              label="Sound effects"
              description="Gentle feedback sounds during missions."
              checked={preferences.sound}
              disabled={saving}
              onChange={(value) => void persist({ ...preferences, sound: value })}
            />
            <Toggle
              label="Reduced motion"
              description="Minimise animations and transitions."
              checked={preferences.reducedMotion}
              disabled={saving}
              onChange={(value) => void persist({ ...preferences, reducedMotion: value })}
            />
            <Toggle
              label="Show mission hints"
              description="Let Bloom's Coach offer hints while you play."
              checked={preferences.hints}
              disabled={saving}
              onChange={(value) => void persist({ ...preferences, hints: value })}
            />
            <div style={{ padding: "var(--cb-space-4)" }}>
              <span className="cb-field-hint">
                {saving ? "Saving…" : "Preferences are saved to your account."}
              </span>
            </div>
          </section>
        ) : (
          <section className="cb-card cb-card-pad" aria-label="Account" style={{ maxWidth: 720 }}>
            <h2 className="cb-section-title">Account</h2>
            <p className="cb-body-text">
              {learner?.displayName} · @{learner?.username}
            </p>
            <p className="cb-body-text">
              <Badge variant="soft">{learner?.role}</Badge> {learner?.email}
            </p>
          </section>
        )}

        {error ? (
          <p className="cb-field-error" role="alert" style={{ marginTop: "var(--cb-space-4)", maxWidth: 720 }}>
            {error}
          </p>
        ) : null}

        <section className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-6)", maxWidth: 720 }}>
          <h2 className="cb-section-title">Account</h2>
          <div className="cb-setting-row">
            <div>
              <div className="cb-setting-title">Sign out</div>
              <div className="cb-setting-desc">End your session on this device.</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => void handleSignOut()}>
              Sign Out
            </Button>
          </div>
          <div className="cb-setting-row">
            <div>
              <div className="cb-setting-title">Privacy and data</div>
              <div className="cb-setting-desc">
                This project stores your account, mission progress and project notes in the
                CodeBloom database. Ask your instructor or administrator to export or delete your
                data.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

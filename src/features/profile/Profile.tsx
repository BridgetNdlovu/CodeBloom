import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Star, Trophy } from "lucide-react";
import { CharacterAvatar, CharacterIllustration } from "../../components/character/Character";
import { Badge, PageHeader } from "../../components/ui/inputs";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getDashboard, type DashboardSummaryDto } from "../../services/apiClient";
import { changeCharacter, toAuthError } from "../../services/authService";
import type { CharacterPreference } from "../../types";

export function Profile() {
  const { learner, updateLearner } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [savingCharacter, setSavingCharacter] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isStudent = learner?.role === "student";
  const learnerId = learner?.id;
  const character = (learner?.character ?? "girl") as CharacterPreference;

  useEffect(() => {
    if (!learnerId || !isStudent) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getDashboard();
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your profile.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [learnerId, isStudent, reloadKey]);

  if (!learner) return null;

  if (loading) {
    return (
      <div className="cb-page">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading your profile…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-page">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load profile</h2>
            <p className="cb-body-text">{error}</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleCharacterChange(next: CharacterPreference) {
    if (savingCharacter || next === character) return;
    setSavingCharacter(true);
    setSaveError(undefined);
    try {
      await changeCharacter(next);
      updateLearner({ character: next });
    } catch (err) {
      setSaveError(toAuthError(err, "Unable to update character preference.").message);
    } finally {
      setSavingCharacter(false);
    }
  }

  const stats = dashboard
    ? [
        {
          label: "Missions completed",
          value: `${dashboard.missionsCompleted}/${dashboard.totalMissions}`,
          icon: CheckCircle,
        },
        {
          label: "Achievements earned",
          value: `${dashboard.achievementsEarned}/${dashboard.totalAchievements}`,
          icon: Trophy,
        },
        { label: "Total points", value: dashboard.totalPoints, icon: Star },
      ]
    : [];

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader title="My Profile" subtitle="Your account details and character." />

        <section className="cb-profile-header" aria-label="Learner profile summary">
          <CharacterAvatar character={character} name={learner.displayName} size={96} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 className="cb-section-title" style={{ marginBottom: "var(--cb-space-2)" }}>
              {learner.displayName}
            </h2>
            <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-1)" }}>
              @{learner.username} · {learner.email}
            </p>
            <p className="cb-body-text" style={{ marginBottom: 0 }}>
              <Badge variant="soft">{learner.role}</Badge>{" "}
              {isStudent ? `Age group ${learner.ageGroup}` : "Staff account"}
            </p>
            <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-4)" }}>
              <Link to="/app/settings" className="cb-btn cb-btn-secondary cb-btn-sm">
                Settings
              </Link>
            </div>
          </div>
          {isStudent && stats.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--cb-space-3)" }}>
              {stats.map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div className="cb-flex cb-flex-center" style={{ gap: "var(--cb-space-2)" }}>
                    <s.icon size={18} aria-hidden style={{ color: "var(--cb-green)" }} />
                    <span className="cb-stat-value" style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cb-green-dark)" }}>
                      {s.value}
                    </span>
                  </div>
                  <div className="cb-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {isStudent ? (
          <>
            <section className="cb-dash-section" aria-label="Selected character">
              <h2 className="cb-section-title">Your character</h2>
              <div className="cb-card cb-card-pad cb-featured-mission" style={{ marginTop: "var(--cb-space-3)" }}>
                <div className="cb-featured-art">
                  <CharacterIllustration character={character} />
                </div>
                <div>
                  <h3 className="cb-section-title" style={{ fontSize: "1.3rem" }}>
                    {character === "girl" ? "Bloom" : "Bumble"}
                  </h3>
                  <p className="cb-body-text">
                    {character === "girl"
                      ? "The curious girl coder with a yellow hoodie. She loves exploring gardens and discovering new paths."
                      : "The cheerful boy coder with a navy blue hoodie. He loves building bridges and solving puzzles."}
                  </p>
                  <p className="cb-field-hint" style={{ marginBottom: 0 }}>
                    Tip: you can replay any completed mission to improve your best score.
                  </p>
                  <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-4)" }}>
                    <Button size="sm" variant="secondary" onClick={() => navigate("/app/missions")}>
                      Choose a mission
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="cb-dash-section" aria-label="Character preference">
              <h2 className="cb-section-title">Choose your character</h2>
              <div className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-3)" }}>
                <div className="cb-char-options" role="radiogroup" aria-label="Character preference">
                  {(["girl", "boy"] as CharacterPreference[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`cb-char-option${character === option ? " selected" : ""}`}
                      onClick={() => void handleCharacterChange(option)}
                      role="radio"
                      aria-checked={character === option}
                      disabled={savingCharacter}
                    >
                      <span className="cb-char-check" aria-hidden />
                      <CharacterIllustration character={option} />
                      <span className="cb-char-name">{option === "girl" ? "Bloom" : "Bumble"}</span>
                    </button>
                  ))}
                </div>
                {saveError ? (
                  <p className="cb-field-error" role="alert" style={{ marginTop: "var(--cb-space-3)" }}>
                    {saveError}
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <section className="cb-dash-section" aria-label="Staff account">
            <div className="cb-card cb-card-pad">
              <h2 className="cb-section-title">Staff account</h2>
              <p className="cb-body-text">
                {learner.role === "admin"
                  ? "You can manage users, missions and platform settings from the administration dashboard."
                  : "You can manage classes, assignments and reports from the instructor dashboard."}
              </p>
              <div className="cb-hero-actions">
                <Link
                  to={learner.role === "admin" ? "/app/admin" : "/app/instructor"}
                  className="cb-btn cb-btn-primary cb-btn-sm"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

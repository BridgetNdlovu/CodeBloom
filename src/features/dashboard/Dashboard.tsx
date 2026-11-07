import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Compass,
  Play,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, ProgressBar } from "../../components/ui/inputs";
import { CharacterIllustration } from "../../components/character/Character";
import { useAuth } from "../../context/AuthContext";
import { getDashboard, type DashboardSummaryDto } from "../../services/apiClient";
import { toAuthError } from "../../services/authService";
import type { CharacterPreference } from "../../types";

export function Dashboard() {
  const { learner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardSummaryDto | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);
  const character = (learner?.character ?? "girl") as CharacterPreference;

  const displayName = learner?.displayName ?? dashboard?.displayName ?? "Coder";

  const go = (to: string) => () => navigate(to);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getDashboard();
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your dashboard.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="cb-page">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading your adventure…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="cb-page">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load dashboard</h2>
            <p className="cb-body-text">
              {error ?? "Your dashboard could not be loaded right now."}
            </p>
            <div
              className="cb-hero-actions"
              style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}
            >
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const missionsCompleted = dashboard.missionsCompleted;
  const missionsInProgress = dashboard.missionsInProgress;
  const missionsAvailable = dashboard.missionsAvailable;
  const totalMissions = dashboard.totalMissions;
  const totalPoints = dashboard.totalPoints;
  const achievementsEarned = dashboard.achievementsEarned;
  const totalAchievements = dashboard.totalAchievements;
  const recentAchievements = dashboard.recentAchievements ?? [];

  const resumeMission = dashboard.inProgressMissions[0] ?? dashboard.availableMissions[0];
  const completedPercent =
    totalMissions > 0 ? Math.round((missionsCompleted / totalMissions) * 100) : 0;

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <section className="cb-dash-welcome">
          <div>
            <h1>Hey, {displayName}!</h1>
            <p>Ready to grow your coding skills today?</p>
            <div className="cb-dash-character-message">
              <CharacterIllustration character={character} />
              <span>“Let's solve a new challenge together!”</span>
            </div>
          </div>
          <div className="cb-dash-welcome-art">
            <CharacterIllustration character={character} />
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Learning progress summary">
          <div className="cb-stat-grid">
            {[
              { label: "Missions completed", value: missionsCompleted, icon: Star },
              { label: "In progress", value: missionsInProgress, icon: Play },
              { label: "Missions available", value: missionsAvailable, icon: Compass },
              { label: "Total points", value: totalPoints, icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="cb-stat-card">
                <span className="cb-flex cb-flex-between">
                  <span className="cb-stat-value">{s.value}</span>
                  <s.icon size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                </span>
                <span className="cb-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-4)" }}>
            <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-2)" }}>
              <span className="cb-body-text" style={{ margin: 0 }}>
                {missionsCompleted} of {totalMissions} missions completed
              </span>
              <strong style={{ color: "var(--cb-green-dark)" }}>{completedPercent}%</strong>
            </div>
            <ProgressBar value={completedPercent} label="Overall mission progress" />
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Continue learning">
          <div className="cb-dash-section-head">
            <h2>{missionsInProgress > 0 ? "Continue learning" : "Start a mission"}</h2>
            <Link to="/app/missions">View all missions</Link>
          </div>
          {resumeMission ? (
            <article className="cb-card cb-card-pad cb-featured-mission">
              <div className="cb-featured-art">
                <CharacterIllustration character={character} />
              </div>
              <div>
                <div className="cb-flex" style={{ gap: "var(--cb-space-2)", flexWrap: "wrap" }}>
                  <Badge>{resumeMission.difficulty}</Badge>
                  {missionsInProgress > 0 ? <Badge variant="warning">In progress</Badge> : null}
                </div>
                <h3 style={{ marginTop: "var(--cb-space-3)" }}>{resumeMission.title}</h3>
                <p className="cb-body-text">{resumeMission.description}</p>
                {resumeMission.learningConcept ? (
                  <div className="cb-flex cb-flex-center" style={{ marginTop: "var(--cb-space-4)", flexWrap: "wrap", gap: "var(--cb-space-3)" }}>
                    <span className="cb-badge">{resumeMission.learningConcept}</span>
                  </div>
                ) : null}
                <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-4)" }}>
                  <Button onClick={go(`/app/game/${resumeMission.id}`)}>
                    <Play size={16} aria-hidden />
                    {missionsInProgress > 0 ? "Resume Mission" : "Start Mission"}
                  </Button>
                  <Button variant="secondary" onClick={go("/app/missions")}>
                    View Mission Map
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <div className="cb-card cb-card-pad cb-empty" style={{ marginTop: "var(--cb-space-4)" }}>
              <h3>No missions available right now.</h3>
              <p className="cb-body-text">
                Check your assignments, or ask your instructor to publish new missions.
              </p>
              <div className="cb-hero-actions" style={{ justifyContent: "center" }}>
                <Button variant="secondary" onClick={go("/app/assignments")}>
                  <ClipboardList size={16} aria-hidden />
                  My assignments
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="cb-dash-section" aria-label="Recent achievements">
          <div className="cb-dash-section-head">
            <h2>Recent achievements</h2>
            <Link to="/app/achievements">
              View all {achievementsEarned}/{totalAchievements}
            </Link>
          </div>
          {recentAchievements.length > 0 ? (
            <div className="cb-achievement-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {recentAchievements.slice(0, 4).map((a) => (
                <article key={a.id} className="cb-achievement-card earned">
                  <span className="cb-achievement-badge" aria-hidden>
                    <Trophy size={30} />
                  </span>
                  <h3 className="cb-section-title" style={{ fontSize: "1.1rem" }}>{a.title}</h3>
                  <p className="cb-body-text" style={{ marginBottom: 0 }}>
                    +{a.rewardPoints} points · {new Date(a.earnedAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="cb-body-text">
              No achievements yet. Complete your first mission to start earning them!
            </p>
          )}
        </section>

        <section className="cb-dash-section" aria-label="More learning tools">
          <div className="cb-grid-2">
            <div className="cb-card cb-card-pad">
              <h2 className="cb-section-title">
                <ClipboardList size={18} aria-hidden /> Assignments
              </h2>
              <p className="cb-body-text">
                See work set by your instructor, submit your notes and read their feedback.
              </p>
              <Button size="sm" variant="secondary" onClick={go("/app/assignments")}>
                Open assignments <ArrowRight size={15} aria-hidden />
              </Button>
            </div>
            <div className="cb-card cb-card-pad">
              <h2 className="cb-section-title">
                <Sparkles size={18} aria-hidden /> Bloom's Coach
              </h2>
              <p className="cb-body-text">
                Open any mission to ask Bloom's Coach for a hint while you build your program.
              </p>
              <Button size="sm" variant="secondary" onClick={go("/app/missions")}>
                Explore missions <ArrowRight size={15} aria-hidden />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

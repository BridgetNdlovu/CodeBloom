import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Lock, Medal, Puzzle, Sprout, Star, Trophy } from "lucide-react";
import { Badge, PageHeader } from "../../components/ui/inputs";
import { Button } from "../../components/ui/Button";
import { getStudentAchievements } from "../../services/progressService";
import { toAuthError } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import type { Achievement } from "../../types";

const ICONS: Record<string, typeof Sprout> = {
  sprout: Sprout,
  puzzle: Puzzle,
  compass: Compass,
  star: Star,
  medal: Medal,
  trophy: Trophy,
};

export function Achievements() {
  const { learner } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getStudentAchievements();
        if (!cancelled) setAchievements(data);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load achievements.").message);
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

  const earnedList = achievements.filter((a) => a.earned);
  const earned = earnedList.length;
  const total = achievements.length;
  const pointsFromAchievements = earnedList.reduce((sum, a) => sum + a.rewardPoints, 0);

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading achievements…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container">
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load achievements</h2>
            <p className="cb-body-text">{error}</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Look how far you've grown!"
          subtitle={`${earned} of ${total} achievements earned`}
        />

        <div className="cb-stat-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{earned}</span>
              <Trophy size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Achievements earned</span>
          </div>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{pointsFromAchievements}</span>
              <Star size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Points from achievements</span>
          </div>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{total - earned}</span>
              <Lock size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Still to unlock</span>
          </div>
        </div>

        <section className="cb-dash-section" aria-label="Achievement badges">
          <h2 className="cb-section-title">Badge collection</h2>
          <div className="cb-achievement-grid">
            {achievements.length > 0 ? (
              achievements.map((a) => {
                const Icon = ICONS[a.icon.toLowerCase()] ?? Star;
                return (
                  <article key={a.id} className={`cb-achievement-card ${a.earned ? "earned" : "locked"}`}>
                    <span className="cb-achievement-badge" aria-hidden>
                      <Icon size={36} />
                    </span>
                    <h3 className="cb-section-title" style={{ fontSize: "1.15rem" }}>{a.title}</h3>
                    <p className="cb-body-text">{a.description}</p>
                    <Badge variant={a.earned ? "default" : "soft"}>
                      {a.earned ? "Earned" : "Locked"}
                    </Badge>
                    <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-3)", marginBottom: 0 }}>
                      {a.earned && a.earnedAt
                        ? `Earned ${new Date(a.earnedAt).toLocaleDateString()}`
                        : a.criteria || "Keep exploring missions to unlock this badge."}
                    </p>
                  </article>
                );
              })
            ) : (
              <p className="cb-body-text">
                No achievements are configured yet. Complete missions to start earning them.
              </p>
            )}
          </div>
        </section>

        {learner?.role === "student" ? (
          <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-6)" }}>
            <Link to="/app/missions" className="cb-btn cb-btn-secondary">
              Find another mission
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

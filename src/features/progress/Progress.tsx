import { useEffect, useState } from "react";
import { CheckCircle, Flame, Star, TrendingUp } from "lucide-react";
import { Badge, PageHeader, ProgressBar } from "../../components/ui/inputs";
import { Button } from "../../components/ui/Button";
import { getProgress, type ProgressSummary } from "../../services/progressService";
import { toAuthError } from "../../services/authService";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  practising: "Practising",
  completed: "Complete",
};

export function Progress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getProgress();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your progress.").message);
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
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading your progress…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container">
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load your progress</h2>
            <p className="cb-body-text">
              {error ?? "Your progress could not be loaded right now."}
            </p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionPercent =
    summary.totalMissions > 0
      ? Math.round((summary.missionsCompleted / summary.totalMissions) * 100)
      : 0;

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="My Progress"
          subtitle="Real results from the missions and assignments you have completed."
        />

        <div className="cb-stat-grid">
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{summary.missionsCompleted}</span>
              <CheckCircle size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Missions completed of {summary.totalMissions}</span>
          </div>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{summary.missionsInProgress}</span>
              <Flame size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">In progress</span>
          </div>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">{summary.totalPoints}</span>
              <TrendingUp size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Total points</span>
          </div>
          <div className="cb-stat-card">
            <span className="cb-flex cb-flex-between">
              <span className="cb-stat-value">
                {summary.achievementsEarned}/{summary.totalAchievements}
              </span>
              <Star size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
            </span>
            <span className="cb-stat-label">Achievements earned</span>
          </div>
        </div>

        <section className="cb-dash-section" aria-label="Overall completion">
          <div className="cb-card cb-card-pad">
            <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-2)" }}>
              <span className="cb-body-text" style={{ margin: 0 }}>
                Overall mission completion
              </span>
              <strong style={{ color: "var(--cb-green-dark)" }}>{completionPercent}%</strong>
            </div>
            <ProgressBar value={completionPercent} label="Overall completion" />
            <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-3)" }}>
              {summary.missionsAvailable} available · {summary.missionsLocked} still locked
            </p>
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Skill progress">
          <h2 className="cb-section-title">Skills</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--cb-space-4)", marginTop: "var(--cb-space-4)" }}>
            {summary.skills.length > 0 ? (
              summary.skills.map((s) => (
                <div key={s.skill} className="cb-card cb-card-pad">
                  <div className="cb-flex cb-flex-between" style={{ alignItems: "center" }}>
                    <h3 className="cb-section-title" style={{ marginBottom: 0, fontSize: "1.1rem" }}>
                      {s.skill}
                    </h3>
                    <Badge variant={s.status === "completed" ? "default" : s.status === "practising" ? "warning" : "soft"}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </div>
                  <div style={{ marginTop: "var(--cb-space-3)" }}>
                    <ProgressBar value={s.percent} label={`${s.completed} of ${s.total} missions · ${s.percent}%`} />
                  </div>
                </div>
              ))
            ) : (
              <p className="cb-body-text">Complete missions to track your skill progress.</p>
            )}
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Mission records">
          <h2 className="cb-section-title">Mission records</h2>
          {summary.records.length === 0 ? (
            <p className="cb-body-text">You have not started a mission yet.</p>
          ) : (
            <div className="cb-card cb-card-pad" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--cb-border)" }}>
                    <th style={thStyle}>Mission</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Attempts</th>
                    <th style={thStyle}>Best score</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.records.map((r) => (
                    <tr key={r.missionId} style={{ borderBottom: "1px solid var(--cb-border)" }}>
                      <td style={tdStyle}>{r.missionTitle ?? `Mission ${r.missionId}`}</td>
                      <td style={tdStyle}>
                        <Badge variant={r.status === "completed" ? "default" : "warning"}>
                          {r.status === "completed" ? "Completed" : "In progress"}
                        </Badge>
                      </td>
                      <td style={tdStyle}>{r.attempts}</td>
                      <td style={tdStyle}>{r.bestScore ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="cb-dash-section" aria-label="Recent activity">
          <h2 className="cb-section-title">Recent activity</h2>
          <div className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-3)" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--cb-space-3)" }}>
              {summary.recentActivity.map((a) => (
                <li key={a.id} className="cb-flex cb-flex-between" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
                  <span>{a.label}</span>
                  <span className="cb-muted" style={{ fontSize: "0.85rem" }}>
                    {a.detail} · {new Date(a.at).toLocaleDateString()}
                  </span>
                </li>
              ))}
              {summary.recentActivity.length === 0 && (
                <li className="cb-muted">No recent activity. Start your first mission!</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "var(--cb-space-3)",
  color: "var(--cb-muted)",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const tdStyle = { padding: "var(--cb-space-3)", verticalAlign: "middle" };

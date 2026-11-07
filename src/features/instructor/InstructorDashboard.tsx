import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Clock,
  LayoutDashboard,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, PageHeader } from "../../components/ui/inputs";
import { useAuth } from "../../context/AuthContext";
import {
  getInstructorAssignments,
  getInstructorClasses,
  getInstructorDashboard,
  type AssignmentDto,
  type ClassDto,
  type InstructorDashboardDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

interface StatCard {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

export function InstructorDashboard() {
  const { learner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [dashboard, setDashboard] = useState<InstructorDashboardDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const displayName = learner?.displayName ?? "Instructor";

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const [dashboardData, classesData, assignmentsData] = await Promise.all([
          getInstructorDashboard(),
          getInstructorClasses(),
          getInstructorAssignments(),
        ]);
        if (cancelled) return;
        setDashboard(dashboardData);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your instructor dashboard.").message);
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
            <span>Loading your instructor dashboard…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load dashboard</h2>
            <p className="cb-body-text">
              {error ?? "Your instructor dashboard could not be loaded right now."}
            </p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recentActivity = dashboard.recentActivity ?? [];
  const hasData = dashboard.totalClasses > 0 || dashboard.totalStudents > 0;

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Instructor Dashboard"
          subtitle={`Welcome back, ${displayName}. Here's what's happening across your classes.`}
          actions={
            <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => navigate("/app/instructor/classes")}>
                Manage Classes
              </Button>
              <Button onClick={() => navigate("/app/instructor/classes/create")}>
                Create Class
              </Button>
            </div>
          }
        />

        <section className="cb-dash-section" aria-label="Overview stats">
          <div className="cb-stat-grid">
            <StatCardComponent
              label="Total classes"
              value={dashboard.totalClasses}
              icon={LayoutDashboard}
              color="var(--cb-blue)"
            />
            <StatCardComponent
              label="Total students"
              value={dashboard.totalStudents}
              icon={Users}
              color="var(--cb-green)"
            />
            <StatCardComponent
              label="Active assignments"
              value={dashboard.activeAssignments}
              icon={Compass}
              color="var(--cb-purple)"
            />
            <StatCardComponent
              label="Pending submissions"
              value={dashboard.pendingSubmissions}
              icon={Clock}
              color="var(--cb-amber)"
            />
          </div>
        </section>

        {!hasData ? (
          <section className="cb-dash-section" aria-label="Empty state">
            <EmptyState
              icon={<Sparkles size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
              title="No classes yet"
              message="You haven't created any classes yet. Create your first class to start guiding learners."
              action={
                <Button onClick={() => navigate("/app/instructor/classes/create")}>
                  Create your first class
                </Button>
              }
            />
          </section>
        ) : (
          <>
            <section className="cb-dash-section" aria-label="Your classes">
              <div className="cb-dash-section-head">
                <h2>Your classes</h2>
                <Link to="/app/instructor/classes">View all</Link>
              </div>
              {classes.length === 0 ? (
                <p className="cb-body-text">No classes to show.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--cb-space-4)" }}>
                  {classes.slice(0, 3).map((c) => (
                    <article key={c.id} className="cb-card cb-card-pad">
                      <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)", alignItems: "flex-start" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{c.name}</h3>
                        <Badge variant="soft">
                          {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)" }}>
                        {c.description?.trim() || "No description."}
                      </p>
                      <Link
                        to={`/app/instructor/classes/${c.id}`}
                        className="cb-btn cb-btn-secondary cb-btn-sm"
                      >
                        View class
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="cb-dash-section" aria-label="Recent assignments">
              <div className="cb-dash-section-head">
                <h2>Recent assignments</h2>
                <Link to="/app/instructor/assignments">View all</Link>
              </div>
              {assignments.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--cb-space-4)" }}>
                  {assignments.slice(0, 3).map((a) => (
                    <article key={a.id} className="cb-card cb-card-pad">
                      <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)", alignItems: "flex-start" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{a.title}</h3>
                        <Badge variant={a.status === "published" ? "default" : "soft"}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)" }}>
                        {a.description?.trim() || "No description."}
                      </p>
                      <div className="cb-flex cb-flex-between" style={{ flexWrap: "wrap", gap: "var(--cb-space-2)" }}>
                        <span className="cb-muted">
                          {a.submissionCount} submission{a.submissionCount === 1 ? "" : "s"}
                        </span>
                        <Link
                          to={`/app/instructor/assignments/${a.id}/submissions`}
                          className="cb-btn cb-btn-secondary cb-btn-sm"
                        >
                          View submissions
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="cb-body-text">
                  No assignments yet. Create your first assignment to assign missions to your classes.
                </p>
              )}
            </section>

            <section className="cb-dash-section" aria-label="Recent activity">
              <div className="cb-dash-section-head">
                <h2>Recent activity</h2>
              </div>
              {recentActivity.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--cb-space-3)" }}>
                  {recentActivity.map((a, index) => (
                    <div
                      key={`${a.studentId}-${a.assignmentTitle}-${a.submittedAt ?? "none"}-${index}`}
                      className="cb-flex cb-flex-between cb-card cb-card-pad"
                    >
                      <div>
                        <p className="cb-body-text" style={{ margin: 0, fontSize: "0.9rem" }}>
                          Student activity on <strong>{a.assignmentTitle}</strong>
                        </p>
                        <p className="cb-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                          {a.status}
                          {a.submittedAt
                            ? ` · ${new Date(a.submittedAt).toLocaleString()}`
                            : " · submission time not recorded"}
                        </p>
                      </div>
                      <Badge variant="soft">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="cb-body-text">
                  No recent activity. Once students submit assignments, they'll appear here.
                </p>
              )}
            </section>
          </>
        )}

        <section className="cb-dash-section" aria-label="Quick actions">
          <div className="cb-dash-section-head">
            <h2>Quick actions</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--cb-space-3)" }}>
            <Button fullWidth onClick={() => navigate("/app/instructor/classes/create")}>
              <span className="cb-flex cb-flex-center" style={{ gap: "var(--cb-space-3)" }}>
                <Users size={20} aria-hidden />
                Create Class
              </span>
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate("/app/instructor/assignments/create")}>
              <span className="cb-flex cb-flex-center" style={{ gap: "var(--cb-space-3)" }}>
                <Compass size={20} aria-hidden />
                Create Assignment
              </span>
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate("/app/instructor/reports")}>
              <span className="cb-flex cb-flex-center" style={{ gap: "var(--cb-space-3)" }}>
                <Star size={20} aria-hidden />
                View Reports
              </span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCardComponent({ label, value, icon: Icon, color }: StatCard) {
  return (
    <div className="cb-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="cb-flex cb-flex-between">
        <span className="cb-stat-value">{value}</span>
        <Icon size={22} aria-hidden style={{ color }} />
      </div>
      <span className="cb-stat-label">{label}</span>
    </div>
  );
}

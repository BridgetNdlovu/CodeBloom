import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Star, TrendingUp, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, ErrorMessage, PageHeader } from "../../components/ui/inputs";
import {
  getInstructorClasses,
  getInstructorProgressReports,
  type ClassDto,
  type ProgressReportDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

export function InstructorReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reports, setReports] = useState<ProgressReportDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const [reportsData, classesData] = await Promise.all([
          getInstructorProgressReports(classId ? Number(classId) : undefined),
          getInstructorClasses(),
        ]);
        if (cancelled) return;
        setReports(Array.isArray(reportsData) ? reportsData : []);
        setClasses(Array.isArray(classesData) ? classesData : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load progress reports.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [classId, reloadKey]);

  const totalStudents = reports.length;
  const totalCompleted = reports.reduce((sum, r) => sum + r.missionsCompleted, 0);
  const totalInProgress = reports.reduce((sum, r) => sum + r.missionsInProgress, 0);
  const averageCompleted =
    totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 10) / 10 : 0;

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Progress Reports"
          subtitle="Real mission progress for students in your classes."
          actions={
            <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
              <Link to="/app/instructor" className="cb-btn cb-btn-secondary cb-btn-sm">
                <ArrowLeft size={16} aria-hidden />
                Back to dashboard
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setReloadKey((k) => k + 1)}
                loading={loading}
              >
                <RefreshCw size={16} aria-hidden />
                Refresh
              </Button>
            </div>
          }
        />

        <div className="cb-card cb-card-pad" style={{ marginBottom: "var(--cb-space-6)" }}>
          <div
            className="cb-flex"
            style={{ gap: "var(--cb-space-4)", flexWrap: "wrap", alignItems: "flex-end" }}
          >
            <div style={{ flex: "1 1 240px" }}>
              <label className="cb-field-label" htmlFor="class-filter">
                Filter by class
              </label>
              <select
                id="class-filter"
                className="cb-input"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">All my classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} student{c.studentCount === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </div>
            {classId ? (
              <Button variant="ghost" size="sm" onClick={() => setClassId("")}>
                Clear filter
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <ErrorMessage message={error} /> : null}

        {!loading && !error ? (
          <>
            <div className="cb-stat-grid" style={{ marginBottom: "var(--cb-space-6)" }}>
              <div className="cb-stat-card">
                <span className="cb-flex cb-flex-between">
                  <span className="cb-stat-value">{totalStudents}</span>
                  <Users size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                </span>
                <span className="cb-stat-label">Students in report</span>
              </div>
              <div className="cb-stat-card">
                <span className="cb-flex cb-flex-between">
                  <span className="cb-stat-value">{totalCompleted}</span>
                  <Star size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                </span>
                <span className="cb-stat-label">Missions completed</span>
              </div>
              <div className="cb-stat-card">
                <span className="cb-flex cb-flex-between">
                  <span className="cb-stat-value">{totalInProgress}</span>
                  <TrendingUp size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                </span>
                <span className="cb-stat-label">Missions in progress</span>
              </div>
              <div className="cb-stat-card">
                <span className="cb-flex cb-flex-between">
                  <span className="cb-stat-value">{averageCompleted}</span>
                  <Star size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                </span>
                <span className="cb-stat-label">Average completed per student</span>
              </div>
            </div>

            {loading ? (
              <div className="cb-loading" role="status">
                <span className="cb-spinner" aria-hidden />
                <span>Loading reports…</span>
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={<Users size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
                title="No student progress yet"
                message={
                  classes.length === 0
                    ? "Create a class and add students to see their progress here."
                    : "Students in this selection have not started any missions yet."
                }
                action={
                  classes.length === 0 ? (
                    <Link to="/app/instructor/classes/create" className="cb-btn cb-btn-primary">
                      Create a class
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div className="cb-card cb-card-pad" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid var(--cb-border)" }}>
                      <th style={thStyle}>Student</th>
                      <th style={thStyle}>Class</th>
                      <th style={thStyle}>Completed</th>
                      <th style={thStyle}>In progress</th>
                      <th style={thStyle}>Points</th>
                      <th style={thStyle}>Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={`${report.classId}-${report.studentId}`}
                        style={{ borderBottom: "1px solid var(--cb-border)" }}
                      >
                        <td style={tdStyle}>
                          <strong>{report.studentName}</strong>
                          <span className="cb-muted" style={{ display: "block", fontSize: "0.8rem" }}>
                            @{report.studentUsername}
                          </span>
                        </td>
                        <td style={tdStyle}>{report.className}</td>
                        <td style={tdStyle}>
                          <Badge variant={report.missionsCompleted > 0 ? "default" : "soft"}>
                            {report.missionsCompleted}
                          </Badge>
                        </td>
                        <td style={tdStyle}>
                          <Badge variant={report.missionsInProgress > 0 ? "warning" : "soft"}>
                            {report.missionsInProgress}
                          </Badge>
                        </td>
                        <td style={tdStyle}>{report.totalPoints}</td>
                        <td style={tdStyle}>
                          {report.lastActivity
                            ? new Date(report.lastActivity).toLocaleDateString()
                            : "No activity"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
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

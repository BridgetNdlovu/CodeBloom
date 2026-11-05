import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Compass, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, PageHeader } from "../../components/ui/inputs";
import {
  getStudentAssignments,
  submitStudentAssignment,
  type AssignmentDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

const STATUS_LABEL: Record<string, string> = {
  pending: "Not submitted",
  submitted: "Submitted",
  graded: "Graded",
};

export function StudentAssignments() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getStudentAssignments();
        if (!cancelled) setAssignments(data);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your assignments.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (assignmentId: number) => {
    setSubmittingId(assignmentId);
    setError(undefined);
    try {
      await submitStudentAssignment(assignmentId, notes[assignmentId]?.trim() || undefined);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                submissionStatus: "submitted",
                studentNotes: notes[assignmentId]?.trim() || null,
                studentSubmittedAt: new Date().toISOString(),
              }
            : a,
        ),
      );
    } catch (err) {
      setError(toAuthError(err, "Unable to submit this assignment.").message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading assignments…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="My Assignments"
          subtitle="Work set by your instructors. Submit when you are ready."
          actions={
            <Link to="/app/join-class" className="cb-btn cb-btn-secondary cb-btn-sm">
              <GraduationCap size={16} aria-hidden />
              Join another class
            </Link>
          }
        />

        {error ? (
          <p className="cb-field-error" role="alert" style={{ marginBottom: "var(--cb-space-4)" }}>
            {error}
          </p>
        ) : null}

        {assignments.length === 0 ? (
          <EmptyState
            icon={<Compass size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
            title="No assignments yet"
            message="Join a class with the code from your instructor, and their assignments will appear here."
            action={
              <Link to="/app/join-class" className="cb-btn cb-btn-primary">
                Join a class
              </Link>
            }
          />
        ) : (
          <div style={{ display: "grid", gap: "var(--cb-space-4)" }}>
            {assignments.map((assignment) => {
              const state = assignment.submissionStatus ?? "pending";
              const canSubmit = state === "pending" && !assignment.isOverdue;
              return (
                <article key={assignment.id} className="cb-card cb-card-pad">
                  <div className="cb-flex cb-flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 220, flex: 1 }}>
                      <h3 className="cb-section-title" style={{ marginBottom: "var(--cb-space-2)" }}>
                        {assignment.title}
                      </h3>
                      {assignment.description ? (
                        <p className="cb-body-text">{assignment.description}</p>
                      ) : null}
                      <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
                        {assignment.className ? <Badge variant="soft">{assignment.className}</Badge> : null}
                        <Badge variant={state === "graded" ? "default" : state === "submitted" ? "warning" : "soft"}>
                          {STATUS_LABEL[state] ?? state}
                        </Badge>
                        {assignment.deadline ? (
                          <span className="cb-muted" style={{ fontSize: "0.85rem" }}>
                            <Clock size={14} aria-hidden /> Due{" "}
                            {new Date(assignment.deadline).toLocaleString()}
                          </span>
                        ) : null}
                        {assignment.isOverdue ? <Badge variant="warning">Overdue</Badge> : null}
                      </div>
                    </div>
                    {assignment.studentScore !== null && assignment.studentScore !== undefined ? (
                      <div style={{ textAlign: "center" }}>
                        <div className="cb-stat-value">{assignment.studentScore}</div>
                        <div className="cb-stat-label">Score / 100</div>
                      </div>
                    ) : null}
                  </div>

                  {assignment.missionIds.length > 0 ? (
                    <div style={{ marginTop: "var(--cb-space-4)" }}>
                      <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-2)" }}>
                        <strong>Missions:</strong>{" "}
                        {assignment.missionIds.map((missionId) => (
                          <Link key={missionId} to={`/app/game/${missionId}`} style={{ marginRight: 8 }}>
                            Mission {missionId}
                          </Link>
                        ))}
                      </p>
                    </div>
                  ) : null}

                  {assignment.studentFeedback ? (
                    <div className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-4)", background: "var(--cb-muted)" }}>
                      <strong>Instructor feedback:</strong> {assignment.studentFeedback}
                    </div>
                  ) : null}

                  {assignment.studentNotes ? (
                    <p className="cb-body-text" style={{ marginTop: "var(--cb-space-3)" }}>
                      <strong>Your notes:</strong> {assignment.studentNotes}
                    </p>
                  ) : null}

                  {canSubmit ? (
                    <div style={{ marginTop: "var(--cb-space-4)" }}>
                      <label className="cb-field-label" htmlFor={`notes-${assignment.id}`}>
                        Notes for your instructor (optional)
                      </label>
                      <textarea
                        id={`notes-${assignment.id}`}
                        className="cb-input"
                        rows={3}
                        value={notes[assignment.id] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                        }
                        placeholder="What did you learn? Which mission was hardest?"
                      />
                      <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-3)" }}>
                        <Button
                          size="sm"
                          onClick={() => void submit(assignment.id)}
                          loading={submittingId === assignment.id}
                          disabled={submittingId === assignment.id}
                        >
                          <CheckCircle size={16} aria-hidden />
                          Submit assignment
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {assignment.isOverdue && state === "pending" ? (
                    <p className="cb-field-error" style={{ marginTop: "var(--cb-space-3)" }}>
                      The deadline has passed, so this assignment can no longer be submitted.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

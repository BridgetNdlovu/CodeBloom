import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, Pencil } from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  Badge,
  EmptyState,
  ErrorMessage,
  Field,
  PageHeader,
  TextInput,
} from "../../components/ui/inputs";
import {
  getAssignmentSubmissions,
  getInstructorAssignment,
  gradeSubmission,
  type AssignmentDto,
  type SubmissionDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

interface GradeDraft {
  score: string;
  feedback: string;
}

function studentName(submission: SubmissionDto): string {
  return (
    submission.studentDisplayName?.trim() ||
    submission.studentUsername ||
    submission.studentId
  );
}

export function InstructorSubmissions() {
  const { assignmentId } = useParams();
  const id = assignmentId ? Number(assignmentId) : NaN;
  const validId = Number.isInteger(id) && id > 0;

  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState<string | undefined>(undefined);
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [editing, setEditing] = useState<Record<number, boolean>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [gradeError, setGradeError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const [assignmentData, submissionData] = await Promise.all([
          getInstructorAssignment(id),
          getAssignmentSubmissions(id),
        ]);
        if (cancelled) return;
        setAssignment(assignmentData);
        const list = Array.isArray(submissionData) ? submissionData : [];
        setSubmissions(list);
        setDrafts(
          Object.fromEntries(
            list.map((s) => [
              s.id,
              { score: s.score != null ? String(s.score) : "", feedback: s.feedback ?? "" },
            ]),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load this assignment and its submissions.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, validId, reloadKey]);

  function updateDraft(submissionId: number, patch: Partial<GradeDraft>) {
    setDrafts((prev) => {
      const current = prev[submissionId] ?? { score: "", feedback: "" };
      return { ...prev, [submissionId]: { ...current, ...patch } };
    });
  }

  async function handleGrade(event: FormEvent, submission: SubmissionDto) {
    event.preventDefault();
    const draft = drafts[submission.id] ?? { score: "", feedback: "" };
    const trimmedScore = draft.score.trim();
    const score = Number(trimmedScore);
    if (!trimmedScore || !Number.isInteger(score) || score < 0 || score > 100) {
      setGradeError("Enter a whole-number score between 0 and 100.");
      return;
    }
    if (draft.feedback.length > 4000) {
      setGradeError("Feedback must be 4000 characters or fewer.");
      return;
    }

    setGradeError(undefined);
    setSavingId(submission.id);
    try {
      const feedback = draft.feedback.trim() || undefined;
      await gradeSubmission(submission.id, score, feedback);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? { ...s, status: "graded", score, feedback: feedback ?? null }
            : s,
        ),
      );
      setEditing((prev) => ({ ...prev, [submission.id]: false }));
    } catch (err) {
      setGradeError(toAuthError(err, "Unable to save this grade.").message);
    } finally {
      setSavingId(null);
    }
  }

  if (!validId) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Assignment not found</h2>
            <p className="cb-body-text">This assignment address is not valid.</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary">
                Back to assignments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading submissions…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load submissions</h2>
            <p className="cb-body-text">
              {error ?? "This assignment does not exist or you do not have access to it."}
            </p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
              <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary">
                Back to assignments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const graded = submissions.filter((s) => s.status === "graded").length;

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title={assignment.title}
          subtitle={`${submissions.length} submission${submissions.length === 1 ? "" : "s"} · ${graded} graded${
            assignment.className ? ` · ${assignment.className}` : ""
          }`}
          actions={
            <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary cb-btn-sm">
              <ArrowLeft size={16} aria-hidden />
              Back to assignments
            </Link>
          }
        />

        {assignment.description ? (
          <div className="cb-card cb-card-pad" style={{ marginBottom: "var(--cb-space-6)" }}>
            <p className="cb-body-text" style={{ marginBottom: 0 }}>
              {assignment.description}
            </p>
          </div>
        ) : null}

        {gradeError ? <ErrorMessage message={gradeError} /> : null}

        {submissions.length === 0 ? (
          <EmptyState
            icon={<Clock size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
            title="No submissions yet"
            message="Students have not submitted this assignment yet. Check back later."
            action={
              <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary">
                Back to assignments
              </Link>
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "var(--cb-space-4)",
            }}
          >
            {submissions.map((submission) => {
              const isEditing = editing[submission.id] === true;
              const draft = drafts[submission.id] ?? { score: "", feedback: "" };
              return (
                <article key={submission.id} className="cb-card cb-card-pad">
                  <div
                    className="cb-flex cb-flex-between"
                    style={{ marginBottom: "var(--cb-space-3)", alignItems: "flex-start" }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{studentName(submission)}</h3>
                      <p className="cb-muted" style={{ margin: 0, fontSize: "0.82rem" }}>
                        @{submission.studentUsername}
                      </p>
                    </div>
                    <Badge
                      variant={
                        submission.status === "graded"
                          ? "default"
                          : submission.status === "submitted"
                            ? "warning"
                            : "soft"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>

                  <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)", fontSize: "0.85rem" }}>
                    {submission.submittedAt
                      ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
                      : "Submission date not recorded"}
                  </p>

                  {submission.notes ? (
                    <div
                      style={{
                        marginBottom: "var(--cb-space-3)",
                        padding: "var(--cb-space-3)",
                        background: "var(--cb-surface-alt, #f3f6f2)",
                        borderRadius: "var(--cb-radius-md)",
                      }}
                    >
                      <strong style={{ fontSize: "0.82rem" }}>Student notes</strong>
                      <p className="cb-body-text" style={{ margin: "var(--cb-space-1) 0 0", fontSize: "0.9rem" }}>
                        {submission.notes}
                      </p>
                    </div>
                  ) : null}

                  {!isEditing ? (
                    <>
                      <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)" }}>
                        <span className="cb-muted">Score</span>
                        <span style={{ fontWeight: 700 }}>
                          {submission.score != null ? `${submission.score} / 100` : "Not graded"}
                        </span>
                      </div>
                      {submission.feedback ? (
                        <div
                          style={{
                            marginBottom: "var(--cb-space-3)",
                            fontSize: "0.88rem",
                            color: "var(--cb-muted)",
                          }}
                        >
                          <strong>Feedback:</strong> {submission.feedback}
                        </div>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setEditing((prev) => ({ ...prev, [submission.id]: true }))
                        }
                      >
                        {submission.status === "graded" ? (
                          <>
                            <Pencil size={16} aria-hidden /> Edit grade
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} aria-hidden /> Grade submission
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <form onSubmit={(e) => void handleGrade(e, submission)} noValidate>
                      <Field label="Score (0–100)" required>
                        <TextInput
                          id={`score-${submission.id}`}
                          name={`score-${submission.id}`}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          inputMode="numeric"
                          value={draft.score}
                          onChange={(e) =>
                            updateDraft(submission.id, { score: e.target.value })
                          }
                        />
                      </Field>
                      <Field
                        label="Feedback"
                        hint="Optional. Visible to the student. Maximum 4000 characters."
                      >
                        <textarea
                          id={`feedback-${submission.id}`}
                          className="cb-input"
                          rows={4}
                          maxLength={4000}
                          value={draft.feedback}
                          onChange={(e) =>
                            updateDraft(submission.id, { feedback: e.target.value })
                          }
                          placeholder="What went well? What should the student try next?"
                        />
                      </Field>
                      <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-3)" }}>
                        <Button
                          type="submit"
                          size="sm"
                          loading={savingId === submission.id}
                          disabled={savingId === submission.id}
                        >
                          <CheckCircle size={16} aria-hidden />
                          Save grade
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setEditing((prev) => ({ ...prev, [submission.id]: false }))
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

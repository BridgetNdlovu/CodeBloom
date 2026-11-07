import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, ClipboardList, Compass, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, ErrorMessage, PageHeader } from "../../components/ui/inputs";
import {
  deleteAssignment,
  getInstructorAssignments,
  updateAssignment,
  type AssignmentDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

const STATUS_VARIANT: Record<string, "default" | "soft" | "warning"> = {
  published: "default",
  closed: "soft",
  draft: "warning",
};

export function InstructorAssignments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [actingId, setActingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getInstructorAssignments();
        if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load assignments.").message);
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

  async function handleClose(assignment: AssignmentDto) {
    if (actingId !== null) return;
    if (!window.confirm(`Close "${assignment.title}"? Students will no longer be able to submit.`)) {
      return;
    }
    setActionError(undefined);
    setNotice(undefined);
    setActingId(assignment.id);
    try {
      await updateAssignment(assignment.id, { status: "closed" });
      setNotice(`"${assignment.title}" is now closed.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to close this assignment.").message);
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(assignment: AssignmentDto) {
    if (actingId !== null) return;
    if (
      !window.confirm(
        `Delete "${assignment.title}"? If students already submitted, the assignment will be closed instead so their work is preserved.`,
      )
    ) {
      return;
    }
    setActionError(undefined);
    setNotice(undefined);
    setActingId(assignment.id);
    try {
      const result = await deleteAssignment(assignment.id);
      if (result.closed) {
        setNotice(
          result.message ??
            `"${assignment.title}" has submissions and was closed instead of deleted.`,
        );
      } else {
        setNotice(`"${assignment.title}" was deleted.`);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to delete this assignment.").message);
    } finally {
      setActingId(null);
    }
  }

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

  if (error) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load assignments</h2>
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
          title="Assignments"
          subtitle="Create, close and review assignments for your classes."
          actions={
            <Button onClick={() => navigate("/app/instructor/assignments/create")}>
              <Plus size={18} aria-hidden />
              Create Assignment
            </Button>
          }
        />

        {actionError ? <ErrorMessage message={actionError} /> : null}
        {notice ? (
          <div
            className="cb-card cb-card-pad"
            role="status"
            style={{ marginBottom: "var(--cb-space-4)", borderLeft: "4px solid var(--cb-green)" }}
          >
            <p className="cb-body-text" style={{ margin: 0 }}>{notice}</p>
          </div>
        ) : null}

        {assignments.length === 0 ? (
          <EmptyState
            icon={<Compass size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
            title="No assignments yet"
            message="Create your first assignment to assign missions to your classes."
            action={
              <Button onClick={() => navigate("/app/instructor/assignments/create")}>
                Create your first assignment
              </Button>
            }
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--cb-space-4)" }}>
            {assignments.map((a) => (
              <article key={a.id} className="cb-card cb-card-pad">
                <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)", alignItems: "flex-start" }}>
                  <h3 style={{ margin: 0, fontSize: "1.15rem" }}>{a.title}</h3>
                  <Badge variant={STATUS_VARIANT[a.status] ?? "soft"}>{a.status}</Badge>
                </div>
                <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)", fontSize: "0.9rem" }}>
                  {a.description?.trim() || "No description."}
                </p>
                <dl style={{ margin: "0 0 var(--cb-space-4)", display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--cb-space-2) var(--cb-space-3)", fontSize: "0.88rem" }}>
                  <dt className="cb-muted">Class</dt>
                  <dd style={{ margin: 0 }}>{a.className ?? "All classes"}</dd>
                  <dt className="cb-muted">Missions</dt>
                  <dd style={{ margin: 0 }}>
                    {a.missionIds.length} mission{a.missionIds.length === 1 ? "" : "s"}
                  </dd>
                  <dt className="cb-muted">Deadline</dt>
                  <dd style={{ margin: 0 }}>
                    {a.deadline ? new Date(a.deadline).toLocaleString() : "No deadline"}
                  </dd>
                  <dt className="cb-muted">Submissions</dt>
                  <dd style={{ margin: 0 }}>{a.submissionCount}</dd>
                </dl>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--cb-space-3)" }}>
                  <Link
                    to={`/app/instructor/assignments/${a.id}/submissions`}
                    className="cb-btn cb-btn-primary cb-btn-sm cb-btn-block"
                  >
                    <ClipboardList size={16} aria-hidden />
                    View {a.submissionCount} submission{a.submissionCount === 1 ? "" : "s"}
                  </Link>
                  <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
                    {a.status === "published" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleClose(a)}
                        loading={actingId === a.id}
                        disabled={actingId !== null}
                      >
                        <Archive size={16} aria-hidden />
                        Close
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(a)}
                      loading={actingId === a.id}
                      disabled={actingId !== null}
                    >
                      <Trash2 size={16} aria-hidden />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

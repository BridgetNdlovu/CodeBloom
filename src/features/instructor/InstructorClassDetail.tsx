import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
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
  addStudentsToClass,
  deleteClass,
  generateJoinCode,
  getAvailableStudents,
  getInstructorClass,
  removeStudentFromClass,
  updateClass,
  type InstructorClassDetailDto,
  type InstructorStudentDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

function studentLabel(student: InstructorStudentDto): string {
  return student.displayName?.trim() || student.userName || student.email || student.id;
}

export function InstructorClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const id = classId ? Number(classId) : NaN;
  const validId = Number.isInteger(id) && id > 0;

  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState<string | undefined>(undefined);
  const [classData, setClassData] = useState<InstructorClassDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [joinExpiresAt, setJoinExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InstructorStudentDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Class ID changes and reloads need a visible pending state.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getInstructorClass(id);
        if (cancelled) return;
        setClassData(data);
        setJoinCode(data.joinCode ?? null);
        setJoinExpiresAt(data.joinCodeExpiresAt ?? null);
        setEditName(data.name);
        setEditDescription(data.description ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load this class.").message);
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

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!validId) return;
    setSearching(true);
    setSearchError(undefined);
    try {
      const data = await getAvailableStudents(id, search.trim() || undefined);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setSearchError(toAuthError(err, "Unable to search student accounts.").message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(student: InstructorStudentDto) {
    if (!validId || addingId) return;
    setActionError(undefined);
    setAddingId(student.id);
    try {
      await addStudentsToClass(id, [student.id]);
      setResults((prev) => prev.filter((s) => s.id !== student.id));
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to add this student to the class.").message);
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(student: InstructorStudentDto) {
    if (!validId || removingId) return;
    if (
      !window.confirm(
        `Remove ${studentLabel(student)} from this class? Their work and progress are not deleted.`,
      )
    ) {
      return;
    }
    setActionError(undefined);
    setRemovingId(student.id);
    try {
      await removeStudentFromClass(id, student.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to remove this student from the class.").message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleGenerateCode() {
    if (!validId || generating) return;
    setActionError(undefined);
    setGenerating(true);
    setCopied(false);
    try {
      const result = await generateJoinCode(id);
      setJoinCode(result.joinCode);
      setJoinExpiresAt(result.expiresAt);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to generate a join code.").message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Copy failed. Select the code above and copy it manually.");
    }
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!validId || savingEdit) return;
    if (!editName.trim()) {
      setActionError("Class name cannot be empty.");
      return;
    }
    setActionError(undefined);
    setSavingEdit(true);
    try {
      await updateClass(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditing(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(toAuthError(err, "Unable to update this class.").message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!validId || deleting) return;
    if (
      !window.confirm(
        "Delete this class? Students lose access to its assignments. This cannot be undone.",
      )
    ) {
      return;
    }
    setActionError(undefined);
    setDeleting(true);
    try {
      await deleteClass(id);
      navigate("/app/instructor/classes");
    } catch (err) {
      setActionError(toAuthError(err, "Unable to delete this class.").message);
      setDeleting(false);
    }
  }

  if (!validId) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Class not found</h2>
            <p className="cb-body-text">This class address is not valid.</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Link to="/app/instructor/classes" className="cb-btn cb-btn-secondary">
                Back to classes
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
            <span>Loading class…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load class</h2>
            <p className="cb-body-text">
              {error ?? "This class does not exist or you do not have access to it."}
            </p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
              <Link to="/app/instructor/classes" className="cb-btn cb-btn-secondary">
                Back to classes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const students = classData.students ?? [];

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title={classData.name}
          subtitle={
            classData.description?.trim()
              ? classData.description
              : `${students.length} student${students.length === 1 ? "" : "s"} in this class`
          }
          actions={
            <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
              <Link to="/app/instructor/classes" className="cb-btn cb-btn-secondary cb-btn-sm">
                <ArrowLeft size={16} aria-hidden />
                Back to classes
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
                <Pencil size={16} aria-hidden />
                {editing ? "Cancel edit" : "Edit class"}
              </Button>
              <Button size="sm" variant="danger" onClick={() => void handleDelete()} loading={deleting}>
                <Trash2 size={16} aria-hidden />
                Delete
              </Button>
            </div>
          }
        />

        {actionError ? (
          <ErrorMessage message={actionError} />
        ) : null}

        {editing ? (
          <form
            onSubmit={(e) => void handleSaveEdit(e)}
            className="cb-card cb-card-pad"
            style={{ marginBottom: "var(--cb-space-6)" }}
            noValidate
          >
            <h2 className="cb-section-title">Edit class details</h2>
            <Field label="Class name" required>
              <TextInput
                id="class-name"
                name="name"
                autoComplete="off"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <TextInput
                id="class-description"
                name="description"
                autoComplete="off"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Field>
            <div className="cb-hero-actions">
              <Button type="submit" loading={savingEdit} disabled={savingEdit}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setEditName(classData.name);
                  setEditDescription(classData.description ?? "");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        <section className="cb-dash-section" aria-label="Class join code">
          <div className="cb-card cb-card-pad">
            <div className="cb-flex cb-flex-between" style={{ flexWrap: "wrap", gap: "var(--cb-space-3)" }}>
              <div>
                <h2 className="cb-section-title" style={{ marginBottom: "var(--cb-space-1)" }}>
                  Join code
                </h2>
                <p className="cb-body-text" style={{ marginBottom: 0 }}>
                  Students enter this code on the Join a Class page to join your class.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleGenerateCode()}
                loading={generating}
                disabled={generating}
              >
                <Plus size={16} aria-hidden />
                {joinCode ? "Generate new code" : "Generate join code"}
              </Button>
            </div>

            {joinCode ? (
              <div style={{ marginTop: "var(--cb-space-4)" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--cb-space-3)",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <code
                    style={{
                      fontFamily: "var(--cb-font-mono)",
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      background: "var(--cb-surface-alt, #f3f6f2)",
                      padding: "var(--cb-space-3) var(--cb-space-4)",
                      borderRadius: "var(--cb-radius-md)",
                    }}
                  >
                    {joinCode}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                    {copied ? "Copied" : "Copy code"}
                  </Button>
                </div>
                <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-2)", marginBottom: 0 }}>
                  {joinExpiresAt
                    ? `Expires ${new Date(joinExpiresAt).toLocaleString()}. Generating a new code replaces this one.`
                    : "This code does not have a recorded expiry. Generate a new code to set one."}
                </p>
              </div>
            ) : (
              <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-3)" }}>
                No active join code. Generate one to let students join themselves.
              </p>
            )}
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Add students">
          <h2 className="cb-section-title">Add students</h2>
          <form
            onSubmit={(e) => void handleSearch(e)}
            className="cb-card cb-card-pad"
            style={{ marginTop: "var(--cb-space-3)" }}
          >
            <div className="cb-flex" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 260px" }}>
                <Field label="Search student accounts" hint="Search by username, display name or email.">
                  <TextInput
                    id="student-search"
                    name="q"
                    autoComplete="off"
                    placeholder="e.g. alex or alex@example.com"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" variant="secondary" loading={searching} disabled={searching}>
                Search
              </Button>
            </div>

            {searchError ? <ErrorMessage message={searchError} /> : null}

            {results.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: "var(--cb-space-4) 0 0", display: "grid", gap: "var(--cb-space-2)" }}>
                {results.map((student) => (
                  <li
                    key={student.id}
                    className="cb-flex cb-flex-between"
                    style={{ gap: "var(--cb-space-3)", flexWrap: "wrap", alignItems: "center" }}
                  >
                    <span>
                      <strong>{studentLabel(student)}</strong>{" "}
                      <span className="cb-muted" style={{ fontSize: "0.85rem" }}>
                        @{student.userName} · {student.email}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => void handleAdd(student)}
                      loading={addingId === student.id}
                      disabled={addingId !== null}
                    >
                      <Plus size={16} aria-hidden />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            ) : !searching ? (
              <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-3)", marginBottom: 0 }}>
                Search to find active student accounts that are not already in this class.
              </p>
            ) : null}
          </form>
        </section>

        <section className="cb-dash-section" aria-label="Class students">
          <div className="cb-dash-section-head">
            <h2>Students ({students.length})</h2>
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon={<Users size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
              title="No students yet"
              message="Share the join code, or search for a student account above and add them directly."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--cb-space-3)" }}>
              {students.map((student) => (
                <article key={student.id} className="cb-card cb-card-pad">
                  <div className="cb-flex cb-flex-between" style={{ alignItems: "flex-start", gap: "var(--cb-space-3)" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{studentLabel(student)}</p>
                      <p className="cb-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                        @{student.userName} · {student.email}
                      </p>
                      {student.joinedAt ? (
                        <p className="cb-field-hint" style={{ margin: "var(--cb-space-2) 0 0" }}>
                          Joined {new Date(student.joinedAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${studentLabel(student)} from class`}
                      onClick={() => void handleRemove(student)}
                      loading={removingId === student.id}
                      disabled={removingId !== null}
                    >
                      <UserMinus size={16} aria-hidden />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cb-dash-section" aria-label="Class assignments">
          <div className="cb-dash-section-head">
            <h2>Assignments ({classData.assignments?.length ?? 0})</h2>
            <Link to="/app/instructor/assignments/create">Create assignment</Link>
          </div>
          {classData.assignments && classData.assignments.length > 0 ? (
            <div className="cb-card cb-card-pad" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--cb-border)" }}>
                    <th style={thStyle}>Assignment</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Deadline</th>
                    <th style={thStyle} />
                  </tr>
                </thead>
                <tbody>
                  {classData.assignments.map((assignment) => (
                    <tr key={assignment.id} style={{ borderBottom: "1px solid var(--cb-border)" }}>
                      <td style={tdStyle}>{assignment.title}</td>
                      <td style={tdStyle}>
                        <Badge
                          variant={
                            assignment.status === "published"
                              ? "default"
                              : assignment.status === "closed"
                                ? "soft"
                                : "warning"
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleString()
                          : "No deadline"}
                      </td>
                      <td style={tdStyle}>
                        <Link
                          to={`/app/instructor/assignments/${assignment.id}/submissions`}
                          className="cb-btn cb-btn-secondary cb-btn-sm"
                        >
                          <ClipboardList size={16} aria-hidden />
                          Submissions
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cb-card cb-card-pad">
              <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)" }}>
                No assignments for this class yet.
              </p>
              <Link to="/app/instructor/assignments/create" className="cb-btn cb-btn-primary cb-btn-sm">
                <Plus size={16} aria-hidden />
                Create assignment
              </Link>
            </div>
          )}
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

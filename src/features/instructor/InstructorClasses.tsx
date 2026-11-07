import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, Plus, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, ErrorMessage, PageHeader } from "../../components/ui/inputs";
import {
  generateJoinCode,
  getInstructorClasses,
  type ClassDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

interface JoinCodeInfo {
  code: string;
  expiresAt: string;
}

export function InstructorClasses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [joinCodes, setJoinCodes] = useState<Record<number, JoinCodeInfo>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getInstructorClasses();
        if (!cancelled) setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your classes.").message);
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

  async function handleGenerateCode(classId: number) {
    if (generatingId !== null) return;
    setActionError(undefined);
    setGeneratingId(classId);
    try {
      const result = await generateJoinCode(classId);
      setJoinCodes((prev) => ({
        ...prev,
        [classId]: { code: result.joinCode, expiresAt: result.expiresAt },
      }));
    } catch (err) {
      setActionError(toAuthError(err, "Unable to generate a join code.").message);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleCopy(classId: number, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(classId);
      window.setTimeout(() => setCopiedId((current) => (current === classId ? null : current)), 2000);
    } catch {
      setActionError("Copy failed. Select the join code and copy it manually.");
    }
  }

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading classes…</span>
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
            <h2>Unable to load classes</h2>
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
          title="My Classes"
          subtitle="Manage your classes and share join codes with students."
          actions={
            <Button onClick={() => navigate("/app/instructor/classes/create")}>
              <Plus size={18} aria-hidden />
              Create Class
            </Button>
          }
        />

        {actionError ? <ErrorMessage message={actionError} /> : null}

        {classes.length === 0 ? (
          <EmptyState
            icon={<Users size={48} aria-hidden style={{ color: "var(--cb-green)" }} />}
            title="No classes yet"
            message="Create your first class to start inviting students and tracking their progress."
            action={
              <Button onClick={() => navigate("/app/instructor/classes/create")}>
                Create your first class
              </Button>
            }
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--cb-space-4)" }}>
            {classes.map((c) => {
              const codeInfo = joinCodes[c.id];
              return (
                <article key={c.id} className="cb-card cb-card-pad">
                  <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)", alignItems: "flex-start" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>{c.name}</h3>
                    <Badge variant="soft">
                      {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="cb-body-text" style={{ marginBottom: "var(--cb-space-3)", fontSize: "0.9rem" }}>
                    {c.description?.trim() || "No description."}
                  </p>
                  <p className="cb-field-hint" style={{ marginBottom: "var(--cb-space-3)" }}>
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </p>

                  {codeInfo ? (
                    <div
                      style={{
                        marginBottom: "var(--cb-space-3)",
                        padding: "var(--cb-space-3)",
                        background: "var(--cb-surface-alt, #f3f6f2)",
                        borderRadius: "var(--cb-radius-md)",
                      }}
                    >
                      <div className="cb-flex cb-flex-between" style={{ alignItems: "center", gap: "var(--cb-space-2)", flexWrap: "wrap" }}>
                        <code style={{ fontFamily: "var(--cb-font-mono)", fontWeight: 700, letterSpacing: "0.15em" }}>
                          {codeInfo.code}
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => void handleCopy(c.id, codeInfo.code)}>
                          {copiedId === c.id ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                          {copiedId === c.id ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="cb-field-hint" style={{ margin: "var(--cb-space-2) 0 0" }}>
                        Expires {new Date(codeInfo.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  ) : null}

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--cb-space-3)" }}>
                    <Link
                      to={`/app/instructor/classes/${c.id}`}
                      className="cb-btn cb-btn-primary cb-btn-sm cb-btn-block"
                    >
                      Manage class &amp; students
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleGenerateCode(c.id)}
                      loading={generatingId === c.id}
                      disabled={generatingId !== null}
                    >
                      <Plus size={16} aria-hidden />
                      {codeInfo ? "Generate new code" : "Generate join code"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

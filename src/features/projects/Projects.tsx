import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, PageHeader } from "../../components/ui/inputs";
import { SceneStage } from "../../components/game/SceneStage";
import { parseGameProject } from "../../game/templates";
import { getProjects, deleteProject, type ProjectDto } from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_progress: "In progress",
  complete: "Complete",
};

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getProjects();
        if (!cancelled) setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load your projects.").message);
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

  async function handleDelete(project: ProjectDto) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setError(undefined);
    try {
      await deleteProject(project.id);
      setProjects((p) => p.filter((x) => x.id !== project.id));
    } catch (err) {
      setError(toAuthError(err, "Unable to delete this project.").message);
    }
  }

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading your projects…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="My Projects"
          subtitle="Your studio games and written coding projects, saved to your account."
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate("/app/projects/new")}>
                <Plus size={18} aria-hidden />
                New Writing Project
              </Button>
              <Button onClick={() => navigate("/app/studio")}>
                <Wand2 size={18} aria-hidden />
                New Game
              </Button>
            </>
          }
        />

        {error ? (
          <div className="cb-card cb-card-pad" style={{ marginBottom: "var(--cb-space-6)" }}>
            <p className="cb-field-error" role="alert" style={{ marginBottom: "var(--cb-space-3)" }}>
              {error}
            </p>
            <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
              Try Again
            </Button>
          </div>
        ) : null}

        <div className="cb-project-grid">
          {projects.length > 0 ? (
            projects.map((p) => {
              const game = parseGameProject(p.content);
              return (
                <article key={p.id} className="cb-card cb-card-pad cb-project-card">
                  {game ? (
                    <div className="cb-project-game-thumb">
                      <SceneStage scene={game.scene} thumbnail />
                    </div>
                  ) : null}
                  <div className="cb-flex cb-flex-between" style={{ alignItems: "flex-start" }}>
                    <div>
                      <h3 className="cb-section-title" style={{ fontSize: "1.2rem" }}>{p.title}</h3>
                      <p className="cb-body-text">{p.description ?? "No description."}</p>
                    </div>
                    <div className="cb-flex" style={{ gap: "0.35rem" }}>
                      {game ? <Badge variant="soft">Game</Badge> : null}
                      <Badge variant={p.status === "complete" ? "default" : p.status === "in_progress" ? "warning" : "soft"}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="cb-flex cb-flex-between cb-muted" style={{ marginTop: "var(--cb-space-4)", fontSize: "0.85rem" }}>
                    <span>{p.versionCount} version{p.versionCount !== 1 ? "s" : ""}</span>
                    <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-4)" }}>
                    {game ? (
                      <>
                        <Link to={`/app/studio/${p.id}`} className="cb-btn cb-btn-primary cb-btn-sm">
                          <Wand2 size={16} aria-hidden />
                          Open in Studio
                        </Link>
                        <Link to={`/app/projects/${p.id}`} className="cb-btn cb-btn-secondary cb-btn-sm">
                          <Pencil size={16} aria-hidden />
                          Details
                        </Link>
                      </>
                    ) : (
                      <Link to={`/app/projects/${p.id}`} className="cb-btn cb-btn-secondary cb-btn-sm">
                        <Pencil size={16} aria-hidden />
                        Open Project
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => void handleDelete(p)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              icon={<Plus size={40} aria-hidden />}
              title="No projects yet"
              message="Create your first project to save your ideas, code notes or a story about your garden."
              action={
                <Button onClick={() => navigate("/app/projects/new")}>
                  Start Your First Project
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

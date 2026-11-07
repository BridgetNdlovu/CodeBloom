import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, PageHeader, TextInput } from "../../components/ui/inputs";
import { SceneStage } from "../../components/game/SceneStage";
import { parseGameProject } from "../../game/templates";
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
  type ProjectDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export function ProjectEditor() {
  const { projectId } = useParams();
  const isNew = !projectId;
  const numericId = projectId ? Number(projectId) : NaN;
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function load() {
      if (!Number.isFinite(numericId)) {
        setError("This project could not be found.");
        setLoading(false);
        return;
      }
      try {
        const data = await getProject(numericId);
        if (cancelled) return;
        setProject(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setContent(data.content ?? "");
        setStatus(data.status);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load this project.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isNew, numericId]);

  const gameProject = parseGameProject(project?.content);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setFieldError(undefined);
    if (title.trim().length < 1) {
      setFieldError("Please give your project a title.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const result = await createProject({
          title: title.trim(),
          description: description.trim() || undefined,
          content,
        });
        navigate(`/app/projects/${result.id}`, { replace: true });
      } else {
        await updateProject(numericId, {
          title: title.trim(),
          description: description.trim(),
          content,
          status,
        });
        navigate("/app/projects");
      }
    } catch (err) {
      setError(toAuthError(err, "Unable to save this project.").message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await deleteProject(numericId);
      navigate("/app/projects");
    } catch (err) {
      setError(toAuthError(err, "Unable to delete this project.").message);
    }
  };

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading project…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isNew && !project) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Project unavailable</h2>
            <p className="cb-body-text">{error}</p>
            <Link to="/app/projects" className="cb-btn cb-btn-secondary">
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page-pad">
      <div className="cb-container" style={{ maxWidth: 800 }}>
        <PageHeader
          title={isNew ? "New Project" : "Edit Project"}
          subtitle="Save your ideas, code notes, or a story about your garden."
          actions={
            <>
              <Link to="/app/projects" className="cb-btn cb-btn-secondary cb-btn-sm">
                <ArrowLeft size={16} aria-hidden />
                Back to projects
              </Link>
            </>
          }
        />

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Field label="Title" required error={fieldError}>
            <TextInput
              id="project-title"
              name="title"
              autoComplete="off"
              placeholder="e.g. My First Garden"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Description">
            <TextInput
              id="project-description"
              name="description"
              autoComplete="off"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {!isNew ? (
            <Field label="Status">
              <select
                id="project-status"
                name="status"
                className="cb-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {gameProject ? (
            <div className="cb-project-game-panel">
              <div className="cb-project-game-preview">
                <SceneStage scene={gameProject.scene} thumbnail />
              </div>
              <div>
                <h3>This is a CodeBloom game project</h3>
                <p className="cb-body-text">
                  This saved game project is kept for reference. Learners now play
                  ready-made games from the Game Library; its saved game content is
                  preserved when you update the title or description here.
                </p>
                <ul className="cb-project-game-facts">
                  <li>{gameProject.scene.sprites.length} sprites</li>
                  <li>{gameProject.scene.sprites.filter((s) => s.role === "collectible").length} collectibles</li>
                  <li>Win: {gameProject.scene.rules.win.type.replace("_", " ")}</li>
                </ul>
              </div>
            </div>
          ) : (
            <Field
              label="Project notes / code"
              hint="Write your plan, paste a snippet, or describe the story."
            >
              <textarea
                id="project-content"
                name="content"
                className="cb-input"
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing here…"
              />
            </Field>
          )}

          {error ? <ErrorMessage message={error} /> : null}

          <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-6)" }}>
            <Button type="submit" size="lg" loading={saving} disabled={saving}>
              <Save size={18} aria-hidden />
              {isNew ? "Create project" : "Save changes"}
            </Button>
            {!isNew ? (
              <Button type="button" variant="danger" size="lg" onClick={() => void handleDelete()}>
                <Trash2 size={18} aria-hidden />
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  Code2,
  Expand,
  Image,
  LayoutTemplate,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { AssetBrowser } from "../../components/game/AssetBrowser";
import { BlockWorkspace, type BlockWorkspaceHandle } from "../../components/game/BlockWorkspace";
import { SceneStage } from "../../components/game/SceneStage";
import { executableBlockCount } from "../../game/blocks";
import { SceneRuntime, type RunResult } from "../../game/engine";
import { assetLabel } from "../../game/assets";
import { backgroundList } from "../../game/backgrounds";
import {
  STUDIO_TEMPLATES,
  SPRITE_ANIMATIONS,
  blankProject,
  newSprite,
  parseGameProject,
  serializeGameProject,
} from "../../game/templates";
import type {
  AnimationName,
  BlockNode,
  GameProject,
  RuntimeState,
  Scene,
  SpriteDef,
  SpriteRole,
  WinType,
} from "../../game/types";
import {
  createProject,
  getProject,
  updateProject,
  type ProjectDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";
import { ApiError } from "../../services/apiClient";

const ROLE_OPTIONS: Array<{ value: SpriteRole; label: string }> = [
  { value: "player", label: "Player" },
  { value: "collectible", label: "Collectible" },
  { value: "goal", label: "Goal" },
  { value: "obstacle", label: "Obstacle" },
  { value: "decoration", label: "Scenery" },
  { value: "npc", label: "Character" },
];

const NUMBER = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function GameStudio() {
  const { projectId } = useParams();
  const numericId = projectId ? Number(projectId) : null;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<GameProject | null>(
    numericId ? null : blankProject(),
  );
  const [loadedProject, setLoadedProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(Boolean(numericId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upgraded, setUpgraded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"sprites" | "backgrounds">("sprites");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const openLibrary = (tab: "sprites" | "backgrounds" = "sprites") => {
    setLibraryTab(tab);
    setLibraryOpen(true);
  };

  const workspaceRef = useRef<BlockWorkspaceHandle>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const programRef = useRef<BlockNode[]>([]);
  const stageWrapRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------ load
  useEffect(() => {
    if (!numericId) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Project ID changes need a visible loading state.
    setLoading(true);
    setLoadError(null);
    setUpgraded(false);
    getProject(numericId)
      .then((dto) => {
        if (cancelled) return;
        setLoadedProject(dto);
        const parsed = parseGameProject(dto.content);
        if (parsed) {
          setProject({
            ...parsed,
            title: dto.title || parsed.title,
            description: dto.description ?? parsed.description,
          });
        } else {
          const fresh = blankProject(dto.title || "My Game");
          setProject({ ...fresh, description: dto.description ?? fresh.description });
          setUpgraded(true);
        }
        setDirty(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? "That project does not exist, or it belongs to another learner."
            : toAuthError(error, "Unable to open this project.").message,
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  // --------------------------------------------------------------- runtime
  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const disposeRuntime = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    runtimeRef.current?.dispose();
    runtimeRef.current = null;
    programRef.current = [];
  }, []);

  useEffect(() => disposeRuntime, [disposeRuntime]);

  const touch = useCallback(() => setDirty(true), []);

  const update = useCallback(
    (updater: (project: GameProject) => GameProject) => {
      setProject((current) => (current ? updater(current) : current));
      setDirty(true);
    },
    [],
  );

  const updateScene = useCallback(
    (updater: (scene: Scene) => Scene) => {
      update((current) => ({ ...current, scene: updater(current.scene) }));
    },
    [update],
  );

  const updateSprite = useCallback(
    (id: string, patch: Partial<SpriteDef>) => {
      updateScene((scene) => ({
        ...scene,
        sprites: scene.sprites.map((sprite) =>
          sprite.id === id ? { ...sprite, ...patch } : sprite,
        ),
      }));
    },
    [updateScene],
  );

  const selected = project?.scene.sprites.find((s) => s.id === selectedId) ?? null;

  // ---------------------------------------------------------------- actions
  const handleAddSprite = (assetKey: string, role: SpriteRole) => {
    if (!project) return;
    const created = newSprite(project.scene, assetKey, assetLabel(assetKey), role);
    update((current) => ({
      ...current,
      scene: { ...current.scene, sprites: [...current.scene.sprites, created] },
    }));
    setSelectedId(created.id);
    setLibraryOpen(false);
    toast(`${created.name} added as ${role}.`, "success");
  };

  const handleChooseBackground = (backgroundKey: string) => {
    updateScene((scene) => ({ ...scene, background: backgroundKey }));
    setLibraryOpen(false);
    toast("Background changed.", "success");
  };

  const handleDeleteSprite = () => {
    if (!selected) return;
    updateScene((scene) => ({
      ...scene,
      sprites: scene.sprites.filter((sprite) => sprite.id !== selected.id),
    }));
    setSelectedId(null);
  };

  const applyTemplate = (templateId: string) => {
    const template =
      STUDIO_TEMPLATES.find((item) => item.id === templateId) ?? STUDIO_TEMPLATES[0];
    if (
      dirty &&
      !window.confirm("Replace the current scene and code with this template?")
    ) {
      return;
    }
    disposeRuntime();
    setRuntimeState(null);
    setRunResult(null);
    setRunning(false);
    setSelectedId(null);
    setProject(template.build());
    setTemplatesOpen(false);
    setDirty(true);
    toast(`${template.title} loaded. Press Save when you are ready.`, "info");
  };

  const handleSave = async () => {
    if (!project || saving) return;
    const xml = workspaceRef.current?.getXml() ?? project.blocksXml;
    const saved: GameProject = { ...project, blocksXml: xml };
    const content = serializeGameProject(saved);
    const payload = {
      title: saved.title.trim() || "My Game",
      description: saved.description,
      content,
      status: "in_progress" as const,
    };
    setSaving(true);
    try {
      if (numericId) {
        await updateProject(numericId, payload);
        setProject((current) =>
          current
            ? {
                ...current,
                title: payload.title,
                description: payload.description,
                updatedAt: saved.updatedAt,
              }
            : current,
        );
        // Every successful save adds a version on the server, so keep the
        // header badge in sync instead of showing a stale count.
        setLoadedProject((current) =>
          current
            ? {
                ...current,
                title: payload.title,
                description: payload.description,
                content,
                status: payload.status,
                updatedAt: new Date().toISOString(),
                versionCount: current.versionCount + 1,
              }
            : current,
        );
        setDirty(false);
        toast("Project saved. Open My Projects to see it there too.", "success");
      } else {
        const result = await createProject(payload);
        const now = new Date().toISOString();
        setProject((current) =>
          current
            ? { ...current, title: payload.title, updatedAt: saved.updatedAt }
            : current,
        );
        setLoadedProject({
          id: result.id,
          title: payload.title,
          description: payload.description,
          content,
          status: payload.status,
          createdAt: now,
          updatedAt: now,
          versionCount: 1,
        });
        setDirty(false);
        toast("Project created. Keep building!", "success");
        navigate(`/app/studio/${result.id}`, { replace: true });
      }
    } catch (error) {
      toast(toAuthError(error, "Could not save the project.").message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    if (!project || running) return;
    const program = workspaceRef.current?.getProgram() ?? [];
    if (executableBlockCount(program) === 0) {
      toast("Add blocks under a When game starts block, then press Run.", "info");
      return;
    }
    disposeRuntime();
    programRef.current = program;
    setRunResult(null);
    setSelectedId(null);
    setLibraryOpen(false);
    const runtime = new SceneRuntime(project.scene, {
      sound: soundOn,
      variables: project.variables,
      onEnd: (result) => setRunResult(result),
    });
    runtimeRef.current = runtime;
    unsubscribeRef.current = runtime.subscribe(setRuntimeState);
    setRunning(true);
    await runtime.run(program);
    if (runtimeRef.current === runtime) setRunning(false);
  };

  const handleStop = () => {
    runtimeRef.current?.stop();
    setRuntimeState(null);
    setRunning(false);
  };

  const handleReset = () => {
    if (runtimeRef.current) {
      runtimeRef.current.reset();
      runtimeRef.current.setSoundEnabled(soundOn);
    }
    setRuntimeState(null);
    setRunResult(null);
    setRunning(false);
  };

  const handleSpriteClick = (id: string) => {
    runtimeRef.current?.clickSprite(
      id,
      programRef.current.filter((node) => node.type === "event_click"),
    );
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    runtimeRef.current?.setSoundEnabled(next);
  };

  const toggleFullscreen = () => {
    const element = stageWrapRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void element.requestFullscreen?.().catch(() => {
        toast("Fullscreen is not available in this browser.", "info");
      });
    }
  };

  const goBack = () => {
    if (
      dirty &&
      !window.confirm("Leave the studio? Unsaved changes in this project will be lost.")
    ) {
      return;
    }
    navigate("/app/projects");
  };

  // ----------------------------------------------------------------- render
  if (loading) {
    return (
      <div className="cb-studio-loading">
        <span className="cb-spinner" aria-hidden />
        <p>Opening your studio project…</p>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="cb-card cb-card-pad" style={{ maxWidth: 620, margin: "3rem auto" }}>
        <h1 className="cb-page-title">Project unavailable</h1>
        <p className="cb-body-text">{loadError ?? "This project could not be opened."}</p>
        <div className="cb-flex" style={{ marginTop: "1.5rem" }}>
          <Button variant="secondary" onClick={() => navigate("/app/projects")}>
            Back to My Projects
          </Button>
          <Button onClick={() => navigate("/app/studio")}>Start a new game</Button>
        </div>
      </div>
    );
  }

  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : numericId
        ? "All changes saved"
        : "Not saved yet";

  return (
    <div className="cb-studio">
      <header className="cb-studio-top">
        <div className="cb-studio-top-left">
          <button type="button" className="cb-icon-btn" onClick={goBack} aria-label="Back to projects">
            <ArrowLeft size={20} />
          </button>
          <div className="cb-studio-title-wrap">
            <input
              className="cb-studio-title"
              value={project.title}
              maxLength={80}
              aria-label="Project title"
              onChange={(event) =>
                update((current) => ({ ...current, title: event.target.value }))
              }
            />
            <span className={`cb-studio-status${dirty ? " dirty" : ""}`}>
              {statusText}
              {loadedProject ? ` · v${loadedProject.versionCount}` : ""}
            </span>
          </div>
        </div>

        <div className="cb-studio-top-actions">
          <div className="cb-studio-group" role="group" aria-label="Code history">
            <button
              type="button"
              className="cb-icon-btn"
              title="Undo code change"
              aria-label="Undo code change"
              onClick={() => workspaceRef.current?.undo()}
            >
              <Undo2 size={18} />
            </button>
            <button
              type="button"
              className="cb-icon-btn"
              title="Redo code change"
              aria-label="Redo code change"
              onClick={() => workspaceRef.current?.redo()}
            >
              <Redo2 size={18} />
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<LayoutTemplate size={16} />}
            onClick={() => setTemplatesOpen(true)}
          >
            Templates
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Image size={16} />}
            onClick={() => openLibrary("sprites")}
          >
            Library
          </Button>
          <Button
            size="sm"
            icon={<Save size={16} />}
            loading={saving}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={running ? <Pause size={16} /> : <Play size={16} />}
            onClick={running ? handleStop : () => void handleRun()}
          >
            {running ? "Stop" : "Run"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw size={16} />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <button
            type="button"
            className="cb-icon-btn"
            onClick={toggleSound}
            title={soundOn ? "Mute game sounds" : "Unmute game sounds"}
            aria-label={soundOn ? "Mute game sounds" : "Unmute game sounds"}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            type="button"
            className="cb-icon-btn"
            onClick={toggleFullscreen}
            title="Fullscreen stage"
            aria-label="Fullscreen stage"
          >
            <Expand size={18} />
          </button>
        </div>
      </header>

      {upgraded ? (
        <div className="cb-studio-banner" role="status">
          <Sparkles size={18} aria-hidden />
          <p>
            This project was saved before the studio existed. We opened a fresh
            scene with your project title — press <strong>Save</strong> to upgrade
            it. Your original text is only replaced when you save.
          </p>
        </div>
      ) : null}

      <div className="cb-studio-layout">
        <aside className="cb-studio-panel cb-studio-sprites" aria-label="Scene sprites">
          <div className="cb-studio-panel-head">
            <h2>
              <Boxes size={16} aria-hidden /> Sprites
            </h2>
            <span className="cb-count-pill">{project.scene.sprites.length}</span>
          </div>
          <div className="cb-sprite-list" role="listbox" aria-label="Sprites">
            {project.scene.sprites.map((sprite) => (
              <button
                key={sprite.id}
                type="button"
                role="option"
                aria-selected={selectedId === sprite.id}
                className={`cb-sprite-row${selectedId === sprite.id ? " active" : ""}`}
                onClick={() => setSelectedId(sprite.id)}
              >
                <span className={`cb-role-dot role-${sprite.role}`} aria-hidden />
                <span className="cb-sprite-row-name">{sprite.name}</span>
                <span className="cb-sprite-row-role">{sprite.role}</span>
              </button>
            ))}
            {project.scene.sprites.length === 0 ? (
              <p className="cb-empty-note">No sprites yet. Add one below.</p>
            ) : null}
          </div>
          <div className="cb-studio-panel-actions">
            <Button
              size="sm"
              fullWidth
              icon={<Plus size={16} />}
              onClick={() => openLibrary("sprites")}
            >
              Add sprite
            </Button>
            <Button
              size="sm"
              fullWidth
              variant="secondary"
              icon={<Image size={16} />}
              onClick={() => openLibrary("backgrounds")}
            >
              Backgrounds
            </Button>
          </div>
          <div className="cb-studio-tip">
            <Code2 size={16} aria-hidden />
            <p>
              Code runs with <strong>Run</strong>. The arrow keys nudge the player
              even without blocks, and sprites with a{" "}
              <strong>When clicked</strong> block respond to a click.
            </p>
          </div>
        </aside>

        <section className="cb-studio-main">
          <div
            ref={stageWrapRef}
            className={`cb-studio-stage-wrap${fullscreen ? " is-fullscreen" : ""}`}
          >
            <SceneStage
              scene={project.scene}
              state={runtimeState}
              selectedId={selectedId}
              editable={!running && !runtimeState}
              onSelect={(id) => {
                if (runtimeState) return;
                setSelectedId(id);
              }}
              onMove={(id, x, y) => updateSprite(id, { x, y })}
              onSpriteClick={handleSpriteClick}
              onStagePointer={(x, y, down) =>
                runtimeRef.current?.setMouse(x, y, down)
              }
              label={`${project.title} stage`}
            />

            {runtimeState ? (
              <div className="cb-studio-hud" aria-live="polite">
                <span className="cb-hud-pill">
                  <strong>{runtimeState.score}</strong> points
                </span>
                <span className="cb-hud-pill">
                  {"❤".repeat(Math.max(0, runtimeState.health)) || "No hearts"}
                </span>
                {runtimeState.timeLeft !== null ? (
                  <span className="cb-hud-pill">{runtimeState.timeLeft}s</span>
                ) : null}
                {runtimeState.message ? (
                  <span className="cb-hud-message">{runtimeState.message}</span>
                ) : null}
              </div>
            ) : null}

            {(runResult || runtimeState?.status === "won" || runtimeState?.status === "lost") ? (
              <div
                className={`cb-studio-result ${(runResult?.status ?? runtimeState?.status) === "won" ? "won" : "lost"}`}
                role="status"
              >
                <h2>
                  {(runResult?.status ?? runtimeState?.status) === "won"
                    ? "You win!"
                    : "Try again"}
                </h2>
                <p>{runResult?.message ?? runtimeState?.message}</p>
                <div className="cb-flex">
                  <Button size="sm" variant="secondary" onClick={handleReset}>
                    Back to editing
                  </Button>
                  <Button size="sm" onClick={() => void handleRun()}>
                    Run again
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="cb-studio-workspace">
            <div className="cb-studio-workspace-head">
              <h2>
                <Code2 size={16} aria-hidden /> Code
              </h2>
              <span>
                {allowedSummary(project.scene)}
              </span>
            </div>
            <BlockWorkspace
              ref={workspaceRef}
              initialXml={project.blocksXml}
              onDirty={touch}
              className="cb-studio-blockly"
            />
          </div>
        </section>

        <aside className="cb-studio-panel cb-studio-properties" aria-label="Properties">
          {selected ? (
            <SpriteProperties
              sprite={selected}
              onChange={(patch) => updateSprite(selected.id, patch)}
              onDelete={handleDeleteSprite}
            />
          ) : (
            <SceneProperties
              project={project}
              onChange={(updater) => update(updater)}
              onOpenLibrary={() => openLibrary("backgrounds")}
            />
          )}
        </aside>
      </div>

      <AssetBrowser
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAddSprite={handleAddSprite}
        onChooseBackground={handleChooseBackground}
        currentBackground={project.scene.background}
        initialTab={libraryTab}
      />

      {templatesOpen ? (
        <div
          className="cb-drawer-backdrop"
          role="presentation"
          onClick={() => setTemplatesOpen(false)}
        >
          <section
            className="cb-template-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Project templates"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cb-drawer-head">
              <div>
                <h2>Start from a template</h2>
                <p>Every template has real, runnable code and working rules.</p>
              </div>
              <button
                type="button"
                className="cb-icon-btn"
                aria-label="Close templates"
                onClick={() => setTemplatesOpen(false)}
              >
                <ChevronDown size={20} />
              </button>
            </header>
            <div className="cb-template-grid">
              {STUDIO_TEMPLATES.map((template) => {
                const preview = template.build();
                return (
                  <article key={template.id} className="cb-template-card">
                    <div className="cb-template-preview">
                      <SceneStage scene={preview.scene} thumbnail />
                    </div>
                    <div className="cb-template-body">
                      <h3>{template.title}</h3>
                      <p>{template.tagline}</p>
                      <Button size="sm" onClick={() => applyTemplate(template.id)}>
                        Use template
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function allowedSummary(scene: Scene) {
  const goals = scene.sprites.filter((sprite) => sprite.role === "goal").length;
  const items = scene.sprites.filter((sprite) => sprite.role === "collectible").length;
  if (scene.rules.win.type === "collect_all") return `Win: collect all ${items}`;
  if (scene.rules.win.type === "score") return `Win: ${scene.rules.win.targetScore ?? 250} points`;
  return goals > 0 ? `Win: reach the goal` : "Add a goal sprite to win";
}

function SpriteProperties({
  sprite,
  onChange,
  onDelete,
}: {
  sprite: SpriteDef;
  onChange: (patch: Partial<SpriteDef>) => void;
  onDelete: () => void;
}) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      onChange({ [name]: (event.target as HTMLInputElement).checked });
      return;
    }
    if (type === "number" || type === "range") {
      onChange({ [name]: NUMBER(value, 0) });
      return;
    }
    onChange({ [name]: value });
  };

  return (
    <>
      <div className="cb-studio-panel-head">
        <h2>Sprite</h2>
        <span className="cb-count-pill">{sprite.role}</span>
      </div>
      <div className="cb-prop-scroll">
        <label className="cb-studio-field">
          <span>Name</span>
          <input name="name" value={sprite.name} onChange={change} maxLength={40} />
        </label>
        <label className="cb-studio-field">
          <span>Role</span>
          <select name="role" value={sprite.role} onChange={change}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="cb-studio-field-row">
          <label className="cb-studio-field">
            <span>x</span>
            <input
              name="x"
              type="number"
              min={0}
              max={960}
              value={Math.round(sprite.x)}
              onChange={change}
            />
          </label>
          <label className="cb-studio-field">
            <span>y</span>
            <input
              name="y"
              type="number"
              min={0}
              max={540}
              value={Math.round(sprite.y)}
              onChange={change}
            />
          </label>
        </div>
        <label className="cb-studio-field">
          <span>Size · {Math.round(sprite.size * 100)}%</span>
          <input
            name="size"
            type="range"
            min={20}
            max={260}
            value={Math.round(sprite.size * 100)}
            onChange={(event) => onChange({ size: NUMBER(event.target.value, 100) / 100 })}
          />
        </label>
        <div className="cb-studio-field-row">
          <label className="cb-studio-field">
            <span>Layer</span>
            <input
              name="layer"
              type="number"
              min={0}
              max={9}
              value={sprite.layer}
              onChange={change}
            />
          </label>
          <label className="cb-studio-field">
            <span>Costume</span>
            <input
              name="costume"
              type="number"
              min={0}
              max={5}
              value={sprite.costume}
              onChange={change}
            />
          </label>
        </div>
        <label className="cb-studio-field">
          <span>Animation</span>
          <select
            name="animation"
            value={sprite.animation}
            onChange={(event) =>
              onChange({ animation: event.target.value as AnimationName })
            }
          >
            {SPRITE_ANIMATIONS.map((animation) => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
        </label>
        <label className="cb-studio-field">
          <span>Tint</span>
          <span className="cb-tint-row">
            <input
              type="color"
              value={sprite.tint ?? "#22c55e"}
              onChange={(event) => onChange({ tint: event.target.value })}
              aria-label="Sprite tint"
            />
            {sprite.tint ? (
              <button
                type="button"
                className="cb-link-btn"
                onClick={() => onChange({ tint: undefined })}
              >
                Clear
              </button>
            ) : (
              <span className="cb-muted-small">Original colours</span>
            )}
          </span>
        </label>
        <div className="cb-studio-toggles">
          <label>
            <input
              type="checkbox"
              name="flip"
              checked={sprite.flip}
              onChange={change}
            />
            Flip
          </label>
          <label>
            <input
              type="checkbox"
              name="visible"
              checked={sprite.visible}
              onChange={change}
            />
            Visible
          </label>
        </div>
        <Button
          size="sm"
          variant="danger"
          fullWidth
          icon={<Trash2 size={16} />}
          onClick={onDelete}
        >
          Delete sprite
        </Button>
      </div>
    </>
  );
}

function SceneProperties({
  project,
  onChange,
  onOpenLibrary,
}: {
  project: GameProject;
  onChange: (updater: (project: GameProject) => GameProject) => void;
  onOpenLibrary: () => void;
}) {
  const { scene } = project;
  const goals = scene.sprites.filter((sprite) => sprite.role === "goal");

  const updateRules = (patch: Partial<Scene["rules"]>) =>
    onChange((current) => ({
      ...current,
      scene: { ...current.scene, rules: { ...current.scene.rules, ...patch } },
    }));

  const updateWin = (patch: Partial<Scene["rules"]["win"]>) =>
    updateRules({ win: { ...scene.rules.win, ...patch } });

  return (
    <>
      <div className="cb-studio-panel-head">
        <h2>Scene</h2>
        <span className="cb-count-pill">{scene.sprites.length} sprites</span>
      </div>
      <div className="cb-prop-scroll">
        <label className="cb-studio-field">
          <span>Background</span>
          <select
            value={scene.background}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                scene: { ...current.scene, background: event.target.value },
              }))
            }
          >
            {backgroundList().map((background) => (
              <option key={background.key} value={background.key}>
                {background.name} · {background.category}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          icon={<Image size={16} />}
          onClick={onOpenLibrary}
        >
          Browse backgrounds and sprites
        </Button>

        <label className="cb-studio-field">
          <span>Description</span>
          <textarea
            rows={3}
            maxLength={400}
            value={project.description ?? ""}
            onChange={(event) =>
              onChange((current) => ({ ...current, description: event.target.value }))
            }
          />
        </label>

        <h3 className="cb-studio-subhead">Win rule</h3>
        <label className="cb-studio-field">
          <span>How does the game end?</span>
          <select
            value={scene.rules.win.type}
            onChange={(event) => updateWin({ type: event.target.value as WinType })}
          >
            <option value="reach">Reach a goal sprite</option>
            <option value="collect_all">Collect every collectible</option>
            <option value="score">Reach a score</option>
          </select>
        </label>
        {scene.rules.win.type === "reach" ? (
          <label className="cb-studio-field">
            <span>Goal sprite</span>
            <select
              value={scene.rules.win.targetId ?? ""}
              onChange={(event) => updateWin({ targetId: event.target.value })}
            >
              <option value="">Any goal sprite</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {scene.rules.win.type === "score" ? (
          <label className="cb-studio-field">
            <span>Target score</span>
            <input
              type="number"
              min={10}
              max={10000}
              value={scene.rules.win.targetScore ?? 250}
              onChange={(event) =>
                updateWin({ targetScore: NUMBER(event.target.value, 250) })
              }
            />
          </label>
        ) : null}

        <div className="cb-studio-field-row">
          <label className="cb-studio-field">
            <span>Hearts</span>
            <input
              type="number"
              min={1}
              max={9}
              value={scene.rules.lives}
              onChange={(event) =>
                updateRules({ lives: NUMBER(event.target.value, 3) })
              }
            />
          </label>
          <label className="cb-studio-field">
            <span>Timer (s)</span>
            <input
              type="number"
              min={0}
              max={600}
              value={scene.rules.timeLimit ?? 0}
              onChange={(event) => {
                const value = NUMBER(event.target.value, 0);
                updateRules({ timeLimit: value > 0 ? value : null });
              }}
            />
          </label>
        </div>

        <h3 className="cb-studio-subhead">Starter variables</h3>
        {project.variables.map((variable, index) => (
          <div key={`${variable.name}-${index}`} className="cb-variable-row">
            <input
              value={variable.name}
              aria-label="Variable name"
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  variables: current.variables.map((item, i) =>
                    i === index ? { ...item, name: event.target.value } : item,
                  ),
                }))
              }
            />
            <input
              type="number"
              value={Number(variable.value) || 0}
              aria-label="Variable value"
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  variables: current.variables.map((item, i) =>
                    i === index
                      ? { ...item, value: NUMBER(event.target.value, 0) }
                      : item,
                  ),
                }))
              }
            />
          </div>
        ))}
        <p className="cb-muted-small">
          Variables start each run with these values. Use the Variables blocks to
          read and change them.
        </p>
        <div className="cb-studio-links">
          <Link to="/app/projects">Open My Projects</Link>
          <Link to="/app/games">Browse the game library</Link>
        </div>
      </div>
    </>
  );
}

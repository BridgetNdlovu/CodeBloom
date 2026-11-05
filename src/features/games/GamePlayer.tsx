import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Expand,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  GameBlockWorkspace,
  type GameBlockWorkspaceHandle,
} from "../../games/GameBlockWorkspace";
import { starterXmlFor } from "../../games/blocks";
import {
  gameSpecFor,
  missionSpecFor,
  type GamePalette,
  type GameSpec,
  type MissionSpec,
} from "../../games/catalogue";
import type {
  GameController,
  RunOutcome,
  RuntimeState,
} from "../../games/runtime";
import {
  completeGameMission,
  getGame,
  getGameMissions,
  sendAiMessage,
  startGameMission,
  type GameDto,
  type GameMissionDto,
  type GameMissionResultDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

type ThemeKey = "classic" | "sunset" | "night";

const THEMES: Array<{ key: ThemeKey; label: string }> = [
  { key: "classic", label: "Classic" },
  { key: "sunset", label: "Sunset" },
  { key: "night", label: "Night" },
];

interface ChatMessage {
  role: "assistant" | "learner";
  text: string;
}

function paletteFor(base: GamePalette, theme: ThemeKey): GamePalette {
  if (theme === "sunset") {
    return {
      ...base,
      sky: "#4c1d95",
      sky2: "#be185d",
      ground: "#f97316",
      ground2: "#c2410c",
      accent: "#fde047",
    };
  }
  if (theme === "night") {
    return {
      ...base,
      sky: "#020617",
      sky2: "#1e1b4b",
      ground: "#0f766e",
      ground2: "#134e4a",
      accent: "#facc15",
    };
  }
  return base;
}

function codeStorageKey(gameKey: string, missionKey: string): string {
  return `cb-game-code:v1:${gameKey}:${missionKey}`;
}

function missionStorageKey(gameKey: string): string {
  return `cb-game-mission:v1:${gameKey}`;
}

export function GamePlayer() {
  const { gameId } = useParams();
  const numericId = Number(gameId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { learner } = useAuth();
  const isStudent = (learner?.role ?? "student") === "student";

  const [game, setGame] = useState<GameDto | null>(null);
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [missions, setMissions] = useState<GameMissionDto[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [completion, setCompletion] = useState<GameMissionResultDto | null>(null);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [character, setCharacter] = useState<"girl" | "boy">(
    learner?.character === "boy" ? "boy" : "girl",
  );
  const [theme, setTheme] = useState<ThemeKey>("classic");
  const [hintsShown, setHintsShown] = useState(0);
  const [codeXml, setCodeXml] = useState<string>("");

  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I can give you a hint about this mission. Tell me what you are stuck on — I will not spoil the whole answer.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const workspaceRef = useRef<GameBlockWorkspaceHandle>(null);
  const runtimeRef = useRef<GameController | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const saveGuardRef = useRef(false);
  const missionRef = useRef<GameMissionDto | null>(null);

  const mission = useMemo(
    () => missions.find((row) => row.id === selectedMissionId) ?? null,
    [missions, selectedMissionId],
  );
  const missionSpec = useMemo<MissionSpec | null>(() => {
    if (!game || !mission) return null;
    return missionSpecFor(game.key, mission.key) ?? null;
  }, [game, mission]);

  useEffect(() => {
    missionRef.current = mission;
  }, [mission]);

  // Load the game and its missions. -------------------------------------------------
  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setLoadError("That game link is not valid.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getGame(numericId)
      .then(async (detail) => {
        if (cancelled) return;
        const catalogue = gameSpecFor(detail.key);
        if (!catalogue) {
          throw new Error(
            "This game is part of the legacy library and is no longer playable here.",
          );
        }
        const missionList = await getGameMissions(detail.id);
        if (cancelled) return;
        setGame(detail);
        setSpec(catalogue);
        setMissions(missionList.missions);

        const savedKey = window.localStorage.getItem(missionStorageKey(detail.key));
        const selected =
          missionList.missions.find((row) => row.key === savedKey) ??
          missionList.missions.find((row) => !row.completed) ??
          missionList.missions[0] ??
          null;
        setSelectedMissionId(selected?.id ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(toAuthError(error, "Unable to open this game.").message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  // Persist the mission choice and reset per-mission UI.
  useEffect(() => {
    if (!game || !mission || !missionSpec || !spec) return;
    window.localStorage.setItem(missionStorageKey(game.key), mission.key);
    setHintsShown(0);
    setOutcome(null);
    setCompletion(null);
    setRuntimeState(null);
    saveGuardRef.current = false;
    const stored = window.localStorage.getItem(
      codeStorageKey(game.key, mission.key),
    );
    setCodeXml(
      stored && stored.includes("<block") ? stored : starterXmlFor(spec.mode),
    );
    setChat([
      {
        role: "assistant",
        text: `Let's work on “${mission.title}”. ${missionSpec.objective} Ask me for a hint whenever you need one.`,
      },
    ]);
  }, [game, mission, missionSpec, spec]);

  // Build the Phaser game for the current mission. ----------------------------------
  useEffect(() => {
    if (!game || !missionSpec || !mission) return;
    const container = stageRef.current;
    if (!container) return;
    let disposed = false;
    setCreating(true);

    const palette = paletteFor(spec?.palette ?? missionSpecPaletteFallback(), theme);

    import("../../games/runtime")
      .then(async ({ createGame }) => {
        if (disposed) return;
        const controller = await createGame(container, {
          mode: spec?.mode ?? missionSpecMode(game.key),
          level: missionSpec.level,
          character,
          palette,
          sound: soundOn,
          blockBudget: missionSpec.blockBudget,
          onState: (state) => {
            if (!disposed) setRuntimeState(state);
          },
          onEnd: (result) => {
            if (disposed) return;
            setOutcome(result);
            if (result.status !== "won" || !isStudent) return;
            if (saveGuardRef.current) return;
            saveGuardRef.current = true;
            const active = missionRef.current;
            if (!active) return;
            const program = workspaceRef.current?.compile();
            void completeGameMission(game.id, active.id, {
              score: result.score,
              stars: result.stars,
              timeTakenSeconds: result.timeTaken,
              blocksUsed: result.blocksUsed,
              programJson: program?.xml,
            })
              .then((summary) => {
                setCompletion(summary);
                setMissions((rows) =>
                  rows.map((row) =>
                    row.id === active.id
                      ? {
                          ...row,
                          bestStars: Math.max(row.bestStars, summary.stars),
                          bestScore: Math.max(row.bestScore, summary.score),
                          attempts: Math.max(row.attempts, summary.attempts),
                          completed: true,
                        }
                      : row,
                  ),
                );
                if (summary.pointsAwarded > 0) {
                  toast(
                    `+${summary.pointsAwarded} points! ${summary.totalStars} stars in total.`,
                    "success",
                  );
                }
                if (summary.newAchievements.length > 0) {
                  toast(`New badge: ${summary.newAchievements.join(", ")}`, "success");
                }
              })
              .catch(() => {
                toast(
                  "You won! The mission result could not be saved. Check your connection.",
                  "error",
                );
              });
          },
        });
        if (disposed) {
          controller.destroy();
          return;
        }
        runtimeRef.current = controller;
        controller.setCharacter(character);
        controller.setSound(soundOn);
        setCreating(false);
      })
      .catch(() => {
        if (disposed) return;
        setCreating(false);
        toast("The game could not start. Reload the page and try again.", "error");
      });

    return () => {
      disposed = true;
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
    // Character and sound are applied without rebuilding; theme rebuilds the world.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, mission?.id, missionSpec, theme]);

  useEffect(() => {
    runtimeRef.current?.setCharacter(character);
  }, [character]);

  useEffect(() => {
    runtimeRef.current?.setSound(soundOn);
  }, [soundOn]);

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleRun = async () => {
    const runtime = runtimeRef.current;
    const active = mission;
    if (!game || !spec || !active || !runtime || running || creating) return;

    const program = workspaceRef.current?.compile();
    const executable =
      (program?.main.length ?? 0) +
      (program?.onClick.length ?? 0) +
      (program?.onKey.length ?? 0);
    if (!program || executable === 0) {
      toast(
        "Add blocks under the “when game starts” hat before pressing Run.",
        "info",
      );
      return;
    }

    persistCode(program.xml);
    saveGuardRef.current = false;
    setOutcome(null);
    setCompletion(null);
    setRunning(true);

    if (isStudent) {
      void startGameMission(game.id, active.id).catch(() => {
        /* Attempt logging should never block play. */
      });
    }

    try {
      await runtime.resetAsync();
      await runtime.run(program);
    } catch {
      toast("The program stopped unexpectedly. Press Reset and try again.", "error");
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    runtimeRef.current?.stop();
    setRunning(false);
  };

  const handleReset = () => {
    void runtimeRef.current?.resetAsync();
    setRunning(false);
    setOutcome(null);
    setCompletion(null);
    setRuntimeState(null);
    saveGuardRef.current = false;
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

  const persistCode = (xml: string) => {
    if (!game || !mission) return;
    try {
      window.localStorage.setItem(codeStorageKey(game.key, mission.key), xml);
    } catch {
      /* Storage can be unavailable in private mode. */
    }
  };

  const handleDirty = () => {
    const xml = workspaceRef.current?.getXml();
    if (xml) persistCode(xml);
  };

  const revealHint = () => {
    const hints = spec?.hints ?? [];
    if (hints.length === 0) return;
    setHintsShown((count) => Math.min(count + 1, hints.length));
  };

  const handleChat = async () => {
    const message = chatInput.trim();
    if (!message || chatBusy || !game || !mission) return;
    setChat((rows) => [...rows, { role: "learner", text: message }]);
    setChatInput("");
    setChatBusy(true);
    try {
      const program = workspaceRef.current?.compile();
      const reply = await sendAiMessage({
        message,
        missionKey: `game:${game.key} mission:${mission.key}`,
        programJson: program?.xml,
      });
      setChat((rows) => [
        ...rows,
        {
          role: "assistant",
          text: reply.disabled
            ? reply.reason ?? "The AI coach is unavailable right now."
            : reply.reply,
        },
      ]);
    } catch (error) {
      setChat((rows) => [
        ...rows,
        {
          role: "assistant",
          text: toAuthError(error, "The AI coach could not reply.").message,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="cb-loading-inline">
        <span className="cb-spinner" aria-hidden /> Loading game…
      </p>
    );
  }

  if (loadError || !game || !spec) {
    return (
      <div className="cb-card cb-card-pad" style={{ maxWidth: 620, margin: "3rem auto" }}>
        <h1 className="cb-page-title">Game unavailable</h1>
        <p className="cb-body-text">{loadError ?? "That game could not be opened."}</p>
        <Button variant="secondary" onClick={() => navigate("/app/games")}>
          Back to the library
        </Button>
      </div>
    );
  }

  if (!mission || !missionSpec) {
    return (
      <div className="cb-card cb-card-pad" style={{ maxWidth: 620, margin: "3rem auto" }}>
        <h1 className="cb-page-title">No missions yet</h1>
        <p className="cb-body-text">
          This game has no missions ready. Pick another game from the library.
        </p>
        <Button variant="secondary" onClick={() => navigate("/app/games")}>
          Back to the library
        </Button>
      </div>
    );
  }

  const hints = spec.hints;
  const stars = completion?.stars ?? outcome?.stars ?? 0;
  const won = outcome?.status === "won";
  const lost = outcome?.status === "lost";
  const collectedLabel =
    runtimeState && runtimeState.required > 1
      ? `${runtimeState.collected}/${runtimeState.required}`
      : null;

  return (
    <div className="cb-player">
      <header className="cb-player-top">
        <Link to="/app/games" className="cb-icon-btn" aria-label="Back to game library">
          <ArrowLeft size={20} />
        </Link>
        <div className="cb-player-heading">
          <span className="cb-eyebrow">
            {spec.categoryLabel} · {mission.difficulty} · {spec.estimatedMinutes} min
          </span>
          <h1>{spec.title}</h1>
          <p>
            Mission {missions.findIndex((row) => row.id === mission.id) + 1} of{" "}
            {missions.length}: {mission.title}
          </p>
        </div>
        <div className="cb-player-top-actions">
          <span className="cb-player-points">
            <Star size={14} aria-hidden /> {mission.bestStars}/{mission.starsAvailable}
          </span>
          <span className="cb-player-points">
            <Trophy size={14} aria-hidden /> {mission.bestScore}
          </span>
        </div>
      </header>

      <div className="cb-mission-strip" role="tablist" aria-label="Missions">
        {missions.map((row, index) => {
          const rowSpec = missionSpecFor(game.key, row.key);
          const active = row.id === mission.id;
          return (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`cb-mission-chip${active ? " active" : ""}${
                row.completed ? " done" : ""
              }`}
              onClick={() => {
                if (row.id === mission.id) return;
                persistCode(workspaceRef.current?.getXml() ?? "");
                setSelectedMissionId(row.id);
              }}
            >
              <span className="cb-mission-index">{index + 1}</span>
              <span className="cb-mission-chip-copy">
                <strong>{rowSpec?.title ?? row.title}</strong>
                <span>
                  {row.completed ? (
                    <CheckCircle2 size={12} aria-hidden />
                  ) : (
                    <Star size={12} aria-hidden />
                  )}
                  {row.bestStars}/{row.starsAvailable} · {row.points} pts
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="cb-player-layout">
        <section className="cb-player-main">
          <div
            ref={stageWrapRef}
            className={`cb-player-stage-wrap${fullscreen ? " is-fullscreen" : ""}`}
          >
            <div
              ref={stageRef}
              className="cb-phaser-stage"
              aria-label={`${spec.title} game stage`}
            />
            {creating ? (
              <div className="cb-stage-loading">
                <span className="cb-spinner" aria-hidden /> Building the world…
              </div>
            ) : null}

            <div className="cb-studio-hud" aria-live="polite">
              <span className="cb-hud-pill">
                <strong>{runtimeState?.score ?? 0}</strong> points
              </span>
              <span className="cb-hud-pill">
                {"❤".repeat(Math.max(0, runtimeState?.hearts ?? 3)) || "No hearts"}
              </span>
              {collectedLabel ? (
                <span className="cb-hud-pill">⭐ {collectedLabel}</span>
              ) : null}
              {runtimeState?.timeLeft !== null &&
              runtimeState?.timeLeft !== undefined ? (
                <span
                  className={`cb-hud-pill${
                    runtimeState.timeLeft < 10 ? " cb-hud-danger" : ""
                  }`}
                >
                  {Math.ceil(runtimeState.timeLeft)}s
                </span>
              ) : null}
              {runtimeState?.message ? (
                <span className="cb-hud-message">{runtimeState.message}</span>
              ) : null}
            </div>

            {won || lost ? (
              <div className={`cb-player-result ${won ? "won" : "lost"}`} role="status">
                {won ? <Trophy size={34} aria-hidden /> : null}
                <h2>{won ? "Mission complete!" : "Not quite yet"}</h2>
                <p>{outcome?.message ?? runtimeState?.message}</p>
                {won ? (
                  <div className="cb-result-stars" aria-label={`${stars} stars`}>
                    {Array.from({ length: mission.starsAvailable }).map((_, index) => (
                      <Star
                        key={index}
                        size={26}
                        className={index < stars ? "filled" : ""}
                        aria-hidden
                      />
                    ))}
                  </div>
                ) : null}
                {completion ? (
                  <p className="cb-completion-note">
                    {completion.firstCompletion ? "First clear" : "Run saved"} ·{" "}
                    {completion.pointsAwarded > 0
                      ? `+${completion.pointsAwarded} points`
                      : "no new points"}{" "}
                    · {completion.totalStars} stars overall
                  </p>
                ) : null}
                <div className="cb-flex">
                  <Button size="sm" variant="secondary" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={() => void handleRun()} disabled={running}>
                    Play again
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate("/app/games")}
                  >
                    More games
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="cb-player-controls">
            <Button
              icon={running ? <Pause size={16} /> : <Play size={16} />}
              onClick={running ? handleStop : () => void handleRun()}
              disabled={creating}
            >
              {running ? "Stop" : "Run game"}
            </Button>
            <Button
              variant="secondary"
              icon={<RotateCcw size={16} />}
              onClick={handleReset}
            >
              Reset
            </Button>
            <button
              type="button"
              className="cb-icon-btn"
              onClick={() => setSoundOn((value) => !value)}
              title={soundOn ? "Mute sounds" : "Unmute sounds"}
              aria-label={soundOn ? "Mute sounds" : "Unmute sounds"}
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
            <span className="cb-player-stat">
              {mission.attempts > 0 ? `${mission.attempts} attempts so far` : "First attempt"}
            </span>
          </div>

          <div className="cb-game-picker">
            <div>
              <span className="cb-eyebrow">Character</span>
              <div className="cb-chip-row">
                {(["girl", "boy"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={character === option ? "active" : ""}
                    onClick={() => setCharacter(option)}
                  >
                    {option === "girl" ? "Bloom (girl)" : "Bumble (boy)"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="cb-eyebrow">Background</span>
              <div className="cb-chip-row">
                {THEMES.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={theme === option.key ? "active" : ""}
                    onClick={() => setTheme(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cb-studio-workspace">
            <div className="cb-studio-workspace-head">
              <h2>Your code</h2>
              <span>
                Only blocks this game can run are shown. Press Run to watch them
                play out.
              </span>
            </div>
            <GameBlockWorkspace
              key={`${game.key}:${mission.key}`}
              ref={workspaceRef}
              mode={spec.mode}
              initialXml={codeXml}
              className="cb-studio-blockly"
              onDirty={handleDirty}
            />
          </div>
        </section>

        <aside className="cb-player-side">
          <div className="cb-player-side-card">
            <h2>
              <Sparkles size={16} aria-hidden /> Mission goal
            </h2>
            <p>{mission.objective}</p>
            <p className="cb-body-text">{mission.description}</p>
            <div className="cb-chip-row">
              {mission.concepts.map((concept) => (
                <span key={concept} className="cb-skill-chip">
                  {concept}
                </span>
              ))}
            </div>
            <div className="cb-mission-rewards">
              <span>
                <Star size={14} aria-hidden /> {mission.starsAvailable} stars
              </span>
              <span>
                <Trophy size={14} aria-hidden /> {mission.points} points
              </span>
              {missionSpec.blockBudget ? (
                <span>
                  <Clock size={14} aria-hidden /> {missionSpec.blockBudget} block budget
                </span>
              ) : null}
            </div>
          </div>

          <div className="cb-player-side-card">
            <h2>
              <Lightbulb size={16} aria-hidden /> Hints
            </h2>
            {hints.length === 0 ? (
              <p className="cb-body-text">No hints for this mission. Experiment freely!</p>
            ) : (
              <>
                <ol className="cb-hint-list">
                  {hints.slice(0, hintsShown).map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ol>
                {hintsShown < hints.length ? (
                  <Button size="sm" variant="secondary" onClick={revealHint}>
                    Reveal hint {hintsShown + 1} of {hints.length}
                  </Button>
                ) : (
                  <p className="cb-muted-small">All hints revealed.</p>
                )}
              </>
            )}
          </div>

          <div className="cb-player-side-card cb-ai-coach">
            <h2>
              <Bot size={16} aria-hidden /> AI coach
            </h2>
            <div className="cb-chat-messages">
              {chat.map((message, index) => (
                <div
                  key={index}
                  className={`cb-chat-message ${message.role}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="cb-chat-input-row">
              <input
                type="text"
                value={chatInput}
                placeholder="Ask for a hint…"
                aria-label="Ask the AI coach"
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleChat();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => void handleChat()}
                loading={chatBusy}
                disabled={!chatInput.trim()}
                icon={<Send size={15} />}
              >
                Send
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function missionSpecMode(key: string): "jungle" | "maze" | "space" | "platformer" | "racing" | "catcher" | "pattern" {
  switch (key) {
    case "coding-maze":
      return "maze";
    case "space-explorer":
      return "space";
    case "collect-the-stars":
      return "platformer";
    case "robot-racing":
      return "racing";
    case "star-catcher":
      return "catcher";
    case "pattern-garden":
      return "pattern";
    default:
      return "jungle";
  }
}

function missionSpecPaletteFallback(): GamePalette {
  return {
    sky: "#0f3d2e",
    sky2: "#145c3d",
    ground: "#2f9e5f",
    ground2: "#247d4a",
    wall: "#0b2f22",
    accent: "#ffc300",
    text: "#ffffff",
  };
}

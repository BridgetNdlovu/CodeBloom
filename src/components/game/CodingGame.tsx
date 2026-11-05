import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import * as Blockly from "blockly";
import type { GameCommand, GameConfig, GameState } from "./gameEngine";
import {
  DEFAULT_GAME_CONFIG,
  initialState,
  parseMissionConfig,
  runSequence,
} from "./gameEngine";
import { GardenBoard } from "./GardenBoard";
import { commandsFromWorkspace, toolboxForMission } from "./blocklySetup";
import { AIHelperPanel } from "../ai/AIHelperPanel";
import { Badge, ProgressBar } from "../ui/inputs";
import { Button } from "../ui/Button";
import {
  getMission,
  ApiError,
  type MissionDetailDto,
} from "../../services/apiClient";
import {
  saveCheckpointProgress,
  startMissionProgress,
  submitMissionProgress,
} from "../../services/progressService";

type GameStatus = "idle" | "running" | "success" | "failed";

type MobilePanel = "instructions" | "garden" | "code";

interface FeedbackState {
  kind: "success" | "failed";
  title: string;
  message: string;
  score?: number;
  pointsEarned?: number;
  newAchievementTitle?: string;
  nextMissionId?: number;
}

export function CodingGame() {
  const { missionId } = useParams();
  const numericMissionId = missionId ? Number(missionId) : NaN;
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const cancelRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  const [mission, setMission] = useState<MissionDetailDto | null>(null);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [position, setPosition] = useState<GameState>(() =>
    initialState(DEFAULT_GAME_CONFIG),
  );
  const [status, setStatus] = useState<GameStatus>("idle");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("garden");
  const [aiOpen, setAiOpen] = useState(false);
  const [blocklyReady, setBlocklyReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [programJson, setProgramJson] = useState<string>("[]");

  // Load the mission configuration from the backend.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isFinite(numericMissionId) || numericMissionId <= 0) {
        setLoadError("This mission could not be found.");
        setLoading(false);
        return;
      }
      try {
        const data = await getMission(numericMissionId);
        if (cancelled) return;
        setMission(data);
        const parsed = parseMissionConfig(data.configJson, data.maxSteps);
        setConfig(parsed);
        setPosition(initialState(parsed));
        startedAtRef.current = Date.now();
        if (data.savedGameStateJson) {
          // The saved state is informational; the learner always restarts the
          // board from the mission's start tile so the run stays deterministic.
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setLoadError(
            "This mission is locked. Complete the missions before it to unlock the path.",
          );
        } else if (error instanceof ApiError && error.status === 401) {
          setLoadError("Please sign in again to play this mission.");
        } else {
          setLoadError("Unable to load this mission. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [numericMissionId]);

  // Inject Blockly once the mission configuration is known so the toolbox
  // only offers the blocks this mission actually uses.
  useEffect(() => {
    if (!mission) return;
    const container = containerRef.current;
    if (!container) return;

    const workspace = Blockly.inject(container, {
      toolbox: toolboxForMission(config.blocks, config.loopBlocks),
      sounds: false,
      maxBlocks: 120,
      grid: { spacing: 16, length: 2, colour: "#bbf7d0" },
      zoom: { controls: true, wheel: true, startScale: 0.9 },
    });
    workspaceRef.current = workspace;
    setBlocklyReady(true);

    return () => {
      cancelRef.current = true;
      workspace.dispose();
      workspaceRef.current = null;
      setBlocklyReady(false);
    };
  }, [mission, config.blocks, config.loopBlocks]);

  const readCommands = useCallback((): GameCommand[] => {
    const workspace = workspaceRef.current;
    if (!workspace) return [];
    return commandsFromWorkspace(workspace, 100);
  }, []);

  const resetGame = () => {
    cancelRef.current = true;
    workspaceRef.current?.clear();
    setPosition(initialState(config));
    setStatus("idle");
    setFeedback(null);
    setProgramJson("[]");
  };

  const revealHint = async () => {
    if (!mission) return;
    const hints = mission.hints ?? [];
    if (revealedHints.length >= hints.length) return;
    const next = hints[revealedHints.length];
    const nextRevealed = [...revealedHints, next.hintText];
    setRevealedHints(nextRevealed);
    try {
      await startMissionProgress(String(mission.id));
      await saveCheckpointProgress(
        String(mission.id),
        undefined,
        undefined,
        nextRevealed.length,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      );
    } catch {
      /* Hints still display locally if checkpoint saving fails. */
    }
  };

  const handleRun = async () => {
    if (status === "running" || !mission) return;
    const commands = readCommands();
    if (commands.length === 0) {
      setFeedback({
        kind: "failed",
        title: "Add some blocks first",
        message:
          "Drag command blocks into the code workspace, then press Run Code.",
      });
      setStatus("failed");
      return;
    }

    const flatProgram = commands.map((c) => ({ type: c.type }));
    const programText = JSON.stringify(flatProgram);
    setProgramJson(programText);
    setStatus("running");
    setFeedback(null);
    cancelRef.current = false;

    try {
      await startMissionProgress(String(mission.id));
    } catch {
      /* An already-started mission returns an error; the run can continue. */
    }

    const outcome = await runSequence(commands, config, {
      delayMs: 380,
      shouldCancel: () => cancelRef.current,
      onStep: (state) => setPosition(state),
    });
    if (cancelRef.current) {
      setStatus("idle");
      return;
    }

    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );

    try {
      const result = await submitMissionProgress(
        String(mission.id),
        programText,
        durationSeconds,
      );
      if (result.success) {
        setStatus("success");
        setFeedback({
          kind: "success",
          title: "You did it! Bloom reached the flower!",
          message: result.message,
          score: result.score,
          pointsEarned: result.pointsEarned,
          newAchievementTitle: result.newAchievement
            ? result.newAchievementTitle
            : undefined,
          nextMissionId: result.nextMissionId,
        });
      } else {
        setStatus("failed");
        setFeedback({
          kind: "failed",
          title: outcome.reachedGoal
            ? "The server could not confirm that run"
            : "Not quite — Bloom has not reached the flower yet",
          message: result.message,
          score: result.score,
        });
      }
    } catch (error) {
      setStatus(outcome.reachedGoal ? "success" : "failed");
      const detail =
        error instanceof ApiError
          ? error.message
          : "Your result could not be saved to the server.";
      setFeedback({
        kind: outcome.reachedGoal ? "success" : "failed",
        title: outcome.reachedGoal
          ? "Bloom reached the flower!"
          : "Not quite — try another path",
        message: `${detail} Check your connection and run the mission again so your score is saved.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading mission…</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !mission) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-card cb-card-pad" style={{ maxWidth: 620, margin: "0 auto" }}>
            <h2>Mission unavailable</h2>
            <p className="cb-body-text">{loadError ?? "This mission could not be loaded."}</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => navigate("/app/missions")}>Back to Mission Map</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const panelClass = (panel: MobilePanel) =>
    `cb-game-panel${mobilePanel === panel ? " is-active" : ""}`;

  const missionHints = mission.hints ?? [];
  const bestScore = mission.bestScore ?? 0;

  return (
    <div className="cb-game">
      <div className="cb-game-header cb-flex cb-flex-between" style={{ flexWrap: "wrap" }}>
        <div className="cb-flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/missions")}
            aria-label="Back to mission map"
          >
            <ArrowLeft size={18} aria-hidden />
          </Button>
          <div>
            <h1 className="cb-section-title" style={{ marginBottom: "var(--cb-space-1)" }}>
              {mission.title}
            </h1>
            <div className="cb-flex cb-flex-center" style={{ gap: "var(--cb-space-3)", flexWrap: "wrap" }}>
              <Badge>{mission.difficulty}</Badge>
              <span className="cb-muted" style={{ fontSize: "0.85rem" }}>
                {mission.learningConcept ?? "Coding"}
              </span>
              {mission.status === "completed" ? (
                <Badge variant="default">
                  <Trophy size={13} aria-hidden /> Best {bestScore}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="cb-flex">
          <Button variant="ghost" size="sm" onClick={() => setAiOpen(true)} aria-label="Open AI helper">
            <Bot size={18} aria-hidden />
            <span className="cb-hide-sm">AI Coach</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={resetGame} aria-label="Reset coding blocks">
            <RotateCcw size={18} aria-hidden />
            <span className="cb-hide-sm">Reset</span>
          </Button>
        </div>
      </div>

      <div className="cb-game-layout">
        <section
          className={`cb-game-panel cb-game-instructions ${panelClass("instructions")}`}
          aria-label="Mission instructions"
        >
          <h2 className="cb-section-title">Mission Brief</h2>
          <p className="cb-body-text">
            {mission.description ?? "Guide Bloom to the flower using code blocks."}
          </p>
          <div className="cb-flex" style={{ marginTop: "var(--cb-space-4)" }}>
            <ProgressBar
              value={status === "success" ? 100 : mission.status === "completed" ? 100 : 35}
              label="Mission progress"
            />
          </div>

          <div style={{ marginTop: "var(--cb-space-6)" }}>
            <h3 className="cb-section-title" style={{ fontSize: "1.1rem" }}>
              Your goal
            </h3>
            <p className="cb-body-text">
              Reach the flower at column {config.goal.x + 1}, row {config.goal.y + 1}.
              Bloom starts at column {config.start.x + 1}, row {config.start.y + 1}.
              {config.obstacles.length > 0
                ? ` Avoid the ${config.obstacles.length} obstacle${config.obstacles.length === 1 ? "" : "s"} in the garden.`
                : ""}
            </p>
          </div>

          <div style={{ marginTop: "var(--cb-space-6)" }}>
            <h3 className="cb-section-title" style={{ fontSize: "1.1rem" }}>
              How to play
            </h3>
            <ol className="cb-instruction-list">
              <li>Drag blocks from the toolbox into the workspace.</li>
              <li>Connect them from top to bottom in the order Bloom should act.</li>
              <li>Use Repeat blocks to run the same steps more than once.</li>
              <li>Press Run Code and adjust your program until Bloom reaches the flower.</li>
            </ol>
          </div>

          <div style={{ marginTop: "var(--cb-space-6)" }}>
            <h3 className="cb-section-title" style={{ fontSize: "1.1rem" }}>
              Hints
            </h3>
            {revealedHints.length > 0 ? (
              <ul className="cb-instruction-list">
                {revealedHints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            ) : (
              <p className="cb-body-text">
                Try the mission first. You can reveal a hint if you get stuck.
              </p>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void revealHint()}
              disabled={revealedHints.length >= missionHints.length}
            >
              <Lightbulb size={16} aria-hidden />
              {revealedHints.length >= missionHints.length
                ? "No more hints"
                : "Reveal a hint"}
            </Button>
          </div>
        </section>

        <section className={`cb-game-stage ${panelClass("garden")}`} aria-label="Garden board">
          <GardenBoard state={position} running={status === "running"} />
          {status === "success" && feedback ? (
            <div className="cb-game-overlay cb-game-overlay-success" role="status">
              <Sparkles size={28} aria-hidden />
              <h2>{feedback.title}</h2>
              <p className="cb-body-text">{feedback.message}</p>
              <p className="cb-body-text">
                <strong>Score: {feedback.score ?? 0} / 100</strong>
                {feedback.pointsEarned ? ` · +${feedback.pointsEarned} points` : ""}
              </p>
              {feedback.newAchievementTitle ? (
                <p className="cb-body-text">
                  New achievement: <strong>{feedback.newAchievementTitle}</strong>
                </p>
              ) : null}
              <div className="cb-flex" style={{ flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={resetGame}>
                  Play Again
                </Button>
                {feedback.nextMissionId ? (
                  <Button onClick={() => navigate(`/app/game/${feedback.nextMissionId}`)}>
                    Next Mission
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/app/missions")}>Mission Map</Button>
                )}
              </div>
            </div>
          ) : null}
          {status === "failed" && feedback ? (
            <div className="cb-game-overlay cb-game-overlay-failed" role="status">
              <Lightbulb size={28} aria-hidden />
              <h2>{feedback.title}</h2>
              <p className="cb-body-text">{feedback.message}</p>
              <div className="cb-flex">
                <Button variant="secondary" onClick={resetGame}>
                  Try Again
                </Button>
                <Button onClick={() => setAiOpen(true)}>Ask for Help</Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`cb-game-panel cb-game-code ${panelClass("code")}`} aria-label="Block coding workspace">
          <div className="cb-flex cb-flex-between" style={{ marginBottom: "var(--cb-space-3)" }}>
            <h2 className="cb-section-title" style={{ marginBottom: 0 }}>
              Code Blocks
            </h2>
            <Button size="sm" onClick={() => void handleRun()} disabled={status === "running"}>
              <Play size={16} aria-hidden />
              Run Code
            </Button>
          </div>
          <div ref={containerRef} className="cb-blockly-container" data-testid="blockly-container" />
          {!blocklyReady ? (
            <p className="cb-body-text" style={{ textAlign: "center", marginTop: "var(--cb-space-6)" }}>
              Loading blocks…
            </p>
          ) : null}
          <p className="cb-field-hint" style={{ marginTop: "var(--cb-space-3)" }}>
            Drag blocks from the toolbox into the workspace. Press Run Code to execute your instructions.
          </p>
        </section>
      </div>

      <div className="cb-game-mobile-nav" role="tablist" aria-label="Game panels">
        {(["instructions", "garden", "code"] as MobilePanel[]).map((panel) => (
          <button
            key={panel}
            type="button"
            role="tab"
            aria-selected={mobilePanel === panel}
            className={`cb-game-mobile-tab${mobilePanel === panel ? " active" : ""}`}
            onClick={() => setMobilePanel(panel)}
          >
            {panel === "instructions" ? "Brief" : panel === "garden" ? "Garden" : "Code"}
          </button>
        ))}
      </div>

      <AIHelperPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        missionKey={mission.key}
        programJson={programJson}
      />
    </div>
  );
}

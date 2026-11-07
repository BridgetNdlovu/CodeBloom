import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, PlayCircle, Sprout, Trophy } from "lucide-react";
import { Badge, PageHeader } from "../../components/ui/inputs";
import { Button } from "../../components/ui/Button";
import {
  getMissionMap,
  type MissionMapItemDto,
  type WorldMapDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

type NodeState = "completed" | "in_progress" | "available" | "locked";

function stateOf(mission: MissionMapItemDto): NodeState {
  if (mission.status === "completed") return "completed";
  if (mission.status === "in_progress") return "in_progress";
  if (mission.status === "available") return "available";
  return "locked";
}

function MissionNode({
  mission,
  onOpen,
}: {
  mission: MissionMapItemDto;
  onOpen: (missionId: number) => void;
}) {
  const state = stateOf(mission);
  const content = (
    <>
      <span className={`cb-mission-node ${state}`} aria-hidden>
        {state === "locked" ? (
          <Lock size={26} />
        ) : state === "completed" ? (
          <Check size={30} />
        ) : state === "in_progress" ? (
          <PlayCircle size={28} />
        ) : (
          <Sprout size={30} />
        )}
      </span>
      <span className="cb-mission-node-label">{mission.title}</span>
      <span className="cb-mission-node-skill">{mission.learningConcept}</span>
      {state === "completed" ? (
        <span className="cb-mission-node-skill">
          <Trophy size={12} aria-hidden /> Best {mission.bestScore}
        </span>
      ) : null}
      {state === "in_progress" ? <span className="cb-mission-node-skill">In progress</span> : null}
    </>
  );

  if (state === "locked") {
    return (
      <div
        className="cb-mission-node-wrap is-locked"
        aria-label={`${mission.title} — locked. Complete the earlier missions to unlock it.`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cb-mission-node-wrap"
      onClick={() => onOpen(mission.id)}
      aria-label={`${mission.title}, ${mission.status === "completed" ? "completed, replay mission" : mission.status === "in_progress" ? "in progress, continue mission" : "available, start mission"}`}
    >
      {content}
    </button>
  );
}

export function MissionMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [worlds, setWorlds] = useState<WorldMapDto[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show pending state for explicit reloads.
    setLoading(true);
    setError(undefined);
    async function load() {
      try {
        const data = await getMissionMap();
        if (!cancelled) setWorlds(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load missions.").message);
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

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading missions…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container">
          <div className="cb-card cb-card-pad" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2>Unable to load mission map</h2>
            <p className="cb-body-text">{error}</p>
            <div className="cb-hero-actions" style={{ justifyContent: "center", marginTop: "var(--cb-space-4)" }}>
              <Button onClick={() => setReloadKey((k) => k + 1)}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allMissions = worlds.flatMap((w) => w.missions);
  const completed = allMissions.filter((m) => m.status === "completed").length;
  const overallPercent =
    allMissions.length > 0 ? Math.round((completed / allMissions.length) * 100) : 0;
  const nextMission =
    allMissions.find((m) => m.status === "in_progress") ??
    allMissions.find((m) => m.status === "available");

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Explore Missions"
          subtitle={`${completed} of ${allMissions.length} missions completed across ${worlds.length} world${worlds.length === 1 ? "" : "s"}.`}
          actions={
            nextMission ? (
              <Button onClick={() => navigate(`/app/game/${nextMission.id}`)}>
                <PlayCircle size={16} aria-hidden />
                {nextMission.status === "in_progress" ? "Continue" : "Start"}: {nextMission.title}
              </Button>
            ) : null
          }
        />

        {overallPercent === 100 && allMissions.length > 0 ? (
          <div className="cb-card cb-card-pad" style={{ marginBottom: "var(--cb-space-6)" }}>
            <p className="cb-body-text" style={{ margin: 0 }}>
              <strong>Every mission completed!</strong> Replay any mission to improve your score.
            </p>
          </div>
        ) : null}

        {worlds.length === 0 ? (
          <div className="cb-card cb-card-pad cb-empty">
            <h3>No worlds are published yet.</h3>
            <p className="cb-body-text">Your instructor or administrator can publish missions.</p>
          </div>
        ) : (
          worlds.map((world) => {
            const worldCompleted = world.missions.filter((m) => m.status === "completed").length;
            const worldPercent =
              world.missions.length > 0
                ? Math.round((worldCompleted / world.missions.length) * 100)
                : 0;
            return (
              <section
                key={world.id}
                className="cb-dash-section"
                aria-label={`${world.name} missions`}
              >
                <header className="cb-mission-map-head">
                  <div>
                    <h2 className="cb-section-title" style={{ marginBottom: "var(--cb-space-1)" }}>
                      {world.name}
                    </h2>
                    <p className="cb-body-text" style={{ marginBottom: 0 }}>
                      {world.tagline}
                    </p>
                  </div>
                  <div className="cb-mission-map-progress">
                    <Badge>{worldCompleted} / {world.missions.length} complete</Badge>
                    <strong style={{ color: "var(--cb-green-dark)" }}>{worldPercent}%</strong>
                  </div>
                </header>

                <div className="cb-mission-map">
                  <div className="cb-mission-path">
                    {world.missions.map((mission, index) => {
                      const state = stateOf(mission);
                      const isLast = index === world.missions.length - 1;
                      return (
                        <div key={mission.id} style={{ display: "contents" }}>
                          <MissionNode
                            mission={mission}
                            onOpen={(id) => navigate(`/app/game/${id}`)}
                          />
                          {!isLast ? (
                            <div
                              className={`cb-mission-node-connector${state === "completed" ? " done" : ""}`}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })
        )}

        <div className="cb-flex" style={{ marginTop: "var(--cb-space-6)", flexWrap: "wrap" }}>
          <button type="button" className="cb-btn cb-btn-secondary" onClick={() => navigate("/app")}>
            Return to Dashboard
          </button>
          <button type="button" className="cb-btn cb-btn-secondary" onClick={() => navigate("/app/assignments")}>
            My assignments
          </button>
        </div>
      </div>
    </div>
  );
}

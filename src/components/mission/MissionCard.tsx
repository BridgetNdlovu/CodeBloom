import type { Mission, MissionProgress } from "../../types";
import { Badge, ProgressBar } from "../ui/inputs";

interface MissionCardProps {
  mission: Mission;
  progress?: MissionProgress;
  onOpen?: (missionId: string) => void;
}

const difficultyVariant = (difficulty: Mission["difficulty"]) =>
  difficulty === "Easy" ? ("soft" as const) : difficulty === "Beginner" ? ("default" as const) : ("warning" as const);

export function MissionCard({ mission, progress, onOpen }: MissionCardProps) {
  const isDone = progress?.status === "completed";
  const isInProgress = progress?.status === "in_progress";

  return (
    <article className="cb-card cb-card-pad mission-card">
      <div className="cb-flex cb-flex-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h3 className="cb-section-title" style={{ marginBottom: "var(--cb-space-2)" }}>
            {mission.title}
          </h3>
          <p className="cb-body-text" style={{ marginBottom: 0 }}>
            {mission.description}
          </p>
        </div>
        <Badge variant={difficultyVariant(mission.difficulty)}>{mission.difficulty}</Badge>
      </div>

      <div className="cb-flex cb-flex-center" style={{ marginTop: "var(--cb-space-4)", flexWrap: "wrap" }}>
        <span className="cb-badge">{mission.skill}</span>
        <span className="cb-muted" style={{ fontSize: "0.85rem" }}>
          ~{mission.estimatedMinutes} min
        </span>
      </div>

      {typeof progress?.progressPercent === "number" ? (
        <div style={{ marginTop: "var(--cb-space-4)" }}>
          <ProgressBar value={progress.progressPercent} label={isDone ? "Completed" : `Progress: ${progress.progressPercent}%`} />
        </div>
      ) : null}

      {mission.status === "available" && onOpen ? (
        <button type="button" className="cb-btn cb-btn-primary" style={{ marginTop: "var(--cb-space-4)" }} onClick={() => onOpen(mission.id)}>
          {isDone ? "Play Again" : isInProgress ? "Continue Mission" : "Start Mission"}
        </button>
      ) : null}
    </article>
  );
}

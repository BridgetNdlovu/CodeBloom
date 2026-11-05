import type { Achievement, MissionProgress } from "../types";
import {
  startMission as apiStartMission,
  saveCheckpoint as apiSaveCheckpoint,
  submitMission as apiSubmitMission,
  getAttempts as apiGetAttempts,
  getStudentAchievements as apiGetStudentAchievements,
  getDashboard as apiGetDashboard,
  getMissionMap as apiGetMissionMap,
  getProgressRecords as apiGetProgressRecords,
  type MissionProgressDto,
  type SubmitMissionRequest,
} from "./apiClient";

export interface SkillSummary {
  skill: string;
  status: "not_started" | "practising" | "completed";
  completed: number;
  total: number;
  percent: number;
}

export interface ActivityEntry {
  id: string;
  label: string;
  detail: string;
  at: string;
  kind: "mission" | "achievement";
}

export interface ProgressSummary {
  totalPoints: number;
  missionsCompleted: number;
  missionsInProgress: number;
  missionsAvailable: number;
  missionsLocked: number;
  totalMissions: number;
  achievementsEarned: number;
  totalAchievements: number;
  skills: SkillSummary[];
  recentActivity: ActivityEntry[];
  records: MissionProgress[];
}

function toMissionProgress(dto: MissionProgressDto): MissionProgress {
  return {
    missionId: String(dto.missionId),
    missionTitle: dto.missionTitle,
    status:
      dto.status === "completed"
        ? "completed"
        : dto.status === "in_progress"
          ? "in_progress"
          : "not_started",
    progressPercent: dto.status === "completed" ? 100 : 0,
    attempts: dto.attempts,
    bestScore: dto.bestScore,
    latestScore: dto.latestScore,
    pointsEarned: dto.pointsEarned,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    lastSavedAt: null,
    lastActivityAt: dto.completedAt ?? dto.startedAt ?? null,
    hintsUsed: dto.hintsUsed,
    timeSpentSeconds: null,
    savedGameState: null,
    checkpoint: dto.checkpoint ?? null,
  };
}

/**
 * Build a progress summary entirely from the API. No mock fallbacks: if the
 * backend cannot answer, the caller shows an error instead of fake numbers.
 */
export async function getProgress(_learnerId?: string): Promise<ProgressSummary> {
  const [dashboard, map] = await Promise.all([apiGetDashboard(), apiGetMissionMap()]);
  const records = await apiGetProgressRecords().catch(() => []);

  const skillMap = new Map<string, { completed: number; total: number; started: number }>();
  for (const world of map) {
    for (const mission of world.missions) {
      const skill = mission.learningConcept?.trim() || "Coding basics";
      const entry = skillMap.get(skill) ?? { completed: 0, total: 0, started: 0 };
      entry.total += 1;
      if (mission.status === "completed") entry.completed += 1;
      else if (mission.status === "in_progress") entry.started += 1;
      skillMap.set(skill, entry);
    }
  }

  const skills: SkillSummary[] = Array.from(skillMap.entries())
    .map(([skill, value]) => {
      const percent =
        value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0;
      return {
        skill,
        status:
          value.completed === value.total && value.total > 0
            ? "completed"
            : value.completed > 0 || value.started > 0
              ? "practising"
              : "not_started",
        completed: value.completed,
        total: value.total,
        percent,
      } as SkillSummary;
    })
    .sort((a, b) => b.percent - a.percent || a.skill.localeCompare(b.skill));

  const activityTime = (r: MissionProgressDto): number =>
    new Date(r.completedAt ?? r.startedAt ?? 0).getTime();

  const recentActivity: ActivityEntry[] = records
    .filter((r) => r.status === "completed" || r.attempts > 0)
    .sort((a, b) => activityTime(b) - activityTime(a))
    .slice(0, 12)
    .map((r) => ({
      id: `progress-${r.missionId}`,
      label: r.missionTitle ?? `Mission ${r.missionId}`,
      detail:
        r.status === "completed"
          ? `Completed · best score ${r.bestScore ?? 0}`
          : `In progress · ${r.attempts} attempt${r.attempts === 1 ? "" : "s"}`,
      at: r.completedAt ?? r.startedAt ?? new Date(0).toISOString(),
      kind: "mission",
    }));

  return {
    totalPoints: dashboard.totalPoints ?? 0,
    missionsCompleted: dashboard.missionsCompleted ?? 0,
    missionsInProgress: dashboard.missionsInProgress ?? 0,
    missionsAvailable: dashboard.missionsAvailable ?? 0,
    missionsLocked: dashboard.missionsLocked ?? 0,
    totalMissions: dashboard.totalMissions ?? 0,
    achievementsEarned: dashboard.achievementsEarned ?? 0,
    totalAchievements: dashboard.totalAchievements ?? 0,
    skills,
    recentActivity,
    records: records.map(toMissionProgress),
  };
}

/** Full achievement catalogue with genuine earned flags from the API. */
export async function getStudentAchievements(): Promise<Achievement[]> {
  const catalog = await apiGetStudentAchievements();
  return catalog.map((a) => ({
    id: String(a.id),
    title: a.title,
    description: a.description ?? "",
    icon: a.icon ?? "star",
    criteria: a.criteria ?? "",
    rewardPoints: a.rewardPoints,
    status: a.isActive ? ("active" as const) : ("inactive" as const),
    earned: a.earned,
    earnedAt: a.earnedAt,
  }));
}

export async function startMissionProgress(
  missionId: string,
): Promise<MissionProgress> {
  const numericId = parseInt(missionId.replace("mission-", ""), 10);
  if (isNaN(numericId)) {
    throw new Error("Invalid mission ID");
  }
  const response = await apiStartMission(numericId);
  return toMissionProgress(response);
}

export async function saveCheckpointProgress(
  missionId: string,
  gameStateJson: string | undefined,
  checkpoint: string | undefined,
  hintsUsed: number,
  timeSpentSeconds: number | undefined,
): Promise<void> {
  const numericId = parseInt(missionId.replace("mission-", ""), 10);
  if (isNaN(numericId)) return;
  await apiSaveCheckpoint(numericId, {
    gameStateJson,
    checkpoint,
    hintsUsed,
    timeSpentSeconds,
  });
}

export async function submitMissionProgress(
  missionId: string,
  programJson: string,
  durationSeconds?: number,
): Promise<{
  success: boolean;
  score: number;
  maxScore: number;
  result: string;
  message: string;
  attempts: number;
  firstCompletion: boolean;
  pointsEarned: number;
  totalPoints: number;
  newAchievement: boolean;
  newAchievementTitle?: string;
  nextMissionId?: number;
  nextMissionKey?: string;
}> {
  const numericId = parseInt(missionId.replace("mission-", ""), 10);
  if (isNaN(numericId)) {
    throw new Error("Invalid mission ID");
  }
  const request: SubmitMissionRequest = { programJson, durationSeconds };
  const response = await apiSubmitMission(numericId, request);
  return {
    success: response.success,
    score: response.score,
    maxScore: response.maxScore,
    result: response.result,
    message: response.message,
    attempts: response.attempts,
    firstCompletion: response.firstCompletion,
    pointsEarned: response.pointsEarned,
    totalPoints: response.totalPoints,
    newAchievement: response.newAchievement,
    newAchievementTitle: response.newAchievementTitle,
    nextMissionId: response.nextMissionId,
    nextMissionKey: response.nextMissionKey,
  };
}

export async function getMissionAttempts(
  missionId: string,
): Promise<Array<{ id: string; attemptNumber: number; score: number; result: string; hintsUsed: number; durationSeconds?: number; createdAt: string }>> {
  const numericId = parseInt(missionId.replace("mission-", ""), 10);
  if (isNaN(numericId)) return [];
  const attempts = await apiGetAttempts(numericId);
  return attempts.map((a) => ({
    id: `attempt-${a.id}`,
    attemptNumber: a.attemptNumber,
    score: a.score,
    result: a.result,
    hintsUsed: a.hintsUsed,
    durationSeconds: a.durationSeconds,
    createdAt: a.createdAt,
  }));
}

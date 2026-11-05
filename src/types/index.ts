/** Domain types for Uncommon CodeBloom frontend. */

export type CharacterPreference = "boy" | "girl";

export type AgeGroup = "3-5" | "6-8" | "9-12";

export type UserRole = "student" | "instructor" | "admin";

export type AccountStatus = "active" | "suspended";

/** Serializable subset of the coding game state saved per mission. */
export interface MissionGameState {
  version: number;
  x: number;
  y: number;
  facing: number;
  commands: GameCommand[];
}

export type GameCommand = { type: "move" } | { type: "turn_left" } | { type: "turn_right" };

export interface User {
  id: string;
  displayName: string;
  email: string;
  username?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerPreferences {
  sound: boolean;
  motion: boolean;
  hints: boolean;
  reducedMotion: boolean;
}

export interface Learner extends User {
  ageGroup: AgeGroup;
  character: CharacterPreference;
  preferences: LearnerPreferences;
}

export interface StudentProfile {
  userId: string;
  character: CharacterPreference;
  currentLevel: number;
  totalPoints: number;
  preferences: LearnerPreferences;
}

export interface InstructorProfile {
  userId: string;
  title?: string;
  assignedClassIds: string[];
}

export interface AdminProfile {
  userId: string;
}

export type MissionStatus = "available" | "locked" | "coming_soon";

export interface Mission {
  id: string;
  title: string;
  description: string;
  learningConcept: string;
  skill?: string;
  difficulty: "Easy" | "Beginner" | "Intermediate";
  prerequisites: string[];
  rewardPoints: number;
  estimatedMinutes: number;
  status: MissionStatus;
  version: number;
  worldId?: string;
  worldName?: string;
}

export type MissionProgressStatus = "not_started" | "in_progress" | "completed";

/**
 * A single learner's saved progress for one mission.
 * Persisted per learner + mission and later mirrored by the ASP.NET Core API.
 */
export interface MissionProgress {
  missionId: string;
  missionTitle?: string;
  status: MissionProgressStatus;
  progressPercent: number;
  attempts: number;
  bestScore: number | null;
  latestScore: number | null;
  pointsEarned: number | null;
  startedAt: string | null;
  completedAt: string | null;
  lastSavedAt: string | null;
  lastActivityAt: string | null;
  hintsUsed: number;
  timeSpentSeconds: number | null;
  savedGameState: MissionGameState | null;
  checkpoint: string | null;
}

export interface MissionAttempt {
  id: string;
  learnerId: string;
  missionId: string;
  attemptNumber: number;
  score: number;
  result: "success" | "failed";
  hintsUsed: number;
  durationSeconds: number | null;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
  rewardPoints: number;
  status: "active" | "inactive";
  earned?: boolean;
  unlockCondition?: string;
  earnedAt?: string;
}

export interface StudentAchievement {
  id: string;
  learnerId: string;
  achievementId: string;
  earnedAt: string;
}

export interface SkillProgress {
  skill: string;
  status: "introduced" | "practising" | "coming_soon";
  percent: number;
}

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  at: string;
  kind: "mission" | "achievement" | "game" | "ai";
}

export interface AIMessage {
  id: string;
  sender: "learner" | "assistant";
  text: string;
  at: string;
}

export interface Project {
  id: string;
  learnerId: string;
  title: string;
  description: string;
  type: string;
  status: "draft" | "in_progress" | "complete";
  content: string;
  lastEdited?: string;
  createdAt: string;
  updatedAt: string;
}

/** A learner-owned project stored with its owner id for lookup by learner. */
export interface StudentProject extends Project {
  learnerId: string;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  missionIds: string[];
  instructorId: string;
  classroomIds: string[];
  deadline: string | null;
  status: "draft" | "published" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  learnerId: string;
  status: "pending" | "submitted" | "graded";
  score: number | null;
  submittedAt: string | null;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  eventType: string;
  summary: string;
  createdAt: string;
}

/**
 * Shared data model for the CodeBloom game studio and runtime.
 *
 * The guided mission engine (src/components/game/gameEngine.ts) is separate and
 * untouched: this model powers free-play games, the studio and the game library.
 */

export type SpriteRole =
  | "player"
  | "goal"
  | "collectible"
  | "obstacle"
  | "decoration"
  | "npc";

export type AnimationName =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fly"
  | "swim"
  | "celebrate"
  | "fall"
  | "talk";

export type AssetCategory =
  | "People"
  | "Animals"
  | "Fantasy"
  | "Robots"
  | "Vehicles"
  | "Objects"
  | "Decorations"
  | "Effects";

export interface SpriteDef {
  id: string;
  asset: string;
  name: string;
  role: SpriteRole;
  x: number;
  y: number;
  size: number;
  layer: number;
  /** Degrees: 0 = right, 90 = up, 180 = left, 270 = down. */
  direction: number;
  animation: AnimationName;
  costume: number;
  flip: boolean;
  visible: boolean;
  /** Optional palette override (used by the studio colour picker). */
  tint?: string;
}

export type WinType = "reach" | "collect_all" | "score";

export interface WinRule {
  type: WinType;
  spriteId?: string;
  targetId?: string;
  targetScore?: number;
}

export interface SceneRules {
  win: WinRule;
  lives: number;
  timeLimit: number | null;
}

export interface Scene {
  format: "codebloom.scene.v1";
  stage: { width: number; height: number };
  background: string;
  sprites: SpriteDef[];
  rules: SceneRules;
}

export interface RuntimeSprite extends SpriteDef {
  /** Collected or destroyed sprites stay in the list but are hidden. */
  collected?: boolean;
  speaking?: string;
  thinking?: string;
  effect?: number;
  opacity?: number;
}

export type GameStatus = "idle" | "running" | "won" | "lost";

export interface RuntimeState {
  sprites: RuntimeSprite[];
  background: string;
  score: number;
  health: number;
  timeLeft: number | null;
  status: GameStatus;
  message: string;
  variables: Record<string, number | string>;
  level: number;
  collected: number;
}

export interface BlockNode {
  type: string;
  fields: Record<string, string>;
  inputs: Record<string, BlockNode | string | number>;
  next?: BlockNode;
  body?: BlockNode;
  body2?: BlockNode;
}

export interface GameProject {
  format: "codebloom.project.v1";
  title: string;
  description?: string;
  scene: Scene;
  blocksXml: string;
  variables: Array<{ name: string; value: number | string }>;
  updatedAt: string;
}

export interface AssetDef {
  key: string;
  name: string;
  category: AssetCategory;
  tags: string[];
  costumes: number;
  animations: AnimationName[];
  locomotion: AnimationName;
  defaultSize: number;
}

export interface BackgroundDef {
  key: string;
  name: string;
  category:
    | "Nature"
    | "Fantasy"
    | "City"
    | "Technology"
    | "Adventure"
    | "Space"
    | "Seasonal";
  tags: string[];
}

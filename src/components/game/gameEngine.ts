export type GameCommand =
  | { type: "move" }
  | { type: "turn_left" }
  | { type: "turn_right" };

export interface GridPoint {
  x: number;
  y: number;
}

export interface GameConfig {
  cols: number;
  rows: number;
  start: GridPoint;
  goal: GridPoint;
  obstacles: GridPoint[];
  maxSteps: number;
  optimalBlocks?: number;
  blocks: string[];
  loopBlocks: string[];
}

export interface GameState extends GameConfig {
  x: number;
  y: number;
  facing: number;
}

export interface RunOutcome {
  reachedGoal: boolean;
  state: GameState;
  steps: number;
  maxSteps: number;
  stoppedEarly: boolean;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  cols: 5,
  rows: 3,
  start: { x: 1, y: 1 },
  goal: { x: 4, y: 1 },
  obstacles: [],
  maxSteps: 40,
  blocks: ["move", "turn_left", "turn_right"],
  loopBlocks: [],
};

/** Backwards-compatible alias used by older components. */
export const GARDEN_CONFIG = DEFAULT_GAME_CONFIG;

const DIRECTIONS: GridPoint[] = [
  { x: 1, y: 0 }, // 0 east
  { x: 0, y: 1 }, // 1 south
  { x: -1, y: 0 }, // 2 west
  { x: 0, y: -1 }, // 3 north
];

interface RawGameConfig {
  grid?: { cols?: number; rows?: number };
  start?: Partial<GridPoint>;
  goal?: Partial<GridPoint>;
  obstacles?: Array<Partial<GridPoint>>;
  blocks?: string[];
  loopBlocks?: string[];
  optimalBlocks?: number;
  maxSteps?: number;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(num)));
}

/**
 * Parse the mission configuration JSON that the backend stores for each
 * mission. Falls back to the safe default configuration if the payload is
 * missing or malformed so the game never crashes on bad data.
 */
export function parseMissionConfig(
  configJson: string | null | undefined,
  serverMaxSteps?: number,
): GameConfig {
  if (!configJson) {
    return { ...DEFAULT_GAME_CONFIG, maxSteps: serverMaxSteps ?? DEFAULT_GAME_CONFIG.maxSteps };
  }
  try {
    const raw = JSON.parse(configJson) as RawGameConfig;
    const cols = clampInt(raw.grid?.cols, DEFAULT_GAME_CONFIG.cols, 2, 20);
    const rows = clampInt(raw.grid?.rows, DEFAULT_GAME_CONFIG.rows, 2, 20);
    const start = {
      x: clampInt(raw.start?.x, DEFAULT_GAME_CONFIG.start.x, 0, cols - 1),
      y: clampInt(raw.start?.y, DEFAULT_GAME_CONFIG.start.y, 0, rows - 1),
    };
    const goal = {
      x: clampInt(raw.goal?.x, DEFAULT_GAME_CONFIG.goal.x, 0, cols - 1),
      y: clampInt(raw.goal?.y, DEFAULT_GAME_CONFIG.goal.y, 0, rows - 1),
    };
    const obstacles = Array.isArray(raw.obstacles)
      ? raw.obstacles
          .map((o) => ({
            x: clampInt(o?.x, -1, -1, cols - 1),
            y: clampInt(o?.y, -1, -1, rows - 1),
          }))
          .filter(
            (o) =>
              o.x >= 0 &&
              o.y >= 0 &&
              !(o.x === start.x && o.y === start.y) &&
              !(o.x === goal.x && o.y === goal.y),
          )
      : [];
    const blocks = Array.isArray(raw.blocks) && raw.blocks.length > 0
      ? raw.blocks.filter((b): b is string => typeof b === "string")
      : DEFAULT_GAME_CONFIG.blocks;
    const loopBlocks = Array.isArray(raw.loopBlocks)
      ? raw.loopBlocks.filter((b): b is string => typeof b === "string")
      : [];
    return {
      cols,
      rows,
      start,
      goal,
      obstacles,
      blocks,
      loopBlocks,
      optimalBlocks:
        typeof raw.optimalBlocks === "number" ? raw.optimalBlocks : undefined,
      maxSteps: serverMaxSteps ?? clampInt(raw.maxSteps, 40, 1, 200),
    };
  } catch {
    return { ...DEFAULT_GAME_CONFIG, maxSteps: serverMaxSteps ?? DEFAULT_GAME_CONFIG.maxSteps };
  }
}

export function initialState(config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  const start = config.start;
  return {
    ...config,
    x: start.x,
    y: start.y,
    facing: 0,
  };
}

export function isGoal(state: GameState, config: GameConfig): boolean {
  return state.x === config.goal.x && state.y === config.goal.y;
}

function isObstacle(config: GameConfig, x: number, y: number): boolean {
  return (config.obstacles ?? []).some((o) => o.x === x && o.y === y);
}

export function executeCommand(
  state: GameState,
  command: GameCommand,
  config: GameConfig,
): GameState {
  if (command.type === "turn_left") {
    return { ...state, facing: (state.facing + 3) % 4 };
  }
  if (command.type === "turn_right") {
    return { ...state, facing: (state.facing + 1) % 4 };
  }
  const dir = DIRECTIONS[state.facing];
  const nextX = state.x + dir.x;
  const nextY = state.y + dir.y;
  const withinBounds =
    nextX >= 0 && nextX < config.cols && nextY >= 0 && nextY < config.rows;
  if (!withinBounds) {
    // Blocked by the edge of the garden — keep Bloom safe and stop.
    return state;
  }
  if (isObstacle(config, nextX, nextY)) {
    return state;
  }
  return { ...state, x: nextX, y: nextY };
}

export function commandsFromBlockTypes(
  blockTypes: string[],
  maxCommands = 20,
): GameCommand[] {
  const typeMap: Record<string, GameCommand> = {
    code_move: { type: "move" },
    code_turn_left: { type: "turn_left" },
    code_turn_right: { type: "turn_right" },
  };
  const commands: GameCommand[] = [];
  for (const rawType of blockTypes) {
    const command = typeMap[rawType];
    if (!command) continue;
    if (commands.length >= maxCommands) break;
    commands.push(command);
  }
  return commands;
}

export async function runSequence(
  commands: GameCommand[],
  config: GameConfig = DEFAULT_GAME_CONFIG,
  opts: {
    delayMs?: number;
    onStep?: (state: GameState, stepIndex: number, total: number) => void;
    shouldCancel?: () => boolean;
  } = {},
): Promise<RunOutcome> {
  const delayMs = opts.delayMs ?? 420;
  let state: GameState = initialState(config);
  const maxSteps = Math.max(config.maxSteps ?? commands.length, 1);

  for (let i = 0; i < commands.length; i += 1) {
    if (opts.shouldCancel?.()) {
      return { reachedGoal: false, state, steps: i, maxSteps, stoppedEarly: true };
    }
    if (i >= maxSteps) {
      return { reachedGoal: isGoal(state, config), state, steps: i, maxSteps, stoppedEarly: true };
    }
    state = executeCommand(state, commands[i], config);
    opts.onStep?.(state, i, commands.length);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return {
    reachedGoal: isGoal(state, config),
    state,
    steps: Math.min(commands.length, maxSteps),
    maxSteps,
    stoppedEarly: commands.length > maxSteps,
  };
}

/** Friendly guidance text for the failure state. */
export function getFailureGuidance(state: GameState, config: GameConfig): string {
  const distance = Math.abs(state.x - config.goal.x) + Math.abs(state.y - config.goal.y);
  if (distance > 0) {
    return `Bloom is ${distance} tile${distance === 1 ? "" : "s"} away from the flower. Plan each move and watch out for obstacles.`;
  }
  return "Bloom is right next to the flower! Check that your instructions are complete and in the right order.";
}

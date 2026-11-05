/**
 * Ready-made CodeBloom game catalogue.
 *
 * The catalogue is presentation + level geometry only. Games, missions,
 * scores and progress live in SQL Server; this file gives the Phaser runtime
 * the world to draw and the objective to check. Game keys match the seeded
 * database keys so the library can join live records to these definitions.
 */

export type GameMode =
  | "jungle"
  | "maze"
  | "space"
  | "platformer"
  | "racing"
  | "catcher"
  | "pattern";

export type GameCategory = "adventure" | "puzzle" | "platformer" | "racing" | "arcade";

export interface GamePalette {
  sky: string;
  sky2: string;
  ground: string;
  ground2: string;
  wall: string;
  accent: string;
  text: string;
}

export interface GameMeta {
  key: string;
  title: string;
  mode: GameMode;
  category: GameCategory;
  categoryLabel: string;
  tagline: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  skills: string[];
  estimatedMinutes: number;
  objective: string;
  emoji: string;
  cover: string;
  palette: GamePalette;
  hints: string[];
  concepts: string[];
}

export interface GridMissionLevel {
  kind: "grid";
  /** 15 x 9 tiles of 60 px. See runtime for the legend. */
  rows: string[];
  startDir: 0 | 1 | 2 | 3;
  goalLabel: string;
  /** Optional second goal marker for styling. */
  collectLabel: string;
}

export interface PlatformerLevel {
  kind: "platformer";
  platforms: Array<{ x: number; y: number; w: number; h: number }>;
  stars: Array<{ x: number; y: number }>;
  start: { x: number; y: number };
  flag: { x: number; y: number };
}

export interface RacingLevel {
  kind: "racing";
  checkpoints: Array<{ x: number; y: number }>;
  cones: Array<{ x: number; y: number }>;
  start: { x: number; y: number; angle: number };
  timeLimit: number;
}

export interface CatcherLevel {
  kind: "catcher";
  required: number;
  timeLimit: number;
  spawnMs: number;
  bombEvery: number;
  fallSpeed: number;
}

export interface PatternLevel {
  kind: "pattern";
  pads: Array<{ x: number; y: number; colour: number }>;
  pattern: number[];
  start: { x: number; y: number; dir: 0 | 1 | 2 | 3 };
}

export type MissionLevel =
  | GridMissionLevel
  | PlatformerLevel
  | RacingLevel
  | CatcherLevel
  | PatternLevel;

export interface MissionSpec {
  key: string;
  title: string;
  description: string;
  objective: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  concepts: string[];
  points: number;
  starsAvailable: number;
  blockBudget?: number;
  timeLimit?: number;
  level: MissionLevel;
}

export interface GameSpec extends GameMeta {
  missions: MissionSpec[];
}

const JUNGLE_PALETTE: GamePalette = {
  sky: "#0f3d2e",
  sky2: "#145c3d",
  ground: "#2f9e5f",
  ground2: "#247d4a",
  wall: "#0b2f22",
  accent: "#ffc300",
  text: "#ffffff",
};

const MAZE_PALETTE: GamePalette = {
  sky: "#0b2540",
  sky2: "#103a5c",
  ground: "#123f63",
  ground2: "#0d304c",
  wall: "#38bdf8",
  accent: "#ffc300",
  text: "#ffffff",
};

const SPACE_PALETTE: GamePalette = {
  sky: "#070b2a",
  sky2: "#161a4d",
  ground: "#1e2a63",
  ground2: "#151d47",
  wall: "#f472b6",
  accent: "#22d3ee",
  text: "#ffffff",
};

const SKY_PALETTE: GamePalette = {
  sky: "#7dd3fc",
  sky2: "#bae6fd",
  ground: "#22c55e",
  ground2: "#16a34a",
  wall: "#0ea5e9",
  accent: "#ffc300",
  text: "#062d58",
};

const RACE_PALETTE: GamePalette = {
  sky: "#1f2937",
  sky2: "#111827",
  ground: "#374151",
  ground2: "#1f2937",
  wall: "#facc15",
  accent: "#ef4444",
  text: "#ffffff",
};

const NIGHT_PALETTE: GamePalette = {
  sky: "#0b102f",
  sky2: "#1e1b4b",
  ground: "#312e81",
  ground2: "#1e1b4b",
  wall: "#facc15",
  accent: "#facc15",
  text: "#ffffff",
};

const GARDEN_PALETTE: GamePalette = {
  sky: "#fef9c3",
  sky2: "#dcfce7",
  ground: "#22c55e",
  ground2: "#15803d",
  wall: "#f472b6",
  accent: "#f59e0b",
  text: "#062d58",
};

const GRID_EMPTY = ".";

function grid(
  rows: string[],
  startDir: 0 | 1 | 2 | 3,
  goalLabel: string,
  collectLabel: string,
): GridMissionLevel {
  if (rows.length !== 9) {
    throw new Error(`A grid level needs 9 rows, received ${rows.length}.`);
  }
  for (const row of rows) {
    if (row.length !== 15) throw new Error(`Grid row must be 15 tiles: ${row}`);
  }
  if (!rows.some((row) => row.includes("S"))) throw new Error("Grid level has no start tile.");
  if (!rows.some((row) => row.includes("G"))) throw new Error("Grid level has no goal tile.");
  return { kind: "grid", rows, startDir, goalLabel, collectLabel };
}

const RACING_CHECKPOINTS = [
  { x: 820, y: 468 },
  { x: 820, y: 72 },
  { x: 140, y: 72 },
  { x: 140, y: 468 },
];

export const GAMES: GameSpec[] = [
  {
    key: "jungle-treasure",
    title: "Jungle Treasure Hunt",
    mode: "jungle",
    category: "adventure",
    categoryLabel: "Adventure",
    tagline: "Collect the lost chests and reach the temple.",
    description:
      "Guide Bloom through a winding jungle clearing. Grab every treasure chest, dodge the thorn patches and finish at the ancient temple.",
    difficulty: "Beginner",
    skills: ["Sequencing", "Loops", "Conditions"],
    estimatedMinutes: 6,
    objective: "Collect the treasures, avoid thorns and reach the temple.",
    emoji: "🌴",
    cover: "linear-gradient(150deg,#0f3d2e 0%,#1d7a4f 55%,#84cc16 100%)",
    palette: JUNGLE_PALETTE,
    concepts: ["Sequencing", "Loops", "Conditions"],
    hints: [
      "Move forward sends Bloom one tile in the direction they are facing.",
      "Turn blocks change direction without moving.",
      "Thorns cost a heart, so plan a safe route before pressing Run.",
    ],
    missions: [
      {
        key: "jungle-1",
        title: "Find the First Treasure",
        description: "Follow the trail to the first lost chest.",
        objective: "Collect 1 treasure and reach the temple.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Motion"],
        points: 50,
        starsAvailable: 3,
        level: grid(
          [
            "..............G",
            "..............#",
            "....##.........",
            "..T........#...",
            "....##.........",
            "...............",
            "..~~~..........",
            "...............",
            "S..............",
          ],
          0,
          "Temple",
          "Treasure",
        ),
      },
      {
        key: "jungle-2",
        title: "Three Lost Chests",
        description: "The jungle hides three chests. Use a loop to keep moving.",
        objective: "Collect 3 treasures and reach the temple.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Sequencing"],
        points: 80,
        starsAvailable: 3,
        level: grid(
          [
            "G..............",
            "...............",
            "..###.....##...",
            "..T..........T.",
            "..###.....##...",
            "......T........",
            "....~~~~~......",
            "...............",
            "S..............",
          ],
          0,
          "Temple",
          "Treasure",
        ),
      },
      {
        key: "jungle-3",
        title: "Thorn Patrol",
        description: "Thorns block the short path. Choose the safe route.",
        objective: "Collect 3 treasures and reach the temple without losing a heart.",
        difficulty: "Advanced",
        concepts: ["Conditions", "Loops", "Problem solving"],
        points: 120,
        starsAvailable: 3,
        level: grid(
          [
            "...............",
            "..............G",
            "..~~~~~........",
            "..T........T...",
            ".....####......",
            "..T..#..#......",
            ".....#..#......",
            "...............",
            "S..............",
          ],
          0,
          "Temple",
          "Treasure",
        ),
      },
    ],
  },
  {
    key: "coding-maze",
    title: "Coding Maze",
    mode: "maze",
    category: "puzzle",
    categoryLabel: "Puzzle & Logic",
    tagline: "Program a robot through the maze to the glowing exit.",
    description:
      "A grid maze that rewards careful sequencing. Move the robot one tile at a time, turn at corners and pick up the golden key before reaching the exit.",
    difficulty: "Beginner",
    skills: ["Sequencing", "Loops", "Problem solving"],
    estimatedMinutes: 7,
    objective: "Collect the key, then reach the exit.",
    emoji: "🧩",
    cover: "linear-gradient(150deg,#0b2540 0%,#155e86 55%,#38bdf8 100%)",
    palette: MAZE_PALETTE,
    concepts: ["Sequencing", "Loops", "Problem solving"],
    hints: [
      "Each Move block travels exactly one maze tile.",
      "Turns change the robot's facing direction.",
      "Try a Repeat block for long corridors.",
    ],
    missions: [
      {
        key: "maze-1",
        title: "First Turns",
        description: "A long corridor introduces turning.",
        objective: "Collect the key and reach the exit.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Motion"],
        points: 50,
        starsAvailable: 3,
        level: grid(
          [
            "###############",
            "#S...........K#",
            "#.###########.#",
            "#.............#",
            "#.###########.#",
            "#.............#",
            "#.###########.#",
            "#............G#",
            "###############",
          ],
          0,
          "Exit",
          "Key",
        ),
      },
      {
        key: "maze-2",
        title: "Loop the Corners",
        description: "Long corridors are perfect for loops.",
        objective: "Collect the key and reach the exit using 12 blocks or fewer.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Sequencing"],
        points: 80,
        starsAvailable: 3,
        blockBudget: 12,
        level: grid(
          [
            "###############",
            "#S............#",
            "#.###########.#",
            "#K............#",
            "#.###########.#",
            "#.............#",
            "#.###########.#",
            "#............G#",
            "###############",
          ],
          0,
          "Exit",
          "Key",
        ),
      },
      {
        key: "maze-3",
        title: "The Winding Vault",
        description: "Plan the whole route before you run.",
        objective: "Collect both keys and reach the exit using 20 blocks or fewer.",
        difficulty: "Advanced",
        concepts: ["Problem solving", "Loops", "Conditions"],
        points: 120,
        starsAvailable: 3,
        blockBudget: 20,
        level: grid(
          [
            "###############",
            "#S............#",
            "#.###########.#",
            "#K............#",
            "#.###########.#",
            "#............K#",
            "#.###########.#",
            "#............G#",
            "###############",
          ],
          0,
          "Exit",
          "Key",
        ),
      },
    ],
  },
  {
    key: "space-explorer",
    title: "Space Explorer",
    mode: "space",
    category: "adventure",
    categoryLabel: "Adventure",
    tagline: "Pilot a starship through asteroids and bring crystals home.",
    description:
      "Fly the CodeBloom starship through a busy asteroid field. Collect energy crystals, steer around rocks and dock at the warp gate.",
    difficulty: "Intermediate",
    skills: ["Sequencing", "Sensing", "Loops"],
    estimatedMinutes: 7,
    objective: "Collect the crystals and reach the warp gate.",
    emoji: "🚀",
    cover: "linear-gradient(150deg,#070b2a 0%,#312e81 55%,#22d3ee 100%)",
    palette: SPACE_PALETTE,
    concepts: ["Sequencing", "Sensing", "Loops"],
    hints: [
      "Turn first, then move forward to fly in that direction.",
      "Asteroids cost a heart when you touch them.",
      "The crystals counter shows how many you still need.",
    ],
    missions: [
      {
        key: "space-1",
        title: "First Contact",
        description: "Learn to steer the ship through open space.",
        objective: "Collect 2 crystals and reach the warp gate.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Motion"],
        points: 50,
        starsAvailable: 3,
        level: grid(
          [
            "..............G",
            "...............",
            "....A....C.....",
            "...............",
            "..C.......A....",
            "...............",
            "...A......A....",
            "...............",
            "S..............",
          ],
          0,
          "Warp gate",
          "Crystal",
        ),
      },
      {
        key: "space-2",
        title: "Asteroid Alley",
        description: "Rocks narrow the safe route.",
        objective: "Collect 3 crystals and reach the warp gate.",
        difficulty: "Intermediate",
        concepts: ["Sensing", "Loops"],
        points: 80,
        starsAvailable: 3,
        level: grid(
          [
            "..............G",
            "....A..........",
            "..C.....A...C..",
            "...............",
            "......A........",
            "..A......C.....",
            "........A......",
            "...............",
            "S..............",
          ],
          0,
          "Warp gate",
          "Crystal",
        ),
      },
      {
        key: "space-3",
        title: "Crystal Run",
        description: "Collect everything without losing a heart.",
        objective: "Collect 4 crystals and reach the warp gate without damage.",
        difficulty: "Advanced",
        concepts: ["Conditions", "Problem solving"],
        points: 120,
        starsAvailable: 3,
        level: grid(
          [
            "..............G",
            "..C....A....C..",
            "...............",
            "....A.....A....",
            "..C.........C..",
            "...............",
            "...A..A..A.....",
            "...............",
            "S..............",
          ],
          0,
          "Warp gate",
          "Crystal",
        ),
      },
    ],
  },
  {
    key: "collect-the-stars",
    title: "Collect the Stars",
    mode: "platformer",
    category: "platformer",
    categoryLabel: "Platformer",
    tagline: "Jump across floating platforms and gather every star.",
    description:
      "A side-scrolling platformer with gravity. Run, jump and time your landings to collect the stars, then reach the golden flag. Falling off the world costs a life.",
    difficulty: "Beginner",
    skills: ["Sequencing", "Loops", "Conditions"],
    estimatedMinutes: 6,
    objective: "Collect every star and reach the flag.",
    emoji: "⭐",
    cover: "linear-gradient(150deg,#0ea5e9 0%,#38bdf8 50%,#fef08a 100%)",
    palette: SKY_PALETTE,
    concepts: ["Sequencing", "Loops", "Conditions"],
    hints: [
      "Move forward runs to the right; Move left runs back.",
      "Jump only works when you are standing on a platform.",
      "Wait a moment for a jump to land before the next one.",
    ],
    missions: [
      {
        key: "stars-1",
        title: "First Leap",
        description: "One platform, one star, one flag.",
        objective: "Collect 1 star and reach the flag.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Motion"],
        points: 50,
        starsAvailable: 3,
        level: {
          kind: "platformer",
          platforms: [
            { x: 0, y: 490, w: 960, h: 50 },
            { x: 190, y: 380, w: 190, h: 24 },
          ],
          stars: [{ x: 285, y: 340 }],
          start: { x: 80, y: 450 },
          flag: { x: 890, y: 450 },
        },
      },
      {
        key: "stars-2",
        title: "Skyline Sprint",
        description: "Hop between floating islands.",
        objective: "Collect 3 stars and reach the flag.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Sequencing"],
        points: 80,
        starsAvailable: 3,
        level: {
          kind: "platformer",
          platforms: [
            { x: 0, y: 490, w: 290, h: 50 },
            { x: 380, y: 490, w: 190, h: 50 },
            { x: 660, y: 490, w: 300, h: 50 },
            { x: 170, y: 380, w: 170, h: 24 },
            { x: 410, y: 315, w: 170, h: 24 },
            { x: 690, y: 250, w: 180, h: 24 },
          ],
          stars: [
            { x: 255, y: 335 },
            { x: 495, y: 270 },
            { x: 780, y: 205 },
          ],
          start: { x: 60, y: 450 },
          flag: { x: 880, y: 450 },
        },
      },
      {
        key: "stars-3",
        title: "All the Stars",
        description: "Collect every star without falling.",
        objective: "Collect all 5 stars and reach the flag without losing a life.",
        difficulty: "Advanced",
        concepts: ["Conditions", "Problem solving"],
        points: 120,
        starsAvailable: 3,
        level: {
          kind: "platformer",
          platforms: [
            { x: 0, y: 490, w: 160, h: 50 },
            { x: 300, y: 490, w: 140, h: 50 },
            { x: 560, y: 490, w: 140, h: 50 },
            { x: 820, y: 490, w: 140, h: 50 },
            { x: 110, y: 400, w: 130, h: 20 },
            { x: 290, y: 330, w: 140, h: 20 },
            { x: 500, y: 260, w: 140, h: 20 },
            { x: 690, y: 340, w: 140, h: 20 },
            { x: 820, y: 410, w: 140, h: 20 },
          ],
          stars: [
            { x: 175, y: 355 },
            { x: 360, y: 285 },
            { x: 570, y: 215 },
            { x: 760, y: 295 },
            { x: 890, y: 365 },
          ],
          start: { x: 60, y: 450 },
          flag: { x: 900, y: 450 },
        },
      },
    ],
  },
  {
    key: "robot-racing",
    title: "Robot Racing",
    mode: "racing",
    category: "racing",
    categoryLabel: "Racing",
    tagline: "Drive a speedy robot around the track and beat the clock.",
    description:
      "A top-down race track. Accelerate, steer around the cones and pass every checkpoint before time runs out. Smooth lines and well-placed turns earn the fastest times.",
    difficulty: "Intermediate",
    skills: ["Sequencing", "Loops", "Timing"],
    estimatedMinutes: 6,
    objective: "Pass every checkpoint and cross the finish line.",
    emoji: "🏎️",
    cover: "linear-gradient(150deg,#111827 0%,#b91c1c 50%,#facc15 100%)",
    palette: RACE_PALETTE,
    concepts: ["Sequencing", "Loops", "Timing"],
    hints: [
      "Move forward accelerates the robot.",
      "Turn left and turn right steer while moving.",
      "Brake before tight corners to keep control.",
    ],
    missions: [
      {
        key: "race-1",
        title: "Rookie Lap",
        description: "A wide track with two checkpoints.",
        objective: "Pass both checkpoints and finish the lap.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Motion"],
        points: 50,
        starsAvailable: 3,
        timeLimit: 60,
        level: {
          kind: "racing",
          checkpoints: [RACING_CHECKPOINTS[0], RACING_CHECKPOINTS[1], { x: 480, y: 485 }],
          cones: [],
          start: { x: 480, y: 485, angle: 0 },
          timeLimit: 60,
        },
      },
      {
        key: "race-2",
        title: "Cone Slalom",
        description: "Cones make the racing line tricky.",
        objective: "Pass 3 checkpoints and finish within 45 seconds.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Timing"],
        points: 80,
        starsAvailable: 3,
        timeLimit: 45,
        level: {
          kind: "racing",
          checkpoints: [
            RACING_CHECKPOINTS[0],
            RACING_CHECKPOINTS[1],
            RACING_CHECKPOINTS[3],
            { x: 480, y: 485 },
          ],
          cones: [
            { x: 620, y: 455 },
            { x: 760, y: 90 },
            { x: 140, y: 300 },
            { x: 250, y: 470 },
            { x: 480, y: 80 },
          ],
          start: { x: 480, y: 485, angle: 0 },
          timeLimit: 45,
        },
      },
      {
        key: "race-3",
        title: "Turbo Trophy",
        description: "A full lap against the clock.",
        objective: "Pass 4 checkpoints and finish within 35 seconds.",
        difficulty: "Advanced",
        concepts: ["Timing", "Problem solving"],
        points: 120,
        starsAvailable: 3,
        timeLimit: 35,
        level: {
          kind: "racing",
          checkpoints: [...RACING_CHECKPOINTS, { x: 480, y: 485 }],
          cones: [
            { x: 620, y: 455 },
            { x: 760, y: 90 },
            { x: 140, y: 300 },
            { x: 250, y: 470 },
            { x: 480, y: 80 },
            { x: 200, y: 110 },
            { x: 830, y: 300 },
            { x: 60, y: 470 },
          ],
          start: { x: 480, y: 485, angle: 0 },
          timeLimit: 35,
        },
      },
    ],
  },
  {
    key: "star-catcher",
    title: "Star Catcher",
    mode: "catcher",
    category: "arcade",
    categoryLabel: "Arcade",
    tagline: "Catch falling stars in a basket and dodge the bombs.",
    description:
      "A fast arcade challenge. Move the basket left and right to catch falling stars while avoiding bombs. Use loops and waits to keep the basket moving.",
    difficulty: "Beginner",
    skills: ["Events", "Loops", "Variables"],
    estimatedMinutes: 5,
    objective: "Catch the falling stars before time runs out.",
    emoji: "🌠",
    cover: "linear-gradient(150deg,#0b102f 0%,#4c1d95 50%,#facc15 100%)",
    palette: NIGHT_PALETTE,
    concepts: ["Events", "Loops", "Variables"],
    hints: [
      "Move left and move right slide the basket.",
      "A wait block lets the falling stars move.",
      "Bombs cost a heart, so keep watching the sky.",
    ],
    missions: [
      {
        key: "catcher-1",
        title: "Catch a Star",
        description: "Catch a few falling stars.",
        objective: "Catch 5 stars before time runs out.",
        difficulty: "Beginner",
        concepts: ["Events", "Sequencing"],
        points: 50,
        starsAvailable: 3,
        level: { kind: "catcher", required: 5, timeLimit: 60, spawnMs: 900, bombEvery: 0, fallSpeed: 150 },
      },
      {
        key: "catcher-2",
        title: "Star Shower",
        description: "The stars fall faster now.",
        objective: "Catch 10 stars before time runs out.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Variables"],
        points: 80,
        starsAvailable: 3,
        level: { kind: "catcher", required: 10, timeLimit: 60, spawnMs: 700, bombEvery: 5, fallSpeed: 210 },
      },
      {
        key: "catcher-3",
        title: "Bomb Dodger",
        description: "Catch stars while avoiding bombs.",
        objective: "Catch 15 stars without losing a heart.",
        difficulty: "Advanced",
        concepts: ["Conditions", "Problem solving"],
        points: 120,
        starsAvailable: 3,
        level: { kind: "catcher", required: 15, timeLimit: 60, spawnMs: 600, bombEvery: 3, fallSpeed: 260 },
      },
    ],
  },
  {
    key: "pattern-garden",
    title: "Pattern Garden",
    mode: "pattern",
    category: "puzzle",
    categoryLabel: "Puzzle & Logic",
    tagline: "Repeat the colour pattern by stepping on the magic flowers.",
    description:
      "A calm creative challenge. Watch the flowers light up, then guide Bloom across the garden pads in the same order. Wrong pads reset the sequence, so plan before moving.",
    difficulty: "Beginner",
    skills: ["Sequencing", "Loops", "Patterns"],
    estimatedMinutes: 6,
    objective: "Step on the flowers in the shown colour order.",
    emoji: "🌸",
    cover: "linear-gradient(150deg,#fef9c3 0%,#86efac 55%,#f472b6 100%)",
    palette: GARDEN_PALETTE,
    concepts: ["Sequencing", "Loops", "Patterns"],
    hints: [
      "Watch the pattern at the start of each mission.",
      "Move forward, back, left and right to step onto pads.",
      "A wrong pad resets the sequence but not your stars.",
    ],
    missions: [
      {
        key: "pattern-1",
        title: "Two Colours",
        description: "Copy a short two-colour pattern.",
        objective: "Repeat the 2-pad pattern.",
        difficulty: "Beginner",
        concepts: ["Sequencing", "Patterns"],
        points: 50,
        starsAvailable: 3,
        level: patternLevel([7, 8]),
      },
      {
        key: "pattern-2",
        title: "Garden Rhythm",
        description: "Copy a four-pad pattern.",
        objective: "Repeat the 4-pad pattern.",
        difficulty: "Intermediate",
        concepts: ["Loops", "Patterns"],
        points: 80,
        starsAvailable: 3,
        level: patternLevel([7, 4, 3, 0]),
      },
      {
        key: "pattern-3",
        title: "Bloom's Melody",
        description: "Copy a six-pad pattern without a mistake.",
        objective: "Repeat the 6-pad pattern without stepping on a wrong pad.",
        difficulty: "Advanced",
        concepts: ["Problem solving", "Patterns"],
        points: 120,
        starsAvailable: 3,
        level: patternLevel([7, 6, 3, 0, 1, 2]),
      },
    ],
  },
];

function patternLevel(pattern: number[]): PatternLevel {
  const colours = [0xe879f9, 0xfacc15, 0x4ade80, 0x60a5fa, 0xa78bfa, 0xfb923c, 0xf87171, 0x2dd4bf, 0xf472b6];
  const pads: Array<{ x: number; y: number; colour: number }> = [];
  let i = 0;
  for (let row = 5; row <= 7; row += 1) {
    for (let col = 6; col <= 8; col += 1) {
      pads.push({ x: col, y: row, colour: colours[i % colours.length] });
      i += 1;
    }
  }
  return {
    kind: "pattern",
    pads,
    pattern,
    start: { x: 7, y: 8, dir: 3 },
  };
}

export const GAME_BY_KEY: Record<string, GameSpec> = Object.fromEntries(
  GAMES.map((game) => [game.key, game]),
);

export function gameSpecFor(key: string): GameSpec | undefined {
  return GAME_BY_KEY[key];
}

export function missionSpecFor(gameKey: string, missionKey: string): MissionSpec | undefined {
  return gameSpecFor(gameKey)?.missions.find((mission) => mission.key === missionKey);
}

export const CATEGORY_TABS: Array<{ key: "all" | GameCategory | "recent" | "completed"; label: string }> = [
  { key: "all", label: "All Games" },
  { key: "adventure", label: "Adventure" },
  { key: "puzzle", label: "Puzzle & Logic" },
  { key: "platformer", label: "Platformer" },
  { key: "racing", label: "Racing" },
  { key: "arcade", label: "Arcade" },
  { key: "recent", label: "Recently Played" },
  { key: "completed", label: "Completed" },
];

/** A tiny legend so the runtime and catalogue never drift apart. */
export const GRID_LEGEND = {
  empty: GRID_EMPTY,
  wall: "#",
  hazard: "~",
  treasure: "T",
  crystal: "C",
  key: "K",
  goal: "G",
  start: "S",
} as const;

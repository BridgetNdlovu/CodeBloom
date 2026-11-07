import { parseScene } from "./engine";
import { starterJsonToXml } from "./blocks";
import { assetLocomotion, getAsset } from "./assets";
import type { GameProject, Scene, SpriteDef } from "./types";

/** Helpers for creating, loading and saving studio projects. */

const XML_HEADER = '<xml xmlns="https://developers.google.com/blockly/xml">';

function sprite(
  id: string,
  asset: string,
  name: string,
  role: SpriteDef["role"],
  x: number,
  y: number,
  size = 1,
  layer = 3,
  costume = 0,
): SpriteDef {
  return {
    id,
    asset,
    name,
    role,
    x,
    y,
    size,
    layer,
    direction: 0,
    animation: "idle",
    costume,
    flip: false,
    visible: true,
  };
}

export function blankScene(): Scene {
  return {
    format: "codebloom.scene.v1",
    stage: { width: 960, height: 540 },
    background: "garden-day",
    sprites: [
      sprite("hero", "kid-a", "Hero", "player", 120, 420, 1, 4),
      sprite("goal", "flag", "Finish flag", "goal", 820, 420, 0.9, 3),
      sprite("tree-1", "tree", "Oak tree", "decoration", 700, 250, 1.2, 1),
      sprite("flower-1", "flower", "Flower", "decoration", 360, 500, 0.55, 2),
      sprite("star-1", "star", "Star", "collectible", 330, 420, 0.55, 2),
      sprite("star-2", "star", "Star", "collectible", 520, 420, 0.55, 2),
      sprite("star-3", "star", "Star", "collectible", 700, 420, 0.55, 2),
    ],
    rules: {
      win: { type: "reach", spriteId: "hero", targetId: "goal" },
      lives: 3,
      timeLimit: null,
    },
  };
}

export function defaultStarterXml(): string {
  return `${XML_HEADER}<block type="event_start"><statement name="DO"><block type="control_repeat"><field name="TIMES">10</field><statement name="DO"><block type="motion_move"><field name="STEPS">70</field></block></statement></block></statement></block></xml>`;
}

/** An intentionally blank workspace for challenges meant to be coded from scratch. */
export function emptyStarterXml(): string {
  return `${XML_HEADER}</xml>`;
}

export function newSprite(
  scene: Scene,
  asset: string,
  name: string,
  role: SpriteDef["role"],
): SpriteDef {
  let index = scene.sprites.length + 1;
  const existing = new Set(scene.sprites.map((s) => s.id));
  while (existing.has(`${asset}-${index}`)) index += 1;
  const def = getAsset(asset);
  return sprite(
    `${asset}-${index}`,
    asset,
    name,
    role,
    480,
    300,
    def?.defaultSize ?? 1,
    3,
  );
}

/** Animations shown in the studio property panel. */
export const SPRITE_ANIMATIONS = [
  "idle",
  "walk",
  "run",
  "jump",
  "fly",
  "swim",
  "celebrate",
  "fall",
  "talk",
] as const;

export function defaultAnimationFor(asset: string) {
  return assetLocomotion(asset);
}

export function blankProject(title = "My Game"): GameProject {
  return {
    format: "codebloom.project.v1",
    title,
    description: "A free-play game made in the CodeBloom studio.",
    scene: blankScene(),
    blocksXml: defaultStarterXml(),
    variables: [
      { name: "score", value: 0 },
      { name: "lives", value: 3 },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export interface GameSource {
  title: string;
  tagline?: string;
  description?: string;
  sceneJson: string;
  starterBlocksJson?: string | null;
}

export function projectFromGame(game: GameSource): GameProject {
  const scene = parseScene(game.sceneJson) ?? blankScene();
  const starterXml = starterJsonToXml(game.starterBlocksJson);
  return {
    format: "codebloom.project.v1",
    title: `${game.title} Remix`,
    description: game.tagline ?? game.description ?? "A remix made in the studio.",
    scene,
    blocksXml: starterXml.includes("<block") ? starterXml : emptyStarterXml(),
    variables: [
      { name: "score", value: 0 },
      { name: "lives", value: scene.rules.lives },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/** Parse a saved project from StudentProject.Content. */
export function parseGameProject(content: string | null | undefined): GameProject | null {
  if (!content) return null;
  let raw: Partial<GameProject>;
  try {
    const parsed = JSON.parse(content) as Partial<GameProject>;
    if (!parsed || parsed.format !== "codebloom.project.v1") return null;
    raw = parsed;
  } catch {
    return null;
  }
  const scene = parseScene(JSON.stringify(raw.scene)) ?? blankScene();
  const variables = Array.isArray(raw.variables)
    ? raw.variables
        .filter((v): v is { name: string; value: number | string } =>
          Boolean(v) && typeof v.name === "string",
        )
        .slice(0, 30)
    : [];
  return {
    format: "codebloom.project.v1",
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "My Game",
    description: typeof raw.description === "string" ? raw.description : undefined,
    scene,
    blocksXml:
      typeof raw.blocksXml === "string" && raw.blocksXml.includes("<")
        ? raw.blocksXml
        : defaultStarterXml(),
    variables,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function serializeGameProject(project: GameProject): string {
  return JSON.stringify({ ...project, updatedAt: new Date().toISOString() }, null, 2);
}

export interface StudioTemplate {
  id: string;
  title: string;
  description: string;
  tagline: string;
  build: () => GameProject;
}

function makeProject(
  title: string,
  description: string,
  scene: Scene,
  blocksXml: string,
): GameProject {
  return {
    format: "codebloom.project.v1",
    title,
    description,
    scene,
    blocksXml,
    variables: [
      { name: "score", value: 0 },
      { name: "lives", value: scene.rules.lives },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: "blank",
    title: "Blank garden",
    tagline: "Start from an empty garden with a hero, a flag and three stars.",
    description:
      "A safe starting point. The starter program walks the hero to the flag. Change it, add sprites and make it yours.",
    build: () => blankProject(),
  },
  {
    id: "collect",
    title: "Star collector",
    tagline: "Collect every star in the forest.",
    description:
      "A collect-all game. The program loops across the forest collecting stars. Add more stars or move them around.",
    build: () => {
      const scene: Scene = {
        format: "codebloom.scene.v1",
        stage: { width: 960, height: 540 },
        background: "forest-day",
        sprites: [
          sprite("hero", "fox", "Rusty", "player", 120, 420, 0.95, 4),
          sprite("star-1", "star", "Star", "collectible", 260, 420, 0.6, 2),
          sprite("star-2", "star", "Star", "collectible", 400, 420, 0.6, 2, 1),
          sprite("star-3", "star", "Star", "collectible", 540, 420, 0.6, 2),
          sprite("star-4", "star", "Star", "collectible", 680, 420, 0.6, 2, 1),
          sprite("star-5", "star", "Star", "collectible", 820, 420, 0.6, 2),
          sprite("tree-1", "tree", "Pine", "decoration", 260, 240, 1.2, 1),
          sprite("tree-2", "pine", "Fir", "decoration", 700, 250, 1.1, 1),
        ],
        rules: { win: { type: "collect_all", spriteId: "hero" }, lives: 3, timeLimit: null },
      };
      const blocks =
        XML_HEADER +
        '<block type="event_start"><statement name="DO"><block type="control_repeat"><field name="TIMES">13</field><statement name="DO"><block type="motion_move"><field name="STEPS">60</field></block></statement></block></statement></block></xml>';
      return makeProject(
        "Star Collector",
        "Collect every star in the forest.",
        scene,
        blocks,
      );
    },
  },
  {
    id: "maze",
    title: "Hedge maze",
    tagline: "Find the golden key behind the hedges.",
    description:
      "A puzzle template with real obstacles. Touching a hedge costs a heart and sends the hero back to the start.",
    build: () => {
      const scene: Scene = {
        format: "codebloom.scene.v1",
        stage: { width: 960, height: 540 },
        background: "garden-morning",
        sprites: [
          sprite("hero", "cat", "Mango", "player", 100, 420, 0.9, 4),
          sprite("goal", "key", "Golden key", "goal", 820, 180, 0.9, 3),
          sprite("hedge-1", "hedge", "Hedge", "obstacle", 380, 420, 1.3, 2),
          sprite("hedge-2", "hedge", "Hedge", "obstacle", 500, 420, 1.3, 2),
          sprite("hedge-3", "hedge", "Hedge", "obstacle", 620, 420, 1.3, 2),
          sprite("hedge-4", "hedge", "Hedge", "obstacle", 620, 300, 1.3, 2),
          sprite("flower-1", "flower", "Rose", "decoration", 300, 500, 0.6, 2, 1),
        ],
        rules: {
          win: { type: "reach", spriteId: "hero", targetId: "goal" },
          lives: 3,
          timeLimit: null,
        },
      };
      const blocks =
        XML_HEADER +
        '<block type="event_start"><statement name="DO"><block type="motion_point"><field name="DIRECTION">90</field></block><block type="control_repeat"><field name="TIMES">4</field><statement name="DO"><block type="motion_move"><field name="STEPS">60</field></block></statement></block><block type="motion_point"><field name="DIRECTION">0</field></block><block type="control_repeat"><field name="TIMES">11</field><statement name="DO"><block type="motion_move"><field name="STEPS">60</field></block></statement></block><block type="motion_point"><field name="DIRECTION">270</field></block><block type="control_repeat"><field name="TIMES">4</field><statement name="DO"><block type="motion_move"><field name="STEPS">60</field></block></statement></block></statement></block></xml>';
      return makeProject(
        "Hedge Maze",
        "Find the golden key without touching the hedges.",
        scene,
        blocks,
      );
    },
  },
  {
    id: "flyer",
    title: "Cloud flyer",
    tagline: "Fly a dragon between clouds and grab the rainbow.",
    description:
      "A creative flying scene. The key events let you steer with arrow keys, and every sprite can be swapped.",
    build: () => {
      const scene: Scene = {
        format: "codebloom.scene.v1",
        stage: { width: 960, height: 540 },
        background: "clouds",
        sprites: [
          sprite("hero", "dragon", "Ember", "player", 140, 360, 1, 4),
          sprite("goal", "rainbow", "Rainbow", "goal", 840, 220, 1.1, 3),
          sprite("cloud-1", "cloud", "Cloud", "decoration", 340, 320, 1, 1),
          sprite("cloud-2", "cloud", "Cloud", "decoration", 620, 260, 1.2, 1),
          sprite("star-1", "star", "Star", "collectible", 380, 200, 0.6, 2),
          sprite("star-2", "star", "Star", "collectible", 560, 160, 0.6, 2),
        ],
        rules: {
          win: { type: "reach", spriteId: "hero", targetId: "goal" },
          lives: 3,
          timeLimit: 60,
        },
      };
      const blocks =
        XML_HEADER +
        '<block type="event_key" x="20" y="20"><field name="KEY">ArrowRight</field><statement name="DO"><block type="motion_change_x"><field name="CHANGE">40</field></block></statement></block>' +
        '<block type="event_key" x="20" y="180"><field name="KEY">ArrowLeft</field><statement name="DO"><block type="motion_change_x"><field name="CHANGE">-40</field></block></statement></block>' +
        '<block type="event_key" x="20" y="340"><field name="KEY">ArrowUp</field><statement name="DO"><block type="motion_change_y"><field name="CHANGE">-40</field></block></statement></block>' +
        '<block type="event_key" x="20" y="500"><field name="KEY">ArrowDown</field><statement name="DO"><block type="motion_change_y"><field name="CHANGE">40</field></block></statement></block>' +
        '<block type="event_start" x="360" y="20"><statement name="DO"><block type="game_start_timer"><field name="SECONDS">60</field></block><block type="looks_say"><field name="TEXT">Arrow keys steer. Reach the rainbow!</field></block></statement></block></xml>';
      return makeProject(
        "Cloud Flyer",
        "Arrow keys steer Ember. Reach the rainbow before the timer ends.",
        scene,
        blocks,
      );
    },
  },
];

export function projectFromTemplate(id: string): GameProject {
  const template = STUDIO_TEMPLATES.find((t) => t.id === id) ?? STUDIO_TEMPLATES[0];
  return template.build();
}

import * as Blockly from "blockly";
import { backgroundList } from "./backgrounds";
import type { BlockNode } from "./types";

/**
 * Blockly definitions, toolbox and compiler for free-play games.
 *
 * Every block below is executed by src/game/engine.ts. There are no decorative
 * "success only" blocks: if a block is on screen, the runtime does something
 * with it.
 */

const EVENTS = "#F59E0B";
const MOTION = "#3B82F6";
const LOOKS = "#8B5CF6";
const SOUND = "#EC4899";
const CONTROL = "#F97316";
const SENSING = "#06B6D4";
const OPERATORS = "#22C55E";
const GAME = "#EF4444";
const VARIABLES = "#CA8A04";

const KEY_OPTIONS = [
  ["space bar", "Space"],
  ["up arrow", "ArrowUp"],
  ["down arrow", "ArrowDown"],
  ["left arrow", "ArrowLeft"],
  ["right arrow", "ArrowRight"],
  ["A", "a"],
  ["S", "s"],
  ["D", "d"],
  ["W", "w"],
  ["Enter", "Enter"],
];

const TOUCH_OPTIONS = [
  ["goal", "goal"],
  ["collectible", "collectible"],
  ["obstacle", "obstacle"],
  ["edge of stage", "edge"],
  ["decoration", "decoration"],
];

const SOUND_OPTIONS = [
  ["pop", "pop"],
  ["coin", "coin"],
  ["jump", "jump"],
  ["beep", "beep"],
  ["power up", "power"],
  ["click", "click"],
];

const BACKGROUND_OPTIONS = backgroundList().map((b) => [b.name, b.key]);

const SPRITE_ASSET_OPTIONS = [
  ["coin", "coin"],
  ["gem", "gem"],
  ["star", "star"],
  ["heart", "heart"],
  ["apple", "apple"],
  ["candy", "candy"],
  ["snowflake", "snowflake"],
  ["bubble", "bubble"],
];

const numberShadow = (value: string) =>
  `<shadow type="math_number"><field name="NUM">${value}</field></shadow>`;

const valueInput = (name: string, shadow: string) =>
  `<value name="${name}">${shadow}</value>`;

const statement = (name: string, inner: string) =>
  `<statement name="${name}">${inner}</statement>`;

const BLOCK_DEFS: Array<Record<string, unknown>> = [
  // ---------------------------------------------------------------- events
  {
    type: "event_start",
    message0: "when game starts",
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    nextStatement: null,
    colour: EVENTS,
    tooltip: "Runs the blocks underneath once when Run is pressed.",
  },
  {
    type: "event_key",
    message0: "when %1 pressed",
    args0: [{ type: "field_dropdown", name: "KEY", options: KEY_OPTIONS }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    colour: EVENTS,
    tooltip: "Runs the stack when a key is pressed while the game is running.",
  },
  {
    type: "event_click",
    message0: "when %1 clicked",
    args0: [
      {
        type: "field_dropdown",
        name: "TARGET",
        options: [
          ["any sprite", "any"],
          ["the hero", "hero"],
          ["the goal", "goal"],
        ],
      },
    ],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    colour: EVENTS,
    tooltip: "Runs the stack when a sprite is clicked during play.",
  },

  // ---------------------------------------------------------------- motion
  {
    type: "motion_move",
    message0: "move %1 steps",
    args0: [{ type: "field_number", name: "STEPS", value: 60, min: -400, max: 400 }],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
    tooltip: "Moves the hero in the direction it is facing.",
  },
  {
    type: "motion_turn_left",
    message0: "turn left %1 degrees",
    args0: [{ type: "field_number", name: "DEGREES", value: 90, min: 0, max: 360 }],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_turn_right",
    message0: "turn right %1 degrees",
    args0: [{ type: "field_number", name: "DEGREES", value: 90, min: 0, max: 360 }],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_point",
    message0: "point %1",
    args0: [
      {
        type: "field_dropdown",
        name: "DIRECTION",
        options: [
          ["right", "0"],
          ["up", "90"],
          ["left", "180"],
          ["down", "270"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_goto",
    message0: "go to x %1 y %2",
    args0: [
      { type: "field_number", name: "X", value: 480, min: 0, max: 960 },
      { type: "field_number", name: "Y", value: 270, min: 0, max: 540 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_change_x",
    message0: "change x by %1",
    args0: [{ type: "field_number", name: "CHANGE", value: 30, min: -960, max: 960 }],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_change_y",
    message0: "change y by %1",
    args0: [{ type: "field_number", name: "CHANGE", value: 30, min: -540, max: 540 }],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_glide",
    message0: "glide to x %1 y %2 in %3 seconds",
    args0: [
      { type: "field_number", name: "X", value: 480, min: 0, max: 960 },
      { type: "field_number", name: "Y", value: 270, min: 0, max: 540 },
      { type: "field_number", name: "SECONDS", value: 1, min: 0.1, max: 10 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_jump",
    message0: "jump",
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },
  {
    type: "motion_bounce",
    message0: "if on edge, bounce",
    previousStatement: null,
    nextStatement: null,
    colour: MOTION,
  },

  // ---------------------------------------------------------------- looks
  {
    type: "looks_say",
    message0: "say %1",
    args0: [{ type: "field_input", name: "TEXT", text: "Hello!" }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_think",
    message0: "think %1",
    args0: [{ type: "field_input", name: "TEXT", text: "Hmm..." }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_costume",
    message0: "switch costume to %1",
    args0: [{ type: "field_number", name: "COSTUME", value: 1, min: 1, max: 4 }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_size",
    message0: "set size to %1 %%",
    args0: [{ type: "field_number", name: "SIZE", value: 100, min: 20, max: 300 }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_change_size",
    message0: "change size by %1",
    args0: [{ type: "field_number", name: "CHANGE", value: 10, min: -100, max: 100 }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_show",
    message0: "show",
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_hide",
    message0: "hide",
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_effect",
    message0: "change %1 effect by %2",
    args0: [
      {
        type: "field_dropdown",
        name: "EFFECT",
        options: [
          ["colour", "colour"],
          ["ghost", "ghost"],
        ],
      },
      { type: "field_number", name: "CHANGE", value: 25, min: -100, max: 100 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_background",
    message0: "switch background to %1",
    args0: [{ type: "field_dropdown", name: "BACKGROUND", options: BACKGROUND_OPTIONS }],
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },
  {
    type: "looks_next_background",
    message0: "next background",
    previousStatement: null,
    nextStatement: null,
    colour: LOOKS,
  },

  // ---------------------------------------------------------------- sound
  {
    type: "sound_play",
    message0: "play sound %1",
    args0: [{ type: "field_dropdown", name: "SOUND", options: SOUND_OPTIONS }],
    previousStatement: null,
    nextStatement: null,
    colour: SOUND,
  },
  {
    type: "sound_stop",
    message0: "stop all sounds",
    previousStatement: null,
    nextStatement: null,
    colour: SOUND,
  },
  {
    type: "sound_volume",
    message0: "set volume to %1 %%",
    args0: [{ type: "field_number", name: "VOLUME", value: 100, min: 0, max: 100 }],
    previousStatement: null,
    nextStatement: null,
    colour: SOUND,
  },

  // ---------------------------------------------------------------- control
  {
    type: "control_wait",
    message0: "wait %1 seconds",
    args0: [{ type: "field_number", name: "SECONDS", value: 1, min: 0, max: 10 }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_repeat",
    message0: "repeat %1 times",
    args0: [{ type: "field_number", name: "TIMES", value: 4, min: 1, max: 200 }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_forever",
    message0: "forever",
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_repeat_until",
    message0: "repeat until %1",
    args0: [{ type: "input_value", name: "CONDITION" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_if",
    message0: "if %1",
    args0: [{ type: "input_value", name: "CONDITION" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_if_else",
    message0: "if %1",
    args0: [{ type: "input_value", name: "CONDITION" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    message2: "else %1",
    args2: [{ type: "input_statement", name: "ELSE" }],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },
  {
    type: "control_stop",
    message0: "stop %1",
    args0: [
      {
        type: "field_dropdown",
        name: "MODE",
        options: [
          ["this script", "this"],
          ["the whole game", "all"],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: CONTROL,
  },

  // ---------------------------------------------------------------- sensing
  {
    type: "sensing_touching",
    message0: "touching %1?",
    args0: [{ type: "field_dropdown", name: "WHAT", options: TOUCH_OPTIONS }],
    output: "Boolean",
    colour: SENSING,
  },
  {
    type: "sensing_key",
    message0: "key %1 pressed?",
    args0: [{ type: "field_dropdown", name: "KEY", options: KEY_OPTIONS }],
    output: "Boolean",
    colour: SENSING,
  },
  {
    type: "sensing_mouse_down",
    message0: "mouse down?",
    output: "Boolean",
    colour: SENSING,
  },
  {
    type: "sensing_mouse_x",
    message0: "mouse x",
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_mouse_y",
    message0: "mouse y",
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_distance",
    message0: "distance to %1",
    args0: [{ type: "field_dropdown", name: "WHAT", options: TOUCH_OPTIONS }],
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_timer",
    message0: "timer",
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_score",
    message0: "score",
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_health",
    message0: "hearts",
    output: "Number",
    colour: SENSING,
  },
  {
    type: "sensing_collected",
    message0: "collected count",
    output: "Number",
    colour: SENSING,
  },

  // ---------------------------------------------------------------- operators
  {
    type: "op_add",
    message0: "%1 + %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Number",
    colour: OPERATORS,
  },
  {
    type: "op_sub",
    message0: "%1 - %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Number",
    colour: OPERATORS,
  },
  {
    type: "op_mul",
    message0: "%1 x %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Number",
    colour: OPERATORS,
  },
  {
    type: "op_div",
    message0: "%1 / %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Number",
    colour: OPERATORS,
  },
  {
    type: "op_gt",
    message0: "%1 > %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_lt",
    message0: "%1 < %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_eq",
    message0: "%1 = %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_and",
    message0: "%1 and %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_or",
    message0: "%1 or %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_not",
    message0: "not %1",
    args0: [{ type: "input_value", name: "A" }],
    output: "Boolean",
    colour: OPERATORS,
  },
  {
    type: "op_random",
    message0: "random %1 to %2",
    args0: [
      { type: "field_number", name: "FROM", value: 1 },
      { type: "field_number", name: "TO", value: 10 },
    ],
    output: "Number",
    colour: OPERATORS,
  },
  {
    type: "op_join",
    message0: "join %1 %2",
    args0: [
      { type: "input_value", name: "A" },
      { type: "input_value", name: "B" },
    ],
    output: "String",
    colour: OPERATORS,
  },
  {
    type: "math_number",
    message0: "%1",
    args0: [{ type: "field_number", name: "NUM", value: 1 }],
    output: "Number",
    colour: OPERATORS,
    tooltip: "A number. Drop it into a value slot.",
  },
  {
    type: "text",
    message0: "%1",
    args0: [{ type: "field_input", name: "TEXT", text: "hello" }],
    output: "String",
    colour: OPERATORS,
    tooltip: "Words or text. Drop it into a value slot.",
  },

  // ---------------------------------------------------------------- game
  {
    type: "game_score",
    message0: "change score by %1",
    args0: [{ type: "field_number", name: "CHANGE", value: 10, min: -1000, max: 1000 }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_health",
    message0: "change hearts by %1",
    args0: [{ type: "field_number", name: "CHANGE", value: -1, min: -9, max: 9 }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_collect",
    message0: "collect nearest item",
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_spawn",
    message0: "spawn %1",
    args0: [{ type: "field_dropdown", name: "ASSET", options: SPRITE_ASSET_OPTIONS }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_start_timer",
    message0: "start timer at %1 seconds",
    args0: [{ type: "field_number", name: "SECONDS", value: 60, min: 1, max: 600 }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_stop_timer",
    message0: "stop the timer",
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_win",
    message0: "win with message %1",
    args0: [{ type: "field_input", name: "TEXT", text: "You win!" }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_lose",
    message0: "lose with message %1",
    args0: [{ type: "field_input", name: "TEXT", text: "Game over. Try again!" }],
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_restart",
    message0: "restart the game",
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_checkpoint",
    message0: "save a checkpoint here",
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },
  {
    type: "game_next_level",
    message0: "next level",
    previousStatement: null,
    nextStatement: null,
    colour: GAME,
  },

  // ---------------------------------------------------------------- variables
  {
    type: "variables_set",
    message0: "set %1 to %2",
    args0: [
      { type: "field_input", name: "VAR", text: "score" },
      { type: "input_value", name: "VALUE" },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: VARIABLES,
  },
  {
    type: "variables_change",
    message0: "change %1 by %2",
    args0: [
      { type: "field_input", name: "VAR", text: "score" },
      { type: "input_value", name: "VALUE" },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: VARIABLES,
  },
  {
    type: "variables_get",
    message0: "%1",
    args0: [{ type: "field_input", name: "VAR", text: "score" }],
    output: "Number",
    colour: VARIABLES,
  },
];

let defined = false;

export function ensureGameBlocks() {
  if (defined) return;
  defined = true;
  Blockly.common.defineBlocksWithJsonArray(BLOCK_DEFS);
}

// ------------------------------------------------------------------
// Toolbox
// ------------------------------------------------------------------

const MOVE_SNIPPET =
  '<block type="motion_move"><field name="STEPS">60</field></block>';

const SNIPPETS: Record<string, string> = {
  event_start: `<block type="event_start">${statement("DO", MOVE_SNIPPET)}</block>`,
  event_key:
    '<block type="event_key"><field name="KEY">ArrowRight</field><statement name="DO"><block type="motion_move"><field name="STEPS">30</field></block></statement></block>',
  event_click:
    '<block type="event_click"><field name="TARGET">any</field><statement name="DO"><block type="looks_say"><field name="TEXT">You clicked me!</field></block></statement></block>',
  motion_move: MOVE_SNIPPET,
  motion_turn_left:
    '<block type="motion_turn_left"><field name="DEGREES">90</field></block>',
  motion_turn_right:
    '<block type="motion_turn_right"><field name="DEGREES">90</field></block>',
  motion_point: '<block type="motion_point"><field name="DIRECTION">90</field></block>',
  motion_goto:
    '<block type="motion_goto"><field name="X">480</field><field name="Y">270</field></block>',
  motion_change_x:
    '<block type="motion_change_x"><field name="CHANGE">30</field></block>',
  motion_change_y:
    '<block type="motion_change_y"><field name="CHANGE">30</field></block>',
  motion_glide:
    '<block type="motion_glide"><field name="X">480</field><field name="Y">270</field><field name="SECONDS">1</field></block>',
  motion_jump: '<block type="motion_jump"></block>',
  motion_bounce: '<block type="motion_bounce"></block>',
  looks_say: '<block type="looks_say"><field name="TEXT">Hello!</field></block>',
  looks_think: '<block type="looks_think"><field name="TEXT">Hmm...</field></block>',
  looks_costume: '<block type="looks_costume"><field name="COSTUME">1</field></block>',
  looks_size: '<block type="looks_size"><field name="SIZE">100</field></block>',
  looks_change_size:
    '<block type="looks_change_size"><field name="CHANGE">10</field></block>',
  looks_show: '<block type="looks_show"></block>',
  looks_hide: '<block type="looks_hide"></block>',
  looks_effect:
    '<block type="looks_effect"><field name="EFFECT">colour</field><field name="CHANGE">25</field></block>',
  looks_background:
    '<block type="looks_background"><field name="BACKGROUND">garden-day</field></block>',
  looks_next_background: '<block type="looks_next_background"></block>',
  sound_play: '<block type="sound_play"><field name="SOUND">coin</field></block>',
  sound_stop: '<block type="sound_stop"></block>',
  sound_volume: '<block type="sound_volume"><field name="VOLUME">80</field></block>',
  control_wait: '<block type="control_wait"><field name="SECONDS">1</field></block>',
  control_repeat:
    `<block type="control_repeat"><field name="TIMES">4</field>${statement("DO", MOVE_SNIPPET)}</block>`,
  control_forever: `<block type="control_forever">${statement(
    "DO",
    '<block type="motion_jump"></block><block type="control_wait"><field name="SECONDS">1</field></block>',
  )}</block>`,
  control_repeat_until: `<block type="control_repeat_until">${valueInput(
    "CONDITION",
    '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>',
  )}${statement("DO", MOVE_SNIPPET)}</block>`,
  control_if: `<block type="control_if">${valueInput(
    "CONDITION",
    '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>',
  )}${statement("DO", '<block type="game_win"><field name="TEXT">You win!</field></block>')}</block>`,
  control_if_else: `<block type="control_if_else">${valueInput(
    "CONDITION",
    '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>',
  )}${statement("DO", '<block type="game_win"><field name="TEXT">You win!</field></block>')}${statement(
    "ELSE",
    '<block type="looks_say"><field name="TEXT">Keep going!</field></block>',
  )}</block>`,
  control_stop: '<block type="control_stop"><field name="MODE">this</field></block>',
  sensing_touching:
    '<block type="sensing_touching"><field name="WHAT">goal</field></block>',
  sensing_key: '<block type="sensing_key"><field name="KEY">ArrowRight</field></block>',
  sensing_mouse_down: '<block type="sensing_mouse_down"></block>',
  sensing_mouse_x: '<block type="sensing_mouse_x"></block>',
  sensing_mouse_y: '<block type="sensing_mouse_y"></block>',
  sensing_distance:
    '<block type="sensing_distance"><field name="WHAT">goal</field></block>',
  sensing_timer: '<block type="sensing_timer"></block>',
  sensing_score: '<block type="sensing_score"></block>',
  sensing_health: '<block type="sensing_health"></block>',
  sensing_collected: '<block type="sensing_collected"></block>',
  op_add: `<block type="op_add">${valueInput("A", numberShadow("1"))}${valueInput("B", numberShadow("1"))}</block>`,
  op_sub: `<block type="op_sub">${valueInput("A", numberShadow("1"))}${valueInput("B", numberShadow("1"))}</block>`,
  op_mul: `<block type="op_mul">${valueInput("A", numberShadow("2"))}${valueInput("B", numberShadow("2"))}</block>`,
  op_div: `<block type="op_div">${valueInput("A", numberShadow("10"))}${valueInput("B", numberShadow("2"))}</block>`,
  op_gt: `<block type="op_gt">${valueInput("A", numberShadow("1"))}${valueInput("B", numberShadow("1"))}</block>`,
  op_lt: `<block type="op_lt">${valueInput("A", numberShadow("1"))}${valueInput("B", numberShadow("1"))}</block>`,
  op_eq: `<block type="op_eq">${valueInput("A", numberShadow("1"))}${valueInput("B", numberShadow("1"))}</block>`,
  op_and: `<block type="op_and">${valueInput("A", '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>')}${valueInput("B", '<shadow type="sensing_mouse_down"></shadow>')}</block>`,
  op_or: `<block type="op_or">${valueInput("A", '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>')}${valueInput("B", '<shadow type="sensing_mouse_down"></shadow>')}</block>`,
  op_not: `<block type="op_not">${valueInput("A", '<shadow type="sensing_touching"><field name="WHAT">goal</field></shadow>')}</block>`,
  op_random:
    '<block type="op_random"><field name="FROM">1</field><field name="TO">10</field></block>',
  op_join: `<block type="op_join">${valueInput("A", '<shadow type="text"><field name="TEXT">Score: </field></shadow>')}${valueInput("B", '<shadow type="sensing_score"></shadow>')}</block>`,
  math_number: '<block type="math_number"><field name="NUM">1</field></block>',
  text: '<block type="text"><field name="TEXT">hello</field></block>',
  game_score: '<block type="game_score"><field name="CHANGE">10</field></block>',
  game_health: '<block type="game_health"><field name="CHANGE">-1</field></block>',
  game_collect: '<block type="game_collect"></block>',
  game_spawn:
    '<block type="game_spawn"><field name="ASSET">coin</field></block>',
  game_start_timer:
    '<block type="game_start_timer"><field name="SECONDS">60</field></block>',
  game_stop_timer: '<block type="game_stop_timer"></block>',
  game_win: '<block type="game_win"><field name="TEXT">You win!</field></block>',
  game_lose:
    '<block type="game_lose"><field name="TEXT">Game over. Try again!</field></block>',
  game_restart: '<block type="game_restart"></block>',
  game_checkpoint: '<block type="game_checkpoint"></block>',
  game_next_level: '<block type="game_next_level"></block>',
  variables_set: `<block type="variables_set"><field name="VAR">score</field>${valueInput("VALUE", numberShadow("0"))}</block>`,
  variables_change: `<block type="variables_change"><field name="VAR">score</field>${valueInput("VALUE", numberShadow("1"))}</block>`,
  variables_get:
    '<block type="variables_get"><field name="VAR">score</field></block>',
};

interface ToolboxCategory {
  name: string;
  colour: string;
  types: string[];
}

const CATEGORIES: ToolboxCategory[] = [
  { name: "Events", colour: EVENTS, types: ["event_start", "event_key", "event_click"] },
  {
    name: "Motion",
    colour: MOTION,
    types: [
      "motion_move",
      "motion_turn_left",
      "motion_turn_right",
      "motion_point",
      "motion_goto",
      "motion_change_x",
      "motion_change_y",
      "motion_glide",
      "motion_jump",
      "motion_bounce",
    ],
  },
  {
    name: "Looks",
    colour: LOOKS,
    types: [
      "looks_say",
      "looks_think",
      "looks_costume",
      "looks_size",
      "looks_change_size",
      "looks_show",
      "looks_hide",
      "looks_effect",
      "looks_background",
      "looks_next_background",
    ],
  },
  { name: "Sound", colour: SOUND, types: ["sound_play", "sound_stop", "sound_volume"] },
  {
    name: "Control",
    colour: CONTROL,
    types: [
      "control_wait",
      "control_repeat",
      "control_forever",
      "control_repeat_until",
      "control_if",
      "control_if_else",
      "control_stop",
    ],
  },
  {
    name: "Sensing",
    colour: SENSING,
    types: [
      "sensing_touching",
      "sensing_key",
      "sensing_mouse_down",
      "sensing_mouse_x",
      "sensing_mouse_y",
      "sensing_distance",
      "sensing_timer",
      "sensing_score",
      "sensing_health",
      "sensing_collected",
    ],
  },
  {
    name: "Operators",
    colour: OPERATORS,
    types: [
      "op_add",
      "op_sub",
      "op_mul",
      "op_div",
      "op_gt",
      "op_lt",
      "op_eq",
      "op_and",
      "op_or",
      "op_not",
      "op_random",
      "op_join",
      "math_number",
      "text",
    ],
  },
  {
    name: "Game",
    colour: GAME,
    types: [
      "game_score",
      "game_health",
      "game_collect",
      "game_spawn",
      "game_start_timer",
      "game_stop_timer",
      "game_win",
      "game_lose",
      "game_restart",
      "game_checkpoint",
      "game_next_level",
    ],
  },
  {
    name: "Variables",
    colour: VARIABLES,
    types: ["variables_set", "variables_change", "variables_get"],
  },
];

/**
 * Build a toolbox limited to the blocks a game or the studio offers.
 * Literal number/text blocks are always available because they are values,
 * not actions.
 */
export function toolboxXml(allowed?: string[] | null): string {
  const always = new Set(["math_number", "text"]);
  const categories = CATEGORIES.map((category) => {
    const types = category.types.filter(
      (type) => !allowed || allowed.includes(type) || always.has(type),
    );
    if (types.length === 0) return "";
    const entries = types.map((type) => SNIPPETS[type]).join("");
    return `<category name="${category.name}" colour="${category.colour}">${entries}</category>`;
  }).join("");
  return `<xml xmlns="https://developers.google.com/blockly/xml">${categories}</xml>`;
}

// ------------------------------------------------------------------
// Serialisation
// ------------------------------------------------------------------

export function serializeWorkspace(workspace: Blockly.Workspace): string {
  return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
}

export function xmlToWorkspace(xml: string, workspace: Blockly.Workspace): void {
  ensureGameBlocks();
  const text = xml?.trim().startsWith("<xml")
    ? xml
    : `<xml xmlns="https://developers.google.com/blockly/xml">${xml ?? ""}</xml>`;
  try {
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(text), workspace);
  } catch {
    /* Ignore malformed saved XML rather than breaking the studio. */
  }
}

/** Convert a saved starter descriptor array into Blockly workspace XML. */
export function starterJsonToXml(json: string | null | undefined): string {
  const empty = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
  if (!json) return empty;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return empty;
  }
  const nodes = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? [parsed]
      : [];
  const xml = nodes.map((node) => descriptorXml(node)).join("");
  return `<xml xmlns="https://developers.google.com/blockly/xml">${xml}</xml>`;
}

interface Descriptor {
  type?: string;
  fields?: Record<string, unknown>;
  children?: Descriptor[];
}

function descriptorXml(value: unknown): string {
  const node = (value ?? {}) as Descriptor;
  const type = typeof node.type === "string" ? node.type : "";
  if (!type) return "";
  const fields = Object.entries(node.fields ?? {})
    .filter(([name]) => /^[A-Za-z0-9_]+$/.test(name))
    .map(
      ([name, fieldValue]) =>
        `<field name="${name.toUpperCase()}">${escapeXml(String(fieldValue ?? ""))}</field>`,
    )
    .join("");
  const children = Array.isArray(node.children)
    ? node.children.map(descriptorXml).join("")
    : "";
  const body = children ? statement("DO", children) : "";
  return `<block type="${type}">${fields}${body}</block>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ------------------------------------------------------------------
// Compiler: Blockly workspace -> runtime BlockNode tree
// ------------------------------------------------------------------

function collectFields(block: Blockly.Block): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const input of block.inputList) {
    for (const field of input.fieldRow) {
      const name = field.name;
      if (!name) continue;
      const value = block.getFieldValue(name);
      if (value !== null && value !== undefined) fields[name] = String(value);
    }
  }
  return fields;
}

function compileReporter(block: Blockly.Block | null): BlockNode | undefined {
  if (!block) return undefined;
  const node: BlockNode = {
    type: block.type,
    fields: collectFields(block),
    inputs: {},
  };
  for (const input of block.inputList) {
    if (input.type !== Blockly.inputs.inputTypes.VALUE) continue;
    const target = input.connection?.targetBlock() ?? null;
    const compiled = compileReporter(target);
    if (compiled) node.inputs[input.name] = compiled;
  }
  return node;
}

function compileStatement(block: Blockly.Block | null): BlockNode | undefined {
  if (!block) return undefined;
  const node: BlockNode = {
    type: block.type,
    fields: collectFields(block),
    inputs: {},
  };

  const bodyInputs: Record<string, "body" | "body2"> = {
    DO: "body",
    ELSE: "body2",
  };

  for (const input of block.inputList) {
    if (input.type === Blockly.inputs.inputTypes.STATEMENT) {
      const body = compileStatement(input.connection?.targetBlock() ?? null);
      if (body) {
        const key = bodyInputs[input.name] ?? "body";
        node[key] = body;
      }
    } else if (input.type === Blockly.inputs.inputTypes.VALUE) {
      const compiled = compileReporter(input.connection?.targetBlock() ?? null);
      if (compiled) node.inputs[input.name] = compiled;
    }
  }

  const next = compileStatement(block.getNextBlock());
  if (next) node.next = next;
  return node;
}

/** Compile the whole workspace into the array of top-level programs. */
export function compileWorkspace(workspace: Blockly.Workspace): BlockNode[] {
  ensureGameBlocks();
  const programs: BlockNode[] = [];
  for (const top of workspace.getTopBlocks(true)) {
    const compiled = compileStatement(top);
    if (compiled) programs.push(compiled);
  }
  return programs;
}

/** Compile an XML string (used when the live workspace is not available). */
export function compileXml(xml: string): BlockNode[] {
  ensureGameBlocks();
  const workspace = new Blockly.Workspace();
  try {
    xmlToWorkspace(xml, workspace);
    return compileWorkspace(workspace);
  } finally {
    workspace.dispose();
  }
}

/** Count executable statement blocks, used for friendly empty-program hints. */
export function executableBlockCount(programs: BlockNode[]): number {
  let count = 0;
  const walk = (node?: BlockNode) => {
    if (!node) return;
    if (!node.type.startsWith("event_") && !["math_number", "text"].includes(node.type)) {
      count += 1;
    }
    walk(node.body);
    walk(node.body2);
    walk(node.next);
    Object.values(node.inputs).forEach((value) => {
      if (typeof value === "object") walk(value);
    });
  };
  programs.forEach(walk);
  return count;
}

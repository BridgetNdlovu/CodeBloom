import * as Blockly from "blockly";

/**
 * CodeBloom game blocks.
 *
 * Blocks compile into the small, safe statement/expression tree in this file.
 * The tree is interpreted against game actions; we never generate or eval
 * JavaScript, so a learner can only trigger supported game behaviour.
 */

export type Expr =
  | { type: "number"; value: number }
  | { type: "text"; value: string }
  | { type: "variable"; name: string }
  | { type: "binary"; op: string; left: Expr; right: Expr }
  | { type: "compare"; op: string; left: Expr; right: Expr }
  | { type: "logic"; op: string; left: Expr; right: Expr }
  | { type: "not"; value: Expr }
  | { type: "sense"; name: string; arg?: string }
  | { type: "random"; min: Expr; max: Expr };

export type Stmt =
  | { type: "forward" }
  | { type: "backward" }
  | { type: "left" }
  | { type: "right" }
  | { type: "turn"; dir: "left" | "right" }
  | { type: "jump" }
  | { type: "brake" }
  | { type: "speed"; value: Expr }
  | { type: "goto"; x: Expr; y: Expr }
  | { type: "wait"; seconds: Expr }
  | { type: "say"; text: Expr }
  | { type: "show" }
  | { type: "hide" }
  | { type: "size"; value: Expr }
  | { type: "costume"; name: string }
  | { type: "sound"; action: string }
  | { type: "setvar"; name: string; value: Expr }
  | { type: "changevar"; name: string; value: Expr }
  | { type: "if"; condition: Expr; body: Stmt[]; otherwise: Stmt[] }
  | { type: "repeat"; times: Expr; body: Stmt[] }
  | { type: "repeatUntil"; condition: Expr; body: Stmt[] }
  | { type: "forever"; body: Stmt[] }
  | { type: "stop" }
  | { type: "call"; name: string };

export interface CompiledProgram {
  main: Stmt[];
  onClick: Stmt[];
  onKey: Stmt[];
  functions: Record<string, Stmt[]>;
  blockCount: number;
  xml: string;
  summary: string;
}

let registered = false;

const NUMBER_FIELD = (name: string, value: number, min = -9999, max = 9999, precision = 1) => ({
  type: "field_number",
  name,
  value,
  min,
  max,
  precision,
});

const DROPDOWN = (name: string, options: Array<[string, string]>, value?: string) => ({
  type: "field_dropdown",
  name,
  options,
  ...(value ? { value } : {}),
});

const VARIABLE_OPTIONS: Array<[string, string]> = [
  ["score", "score"],
  ["lives", "lives"],
  ["speed", "speed"],
  ["time", "time"],
  ["collected", "stars collected"],
];

function statementBlock(
  type: string,
  message: string,
  args: unknown[] = [],
  colour: number,
  extra: Record<string, unknown> = {},
) {
  return {
    type,
    message0: message,
    args0: args,
    previousStatement: null,
    nextStatement: null,
    colour,
    tooltip: "",
    ...extra,
  };
}

function hatBlock(type: string, message: string, args: unknown[] = [], colour = 40, extra: Record<string, unknown> = {}) {
  return {
    type,
    message0: message,
    args0: args,
    nextStatement: null,
    colour,
    hat: "cap",
    tooltip: "",
    ...extra,
  };
}

function outputBlock(type: string, message: string, args: unknown[], output: string, colour: number) {
  return {
    type,
    message0: message,
    args0: args,
    output,
    colour,
    tooltip: "",
  };
}

const BLOCKS: unknown[] = [
  // Events ---------------------------------------------------------------
  hatBlock("cb_event_start", "when game starts", [], 40),
  hatBlock("cb_event_click", "when character clicked", [], 40),
  hatBlock(
    "cb_event_key",
    "when %1 pressed",
    [DROPDOWN("KEY", [["space", "space"], ["arrow up", "up"], ["arrow down", "down"], ["arrow left", "left"], ["arrow right", "right"], ["enter", "enter"]])],
    40,
  ),

  // Motion ---------------------------------------------------------------
  statementBlock("cb_motion_forward", "move forward", [], 210),
  statementBlock("cb_motion_backward", "move backward", [], 210),
  statementBlock("cb_motion_left", "move left", [], 210),
  statementBlock("cb_motion_right", "move right", [], 210),
  statementBlock("cb_turn_left", "turn left", [], 210),
  statementBlock("cb_turn_right", "turn right", [], 210),
  statementBlock("cb_jump", "jump", [], 210),
  statementBlock("cb_brake", "brake", [], 210),
  statementBlock("cb_motion_speed", "set speed to %1", [NUMBER_FIELD("SPEED", 5, 1, 10, 1)], 210),
  statementBlock(
    "cb_motion_goto",
    "go to x %1 y %2",
    [NUMBER_FIELD("X", 0, 0, 14, 1), NUMBER_FIELD("Y", 0, 0, 8, 1)],
    210,
    { tooltip: "Move to a tile position on the board (0-14 across, 0-8 down)." },
  ),

  // Control --------------------------------------------------------------
  statementBlock("cb_wait", "wait %1 seconds", [NUMBER_FIELD("SECONDS", 0.5, 0, 5, 0.1)], 30),
  {
    type: "cb_repeat",
    message0: "repeat %1 times",
    args0: [NUMBER_FIELD("TIMES", 3, 1, 50, 1)],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: 30,
    tooltip: "Repeat the blocks inside this many times.",
  },
  {
    type: "cb_repeat_until",
    message0: "repeat until %1",
    args0: [{ type: "input_value", name: "CONDITION", check: "Boolean" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: 30,
    tooltip: "Keep repeating while the condition is false.",
  },
  {
    type: "cb_if",
    message0: "if %1 then",
    args0: [{ type: "input_value", name: "CONDITION", check: "Boolean" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: 30,
  },
  {
    type: "cb_if_else",
    message0: "if %1 then",
    args0: [{ type: "input_value", name: "CONDITION", check: "Boolean" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    message2: "else %1",
    args2: [{ type: "input_statement", name: "ELSE" }],
    previousStatement: null,
    nextStatement: null,
    colour: 30,
  },
  {
    type: "cb_forever",
    message0: "forever",
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: 30,
    tooltip: "Repeat forever (safely stopped after 500 loops).",
  },
  statementBlock("cb_stop", "stop program", [], 30),

  // Looks ----------------------------------------------------------------
  statementBlock("cb_say", "say %1", [{ type: "field_input", name: "TEXT", text: "Hello!" }], 270),
  statementBlock("cb_show", "show character", [], 270),
  statementBlock("cb_hide", "hide character", [], 270),
  statementBlock("cb_size", "set size to %1 percent", [NUMBER_FIELD("SIZE", 100, 25, 250, 5)], 270),
  statementBlock(
    "cb_costume",
    "switch costume to %1",
    [DROPDOWN("COSTUME", [["Bloom (girl)", "girl"], ["Bumble (boy)", "boy"]])],
    270,
  ),

  // Sound ----------------------------------------------------------------
  statementBlock(
    "cb_sound_play",
    "play sound %1",
    [DROPDOWN("SOUND", [["beep", "beep"], ["chime", "chime"], ["coin", "coin"], ["whoosh", "whoosh"]])],
    290,
  ),
  statementBlock("cb_sound_stop", "stop all sounds", [], 290),
  statementBlock(
    "cb_effect",
    "play effect %1",
    [DROPDOWN("EFFECT", [["sparkle", "sparkle"], ["flash", "flash"]])],
    290,
  ),

  // Sensing --------------------------------------------------------------
  outputBlock("cb_sense_touching", "touching obstacle?", [], "Boolean", 200),
  outputBlock("cb_sense_goal", "at destination?", [], "Boolean", 200),
  outputBlock("cb_sense_collected", "stars collected", [], "Number", 200),
  outputBlock(
    "cb_sense_key",
    "key %1 pressed?",
    [DROPDOWN("KEY", [["up", "up"], ["down", "down"], ["left", "left"], ["right", "right"], ["space", "space"]])],
    "Boolean",
    200,
  ),
  outputBlock("cb_sense_enemy", "enemy nearby?", [], "Boolean", 200),
  outputBlock("cb_sense_hearts", "hearts left", [], "Number", 200),
  outputBlock("cb_sense_time", "time left", [], "Number", 200),

  // Operators ------------------------------------------------------------
  outputBlock(
    "cb_operator_arithmetic",
    "%1 %2 %3",
    [
      { type: "input_value", name: "A", check: "Number" },
      DROPDOWN("OP", [["+", "+"], ["-", "-"], ["×", "*"], ["÷", "/"]]),
      { type: "input_value", name: "B", check: "Number" },
    ],
    "Number",
    230,
  ),
  outputBlock(
    "cb_operator_compare",
    "%1 %2 %3",
    [
      { type: "input_value", name: "A" },
      DROPDOWN("OP", [["=", "="], ["≠", "!="], ["<", "<"], [">", ">"], ["≤", "<="], ["≥", ">="]]),
      { type: "input_value", name: "B" },
    ],
    "Boolean",
    230,
  ),
  outputBlock(
    "cb_operator_logic",
    "%1 %2 %3",
    [
      { type: "input_value", name: "A", check: "Boolean" },
      DROPDOWN("OP", [["and", "and"], ["or", "or"]]),
      { type: "input_value", name: "B", check: "Boolean" },
    ],
    "Boolean",
    230,
  ),
  outputBlock("cb_operator_not", "not %1", [{ type: "input_value", name: "VALUE", check: "Boolean" }], "Boolean", 230),
  outputBlock(
    "cb_random",
    "random %1 to %2",
    [NUMBER_FIELD("MIN", 1, -9999, 9999, 1), NUMBER_FIELD("MAX", 5, -9999, 9999, 1)],
    "Number",
    230,
  ),
  outputBlock("cb_number", "%1", [NUMBER_FIELD("NUM", 1, -9999, 9999, 1)], "Number", 230),
  outputBlock("cb_text", "%1", [{ type: "field_input", name: "TEXT", text: "hello" }], "String", 230),

  // Variables ------------------------------------------------------------
  outputBlock("cb_var_get", "variable %1", [DROPDOWN("VAR", VARIABLE_OPTIONS)], "Number", 330),
  statementBlock("cb_var_set", "set %1 to %2", [DROPDOWN("VAR", VARIABLE_OPTIONS), { type: "input_value", name: "VALUE", check: "Number" }], 330),
  statementBlock("cb_var_change", "change %1 by %2", [DROPDOWN("VAR", VARIABLE_OPTIONS), { type: "input_value", name: "VALUE", check: "Number" }], 330),

  // Functions ------------------------------------------------------------
  {
    type: "cb_func_def",
    message0: "define function %1",
    args0: [{ type: "field_input", name: "NAME", text: "myFunction" }],
    message1: "do %1",
    args1: [{ type: "input_statement", name: "DO" }],
    colour: 180,
    tooltip: "Create a reusable set of instructions.",
  },
  statementBlock("cb_func_call", "call function %1", [{ type: "field_input", name: "NAME", text: "myFunction" }], 180),
];

export function ensureGameBlocks(): void {
  if (registered) return;
  Blockly.defineBlocksWithJsonArray(BLOCKS);
  registered = true;
}

const CATEGORY_COLOURS: Record<string, number> = {
  Events: 40,
  Motion: 210,
  Control: 30,
  Looks: 270,
  Sound: 290,
  Sensing: 200,
  Operators: 230,
  Variables: 330,
  Functions: 180,
};

function blockXml(type: string, fields: Record<string, string> = {}): string {
  const fieldsXml = Object.entries(fields)
    .map(([name, value]) => `<field name="${name}">${escapeXml(value)}</field>`)
    .join("");
  return `<block type="${type}">${fieldsXml}</block>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Toolbox tuned per game mode. Every category is supported by the runtime;
 * motion blocks that make no sense for a mode are omitted.
 */
export function toolboxXmlFor(mode: string): string {
  const grid = mode === "jungle" || mode === "maze" || mode === "space" || mode === "pattern";
  const platformer = mode === "platformer";
  const racing = mode === "racing";
  const catcher = mode === "catcher";

  const motion: string[] = [];
  if (!catcher) {
    motion.push(blockXml("cb_motion_forward", {}));
    motion.push(blockXml("cb_motion_backward", {}));
  }
  if (!racing) {
    motion.push(blockXml("cb_motion_left", {}));
    motion.push(blockXml("cb_motion_right", {}));
  }
  if (!catcher) {
    motion.push(blockXml("cb_turn_left", {}));
    motion.push(blockXml("cb_turn_right", {}));
  }
  if (platformer || catcher || grid) motion.push(blockXml("cb_jump", {}));
  if (racing) motion.push(blockXml("cb_brake", {}));
  motion.push(blockXml("cb_motion_speed", { SPEED: "5" }));
  if (grid) motion.push(blockXml("cb_motion_goto", { X: "7", Y: "4" }));

  const sensing: string[] = [
    blockXml("cb_sense_touching", {}),
    blockXml("cb_sense_goal", {}),
    blockXml("cb_sense_collected", {}),
    blockXml("cb_sense_hearts", {}),
    blockXml("cb_sense_time", {}),
    blockXml("cb_sense_key", { KEY: "up" }),
    blockXml("cb_sense_enemy", {}),
  ];

  const control: string[] = [
    blockXml("cb_wait", { SECONDS: "0.5" }),
    `<block type="cb_repeat"><field name="TIMES">3</field><statement name="DO">${blockXml("cb_motion_forward", {})}</statement></block>`,
    `<block type="cb_repeat_until"><value name="CONDITION">${blockXml("cb_sense_goal", {})}</value><statement name="DO">${blockXml("cb_motion_forward", {})}</statement></block>`,
    `<block type="cb_if"><value name="CONDITION">${blockXml("cb_sense_touching", {})}</value><statement name="DO">${blockXml("cb_turn_right", {})}</statement></block>`,
    `<block type="cb_if_else"><value name="CONDITION">${blockXml("cb_sense_goal", {})}</value><statement name="DO">${blockXml("cb_say", { TEXT: "I made it!" })}</statement><statement name="ELSE">${blockXml("cb_motion_forward", {})}</statement></block>`,
    `<block type="cb_forever"><statement name="DO">${blockXml("cb_wait", { SECONDS: "0.2" })}${blockXml("cb_motion_forward", {})}</statement></block>`,
    blockXml("cb_stop", {}),
  ];

  const looks: string[] = [
    blockXml("cb_say", { TEXT: "Hello!" }),
    blockXml("cb_show", {}),
    blockXml("cb_hide", {}),
    blockXml("cb_size", { SIZE: "100" }),
    blockXml("cb_costume", { COSTUME: "girl" }),
  ];

  const sound: string[] = [
    blockXml("cb_sound_play", { SOUND: "beep" }),
    blockXml("cb_sound_stop", {}),
    blockXml("cb_effect", { EFFECT: "sparkle" }),
  ];

  const operators: string[] = [
    `<block type="cb_operator_arithmetic"><value name="A">${blockXml("cb_number", { NUM: "1" })}</value><field name="OP">+</field><value name="B">${blockXml("cb_number", { NUM: "1" })}</value></block>`,
    `<block type="cb_operator_compare"><value name="A">${blockXml("cb_sense_collected", {})}</value><field name="OP">=</field><value name="B">${blockXml("cb_number", { NUM: "3" })}</value></block>`,
    `<block type="cb_operator_logic"><value name="A">${blockXml("cb_sense_touching", {})}</value><field name="OP">and</field><value name="B">${blockXml("cb_sense_goal", {})}</value></block>`,
    `<block type="cb_operator_not"><value name="VALUE">${blockXml("cb_sense_goal", {})}</value></block>`,
    blockXml("cb_random", { MIN: "1", MAX: "5" }),
    blockXml("cb_number", { NUM: "1" }),
    blockXml("cb_text", { TEXT: "hello" }),
  ];

  const variables: string[] = [
    blockXml("cb_var_get", { VAR: "score" }),
    `<block type="cb_var_set"><field name="VAR">score</field><value name="VALUE">${blockXml("cb_number", { NUM: "0" })}</value></block>`,
    `<block type="cb_var_change"><field name="VAR">score</field><value name="VALUE">${blockXml("cb_number", { NUM: "1" })}</value></block>`,
  ];

  const functions: string[] = [
    `<block type="cb_func_def"><field name="NAME">jumpForward</field><statement name="DO">${blockXml("cb_jump", {})}${blockXml("cb_motion_forward", {})}</statement></block>`,
    blockXml("cb_func_call", { NAME: "jumpForward" }),
  ];

  const categories = [
    ["Events", [blockXml("cb_event_start", {}), blockXml("cb_event_click", {}), blockXml("cb_event_key", { KEY: "space" })]],
    ["Motion", motion],
    ["Control", control],
    ["Looks", looks],
    ["Sound", sound],
    ["Sensing", sensing],
    ["Operators", operators],
    ["Variables", variables],
    ["Functions", functions],
  ] as const;

  return (
    "<xml>" +
    categories
      .map(
        ([name, blocks]) =>
          `<category name="${name}" colour="${CATEGORY_COLOURS[name]}">${blocks.join("")}</category>`,
      )
      .join("") +
    "</xml>"
  );
}

export function starterXmlFor(mode: string): string {
  const first =
    mode === "catcher"
      ? "cb_motion_left"
      : mode === "racing"
        ? "cb_motion_forward"
        : mode === "platformer"
          ? "cb_motion_forward"
          : "cb_motion_forward";
  return (
    `<xml><block type="cb_event_start" x="24" y="24">` +
    `<next><block type="cb_${first.replace(/^cb_/, "")}"></block></next>` +
    `</block></xml>`
  );
}

function fieldNumber(block: Blockly.Block, name: string, fallback = 0): Expr {
  const value = Number(block.getFieldValue(name));
  return { type: "number", value: Number.isFinite(value) ? value : fallback };
}

function numberFrom(block: Blockly.Block | null, fallback = 0): number {
  if (!block) return fallback;
  return evalStatic(parseExpr(block), fallback);
}

function evalStatic(expr: Expr, fallback = 0): number {
  switch (expr.type) {
    case "number":
      return expr.value;
    case "binary": {
      const a = evalStatic(expr.left, 0);
      const b = evalStatic(expr.right, 0);
      switch (expr.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return b === 0 ? 0 : a / b;
        default:
          return fallback;
      }
    }
    case "random":
      return evalStatic(expr.min, 1);
    default:
      return fallback;
  }
}

export function parseExpr(block: Blockly.Block | null): Expr {
  if (!block) return { type: "number", value: 0 };
  switch (block.type) {
    case "cb_number":
      return { type: "number", value: Number(block.getFieldValue("NUM") ?? 0) || 0 };
    case "cb_text":
      return { type: "text", value: String(block.getFieldValue("TEXT") ?? "") };
    case "cb_var_get":
      return { type: "variable", name: String(block.getFieldValue("VAR") ?? "score") };
    case "cb_operator_arithmetic":
      return {
        type: "binary",
        op: String(block.getFieldValue("OP") ?? "+"),
        left: parseExpr(block.getInputTargetBlock("A")),
        right: parseExpr(block.getInputTargetBlock("B")),
      };
    case "cb_operator_compare":
      return {
        type: "compare",
        op: String(block.getFieldValue("OP") ?? "="),
        left: parseExpr(block.getInputTargetBlock("A")),
        right: parseExpr(block.getInputTargetBlock("B")),
      };
    case "cb_operator_logic":
      return {
        type: "logic",
        op: String(block.getFieldValue("OP") ?? "and"),
        left: parseExpr(block.getInputTargetBlock("A")),
        right: parseExpr(block.getInputTargetBlock("B")),
      };
    case "cb_operator_not":
      return { type: "not", value: parseExpr(block.getInputTargetBlock("VALUE")) };
    case "cb_sense_touching":
      return { type: "sense", name: "hazard" };
    case "cb_sense_goal":
      return { type: "sense", name: "goal" };
    case "cb_sense_collected":
      return { type: "sense", name: "collected" };
    case "cb_sense_hearts":
      return { type: "sense", name: "hearts" };
    case "cb_sense_time":
      return { type: "sense", name: "time" };
    case "cb_sense_enemy":
      return { type: "sense", name: "enemy" };
    case "cb_sense_key":
      return { type: "sense", name: "key", arg: String(block.getFieldValue("KEY") ?? "up") };
    case "cb_random":
      return {
        type: "random",
        min: fieldNumber(block, "MIN", 1),
        max: fieldNumber(block, "MAX", 5),
      };
    default:
      return { type: "number", value: 0 };
  }
}

function parseStatements(first: Blockly.Block | null): Stmt[] {
  const out: Stmt[] = [];
  let block: Blockly.Block | null = first;
  let guard = 0;
  while (block && guard < 500) {
    guard += 1;
    const stmt = parseStatement(block);
    if (stmt) out.push(stmt);
    block = block.getNextBlock();
  }
  return out;
}

function parseStatement(block: Blockly.Block): Stmt | null {
  switch (block.type) {
    case "cb_motion_forward":
      return { type: "forward" };
    case "cb_motion_backward":
      return { type: "backward" };
    case "cb_motion_left":
      return { type: "left" };
    case "cb_motion_right":
      return { type: "right" };
    case "cb_turn_left":
      return { type: "turn", dir: "left" };
    case "cb_turn_right":
      return { type: "turn", dir: "right" };
    case "cb_jump":
      return { type: "jump" };
    case "cb_brake":
      return { type: "brake" };
    case "cb_motion_speed":
      return { type: "speed", value: fieldNumber(block, "SPEED", 5) };
    case "cb_motion_goto":
      return {
        type: "goto",
        x: fieldNumber(block, "X", 0),
        y: fieldNumber(block, "Y", 0),
      };
    case "cb_wait":
      return { type: "wait", seconds: fieldNumber(block, "SECONDS", 0.5) };
    case "cb_say":
      return { type: "say", text: { type: "text", value: String(block.getFieldValue("TEXT") ?? "") } };
    case "cb_show":
      return { type: "show" };
    case "cb_hide":
      return { type: "hide" };
    case "cb_size":
      return { type: "size", value: fieldNumber(block, "SIZE", 100) };
    case "cb_costume":
      return { type: "costume", name: String(block.getFieldValue("COSTUME") ?? "girl") };
    case "cb_sound_play":
      return { type: "sound", action: String(block.getFieldValue("SOUND") ?? "beep") };
    case "cb_sound_stop":
      return { type: "sound", action: "stop" };
    case "cb_effect":
      return { type: "sound", action: `effect:${String(block.getFieldValue("EFFECT") ?? "sparkle")}` };
    case "cb_var_set":
      return {
        type: "setvar",
        name: String(block.getFieldValue("VAR") ?? "score"),
        value: parseExpr(block.getInputTargetBlock("VALUE")),
      };
    case "cb_var_change":
      return {
        type: "changevar",
        name: String(block.getFieldValue("VAR") ?? "score"),
        value: parseExpr(block.getInputTargetBlock("VALUE")),
      };
    case "cb_if":
      return {
        type: "if",
        condition: parseExpr(block.getInputTargetBlock("CONDITION")),
        body: parseStatements(block.getInputTargetBlock("DO")),
        otherwise: [],
      };
    case "cb_if_else":
      return {
        type: "if",
        condition: parseExpr(block.getInputTargetBlock("CONDITION")),
        body: parseStatements(block.getInputTargetBlock("DO")),
        otherwise: parseStatements(block.getInputTargetBlock("ELSE")),
      };
    case "cb_repeat":
      return {
        type: "repeat",
        times: fieldNumber(block, "TIMES", 3),
        body: parseStatements(block.getInputTargetBlock("DO")),
      };
    case "cb_repeat_until":
      return {
        type: "repeatUntil",
        condition: parseExpr(block.getInputTargetBlock("CONDITION")),
        body: parseStatements(block.getInputTargetBlock("DO")),
      };
    case "cb_forever":
      return { type: "forever", body: parseStatements(block.getInputTargetBlock("DO")) };
    case "cb_stop":
      return { type: "stop" };
    case "cb_func_call":
      return { type: "call", name: String(block.getFieldValue("NAME") ?? "").trim() };
    default:
      return null;
  }
}

export function compileWorkspace(workspace: Blockly.Workspace): CompiledProgram {
  const main: Stmt[] = [];
  const onClick: Stmt[] = [];
  const onKey: Stmt[] = [];
  const functions: Record<string, Stmt[]> = {};
  const loose: Stmt[] = [];
  let sawStartHat = false;

  for (const top of workspace.getTopBlocks(true)) {
    if (top.type === "cb_event_start") {
      sawStartHat = true;
      main.push(...parseStatements(top.getNextBlock()));
    } else if (top.type === "cb_event_click") {
      onClick.push(...parseStatements(top.getNextBlock()));
    } else if (top.type === "cb_event_key") {
      onKey.push(...parseStatements(top.getNextBlock()));
    } else if (top.type === "cb_func_def") {
      const name = String(top.getFieldValue("NAME") ?? "").trim();
      if (name) functions[name] = parseStatements(top.getInputTargetBlock("DO"));
    } else {
      loose.push(...parseStatements(top));
    }
  }

  if (!sawStartHat && loose.length > 0) main.push(...loose);

  const blockCount = workspace.getAllBlocks(false).length;
  const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
  return {
    main,
    onClick,
    onKey,
    functions,
    blockCount,
    xml,
    summary: summarize([...main, ...onClick, ...onKey]),
  };
}

function summarize(statements: Stmt[]): string {
  const labels: string[] = [];
  for (const stmt of statements) {
    labels.push(stmt.type);
    if (labels.length >= 40) break;
  }
  return labels.join(", ");
}

export function workspaceToXml(workspace: Blockly.Workspace): string {
  return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
}

export function loadXml(workspace: Blockly.Workspace, xml: string): void {
  workspace.clear();
  if (!xml.trim()) return;
  try {
    const dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch {
    /* Ignore corrupt saved XML; an empty workspace is safe. */
  }
}

export function executableCount(program: CompiledProgram): number {
  return program.main.length + program.onClick.length + program.onKey.length;
}

export function defaultNumberExpr(value: number): Expr {
  return { type: "number", value };
}

export { numberFrom };

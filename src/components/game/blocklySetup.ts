import * as Blockly from "blockly";
import type { GameCommand } from "./gameEngine";

/**
 * Registers the custom CodeBloom command blocks.
 *
 * Blockly block types:
 *  - code_move       -> { type: "move" }
 *  - code_turn_left  -> { type: "turn_left" }
 *  - code_turn_right -> { type: "turn_right" }
 *  - code_repeat     -> repeats the nested statement N times
 */

Blockly.Blocks["code_move"] = {
  init(this: Blockly.Block) {
    this.setColour(120);
    this.appendDummyInput("label").appendField("Move forward");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
};

Blockly.Blocks["code_turn_left"] = {
  init(this: Blockly.Block) {
    this.setColour(35);
    this.appendDummyInput("label").appendField("Turn left");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
};

Blockly.Blocks["code_turn_right"] = {
  init(this: Blockly.Block) {
    this.setColour(35);
    this.appendDummyInput("label").appendField("Turn right");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
};

Blockly.Blocks["code_repeat"] = {
  init(this: Blockly.Block) {
    this.setColour(210);
    this.appendDummyInput("label")
      .appendField("Repeat")
      .appendField(new Blockly.FieldNumber(3, 1, 20, 1), "TIMES")
      .appendField("times");
    this.appendStatementInput("DO").appendField("do");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip("Run the blocks inside this loop a number of times.");
  },
};

function toolboxFor(blocks: string[], loopBlocks: string[]): string {
  const accepts = (name: string) => blocks.includes(name);
  const parts: string[] = [];
  if (accepts("move")) parts.push('<block type="code_move"></block>');
  if (accepts("turn_left")) parts.push('<block type="code_turn_left"></block>');
  if (accepts("turn_right")) parts.push('<block type="code_turn_right"></block>');
  if (loopBlocks.includes("repeat") || accepts("repeat")) {
    parts.push(
      '<block type="code_repeat"><field name="TIMES">3</field><statement name="DO"><block type="code_move"></block></statement></block>',
    );
  }
  return `<xml><category name="Code" colour="120">${parts.join("")}</category></xml>`;
}

export const BLOCKS_TOOLBOX_XML = toolboxFor(
  ["move", "turn_left", "turn_right"],
  [],
);

/** Build a toolbox limited to the blocks a mission actually offers. */
export function toolboxForMission(blocks: string[], loopBlocks: string[] = []): string {
  return toolboxFor(blocks, loopBlocks);
}

export const BLOCK_COMMANDS: Record<
  string,
  "move" | "turn_left" | "turn_right"
> = {
  code_move: "move",
  code_turn_left: "turn_left",
  code_turn_right: "turn_right",
};

/**
 * Walk the block workspace and flatten it into the flat command list the
 * backend mission engine understands. Repeat blocks are expanded in place so
 * the server validates exactly the program the learner built.
 */
export function commandsFromWorkspace(
  workspace: Blockly.Workspace,
  maxCommands = 100,
): GameCommand[] {
  const commands: GameCommand[] = [];

  const walk = (block: Blockly.Block | null, depth: number): void => {
    if (!block || depth > 8 || commands.length >= maxCommands) return;

    if (block.type === "code_repeat") {
      const raw = Number(block.getFieldValue("TIMES"));
      const times = Number.isFinite(raw)
        ? Math.min(20, Math.max(1, Math.floor(raw)))
        : 1;
      const inner = block.getInputTargetBlock("DO");
      for (let i = 0; i < times; i += 1) {
        walk(inner, depth + 1);
        if (commands.length >= maxCommands) break;
      }
    } else {
      const command = BLOCK_COMMANDS[block.type];
      if (command) commands.push({ type: command });
    }

    walk(block.getNextBlock(), depth);
  };

  for (const top of workspace.getTopBlocks(true)) {
    walk(top, 0);
    if (commands.length >= maxCommands) break;
  }

  return commands;
}

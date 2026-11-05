import type { CompiledProgram, Expr, Stmt } from "./blocks";

/**
 * Safe interpreter for the CodeBloom game blocks.
 *
 * There is no generated JavaScript and no eval: every statement maps to one of
 * the actions a game scene implements. Loops have hard iteration caps so a
 * "forever" block can never lock the browser.
 */

export interface GameHost {
  forward(): Promise<void>;
  backward(): Promise<void>;
  left(): Promise<void>;
  right(): Promise<void>;
  turn(dir: "left" | "right"): Promise<void>;
  jump(): Promise<void>;
  brake(): Promise<void>;
  setSpeed(value: number): Promise<void>;
  goto(x: number, y: number): Promise<void>;
  wait(seconds: number): Promise<void>;
  say(text: string): Promise<void>;
  setVisible(visible: boolean): Promise<void>;
  setSize(percent: number): Promise<void>;
  setCostume(name: string): Promise<void>;
  playSound(action: string): Promise<void>;
  getVariable(name: string): number;
  setVariable(name: string, value: number): void;
  sense(name: string, arg?: string): number | boolean;
  notice(message: string): void;
  cancelled(): boolean;
}

const STOP = Symbol("codebloom-stop");

interface Context {
  host: GameHost;
  functions: Record<string, Stmt[]>;
  depth: number;
  steps: number;
}

function guard(ctx: Context): void {
  if (ctx.host.cancelled()) throw STOP;
  ctx.steps += 1;
  if (ctx.steps > 6000) {
    ctx.host.notice("Program stopped: it ran too many instructions.");
    throw STOP;
  }
}

export async function runProgram(program: CompiledProgram, host: GameHost): Promise<void> {
  const ctx: Context = { host, functions: program.functions, depth: 0, steps: 0 };
  try {
    await execList(program.main, ctx);
  } catch (error) {
    if (error !== STOP) throw error;
  }
}

export async function runEvent(
  statements: Stmt[],
  functions: Record<string, Stmt[]>,
  host: GameHost,
): Promise<void> {
  const ctx: Context = { host, functions, depth: 0, steps: 0 };
  try {
    await execList(statements, ctx);
  } catch (error) {
    if (error !== STOP) throw error;
  }
}

async function execList(statements: Stmt[], ctx: Context): Promise<void> {
  for (const statement of statements) {
    guard(ctx);
    await exec(statement, ctx);
  }
}

async function exec(statement: Stmt, ctx: Context): Promise<void> {
  const { host } = ctx;
  switch (statement.type) {
    case "forward":
      await host.forward();
      return;
    case "backward":
      await host.backward();
      return;
    case "left":
      await host.left();
      return;
    case "right":
      await host.right();
      return;
    case "turn":
      await host.turn(statement.dir);
      return;
    case "jump":
      await host.jump();
      return;
    case "brake":
      await host.brake();
      return;
    case "speed":
      await host.setSpeed(clamp(evalNumber(statement.value, ctx), 1, 10));
      return;
    case "goto":
      await host.goto(
        clamp(Math.round(evalNumber(statement.x, ctx)), 0, 14),
        clamp(Math.round(evalNumber(statement.y, ctx)), 0, 8),
      );
      return;
    case "wait":
      await host.wait(clamp(evalNumber(statement.seconds, ctx), 0, 5));
      return;
    case "say":
      await host.say(evalString(statement.text, ctx));
      return;
    case "show":
      await host.setVisible(true);
      return;
    case "hide":
      await host.setVisible(false);
      return;
    case "size":
      await host.setSize(clamp(evalNumber(statement.value, ctx), 25, 250));
      return;
    case "costume":
      await host.setCostume(statement.name);
      return;
    case "sound":
      await host.playSound(statement.action);
      return;
    case "setvar":
      host.setVariable(statement.name, evalNumber(statement.value, ctx));
      return;
    case "changevar":
      host.setVariable(statement.name, host.getVariable(statement.name) + evalNumber(statement.value, ctx));
      return;
    case "if": {
      const condition = evalBoolean(statement.condition, ctx);
      await execList(condition ? statement.body : statement.otherwise, ctx);
      return;
    }
    case "repeat": {
      const times = clamp(Math.floor(evalNumber(statement.times, ctx)), 0, 50);
      for (let i = 0; i < times; i += 1) {
        guard(ctx);
        await execList(statement.body, ctx);
      }
      return;
    }
    case "repeatUntil": {
      let loops = 0;
      while (!evalBoolean(statement.condition, ctx)) {
        guard(ctx);
        await execList(statement.body, ctx);
        loops += 1;
        if (loops >= 200) {
          host.notice("Loop stopped after 200 attempts. Check the condition.");
          break;
        }
      }
      return;
    }
    case "forever": {
      for (let loops = 0; loops < 500; loops += 1) {
        guard(ctx);
        await execList(statement.body, ctx);
        if (host.cancelled()) throw STOP;
      }
      host.notice("Forever loop safely stopped after 500 repeats.");
      return;
    }
    case "stop":
      throw STOP;
    case "call": {
      const body = ctx.functions[statement.name];
      if (!body) {
        host.notice(`No function named "${statement.name}" was defined.`);
        return;
      }
      if (ctx.depth >= 12) {
        host.notice("Function calls got too deep and were stopped.");
        return;
      }
      ctx.depth += 1;
      await execList(body, ctx);
      ctx.depth -= 1;
      return;
    }
    default:
      return;
  }
}

function evalValue(expr: Expr, ctx: Context): number | string | boolean {
  switch (expr.type) {
    case "number":
      return expr.value;
    case "text":
      return expr.value;
    case "variable":
      return ctx.host.getVariable(expr.name);
    case "sense": {
      const value = ctx.host.sense(expr.name, expr.arg);
      return value;
    }
    case "binary": {
      const a = evalNumber(expr.left, ctx);
      const b = evalNumber(expr.right, ctx);
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
          return 0;
      }
    }
    case "compare": {
      const a = evalValue(expr.left, ctx);
      const b = evalValue(expr.right, ctx);
      const bothNumbers = typeof a !== "string" && typeof b !== "string";
      const left = bothNumbers ? Number(a) : String(a);
      const right = bothNumbers ? Number(b) : String(b);
      switch (expr.op) {
        case "=":
          return left === right;
        case "!=":
          return left !== right;
        case "<":
          return left < right;
        case ">":
          return left > right;
        case "<=":
          return left <= right;
        case ">=":
          return left >= right;
        default:
          return false;
      }
    }
    case "logic": {
      const a = evalBoolean(expr.left, ctx);
      return expr.op === "and" ? a && evalBoolean(expr.right, ctx) : a || evalBoolean(expr.right, ctx);
    }
    case "not":
      return !evalBoolean(expr.value, ctx);
    case "random": {
      const min = Math.ceil(evalNumber(expr.min, ctx));
      const max = Math.floor(evalNumber(expr.max, ctx));
      if (max < min) return min;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    default:
      return 0;
  }
}

function evalNumber(expr: Expr, ctx: Context): number {
  const value = evalValue(expr, ctx);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function evalBoolean(expr: Expr, ctx: Context): boolean {
  const value = evalValue(expr, ctx);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return value.length > 0;
}

function evalString(expr: Expr, ctx: Context): string {
  const value = evalValue(expr, ctx);
  return typeof value === "string" ? value : String(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

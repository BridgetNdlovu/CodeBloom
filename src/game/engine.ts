import { assetLocomotion } from "./assets";
import { backgroundList, getBackground } from "./backgrounds";
import { playSound, stopAllSounds, type SoundName } from "./sound";
import type {
  AnimationName,
  BlockNode,
  GameStatus,
  RuntimeSprite,
  RuntimeState,
  Scene,
  SpriteRole,
} from "./types";

export interface RunResult {
  status: Exclude<GameStatus, "idle" | "running"> | "stopped";
  score: number;
  message: string;
}

export interface RuntimeOptions {
  sound?: boolean;
  variables?: Array<{ name: string; value: number | string }>;
  onEnd?: (result: RunResult) => void;
}

type Value = number | string | boolean;

interface TimerHandle {
  id: number;
  resolve: () => void;
}

class StopScript extends Error {
  constructor() {
    super("stop-script");
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const num = (value: Value | undefined, fallback = 0) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function parseScene(json: string | null | undefined): Scene | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Partial<Scene> & {
      sprites?: Array<Partial<RuntimeSprite>>;
      rules?: Partial<Scene["rules"]>;
    };
    if (!raw || !Array.isArray(raw.sprites)) return null;
    const sprites: RuntimeSprite[] = raw.sprites.map((s, index) => ({
      id: s.id ?? `sprite-${index + 1}`,
      asset: s.asset ?? "sparkle",
      name: s.name ?? `Sprite ${index + 1}`,
      role: (s.role as SpriteRole) ?? "decoration",
      x: num(s.x as number, 200),
      y: num(s.y as number, 300),
      size: num(s.size as number, 1),
      layer: num(s.layer as number, 3),
      direction: num(s.direction as number, 0),
      animation: (s.animation as AnimationName) ?? "idle",
      costume: num(s.costume as number, 0),
      flip: Boolean(s.flip),
      visible: s.visible !== false,
    }));
    return {
      format: "codebloom.scene.v1",
      stage: {
        width: num(raw.stage?.width as number, 960),
        height: num(raw.stage?.height as number, 540),
      },
      background: raw.background ?? "garden-day",
      sprites,
      rules: {
        win: raw.rules?.win ?? { type: "reach", spriteId: "hero", targetId: "goal" },
        lives: num(raw.rules?.lives as number, 3),
        timeLimit:
          raw.rules?.timeLimit === null || raw.rules?.timeLimit === undefined
            ? null
            : num(raw.rules.timeLimit as number, 60),
      },
    };
  } catch {
    return null;
  }
}

function initialState(scene: Scene, variables: Array<{ name: string; value: number | string }>): RuntimeState {
  return {
    sprites: scene.sprites.map((s) => ({
      ...s,
      collected: false,
      opacity: 1,
      speaking: undefined,
      thinking: undefined,
      effect: 0,
    })),
    background: scene.background,
    score: 0,
    health: scene.rules.lives,
    timeLeft: scene.rules.timeLimit,
    status: "idle",
    message: "",
    variables: Object.fromEntries(variables.map((v) => [v.name, v.value])),
    level: 1,
    collected: 0,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function keyMatches(want: string, event: KeyboardEvent) {
  if (!want) return false;
  if (want === "Space") return event.code === "Space" || event.key === " ";
  if (want.length === 1) return event.key.toLowerCase() === want.toLowerCase();
  return event.key === want;
}

function friendlyKey(key: string) {
  if (key === "Space") return "the space bar";
  return key.replace("Arrow", "").toLowerCase();
}

export class SceneRuntime {
  readonly scene: Scene;
  private state: RuntimeState;
  private listeners = new Set<(state: RuntimeState) => void>();
  private options: RuntimeOptions;
  private soundOn: boolean;

  private aborted = true;
  private disposed = false;
  private timers = new Set<TimerHandle>();
  private keys = new Set<string>();
  private mouse = { x: 480, y: 270 };
  private mouseDown = false;
  private startedAt = 0;
  private timerRunning = true;
  private initialCollectibleCount = 0;
  private checkpoint: { x: number; y: number; score: number; health: number } | null = null;
  private lastObstacle = 0;
  private keyDownListener: ((event: KeyboardEvent) => void) | null = null;
  private keyUpListener: ((event: KeyboardEvent) => void) | null = null;
  private inFlightKeys = new Set<BlockNode>();
  private inFlightClicks = new Set<BlockNode>();
  private spawned = 0;
  private runToken = 0;

  constructor(scene: Scene, options: RuntimeOptions = {}) {
    this.scene = scene;
    this.options = options;
    this.soundOn = options.sound ?? true;
    this.state = initialState(scene, options.variables ?? []);
    this.initialCollectibleCount = scene.sprites.filter((s) => s.role === "collectible").length;
  }

  subscribe(listener: (state: RuntimeState) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  getState(): RuntimeState {
    return this.snapshot();
  }

  setSoundEnabled(enabled: boolean) {
    this.soundOn = enabled;
  }

  setMouse(x: number, y: number, down = this.mouseDown) {
    this.mouse = { x, y };
    this.mouseDown = down;
  }

  private snapshot(): RuntimeState {
    return {
      ...this.state,
      sprites: this.state.sprites.map((s) => ({ ...s })),
      variables: { ...this.state.variables },
    };
  }

  private emit() {
    if (this.disposed) return;
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private sound(name: SoundName) {
    playSound(name, this.soundOn);
  }

  private actor(): RuntimeSprite | undefined {
    return (
      this.state.sprites.find((s) => s.role === "player" && s.visible && !s.collected) ??
      this.state.sprites.find((s) => s.visible && !s.collected)
    );
  }

  private frameWidth() {
    return this.scene.stage.width;
  }

  private frameHeight() {
    return this.scene.stage.height;
  }

  private hit(a: RuntimeSprite, b: RuntimeSprite) {
    return distance(a, b) < 48 * ((a.size + b.size) / 2) + 8;
  }

  private touching(role: string): boolean {
    const actor = this.actor();
    if (!actor) return false;
    return this.state.sprites.some(
      (s) =>
        s !== actor &&
        s.visible &&
        !s.collected &&
        (s.role === role || s.asset === role) &&
        this.hit(actor, s),
    );
  }

  private wait(ms: number): Promise<void> {
    if (this.aborted) return Promise.resolve();
    return new Promise((resolve) => {
      const handle: TimerHandle = { id: 0, resolve: () => undefined };
      handle.id = window.setTimeout(() => {
        this.timers.delete(handle);
        resolve();
      }, Math.max(0, ms));
      handle.resolve = resolve;
      this.timers.add(handle);
    });
  }

  private later(ms: number, action: () => void) {
    if (this.aborted) return;
    const handle: TimerHandle = { id: 0, resolve: () => undefined };
    handle.id = window.setTimeout(() => {
      this.timers.delete(handle);
      action();
    }, ms);
    this.timers.add(handle);
  }

  private clearTimers() {
    this.timers.forEach((handle) => {
      window.clearTimeout(handle.id);
      handle.resolve();
    });
    this.timers.clear();
  }

  private detachKeys() {
    if (this.keyDownListener) window.removeEventListener("keydown", this.keyDownListener);
    if (this.keyUpListener) window.removeEventListener("keyup", this.keyUpListener);
    this.keyDownListener = null;
    this.keyUpListener = null;
  }

  reset() {
    this.runToken += 1;
    this.aborted = true;
    this.clearTimers();
    this.detachKeys();
    this.keys.clear();
    this.checkpoint = null;
    this.state = initialState(this.scene, this.options.variables ?? []);
    this.initialCollectibleCount = this.scene.sprites.filter((s) => s.role === "collectible").length;
    this.emit();
  }

  stop() {
    this.runToken += 1;
    this.aborted = true;
    this.clearTimers();
    this.detachKeys();
    stopAllSounds();
    this.inFlightKeys.clear();
    this.inFlightClicks.clear();
    if (this.state.status === "running") {
      this.state = { ...this.state, status: "idle", message: "Stopped" };
    }
    this.emit();
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.listeners.clear();
  }

  private finish(status: "won" | "lost", message: string) {
    if (this.state.status === "won" || this.state.status === "lost") return;
    this.runToken += 1;
    this.aborted = true;
    this.clearTimers();
    this.detachKeys();
    this.state = { ...this.state, status, message };
    this.sound(status === "won" ? "win" : "lose");
    this.emit();
    this.options.onEnd?.({ status, score: this.state.score, message });
  }

  private resetToStart(actor: RuntimeSprite) {
    const checkpoint = this.checkpoint;
    const start = checkpoint ?? {
      x: this.scene.sprites.find((s) => s.id === actor.id)?.x ?? 120,
      y: this.scene.sprites.find((s) => s.id === actor.id)?.y ?? 420,
      score: this.state.score,
      health: this.state.health,
    };
    actor.x = start.x;
    actor.y = start.y;
    actor.direction = 0;
    this.state.score = start.score;
    this.state.health = start.health;
    this.state.message = "Ouch! Back to the start.";
    this.sound("lose");
    this.emit();
  }

  private collect(sprite: RuntimeSprite, award = true) {
    if (sprite.collected) return;
    sprite.collected = true;
    sprite.visible = false;
    this.state.collected += 1;
    if (award) this.addScore(50, false);
    this.sound("coin");
    this.emit();
    this.checkWin();
  }

  private addScore(amount: number, play = true) {
    this.state.score = Math.max(0, this.state.score + Math.round(amount));
    if (play) this.sound(amount >= 0 ? "coin" : "beep");
    this.emit();
    this.checkWin();
  }

  private changeHealth(amount: number) {
    this.state.health = clamp(this.state.health + Math.round(amount), 0, 99);
    this.emit();
    if (this.state.health <= 0) this.finish("lost", "No hearts left. Press Reset and try again.");
  }

  private checkWin() {
    if (this.state.status !== "running") return;
    const actor = this.actor();
    if (!actor) return;
    const rule = this.scene.rules.win;

    if (rule.type === "collect_all") {
      const remaining = this.state.sprites.filter(
        (s) => s.role === "collectible" && s.visible && !s.collected,
      ).length;
      if (this.initialCollectibleCount > 0 && remaining === 0) {
        this.finish("won", `All collectibles found! Score ${this.state.score}.`);
      }
      return;
    }

    if (rule.type === "score") {
      if ((rule.targetScore ?? 250) > 0 && this.state.score >= (rule.targetScore ?? 250)) {
        this.finish("won", `Target score reached! Score ${this.state.score}.`);
      }
      return;
    }

    const target =
      this.state.sprites.find((s) => s.id === rule.targetId) ??
      this.state.sprites.find((s) => s.role === "goal" && s.visible);
    if (target && target.visible && !target.collected && this.hit(actor, target)) {
      this.finish("won", `Goal reached! Score ${this.state.score}.`);
    }
  }

  private checkInteractions() {
    if (this.state.status !== "running") return;
    const actor = this.actor();
    if (!actor) return;
    for (const sprite of this.state.sprites) {
      if (sprite === actor || !sprite.visible || sprite.collected) continue;
      if (sprite.role === "collectible" && this.hit(actor, sprite)) {
        this.collect(sprite);
        if (this.state.status !== "running") return;
      }
      if (sprite.role === "obstacle" && this.hit(actor, sprite)) {
        const now = Date.now();
        if (now - this.lastObstacle < 700) continue;
        this.lastObstacle = now;
        this.state.health = Math.max(0, this.state.health - 1);
        this.emit();
        if (this.state.health <= 0) {
          this.finish("lost", "No hearts left. Press Reset and try again.");
          return;
        }
        this.resetToStart(actor);
        return;
      }
    }
    this.checkWin();
  }

  private nudge(dx: number, dy: number) {
    if (this.state.status !== "running") return;
    const actor = this.actor();
    if (!actor) return;
    actor.x = clamp(actor.x + dx, 16, this.frameWidth() - 16);
    actor.y = clamp(actor.y + dy, 16, this.frameHeight() - 16);
    actor.animation = assetLocomotion(actor.asset);
    this.emit();
    this.checkInteractions();
    this.later(160, () => {
      if (actor.animation === assetLocomotion(actor.asset)) actor.animation = "idle";
      this.emit();
    });
  }

  private handleKey(event: KeyboardEvent, handlers: BlockNode[]) {
    this.keys.add(event.key);
    const matches = handlers.filter((handler) => keyMatches(handler.fields.KEY ?? "", event));
    if (matches.length > 0) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }
      matches.forEach((handler) => {
        if (this.inFlightKeys.has(handler)) return;
        this.inFlightKeys.add(handler);
        void this.execSeq(handler.body)
          .catch(() => undefined)
          .finally(() => this.inFlightKeys.delete(handler));
      });
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.nudge(28, 0);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.nudge(-28, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.nudge(0, -28);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      this.nudge(0, 28);
    }
  }

  clickSprite(id: string, handlers: BlockNode[]) {
    if (this.state.status !== "running") return;
    const matches = handlers.filter((handler) => {
      const target = handler.fields.TARGET ?? "any";
      return target === "any" || target === id || target === "this";
    });
    matches.forEach((handler) => {
      if (this.inFlightClicks.has(handler)) return;
      this.inFlightClicks.add(handler);
      void this.execSeq(handler.body)
        .catch(() => undefined)
        .finally(() => this.inFlightClicks.delete(handler));
    });
  }

  async run(program: BlockNode[]): Promise<RunResult> {
    this.reset();
    const token = ++this.runToken;
    this.aborted = false;
    this.startedAt = Date.now();
    this.timerRunning = true;
    this.state = { ...this.state, status: "running", message: "Running" };
    this.emit();

    const starts: BlockNode[] = [];
    const keyHandlers: BlockNode[] = [];
    const clickHandlers: BlockNode[] = [];

    for (const node of program) {
      if (node.type === "event_key") keyHandlers.push(node);
      else if (node.type === "event_click") clickHandlers.push(node);
      else if (node.type === "event_start") starts.push(node);
      else {
        // Friendly behaviour: orphan stacks run when the game starts.
        starts.push({ type: "event_start", fields: {}, inputs: {}, body: node });
      }
    }

    if (starts.length === 0 && keyHandlers.length === 0 && clickHandlers.length === 0) {
      this.state = { ...this.state, status: "idle", message: "Add a When game starts block, then press Run." };
      this.emit();
      return { status: "stopped", score: 0, message: this.state.message };
    }

    this.keyDownListener = (event) => {
      if (token !== this.runToken) return;
      if (this.state.status === "running") this.handleKey(event, keyHandlers);
    };
    this.keyUpListener = (event) => {
      this.keys.delete(event.key);
    };
    window.addEventListener("keydown", this.keyDownListener);
    window.addEventListener("keyup", this.keyUpListener);

    if (this.scene.rules.timeLimit !== null) {
      void this.timerLoop(token);
    }

    const runStarters = starts.map((handler) =>
      this.execSeq(handler.body).catch((error) => {
        if (!(error instanceof StopScript)) throw error;
      }),
    );

    await Promise.all(runStarters);
    if (token !== this.runToken) {
      return {
        status: this.state.status === "idle" || this.state.status === "running" ? "stopped" : this.state.status,
        score: this.state.score,
        message: this.state.message,
      };
    }
    if (this.state.status === "running") {
      this.state = {
        ...this.state,
        message:
          keyHandlers.length > 0
            ? `Waiting for keys (${keyHandlers.map((h) => friendlyKey(h.fields.KEY ?? "")).join(", ")}). Arrow keys also nudge the hero.`
            : "Waiting for events. Arrow keys nudge the hero; press Stop when you are done.",
      };
      this.emit();
      // Keep the session alive so key, click and timer events can still fire.
      await new Promise<void>((resolve) => {
        const check = window.setInterval(() => {
          if (token !== this.runToken || this.aborted || this.state.status !== "running") {
            window.clearInterval(check);
            resolve();
          }
        }, 120);
      });
    }
    return {
      status: this.state.status === "idle" || this.state.status === "running" ? "stopped" : this.state.status,
      score: this.state.score,
      message: this.state.message,
    };
  }

  private async timerLoop(token: number) {
    while (!this.aborted && token === this.runToken && this.state.status === "running") {
      await this.wait(1000);
      if (this.aborted || token !== this.runToken || this.state.status !== "running") return;
      if (!this.timerRunning || this.state.timeLeft === null) continue;
      const next = this.state.timeLeft - 1;
      this.state = { ...this.state, timeLeft: next };
      if (next <= 0) {
        this.state = { ...this.state, timeLeft: 0 };
        this.finish("lost", "Time is up! Press Reset to try again.");
        return;
      }
      if (next <= 5) this.sound("beep");
      this.emit();
    }
  }

  private async execSeq(first: BlockNode | undefined): Promise<void> {
    let node = first;
    let guard = 0;
    while (node && !this.aborted && this.state.status === "running" && guard < 4000) {
      guard += 1;
      await this.execNode(node);
      node = node.next;
    }
  }

  private evalInput(value: BlockNode | string | number | undefined): Value {
    if (value === undefined) return 0;
    if (typeof value === "string" || typeof value === "number") return value;
    return this.evalReporter(value);
  }

  private evalReporter(node: BlockNode): Value {
    const f = node.fields;
    const input = (name: string) => this.evalInput(node.inputs[name]);
    switch (node.type) {
      case "math_number":
        return num(f.NUM);
      case "text":
        return f.TEXT ?? "";
      case "variables_get":
        return this.state.variables[f.VAR ?? "score"] ?? 0;
      case "op_add":
        return num(input("A")) + num(input("B"));
      case "op_sub":
        return num(input("A")) - num(input("B"));
      case "op_mul":
        return num(input("A")) * num(input("B"));
      case "op_div": {
        const b = num(input("B"), 1);
        return b === 0 ? 0 : num(input("A")) / b;
      }
      case "op_gt":
        return num(input("A")) > num(input("B"));
      case "op_lt":
        return num(input("A")) < num(input("B"));
      case "op_eq":
        return String(input("A")) === String(input("B"));
      case "op_and":
        return Boolean(input("A")) && Boolean(input("B"));
      case "op_or":
        return Boolean(input("A")) || Boolean(input("B"));
      case "op_not":
        return !input("A");
      case "op_random": {
        const from = Math.round(num(input("FROM"), 1));
        const to = Math.round(num(input("TO"), 10));
        const low = Math.min(from, to);
        const high = Math.max(from, to);
        return Math.floor(Math.random() * (high - low + 1)) + low;
      }
      case "op_join":
        return `${input("A")}${input("B")}`;
      case "sensing_touching": {
        const what = f.WHAT ?? "goal";
        if (what === "edge") {
          const actor = this.actor();
          if (!actor) return false;
          return (
            actor.x < 40 ||
            actor.y < 40 ||
            actor.x > this.frameWidth() - 40 ||
            actor.y > this.frameHeight() - 40
          );
        }
        return this.touching(what);
      }
      case "sensing_key":
        return this.keys.has(f.KEY === "Space" ? " " : f.KEY ?? "");
      case "sensing_mouse_down":
        return this.mouseDown;
      case "sensing_mouse_x":
        return Math.round((this.mouse.x / this.frameWidth()) * 100);
      case "sensing_mouse_y":
        return Math.round((this.mouse.y / this.frameHeight()) * 100);
      case "sensing_distance": {
        const actor = this.actor();
        if (!actor) return 0;
        const what = f.WHAT ?? "goal";
        const target = this.state.sprites.find(
          (s) => s.visible && !s.collected && (s.role === what || s.asset === what),
        );
        return target ? Math.round(distance(actor, target)) : 0;
      }
      case "sensing_timer":
        return this.state.timeLeft ?? Math.round((Date.now() - this.startedAt) / 1000);
      case "sensing_score":
        return this.state.score;
      case "sensing_health":
        return this.state.health;
      case "sensing_collected":
        return this.state.collected;
      default:
        return 0;
    }
  }

  private async execNode(node: BlockNode): Promise<void> {
    if (this.aborted || this.state.status !== "running") return;
    const f = node.fields;
    const actor = this.actor();

    switch (node.type) {
      case "motion_move": {
        if (!actor) return;
        const steps = num(f.STEPS, 60);
        actor.animation = assetLocomotion(actor.asset);
        const rad = (actor.direction * Math.PI) / 180;
        actor.x = clamp(actor.x + Math.cos(rad) * steps, 14, this.frameWidth() - 14);
        actor.y = clamp(actor.y - Math.sin(rad) * steps, 14, this.frameHeight() - 14);
        this.sound("move");
        this.emit();
        this.checkInteractions();
        await this.wait(120);
        if (actor.animation === assetLocomotion(actor.asset)) actor.animation = "idle";
        this.emit();
        return;
      }
      case "motion_turn_left":
      case "motion_turn_right": {
        if (!actor) return;
        const degrees = num(f.DEGREES, 90);
        actor.direction =
          node.type === "motion_turn_left"
            ? (actor.direction + degrees + 360) % 360
            : (actor.direction - degrees + 360) % 360;
        this.sound("click");
        this.emit();
        await this.wait(80);
        return;
      }
      case "motion_point": {
        if (!actor) return;
        actor.direction = ((num(f.DIRECTION, 90) % 360) + 360) % 360;
        this.emit();
        await this.wait(80);
        return;
      }
      case "motion_goto": {
        if (!actor) return;
        actor.x = clamp(num(f.X, 480), 14, this.frameWidth() - 14);
        actor.y = clamp(num(f.Y, 270), 14, this.frameHeight() - 14);
        this.emit();
        this.checkInteractions();
        await this.wait(100);
        return;
      }
      case "motion_change_x": {
        if (!actor) return;
        actor.x = clamp(actor.x + num(f.CHANGE, 30), 14, this.frameWidth() - 14);
        this.emit();
        this.checkInteractions();
        await this.wait(100);
        return;
      }
      case "motion_change_y": {
        if (!actor) return;
        actor.y = clamp(actor.y + num(f.CHANGE, 30), 14, this.frameHeight() - 14);
        this.emit();
        this.checkInteractions();
        await this.wait(100);
        return;
      }
      case "motion_glide": {
        if (!actor) return;
        const fromX = actor.x;
        const fromY = actor.y;
        const toX = clamp(num(f.X, 480), 14, this.frameWidth() - 14);
        const toY = clamp(num(f.Y, 270), 14, this.frameHeight() - 14);
        const seconds = clamp(num(f.SECONDS, 1), 0.1, 10);
        const steps = Math.max(4, Math.round(seconds * 20));
        actor.animation = assetLocomotion(actor.asset);
        this.sound("move");
        for (let i = 1; i <= steps; i += 1) {
          if (this.aborted || this.state.status !== "running") break;
          const t = i / steps;
          actor.x = fromX + (toX - fromX) * t;
          actor.y = fromY + (toY - fromY) * t;
          this.emit();
          if (i % 4 === 0) this.checkInteractions();
          await this.wait(Math.round((seconds * 1000) / steps));
        }
        actor.animation = "idle";
        this.emit();
        return;
      }
      case "motion_jump": {
        if (!actor) return;
        const startY = actor.y;
        actor.animation = "jump";
        this.sound("jump");
        for (let i = 1; i <= 8; i += 1) {
          if (this.aborted || this.state.status !== "running") break;
          actor.y = clamp(startY - Math.sin((i / 8) * Math.PI) * 70, 14, this.frameHeight() - 14);
          this.emit();
          this.checkInteractions();
          await this.wait(45);
        }
        actor.y = startY;
        actor.animation = "idle";
        this.emit();
        return;
      }
      case "motion_bounce": {
        if (!actor) return;
        const w = this.frameWidth();
        const h = this.frameHeight();
        let bounced = false;
        if (actor.x < 40 || actor.x > w - 40) {
          actor.direction = (180 - actor.direction + 360) % 360;
          actor.x = clamp(actor.x, 40, w - 40);
          bounced = true;
        }
        if (actor.y < 40 || actor.y > h - 40) {
          actor.direction = (360 - actor.direction) % 360;
          actor.y = clamp(actor.y, 40, h - 40);
          bounced = true;
        }
        if (bounced) {
          this.sound("pop");
          this.emit();
          this.checkInteractions();
        }
        await this.wait(80);
        return;
      }
      case "looks_say":
      case "looks_think": {
        if (!actor) return;
        const text = String(f.TEXT ?? "Hello!").slice(0, 120);
        if (node.type === "looks_say") actor.speaking = text;
        else actor.thinking = text;
        if (actor.animation !== "celebrate") actor.animation = "talk";
        this.emit();
        await this.wait(1700);
        if (actor.speaking === text) actor.speaking = undefined;
        if (actor.thinking === text) actor.thinking = undefined;
        actor.animation = "idle";
        this.emit();
        return;
      }
      case "looks_costume": {
        if (!actor) return;
        actor.costume = Math.max(0, Math.round(num(f.COSTUME, 1)) - 1);
        this.emit();
        await this.wait(90);
        return;
      }
      case "looks_size": {
        if (!actor) return;
        actor.size = clamp(num(f.SIZE, 100) / 100, 0.2, 3);
        this.emit();
        await this.wait(90);
        return;
      }
      case "looks_change_size": {
        if (!actor) return;
        actor.size = clamp(actor.size + num(f.CHANGE, 10) / 100, 0.2, 3);
        this.emit();
        await this.wait(90);
        return;
      }
      case "looks_show":
      case "looks_hide": {
        if (!actor) return;
        actor.visible = node.type === "looks_show";
        this.emit();
        await this.wait(90);
        return;
      }
      case "looks_effect": {
        if (!actor) return;
        const change = num(f.CHANGE, 25);
        if (f.EFFECT === "ghost") {
          actor.opacity = clamp((actor.opacity ?? 1) - change / 100, 0.1, 1);
        } else {
          actor.effect = ((actor.effect ?? 0) + change) % 360;
        }
        this.emit();
        await this.wait(90);
        return;
      }
      case "looks_background": {
        const next = String(f.BACKGROUND ?? "garden-day");
        this.state = { ...this.state, background: getBackground(next).key };
        this.emit();
        await this.wait(150);
        return;
      }
      case "looks_next_background": {
        const list = backgroundList();
        const index = list.findIndex((b) => b.key === this.state.background);
        this.state = { ...this.state, background: list[(index + 1) % list.length].key };
        this.emit();
        await this.wait(150);
        return;
      }
      case "sound_play": {
        const choice = String(f.SOUND ?? "pop");
        const allowed: SoundName[] = ["pop", "coin", "jump", "beep", "power", "click"];
        this.sound(allowed.includes(choice as SoundName) ? (choice as SoundName) : "pop");
        await this.wait(120);
        return;
      }
      case "sound_stop": {
        stopAllSounds();
        await this.wait(80);
        return;
      }
      case "sound_volume": {
        this.soundOn = num(f.VOLUME, 100) > 0;
        this.emit();
        await this.wait(60);
        return;
      }
      case "control_wait": {
        await this.wait(clamp(num(f.SECONDS, 1), 0, 10) * 1000);
        return;
      }
      case "control_repeat": {
        const times = clamp(Math.round(num(f.TIMES, 4)), 1, 1000);
        for (let i = 0; i < times; i += 1) {
          if (this.aborted || this.state.status !== "running") break;
          await this.execSeq(node.body);
          await this.wait(10);
        }
        return;
      }
      case "control_forever": {
        while (!this.aborted && this.state.status === "running") {
          await this.execSeq(node.body);
          await this.wait(30);
        }
        return;
      }
      case "control_repeat_until": {
        let guard = 0;
        while (
          !this.aborted &&
          this.state.status === "running" &&
          !this.evalInput(node.inputs.CONDITION) &&
          guard < 1000
        ) {
          guard += 1;
          await this.execSeq(node.body);
          await this.wait(20);
        }
        return;
      }
      case "control_if": {
        if (this.evalInput(node.inputs.CONDITION)) {
          await this.execSeq(node.body);
        }
        return;
      }
      case "control_if_else": {
        if (this.evalInput(node.inputs.CONDITION)) {
          await this.execSeq(node.body);
        } else {
          await this.execSeq(node.body2);
        }
        return;
      }
      case "control_stop": {
        if (f.MODE === "all") {
          this.stop();
          throw new StopScript();
        }
        throw new StopScript();
      }
      case "game_score": {
        this.addScore(num(f.CHANGE, 10));
        await this.wait(60);
        return;
      }
      case "game_health": {
        this.changeHealth(num(f.CHANGE, -1));
        await this.wait(60);
        return;
      }
      case "game_collect": {
        if (!actor) return;
        const nearest = this.state.sprites
          .filter((s) => s.role === "collectible" && s.visible && !s.collected)
          .sort((a, b) => distance(actor, a) - distance(actor, b))[0];
        if (nearest) this.collect(nearest);
        await this.wait(90);
        return;
      }
      case "game_spawn": {
        this.spawned += 1;
        const asset = String(f.ASSET ?? "coin");
        const id = `spawn-${Date.now()}-${this.spawned}`;
        this.state.sprites.push({
          id,
          asset,
          name: "Bonus",
          role: "collectible",
          x: 90 + Math.random() * (this.frameWidth() - 180),
          y: 90 + Math.random() * (this.frameHeight() - 220),
          size: 0.55,
          layer: 5,
          direction: 0,
          animation: "idle",
          costume: 0,
          flip: false,
          visible: true,
          collected: false,
        });
        this.sound("pop");
        this.emit();
        await this.wait(90);
        return;
      }
      case "game_start_timer": {
        this.state = {
          ...this.state,
          timeLeft: clamp(num(f.SECONDS, 60), 1, 600),
        };
        this.timerRunning = true;
        this.emit();
        await this.wait(60);
        return;
      }
      case "game_stop_timer": {
        this.timerRunning = false;
        this.emit();
        await this.wait(60);
        return;
      }
      case "game_win": {
        this.finish("won", String(f.TEXT ?? "You win!"));
        return;
      }
      case "game_lose": {
        this.finish("lost", String(f.TEXT ?? "Game over. Try again!"));
        return;
      }
      case "game_restart": {
        this.state = initialState(this.scene, this.options.variables ?? []);
        this.state = { ...this.state, status: "running", message: "Restarted" };
        this.startedAt = Date.now();
        this.timerRunning = true;
        this.emit();
        await this.wait(120);
        return;
      }
      case "game_checkpoint": {
        if (!actor) return;
        this.checkpoint = {
          x: actor.x,
          y: actor.y,
          score: this.state.score,
          health: this.state.health,
        };
        this.state = { ...this.state, message: "Checkpoint saved." };
        this.sound("power");
        this.emit();
        await this.wait(120);
        return;
      }
      case "game_next_level": {
        const list = backgroundList();
        const index = list.findIndex((b) => b.key === this.state.background);
        this.state = {
          ...this.state,
          level: this.state.level + 1,
          background: list[(index + 1) % list.length].key,
          message: `Level ${this.state.level + 1}`,
        };
        this.sound("power");
        this.emit();
        await this.wait(150);
        return;
      }
      case "variables_set": {
        const name = String(f.VAR ?? "score");
        const value = this.evalInput(node.inputs.VALUE);
        this.state.variables[name] =
          typeof value === "boolean" ? Number(value) : value;
        this.emit();
        await this.wait(60);
        return;
      }
      case "variables_change": {
        const name = String(f.VAR ?? "score");
        const current = Number(this.state.variables[name] ?? 0);
        this.state.variables[name] = current + num(this.evalInput(node.inputs.VALUE), 1);
        this.emit();
        await this.wait(60);
        return;
      }
      default:
        return;
    }
  }

  /** Used by the game player to seed a timer before Run. */
  get elapsedSeconds() {
    return Math.round((Date.now() - this.startedAt) / 1000);
  }
}

/* Serpentine — snake simulation: fixed-step movement, scoring and effects */

import { levelForProgress, SNAKE_COLORS, type SnakeColor } from "./worlds.ts";

export type Vec = { x: number; y: number };
export type Status = "ready" | "running" | "paused" | "over" | "won";
export type Difficulty = "chill" | "classic" | "turbo";

export const GRID = 21;

export interface DiffConfig {
  label: string;
  tag: string;
  blurb: string;
  interval: number; // ms per step at start
  min: number; // fastest allowed step
  ramp: number; // ms shaved off per apple
  mult: number; // score multiplier
}

export const DIFFICULTIES: Record<Difficulty, DiffConfig> = {
  chill: {
    label: "Garden",
    tag: "CHILL",
    blurb: "A slow slither through the hedges.",
    interval: 165,
    min: 105,
    ramp: 2.1,
    mult: 1,
  },
  classic: {
    label: "Classic",
    tag: "CLASSIC",
    blurb: "The arcade pace you remember.",
    interval: 118,
    min: 72,
    ramp: 2.3,
    mult: 2,
  },
  turbo: {
    label: "Turbo",
    tag: "TURBO",
    blurb: "Reflexes required. No mercy.",
    interval: 84,
    min: 46,
    ramp: 1.7,
    mult: 3,
  },
};

export interface HudData {
  status: Status;
  score: number;
  apples: number;
  length: number;
  level: number;
  tps: number; // ticks per second
}

export type GameEvent = "eat" | "die" | "start" | "pause" | "resume" | "win" | "reset" | "level";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}

const OPPOSITE = (a: Vec, b: Vec) => a.x === -b.x && a.y === -b.y;
const SAME = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;
const BURST_COLORS = ["#ffc857", "#ff6354", "#a8ef4c", "#fff3d6"];

export class SnakeEngine {
  difficulty: Difficulty;

  snake: Vec[] = [];
  prev: Vec[] = [];
  dir: Vec = { x: 1, y: 0 };
  queue: Vec[] = [];
  food: Vec | null = { x: 5, y: 5 };

  status: Status = "ready";
  score = 0;
  apples = 0;
  interval = 118;
  acc = 0;

  particles: Particle[] = [];
  floaters: Floater[] = [];
  shake = 0;
  flash = 0;
  foodPhase = Math.random() * Math.PI * 2;

  onHud?: (h: HudData) => void;
  onEvent?: (e: GameEvent) => void;

  reducedMotion = false;
  snakeColor: SnakeColor;

  get level(): number { return levelForProgress(this.score, this.snake.length); }

  constructor(difficulty: Difficulty, snakeColor: SnakeColor = "lime") {
    this.snakeColor = snakeColor;
    this.difficulty = difficulty;
    this.reset();
  }

  /* ---------------- state ---------------- */

  reset() {
    const cfg = DIFFICULTIES[this.difficulty];
    const m = Math.floor(GRID / 2);
    this.snake = [
      { x: m, y: m },
      { x: m - 1, y: m },
      { x: m - 2, y: m },
    ];
    this.prev = this.snake.map((s) => ({ ...s }));
    this.dir = { x: 1, y: 0 };
    this.queue = [];
    this.score = 0;
    this.apples = 0;
    this.interval = cfg.interval;
    this.acc = 0;
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.flash = 0;
    this.status = "ready";
    this.placeFood();
    this.onEvent?.("reset");
    this.pushHud();
  }

  setDifficulty(d: Difficulty) {
    this.difficulty = d;
    this.reset();
  }

  start() {
    if (this.status === "running") return;
    if (this.status === "paused") {
      this.resume();
      return;
    }
    if (this.status === "over" || this.status === "won") this.reset();
    this.status = "running";
    this.acc = 0;
    this.onEvent?.("start");
    this.pushHud();
  }

  pause() {
    if (this.status !== "running") return;
    this.status = "paused";
    this.onEvent?.("pause");
    this.pushHud();
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "running";
    this.onEvent?.("resume");
    this.pushHud();
  }

  togglePause() {
    if (this.status === "running") this.pause();
    else if (this.status === "paused") this.resume();
    else this.start();
  }

  restart() {
    this.reset();
    this.start();
  }

  /** Queue a direction; silently ignored if it would reverse the snake. */
  setDirection(d: Vec) {
    if (Math.abs(d.x) + Math.abs(d.y) !== 1 || !Number.isInteger(d.x) || !Number.isInteger(d.y)) return;
    const ref = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (OPPOSITE(d, ref) || SAME(d, ref)) return;
    if (this.queue.length < 3) this.queue.push(d);
  }

  /** Directional input that also wakes the game from the ready screen. */
  steer(d: Vec) {
    if (this.status === "over" || this.status === "won") return;
    this.setDirection(d);
    if (this.status === "ready") this.start();
  }

  private placeFood() {
    const free: Vec[] = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!this.snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    this.food = free.length ? free[(Math.random() * free.length) | 0] : null;
    this.foodPhase = Math.random() * Math.PI * 2;
  }

  getHud(): HudData {
    return {
      status: this.status,
      score: this.score,
      level: this.level,
      apples: this.apples,
      length: this.snake.length,
      tps: +(1000 / this.interval).toFixed(1),
    };
  }

  private pushHud() {
    this.onHud?.(this.getHud());
  }

  private die() {
    this.status = "over";
    this.shake = 1;
    this.flash = 1;
    // scatter the snake into particles
    for (const s of this.snake.slice(0, 14)) {
      this.burst(s.x, s.y, 3, [SNAKE_COLORS[this.snakeColor].head, SNAKE_COLORS[this.snakeColor].tail]);
    }
    this.onEvent?.("die");
    this.pushHud();
  }

  private burst(cx: number, cy: number, count = 14, colors = BURST_COLORS) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.6 + Math.random() * 4.2;
      this.particles.push({
        x: cx + 0.5,
        y: cy + 0.5,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        life: 500 + Math.random() * 380,
        max: 880,
        size: 0.07 + Math.random() * 0.12,
        color: colors[(Math.random() * colors.length) | 0],
        spin: Math.random() * Math.PI,
      });
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }

  /* ---------------- simulation ---------------- */

  private step() {
    while (this.queue.length) {
      const d = this.queue.shift()!;
      if (!OPPOSITE(d, this.dir) && !SAME(d, this.dir)) {
        this.dir = d;
        break;
      }
    }

    this.prev = this.snake.map((s) => ({ ...s }));
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) {
      this.die();
      return;
    }

    const eating = this.food !== null && head.x === this.food.x && head.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) {
      this.die();
      return;
    }

    const previousLevel = this.level;
    this.snake = [head, ...body];

    if (eating) {
      const cfg = DIFFICULTIES[this.difficulty];
      const pts = 10 * cfg.mult;
      this.score += pts;
      this.apples += 1;
      this.interval = Math.max(cfg.min, cfg.interval - this.apples * cfg.ramp);
      this.burst(head.x, head.y);
      if (!this.reducedMotion) this.floaters.push({
        x: head.x,
        y: head.y,
        text: `+${pts}`,
        life: 850,
        max: 850,
        color: "#ffc857",
      });
      this.placeFood();
      this.onEvent?.("eat");
      if (!this.food) {
        this.status = "won";
        this.queue = [];
        this.onEvent?.("win");
      } else if (this.level > previousLevel) {
        this.onEvent?.("level");
      }
      this.pushHud();
    }
  }

  update(dt: number) {
    if (this.status === "running") {
      this.acc += dt;
      let guard = 0;
      while (this.acc >= this.interval && guard++ < 8) {
        this.acc -= this.interval;
        this.step();
        if (this.status !== "running") break;
      }
    }

    this.shake *= Math.pow(0.9, dt / 16.7);
    this.flash *= Math.pow(0.93, dt / 16.7);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += (dt / 1000) * 5.5; // gentle gravity
      p.vx *= Math.pow(0.985, dt / 16.7);
      p.spin += dt * 0.004;
    }

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y -= dt * 0.0016;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
  }

}

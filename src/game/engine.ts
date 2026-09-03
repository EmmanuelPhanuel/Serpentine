/* Serpentine — snake engine: fixed-step logic + interpolated canvas rendering */

export type Vec = { x: number; y: number };
export type Status = "ready" | "running" | "paused" | "over";
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
  tps: number; // ticks per second
}

export type GameEvent = "eat" | "die" | "start" | "pause" | "resume";

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mixHex(c1: string, c2: string, t: number): string {
  const n1 = parseInt(c1.slice(1), 16);
  const n2 = parseInt(c2.slice(1), 16);
  const r = Math.round(lerp((n1 >> 16) & 255, (n2 >> 16) & 255, t));
  const g = Math.round(lerp((n1 >> 8) & 255, (n2 >> 8) & 255, t));
  const b = Math.round(lerp(n1 & 255, n2 & 255, t));
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const BURST_COLORS = ["#ffc857", "#ff6354", "#a8ef4c", "#fff3d6"];

export class SnakeEngine {
  difficulty: Difficulty;
  best: number;

  snake: Vec[] = [];
  prev: Vec[] = [];
  dir: Vec = { x: 1, y: 0 };
  queue: Vec[] = [];
  food: Vec = { x: 5, y: 5 };

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

  constructor(difficulty: Difficulty, best: number) {
    this.difficulty = difficulty;
    this.best = best;
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
    if (this.status === "over") this.reset();
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
    const ref = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (OPPOSITE(d, ref) || SAME(d, ref)) return;
    if (this.queue.length < 3) this.queue.push(d);
  }

  /** Directional input that also wakes the game from the ready screen. */
  steer(d: Vec) {
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
    this.food = free.length ? free[(Math.random() * free.length) | 0] : { x: 0, y: 0 };
    this.foodPhase = Math.random() * Math.PI * 2;
  }

  private pushHud() {
    this.onHud?.({
      status: this.status,
      score: this.score,
      apples: this.apples,
      length: this.snake.length,
      tps: +(1000 / this.interval).toFixed(1),
    });
  }

  private die() {
    this.status = "over";
    this.shake = 1;
    this.flash = 1;
    // scatter the snake into particles
    for (const s of this.snake.slice(0, 14)) {
      this.burst(s.x, s.y, 3, ["#7dd653", "#a8ef4c", "#4c8f52"]);
    }
    this.onEvent?.("die");
    this.pushHud();
  }

  private burst(cx: number, cy: number, count = 14, colors = BURST_COLORS) {
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

    const eating = head.x === this.food.x && head.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) {
      this.die();
      return;
    }

    this.snake = [head, ...body];

    if (eating) {
      const cfg = DIFFICULTIES[this.difficulty];
      const pts = 10 * cfg.mult;
      this.score += pts;
      this.apples += 1;
      this.interval = Math.max(cfg.min, cfg.interval - this.apples * cfg.ramp);
      this.burst(head.x, head.y);
      this.floaters.push({
        x: head.x,
        y: head.y,
        text: `+${pts}`,
        life: 850,
        max: 850,
        color: "#ffc857",
      });
      this.placeFood();
      this.onEvent?.("eat");
    }
    this.pushHud();
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

  /* ---------------- rendering ---------------- */

  render(ctx: CanvasRenderingContext2D, size: number, t: number) {
    const cell = size / GRID;
    ctx.save();
    ctx.clearRect(0, 0, size, size);

    if (this.shake > 0.02) {
      const s = this.shake * cell * 0.32;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    // board base
    roundRect(ctx, 1, 1, size - 2, size - 2, Math.min(18, size * 0.03));
    ctx.fillStyle = "#0b1f13";
    ctx.fill();
    ctx.clip();

    // checker cells
    ctx.fillStyle = "rgba(211,247,160,0.03)";
    for (let y = 0; y < GRID; y++) {
      for (let x = (y & 1) === 0 ? 1 : 0; x < GRID; x += 2) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // soft center light
    const glow = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.72);
    glow.addColorStop(0, "rgba(125,214,83,0.06)");
    glow.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    this.drawFood(ctx, cell, t);
    this.drawSnake(ctx, cell, t);
    this.drawParticles(ctx, cell);
    this.drawFloaters(ctx, cell);

    // inner border
    roundRect(ctx, 2.5, 2.5, size - 5, size - 5, Math.min(15, size * 0.028));
    ctx.strokeStyle = "rgba(168,239,76,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.flash > 0.02) {
      ctx.fillStyle = `rgba(229,72,77,${(this.flash * 0.34).toFixed(3)})`;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.restore();
  }

  private drawFood(ctx: CanvasRenderingContext2D, cell: number, t: number) {
    const pulse = 1 + Math.sin(t * 0.0055 + this.foodPhase) * 0.1;
    const fx = (this.food.x + 0.5) * cell;
    const fy = (this.food.y + 0.5) * cell;
    const r = cell * 0.33 * pulse;

    ctx.save();
    ctx.shadowColor = "rgba(255,99,84,0.85)";
    ctx.shadowBlur = cell * 0.55 * pulse;

    const grad = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r * 1.15);
    grad.addColorStop(0, "#ff8a5c");
    grad.addColorStop(0.55, "#ff6354");
    grad.addColorStop(1, "#c2343c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // shine
    ctx.fillStyle = "rgba(255,243,214,0.75)";
    ctx.beginPath();
    ctx.arc(fx - r * 0.32, fy - r * 0.36, r * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // stem + leaf
    ctx.strokeStyle = "#8a5a2b";
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, fy - r * 0.9);
    ctx.lineTo(fx + r * 0.14, fy - r * 1.35);
    ctx.stroke();

    ctx.fillStyle = "#7dd653";
    ctx.save();
    ctx.translate(fx + r * 0.42, fy - r * 1.25);
    ctx.rotate(-0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.36, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSnake(ctx: CanvasRenderingContext2D, cell: number, t: number) {
    const alpha =
      this.status === "running" || this.status === "paused" ? Math.min(this.acc / this.interval, 1) : 1;
    const len = this.snake.length;
    const dead = this.status === "over";

    // body, tail → head
    for (let i = len - 1; i >= 0; i--) {
      const c = this.snake[i];
      const p = this.prev[i] ?? c;
      const x = (lerp(p.x, c.x, alpha) + 0.5) * cell;
      const y = (lerp(p.y, c.y, alpha) + 0.5) * cell;
      const ratio = len === 1 ? 1 : 1 - i / (len - 1); // 1 at head
      const r = cell * (0.3 + 0.16 * ratio);
      const col = dead
        ? mixHex("#5d7a60", "#9db8a4", ratio)
        : mixHex("#1b7a3f", "#a8ef4c", Math.pow(ratio, 0.85));

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (i > 0 && i % 4 === 0 && !dead) {
        ctx.fillStyle = "rgba(7,19,12,0.28)";
        ctx.beginPath();
        ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (dead) return;

    // head details
    const hc = this.snake[0];
    const hp = this.prev[0] ?? hc;
    const hx = (lerp(hp.x, hc.x, alpha) + 0.5) * cell;
    const hy = (lerp(hp.y, hc.y, alpha) + 0.5) * cell;
    const d = this.dir;
    const e = { x: -d.y, y: d.x };
    const hr = cell * 0.46;

    // tongue flick
    if (Math.sin(t * 0.009 + this.foodPhase) > 0.82) {
      ctx.strokeStyle = "#ff6354";
      ctx.lineWidth = Math.max(1.5, cell * 0.06);
      ctx.lineCap = "round";
      const mx = hx + d.x * hr * 1.05;
      const my = hy + d.y * hr * 1.05;
      const tx = hx + d.x * hr * 1.75;
      const ty = hy + d.y * hr * 1.75;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(tx, ty);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + e.x * cell * 0.12 + d.x * cell * 0.08, ty + e.y * cell * 0.12 + d.y * cell * 0.08);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - e.x * cell * 0.12 + d.x * cell * 0.08, ty - e.y * cell * 0.12 + d.y * cell * 0.08);
      ctx.stroke();
    }

    // eyes
    for (const s of [-1, 1]) {
      const cx = hx + d.x * cell * 0.14 + e.x * s * cell * 0.17;
      const cy = hy + d.y * cell * 0.14 + e.y * s * cell * 0.17;
      ctx.fillStyle = "#f4ffe8";
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.115, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1f13";
      ctx.beginPath();
      ctx.arc(cx + d.x * cell * 0.05, cy + d.y * cell * 0.05, cell * 0.058, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, cell: number) {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x * cell, p.y * cell);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      const s = p.size * cell;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }

  private drawFloaters(ctx: CanvasRenderingContext2D, cell: number) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of this.floaters) {
      const a = Math.max(0, f.life / f.max);
      ctx.globalAlpha = a;
      ctx.font = `700 ${Math.round(cell * 0.56)}px Silkscreen, monospace`;
      ctx.fillStyle = "#07130c";
      ctx.fillText(f.text, (f.x + 0.5) * cell + 1.5, (f.y + 0.4) * cell + 1.5);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, (f.x + 0.5) * cell, (f.y + 0.4) * cell);
    }
    ctx.globalAlpha = 1;
  }
}

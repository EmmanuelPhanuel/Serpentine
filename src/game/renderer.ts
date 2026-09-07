import { GRID, type SnakeEngine } from "./engine.ts";
import { segmentColor, SNAKE_COLORS, worldForLevel, type SnakeColor } from "./worlds.ts";
import { drawTerrain } from "./terrain.ts";

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

export function renderGame(state: SnakeEngine, ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cell = size / GRID;
  const world = worldForLevel(state.level);
  const animationTime = state.reducedMotion ? 0 : t;
  ctx.save();
  ctx.clearRect(0, 0, size, size);

  if (!state.reducedMotion && state.shake > 0.02) {
    const s = state.shake * cell * 0.32;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  // board base
  roundRect(ctx, 1, 1, size - 2, size - 2, Math.min(18, size * 0.03));
  ctx.fillStyle = world.board;
  ctx.fill();
  ctx.clip();
  drawTerrain(ctx, size, world, animationTime);

  // checker cells
  ctx.fillStyle = `${world.accent}08`;
  for (let y = 0; y < GRID; y++) {
    for (let x = (y & 1) === 0 ? 1 : 0; x < GRID; x += 2) {
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // soft center light
  const glow = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.72);
  glow.addColorStop(0, `${world.accent}0c`);
  glow.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  if (state.food) drawFood(state, ctx, cell, animationTime);
  drawSnake(state, ctx, cell, animationTime);
  drawParticles(state, ctx, cell);
  drawFloaters(state, ctx, cell);

  // inner border
  roundRect(ctx, 2.5, 2.5, size - 5, size - 5, Math.min(15, size * 0.028));
  ctx.strokeStyle = `${world.accent}70`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (!state.reducedMotion && state.flash > 0.02) {
    ctx.fillStyle = `rgba(229,72,77,${(state.flash * 0.34).toFixed(3)})`;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.restore();
}

function drawFood(state: SnakeEngine, ctx: CanvasRenderingContext2D, cell: number, t: number) {
  if (!state.food) return;
  const pulse = 1 + Math.sin(t * 0.0055 + state.foodPhase) * 0.1;
  const fx = (state.food.x + 0.5) * cell;
  const fy = (state.food.y + 0.5) * cell;
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

function drawSnake(state: SnakeEngine, ctx: CanvasRenderingContext2D, cell: number, t: number) {
  const alpha =
    state.status === "running" || state.status === "paused" ? Math.min(state.acc / state.interval, 1) : 1;
  const len = state.snake.length;
  const dead = state.status === "over";
  const palette = SNAKE_COLORS[state.snakeColor];

  // body, tail → head
  for (let i = len - 1; i >= 0; i--) {
    const c = state.snake[i];
    const p = state.prev[i] ?? c;
    const x = (lerp(p.x, c.x, alpha) + 0.5) * cell;
    const y = (lerp(p.y, c.y, alpha) + 0.5) * cell;
    const ratio = len === 1 ? 1 : 1 - i / (len - 1); // 1 at head
    const r = cell * (0.3 + 0.16 * ratio);
    const col = dead
      ? mixHex("#5d7a60", "#9db8a4", ratio)
      : segmentColor(state.snakeColor, i) ?? mixHex(palette.tail, palette.head, Math.pow(ratio, 0.85));

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // An outline keeps every selectable color readable in every environment.
    ctx.strokeStyle = "rgba(3,8,18,0.8)";
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.stroke();

    if (i > 0 && !dead) drawSkinMark(ctx, state.snakeColor, x, y, r, i);
  }

  if (dead) return;

  // head details
  const hc = state.snake[0];
  const hp = state.prev[0] ?? hc;
  const hx = (lerp(hp.x, hc.x, alpha) + 0.5) * cell;
  const hy = (lerp(hp.y, hc.y, alpha) + 0.5) * cell;
  const d = state.dir;
  const e = { x: -d.y, y: d.x };
  const hr = cell * 0.46;

  // tongue flick
  if (!state.reducedMotion && Math.sin(t * 0.009 + state.foodPhase) > 0.82) {
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

function drawSkinMark(ctx: CanvasRenderingContext2D, color: SnakeColor, x: number, y: number, r: number, index: number) {
  const skin = SNAKE_COLORS[color];
  if (skin.pattern === "solid" || skin.pattern === "rainbow") return;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.translate(x, y);
  ctx.fillStyle = skin.marking;
  ctx.strokeStyle = skin.marking;
  ctx.lineWidth = Math.max(1, r * 0.35);
  if (skin.pattern === "bands") {
    ctx.rotate(-0.55);
    ctx.fillRect(-r * 0.45, -r, r * 0.35, r * 2);
    ctx.fillRect(r * 0.4, -r, r * 0.2, r * 2);
  } else if (skin.pattern === "spots") {
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.25, r * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.4, r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else if (skin.pattern === "diamond") {
    ctx.beginPath(); ctx.moveTo(0, -r * 0.72); ctx.lineTo(r * 0.5, 0);
    ctx.lineTo(0, r * 0.72); ctx.lineTo(-r * 0.5, 0); ctx.closePath(); ctx.fill();
  } else if (skin.pattern === "spark") {
    ctx.rotate(index % 2 ? 0.4 : -0.4);
    ctx.beginPath(); ctx.moveTo(r * 0.3, -r); ctx.lineTo(-r * 0.3, 0);
    ctx.lineTo(r * 0.3, 0); ctx.lineTo(-r * 0.3, r); ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(state: SnakeEngine, ctx: CanvasRenderingContext2D, cell: number) {
  for (const p of state.particles) {
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

function drawFloaters(state: SnakeEngine, ctx: CanvasRenderingContext2D, cell: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of state.floaters) {
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

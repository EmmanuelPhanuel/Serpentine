import type { World } from "./worlds.ts";

/** Low-contrast scenery sits underneath the grid and never changes collisions. */
export function drawTerrain(ctx: CanvasRenderingContext2D, size: number, world: World, time: number) {
  ctx.save();
  ctx.strokeStyle = world.terrain;
  ctx.fillStyle = world.terrain;
  ctx.lineWidth = Math.max(1, size / 400);
  ctx.globalAlpha = 0.16;

  if (world.id === "jungle" || world.id === "marsh") {
    for (let i = 0; i < 12; i++) {
      const x = ((i * 0.317 + 0.05) % 1) * size;
      const y = ((i * 0.219 + 0.1) % 1) * size;
      ctx.beginPath();
      if (world.id === "marsh") ctx.ellipse(x, y, size * 0.028, size * 0.01, 0, 0, Math.PI * 2);
      else { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + size * 0.035, y - size * 0.07, x, y - size * 0.12); }
      ctx.stroke();
    }
  }
  if (world.id === "crystal") {
    for (let i = 0; i < 15; i++) {
      const x = ((i * 0.317 + 0.07) % 1) * size;
      const y = ((i * 0.173 + 0.06) % 1) * size;
      ctx.beginPath(); ctx.moveTo(x, y - size * 0.025); ctx.lineTo(x + size * 0.015, y);
      ctx.lineTo(x, y + size * 0.025); ctx.lineTo(x - size * 0.015, y); ctx.closePath(); ctx.stroke();
    }
  }
  if (world.id === "canyon") {
    for (let row = 0; row < 14; row++) {
      const y = size * row / 13;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size * 0.3, y + size * 0.025);
      ctx.lineTo(size * 0.7, y - size * 0.015); ctx.lineTo(size, y); ctx.stroke();
    }
  }

  if (world.id === "desert" || world.id === "water") {
    for (let row = 0; row < 8; row++) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += size / 32) {
        const phase = world.id === "water" ? time * 0.0003 : 0;
        const y = size * (row / 7) + Math.sin(x / size * 7 + row + phase) * size * (world.id === "desert" ? 0.045 : 0.014);
        if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  if (world.id === "snow") {
    // Ice seams and six-point snow crystals.
    for (let i = 0; i < 12; i++) {
      const x = ((i * 0.317 + 0.08) % 1) * size;
      const y = ((i * 0.193 + 0.12) % 1) * size;
      const r = size * 0.018;
      for (let arm = 0; arm < 3; arm++) {
        const a = arm * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
      }
    }
  }

  if (world.id === "volcano") {
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(size * i / 4, 0);
      for (let j = 1; j <= 7; j++) ctx.lineTo(size * (i / 4 + Math.sin(i * 4 + j * 2) * 0.07), size * j / 7);
      ctx.stroke();
    }
  }

  if (world.id === "garden") {
    for (let i = 0; i < 18; i++) {
      const x = ((i * 0.317 + 0.12) % 1) * size;
      const y = ((i * 0.213 + 0.04) % 1) * size;
      ctx.beginPath(); ctx.ellipse(x, y, size * 0.015, size * 0.005, i, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (world.id === "cosmos" || world.id === "water" || world.id === "snow") {
    for (let i = 0; i < 28; i++) {
      const x = ((i * 0.618 + 0.09) % 1) * size;
      const offset = world.id === "water" ? -time * 0.000015 : world.id === "snow" ? time * 0.000012 : 0;
      const y = (((i * 0.381 + offset) % 1 + 1) % 1) * size;
      ctx.globalAlpha = world.id === "cosmos" ? 0.16 + (Math.sin(time * 0.001 + i) + 1) * 0.1 : 0.18;
      ctx.beginPath(); ctx.arc(x, y, size * (world.id === "water" ? 0.008 : 0.0025), 0, Math.PI * 2);
      if (world.id === "water") ctx.stroke(); else ctx.fill();
    }
  }
  ctx.restore();
}

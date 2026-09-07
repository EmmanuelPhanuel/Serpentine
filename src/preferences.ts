import type { Difficulty } from "./game/engine.ts";
import { levelForProgress } from "./game/worlds.ts";

export type Bests = Record<Difficulty, number>;
export const KEYS = { bests: "serpentine.bests.v1", difficulty: "serpentine.difficulty.v1", muted: "serpentine.muted.v1", snakeColor: "serpentine.snake-color.v1", highestLevel: "serpentine.highest-level.v1" };

export function highestLevelFromSaves(raw: string | null, bests: Bests): number {
  const saved = Number(raw);
  // Honor achievements from before level unlocks were introduced.
  return Math.max(Number.isSafeInteger(saved) && saved >= 1 ? saved : 1,
    levelForProgress(bests.chill, 3 + Math.floor(bests.chill / 10)),
    levelForProgress(bests.classic, 3 + Math.floor(bests.classic / 20)),
    levelForProgress(bests.turbo, 3 + Math.floor(bests.turbo / 30)));
}

export function parseBests(raw: string | null): Bests {
  let data: Partial<Bests> = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") data = parsed as Partial<Bests>;
  } catch { /* Invalid saves fall back to zero. */ }
  const score = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : 0;
  return { chill: score(data.chill), classic: score(data.classic), turbo: score(data.turbo) };
}

export function parseDifficulty(raw: string | null): Difficulty {
  return raw === "chill" || raw === "turbo" || raw === "classic" ? raw : "classic";
}

export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Play remains available without storage. */ }
}

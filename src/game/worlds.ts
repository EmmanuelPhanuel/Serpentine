export const POINTS_PER_LEVEL = 100;
export const GROWTH_PER_LEVEL = 6;
export const START_LENGTH = 3;

export const SNAKE_COLORS = {
  lime: { name: "Classic Lime", head: "#b9f56a", tail: "#5caf40", unlock: 1, pattern: "solid", marking: "#234d15" },
  aqua: { name: "Electric Blue", head: "#56c9ff", tail: "#60a6db", unlock: 2, pattern: "solid", marking: "#133967" },
  gold: { name: "Royal Gold", head: "#ffce45", tail: "#d6ad45", unlock: 3, pattern: "diamond", marking: "#795112" },
  coral: { name: "Crimson", head: "#ff6b79", tail: "#e67e90", unlock: 4, pattern: "solid", marking: "#851d36" },
  violet: { name: "Ultraviolet", head: "#ca83ff", tail: "#a078dc", unlock: 5, pattern: "solid", marking: "#4e2279" },
  pearl: { name: "Panda", head: "#fff8e7", tail: "#d3d4d6", unlock: 6, pattern: "spots", marking: "#17202d" },
  mint: { name: "Neon Mint", head: "#5bffbd", tail: "#67ba93", unlock: 7, pattern: "bands", marking: "#12644c" },
  sky: { name: "Arctic", head: "#d8fbff", tail: "#70aedb", unlock: 8, pattern: "bands", marking: "#276b9e" },
  rose: { name: "Candy", head: "#ff86d3", tail: "#dc82b9", unlock: 10, pattern: "bands", marking: "#fff2fa" },
  peach: { name: "Sunset", head: "#ffc05e", tail: "#e98ca9", unlock: 12, pattern: "solid", marking: "#75336b" },
  lemon: { name: "Volt", head: "#ecff36", tail: "#b7c75c", unlock: 14, pattern: "spark", marking: "#344112" },
  lavender: { name: "Nebula", head: "#c8adff", tail: "#c979c4", unlock: 16, pattern: "spark", marking: "#fff0b1" },
  tangerine: { name: "Tiger", head: "#ffad45", tail: "#e39a5e", unlock: 18, pattern: "bands", marking: "#302015" },
  cherry: { name: "Lava", head: "#ff8661", tail: "#db7996", unlock: 20, pattern: "spark", marking: "#44243b" },
  glacier: { name: "Aurora", head: "#b5faff", tail: "#77c8d1", unlock: 22, pattern: "diamond", marking: "#8a3698" },
  jade: { name: "Emerald", head: "#60ef9b", tail: "#67ba93", unlock: 24, pattern: "diamond", marking: "#145b3a" },
  orchid: { name: "Rainbow", head: "#f5adff", tail: "#cc85d5", unlock: 27, pattern: "rainbow", marking: "#ffde59" },
  silver: { name: "Chrome", head: "#dce8ee", tail: "#a8bac5", unlock: 30, pattern: "bands", marking: "#53687a" },
} as const;
export type SnakeColor = keyof typeof SNAKE_COLORS;

export function isColorUnlocked(color: SnakeColor, highestLevel: number): boolean {
  return SNAKE_COLORS[color]?.unlock <= highestLevel;
}

export function unlockedColor(value: string | null, highestLevel: number): SnakeColor {
  const color = parseSnakeColor(value);
  return isColorUnlocked(color, highestLevel) ? color : "lime";
}

const RAINBOW = ["#ff858d", "#ffb967", "#f3e867", "#8cde93", "#78cfff", "#c5a0ff"];
export function segmentColor(color: SnakeColor, index: number): string | null {
  return SNAKE_COLORS[color].pattern === "rainbow" && index > 0 ? RAINBOW[(index - 1) % RAINBOW.length] : null;
}

export function skinPreview(color: SnakeColor): string {
  const style = SNAKE_COLORS[color];
  switch (style.pattern) {
    case "rainbow": return `linear-gradient(90deg, ${RAINBOW.join(", ")})`;
    case "bands": return `repeating-linear-gradient(115deg, ${style.head} 0px 7px, ${style.marking} 7px 10px)`;
    case "spots": return `radial-gradient(circle at 30% 30%, ${style.marking} 0% 18%, transparent 20%), radial-gradient(circle at 75% 70%, ${style.marking} 0% 20%, ${style.head} 22%)`;
    case "diamond": return `conic-gradient(from 45deg, ${style.head}, ${style.marking}, ${style.head}, ${style.marking}, ${style.head})`;
    case "spark": return `linear-gradient(135deg, ${style.tail} 38%, ${style.marking} 40% 48%, ${style.head} 50%)`;
    default: return `linear-gradient(90deg, ${style.tail}, ${style.head})`;
  }
}

export function parseSnakeColor(value: string | null): SnakeColor {
  return value && Object.prototype.hasOwnProperty.call(SNAKE_COLORS, value) ? value as SnakeColor : "lime";
}

export interface World {
  id: "garden" | "desert" | "snow" | "water" | "volcano" | "cosmos" | "jungle" | "canyon" | "crystal" | "marsh";
  name: string;
  symbol: string;
  description: string;
  sky: string;
  floor: string;
  panel: string;
  surface: string;
  border: string;
  accent: string;
  text: string;
  muted: string;
  board: string;
  terrain: string;
}

export const WORLDS: readonly World[] = [
  { id: "garden", name: "Emerald Garden", symbol: "❧", description: "A quiet beginning beneath the canopy.", sky: "#112b1d", floor: "#050f09", panel: "#0a1c11", surface: "#173b27", border: "#356446", accent: "#b9ef85", text: "#e1f7d2", muted: "#abc5b0", board: "#0b2116", terrain: "#47784b" },
  { id: "desert", name: "Amber Dunes", symbol: "☀", description: "Warm sands. Long shadows. Keep moving.", sky: "#4a2a1e", floor: "#190f0d", panel: "#281911", surface: "#4a3020", border: "#79543b", accent: "#ffd089", text: "#fff0d3", muted: "#d2b99b", board: "#362718", terrain: "#b28149" },
  { id: "snow", name: "Frostpeak", symbol: "❄", description: "Fresh snow under an arctic sky.", sky: "#233e58", floor: "#0b1425", panel: "#14253b", surface: "#28445d", border: "#4b718b", accent: "#b8e8ff", text: "#edfaff", muted: "#b6cfde", board: "#243c52", terrain: "#b2d1e1" },
  { id: "water", name: "Tidal Lagoon", symbol: "≈", description: "Follow the currents into the deep blue.", sky: "#0d414d", floor: "#041822", panel: "#092b39", surface: "#124c5a", border: "#287887", accent: "#86eee0", text: "#d8fff5", muted: "#a6ced1", board: "#0a3449", terrain: "#3cabc0" },
  { id: "volcano", name: "Ember Caldera", symbol: "△", description: "A trail of embers across volcanic stone.", sky: "#492128", floor: "#170d18", panel: "#29171f", surface: "#4f2830", border: "#824449", accent: "#ffb591", text: "#ffe3d7", muted: "#d3b0b4", board: "#30212b", terrain: "#e66b47" },
  { id: "cosmos", name: "Starlight Drift", symbol: "✧", description: "Beyond the horizon, a sea of stars.", sky: "#30274f", floor: "#100d22", panel: "#1d1835", surface: "#3b3059", border: "#65538c", accent: "#d3bbff", text: "#f0e6ff", muted: "#c3b5dd", board: "#231c3b", terrain: "#a888d6" },
  { id: "jungle", name: "Jade Jungle", symbol: "♧", description: "Follow the vines through the rainforest.", sky: "#173b32", floor: "#071c18", panel: "#102a24", surface: "#245044", border: "#458671", accent: "#a1f4c4", text: "#e4ffec", muted: "#b1d2c1", board: "#13352c", terrain: "#69ad80" },
  { id: "canyon", name: "Copper Canyon", symbol: "⋀", description: "Ancient cliffs carved by wind and time.", sky: "#47262d", floor: "#1b1117", panel: "#2c1c24", surface: "#4f323a", border: "#8c5760", accent: "#ffc5a6", text: "#ffece0", muted: "#d8b7b4", board: "#35252d", terrain: "#b97764" },
  { id: "crystal", name: "Prism Cavern", symbol: "◇", description: "Crystal spires light the underground.", sky: "#293254", floor: "#0d1428", panel: "#1a2440", surface: "#334365", border: "#5c72a0", accent: "#b7cdff", text: "#edf2ff", muted: "#bdc8e4", board: "#242e49", terrain: "#8dabe8" },
  { id: "marsh", name: "Moonlit Marsh", symbol: "☾", description: "Still pools and reeds beneath the moon.", sky: "#283b40", floor: "#0d1b21", panel: "#182e32", surface: "#314c50", border: "#587b7a", accent: "#c8eccb", text: "#eaffed", muted: "#bdd0c3", board: "#203537", terrain: "#88a99a" },
];

const LEVEL_NAMES = [
  "Emerald Garden", "Amber Dunes", "Frostpeak", "Tidal Lagoon", "Ember Caldera",
  "Starlight Drift", "Jade Jungle", "Copper Canyon", "Prism Cavern", "Moonlit Marsh",
  "Golden Grove", "Saffron Expanse", "Aurora Ridge", "Coral Coast", "Cinder Summit",
  "Nebula Passage", "Orchid Canopy", "Sunset Mesa", "Amethyst Hollow", "Firefly Fen",
  "Midnight Orchard", "Eclipse Sands", "Polar Night", "Abyssal Trench", "Obsidian Heart",
  "Event Horizon", "Rainforest Afterglow", "Starlit Badlands", "Diamond Depths", "Phantom Wetlands",
] as const;

function tint(hex: string, target: string, amount: number): string {
  return "#" + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + parseInt(target.slice(i, i + 2), 16) * amount).toString(16).padStart(2, "0")).join("");
}

export const LEVELS = LEVEL_NAMES.map((name, index) => {
  const number = index + 1;
  const chapter = Math.floor(index / WORLDS.length);
  const base = WORLDS[index % WORLDS.length];
  const hue = chapter === 1 ? "#793d4e" : "#0a0c28";
  const amount = chapter === 0 ? 0 : chapter === 1 ? 0.35 : 0.55;
  const world: World = {
    ...base, name,
    sky: tint(base.sky, hue, amount), floor: tint(base.floor, hue, amount * 0.3),
    panel: tint(base.panel, hue, amount * 0.4), board: tint(base.board, "#101125", amount * 0.5),
    terrain: tint(base.terrain, chapter === 1 ? "#ffb98f" : "#a2b0f0", amount),
    description: `${["First light", "Golden hour", "After dark"][chapter]} · ${base.description}`,
  };
  return { number, chapter: chapter + 1, world, score: index * POINTS_PER_LEVEL, length: START_LENGTH + index * GROWTH_PER_LEVEL };
});

export function levelForScore(score: number): number {
  return Math.floor(Math.max(0, Number.isFinite(score) ? score : 0) / POINTS_PER_LEVEL) + 1;
}

export function levelForProgress(score: number, length: number): number {
  const growth = Math.max(0, (Number.isFinite(length) ? Math.floor(length) : START_LENGTH) - START_LENGTH);
  return Math.max(levelForScore(score), Math.floor(growth / GROWTH_PER_LEVEL) + 1);
}

export function nextLevelTargets(level: number) {
  return { score: level * POINTS_PER_LEVEL, length: START_LENGTH + level * GROWTH_PER_LEVEL };
}

export function worldForLevel(level: number): World {
  const index = Math.max(1, Math.floor(Number.isFinite(level) ? level : 1)) - 1;
  const stage = LEVELS[index % LEVELS.length];
  return index < LEVELS.length ? stage.world : { ...stage.world, name: `${stage.world.name} · Expedition ${Math.floor(index / LEVELS.length) + 1}` };
}

export function worldStyle(world: World): Record<string, string> {
  return {
    "--world-sky": world.sky, "--world-floor": world.floor, "--world-accent": world.accent,
    "--world-terrain": world.terrain, "--world-board": world.board,
    "--color-pit-950": world.floor, "--color-pit-900": world.floor,
    "--color-pit-850": world.panel, "--color-pit-800": world.panel,
    "--color-pit-700": world.surface, "--color-pit-600": world.border,
    "--color-moss-400": world.accent, "--color-moss-500": world.border,
    "--color-leaf-200": world.text, "--color-leaf-300": world.accent, "--color-leaf-400": world.accent,
    "--color-fern-200": world.text, "--color-fern-300": world.muted,
    "--color-amber-glow": world.accent,
  };
}

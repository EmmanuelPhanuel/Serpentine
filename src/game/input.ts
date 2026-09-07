const INTERACTIVE = "button, a, input, textarea, select, [role='button'], [role='radio'], [contenteditable]:not([contenteditable='false'])";

export function shouldHandleShortcut(e: Pick<KeyboardEvent, "key" | "repeat" | "ctrlKey" | "altKey" | "metaKey" | "isComposing" | "defaultPrevented" | "target">, allowRepeat = false): boolean {
  if ((!allowRepeat && e.repeat) || e.ctrlKey || e.altKey || e.metaKey || e.isComposing || e.defaultPrevented) return false;
  const target = e.target as Element | null;
  if (target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false']), [data-game-shortcuts='off']")) return false;
  return !((e.key === " " || e.key === "Enter") && target?.closest?.(INTERACTIVE));
}

type Direction = { x: number; y: number };
const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
};

export function handleGameKey(e: KeyboardEvent, game: {
  status: string; steer: (direction: Direction) => void; togglePause: () => void; restart: () => void;
}) {
  const direction = DIRECTIONS[e.key] ?? DIRECTIONS[e.key.toLowerCase()];
  if (!shouldHandleShortcut(e)) {
    // Holding a control must not start scrolling the page after the first press.
    if (e.repeat && shouldHandleShortcut(e, true) && (direction || e.key === " ")) e.preventDefault();
    return;
  }
  if (direction) { e.preventDefault(); game.steer(direction); return; }
  if (e.key === " " || e.key.toLowerCase() === "p") { e.preventDefault(); game.togglePause(); }
  else if (e.key.toLowerCase() === "r") { e.preventDefault(); game.restart(); }
  else if (e.key === "Enter" && ["ready", "over", "won"].includes(game.status)) { e.preventDefault(); game.restart(); }
}

export function swipeDirection(dx: number, dy: number, boardSize: number): Direction | null {
  if (Math.hypot(dx, dy) < Math.max(12, Math.min(26, boardSize * 0.06))) return null;
  return Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
}

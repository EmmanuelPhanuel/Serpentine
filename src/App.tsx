import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SnakeColorPicker, WorldAtlas, WorldBackdrop } from "./components/WorldUI";
import { worldForLevel, worldStyle } from "./game/worlds";
import SnakeGame from "./game/SnakeGame";
import { DIFFICULTIES, type HudData } from "./game/engine";
import { usePreferences } from "./hooks/usePreferences";
import { shouldHandleShortcut } from "./game/input";
import {
  SnakeLogo,
  IconSoundOn,
  IconSoundOff,
  Panel,
  ScorePanel,
  DifficultyPanel,
  ControlsGuide,
} from "./components/ui";

interface Firefly {
  style: CSSProperties;
}

function makeFireflies(n: number): Firefly[] {
  const out: Firefly[] = [];
  for (let i = 0; i < n; i++) {
    const s = 2 + Math.random() * 2.6;
    out.push({
      style: {
        left: `${Math.random() * 100}%`,
        top: `${12 + Math.random() * 84}%`,
        width: s,
        height: s,
        background: "var(--world-accent)",
        boxShadow: "0 0 10px var(--world-accent)",
        "--dur": `${13 + Math.random() * 11}s`,
        "--tw": `${2.6 + Math.random() * 2.4}s`,
        "--delay": `${-Math.random() * 14}s`,
        "--peak": `${0.35 + Math.random() * 0.5}`,
        "--dx1": `${(Math.random() - 0.5) * 90}px`,
        "--dy1": `${-20 - Math.random() * 50}px`,
        "--dx2": `${(Math.random() - 0.5) * 110}px`,
        "--dy2": `${-40 - Math.random() * 70}px`,
        "--dx3": `${(Math.random() - 0.5) * 90}px`,
        "--dy3": `${-15 - Math.random() * 45}px`,
      } as CSSProperties,
    });
  }
  return out;
}

export default function App() {
  const { highestLevel, recordLevel, snakeColor, setSnakeColor, difficulty, setDifficulty, bests, muted, setMutedState, handleScore } = usePreferences();
  const [hud, setHud] = useState<HudData>(() => ({ status: "ready", level: 1, score: 0, apples: 0, length: 3, tps: +(1000 / DIFFICULTIES[difficulty].interval).toFixed(1) }));

  const fireflies = useMemo(() => makeFireflies(16), []);

  /* M toggles sound from anywhere */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!shouldHandleShortcut(e)) return;
      if (e.key === "m" || e.key === "M") setMutedState((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMutedState]);

  const handleHud = useCallback((h: HudData) => { setHud(h); recordLevel(h.level); }, [recordLevel]);

  const cfg = DIFFICULTIES[difficulty];
  const world = worldForLevel(hud.level);

  return (
    <div className="bg-pit world-page relative min-h-dvh overflow-x-hidden" data-biome={world.id} style={worldStyle(world) as CSSProperties}>
      <WorldBackdrop world={world} />
      {/* ambient layers */}
      <div className="bg-grid-faint absolute inset-0 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {fireflies.map((f, i) => (
          <span key={i} className="firefly" style={f.style} />
        ))}
      </div>
      <div className="vignette absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-10 pt-6 xl:pt-9">
        {/* header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <SnakeLogo className="w-11 h-11 sm:w-[52px] sm:h-[52px] drop-shadow-[0_0_14px_rgba(168,239,76,0.35)]" />
              <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-berry-400 blink-soft" />
            </div>
            <div>
              <h1 className="font-display text-[22px] sm:text-[27px] leading-none text-leaf-200 title-glow tracking-wide">
                SERPENTINE
              </h1>
              <p className="text-[10px] sm:text-[11px] tracking-[0.3em] text-fern-300 mt-1.5 font-semibold">
                30 LEVELS · ONE SNAKE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[9px] font-semibold tracking-[0.22em] text-fern-300">BEST · {cfg.tag}</p>
              <p className="font-display text-xl leading-tight text-amber-glow">{bests[difficulty]}</p>
            </div>
            <button
              onClick={() => {
                setMutedState((m) => !m);
              }}
              className="btn-arcade flex items-center gap-2 h-11 px-3.5 border border-pit-600 bg-pit-850/80 text-fern-200 hover:border-moss-400 hover:text-leaf-200"
              aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
              aria-pressed={muted}
            >
              {muted ? <IconSoundOff className="w-4 h-4" /> : <IconSoundOn className="w-4 h-4" />}
              <span className="hidden md:inline font-display text-[9px] tracking-[0.18em]">
                {muted ? "MUTED" : "SOUND"}
              </span>
            </button>
          </div>
        </header>

        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-pit-600 to-transparent" />

        {/* main */}
        <main className="mt-6 grid items-start gap-6 xl:grid-cols-[248px_minmax(0,1fr)_248px]">
          <aside className="hidden xl:block space-y-5">
            <Panel title="PACE SELECTOR">
              <DifficultyPanel value={difficulty} bests={bests} onChange={setDifficulty} />
            </Panel>
            <Panel title="SNAKE COLOR">
              <SnakeColorPicker highestLevel={highestLevel} value={snakeColor} onChange={setSnakeColor} />
            </Panel>
            <Panel title="FIELD NOTES" accent="#ffc857">
              <ul className="space-y-2.5 text-[11px] leading-relaxed text-fern-300">
                <li className="flex gap-2">
                  <span className="text-berry-400 font-bold">01</span>
                  Walls are fatal. So is your own tail.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-glow font-bold">02</span>
                  Every apple shaves time off the clock — it only gets faster.
                </li>
                <li className="flex gap-2">
                  <span className="text-leaf-300 font-bold">03</span>
                  Higher pace pays more: apples are worth ×{cfg.mult} on {cfg.tag}.
                </li>
              </ul>
            </Panel>
          </aside>

          <section className="min-w-0">
            <div className="xl:hidden mb-3">
              <DifficultyPanel value={difficulty} bests={bests} onChange={setDifficulty} compact />
            </div>
            <SnakeGame snakeColor={snakeColor} difficulty={difficulty} best={bests[difficulty]} onScore={handleScore} onHud={handleHud} />
          </section>

          <aside className="hidden xl:block space-y-5">
            <ScorePanel hud={hud} best={bests[difficulty]} />
            <Panel title="WORLD JOURNEY">
              <WorldAtlas level={hud.level} />
            </Panel>
            <Panel title="CONTROLS" accent="#ff6354">
              <ControlsGuide />
            </Panel>
          </aside>
        </main>

        {/* mobile stats + notes */}
        <div className="xl:hidden mt-6 grid grid-cols-1 gap-3 max-w-[600px] mx-auto">
          <Panel title="SNAKE COLOR">
            <SnakeColorPicker highestLevel={highestLevel} value={snakeColor} onChange={setSnakeColor} />
          </Panel>
          <details className="border border-pit-600 bg-pit-850/80 p-4">
            <summary className="cursor-pointer text-xs text-leaf-200 font-semibold">Explore the world journey · Level {hud.level}</summary>
            <WorldAtlas level={hud.level} />
          </details>
          <Panel title="PACE NOTES" accent="#ffc857">
            <p className="text-[11px] leading-relaxed text-fern-300">
              Apples are worth <span className="text-leaf-200 font-semibold">×{cfg.mult}</span> on {cfg.tag}, and every
              bite makes the clock faster. Walls and tail are fatal — best on this board:{" "}
              <span className="text-amber-glow font-semibold">{bests[difficulty]}</span>.
            </p>
          </Panel>
        </div>

        <footer className="mt-10 text-center">
          <p className="font-display text-[8px] tracking-[0.3em] text-fern-300/70">
            SERPENTINE · BEST SCORES SAVED ON THIS DEVICE · NO SNAKES WERE HARMED
          </p>
        </footer>
      </div>
      <Analytics />
    </div>
  );
}

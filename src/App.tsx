import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import SnakeGame from "./game/SnakeGame";
import { DIFFICULTIES, type Difficulty, type HudData } from "./game/engine";
import { setMuted } from "./game/audio";
import {
  SnakeLogo,
  IconSoundOn,
  IconSoundOff,
  Panel,
  ScorePanel,
  DifficultyPanel,
  ControlsGuide,
} from "./components/ui";

const BEST_KEY = "serpentine.bests.v1";
const DIFF_KEY = "serpentine.difficulty.v1";
const MUTE_KEY = "serpentine.muted.v1";

type Bests = Record<Difficulty, number>;
const ZERO: Bests = { chill: 0, classic: 0, turbo: 0 };

function loadBests(): Bests {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return ZERO;
    const p = JSON.parse(raw) as Partial<Bests>;
    return {
      chill: Number(p.chill) || 0,
      classic: Number(p.classic) || 0,
      turbo: Number(p.turbo) || 0,
    };
  } catch {
    return ZERO;
  }
}

function loadDifficulty(): Difficulty {
  try {
    const d = localStorage.getItem(DIFF_KEY);
    if (d === "chill" || d === "classic" || d === "turbo") return d;
  } catch {
    /* ignore */
  }
  return "classic";
}

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

interface Firefly {
  style: CSSProperties;
}

function makeFireflies(n: number): Firefly[] {
  const out: Firefly[] = [];
  for (let i = 0; i < n; i++) {
    const s = 2 + Math.random() * 2.6;
    const gold = Math.random() > 0.45;
    out.push({
      style: {
        left: `${Math.random() * 100}%`,
        top: `${12 + Math.random() * 84}%`,
        width: s,
        height: s,
        background: gold ? "#ffc857" : "#a8ef4c",
        boxShadow: `0 0 ${6 + s * 2}px ${gold ? "rgba(255,200,87,0.8)" : "rgba(168,239,76,0.8)"}`,
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
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty);
  const [bests, setBests] = useState<Bests>(loadBests);
  const [muted, setMutedState] = useState<boolean>(loadMuted);
  const [hud, setHud] = useState<HudData>({ status: "ready", score: 0, apples: 0, length: 3, tps: 8.5 });

  const fireflies = useMemo(() => makeFireflies(16), []);

  /* persist + sync mute */
  useEffect(() => {
    setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted]);

  /* persist difficulty */
  useEffect(() => {
    try {
      localStorage.setItem(DIFF_KEY, difficulty);
    } catch {
      /* ignore */
    }
  }, [difficulty]);

  /* M toggles sound from anywhere */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") setMutedState((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleScore = useCallback(
    (score: number) => {
      setBests((prev) => {
        if (score <= prev[difficulty]) return prev;
        const next = { ...prev, [difficulty]: score };
        try {
          localStorage.setItem(BEST_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [difficulty],
  );

  const handleHud = useCallback((h: HudData) => setHud(h), []);

  const cfg = DIFFICULTIES[difficulty];

  return (
    <div className="bg-pit relative min-h-dvh overflow-x-hidden">
      {/* ambient layers */}
      <div className="bg-grid-faint absolute inset-0 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {fireflies.map((f, i) => (
          <span key={i} className="firefly" style={f.style} />
        ))}
      </div>
      <div className="vignette absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-10 pt-6 lg:pt-9">
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
                GRID-RUNNER ARCADE · SNAKE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[9px] font-semibold tracking-[0.22em] text-fern-300">BEST · {cfg.tag}</p>
              <p className="font-display text-xl leading-tight text-amber-glow">{bests[difficulty]}</p>
            </div>
            <button
              onClick={(e) => {
                setMutedState((m) => !m);
                e.currentTarget.blur();
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
        <main className="mt-6 grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)_248px]">
          <aside className="hidden lg:block space-y-5">
            <Panel title="PACE SELECTOR">
              <DifficultyPanel value={difficulty} bests={bests} onChange={setDifficulty} />
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
            <div className="lg:hidden mb-3">
              <DifficultyPanel value={difficulty} bests={bests} onChange={setDifficulty} compact />
            </div>
            <SnakeGame difficulty={difficulty} best={bests[difficulty]} onScore={handleScore} onHud={handleHud} />
          </section>

          <aside className="hidden lg:block space-y-5">
            <ScorePanel hud={hud} best={bests[difficulty]} />
            <Panel title="CONTROLS" accent="#ff6354">
              <ControlsGuide />
            </Panel>
          </aside>
        </main>

        {/* mobile stats + notes */}
        <div className="lg:hidden mt-6 grid grid-cols-1 gap-3 max-w-[600px] mx-auto">
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
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SnakeEngine, DIFFICULTIES, type Difficulty, type HudData, type Vec } from "./engine";
import { sfx } from "./audio";
import { DPad, IconPause, IconPlay, IconRestart, IconCrown } from "../components/ui";

interface Props {
  difficulty: Difficulty;
  best: number;
  onScore: (score: number) => void;
  onHud: (hud: HudData) => void;
}

const STATUS_META: Record<HudData["status"], { label: string; color: string; bg: string }> = {
  ready: { label: "READY", color: "#ffc857", bg: "rgba(255,200,87,0.12)" },
  running: { label: "LIVE", color: "#a8ef4c", bg: "rgba(168,239,76,0.12)" },
  paused: { label: "PAUSED", color: "#ff6354", bg: "rgba(255,99,84,0.12)" },
  over: { label: "WRECKED", color: "#ff6354", bg: "rgba(255,99,84,0.14)" },
};

const DIR_KEYS: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
};

function Overlay({ children, onTap }: { children: ReactNode; onTap?: () => void }) {
  return (
    <div
      className="pop-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5 bg-[rgba(5,15,9,0.84)] backdrop-blur-[2.5px] text-center px-5"
      onPointerDown={onTap}
    >
      {children}
    </div>
  );
}

const btnPrimary =
  "btn-arcade font-display text-[11px] tracking-[0.18em] px-6 py-3.5 bg-leaf-300 text-pit-900 border border-leaf-200 " +
  "shadow-[0_4px_0_#3d6b2a] hover:bg-leaf-200 active:shadow-[0_1px_0_#3d6b2a] flex items-center gap-2.5";

const btnGhost =
  "btn-arcade font-display text-[10px] tracking-[0.18em] px-5 py-3 border border-pit-600 bg-pit-800/80 text-fern-200 " +
  "hover:border-moss-400 hover:text-leaf-200 flex items-center gap-2.5";

export default function SnakeGame({ difficulty, best, onScore, onHud }: Props) {
  const engineRef = useRef<SnakeEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SnakeEngine(difficulty, best);
  const engine = engineRef.current;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const bestRef = useRef(best);
  bestRef.current = best;
  const bestAtStartRef = useRef(best);
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;
  const onHudRef = useRef(onHud);
  onHudRef.current = onHud;

  const [hud, setHud] = useState<HudData>({
    status: "ready",
    score: 0,
    apples: 0,
    length: 3,
    tps: +(1000 / DIFFICULTIES[difficulty].interval).toFixed(1),
  });

  /* --- wire engine callbacks --- */
  useEffect(() => {
    engine.onHud = (h) => {
      setHud(h);
      onHudRef.current(h);
    };
    engine.onEvent = (ev) => {
      switch (ev) {
        case "eat":
          sfx.eat(engine.apples);
          onScoreRef.current(engine.score);
          break;
        case "die":
          sfx.die();
          if (engine.score > 0 && engine.score > bestAtStartRef.current) {
            window.setTimeout(() => sfx.best(), 380);
          }
          break;
        case "start":
          sfx.start();
          bestAtStartRef.current = bestRef.current;
          break;
        case "pause":
          sfx.pause();
          break;
        case "resume":
          sfx.resume();
          break;
      }
    };
    return () => {
      engine.onHud = undefined;
      engine.onEvent = undefined;
    };
  }, [engine]);

  /* --- difficulty sync (skip first render) --- */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    engine.setDifficulty(difficulty);
    bestAtStartRef.current = bestRef.current;
  }, [difficulty, engine]);

  /* --- render loop + canvas sizing --- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const s = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
      sizeRef.current = s;
      canvas.width = Math.max(1, Math.round(s * dpr()));
      canvas.height = Math.max(1, Math.round(s * dpr()));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      engine.update(dt);
      const s = sizeRef.current;
      if (s > 0) {
        const d = dpr();
        ctx.setTransform(d, 0, 0, d, 0, 0);
        engine.render(ctx, s, now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine]);

  /* --- keyboard --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = DIR_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        engine.steer(dir);
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        engine.togglePause();
      } else if (e.key === "Enter") {
        if (engine.status === "ready" || engine.status === "over") engine.restart();
      } else if (e.key === "p" || e.key === "P") {
        engine.togglePause();
      } else if (e.key === "r" || e.key === "R") {
        engine.restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  /* --- auto-pause when tab hidden / window blurred --- */
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) engine.pause();
    };
    const onBlur = () => engine.pause();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onBlur);
    };
  }, [engine]);

  /* --- swipe steering --- */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (Math.hypot(dx, dy) < 26) return;
    const dir: Vec = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    engine.steer(dir);
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = () => {
    touchRef.current = null;
  };

  const meta = STATUS_META[hud.status];
  const isNewBest = hud.status === "over" && hud.score > 0 && hud.score > bestAtStartRef.current;
  const chip =
    "btn-arcade flex items-center justify-center gap-2 h-11 px-4 border border-pit-600 bg-pit-800/90 text-fern-200 " +
    "hover:border-moss-400 hover:text-leaf-200 font-display text-[9px] tracking-[0.16em]";

  return (
    <div className="min-w-0">
      {/* mobile scoreboard strip */}
      <div className="lg:hidden mb-3 grid grid-cols-[1fr_1fr_auto] gap-1.5">
        <div className="border border-pit-600 bg-pit-850/80 px-3 py-1.5">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-fern-300">SCORE</p>
          <p key={hud.score} className="font-display text-lg leading-tight text-leaf-300 score-bump">
            {hud.score}
          </p>
        </div>
        <div className="border border-pit-600 bg-pit-850/80 px-3 py-1.5">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-fern-300 flex items-center gap-1">
            <IconCrown className="w-2.5 h-2.5 text-amber-glow" /> BEST
          </p>
          <p className="font-display text-lg leading-tight text-amber-glow">{Math.max(best, hud.score)}</p>
        </div>
        <div className="flex items-center border border-pit-600 bg-pit-850/80 px-3">
          <span
            className="font-display text-[9px] tracking-[0.16em] px-2 py-1"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* board */}
      <div
        ref={wrapRef}
        className="relative w-full aspect-square max-w-[600px] mx-auto touch-none no-select rounded-[16px] shadow-[0_28px_80px_-28px_rgba(0,0,0,0.9),0_0_70px_-24px_rgba(168,239,76,0.3)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-[16px]" aria-label="Snake game board" />
        <div className="scanlines absolute inset-0 rounded-[16px] pointer-events-none" />

        <span className="corner -left-1.5 -top-1.5 border-l-2 border-t-2 rounded-tl" />
        <span className="corner -right-1.5 -top-1.5 border-r-2 border-t-2 rounded-tr" />
        <span className="corner -left-1.5 -bottom-1.5 border-l-2 border-b-2 rounded-bl" />
        <span className="corner -right-1.5 -bottom-1.5 border-r-2 border-b-2 rounded-br" />

        {/* desktop status pill */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span
            className="flex items-center gap-1.5 font-display text-[9px] tracking-[0.2em] px-2.5 py-1.5 border"
            style={{
              color: meta.color,
              background: meta.bg,
              borderColor: `${meta.color}55`,
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${hud.status === "running" ? "blink-soft" : ""}`}
              style={{ background: meta.color }}
            />
            {meta.label}
          </span>
        </div>

        {hud.status === "ready" && (
          <Overlay onTap={() => engine.start()}>
            <p className="font-display text-[10px] tracking-[0.34em] text-amber-glow">GET READY</p>
            <p className="font-display text-2xl sm:text-[27px] leading-snug text-leaf-200">
              EAT · GROW
              <br />
              <span className="text-fern-300">DON'T CRASH</span>
            </p>
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-fern-300">
              <kbd className="kbd">↑↓←→</kbd>
              <span>or</span>
              <kbd className="kbd">WASD</kbd>
              <span>· swipe on touch</span>
            </p>
            <button
              className={btnPrimary}
              onClick={(e) => {
                engine.start();
                e.currentTarget.blur();
              }}
            >
              <IconPlay className="w-3.5 h-3.5" /> START RUN
            </button>
            <p className="blink-soft font-display text-[8px] tracking-[0.28em] text-fern-300/90">
              TAP ANYWHERE OR PRESS SPACE
            </p>
          </Overlay>
        )}

        {hud.status === "paused" && (
          <Overlay>
            <p className="font-display text-2xl tracking-[0.2em] text-amber-glow">PAUSED</p>
            <p className="text-xs text-fern-300">The garden waits. Score is safe: {hud.score}</p>
            <div className="flex items-center gap-2.5 mt-1">
              <button
                className={btnPrimary}
                onClick={(e) => {
                  engine.resume();
                  e.currentTarget.blur();
                }}
              >
                <IconPlay className="w-3.5 h-3.5" /> RESUME
              </button>
              <button
                className={btnGhost}
                onClick={(e) => {
                  engine.restart();
                  e.currentTarget.blur();
                }}
              >
                <IconRestart className="w-3.5 h-3.5" /> RESTART
              </button>
            </div>
            <p className="font-display text-[8px] tracking-[0.28em] text-fern-300/80">SPACE TO RESUME</p>
          </Overlay>
        )}

        {hud.status === "over" && (
          <Overlay onTap={() => engine.start()}>
            {isNewBest && (
              <span className="badge-flash font-display text-[9px] tracking-[0.24em] text-amber-glow border border-amber-glow/60 bg-amber-glow/10 px-3 py-1.5">
                ★ NEW BEST ★
              </span>
            )}
            <p className="font-display text-[26px] sm:text-3xl text-berry-400" style={{ textShadow: "0 0 26px rgba(255,99,84,0.45)" }}>
              GAME OVER
            </p>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-fern-300">SCORE</p>
                <p className="font-display text-4xl text-leaf-300">{hud.score}</p>
              </div>
              <div className="w-px h-10 bg-pit-600" />
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-fern-300">BEST</p>
                <p className="font-display text-4xl text-amber-glow">{Math.max(best, hud.score)}</p>
              </div>
            </div>
            <p className="text-[11px] text-fern-300">
              {hud.apples} apple{hud.apples === 1 ? "" : "s"} · length {hud.length} · {DIFFICULTIES[difficulty].tag}
            </p>
            <button
              className={btnPrimary}
              onClick={(e) => {
                engine.restart();
                e.currentTarget.blur();
              }}
            >
              <IconRestart className="w-3.5 h-3.5" /> RUN IT BACK
            </button>
            <p className="blink-soft font-display text-[8px] tracking-[0.28em] text-fern-300/90">ENTER / TAP TO RETRY</p>
          </Overlay>
        )}
      </div>

      {/* control deck */}
      <div className="mt-4 flex items-center justify-between gap-4 max-w-[600px] mx-auto">
        <div className="lg:hidden">
          <DPad
            onDir={(d) => engine.steer(d)}
            onCenter={() => engine.togglePause()}
            centerIcon={hud.status === "running" ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5" />}
            centerLabel={hud.status === "running" ? "Pause" : "Start or resume"}
          />
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          <button
            className={chip}
            onClick={(e) => {
              engine.togglePause();
              e.currentTarget.blur();
            }}
            aria-label={hud.status === "running" ? "Pause game" : "Start or resume game"}
          >
            {hud.status === "running" ? <IconPause className="w-3.5 h-3.5" /> : <IconPlay className="w-3.5 h-3.5" />}
            {hud.status === "running" ? "PAUSE" : hud.status === "paused" ? "RESUME" : "START"}
          </button>
          <button
            className={chip}
            onClick={(e) => {
              engine.restart();
              e.currentTarget.blur();
            }}
            aria-label="Restart game"
          >
            <IconRestart className="w-3.5 h-3.5" /> RESTART
          </button>
        </div>
      </div>

      <p className="hidden lg:block text-center text-[11px] text-fern-300/70 mt-3 tracking-wide">
        <kbd className="kbd">SPACE</kbd> pause · <kbd className="kbd">R</kbd> restart ·{" "}
        <kbd className="kbd">M</kbd> mute — speed ramps up with every apple
      </p>
    </div>
  );
}

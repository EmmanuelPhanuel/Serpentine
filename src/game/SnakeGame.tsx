import { useEffect, useRef, useState, type ReactNode } from "react";
import { SnakeEngine, type Difficulty, type HudData } from "./engine";
import { LevelProgress } from "../components/WorldUI";
import { worldForLevel, type SnakeColor } from "./worlds";
import { renderGame } from "./renderer";
import { handleGameKey, swipeDirection } from "./input";
import { sfx } from "./audio";
import { DPad, IconPause, IconPlay, IconRestart, IconCrown } from "../components/ui";

interface Props {
  difficulty: Difficulty;
  snakeColor: SnakeColor;
  best: number;
  onScore: (score: number) => void;
  onHud: (hud: HudData) => void;
}

const STATUS_META: Record<HudData["status"], { label: string; color: string; bg: string }> = {
  ready: { label: "READY", color: "#ffc857", bg: "rgba(255,200,87,0.12)" },
  running: { label: "LIVE", color: "#a8ef4c", bg: "rgba(168,239,76,0.12)" },
  paused: { label: "PAUSED", color: "#ff6354", bg: "rgba(255,99,84,0.12)" },
  won: { label: "COMPLETE", color: "#ffc857", bg: "rgba(255,200,87,0.12)" },
  over: { label: "WRECKED", color: "#ff6354", bg: "rgba(255,99,84,0.14)" },
};

function Overlay({ children, onTap }: { children: ReactNode; onTap?: () => void }) {
  return (
    <div
      className="pop-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5 game-overlay backdrop-blur-[2.5px] text-center px-5"
      onClick={(e) => {
        if (!(e.target as Element).closest("button")) onTap?.();
      }}
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

export default function SnakeGame({ snakeColor, difficulty, best, onScore, onHud }: Props) {
  const engineRef = useRef<SnakeEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SnakeEngine(difficulty, snakeColor);
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

  const [hud, setHud] = useState<HudData>(() => engine.getHud());
  const [levelNotice, setLevelNotice] = useState<number | null>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);

  /* --- wire engine callbacks --- */
  useEffect(() => {
    engine.onHud = (h) => {
      setHud(h);
      onHudRef.current(h);
    };
    onHudRef.current(engine.getHud());
    let levelTimer: number | undefined;
    const clearLevelNotice = () => { window.clearTimeout(levelTimer); setLevelNotice(null); };
    let bestTimer: number | undefined;
    const clearBestTimer = () => { window.clearTimeout(bestTimer); bestTimer = undefined; };
    engine.onEvent = (ev) => {
      switch (ev) {
        case "eat":
          sfx.eat(engine.apples);
          onScoreRef.current(engine.score);
          break;
        case "level":
          window.clearTimeout(levelTimer);
          setLevelNotice(engine.level);
          sfx.level();
          levelTimer = window.setTimeout(() => setLevelNotice(null), 2600);
          break;
        case "reset":
          clearLevelNotice();
          clearBestTimer();
          break;
        case "win":
          clearLevelNotice();
          clearBestTimer();
          bestTimer = window.setTimeout(() => sfx.best(), 180);
          break;
        case "die":
          clearLevelNotice();
          sfx.die();
          if (engine.score > 0 && engine.score > bestAtStartRef.current) {
            clearBestTimer();
            bestTimer = window.setTimeout(() => sfx.best(), 380);
          }
          break;
        case "start":
          clearBestTimer();
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
      clearBestTimer();
      window.clearTimeout(levelTimer);
      engine.onHud = undefined;
      engine.onEvent = undefined;
    };
  }, [engine]);

  useEffect(() => { engine.snakeColor = snakeColor; }, [engine, snakeColor]);

  useEffect(() => {
    if (engine.difficulty !== difficulty) engine.setDifficulty(difficulty);
    bestAtStartRef.current = bestRef.current;
  }, [difficulty, engine]);

  useEffect(() => {
    if (hud.status === "paused" || hud.status === "over" || hud.status === "won") resultRef.current?.focus();
    else if (hud.status === "running") wrapRef.current?.focus({ preventScroll: true });
  }, [hud.status]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      engine.reducedMotion = preference.matches;
      if (preference.matches) { engine.particles = []; engine.floaters = []; }
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, [engine]);

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
        renderGame(engine, ctx, s, now);
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
    const onKey = (e: KeyboardEvent) => handleGameKey(e, engine);
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
    if (e.touches.length !== 1) { touchRef.current = null; return; }
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current || e.touches.length !== 1) { touchRef.current = null; return; }
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dir = swipeDirection(dx, dy, sizeRef.current);
    if (!dir) return;
    engine.steer(dir);
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = () => {
    touchRef.current = null;
  };

  const meta = STATUS_META[hud.status];
  const isNewBest = (hud.status === "over" || hud.status === "won") && hud.score > 0 && hud.score > bestAtStartRef.current;
  const chip =
    "btn-arcade flex items-center justify-center gap-2 h-11 px-4 border border-pit-600 bg-pit-800/90 text-fern-200 " +
    "hover:border-moss-400 hover:text-leaf-200 font-display text-[9px] tracking-[0.16em]";

  return (
    <div className="min-w-0">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {hud.status === "won" ? `Board completed. Final score ${hud.score}.` : hud.status === "over" ? `Game over. Final score ${hud.score}.` : hud.status === "paused" ? "Game paused." : hud.status === "running" ? "Game running." : "Ready to play."}
      </p>
      <LevelProgress level={hud.level} score={hud.score} length={hud.length} />
      <div className="level-notice" role="status" aria-live="polite" aria-atomic="true">
        {levelNotice ? <span key={levelNotice} className="level-arrival">{worldForLevel(levelNotice).symbol} LEVEL {levelNotice} · {worldForLevel(levelNotice).name}</span> : <span className="text-fern-300">{worldForLevel(hud.level).description}</span>}
      </div>
      {/* mobile scoreboard strip */}
      <div className="xl:hidden mb-3 grid grid-cols-[1fr_1fr_auto] gap-1.5">
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
        tabIndex={0}
        role="group"
        aria-label="Snake game. Arrow keys or WASD to steer; Space to pause."
        className="game-board relative w-full aspect-square max-w-[600px] mx-auto touch-none no-select rounded-[16px] shadow-[0_28px_80px_-28px_rgba(0,0,0,0.9),0_0_70px_-24px_rgba(168,239,76,0.3)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
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
              onClick={() => {
                engine.start();
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
            <p ref={resultRef} tabIndex={-1} className="font-display text-2xl tracking-[0.2em] text-amber-glow">PAUSED</p>
            <p className="text-xs text-fern-300">Take a breath. Score is safe: {hud.score}</p>
            <div className="flex flex-wrap justify-center items-center gap-2.5 mt-1">
              <button
                className={btnPrimary}
                onClick={() => {
                  engine.resume();
                }}
              >
                <IconPlay className="w-3.5 h-3.5" /> RESUME
              </button>
              <button
                className={btnGhost}
                onClick={() => {
                  engine.restart();
                }}
              >
                <IconRestart className="w-3.5 h-3.5" /> RESTART
              </button>
            </div>
            <p className="font-display text-[8px] tracking-[0.28em] text-fern-300/80">SPACE TO RESUME</p>
          </Overlay>
        )}

        {(hud.status === "over" || hud.status === "won") && (
          <Overlay onTap={() => engine.start()}>
            {isNewBest && (
              <span className="badge-flash font-display text-[9px] tracking-[0.24em] text-amber-glow border border-amber-glow/60 bg-amber-glow/10 px-3 py-1.5">
                ★ NEW BEST ★
              </span>
            )}
            <p ref={resultRef} tabIndex={-1} className="font-display text-[26px] sm:text-3xl text-berry-400" style={{ textShadow: "0 0 26px rgba(255,99,84,0.45)" }}>
              {hud.status === "won" ? "YOU WIN!" : "GAME OVER"}
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
              Level {hud.level} · {worldForLevel(hud.level).name} · {hud.apples} apples
            </p>
            <button
              className={btnPrimary}
              onClick={() => {
                engine.restart();
              }}
            >
              <IconRestart className="w-3.5 h-3.5" /> RUN IT BACK
            </button>
            <p className="blink-soft font-display text-[8px] tracking-[0.28em] text-fern-300/90">ENTER / TAP TO RETRY</p>
          </Overlay>
        )}
      </div>

      {/* control deck */}
      <div className="game-control-deck mt-4 max-w-[600px] mx-auto">
        <div className="touch-pad">
          <DPad
            onDir={(d) => engine.steer(d)}
            onCenter={() => engine.togglePause()}
            centerIcon={hud.status === "running" ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5" />}
            centerLabel={hud.status === "running" ? "Pause" : "Start or resume"}
          />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2">
          <button
            className={chip}
            onClick={() => {
              engine.togglePause();
            }}
            aria-label={hud.status === "running" ? "Pause game" : "Start or resume game"}
          >
            {hud.status === "running" ? <IconPause className="w-3.5 h-3.5" /> : <IconPlay className="w-3.5 h-3.5" />}
            {hud.status === "running" ? "PAUSE" : hud.status === "paused" ? "RESUME" : "START"}
          </button>
          <button
            className={chip}
            onClick={() => {
              engine.restart();
            }}
            aria-label="Restart game"
          >
            <IconRestart className="w-3.5 h-3.5" /> RESTART
          </button>
        </div>
      </div>

      <p className="hidden xl:block text-center text-[11px] text-fern-300/70 mt-3 tracking-wide">
        <kbd className="kbd">SPACE</kbd> pause · <kbd className="kbd">R</kbd> restart ·{" "}
        <kbd className="kbd">M</kbd> mute — speed ramps up with every apple
      </p>
    </div>
  );
}

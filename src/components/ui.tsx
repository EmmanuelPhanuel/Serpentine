import type { ReactNode } from "react";
import { DIFFICULTIES, type Difficulty, type HudData } from "../game/engine";

/* ---------------- icons ---------------- */

export const SnakeLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
    <path
      d="M6 24c0 3 2.6 5 6 5h8c4.4 0 8-3.1 8-7.5S24.4 14 20 14h-8c-3 0-5-1.8-5-4s2-4 5-4h9"
      stroke="#a8ef4c"
      strokeWidth="4.4"
      strokeLinecap="round"
    />
    <circle cx="24.5" cy="6" r="3.4" fill="#a8ef4c" />
    <circle cx="25.6" cy="5.2" r="1.1" fill="#07130c" />
    <path d="M28.5 4.5l2.4-1.6M28.5 4.5l2.6.9" stroke="#ff6354" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconPlay = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
    <path d="M4.5 2.8v10.4c0 .5.55.8.98.53l8.06-5.2a.63.63 0 000-1.06L5.48 2.27a.63.63 0 00-.98.53z" />
  </svg>
);

export const IconPause = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
    <rect x="3.2" y="2.5" width="3.4" height="11" rx="1" />
    <rect x="9.4" y="2.5" width="3.4" height="11" rx="1" />
  </svg>
);

export const IconRestart = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9" />
    <path d="M13.7 1.6v3.1h-3.1" />
  </svg>
);

export const IconSoundOn = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 18 18" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 6.5h2.6L9 3.2v11.6L5.1 11.5H2.5z" fill="currentColor" stroke="none" />
    <path d="M11.8 6.2a3.4 3.4 0 010 5.6M13.8 4.2a6.2 6.2 0 010 9.6" />
  </svg>
);

export const IconSoundOff = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 18 18" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <path d="M2.5 6.5h2.6L9 3.2v11.6L5.1 11.5H2.5z" fill="currentColor" stroke="none" />
    <path d="M12 6.8l4.4 4.4M16.4 6.8L12 11.2" />
  </svg>
);

export const IconCrown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 18 16" className={className} fill="currentColor" aria-hidden>
    <path d="M1.8 12.6L1 4.9l4.3 3L9 2.2l3.7 5.7 4.3-3-.8 7.7z" />
    <rect x="1.8" y="13.4" width="14.4" height="1.8" rx="0.6" />
  </svg>
);

const Chevron = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 14.5l6-6 6 6" />
  </svg>
);

/* ---------------- panels ---------------- */

export const Panel = ({
  title,
  children,
  className = "",
  accent = "#a8ef4c",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  accent?: string;
}) => (
  <section
    className={`relative border border-pit-600 bg-pit-850/80 shadow-[inset_0_1px_0_rgba(211,247,160,0.06),0_12px_32px_-18px_rgba(0,0,0,0.9)] ${className}`}
  >
    <span className="absolute left-0 top-0 h-[3px] w-10" style={{ background: accent }} />
    <h3 className="font-display text-[10px] tracking-[0.22em] text-fern-300 px-4 pt-3.5 pb-2 border-b border-pit-700/70">
      {title}
    </h3>
    <div className="p-4">{children}</div>
  </section>
);

export function ScorePanel({ hud, best }: { hud: HudData; best: number }) {
  const isRecord = hud.score > 0 && hud.score >= best && best > 0;
  return (
    <Panel title="SCOREBOARD">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-fern-300">CURRENT</p>
          <p
            key={hud.score}
            className={`font-display text-4xl leading-none text-leaf-300 score-bump ${hud.score > 0 ? "" : "opacity-60"}`}
          >
            {hud.score}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-fern-300 flex items-center justify-end gap-1">
            <IconCrown className="w-3 h-3 text-amber-glow" /> BEST
          </p>
          <p className={`font-display text-2xl leading-none ${isRecord ? "text-amber-glow" : "text-fern-200"}`}>{best}</p>
          {isRecord && <p className="font-display text-[8px] text-amber-glow tracking-widest mt-1 blink-soft">RECORD!</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="LENGTH" value={String(hud.length)} />
        <Stat label="APPLES" value={String(hud.apples)} />
        <Stat label="SPEED" value={`${hud.tps}/s`} />
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-pit-700 bg-pit-800/70 px-2 py-2 text-center">
      <p className="text-[9px] font-semibold tracking-[0.18em] text-fern-300">{label}</p>
      <p className="font-display text-sm text-leaf-200 mt-0.5">{value}</p>
    </div>
  );
}

/* ---------------- difficulty ---------------- */

const SPEED_DOTS: Record<Difficulty, number> = { chill: 1, classic: 2, turbo: 3 };

export function DifficultyPanel({
  value,
  bests,
  onChange,
  compact = false,
  disabled = false,
}: {
  value: Difficulty;
  bests: Record<Difficulty, number>;
  onChange: (d: Difficulty) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const diffs = Object.entries(DIFFICULTIES) as [Difficulty, (typeof DIFFICULTIES)[Difficulty]][];

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {diffs.map(([key, cfg]) => {
          const active = key === value;
          return (
            <button
              key={key}
              onClick={(e) => {
                onChange(key);
                e.currentTarget.blur();
              }}
              className={`btn-arcade font-display text-[10px] tracking-wider px-2 py-2.5 border ${
                active
                  ? "bg-leaf-300 text-pit-900 border-leaf-300 shadow-[0_3px_0_#3d6b2a]"
                  : "bg-pit-850 text-fern-300 border-pit-600 hover:border-moss-400 hover:text-leaf-200"
              }`}
            >
              {cfg.tag}
              <span className={`block text-[8px] mt-1 ${active ? "text-pit-700" : "text-fern-300/60"}`}>
                ★ {bests[key] || 0}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {diffs.map(([key, cfg]) => {
        const active = key === value;
        return (
          <button
            key={key}
            disabled={disabled}
            onClick={(e) => {
              onChange(key);
              e.currentTarget.blur();
            }}
            className={`btn-arcade w-full text-left px-3.5 py-3 border group relative overflow-hidden ${
              active
                ? "border-leaf-300/80 bg-pit-700/70 shadow-[0_0_24px_-8px_rgba(168,239,76,0.5)]"
                : "border-pit-600 bg-pit-850/60 hover:border-moss-400 hover:bg-pit-800"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="flex items-center justify-between">
              <span className={`font-display text-xs tracking-wider ${active ? "text-leaf-300" : "text-fern-200"}`}>
                {cfg.tag}
              </span>
              <span className="flex items-center gap-1" aria-label={`speed ${SPEED_DOTS[key]} of 3`}>
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rotate-45 ${
                      i <= SPEED_DOTS[key] ? (active ? "bg-amber-glow" : "bg-moss-400") : "bg-pit-600"
                    }`}
                  />
                ))}
              </span>
            </span>
            <span className="block text-[11px] text-fern-300 mt-1 leading-snug">{cfg.blurb}</span>
            <span className="mt-2 flex items-center justify-between text-[10px] font-semibold tracking-[0.14em]">
              <span className={active ? "text-amber-glow" : "text-fern-300/70"}>
                BEST {bests[key] > 0 ? bests[key] : "—"}
              </span>
              <span className={active ? "text-leaf-200" : "text-fern-300/50"}>×{cfg.mult} PTS</span>
            </span>
            {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-leaf-300" />}
          </button>
        );
      })}
      <p className="text-[10px] text-fern-300/70 leading-relaxed pt-1">
        Switching pace resets the run. Speed also ramps up with every apple you eat.
      </p>
    </div>
  );
}

/* ---------------- controls guide ---------------- */

export function ControlsGuide() {
  const Row = ({ k, label }: { k: ReactNode; label: string }) => (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-fern-200">{label}</span>
      <span className="flex items-center gap-1">{k}</span>
    </li>
  );
  return (
    <ul className="divide-y divide-pit-700/60">
      <Row
        k={
          <>
            <kbd className="kbd">↑↓←→</kbd>
            <kbd className="kbd">WASD</kbd>
          </>
        }
        label="Steer"
      />
      <Row k={<kbd className="kbd">SPACE</kbd>} label="Start / pause" />
      <Row k={<kbd className="kbd">ENTER</kbd>} label="Start / retry" />
      <Row k={<kbd className="kbd">R</kbd>} label="Quick restart" />
      <Row k={<kbd className="kbd">M</kbd>} label="Mute" />
      <li className="py-2 text-[11px] text-fern-300/80 leading-relaxed">
        On touch: <span className="text-leaf-200">swipe</span> the board to steer, or use the pad below it.
      </li>
    </ul>
  );
}

/* ---------------- D-pad ---------------- */

export function DPad({
  onDir,
  onCenter,
  centerIcon,
  centerLabel,
}: {
  onDir: (d: { x: number; y: number }) => void;
  onCenter: () => void;
  centerIcon: ReactNode;
  centerLabel: string;
}) {
  const btn =
    "btn-arcade flex items-center justify-center w-14 h-14 border border-pit-600 bg-pit-800/90 text-leaf-200 " +
    "active:bg-pit-700 active:text-leaf-300 shadow-[0_3px_0_rgba(0,0,0,0.45)] touch-none no-select";

  const press = (d: { x: number; y: number }) => (e: React.PointerEvent) => {
    e.preventDefault();
    onDir(d);
  };

  return (
    <div
      className="grid grid-cols-3 gap-1.5"
      onContextMenu={(e) => e.preventDefault()}
      role="group"
      aria-label="Touch controls"
    >
      <span />
      <button className={btn} onPointerDown={press({ x: 0, y: -1 })} aria-label="Move up">
        <Chevron />
      </button>
      <span />
      <button className={btn} onPointerDown={press({ x: -1, y: 0 })} aria-label="Move left">
        <Chevron className="w-6 h-6 -rotate-90" />
      </button>
      <button
        className={`${btn} !bg-pit-700 !text-amber-glow !border-amber-glow/40`}
        onPointerDown={(e) => {
          e.preventDefault();
          onCenter();
        }}
        aria-label={centerLabel}
      >
        {centerIcon}
      </button>
      <button className={btn} onPointerDown={press({ x: 1, y: 0 })} aria-label="Move right">
        <Chevron className="w-6 h-6 rotate-90" />
      </button>
      <span />
      <button className={btn} onPointerDown={press({ x: 0, y: 1 })} aria-label="Move down">
        <Chevron className="w-6 h-6 rotate-180" />
      </button>
      <span />
    </div>
  );
}

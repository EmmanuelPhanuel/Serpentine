/* Tiny WebAudio synth — no samples, safe to call before any user gesture
   (it lazily creates/resumes the context inside event handlers). */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; slideTo?: number; delay?: number } = {},
) {
  const c = ac();
  if (!c) return;
  const { type = "square", vol = 0.055, slideTo, delay = 0 } = opts;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  eat(apples: number) {
    const f = 340 + Math.min(apples, 24) * 26;
    tone(f, 0.07, { type: "square", vol: 0.05 });
    tone(f * 1.5, 0.09, { type: "square", vol: 0.04, delay: 0.055 });
  },
  die() {
    tone(320, 0.42, { type: "sawtooth", vol: 0.07, slideTo: 52 });
    tone(180, 0.3, { type: "triangle", vol: 0.06, slideTo: 40, delay: 0.04 });
  },
  start() {
    tone(392, 0.08, { type: "square", vol: 0.045 });
    tone(523, 0.08, { type: "square", vol: 0.045, delay: 0.08 });
    tone(659, 0.12, { type: "square", vol: 0.05, delay: 0.16 });
  },
  pause() {
    tone(494, 0.07, { type: "triangle", vol: 0.05 });
    tone(330, 0.1, { type: "triangle", vol: 0.05, delay: 0.07 });
  },
  resume() {
    tone(330, 0.07, { type: "triangle", vol: 0.05 });
    tone(494, 0.1, { type: "triangle", vol: 0.05, delay: 0.07 });
  },
  level() {
    [440, 554, 659].forEach((f, i) => tone(f, 0.13, { type: "triangle", vol: 0.045, delay: i * 0.08 }));
  },
  best() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: "square", vol: 0.05, delay: i * 0.09 }));
  },
};

/**
 * Tiny synthesized UI sound effects via the Web Audio API - no asset files,
 * just short, subtle blips for clicks, dice rolls and crit/fail tones.
 *
 * Gated by a plugin setting (configure via {@link configureSound}); the
 * AudioContext is created lazily on first use - always inside a user gesture
 * (a click or roll), so autoplay policies are satisfied - and every call is a
 * silent no-op when disabled or unsupported.
 */

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.3;
/** Per-category enables (default on): UI clicks, dice rolls, crit/fail tones. */
const cats = { ui: true, dice: true, crit: true };

/** Categories that can be muted independently of the master toggle. */
export interface SoundCategories {
  ui?: boolean;
  dice?: boolean;
  crit?: boolean;
}

/** Apply the current settings (called on load and whenever they change). */
export function configureSound(on: boolean, vol: number, categories?: SoundCategories): void {
  enabled = on;
  volume = Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : 0.3));
  if (categories) {
    cats.ui = categories.ui !== false;
    cats.dice = categories.dice !== false;
    cats.crit = categories.crit !== false;
  }
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Blip {
  freq: number;
  type?: OscillatorType;
  /** Seconds. */
  dur?: number;
  /** Relative loudness (the master stays subtle regardless). */
  gain?: number;
  /** Frequency delta swept across the blip (Hz; may be negative). */
  sweep?: number;
}

function blip({ freq, type = "sine", dur = 0.06, gain = 1, sweep = 0 }: Blip, delay = 0): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t0 + dur);
  const peak = Math.max(0.0002, volume * gain * 0.14); // keep everything quiet
  g.gain.setValueAtTime(0.0002, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0002, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Short, subtle effects keyed to UI events. */
export const sfx = {
  /** A faint click for steppers, value edits, ratings. */
  tick(): void {
    if (cats.ui) blip({ freq: 520, type: "triangle", dur: 0.03, gain: 0.5 });
  },
  /** A slightly brighter blip for checkbox/state toggles. */
  toggle(): void {
    if (cats.ui) blip({ freq: 680, type: "triangle", dur: 0.045, gain: 0.6 });
  },
  /** A soft tumble when a roll starts. */
  roll(): void {
    if (cats.dice) blip({ freq: 300, type: "sawtooth", dur: 0.05, gain: 0.4, sweep: 140 });
  },
  /** A tiny tap as a die lands. */
  settle(): void {
    if (cats.dice) blip({ freq: 430, type: "sine", dur: 0.025, gain: 0.3 });
  },
  /** A pleasant ascending chime for a critical hit. */
  crit(): void {
    if (!cats.crit) return;
    blip({ freq: 660, type: "sine", dur: 0.12, gain: 0.85 }, 0);
    blip({ freq: 990, type: "sine", dur: 0.14, gain: 0.8 }, 0.08);
    blip({ freq: 1320, type: "sine", dur: 0.18, gain: 0.7 }, 0.16);
  },
  /** A low descending buzz for a critical fail. */
  fail(): void {
    if (!cats.crit) return;
    blip({ freq: 220, type: "sawtooth", dur: 0.18, gain: 0.7, sweep: -110 }, 0);
    blip({ freq: 160, type: "square", dur: 0.16, gain: 0.45 }, 0.07);
  },
};

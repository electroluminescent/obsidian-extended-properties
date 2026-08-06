/**
 * Tick marks for a slider or a timeline: where the lines go, and what a value
 * snaps to. Pure - no Obsidian, no DOM - so the arithmetic is testable on its
 * own and shared by both surfaces.
 */

/** One line on the scale. */
export interface Tick {
  value: number;
  /** Primary lines are drawn over secondary ones and win where they meet. */
  major: boolean;
}

/** More lines than this over a range is a wall of pixels, not a scale. */
export const MAX_TICKS = 400;

/** Whether two values on this scale are the same line. */
function same(a: number, b: number, span: number): boolean {
  return Math.abs(a - b) <= (span || 1) * 1e-9;
}

/** Every multiple of `step` from `min` to `max`, `min` itself included. */
function marks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  if (!(step > 0) || !(max > min)) return out;
  if ((max - min) / step > MAX_TICKS) return out;
  // Counted from a whole number of steps rather than accumulated, so a
  // fractional step does not drift along the scale.
  const first = Math.ceil(min / step);
  for (let i = first; ; i++) {
    const v = i * step;
    if (v > max + step * 1e-9) break;
    if (v >= min - step * 1e-9) out.push(v);
  }
  return out;
}

/**
 * The lines to draw between `min` and `max`. A secondary line that lands on a
 * primary one is dropped, so only the primary is drawn where they overlap.
 */
export function ticksFor(min: number, max: number, major?: number, minor?: number): Tick[] {
  const span = max - min;
  const majors = marks(min, max, Number(major) || 0);
  const out: Tick[] = majors.map((value) => ({ value, major: true }));
  for (const value of marks(min, max, Number(minor) || 0)) {
    if (majors.some((m) => same(m, value, span))) continue;
    out.push({ value, major: false });
  }
  return out.sort((a, b) => a.value - b.value);
}

/**
 * The finest half-interval: the furthest a value can be pulled without
 * reaching the next line, and so the largest snapping range worth offering.
 */
export function maxSnapRange(major?: number, minor?: number): number {
  const steps = [Number(major) || 0, Number(minor) || 0].filter((s) => s > 0);
  return steps.length ? Math.min(...steps) / 2 : 0;
}

/**
 * Pull `v` onto the nearest line within `range`. Ties go to a primary line,
 * and a range of zero (or no lines) leaves the value alone.
 */
export function snapValue(v: number, ticks: Tick[], range: number): number {
  if (!(range > 0) || !ticks.length) return v;
  let best: Tick | null = null;
  let bestDist = Infinity;
  for (const t of ticks) {
    const d = Math.abs(t.value - v);
    if (d > range) continue;
    if (d < bestDist || (d === bestDist && t.major && !best?.major)) {
      best = t;
      bestDist = d;
    }
  }
  return best ? best.value : v;
}

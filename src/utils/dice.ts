/**
 * Dice model: parsing, formatting and rolling of "NdS" specs.
 *
 * Pure functions - UI for choosing dice lives in the rolling feature module.
 * A spec is persisted as its notation string (e.g. "2d6") so it stays
 * readable in frontmatter and settings.
 */

/** Die sizes offered as one-click presets. */
export const DICE_PRESETS = [2, 4, 6, 8, 10, 12, 20, 100];

export interface DiceSpec {
  /** Number of dice rolled together (>= 1). */
  count: number;
  /** Faces per die (>= 2). */
  sides: number;
}

/** The default die for roll buttons that don't configure one. */
export const DEFAULT_DICE: DiceSpec = { count: 1, sides: 20 };

/** Format a spec as notation: 1d20 -> "d20", 2d6 -> "2d6". */
export function formatDice(spec: DiceSpec): string {
  return (spec.count > 1 ? spec.count : "") + "d" + spec.sides;
}

/** Whether a spec is the implicit default (a single d20). */
export function isDefaultDice(spec: DiceSpec): boolean {
  return spec.count === DEFAULT_DICE.count && spec.sides === DEFAULT_DICE.sides;
}

/**
 * Parse "NdS" notation ("d20", "2d6", "3D8"). Whitespace tolerated.
 * Returns null when invalid (count/sides out of sane bounds).
 */
export function parseDice(text: string | undefined | null): DiceSpec | null {
  if (!text) return null;
  const m = String(text).trim().match(/^(\d*)\s*[dD]\s*(\d+)$/);
  if (!m) return null;
  const count = m[1] ? parseInt(m[1]) : 1;
  const sides = parseInt(m[2]);
  if (!Number.isFinite(count) || !Number.isFinite(sides)) return null;
  if (count < 1 || count > 100 || sides < 2 || sides > 10000) return null;
  return { count, sides };
}

/** Parse, falling back to the default single d20. */
export function parseDiceOrDefault(text: string | undefined | null): DiceSpec {
  return parseDice(text) ?? { ...DEFAULT_DICE };
}

export interface DicePool {
  /** Individual die results. */
  faces: number[];
  /** Sum of all faces. */
  total: number;
}

/** Roll one pool of `spec`. */
export function rollPool(spec: DiceSpec): DicePool {
  const faces: number[] = [];
  for (let i = 0; i < spec.count; i++) faces.push(1 + Math.floor(Math.random() * spec.sides));
  return { faces, total: faces.reduce((a, b) => a + b, 0) };
}

/** All dice showed their maximum face (a "crit" for any pool size). */
export function isMaxPool(spec: DiceSpec, pool: DicePool): boolean {
  return pool.faces.every((f) => f === spec.sides);
}

/** All dice showed 1. */
export function isMinPool(pool: DicePool): boolean {
  return pool.faces.every((f) => f === 1);
}

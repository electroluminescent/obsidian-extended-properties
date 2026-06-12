/**
 * Stylized die icons — isometric outlines keyed by face count, registered
 * as Obsidian icons so they work in menus, buttons and inline tags alike.
 * The same shapes ship as standalone SVG files under `assets/dice/`.
 *
 * All icons live in a 0–100 viewBox and draw with `currentColor`, so they
 * inherit the surrounding text color.
 */

import { addIcon } from "obsidian";

/** Stroke-path helper (shared look for every die). */
const P = (d: string): string =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;

/** Icon id → SVG body (100×100 viewBox). */
export const DICE_ICONS: Record<string, string> = {
  // Coin: circle with an equator.
  "ep-d2":
    `<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="7"/>` +
    P("M16 62 H84"),
  // Tetrahedron: triangle with the front edge.
  "ep-d4": P("M50 10 L90 84 L10 84 Z") + P("M50 10 L50 84"),
  // Cube, isometric: hexagon silhouette + the three visible edges.
  "ep-d6":
    P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") +
    P("M12 28 L50 50 L88 28 M50 50 L50 94"),
  // Octahedron: diamond split along the equator.
  "ep-d8": P("M50 6 L90 50 L50 94 L10 50 Z") + P("M10 50 H90"),
  // Pentagonal trapezohedron: kite with the visible face edges.
  "ep-d10":
    P("M50 6 L88 45 L50 94 L12 45 Z") +
    P("M12 45 L50 60 L88 45 M50 6 L50 60"),
  // Dodecahedron: pentagon silhouette + inner face.
  "ep-d12":
    P("M50 8 L90 39 L75 86 L25 86 L10 39 Z") +
    P("M50 30 L67 43 L61 63 L39 63 L33 43 Z"),
  // Icosahedron: hexagon silhouette + central face and connectors.
  "ep-d20":
    P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") +
    P("M50 22 L78 66 L22 66 Z") +
    P("M50 6 L50 22 M88 72 L78 66 M12 72 L22 66"),
  // Percentile: a pair of d10 kites.
  "ep-d100":
    P("M30 18 L52 47 L30 82 L10 47 Z") +
    P("M70 18 L90 47 L70 82 L48 47 Z"),
  // Fallback for custom face counts.
  "ep-dx":
    P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") +
    `<circle cx="50" cy="52" r="7" fill="currentColor"/>`,
};

/** Register all die icons (call once at plugin load). */
export function registerDiceIcons(): void {
  for (const [id, svg] of Object.entries(DICE_ICONS)) addIcon(id, svg);
}

/** Icon id for a die with `sides` faces (generic icon for custom sizes). */
export function diceIconId(sides: number): string {
  const map: Record<number, string> = {
    2: "ep-d2",
    4: "ep-d4",
    6: "ep-d6",
    8: "ep-d8",
    10: "ep-d10",
    12: "ep-d12",
    20: "ep-d20",
    100: "ep-d100",
  };
  return map[sides] ?? "ep-dx";
}

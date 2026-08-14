/**
 * The finishes: what is laid over a value's colour.
 *
 * Each is a class in the stylesheet built from gradients and blend modes -
 * nothing is downloaded, nothing is an image - and each composes OVER the
 * colour the palette chose rather than replacing it. Which values wear which
 * is decided in `utils/finish`; this is only the list and what each is called.
 *
 * Nothing here runs on a timer, and hovering a row changes nothing. What does
 * move is the light: one lamp for the whole screen, driven by the pointer
 * (see `lamp.ts`), which every finish reads through the same few custom
 * properties. Each is blended into the colour rather than painted over it,
 * with the blend its own material asks for - a sheen is light added, a weave
 * is cloth shading what lies under it.
 */

import type { I18n } from "../../i18n/i18n";

/** Every finish, in the order the settings offer them. */
export const FINISHES = [
  "matte", "sheen", "mirror", "foil", "spectra", "prism", "opal", "nebula",
  "beacon", "glitter", "crackle", "satin", "weave", "relief", "hammered",
] as const;

export type FinishId = (typeof FINISHES)[number];

/**
 * Finishes that need a surface to be a surface: a weave, a raised edge, a
 * beaten face - none of them mean anything laid over a line of bare text,
 * where there is no material for the light to land on.
 */
export const NEEDS_FILL: ReadonlySet<string> = new Set([
  "matte", "satin", "weave", "relief", "hammered",
]);

/** What a finish is called. */
export function finishName(i18n: I18n, id: string): string {
  return i18n.t("finish." + id);
}

/** The class that draws it. */
export const finishClass = (id: string): string => "ep-fin-" + id;

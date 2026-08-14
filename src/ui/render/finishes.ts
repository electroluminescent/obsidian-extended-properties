/**
 * The finishes: what is laid over a value's colour.
 *
 * Each is a class in the stylesheet built from gradients and blend modes -
 * nothing is downloaded, nothing is an image - and each composes OVER the
 * colour the palette chose rather than replacing it. Which values wear which
 * is decided in `utils/finish`; this is only the list and what each is called.
 *
 * Nothing here moves. A finish is a surface, not an animation: each is
 * blended into the colour rather than painted over it - the blend mode is the
 * finish's own, since a gloss is light added and a linen is a weave shading
 * what is under it - so hovering a row changes nothing about how it is drawn.
 */

import type { I18n } from "../../i18n/i18n";

/** Every finish, in the order the settings offer them. */
export const FINISHES = [
  "matte", "gloss", "foil", "prismatic", "holographic", "iridescent", "satin",
  "emboss", "sparkle", "linen", "crystal", "radiant", "hammered",
] as const;

export type FinishId = (typeof FINISHES)[number];

/**
 * Finishes that need a surface to be a surface: a weave, a raised edge, a
 * beaten face - none of them mean anything laid over a line of bare text,
 * where there is no material for the light to land on.
 */
export const NEEDS_FILL: ReadonlySet<string> = new Set([
  "matte", "satin", "linen", "emboss", "hammered",
]);

/** What a finish is called. */
export function finishName(i18n: I18n, id: string): string {
  return i18n.t("finish." + id);
}

/** The class that draws it. */
export const finishClass = (id: string): string => "ep-fin-" + id;

/**
 * The finishes: what is laid over a value's colour.
 *
 * Each is a class in the stylesheet built from gradients and blend modes -
 * nothing is downloaded, nothing is an image - and each composes OVER the
 * colour the palette chose rather than replacing it. Which values wear which
 * is decided in `utils/finish`; this is only the list and what each is called.
 *
 * Nothing here moves. A finish is a surface, not an animation: it is blended
 * into the colour (every texture is built around mid-grey, which `overlay`
 * leaves alone), so hovering a row changes nothing about how it is drawn.
 */

import type { I18n } from "../../i18n/i18n";

/** Every finish, in the order the settings offer them. */
export const FINISHES = [
  "gloss", "matte", "holographic", "reverse-holo", "foil", "prismatic", "refractor",
  "chrome", "cracked-ice", "cosmic", "shimmer", "metallic", "canvas", "die-cut",
  "parallel", "mojo", "wave", "negative", "etch", "prizm",
] as const;

export type FinishId = (typeof FINISHES)[number];

/**
 * Finishes that need something to shape or texture: a cut edge and a woven
 * surface mean nothing on a line of bare text.
 */
export const NEEDS_FILL: ReadonlySet<string> = new Set(["die-cut", "canvas", "parallel", "cracked-ice"]);

/** What a finish is called. */
export function finishName(i18n: I18n, id: string): string {
  return i18n.t("finish." + id);
}

/** The class that draws it. */
export const finishClass = (id: string): string => "ep-fin-" + id;

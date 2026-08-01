/**
 * How a value opens for editing outside edit mode.
 *
 * Edit mode is for arranging a layout, so a single click there has always
 * opened the value. Outside it the plugin has required a double click, which
 * protects a value from a stray click but makes the sidebar a poor data-entry
 * surface: an empty text field is a tiny target, and a checkbox has to be hit
 * twice in quick succession.
 *
 * Rather than pick one, each surface carries its own setting. The default is
 * "double" everywhere - the behaviour every existing vault already has.
 */

/** A surface with its own activation setting. */
export type ActivationSurface = "values" | "checkboxes" | "modifiers" | "inline" | "table";

/** How a surface activates: one click, or two. */
export type ActivationMode = "single" | "double";

/** Every surface, in the order the settings tab lists them. */
export const ACTIVATION_SURFACES: ActivationSurface[] = [
  "values",
  "checkboxes",
  "modifiers",
  "inline",
  "table",
];

interface ActivationSettings {
  activation?: Record<string, string>;
}

/** The gesture that opens `surface` outside edit mode (default: double). */
export function activationFor(settings: ActivationSettings, surface: ActivationSurface): ActivationMode {
  return settings.activation?.[surface] === "single" ? "single" : "double";
}

/** Persist a surface's mode, dropping the entry when it is back to default. */
export function setActivation(
  settings: ActivationSettings,
  surface: ActivationSurface,
  mode: ActivationMode
): void {
  if (mode === "single") (settings.activation ??= {})[surface] = "single";
  else if (settings.activation) delete settings.activation[surface];
}

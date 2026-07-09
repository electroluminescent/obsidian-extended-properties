/**
 * The catalog of built-in, individually disableable features.
 *
 * Feature modules (rolling, dnd5e, inline, third-party) register through
 * {@link FeatureModule} and are toggled the same way; this file covers the
 * CORE surfaces - optional value types and interface features - so that
 * every part of the plugin can be switched off from settings.
 *
 * All features default to enabled: a feature is off only when
 * `settings.features[id] === false`, so existing installs are unaffected.
 * Disabling a feature never touches stored data - layouts, note
 * frontmatter and per-entry options are kept, and properties whose value
 * type is disabled fall back to the plain text renderer.
 */

import type { EPSettings } from "./model";

/** Whether a feature (core or module) is enabled in the given settings. */
export const featureOn = (settings: EPSettings, id: string): boolean => settings.features[id] !== false;

/** A core feature the user can disable from the Features settings section. */
export interface CoreFeature {
  id: string;
  /** Value type ids this feature registers (omitted for interface features). */
  typeIds?: string[];
}

/**
 * Optional value types. Text and number are the plugin's foundation - the
 * fallback renderer and the numeric systems - and are always registered.
 */
export const TYPE_FEATURES: CoreFeature[] = [
  { id: "decimal", typeIds: ["decimal"] },
  { id: "derived", typeIds: ["derived"] }, // + the modifier system
  { id: "list", typeIds: ["list"] },
  { id: "checkbox", typeIds: ["checkbox"] },
  { id: "color", typeIds: ["color"] },
  { id: "formula", typeIds: ["formula"] },
  { id: "image", typeIds: ["image"] },
  { id: "media", typeIds: ["audio", "video", "pdf"] },
  { id: "iframe", typeIds: ["iframe"] },
  { id: "rating", typeIds: ["rating"] },
  { id: "link", typeIds: ["link"] },
  { id: "unit", typeIds: ["unit"] },
  { id: "datetime", typeIds: ["datetime"] },
  { id: "date", typeIds: ["date"] },
];

/** Interface features gated at their call sites rather than registration. */
export const UI_FEATURES: CoreFeature[] = [
  { id: "table" }, // the type table view (ribbon, command)
  { id: "sticky" }, // section pinning to the header/footer zones
  { id: "pool" }, // the autofill pool suffix + editor
  { id: "secure" }, // encrypting sensitive values (decryption always works)
  { id: "snapshots" }, // config snapshot commands + automatic snapshots
];

/** Feature id gating a value type id, if any (e.g. "audio" -> "media"). */
export function featureForType(typeId: string): string | undefined {
  for (const f of TYPE_FEATURES) if (f.typeIds?.includes(typeId)) return f.id;
  return undefined;
}

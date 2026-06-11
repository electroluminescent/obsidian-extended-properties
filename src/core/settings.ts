/**
 * Settings defaults and migration.
 *
 * `normalizeSettings` accepts whatever shape was persisted by any previous
 * plugin version (including the single-layout v1 format) and returns a fully
 * populated, current `EPSettings`.
 */

import type { Defaults, EPSettings, Layout } from "./model";
import { defaultDerivations } from "./influences";

export const DEFAULT_DEFAULTS: Defaults = {
  dataType: "text",
  colorSpace: "HSL",
  sectionColumns: 1,
  sectionTransparent: false,
  sectionSticky: false,
  sectionSize: "unlimited",
  sectionCollapsible: true,
  sectionDividers: false,
  fontFamily: "",
  baseSize: 0,
  labelSize: 0,
  valueSize: 0,
  titleSize: 0,
  listSize: 0,
};

/** Build a fresh settings object. `defaultLayout` supplies the type's layout. */
export function defaultSettings(defaultLayout: () => Layout): EPSettings {
  return {
    types: ["Character"],
    layouts: { character: defaultLayout() },
    hideShown: true,
    defaults: { ...DEFAULT_DEFAULTS },
    manualHide: [],
    propMenu: true,
    language: "en",
    stringOverrides: {},
    features: {},
    derivations: defaultDerivations(),
    sourceAbbrs: {},
  };
}

/**
 * Merge persisted `data` (any historical shape, possibly null) into a valid
 * settings object.
 */
export function normalizeSettings(data: any, defaultLayout: () => Layout): EPSettings {
  const s = defaultSettings(defaultLayout);
  if (data) {
    if (data.layouts && data.types) {
      s.types = data.types;
      s.layouts = data.layouts;
    } else if (data.layout?.sections?.length) {
      // v1 stored a single layout for the "Character" type.
      s.types = ["Character"];
      s.layouts = { character: data.layout };
    }
    if (typeof data.hideShown === "boolean") s.hideShown = data.hideShown;
    if (data.defaults) s.defaults = { ...DEFAULT_DEFAULTS, ...data.defaults };
    if (Array.isArray(data.manualHide)) s.manualHide = data.manualHide;
    if (typeof data.propMenu === "boolean") s.propMenu = data.propMenu;
    if (typeof data.language === "string") s.language = data.language;
    if (data.stringOverrides && typeof data.stringOverrides === "object") s.stringOverrides = data.stringOverrides;
    if (data.features && typeof data.features === "object") s.features = data.features;
    // An explicitly persisted (even empty) list wins over the seeds.
    if (Array.isArray(data.derivations))
      s.derivations = data.derivations.filter((d: any) => d && typeof d.id === "string");
    if (data.sourceAbbrs && typeof data.sourceAbbrs === "object") s.sourceAbbrs = data.sourceAbbrs;
  }
  if (!s.types.length) s.types = ["Character"];
  for (const t of s.types) {
    const k = t.toLowerCase();
    if (!s.layouts[k]?.sections) s.layouts[k] = defaultLayout();
  }
  return s;
}

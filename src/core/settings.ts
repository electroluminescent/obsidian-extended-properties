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

/**
 * Build a fresh settings object. There is no default type: types are
 * created by the user (or adopted from a note's Type value) and start with
 * an empty layout; template sections are added explicitly afterwards.
 */
export function defaultSettings(): EPSettings {
  return {
    types: [],
    layouts: {},
    hideShown: true,
    defaults: { ...DEFAULT_DEFAULTS },
    manualHide: [],
    propMenu: true,
    language: "en",
    stringOverrides: {},
    features: {},
    derivations: defaultDerivations(),
    sourceAbbrs: {},
    modDepth: 8,
    diceAnim: true,
    diceAnimRolls: 10,
    diceAnimStay: false,
    diceAnimBlock: true,
    modsOffProp: "Modifiers Off",
    macros: [],
    rollHistory: [],
    rollHistoryLimit: 500,
    rollHistoryEnabled: true,
    critRanges: {},
    failOnOne: true,
    modifierSuffix: "s",
    crossNote: true,
  };
}

/**
 * Merge persisted `data` (any historical shape, possibly null) into a valid
 * settings object.
 */
export function normalizeSettings(data: any, defaultLayout: () => Layout): EPSettings {
  const s = defaultSettings();
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
    if (typeof data.modDepth === "number" && data.modDepth >= 0)
      s.modDepth = Math.min(32, Math.floor(data.modDepth));
    if (typeof data.diceAnim === "boolean") s.diceAnim = data.diceAnim;
    if (typeof data.diceAnimRolls === "number" && data.diceAnimRolls >= 1)
      s.diceAnimRolls = Math.min(60, Math.floor(data.diceAnimRolls));
    if (typeof data.diceAnimStay === "boolean") s.diceAnimStay = data.diceAnimStay;
    if (typeof data.diceAnimBlock === "boolean") s.diceAnimBlock = data.diceAnimBlock;
    if (data.karmicRolls === true) s.karmicRolls = true;
    if (typeof data.modsOffProp === "string" && data.modsOffProp.trim())
      s.modsOffProp = data.modsOffProp.trim();
    if (Array.isArray(data.macros))
      s.macros = data.macros
        .filter((m: any) => m && typeof m.id === "string" && typeof m.name === "string")
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          segs: Array.isArray(m.segs) ? m.segs.filter((x: any) => x && typeof x === "object") : [],
          mode: m.mode === "advantage" || m.mode === "disadvantage" ? m.mode : undefined,
          times: typeof m.times === "number" && m.times > 1 ? Math.min(20, Math.floor(m.times)) : undefined,
          typeKey: typeof m.typeKey === "string" && m.typeKey ? m.typeKey : undefined,
        }));
    if (Array.isArray(data.rollHistory))
      s.rollHistory = data.rollHistory.filter((r: any) => r && typeof r === "object" && typeof r.id === "string");
    if (typeof data.rollHistoryLimit === "number" && data.rollHistoryLimit > 0)
      s.rollHistoryLimit = Math.min(5000, Math.floor(data.rollHistoryLimit));
    if (data.rollHistoryEnabled === false) s.rollHistoryEnabled = false;
    if (data.critRanges && typeof data.critRanges === "object") {
      const out: Record<string, number> = {};
      for (const k of Object.keys(data.critRanges)) {
        const v = Number((data.critRanges as Record<string, unknown>)[k]);
        if (Number.isFinite(v) && v >= 1) out[k] = Math.floor(v);
      }
      s.critRanges = out;
    }
    if (data.failOnOne === false) s.failOnOne = false;
    if (typeof data.modifierSuffix === "string") s.modifierSuffix = data.modifierSuffix;
    if (data.crossNote === false) s.crossNote = false;
  }
  for (const t of s.types) {
    const k = t.toLowerCase();
    if (!s.layouts[k]?.sections) s.layouts[k] = defaultLayout();
  }
  return s;
}

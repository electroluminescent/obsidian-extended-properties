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
    diceAnimMs: 1500,
    diceAnimStyle: "classic",
    dice3dAA: false,
    sound: true,
    soundVolume: 0.3,
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
 * Every top-level settings key `normalizeSettings` reads and sanitizes
 * explicitly. Any persisted key NOT in this set is carried over verbatim (see
 * the end of `normalizeSettings`), so settings written by a newer plugin
 * version — or top-level keys saved by a third-party module through the public
 * API — survive a load → save round-trip instead of being silently dropped.
 */
const HANDLED_KEYS: ReadonlySet<string> = new Set([
  "types", "layouts", "layout", "hideShown", "defaults", "manualHide",
  "propMenu", "language", "stringOverrides", "features", "derivations",
  "sourceAbbrs", "modDepth", "diceAnim", "diceAnimRolls", "diceAnimMs", "diceAnimStyle", "dice3dAA",
  "sound", "soundVolume", "diceAnimStay", "diceAnimBlock", "karmicRolls",
  "modsOffProp", "macros", "rollHistory", "rollHistoryLimit",
  "rollHistoryEnabled", "critRanges", "failOnOne", "modifierSuffix",
  "crossNote", "conflictGuard", "tableLayouts", "tableLastType",
  "schemaVersion", "soundUi", "soundDice", "soundCrit", "layoutVault",
  "layoutVaultFolder", "appVersion", "snapshots", "snapshotKeep", "lastSnapshot",
  "inlineEntries",
]);

/** Coerce a persisted `types` value to a clean list of non-empty strings. */
function cleanTypes(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === "string" && t.trim() !== "") : [];
}

/**
 * Structural validation for persisted layouts — the largest user-authored
 * blob in `data.json`, and until now the least checked one (`inlineEntries`
 * got the same treatment in v3.7.0). A layout must be an object with a
 * `sections` array; sections must be objects (a missing `entries` becomes an
 * empty array); entries must be plain objects. All unrecognized fields are
 * preserved untouched, keeping the forward-compatibility guarantee.
 */
function cleanLayouts(raw: unknown): Record<string, Layout> {
  const out: Record<string, Layout> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, l] of Object.entries(raw as Record<string, unknown>)) {
    if (!l || typeof l !== "object" || !Array.isArray((l as Record<string, unknown>).sections)) continue;
    const lay = l as unknown as Layout;
    const sections = lay.sections
      .filter((sec) => !!sec && typeof sec === "object" && !Array.isArray(sec))
      .map((sec) => ({
        ...sec,
        entries: Array.isArray(sec.entries)
          ? sec.entries.filter((e) => !!e && typeof e === "object" && !Array.isArray(e))
          : [],
      }));
    out[k] = { ...lay, sections };
  }
  return out;
}

/**
 * Merge persisted `data` (any historical shape, possibly null) into a valid
 * settings object.
 */
export function normalizeSettings(data: any, defaultLayout: () => Layout): EPSettings {
  const s = defaultSettings();
  if (data) {
    if (data.layouts && data.types) {
      s.types = cleanTypes(data.types);
      s.layouts = cleanLayouts(data.layouts);
    } else if (data.layout?.sections?.length) {
      // v1 stored a single layout for the "Character" type.
      s.types = ["Character"];
      s.layouts = cleanLayouts({ character: data.layout });
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
    if (typeof data.diceAnimMs === "number" && data.diceAnimMs >= 300)
      s.diceAnimMs = Math.min(10000, Math.floor(data.diceAnimMs));
    if (typeof data.diceAnimStyle === "string") s.diceAnimStyle = data.diceAnimStyle;
    if (data.dice3dAA === false) s.dice3dAA = false;
    if (data.sound === false) s.sound = false;
    if (typeof data.soundVolume === "number" && data.soundVolume >= 0)
      s.soundVolume = Math.min(1, data.soundVolume);
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
    if (data.conflictGuard === false) s.conflictGuard = false;
    if (data.tableLayouts && typeof data.tableLayouts === "object") s.tableLayouts = data.tableLayouts;
    // Inline `ep-sheet` entries keyed by block id — validate the shape so a
    // corrupt/foreign value can't crash the inline renderer (it only ever
    // reads `Entry`-shaped objects out of this map).
    if (data.inlineEntries && typeof data.inlineEntries === "object") {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data.inlineEntries as Record<string, unknown>)) {
        if (v && typeof v === "object" && typeof (v as Record<string, unknown>).kind === "string") clean[k] = v;
      }
      s.inlineEntries = clean as EPSettings["inlineEntries"];
    }
    if (typeof data.tableLastType === "string") s.tableLastType = data.tableLastType;
    if (typeof data.schemaVersion === "number") s.schemaVersion = data.schemaVersion;
    if (data.soundUi === false) s.soundUi = false;
    if (data.soundDice === false) s.soundDice = false;
    if (data.soundCrit === false) s.soundCrit = false;
    if (data.layoutVault === true) s.layoutVault = true;
    if (typeof data.layoutVaultFolder === "string" && data.layoutVaultFolder.trim())
      s.layoutVaultFolder = data.layoutVaultFolder.trim();
    if (typeof data.appVersion === "string") s.appVersion = data.appVersion;
    if (data.snapshots === true) s.snapshots = true;
    if (typeof data.snapshotKeep === "number" && data.snapshotKeep > 0)
      s.snapshotKeep = Math.min(200, Math.floor(data.snapshotKeep));
    if (typeof data.lastSnapshot === "number") s.lastSnapshot = data.lastSnapshot;
    // Carry-over guard: preserve any keys we don't explicitly handle above
    // (forward-compat settings from a newer version, or top-level keys written
    // by a third-party module) so user customizations are never lost on load.
    for (const k of Object.keys(data))
      if (!HANDLED_KEYS.has(k)) (s as unknown as Record<string, unknown>)[k] = (data as Record<string, unknown>)[k];
  }
  for (const t of s.types) {
    const k = t.toLowerCase();
    if (!s.layouts[k]?.sections) s.layouts[k] = defaultLayout();
  }
  return s;
}


// ---------------------------------------------------------------------------
// Versioned schema migrations (roadmap D3)
// ---------------------------------------------------------------------------

/** Current settings schema version. Bump when adding a migration step below. */
export const CURRENT_SCHEMA = 1;

/** One ordered migration step: bring settings up to schema `to`. */
export interface Migration {
  to: number;
  name: string;
  /** Mutate `s` in place; return true if anything actually changed. */
  run(s: EPSettings): boolean;
}

/**
 * Ordered core migration steps. `normalizeSettings` still coerces legacy shapes
 * (the pre-versioning "sniff"); these run after it for explicit, tested version
 * transforms, and {@link runSchemaMigrations} stamps `schemaVersion` so each
 * step runs at most once. Feature modules contribute their own steps via
 * `FeatureModule.migrations`.
 */
export const SCHEMA_MIGRATIONS: Migration[] = [
  {
    to: 1,
    name: "dedupe-types-and-prune-orphan-tables",
    run: (s) => {
      let changed = false;
      // De-duplicate note types case-insensitively (keep the first spelling).
      const seen = new Set<string>();
      const deduped = s.types.filter((tp) => {
        const k = tp.toLowerCase();
        if (seen.has(k)) {
          changed = true;
          return false;
        }
        seen.add(k);
        return true;
      });
      if (changed) s.types = deduped;
      // Drop table views whose type no longer exists.
      if (s.tableLayouts)
        for (const k of Object.keys(s.tableLayouts))
          if (!seen.has(k.toLowerCase())) {
            delete s.tableLayouts[k];
            changed = true;
          }
      return changed;
    },
  },
];

/**
 * Run every step newer than `s.schemaVersion`, in order, then stamp the current
 * version. Pure and idempotent — a second run is a no-op. `table` is injectable
 * for tests and for folding in feature-module steps.
 */
export function runSchemaMigrations(
  s: EPSettings,
  table: Migration[] = SCHEMA_MIGRATIONS
): { changed: boolean; from: number; to: number; ran: string[] } {
  const from = typeof s.schemaVersion === "number" ? s.schemaVersion : 0;
  let changed = false;
  const ran: string[] = [];
  for (const m of [...table].sort((a, b) => a.to - b.to)) {
    if (m.to <= from) continue;
    if (m.run(s)) changed = true;
    ran.push(m.name);
  }
  if (s.schemaVersion !== CURRENT_SCHEMA) {
    s.schemaVersion = CURRENT_SCHEMA;
    if (from < CURRENT_SCHEMA) changed = true;
  }
  return { changed, from, to: CURRENT_SCHEMA, ran };
}

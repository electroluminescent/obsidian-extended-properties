/**
 * Persisted data model.
 *
 * These shapes are written to `data.json`, so changes must stay
 * backward-compatible (see {@link normalizeSettings} in `settings.ts` for
 * migrations). The model is deliberately open-ended:
 *
 * - `Entry.kind` and `Entry.dataType` are plain strings resolved through the
 *   {@link Registries} at render time, so feature modules can introduce new
 *   kinds and value types without touching this file.
 * - Feature modules may persist extra per-entry fields. They access them
 *   through the `ext()` helper instead of widening the core interface.
 */

import type { ColorSpace } from "../utils/color";

/** Height presets used by sections and image entries. */
export type SectionSize = "s" | "m" | "l" | "unlimited";

/** How a section arranges its entries. */
export type LayoutMode = "list" | "columns" | "grid";

/** Generic, feature-agnostic fields of a sidebar entry. */
export interface EntryBase {
  /** Stable id used for drag & drop and FLIP animations. */
  id: string;
  /** Entry kind id, resolved via the entry-kind registry ("prop", "blank", "toc", …). */
  kind: string;
  /** For kind "prop": the frontmatter key this entry shows. */
  key?: string;
  /** Optional display label overriding the default. */
  alias?: string;
  /** Value type id, resolved via the value-type registry. Unset = derived. */
  dataType?: string;

  // -- appearance ----------------------------------------------------------
  icon?: string;
  iconColor?: string;
  hideLabel?: boolean;
  /** Hide the whole entry outside edit mode when the value is empty (default true). */
  hideIfEmpty?: boolean;
  /** Show the data-type tag beside the label (default true; space permitting). */
  showType?: boolean;
  /** Show the modifier chain denotation, e.g. INT + DEX (default true). */
  showChain?: boolean;
  /** Show the dice breakdown, e.g. 2d20 (default true). */
  showDice?: boolean;
  /** Show the die icon before the dice breakdown (default true). */
  showDiceIcon?: boolean;
  labelSize?: number;
  valueSize?: number;
  labelColor?: string;
  valueColor?: string;

  // -- numeric value-type options ------------------------------------------
  slider?: boolean;
  /** Slider response: "linear" (default), "root", or "exp". */
  sliderCurve?: string;
  /** Hide the −/+ stepper buttons when false (default: shown). */
  steppers?: boolean;
  /** Unset min/max default to the property's range across all notes. */
  min?: number;
  max?: number;
  clamp?: boolean;
  /** Formula value type: expression mapping slider position → value. */
  formula?: string;

  // -- other value-type options --------------------------------------------
  /** Image value type: height preset. */
  size?: SectionSize;
  iframeScale?: number;
  iframeHeight?: number;

  /** Keep this property visible in Obsidian's own properties panel. */
  showInObsidian?: boolean;
}

/**
 * An entry as stored on disk. The index signature tolerates fields persisted
 * by feature modules (e.g. the D&D module's roll settings).
 */
export type Entry = EntryBase & Record<string, unknown>;

/**
 * View an entry through a feature-defined extension interface.
 * Purely a typing aid — no copying happens.
 *
 * @example
 *   interface RollExt { roll?: RollKind; showMod?: boolean }
 *   const e = ext<RollExt>(entry); if (e.roll) …
 */
export function ext<T extends object>(entry: Entry): EntryBase & Partial<T> {
  return entry as EntryBase & Partial<T>;
}

/** A titled group of entries with its own layout and styling. */
export interface Section {
  id: string;
  title: string;
  /** Column count for "columns" and "grid" layout modes. */
  columns: number;
  /** Layout mode; legacy layouts may omit it (then derived from `columns`). */
  layoutMode?: LayoutMode;
  /** Fixed row count (grid mode only). */
  rows?: number;
  collapsed?: boolean;
  entries: Entry[];

  // -- appearance ----------------------------------------------------------
  accent?: string;
  bg?: string;
  /** Color for buttons and list chips inside the section. */
  controlColor?: string;
  titleSize?: number;
  transparent?: boolean;
  /** Pin into the sticky zone below the header. */
  sticky?: boolean;
  /** Height preset; scrolls internally when limited. */
  size?: SectionSize;
  icon?: string;
  iconColor?: string;
  hideLabel?: boolean;
  collapsible?: boolean;
  /** Horizontal dividers between entries. */
  dividers?: boolean;
  /** Vertical dividers between columns. */
  vdividers?: boolean;
  /** Hide the whole section outside edit mode when no entry is visible (default true). */
  hideIfEmpty?: boolean;
  /** How the options modal groups this section's property tabs. */
  tabGroup?: "column" | "row" | "type";
}

/** Resolve the effective layout mode of a section (legacy fallback). */
export function sectionMode(section: Section): LayoutMode {
  return section.layoutMode ?? (section.columns > 1 ? "columns" : "list");
}

/** A full sidebar layout. One layout exists per note type. */
export interface Layout {
  version: number;
  sections: Section[];
}

/** Current layout schema version. */
export const LAYOUT_VERSION = 4;

/** Defaults applied to newly created properties and sections. */
export interface Defaults {
  /** Value type for new properties with no Obsidian-assigned type. */
  dataType: string;
  colorSpace: ColorSpace;
  sectionColumns: number;
  sectionTransparent: boolean;
  sectionSticky: boolean;
  sectionSize: SectionSize;
  sectionCollapsible: boolean;
  sectionDividers: boolean;
  /** Typography. Sizes in px; 0 = theme default. */
  fontFamily: string;
  baseSize: number;
  labelSize: number;
  valueSize: number;
  titleSize: number;
  listSize: number;
}

/**
 * One link of a saved roll chain: a dice group ("2d6") or a flat number.
 * Mirrors the roller widget's segment so a roller chain serializes verbatim
 * into a macro (and back).
 */
export interface RollSeg {
  dice?: string;
  add?: number;
  /** Property reference name (e.g. "DEX") resolved at roll time. */
  ref?: string;
  /** This term is subtracted rather than added. */
  neg?: boolean;
}

/**
 * A named, reusable roll — a "custom roll object". Stored vault-globally in
 * settings; an optional `typeKey` scopes it to one note type. Until the roll
 * AST lands (roadmap A2) the roll is represented as a segment chain plus the
 * roller's mode/repeat, which is exactly what the roller widget round-trips.
 */
export interface RollMacro {
  id: string;
  name: string;
  segs: RollSeg[];
  /** "advantage" | "disadvantage"; unset = normal. */
  mode?: string;
  /** Simultaneous rolls (unset = 1). */
  times?: number;
  /** Lower-cased note-type key this macro is limited to (unset = global). */
  typeKey?: string;
}

/**
 * One persisted roll result. The durable counterpart to the old per-view log
 * entry: serializable (no closures), so it survives reloads in `data.json`.
 */
export interface RollRecord {
  id: string;
  /** Epoch milliseconds. */
  time: number;
  /** Path of the note the roll was made on (null when none was active). */
  note: string | null;
  /** Note basename, kept for display/export without a vault lookup. */
  noteName?: string;
  /** Roll label including any advantage/disadvantage tag. */
  label: string;
  /** Full roll-chain text (dice, faces, modifier). */
  text: string;
  /** Short form: "label: total". */
  brief: string;
  total: number;
  /** RollMode string. */
  mode: string;
  tone: "normal" | "crit" | "fail";
  /** Primary dice notation ("2d6"). */
  dice?: string;
}

/** Root settings object persisted to `data.json`. */
export interface EPSettings {
  /** Note `Type` values that activate the sidebar; each has a layout. */
  types: string[];
  /** Layouts keyed by lower-cased type name. */
  layouts: Record<string, Layout>;
  /** Hide sidebar-shown properties from Obsidian's properties panel. */
  hideShown: boolean;
  defaults: Defaults;
  /** Properties always hidden from Obsidian's panel. */
  manualHide: string[];
  /** Replace the right-click menu on Obsidian's properties panel. */
  propMenu: boolean;
  /** UI language (locale code, e.g. "en"). */
  language: string;
  /** Per-string user overrides, keyed by i18n string key. */
  stringOverrides: Record<string, string>;
  /** Feature modules toggled off by the user (all enabled by default). */
  features: Record<string, boolean>;
  /**
   * User-editable derivation building blocks (id + name + formula in `x`)
   * available to influences. Seeded with d20-style defaults; see
   * `core/influences.ts`.
   */
  derivations: { id: string; name: string; formula: string }[];
  /**
   * Short-form overrides for modifier denotations, keyed by source
   * property. Missing keys fall back to the capitalized first three
   * letters of the property name.
   */
  sourceAbbrs: Record<string, string>;
  /**
   * Maximum influence chain depth: how many property→property hops are
   * resolved when derived values feed other derived values.
   */
  modDepth: number;
  /** Play the 3D dice-roll animation before committing roll results. */
  diceAnim: boolean;
  /** How many times the dice faces cycle before settling. */
  diceAnimRolls: number;
  /** Keep roll cards on screen by default (clicking always toggles). */
  diceAnimStay: boolean;
  /** Roll cards dim the background and block interaction until dismissed. */
  diceAnimBlock: boolean;
  /** Adaptive ("karmic") rolls: failures build luck debt that converts some future failures into successes. */
  karmicRolls?: boolean;
  /** List property storing modifiers switched off by clicking their short form. */
  modsOffProp: string;
  /** Saved reusable rolls ("custom roll objects"), available on the roll screen and as commands. */
  macros: RollMacro[];
  /** Durable roll history (most-recent-first); pruned to {@link rollHistoryLimit}. */
  rollHistory: RollRecord[];
  /** Maximum stored history entries before FIFO pruning. */
  rollHistoryLimit: number;
  /** Persist roll history across sessions (false = legacy in-memory-only behavior). */
  rollHistoryEnabled: boolean;
  /** Per-die crit thresholds: die-size (as string) → minimum face that counts as a crit. */
  critRanges: Record<string, number>;
  /** Treat an all-1s primary dice result as a fail (default true). */
  failOnOne: boolean;
  /** Suffix that, appended to a reference, resolves to that property's modifier (default "s"). */
  modifierSuffix: string;
  /** Master switch for cross-note references and aggregates (default on). */
  crossNote?: boolean;
  /**
   * Per-reference entry config for inline `vals:` cards whose property is not
   * in a note-type layout. Keyed by the reference (lower-cased key, or
   * `link/key` for cross-note). Lets inline cards carry sliders/rolls/etc.
   */
  inlineEntries?: Record<string, Entry>;
}

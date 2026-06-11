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
  labelSize?: number;
  valueSize?: number;
  labelColor?: string;
  valueColor?: string;

  // -- numeric value-type options ------------------------------------------
  slider?: boolean;
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
}

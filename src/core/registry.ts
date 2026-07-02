/**
 * Extension registries — the seam between the generic core and features.
 *
 * The sidebar never hard-codes what an entry *is*. Instead it looks up:
 *
 * - {@link ValueTypeDef}    how a property value renders/edits ("text", "color", …)
 * - {@link EntryKindDef}    non-property widgets ("toc", roll panel, …)
 * - {@link ClusterAddon}    extra controls attached to numeric entries
 *                           (e.g. the modifier badge + roll button)
 * - {@link DerivationDef}   how a raw source value becomes a modifier term
 *                           (compiled from user-editable settings blocks)
 * - {@link SectionTemplateDef}  one-click section presets in the edit toolbar
 * - {@link LayoutPresetDef}     full default layouts for new note types
 * - {@link SkillPresetDef}      record sets for the legacy "skills" value type
 *
 * A {@link FeatureModule} bundles registrations (plus i18n strings) so a
 * domain — like D&D 5e — lives entirely in `src/features/<id>/` and can be
 * toggled in settings without the core knowing it exists.
 */

import type { Menu } from "obsidian";
import type { I18n } from "../i18n/i18n";
import type { Entry, EPSettings, Layout, Section } from "./model";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "./context";

// ---------------------------------------------------------------------------
// Cluster slots
// ---------------------------------------------------------------------------

/**
 * A named cell in the aligned control cluster of a section
 * (`[before…] [−] [value] [+] [after…]`). All rows of a section share the
 * same slot columns so values line up; rows that don't use a slot render an
 * empty cell.
 */
export interface ClusterSlot {
  id: string;
  /** Extra CSS class for the cell (kept even when the cell is empty). */
  cls?: string;
}

/** What an entry needs from its section's control cluster. */
export interface ClusterNeeds {
  steppers?: boolean;
  before?: ClusterSlot[];
  after?: ClusterSlot[];
}

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

/**
 * Renders and edits one data type of a "prop" entry.
 * Implementations must register live-update functions via
 * `ctx.view.registerUpdater` so external frontmatter changes refresh in place.
 */
export interface ValueTypeDef {
  /** Persisted in `Entry.dataType`. */
  id: string;
  /** Label for type dropdowns. */
  name(i18n: I18n): string;
  /** Span all columns of the section (block-style values). */
  wide?: boolean;
  /** Render the value UI into `ctx.head` / `ctx.extra`. */
  render(ctx: EntryRenderCtx): void;
  /** Cluster columns this type wants (called before any DOM exists). */
  clusterNeeds?(ref: EntryRef): ClusterNeeds;
  /** Contribute rows to the entry-options modal. */
  renderOptions?(ctx: OptionsCtx): void;
  /** Contribute items to the entry's context menu. */
  menuItems?(menu: Menu, ref: EntryRef, pos: { x: number; y: number }): void;
}

// ---------------------------------------------------------------------------
// Entry kinds
// ---------------------------------------------------------------------------

/** Renders one kind of entry. Kind "prop" delegates to value types. */
export interface EntryKindDef {
  /** Persisted in `Entry.kind`. */
  id: string;
  /** Default label when the entry has no alias. */
  defaultLabel(i18n: I18n, entry: Entry): string;
  /** Render into the standard entry shell. */
  render(ctx: EntryRenderCtx): void;
  /** Cluster columns entries of this kind want. */
  clusterNeeds?(ref: EntryRef): ClusterNeeds;
  /** Span all columns of the section (e.g. block lists). */
  wide?: boolean;
  /** Render entirely custom chrome (no shell/label) — used by "blank". */
  bare?: boolean;
  /** Show in the section menu's "Add object" submenu. */
  addable?: boolean;
  /** Contribute rows to the entry-options modal. */
  renderOptions?(ctx: OptionsCtx): void;
}

// ---------------------------------------------------------------------------
// Cluster addons
// ---------------------------------------------------------------------------

/** Live numeric accessors handed to cluster addons by the numeric renderer. */
export interface NumericAccess {
  /** Current committed value. */
  get(): number;
  /** Display label of the entry (alias or key). */
  label: string;
}

/**
 * Attaches extra controls to numeric "prop" entries without the numeric
 * renderer knowing about them. The core modifier system uses this for the
 * denotation badge and toggle checkboxes; the rolling module for its roll
 * button.
 */
export interface ClusterAddon {
  id: string;
  /** Whether this addon applies to the given entry. */
  appliesTo(ref: EntryRef): boolean;
  /** Slots this addon needs when it applies. */
  needs(ref: EntryRef): ClusterNeeds;
  /**
   * Fill the addon's slots. Returns slot-id → cell renderer.
   * Register updaters via `ref.view.registerUpdater` for live refresh.
   */
  fillSlots(ctx: EntryRenderCtx, num: NumericAccess): Record<string, (cell: HTMLElement) => void>;
  /** Live preview while a slider is dragged (before the value commits). */
  onPreview?(ctx: EntryRenderCtx, cells: Record<string, HTMLElement>, value: number): void;
  /** Contribute rows to the entry-options modal. */
  renderOptions?(ctx: OptionsCtx): void;
  /**
   * Clear the fields this addon persists on an entry when the entry is
   * re-pointed at a different property key (per-key configuration rarely
   * survives a re-point meaningfully). Keeps feature-owned fields out of
   * the core view — the view calls every addon's hook instead of knowing
   * the field names.
   */
  onRename?(entry: Entry): void;
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

/**
 * Maps a raw source value to a modifier contribution. Instances are
 * compiled from the user-editable formula blocks in settings (see
 * `core/influences.ts`); "value" (identity) is registered by the core.
 */
export interface DerivationDef {
  /** Referenced by `Influence.mode`. */
  id: string;
  name(i18n: I18n): string;
  apply(raw: number): number;
}

// ---------------------------------------------------------------------------
// Section templates & layout presets
// ---------------------------------------------------------------------------

/** A one-click section preset shown in the edit toolbar's "Add:" row. */
export interface SectionTemplateDef {
  /** Also used as the created section's id, enabling "reset to template". */
  id: string;
  name(i18n: I18n): string;
  build(i18n: I18n): Section;
  /**
   * Source-property entries this template's influences rely on (e.g. the
   * ability scores feeding a skill list). When the template is applied,
   * any of these whose key is missing from the layout is added too, so
   * every modifier source exists as a real, user-editable property.
   */
  sources?(i18n: I18n): Entry[];
}

/** A complete default layout for newly created note types. */
export interface LayoutPresetDef {
  id: string;
  name(i18n: I18n): string;
  build(i18n: I18n): Layout;
}

// ---------------------------------------------------------------------------
// Skill records & presets (consumed by the "skills" value type)
// ---------------------------------------------------------------------------

/**
 * One row of a "skills" property. Stored verbatim (minus undefined fields)
 * as an object inside the property's list value, so everything stays
 * user-editable — in the sidebar, in the options page, or as raw YAML.
 */
export interface SkillRecord {
  /** Display name; also the roll label. */
  name: string;
  /** Property whose value feeds the modifier ("modifying property"). */
  source?: string;
  /** Proficient: the entry's proficiency bonus is added. */
  prof?: boolean;
  /** Dice notation ("2d6"); falls back to the entry's default dice. */
  dice?: string;
  /** Manual modifier override; when set, `source` is ignored. */
  mod?: number;
}

/** A named, feature-provided set of skill records (e.g. the 5e skill list). */
export interface SkillPresetDef {
  id: string;
  name(i18n: I18n): string;
  records(): SkillRecord[];
  /**
   * Legacy list property holding proficient names (pre-record storage).
   * When populating from this preset, matching names become proficient.
   */
  legacyProfKey?: string;
}

// ---------------------------------------------------------------------------
// Registry plumbing
// ---------------------------------------------------------------------------

/** Insertion-ordered id → definition map. */
export class Registry<T extends { id: string }> {
  private items = new Map<string, T>();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  get(id: string | undefined): T | undefined {
    return id === undefined ? undefined : this.items.get(id);
  }

  all(): T[] {
    return [...this.items.values()];
  }

  clear(): void {
    this.items.clear();
  }
}

/** All extension points, owned by the plugin and rebuilt on feature toggles. */
export class Registries {
  readonly valueTypes = new Registry<ValueTypeDef>();
  readonly entryKinds = new Registry<EntryKindDef>();
  readonly clusterAddons = new Registry<ClusterAddon>();
  readonly derivations = new Registry<DerivationDef>();
  readonly sectionTemplates = new Registry<SectionTemplateDef>();
  readonly layoutPresets = new Registry<LayoutPresetDef>();
  readonly skillPresets = new Registry<SkillPresetDef>();
  /** Preset used for brand-new note types. Features may claim this. */
  defaultPresetId = "empty";

  clear(): void {
    this.valueTypes.clear();
    this.entryKinds.clear();
    this.clusterAddons.clear();
    this.derivations.clear();
    this.sectionTemplates.clear();
    this.layoutPresets.clear();
    this.skillPresets.clear();
    this.defaultPresetId = "empty";
  }
}

// ---------------------------------------------------------------------------
// Feature modules
// ---------------------------------------------------------------------------

/** What a feature module gets to work with during registration. */
export interface FeatureContext {
  i18n: I18n;
  registries: Registries;
}

/**
 * A self-contained, user-toggleable bundle of registrations.
 * Implementations must be side-effect free outside `register()`.
 */
export interface FeatureModule {
  id: string;
  name(i18n: I18n): string;
  description(i18n: I18n): string;
  register(ctx: FeatureContext): void;
  /**
   * Upgrade persisted settings written by older plugin versions (e.g.
   * convert legacy entry kinds to current shapes). Called for enabled
   * modules after registries are built. Return true when settings changed.
   */
  migrate?(settings: EPSettings): boolean;
}

// ---------------------------------------------------------------------------
// Per-view services
// ---------------------------------------------------------------------------

/** Optional lifecycle hooks for services stored in a {@link ServiceHub}. */
export interface ViewService {
  /** Called when the sidebar switches to a different note. */
  onFileChange?(): void;
}

/**
 * Lazily-created, per-view service container. Lets features share state
 * between independent renderers (e.g. roll buttons and the roll log) without
 * the view knowing the service exists.
 */
export class ServiceHub {
  private services = new Map<string, ViewService>();

  /** Get the service registered under `key`, creating it on first use. */
  get<T extends ViewService>(key: string, factory: () => T): T {
    let s = this.services.get(key);
    if (!s) {
      s = factory();
      this.services.set(key, s);
    }
    return s as T;
  }

  /** Broadcast a note switch to all services. */
  notifyFileChanged(): void {
    for (const s of this.services.values()) s.onFileChange?.();
  }
}

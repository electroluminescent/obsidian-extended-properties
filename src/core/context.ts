/**
 * Context interfaces - the contracts renderers and features program against.
 *
 * Renderers never receive the concrete sidebar view; they receive a
 * {@link ViewCtx}. This keeps every renderer, modal, and feature module
 * decoupled from the view implementation and makes the dependency surface of
 * each component explicit and testable.
 */

import type { App, TFile } from "obsidian";
import type { I18n } from "../i18n/i18n";
import type { Entry, EPSettings, Layout, Section } from "./model";
import type { ClusterSlot, Registries, ServiceHub } from "./registry";
import type { NoteModel } from "./note-model";
import type { PropertyIndex } from "./property-index";
import type { HideService } from "./hide-service";
import type { HistoryService } from "../features/rolling/history";

/** Aligned slot columns shared by all entries of one section. */
export interface ClusterFlags {
  before: ClusterSlot[];
  steppers: boolean;
  after: ClusterSlot[];
}

/** Options for building one entry's control cluster. */
export interface ClusterOptions {
  /** Current numeric value (editable entries). */
  get?: () => number;
  /** Static display text (non-editable entries). */
  display?: string;
  /** Show -/+ stepper buttons. */
  steppers?: boolean;
  min?: number;
  max?: number;
  float?: boolean;
  clamp?: boolean;
  /** Commit an edited value. Editability = `get` && `commit`. */
  commit?: (v: number) => void;
  /** slot id -> renderer for the slots this entry actually uses. */
  slots?: Record<string, (cell: HTMLElement) => void>;
}

/** DOM references returned by the cluster builder. */
export interface ClusterRefs {
  /** The value cell. */
  val: HTMLElement;
  /** All slot cells by slot id (including unfilled ones). */
  cells: Record<string, HTMLElement>;
}

/** Identifies an entry being rendered, before any DOM exists. */
export interface EntryRef {
  view: ViewCtx;
  file: TFile;
  section: Section;
  entry: Entry;
}

/** Full render context for an entry, including its DOM mount points. */
export interface EntryRenderCtx extends EntryRef {
  /** Single-line row: label + cluster/value. */
  head: HTMLElement;
  /** Full-width area below the head (lists, images, sliders, ...). */
  extra: HTMLElement;
  /** Section-wide cluster columns. */
  flags: ClusterFlags;
  /** Wrapper element (for bare kinds that own their chrome). */
  wrap: HTMLElement;
}

/** Context handed to options-modal contributors. Extends {@link EntryRef}. */
export interface OptionsCtx extends EntryRef {
  /** Container to append `Setting` rows into. */
  container: HTMLElement;
  /** Persist + live-refresh after a change. */
  changed(): void;
  /** Rebuild the modal (after changes that alter which options apply). */
  redraw(): void;
}

/**
 * Everything a renderer may need from the sidebar view.
 * Implemented by `SidebarView`; consumed by entry kinds, value types,
 * cluster addons, menus, modals, and the drag controller.
 */
export interface ViewCtx {
  readonly app: App;
  /** Root element of the view (used for FLIP animations and drop marks). */
  readonly containerEl: HTMLElement;
  readonly i18n: I18n;
  readonly settings: EPSettings;
  readonly registries: Registries;
  /** Frontmatter state of the active note. */
  readonly note: NoteModel;
  /** Vault-wide property queries. */
  readonly props: PropertyIndex;
  /** Hide/show properties in Obsidian's own panel. */
  readonly hide: HideService;
  /** Per-view feature services. */
  readonly hub: ServiceHub;
  /** Plugin-level, persistent roll history (shared by every view). */
  readonly history: HistoryService;

  readonly editMode: boolean;
  /** Layout of the active note's type. */
  readonly layout: Layout;
  /** Lower-cased type key of the shown layout (null = no matching type). */
  readonly activeTypeKey: string | null;

  // -- persistence & refresh ------------------------------------------------
  /** Persist settings (layouts live inside settings). */
  saveLayout(): void;
  /** Full re-render of the sidebar. */
  rerender(): void;
  /** Run registered value updaters (in-place refresh, preserves DOM). */
  refreshValues(): void;
  /** Register a live value updater for the current render pass. */
  registerUpdater(fn: () => void): void;

  // -- entry helpers ----------------------------------------------------
  /** Resolve an entry's effective value type id. */
  resolveType(entry: Entry): string;
  /** Derive a value type for a key (Obsidian type -> current value -> default). */
  deriveType(key: string): string;
  /** Default label for an entry (key or kind label). */
  defaultLabelFor(entry: Entry): string;
  /** Render the standard entry label (editable in edit mode). */
  renderLabel(head: HTMLElement, ctx: EntryRenderCtx): void;
  /** Build the aligned control cluster for an entry. */
  buildCluster(head: HTMLElement, flags: ClusterFlags, o: ClusterOptions): ClusterRefs;
  /** Attach open-on-(double-)click behavior honoring edit mode. */
  bindOpen(el: HTMLElement, open: () => void, markEditable?: boolean): void;
  /** Render text with `[[wiki]]` and `[md](links)` resolved. */
  renderLinks(el: HTMLElement, text: string): void;
  /** Resolve an image property value to a displayable URL. */
  resolveImage(src: string): string;
  /** Open the color picker modal. */
  openColorPicker(initial: string, onPick: (hex: string) => void): void;
  /** Briefly highlight an entry (label click feedback). */
  highlight(el: HTMLElement): void;
  /**
   * Evaluate a `showWhen` condition against the active note. Empty/unparseable/
   * unresolved conditions return true (visible). Used for conditional
   * visibility of entries and sections.
   */
  condVisible(showWhen?: string): boolean;

  // -- sensitive property encryption (L1; optional - only the sidebar view) ----
  /** Synchronous plaintext for an encrypted envelope value, if unlocked & primed. */
  secretReveal?(envelope: string): string | null;
  /** Encrypt a property's current value in place (explicit, confirmed). */
  encryptValueAt?(file: TFile, key: string): void | Promise<void>;
  /** Decrypt a property's value back to plaintext (non-destructive on failure). */
  decryptValueAt?(file: TFile, key: string): void | Promise<void>;

  // -- structural operations -------------------------------------------
  removeEntry(section: Section, entry: Entry): void;
  /** Re-point a "prop" entry at a different key, resetting type-specifics. */
  renameKey(entry: Entry, newKey: string): void;
  openEntryOptions(section: Section, entry: Entry): void;
  /** Open the add-property popup anchored to `anchor`. */
  openAddMenu(anchor: HTMLElement, section: Section, o?: { index?: number; replaceId?: string }): void;
  /** Open the multi-value picker for a list property. */
  openListValuePicker(x: number, y: number, key: string): void;
  scrollToSection(id: string): void;
  /**
   * Candidate keys for property pickers, each with its resolved data type
   * (id + display name), sorted note-first, then by type, then by key - the
   * shared grouping every property list renders.
   * @param includeShown also list keys already shown in the layout
   *                     (e.g. for roll sources or re-pointing an entry)
   */
  propCandidates(
    includeShown?: boolean
  ): { key: string; onNote: boolean; type: string; typeName: string }[];
}

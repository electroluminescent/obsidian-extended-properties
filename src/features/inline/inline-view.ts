/**
 * `vals:` — render a property inline using the *same* value-type renderers the
 * sidebar uses (sliders, color swatches, images, progress bars, lists, …),
 * without any of the sidebar's structural chrome (grips, options buttons,
 * entry context menus) or cluster addons (roll buttons, modifier badges).
 *
 * It does this by driving the real {@link ValueTypeDef.render} against a
 * minimal headless {@link ViewCtx} ({@link InlineViewCtx}) bound to the file's
 * frontmatter via a {@link NoteModel}. Anything unexpected falls back to the
 * plain `val:` chip so an inline reference never renders blank.
 */

import { App, Menu, TFile } from "obsidian";
import type { ClusterFlags, ClusterOptions, ClusterRefs, EntryRenderCtx, ViewCtx } from "../../core/context";
import type { Entry, EPSettings, Layout, Section } from "../../core/model";
import type { I18n } from "../../i18n/i18n";
import { Registries, Registry } from "../../core/registry";
import type { ClusterAddon } from "../../core/registry";
import { ServiceHub } from "../../core/registry";
import type { PropertyIndex } from "../../core/property-index";
import type { HideService } from "../../core/hide-service";
import type { HistoryService } from "../rolling/history";
import { NoteModel } from "../../core/note-model";
import { buildCluster, emptyFlags, mergeNeeds } from "../../ui/render/cluster";
import { renderLinkedText } from "../../ui/components/links";
import { ColorPickerModal } from "../../ui/modals/color-picker";
import { keyForShortForm } from "../../core/influences";
import { parseNoteRef } from "../../core/note-ref";
import type { InlineCtx } from "./inline-render";
import { makeValEl } from "./inline-render";

/**
 * A minimal {@link ViewCtx} for rendering a single property value inline.
 * Implements the rendering surface the value types use; structural operations
 * (drag, add/remove, options) are no-ops — `vals:` only displays a value.
 */
class InlineViewCtx implements ViewCtx {
  readonly app: App;
  readonly containerEl: HTMLElement;
  readonly i18n: I18n;
  readonly settings: EPSettings;
  readonly registries: Registries;
  readonly note: NoteModel;
  readonly props: PropertyIndex;
  readonly hide: HideService;
  readonly hub = new ServiceHub();
  readonly history: HistoryService;
  readonly editMode = false;
  readonly layout: Layout = { version: 0, sections: [] };
  readonly activeTypeKey: string | null = null;

  private updaters: (() => void)[] = [];

  constructor(ctx: InlineCtx, file: TFile, mount: HTMLElement, private redraw: () => void) {
    this.app = ctx.app;
    this.i18n = ctx.i18n;
    this.settings = ctx.settings;
    this.props = ctx.props;
    this.hide = ctx.hide;
    this.history = ctx.history;
    this.containerEl = mount;
    // Reuse the real value-type and entry-kind registries, but with no cluster
    // addons — roll buttons and modifier badges are sidebar-only extras.
    this.registries = Object.assign(Object.create(Registries.prototype), ctx.registries, {
      clusterAddons: new Registry<ClusterAddon>(),
    }) as Registries;
    this.note = new NoteModel(this.app, this.i18n, {
      onLightChange: () => this.refreshValues(),
      onFullChange: () => this.redraw(),
      captureUndo: () => false,
    });
    this.note.load(file);
  }

  // -- refresh -----------------------------------------------------------------
  refreshValues(): void {
    for (const u of this.updaters) {
      try { u(); } catch { /* one broken updater must not kill the pass */ }
    }
  }
  registerUpdater(fn: () => void): void { this.updaters.push(fn); }
  saveLayout(): void { /* no persistent layout inline */ }
  rerender(): void { this.redraw(); }

  // -- entry helpers -----------------------------------------------------------
  resolveType(entry: Entry): string {
    if (entry.dataType) return entry.dataType;
    return this.deriveType(entry.key ?? "");
  }
  deriveType(key: string): string {
    const assigned = this.props.obsidianType(key);
    if (assigned) return assigned;
    const v = this.note.raw[key];
    if (Array.isArray(v)) return "list";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "checkbox";
    return this.settings.defaults.dataType;
  }
  defaultLabelFor(entry: Entry): string {
    const kind = this.registries.entryKinds.get(entry.kind);
    return kind ? kind.defaultLabel(this.i18n, entry) : entry.kind;
  }
  renderLabel(): void { /* vals shows the value only — no label */ }
  buildCluster(head: HTMLElement, flags: ClusterFlags, o: ClusterOptions): ClusterRefs {
    return buildCluster(head, flags, o, (el, open) => this.bindOpen(el, open));
  }
  bindOpen(el: HTMLElement, open: () => void, markEditable = true): void {
    if (markEditable) el.addClass("ep-editable");
    el.setAttr("title", this.i18n.t("hint.dblEdit"));
    el.ondblclick = () => open();
  }
  renderLinks(el: HTMLElement, text: string): void {
    renderLinkedText(this.app, el, text, this.note.path || "");
  }
  resolveImage(src: string): string {
    src = (src || "").trim();
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const f = this.app.metadataCache.getFirstLinkpathDest(path, this.note.path || "");
    if (f) return this.app.vault.getResourcePath(f);
    const af = this.app.vault.getAbstractFileByPath(path);
    if (af instanceof TFile) return this.app.vault.getResourcePath(af);
    return path;
  }
  openColorPicker(initial: string, onPick: (hex: string) => void): void {
    new ColorPickerModal(
      {
        app: this.app,
        i18n: this.i18n,
        getColorSpace: () => this.settings.defaults.colorSpace,
        setColorSpace: (sp) => { this.settings.defaults.colorSpace = sp; },
      },
      initial,
      onPick
    ).open();
  }
  highlight(): void { /* no sidebar to highlight into */ }

  // -- structural ops (unused inline) -----------------------------------------
  removeEntry(): void {}
  renameKey(): void {}
  openEntryOptions(): void {}
  openAddMenu(): void {}
  openListValuePicker(): void {}
  scrollToSection(): void {}
  propCandidates(): { key: string; onNote: boolean }[] { return []; }
}

/**
 * Build a `vals:` element: the property `body` (a key, short form, or
 * `[[note]].key`) rendered with its sidebar value-type UI. Falls back to the
 * plain `val:` chip on any error. `onEditSource` adds an "Edit source" menu
 * item (Live Preview) to reveal the raw text.
 */
export function makeValsEl(ctx: InlineCtx, file: TFile, body: string, onEditSource?: () => void): HTMLElement {
  const wrap = createSpan({ cls: "ep-inline-vals" });
  const draw = (): void => {
    wrap.empty();
    try {
      const noteRef = parseNoteRef(body);
      let target = file;
      let ref = body;
      if (noteRef && noteRef.accessor) {
        const lf = ctx.app.metadataCache.getFirstLinkpathDest(noteRef.link, file.path);
        if (!lf) throw new Error("unresolved note link");
        target = lf;
        ref = noteRef.accessor;
      }
      const view = new InlineViewCtx(ctx, target, wrap, draw);
      const key = keyForShortForm(ctx.settings, ref, Object.keys(view.note.raw)) ?? ref;
      const entry: Entry = { id: "ep-inline", kind: "prop", key };
      const section: Section = { id: "ep-inline", title: "", columns: 1, entries: [entry] };
      const def =
        view.registries.valueTypes.get(view.resolveType(entry)) ?? view.registries.valueTypes.get("text");
      if (!def) throw new Error("no value type");
      const head = wrap.createSpan({ cls: "ep-inline-vals-head" });
      const extra = wrap.createSpan({ cls: "ep-inline-vals-extra" });
      const flags = emptyFlags();
      mergeNeeds(flags, def.clusterNeeds?.({ view, file: target, section, entry }));
      const ectx: EntryRenderCtx = { view, file: target, section, entry, head, extra, flags, wrap };
      def.render(ectx);
    } catch {
      wrap.empty();
      wrap.appendChild(makeValEl(ctx, file, body, onEditSource));
    }
  };
  draw();
  if (onEditSource) {
    wrap.oncontextmenu = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const menu = new Menu();
      menu.addItem((i) => i.setTitle(ctx.i18n.t("inline.editSource")).setIcon("code").onClick(onEditSource));
      menu.showAtMouseEvent(ev);
    };
  }
  return wrap;
}

/**
 * `vals:` — render a property inline as the *same* card the sidebar shows:
 * label, the value-type UI (sliders, swatches, images, lists, …) and cluster
 * addons (roll buttons, modifier badges), with a context menu that opens the
 * standard entry-options modal (enable sliders, steppers, rolls, etc.).
 *
 * It drives the real {@link EntryKindDef}/{@link ValueTypeDef} renderers against
 * a minimal headless {@link ViewCtx} ({@link InlineViewCtx}) bound to the file's
 * frontmatter via a {@link NoteModel}. The entry it renders is, in order of
 * preference: the matching prop entry in the note-type layout (so the card and
 * its options stay in sync with the sidebar), otherwise a persistent per-
 * reference entry kept in `settings.inlineEntries`. Anything unexpected falls
 * back to the plain `val:` chip so an inline reference never renders blank.
 */

import { App, Menu, setIcon, TFile } from "obsidian";
import type { ClusterFlags, ClusterOptions, ClusterRefs, EntryRenderCtx, ViewCtx } from "../../core/context";
import type { Entry, EPSettings, Layout, Section } from "../../core/model";
import type { I18n } from "../../i18n/i18n";
import type { Registries } from "../../core/registry";
import { ServiceHub } from "../../core/registry";
import type { PropertyIndex } from "../../core/property-index";
import type { HideService } from "../../core/hide-service";
import type { HistoryService } from "../rolling/history";
import { NoteModel } from "../../core/note-model";
import { buildCluster, emptyFlags, mergeNeeds } from "../../ui/render/cluster";
import { renderLinkedText } from "../../ui/components/links";
import { ColorPickerModal } from "../../ui/modals/color-picker";
import { EntryOptionsModal } from "../../ui/modals/entry-options";
import { keyForShortForm } from "../../core/influences";
import { parseNoteRef } from "../../core/note-ref";
import type { InlineCtx } from "./inline-render";
import { makeValEl } from "./inline-render";

/** The note-type layout for a file (or null when no configured type matches). */
function layoutForFile(ctx: InlineCtx, file: TFile): Layout | null {
  const raw = ctx.facade.raw(file);
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== undefined ? raw[tk] : undefined;
  const types = Array.isArray(tv) ? tv.map(String) : tv === undefined || tv === null ? [] : [String(tv)];
  const match = ctx.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return null;
  const layout = ctx.settings.layouts[match.toLowerCase()];
  return layout && Array.isArray(layout.sections) ? layout : null;
}

/** Find a prop entry (with its section) for `key` in `layout`, case-insensitive. */
function findPropEntry(layout: Layout, key: string): { section: Section; entry: Entry } | null {
  const kl = key.toLowerCase();
  for (const section of layout.sections)
    for (const entry of section.entries)
      if (entry.kind === "prop" && entry.key && (entry.key as string).toLowerCase() === kl)
        return { section, entry };
  return null;
}

/**
 * A minimal {@link ViewCtx} for rendering a single property card inline.
 * Implements the rendering + options surface the entry/value renderers use;
 * structural layout operations are no-ops (an inline card has no grid).
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
  readonly layout: Layout;
  readonly activeTypeKey: string | null = null;

  private updaters: (() => void)[] = [];

  constructor(
    private ctx: InlineCtx,
    private target: TFile,
    layout: Layout | null,
    mount: HTMLElement,
    private redraw: () => void
  ) {
    this.app = ctx.app;
    this.i18n = ctx.i18n;
    this.settings = ctx.settings;
    this.registries = ctx.registries;
    this.props = ctx.props;
    this.hide = ctx.hide;
    this.history = ctx.history;
    this.containerEl = mount;
    this.layout = layout ?? { version: 0, sections: [] };
    this.note = new NoteModel(this.app, this.i18n, {
      onLightChange: () => this.refreshValues(),
      onFullChange: () => this.redraw(),
      captureUndo: () => false,
    });
    this.note.load(target);
  }

  // -- refresh -----------------------------------------------------------------
  refreshValues(): void {
    for (const u of this.updaters) {
      try { u(); } catch { /* one broken updater must not kill the pass */ }
    }
  }
  registerUpdater(fn: () => void): void { this.updaters.push(fn); }
  saveLayout(): void { this.ctx.save(); }
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
  renderLabel(head: HTMLElement, ctx: EntryRenderCtx): void {
    const { entry } = ctx;
    if (entry.hideLabel) return;
    const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.style.fontSize = entry.labelSize + "px";
    if (entry.labelColor) span.style.color = entry.labelColor as string;
    span.setText((entry.alias as string) || this.defaultLabelFor(entry));
    span.addClass("ep-clickname");
    if (entry.kind === "prop" && entry.showType !== false) {
      const def = this.registries.valueTypes.get(this.resolveType(entry));
      span.createSpan({ cls: "ep-type-hint", text: def ? def.name(this.i18n) : this.resolveType(entry) });
    }
  }
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
        setColorSpace: (sp) => { this.settings.defaults.colorSpace = sp; this.ctx.save(); },
      },
      initial,
      onPick
    ).open();
  }
  highlight(): void { /* no sidebar to highlight into */ }
  openEntryOptions(section: Section, entry: Entry): void {
    new EntryOptionsModal(this, section, entry, this.target).open();
  }

  // -- structural ops (a single inline card has no layout) --------------------
  renameKey(entry: Entry, newKey: string): void {
    entry.key = newKey;
    delete entry.dataType;
    this.ctx.save();
  }
  removeEntry(): void { /* inline cards never delete layout entries */ }
  openAddMenu(): void {}
  openListValuePicker(): void {}
  scrollToSection(): void {}
  propCandidates(): { key: string; onNote: boolean }[] {
    return Object.keys(this.note.raw).map((key) => ({ key, onNote: true }));
  }
}

/**
 * Build a `vals:` element: the property `body` (a key, short form, or
 * `[[note]].key`) rendered as a sidebar-style card. Falls back to the plain
 * `val:` chip on any error. `onEditSource` adds an "Edit source" menu item
 * (Live Preview) to reveal the raw text.
 */
export function makeValsEl(ctx: InlineCtx, file: TFile, body: string, onEditSource?: () => void): HTMLElement {
  // The root is the card itself — a single inline-block element. Nesting a
  // block <div> inside an inline <span> widget collapses to zero size in the
  // mobile editor (chips are span-only, which is why they survived); a div
  // with an explicit inline-block display renders inline on both platforms.
  const wrap = createDiv({ cls: "ep-inline-vals" });
  wrap.style.display = "inline-block";
  wrap.style.verticalAlign = "middle";
  const t = ctx.i18n.t.bind(ctx.i18n);

  const draw = (): void => {
    wrap.empty();

    // Resolve the target file (cross-note), property key, entry and section.
    // Only this stage failing falls back to the plain `val:` chip.
    let view: InlineViewCtx;
    let target: TFile;
    let entry: Entry;
    let section: Section;
    try {
      const noteRef = parseNoteRef(body);
      target = file;
      let ref = body;
      if (noteRef && noteRef.accessor) {
        const lf = ctx.app.metadataCache.getFirstLinkpathDest(noteRef.link, file.path);
        if (!lf) throw new Error("unresolved note link");
        target = lf;
        ref = noteRef.accessor;
      }
      const layout = layoutForFile(ctx, target);
      view = new InlineViewCtx(ctx, target, layout, wrap, draw);
      const key = keyForShortForm(ctx.settings, ref, Object.keys(view.note.raw)) ?? ref;
      // Prefer the real layout entry (stays in sync with the sidebar); else a
      // persistent per-reference entry so the card can carry sliders/rolls.
      const inLayout = layout ? findPropEntry(layout, key) : null;
      if (inLayout) {
        section = inLayout.section;
        entry = inLayout.entry;
      } else {
        const id = (noteRef ? noteRef.link.toLowerCase() + "/" : "") + key.toLowerCase();
        const store = (ctx.settings.inlineEntries ??= {});
        entry = store[id] ?? (store[id] = { id: "ep-inline:" + id, kind: "prop", key });
        if (!entry.key) entry.key = key;
        section = { id: "ep-inline", title: "", columns: 1, layoutMode: "list", entries: [entry] };
      }
    } catch {
      wrap.appendChild(makeValEl(ctx, file, body, onEditSource));
      return;
    }

    // Card shell + icon. The card class lives on the root so there is no extra
    // block wrapper between the inline-block root and its content.
    const def = view.registries.valueTypes.get(view.resolveType(entry)) ?? view.registries.valueTypes.get("text");
    const wide = entry.kind === "prop" && !!def?.wide;
    wrap.addClass("ep-entry");
    wrap.toggleClass("ep-entry-block", wide);
    const head = wrap.createDiv({ cls: "ep-entry-head" });
    if (entry.icon) {
      const ic = head.createSpan({ cls: "ep-picon" });
      setIcon(ic, entry.icon as string);
      if (entry.iconColor) ic.style.color = entry.iconColor as string;
    }
    const extra = wrap.createDiv({ cls: "ep-entry-extra" });

    // Label always renders (outside the value try) so the card appears even if
    // a value type or addon throws on a given platform; the value UI is its own
    // try, degrading to the plain stored value rather than dropping the card.
    const flags = emptyFlags();
    mergeNeeds(flags, def?.clusterNeeds?.({ view, file: target, section, entry }));
    const ectx: EntryRenderCtx = { view, file: target, section, entry, head, extra, flags, wrap };
    view.renderLabel(head, ectx);
    try {
      def?.render(ectx);
    } catch (e) {
      console.error("extended-properties: vals value render failed", e);
      const v = ctx.facade.get(target, entry.key as string);
      head
        .createDiv({ cls: "ep-val-right" })
        .setText(v === undefined || v === null || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : String(v));
    }

    // Context menu: configure (options modal), clear value, value-type items,
    // and Edit source — but none of the sidebar's structural (grid) actions.
    wrap.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const menu = new Menu();
      const name = (entry.alias as string) || view.defaultLabelFor(entry);
      menu.addItem((i) =>
        i.setTitle(t("entry.menu.configure", { name })).setIcon("settings").onClick(() =>
          view.openEntryOptions(section, entry)
        )
      );
      if (entry.kind === "prop" && entry.key) {
        const key2 = entry.key as string;
        menu.addSeparator();
        menu.addItem((i) =>
          i.setTitle(t("entry.menu.clearValue", { key: key2 })).setIcon("eraser").onClick(() =>
            view.note.set(target, key2, undefined)
          )
        );
        view.registries.valueTypes
          .get(view.resolveType(entry))
          ?.menuItems?.(menu, { view, file: target, section, entry }, { x: ev.clientX, y: ev.clientY });
      }
      if (onEditSource) {
        menu.addSeparator();
        menu.addItem((i) => i.setTitle(t("inline.editSource")).setIcon("code").onClick(onEditSource));
      }
      menu.showAtMouseEvent(ev);
    });
  };

  draw();
  return wrap;
}
